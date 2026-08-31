/* ============================================================
   Shell, router, and the single delegated action handler.
   ============================================================ */

function applyRail(){
  document.body.classList.toggle('rail-hidden', !!DB.settings.railHidden);
}
function applyTheme(t){
  if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
  else document.documentElement.removeAttribute('data-theme');
}

/* ---------------- shell ---------------- */
function renderRail(){
  var left = DB.kids.reduce(function(a, k){
    var d = dayProgress(k.id, state.cursor); return a + (d.total - d.done);
  }, 0);
  var pending = DB.redemptions.filter(function(r){ return r.status === 'pending'; }).length;

  return '<div class="brand-mark">H</div>' +
    NAV_ORDER.map(function(k){
      var v = VIEWS[k];
      var pip = k === 'routine' && left ? '<span class="pip">' + left + '</span>'
              : k === 'rewards' && pending ? '<span class="pip gold">' + pending + '</span>' : '';
      return '<a class="rail-item' + (state.view === k ? ' active' : '') + '" href="#/' + k + '">' +
             icon(v.icon) + '<span>' + v.label + '</span>' + pip + '</a>';
    }).join('');
}

function renderTopbar(){
  var v = VIEWS[state.view];
  return '<div class="topbar-row">' +
      '<div class="grow"><div class="page-title">' + v.title +
        (v.live ? '' : ' <span class="badge badge-mock">mockup</span>') + '</div>' +
        (v.sub ? '<div class="page-sub">' + v.sub + '</div>' : '') + '</div>' +
      '<button class="btn btn-ghost btn-icon hide-sm" data-action="toggle-rail" ' +
        'aria-label="' + (DB.settings.railHidden ? 'Show menu' : 'Hide menu') + '" ' +
        'title="' + (DB.settings.railHidden ? 'Show the menu' : 'Hide the menu for a wider board') + '">' +
        icon(DB.settings.railHidden ? 'cright' : 'menu') + '</button>' +
      '<button class="btn btn-ghost btn-icon" data-action="theme-cycle" aria-label="Theme" data-tour="theme">' +
        icon(DB.settings.theme === 'dark' ? 'moon' : 'sun') + '</button>' +
      '<button class="btn btn-ghost btn-icon" data-action="tour" aria-label="Help" data-tour="help">' +
        icon('help') + '</button>' +
      (state.view === 'calendar'
        ? '<button class="btn btn-primary" data-action="new-event">' + icon('plus', 'i-sm') + '<span class="hide-sm">Event</span></button>'
        : '<button class="btn btn-primary" data-action="manage-tasks">' + icon('plus', 'i-sm') + '<span class="hide-sm">Task</span></button>') +
    '</div>' +
    '<div class="familybar" data-tour="family">' +
      '<button class="chip' + (!state.filter.length ? ' on' : '') + '" data-action="filter-all">👨‍👩‍👧 Everyone</button>' +
      DB.kids.map(function(k){
        return '<button class="chip ' + k.color + (state.filter.indexOf(k.id) > -1 ? ' on tint' : '') +
               '" data-action="filter:' + k.id + '">' + k.emoji + ' ' + esc(k.name) + '</button>';
      }).join('') +
    '</div>';
}

function render(){
  $('#rail').innerHTML = renderRail();
  $('#topbar').innerHTML = renderTopbar();
  $('#content').innerHTML = VIEWS[state.view].render();
  var active = $('#rail .rail-item.active');
  if (active && active.scrollIntoView) active.scrollIntoView({ block:'nearest', inline:'center' });
  if (Tour.active) Tour.place();
}

function go(key){
  if (!VIEWS[key]) key = 'routine';
  location.hash = '#/' + key;
}
function routeFromHash(){
  var k = (location.hash || '').replace('#/', '').trim();
  state.view = VIEWS[k] ? k : 'routine';
  render();
  window.scrollTo(0, 0);
}

/* refresh an open "manage tasks" list if there is one */
function refreshManager(){
  var open = _modalStack[_modalStack.length - 1];
  if (open && open.redraw) open.redraw();
}

/* ---------------- actions ---------------- */
function handleAction(action){
  var p = action.split(':');
  var cmd = p[0], arg = p[1], arg2 = p[2];

  switch (cmd){
    case 'noop': return;
    case 'nav': go(arg); return;

    case 'filter-all': state.filter = []; render(); return;
    case 'filter': {
      var at = state.filter.indexOf(arg);
      if (at > -1) state.filter.splice(at, 1); else state.filter.push(arg);
      render(); return;
    }

    case 'theme-cycle': {
      var order = ['auto', 'light', 'dark'];
      var next = order[(order.indexOf(DB.settings.theme) + 1) % 3];
      setSetting('theme', next); applyTheme(next); render(); return;
    }
    case 'theme': setSetting('theme', arg); applyTheme(arg); render(); return;

    case 'tour': {
      var t = TOURS[state.view];
      if (t) Tour.start(t); else toast('No tour for this screen yet');
      return;
    }
    case 'tour-start': closeTopModal(); go('routine'); setTimeout(function(){ Tour.start(TOURS.routine); }, 150); return;
    case 'never-mind': closeTopModal(); toast('Press ? on any screen for a tour'); return;

    /* ---- routine board ---- */
    case 'slot': state.slot = arg; render(); return;
    case 'day-prev': state.cursor = addDays(state.cursor, -1); render(); return;
    case 'day-next': state.cursor = addDays(state.cursor, 1); render(); return;
    case 'day-today': state.cursor = TODAY; render(); return;
    case 'task': {
      var kidId = arg, taskId = arg2, dt = state.cursor;
      var kd = kid(kidId);
      var L = (kd && kd.lang) || 'en';
      var wasComplete = slotComplete(kidId, dt, state.slot);
      var wasDay = dayProgress(kidId, dt);
      var nowDone = toggleTask(kidId, taskId, dt);
      var def = taskById(taskId);
      /* fire the effect against the live node before the re-render replaces it */
      FX.tick($('[data-action="task:' + kidId + ':' + taskId + '"]'), nowDone);
      render();
      if (nowDone && def){
        toast(t('toastStars', L, { name:kname(kidId), n:def.stars }), 'gold', '⭐');
        var nowDay = dayProgress(kidId, dt);
        if (nowDay.total > 0 && nowDay.done === nowDay.total && wasDay.done !== wasDay.total){
          setTimeout(function(){
            FX.dayDone();
            toast(kname(kidId) + ': ' + t('allDone', L), 'gold', '🎉');
          }, 420);
        } else if (!wasComplete && slotComplete(kidId, dt, state.slot)){
          setTimeout(function(){
            FX.slotDone();
            toast(t('toastSlot', L, { name:kname(kidId), slot:t('slot_' + state.slot, L), b:DB.settings.slotBonus }), 'gold', '🏅');
          }, 420);
        }
      }
      return;
    }
    case 'kid-lang': langPickerModal(arg); return;
    case 'set-lang': {
      updateKid(arg, { lang: arg2 });
      closeTopModal(); render();
      toast(kname(arg) + ' → ' + langOf(arg2).name, 'ok', langOf(arg2).flag);
      return;
    }

    /* ---- task CRUD ---- */
    case 'manage-tasks': manageTasksModal(); return;
    case 'task-new': taskEditModal(null); return;
    case 'task-edit': taskEditModal(arg); return;
    case 'task-del': {
      var td = taskById(arg);
      if (td && confirm('Delete "' + td.title + '"? Ticks for it are removed too.')){
        removeTask(arg);
        closeTopModal();
        render(); refreshManager();
        toast('Task deleted', 'warn');
      }
      return;
    }

    /* ---- calendar ---- */
    case 'cal-prev':
      state.cursor = state.calMode === 'month' ? new Date(state.cursor.getFullYear(), state.cursor.getMonth() - 1, 1)
                   : addDays(state.cursor, state.calMode === 'day' ? -1 : -7);
      render(); return;
    case 'cal-next':
      state.cursor = state.calMode === 'month' ? new Date(state.cursor.getFullYear(), state.cursor.getMonth() + 1, 1)
                   : addDays(state.cursor, state.calMode === 'day' ? 1 : 7);
      render(); return;
    case 'cal-today': state.cursor = TODAY; render(); return;
    case 'cal-mode': state.calMode = arg; render(); return;
    case 'goday': {
      var parts = arg.split('-');
      state.cursor = new Date(+parts[0], +parts[1] - 1, +parts[2]);
      state.calMode = 'day'; render(); return;
    }
    case 'event': eventModal(action.slice(6)); return;
    case 'new-event': eventEditModal(null); return;
    case 'ev-edit': closeTopModal(); eventEditModal(arg); return;
    case 'toggle-ev': {
      var evKey = action.slice(10);
      var on = toggleEventDone(evKey);
      FX.tick($('[data-action="toggle-ev:' + evKey + '"]'), on);
      closeTopModal(); render();
      toast(on ? 'Marked done' : 'Marked not done', on ? 'ok' : '');
      return;
    }
    case 'ev-bump': {
      var key = action.slice(8);
      var ev = EV_INDEX[key];
      if (ev){
        var tomorrow = addDays(ev.date, 1);
        if (ev.recurring) skipOccurrence(ev.id, ev.date);
        else updateEvent(ev.id, { date: ymd(tomorrow) });
        if (ev.recurring)
          addEvent({ title:ev.title, sk:ev.sk, kids:ev.kids, start:ev.start, dur:ev.dur, date:ymd(tomorrow), days:null });
        closeTopModal(); render();
        toast(ev.title + ' moved to ' + fmtShort(tomorrow), 'ok', '➡️');
      }
      return;
    }
    case 'ev-delete': closeTopModal(); eventDeleteModal(action.slice(10)); return;
    case 'ev-delete-series': {
      var e3 = eventById(arg);
      if (!e3) return;
      closeTopModal();
      /* reuse the full chooser by faking an occurrence on the cursor date */
      var occ = eventsOn(state.cursor, true).filter(function(x){ return x.id === arg; })[0];
      if (occ){ EV_INDEX[occ.key] = occ; eventDeleteModal(occ.key); }
      else if (confirm('Delete "' + e3.title + '" and every occurrence?')){
        removeEvent(arg); render(); toast('Event deleted', 'warn');
      }
      return;
    }
    case 'del-occurrence': {
      var occKey = action.slice(15);
      var evO = EV_INDEX[occKey];
      if (evO){
        skipOccurrence(evO.id, evO.date);
        closeTopModal(); render();
        toast('Removed on ' + fmtShort(evO.date) + ' only', 'warn', '1️⃣');
      }
      return;
    }
    case 'del-future': {
      var futKey = action.slice(11);
      var evF = EV_INDEX[futKey];
      if (evF){
        endSeriesBefore(evF.id, evF.date);
        closeTopModal(); render();
        toast('Series ends before ' + fmtShort(evF.date), 'warn', '⏭️');
      }
      return;
    }
    case 'del-series': {
      var evS = eventById(arg);
      if (evS){
        removeEvent(arg);
        closeTopModal(); render();
        toast('"' + evS.title + '" deleted everywhere', 'warn', '🗑️');
      }
      return;
    }

    /* ---- kids ---- */
    case 'add-kid': kidEditModal(null); return;
    case 'edit-kid': closeDrawer(); kidEditModal(arg); return;
    case 'kid-del': {
      var kd = kid(arg);
      if (kd && confirm('Remove ' + kd.name + '?\n\nTheir tasks, stars and calendar entries go too. This cannot be undone.')){
        removeKid(arg);
        state.filter = state.filter.filter(function(x){ return x !== arg; });
        closeTopModal(); closeDrawer(); render();
        toast(kd.name + ' removed', 'warn');
      }
      return;
    }
    case 'kid-open': kidDrawer(arg); return;
    case 'kid-tab': kidDrawer(arg, arg2); return;
    case 'kid-mode': closeDrawer(); closeTopModal(); kidMode(arg); return;

    /* ---- rewards ---- */
    case 'redeem': closeTopModal(); redeemModal(arg); return;
    case 'spend': spendModal(arg); return;
    case 'add-reward': rewardEditModal(null); return;
    case 'edit-reward': rewardEditModal(arg); return;
    case 'reward-del': {
      var rw = rewardById(arg);
      if (rw && confirm('Delete "' + rw.name + '" from the store?')){
        removeReward(arg); closeTopModal(); render(); toast('Reward deleted', 'warn');
      }
      return;
    }
    case 'approve': setRedemptionStatus(arg, 'approved'); render(); toast('Approved', 'gold', '✅'); return;
    case 'deny': setRedemptionStatus(arg, 'denied'); render(); toast('Denied - stars refunded', 'warn'); return;

    /* ---- settings ---- */
    case 'toggle-set':
      setSetting(arg, !DB.settings[arg]);
      render();
      if (arg === 'sound' && DB.settings.sound) FX.chime();
      toast(DB.settings[arg] ? 'Turned on' : 'Turned off', 'ok');
      return;
    case 'test-fx':
      FX.dayDone();
      setTimeout(function(){ toast('Audio engine: ' + FX.status(), FX.status() === 'running' ? 'ok' : 'warn'); }, 260);
      return;
    case 'toggle-rail':
      setSetting('railHidden', !DB.settings.railHidden);
      applyRail(); render();
      return;
    case 'school-day': {
      var i = +arg;
      var days = DB.settings.schoolDays.slice();
      var at2 = days.indexOf(i);
      if (at2 > -1) days.splice(at2, 1); else days.push(i);
      days.sort(function(a, b){ return a - b; });
      setSetting('schoolDays', days); render(); return;
    }
    case 'tips-toggle':
      setSetting('showTips', !DB.settings.showTips);
      if (DB.settings.showTips) setSetting('tipsOff', []);
      render(); return;
    case 'tip-off': {
      var off = DB.settings.tipsOff.slice();
      if (off.indexOf(arg) === -1) off.push(arg);
      setSetting('tipsOff', off); render(); return;
    }
    case 'export-data': exportModal(); return;
    case 'import-data': importModal(); return;
    case 'reset-demo':
      if (confirm('Reset everything back to the sample family?\n\nYour children, tasks, events and stars will be replaced.')){
        resetDB(); applyTheme(DB.settings.theme); render();
        toast('Back to the sample data', 'ok', '🔄');
      }
      return;

    /* ---- mockup-only ---- */
    case 'progress-kid': state.progressKid = arg; render(); return;
  }
}

/* ---------------- wiring ---------------- */
document.addEventListener('click', function(e){
  var el = e.target.closest('[data-action]');
  if (!el || el.disabled) return;
  if (el.tagName === 'SELECT' || el.tagName === 'INPUT') return;
  e.preventDefault();
  handleAction(el.getAttribute('data-action'));
});

/* settings text/number inputs write straight through */
document.addEventListener('change', function(e){
  var el = e.target.closest('[data-set]');
  if (!el) return;
  var key = el.getAttribute('data-set');
  var val = el.type === 'number' ? Math.max(0, +el.value || 0) : el.value;
  setSetting(key, val);
  toast('Saved', 'ok');
  if (key === 'slotBonus' || key === 'carryOver') render();
});

window.addEventListener('hashchange', routeFromHash);

/* ---------------- boot ---------------- */
(function init(){
  applyTheme(DB.settings.theme);
  applyRail();
  if (!location.hash) location.hash = '#/routine';
  routeFromHash();
  if (!DB.settings.seenWelcome){
    setSetting('seenWelcome', true);
    setTimeout(welcomeModal, 400);
  }
})();
