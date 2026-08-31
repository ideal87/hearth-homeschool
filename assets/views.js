/* ============================================================
   Screens.
   LIVE (persisted to the browser): Routine, Rewards, Calendar,
   Kids, and the matching parts of Settings.
   MOCKUP (static, watermarked): Today, Lessons, Progress, Records.
   ============================================================ */

var EV_INDEX = {};

function mockBanner(what){
  return '<div class="mock-banner">' +
    '<span style="font-size:22px;line-height:1">🚧</span>' +
    '<div class="grow"><b>Static mockup - this screen is not wired up.</b><br>' +
    what + ' The live, browser-backed screens are <b>Routine</b>, <b>Rewards</b>, ' +
    '<b>Calendar</b> and <b>Kids</b> - anything you change there is saved in this browser.</div>' +
  '</div>';
}
function liveDot(){ return '<span class="live-dot">● Saved in this browser</span>'; }

/* ------------------------------------------------------------------ */
/* progress ring                                                        */
/* ------------------------------------------------------------------ */
function progressRing(done, total){
  var r = 26, c = 2 * Math.PI * r;
  var frac = total ? done / total : 0;
  return '<span class="ringwrap">' +
    '<svg class="ring" viewBox="0 0 62 62" aria-hidden="true">' +
      '<circle class="rbg" cx="31" cy="31" r="' + r + '"></circle>' +
      '<circle class="rfg" cx="31" cy="31" r="' + r + '" stroke-dasharray="' +
        (frac * c).toFixed(1) + ' ' + c.toFixed(1) + '"></circle>' +
    '</svg>' +
    '<span class="rlabel">' + Math.round(frac * 100) + '%</span>' +
  '</span>';
}

/* ------------------------------------------------------------------ */
/* VIEW: Routine & chores  (LIVE - the main screen)                    */
/* ------------------------------------------------------------------ */
function taskRow(k, task, dt, L){
  var done = isTaskDone(k.id, task.id, dt);
  return '<button class="task ' + k.color + (done ? ' done' : '') +
    '" data-action="task:' + k.id + ':' + task.id + '">' +
    '<span class="task-emoji">' + task.emoji + '</span>' +
    '<span class="grow"><span class="task-title">' + esc(itemTitle(task, L)) + '</span></span>' +
    starPill(task.stars) + checkCircle() +
  '</button>';
}
function eventRow(k, ev, L){
  var s = subj(ev.sk);
  var done = isEventDone(ev.key);
  EV_INDEX[ev.key] = ev;
  return '<button class="evrow ' + s.cls + (done ? ' done' : '') +
    '" data-action="toggle-ev:' + ev.key + '">' +
    '<span class="task-emoji">' + s.emoji + '</span>' +
    '<span class="grow"><span class="evt">' + esc(itemTitle(ev, L)) + '</span></span>' +
    '<span class="when">' + timeLabel(ev.start) + '</span>' +
    checkCircle() +
  '</button>';
}

function kidColumn(k, dt){
  var slot = state.slot;
  var L = k.lang || 'en';                       /* this child reads in their own language */
  var tasks = tasksFor(k.id, dt, slot);
  var routines = tasks.filter(function(t){ return t.kind === 'routine'; });
  var chores   = tasks.filter(function(t){ return t.kind === 'chore'; });

  /* today's scheduled lessons for this child, in this part of the day */
  var evs = eventsOn(dt, true).filter(function(e){
    return e.kids.indexOf(k.id) > -1 && slotForMinutes(e.start) === slot;
  });

  var prog = slotProgress(k.id, dt, slot);
  var day = dayProgress(k.id, dt);
  var done = slotComplete(k.id, dt, slot);
  var allDone = day.total > 0 && day.done === day.total;
  var slotName = t('slot_' + slot, L);

  return '<section class="kidcol ' + k.color + '" lang="' + L + '">' +
    '<div class="kidcol-head">' +
      progressRing(day.done, day.total) +
      '<div class="grow"><div class="kidcol-name">' + esc(k.name) + '</div>' +
        '<div class="row wrap" style="gap:6px;margin-top:5px">' +
          '<span class="streakchip">🔥 ' + (k.streak || 0) + '</span>' +
          starPill(starBank(k.id)) +
          '<button class="langchip" data-action="kid-lang:' + k.id + '" ' +
            'aria-label="' + t('language', L) + '">' + langOf(L).flag + ' ' + L.toUpperCase() + '</button>' +
        '</div>' +
      '</div>' +
      '<span style="font-size:34px;line-height:1">' + k.emoji + '</span>' +
    '</div>' +

    '<div class="slotbar">' + SLOTS.map(function(s){
      var p = slotProgress(k.id, dt, s.id);
      var full = p.total > 0 && p.done === p.total;
      return '<button class="slotbtn' + (slot === s.id ? ' on' : '') + (full ? ' full' : '') +
             '" data-action="slot:' + s.id + '" aria-label="' + t('slot_' + s.id, L) + '">' +
             '<span>' + (full && slot !== s.id ? '✅' : s.emoji) + '</span>' +
             '<small>' + p.done + '/' + p.total + '</small></button>';
    }).join('') + '</div>' +

    (routines.length
      ? '<div class="slotlabel">' + slotOf(slot).emoji + ' ' + t('routine_' + slot, L) +
        '<span class="ct">' + routines.filter(function(t2){ return isTaskDone(k.id, t2.id, dt); }).length +
        '/' + routines.length + '</span></div>' +
        '<div class="tasklist">' + routines.map(function(t2){ return taskRow(k, t2, dt, L); }).join('') + '</div>'
      : '') +

    (chores.length
      ? '<div class="slotlabel">🧹 ' + t('chores', L) + '<span class="ct">' +
        chores.filter(function(t2){ return isTaskDone(k.id, t2.id, dt); }).length + '/' + chores.length + '</span></div>' +
        '<div class="tasklist">' + chores.map(function(t2){ return taskRow(k, t2, dt, L); }).join('') + '</div>'
      : '') +

    (evs.length
      ? '<div class="slotlabel">📅 ' + t('todaysLessons', L) + '<span class="ct">' + evs.length + '</span></div>' +
        '<div class="tasklist">' + evs.map(function(e){ return eventRow(k, e, L); }).join('') + '</div>'
      : '') +

    (!tasks.length && !evs.length
      ? '<div class="emptyslot">' + t('nothingFor', L, { slot:slotName }) + '<br>' +
        t('addTaskHint', L) + '</div>' : '') +

    (allDone
      ? '<div class="celebrate"><span class="em">🎉</span>' +
        '<div class="ct">' + t('allDone', L) + '</div>' +
        '<div class="tiny" style="margin-top:4px;color:var(--gold-ink)">' +
          t('starsEarned', L, { n:starsOn(k.id, dt) }) + '</div></div>'
      : '') +

    '<div class="kidcol-foot">' +
      '<span>' + t('starsEarnedToday', L, { n:starsOn(k.id, dt) }) + '</span>' +
      '<span>' + t('doneCount', L, { d:day.done, t:day.total }) + '</span>' +
    '</div>' +
  '</section>';
}

function routineView(){
  var dt = state.cursor;
  var kids = visibleKids();
  var L = boardLang();          /* filter to one child and the whole page follows them */
  var totalStars = DB.kids.reduce(function(a, k){ return a + starsOn(k.id, dt); }, 0);
  var isToday = sameDay(dt, TODAY);

  return tipBanner('t-routine', t('tipTitle', L), t('tipBody', L)) +

    '<div class="cal-toolbar" lang="' + L + '">' +
      '<button class="btn btn-icon" data-action="day-prev" aria-label="&larr;">' + icon('cleft') + '</button>' +
      '<button class="btn" data-action="day-today">' + (isToday ? t('today', L) : t('backToToday', L)) + '</button>' +
      '<button class="btn btn-icon" data-action="day-next" aria-label="&rarr;">' + icon('cright') + '</button>' +
      '<div class="cal-date">' + fmtLongLoc(dt, L) + '</div>' +
      '<div class="grow"></div>' +
      '<div class="seg big">' + SLOTS.map(function(s){
        return '<button class="' + (state.slot === s.id ? 'on' : '') + '" data-action="slot:' + s.id + '">' +
               s.emoji + ' <span class="hide-sm">' + t('slot_' + s.id, L) + '</span></button>'; }).join('') + '</div>' +
      '<button class="btn btn-icon" data-action="toggle-set:sound" aria-label="Sound" ' +
        'title="Sound ' + (DB.settings.sound ? 'on' : 'off') + '">' + (DB.settings.sound ? '🔊' : '🔇') + '</button>' +
      '<button class="btn btn-gold" data-action="nav:rewards">⭐ ' +
        t('starsToday', L, { n:totalStars }) + '</button>' +
      '<button class="btn" data-action="manage-tasks">' + icon('edit', 'i-sm') +
        '<span class="hide-sm">' + t('manage', L) + '</span></button>' +
    '</div>' +

    (kids.length
      ? '<div class="board" style="--n:' + kids.length + '">' +
        kids.map(function(k){ return kidColumn(k, dt); }).join('') + '</div>'
      : '<div class="card"><div class="card-body faint">No children match this filter.</div></div>');
}

/* ------------------------------------------------------------------ */
/* VIEW: Rewards  (LIVE)                                               */
/* ------------------------------------------------------------------ */
function rewardsView(){
  var kids = visibleKids();
  var pending = DB.redemptions.filter(function(r){ return r.status === 'pending'; });

  var banks = '<div class="grid-3" style="margin-bottom:20px">' + kids.map(function(k){
    var bank = starBank(k.id);
    var next = DB.rewards.slice().sort(function(a, b){ return a.cost - b.cost; })
                 .filter(function(r){ return r.cost > bank; })[0];
    return '<div class="bankcard ' + k.color + '">' +
      '<div class="row" style="margin-bottom:14px"><span style="font-size:34px">' + k.emoji + '</span>' +
        '<div class="grow"><div class="bold lg">' + esc(k.name) + '</div>' +
        '<div class="tiny" style="color:var(--c)">🔥 ' + (k.streak || 0) + '-day streak</div></div></div>' +
      '<div class="bignum">' + bank + ' ⭐</div>' +
      '<div class="sm" style="color:var(--c);margin:12px 0 7px;font-weight:700">' +
        (next ? (next.cost - bank) + ' more for ' + esc(next.name) : 'Everything in the store is unlocked!') + '</div>' +
      progressBar(bank, next ? next.cost : bank || 1, 'tint') +
      '<button class="btn btn-block btn-sm" style="margin-top:14px" data-action="spend:' + k.id + '">Spend stars</button>' +
    '</div>';
  }).join('') + '</div>';

  var approvals = pending.length
    ? '<section class="card" style="margin-bottom:20px">' +
        '<div class="card-head"><div class="card-title">✋ Waiting for you</div>' +
          '<span class="badge badge-warn">' + pending.length + '</span></div>' +
        '<div class="list">' + pending.map(function(r){
          var k = kid(r.kid);
          return '<div class="li ' + (k ? k.color : 'k0') + '">' +
            '<span style="font-size:26px">' + r.emoji + '</span>' +
            '<div class="grow"><div class="bold">' + esc(r.name) + '</div>' +
            '<div class="tiny faint">' + kname(r.kid) + ' asked for this</div></div>' +
            starPill(r.cost) +
            '<button class="btn btn-sm btn-ghost" data-action="deny:' + r.id + '">Deny</button>' +
            '<button class="btn btn-sm btn-primary" data-action="approve:' + r.id + '">Approve</button>' +
          '</div>';
        }).join('') + '</div>' +
      '</section>'
    : '';

  var store = '<section class="card" style="margin-bottom:20px">' +
    '<div class="card-head"><div class="card-title">🏪 Reward store</div>' +
      '<div class="row">' + liveDot() +
      '<button class="btn btn-sm" data-action="add-reward">' + icon('plus', 'i-sm') + 'Add</button></div></div>' +
    '<div class="card-body"><div class="grid-3">' + DB.rewards.map(function(r){
      var best = DB.kids.length ? Math.max.apply(null, DB.kids.map(function(k){ return starBank(k.id); })) : 0;
      var locked = best < r.cost;
      return '<div class="rewardcard' + (locked ? ' locked' : '') + '">' +
        '<span class="em">' + r.emoji + '</span>' +
        '<div class="bold">' + esc(r.name) + '</div>' +
        '<div class="tiny faint">' + esc(r.note || '') + '</div>' +
        starPill(r.cost, true) +
        '<div class="row" style="width:100%">' +
          '<button class="btn btn-sm grow ' + (locked ? '' : 'btn-gold') + '" data-action="redeem:' + r.id + '"' +
            (locked ? ' disabled' : '') + '>' + (locked ? 'Not yet' : 'Cash in') + '</button>' +
          '<button class="btn btn-sm btn-icon" data-action="edit-reward:' + r.id + '" aria-label="Edit">' +
            icon('edit', 'i-sm') + '</button>' +
        '</div>' +
      '</div>';
    }).join('') + '</div></div>' +
  '</section>';

  var history = DB.redemptions.filter(function(r){ return r.status !== 'pending'; });

  return tipBanner('t-rewards',
      'Stars in, rewards out',
      'Every routine step and chore is worth the stars you set on it. Banks are worked out from the ' +
      'ticks on the routine board, so they can never drift apart. Star values and reward prices are ' +
      'yours to set in Settings.') +
    banks + approvals + store +

    '<div class="grid-2col">' +
      '<section class="card"><div class="card-head"><div class="card-title">🏅 Badges</div></div>' +
        '<div class="card-body">' + kids.map(function(k){
          var bank = starBank(k.id), streak = k.streak || 0;
          var earned = [
            { emoji:'🔥', name:'5-day streak', got: streak >= 5 },
            { emoji:'🌅', name:'Early bird',   got: slotComplete(k.id, TODAY, 'morning') },
            { emoji:'🧹', name:'Chore champ',  got: bank >= 150 },
            { emoji:'⭐', name:'100 stars',    got: bank >= 100 },
            { emoji:'🏆', name:'Perfect day',  got: (function(){ var d = dayProgress(k.id, TODAY); return d.total > 0 && d.done === d.total; })() }
          ];
          return '<div style="margin-bottom:18px">' +
            '<div class="row ' + k.color + '" style="margin-bottom:10px"><span style="font-size:24px">' + k.emoji + '</span>' +
            '<span class="bold">' + esc(k.name) + '</span></div>' +
            '<div class="badgegrid">' + earned.map(function(b){
              return '<div class="badgetile ' + (b.got ? 'on' : 'off') + '">' +
                '<span class="em">' + b.emoji + '</span>' + b.name + '</div>'; }).join('') + '</div></div>';
        }).join('') + '</div>' +
      '</section>' +

      '<section class="card"><div class="card-head"><div class="card-title">🧾 Cashed in</div></div>' +
        '<div class="list">' + (history.length
          ? history.slice().reverse().map(function(r){
              var k = kid(r.kid);
              return '<div class="li ' + (k ? k.color : 'k0') + '"><span style="font-size:24px">' + r.emoji + '</span>' +
                '<div class="grow"><div class="sm bold">' + esc(r.name) + '</div>' +
                '<div class="tiny faint">' + kname(r.kid) + ' &middot; ' +
                (r.status === 'denied' ? 'denied' : 'approved') + '</div></div>' +
                (r.status === 'denied' ? '<span class="badge">refunded</span>' : starPill('-' + r.cost)) + '</div>';
            }).join('')
          : emptyRow('Nothing cashed in yet.')) + '</div>' +
        (DB.settings.parentApproves
          ? '<div class="card-foot tiny faint">Redemptions wait for your approval - change that in Settings.</div>'
          : '<div class="card-foot tiny faint">Redemptions are instant. Turn on approval in Settings.</div>') +
      '</section>' +
    '</div>';
}

/* ------------------------------------------------------------------ */
/* VIEW: Calendar  (LIVE - lessons and outings only, never routines)   */
/* ------------------------------------------------------------------ */
function calendarView(){
  EV_INDEX = {};
  var c = state.cursor, label, grid;

  if (state.calMode === 'month'){
    label = MON_FULL[c.getMonth()] + ' ' + c.getFullYear();
    grid = monthGrid(c);
  } else if (state.calMode === 'day'){
    label = fmtLong(c);
    grid = dayList(c);
  } else {
    var ws = startOfWeek(c);
    var days = DB.settings.schoolDays;
    label = fmtShort(addDays(ws, days[0])) + ' - ' + fmtShort(addDays(ws, days[days.length - 1]));
    grid = weekLanes(ws);
  }

  return tipBanner('t-cal',
      'Lessons and outings - not routines',
      'This calendar holds scheduled things: lessons, co-op, appointments. Daily routines and chores ' +
      'deliberately live on the <b>Routine</b> board instead, so the week does not fill up with "brush teeth". ' +
      'Today&rsquo;s entries do appear on each child&rsquo;s routine column.') +

    '<div class="cal-toolbar">' +
      '<button class="btn btn-icon" data-action="cal-prev" aria-label="Previous">' + icon('cleft') + '</button>' +
      '<button class="btn btn-icon" data-action="cal-next" aria-label="Next">' + icon('cright') + '</button>' +
      '<button class="btn" data-action="cal-today">Today</button>' +
      '<div class="cal-date">' + label + '</div>' +
      '<div class="grow"></div>' + liveDot() +
      '<div class="seg">' + ['day', 'week', 'month'].map(function(m){
        return '<button class="' + (state.calMode === m ? 'on' : '') + '" data-action="cal-mode:' + m + '">' +
               m.charAt(0).toUpperCase() + m.slice(1) + '</button>'; }).join('') + '</div>' +
      '<button class="btn btn-primary" data-action="new-event">' + icon('plus', 'i-sm') + '<span class="hide-sm">Event</span></button>' +
    '</div>' +
    '<div class="calwrap">' + grid + calLegend() + '</div>';
}

function weekLanes(ws){
  var days = DB.settings.schoolDays.slice().sort(function(a, b){ return a - b; });
  if (!days.length) days = [0, 1, 2, 3, 4];
  var cols = 'grid-template-columns:130px repeat(' + days.length + ',minmax(150px,1fr))';
  var out = '<div class="laneswrap"><div class="lanes" style="' + cols + '"><div class="lane-hd"></div>';
  days.forEach(function(dayIdx){
    var d = addDays(ws, dayIdx);
    out += '<div class="lane-hd' + (sameDay(d, TODAY) ? ' today' : '') + '">' +
           DAY_ABBR[dayIdx] + ' ' + d.getDate() + '</div>';
  });
  visibleKids().forEach(function(k){
    out += '<div class="lane-name ' + k.color + '"><span style="font-size:26px">' + k.emoji + '</span>' +
           '<div><div class="bold sm">' + esc(k.name) + '</div><div class="tiny faint">' + esc(k.grade) + '</div></div></div>';
    days.forEach(function(dayIdx){
      var d2 = addDays(ws, dayIdx);
      var evs = eventsOn(d2).filter(function(e){ return e.kids.indexOf(k.id) > -1; });
      out += '<div class="lane-cell">' + evs.map(function(e){
        EV_INDEX[e.key] = e;
        var s = subj(e.sk);
        return '<button class="pill ' + s.cls + (isEventDone(e.key) ? ' done' : '') +
          '" data-action="event:' + e.key + '">' +
          '<span class="pt">' + s.emoji + ' ' + esc(e.title) + '</span>' +
          '<span class="pm">' + timeLabel(e.start) + '</span></button>';
      }).join('') + '</div>';
    });
  });
  return out + '</div></div>';
}

function dayList(dt){
  var out = '';
  visibleKids().forEach(function(k){
    var evs = eventsOn(dt).filter(function(e){ return e.kids.indexOf(k.id) > -1; });
    out += '<div class="lane-name ' + k.color + '" style="border-bottom:0"><span style="font-size:26px">' + k.emoji + '</span>' +
           '<div class="grow"><div class="bold">' + esc(k.name) + '</div>' +
           '<div class="tiny faint">' + evs.length + ' scheduled</div></div></div>' +
           '<div class="list">' + (evs.length ? evs.map(function(e){
             EV_INDEX[e.key] = e;
             var s = subj(e.sk);
             return '<div class="li click ' + s.cls + '" data-action="event:' + e.key + '">' +
               '<span class="task-emoji">' + s.emoji + '</span>' +
               '<span class="li-time">' + timeLabel(e.start) + '</span>' +
               '<div class="grow bold">' + esc(e.title) + '</div>' +
               '<span class="tiny faint">' + durLabel(e.dur) + '</span></div>';
           }).join('') : emptyRow('Nothing scheduled.')) + '</div>';
  });
  return out || '<div class="card-body faint">No children match this filter.</div>';
}

function monthGrid(cursor){
  var first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  var gridStart = startOfWeek(first);
  var out = '<div class="cal-hd7">' + DAY_ABBR.map(function(d){ return '<div>' + d + '</div>'; }).join('') + '</div><div class="month">';
  for (var k = 0; k < 42; k++){
    var d = addDays(gridStart, k);
    if (k >= 35 && d.getMonth() !== cursor.getMonth()) break;
    var evs = eventsOn(d);
    out += '<button class="mcell' + (d.getMonth() !== cursor.getMonth() ? ' out' : '') +
           (sameDay(d, TODAY) ? ' today' : '') + '" data-action="goday:' + ymd(d) + '">' +
           '<span class="md">' + d.getDate() + '</span>' +
           evs.slice(0, 3).map(function(e){
             var s = subj(e.sk);
             return '<span class="mp ' + s.cls + '">' + s.emoji + ' ' + esc(e.title) + '</span>';
           }).join('') +
           (evs.length > 3 ? '<span class="more">+' + (evs.length - 3) + '</span>' : '') +
           '</button>';
  }
  return out + '</div>';
}
function calLegend(){
  return '<div class="legend">' + Object.keys(SUBJECTS).map(function(key){
    var s = SUBJECTS[key];
    return '<span class="row ' + s.cls + '"><span class="dot-c"></span>' + s.emoji + ' ' + s.name + '</span>';
  }).join('') + '</div>';
}

/* ------------------------------------------------------------------ */
/* VIEW: Kids  (LIVE)                                                  */
/* ------------------------------------------------------------------ */
function kidsView(){
  return tipBanner('t-kids',
      'One colour per child, everywhere',
      'Add, rename, recolour or remove a child and every other live screen follows. ' +
      'Children are stored in this browser only - nothing leaves the device.') +

    '<div class="row" style="margin-bottom:16px">' + liveDot() +
      '<span class="tiny faint">' + DB.kids.length + ' ' + (DB.kids.length === 1 ? 'child' : 'children') + '</span></div>' +

    '<div class="grid-3">' + DB.kids.map(function(k){
      var d = dayProgress(k.id, TODAY);
      var cs = coursesFor(k.id);
      return '<div class="card tint ' + k.color + '">' +
        '<div class="card-body">' +
          '<div class="row" style="margin-bottom:14px"><span style="font-size:42px;line-height:1">' + k.emoji + '</span>' +
            '<div class="grow"><div class="bold" style="font-size:21px">' + esc(k.name) + '</div>' +
            '<div class="sm muted">' + esc(k.grade) + (k.age ? ' &middot; age ' + k.age : '') + '</div></div>' +
            starPill(starBank(k.id), true) +
          '</div>' +
          '<div class="row-b sm bold" style="color:var(--c);margin-bottom:7px">' +
            '<span>Today&rsquo;s tasks</span><span>' + d.done + ' / ' + d.total + '</span></div>' +
          progressBar(d.done, d.total, 'tint', true) +
          '<div class="row wrap" style="margin-top:14px;gap:7px">' +
            SLOTS.map(function(s){
              var p = slotProgress(k.id, TODAY, s.id);
              return '<span class="tag ' + s.cls + '">' + s.emoji + ' ' + p.done + '/' + p.total + '</span>';
            }).join('') +
            (cs.length ? '<span class="tag">' + cs.length + ' subjects</span>' : '') +
          '</div>' +
          (k.likes ? '<div class="sm faint" style="margin-top:12px">Loves: ' + esc(k.likes) + '</div>' : '') +
        '</div>' +
        '<div class="card-foot row">' +
          '<button class="btn btn-sm grow" data-action="edit-kid:' + k.id + '">' + icon('edit', 'i-sm') + 'Edit</button>' +
          '<button class="btn btn-sm grow" data-action="kid-open:' + k.id + '">Profile</button>' +
          '<button class="btn btn-sm grow btn-primary" data-action="kid-mode:' + k.id + '">' + icon('eye', 'i-sm') + 'Their view</button>' +
        '</div>' +
      '</div>';
    }).join('') +
    '<button class="ph" style="min-height:250px" data-action="add-kid">' + icon('plus', 'i-lg') +
      '<div class="bold">Add a child</div>' +
      '<div class="tiny">Name, colour, and a sign-in animal</div></button>' +
    '</div>';
}

/* ------------------------------------------------------------------ */
/* VIEW: Settings  (config for the live screens + flagged mock parts)  */
/* ------------------------------------------------------------------ */
function settingRow(label, desc, control){
  return '<div class="li"><div class="grow"><div class="bold sm">' + label + '</div>' +
         '<div class="tiny faint">' + desc + '</div></div>' + control + '</div>';
}
function settingsView(){
  var s = DB.settings;
  return tipBanner('t-settings',
      'Everything here is saved in this browser',
      'Star values, school days and approval rules feed straight into the live screens. ' +
      'Cards marked <b>mockup</b> are not wired up.') +

    '<div class="grid-2col">' +
      '<div class="stack">' +
        '<section class="card"><div class="card-head"><div class="card-title">⭐ Stars &amp; rewards</div>' + liveDot() + '</div>' +
          '<div class="card-body">' +
            '<div class="f2">' +
              '<div class="field"><label>Default routine step</label>' +
                '<input class="inp" type="number" min="0" data-set="starRoutine" value="' + s.starRoutine + '"></div>' +
              '<div class="field"><label>Default chore</label>' +
                '<input class="inp" type="number" min="0" data-set="starChore" value="' + s.starChore + '"></div>' +
            '</div>' +
            '<div class="hint">These are the defaults for new tasks. Each task keeps its own value, ' +
            'editable from <b>Manage</b> on the board.</div>' +
          '</div>' +
          '<div class="list">' +
            settingRow('Parent approves redemptions',
              s.parentApproves ? 'Cashing in waits for you on the Rewards screen' : 'Cashing in happens straight away',
              sw(s.parentApproves, 'toggle-set:parentApproves')) +
            settingRow('Stars carry over',
              s.carryOver ? 'Banks keep building week to week' : 'Only stars earned since Monday count',
              sw(s.carryOver, 'toggle-set:carryOver')) +
          '</div></section>' +

        '<section class="card"><div class="card-head"><div class="card-title">🗓️ School week</div>' + liveDot() + '</div>' +
          '<div class="card-body">' +
            '<div class="field"><label>School name</label>' +
              '<input class="inp" data-set="schoolName" value="' + esc(s.schoolName) + '"></div>' +
            '<div class="field mb0"><label>Days the calendar shows</label><div class="row wrap">' +
              DAY_ABBR.map(function(d, i){
                return '<button class="chip' + (s.schoolDays.indexOf(i) > -1 ? ' on' : '') +
                       '" data-action="school-day:' + i + '">' + d + '</button>'; }).join('') +
            '</div><div class="hint">Controls the columns in the calendar week view.</div></div>' +
          '</div></section>' +

        '<section class="card"><div class="card-head"><div class="card-title">💾 Your data</div>' + liveDot() + '</div>' +
          '<div class="list">' +
            settingRow('Where it lives', 'This browser only (localStorage). Nothing is uploaded.',
              '<span class="badge badge-ok">local</span>') +
            settingRow('Back it up', 'Copy a JSON snapshot you can paste back later',
              '<button class="btn btn-sm" data-action="export-data">Export</button>') +
            settingRow('Restore a backup', 'Paste a snapshot to replace everything',
              '<button class="btn btn-sm" data-action="import-data">Import</button>') +
            settingRow('Start over', 'Clears your children, tasks, events and stars',
              '<button class="btn btn-sm btn-danger" data-action="reset-demo">Reset</button>') +
          '</div></section>' +
      '</div>' +

      '<div class="stack">' +
        '<section class="card"><div class="card-head"><div class="card-title">❓ Tips &amp; tours</div>' + liveDot() + '</div>' +
          '<div class="list">' +
            settingRow('Show tip banners', 'The blue cards on each screen', sw(s.showTips, 'tips-toggle')) +
            settingRow('Guided tours', 'Replay the walkthrough for this screen',
              '<button class="btn btn-sm" data-action="tour">Start</button>') +
          '</div></section>' +

        '<section class="card"><div class="card-head"><div class="card-title">🔔 Sound &amp; effects</div>' + liveDot() + '</div>' +
          '<div class="list">' +
            settingRow('Chime when a task is ticked', 'A soft three-note chime, synthesised in the browser',
              sw(s.sound, 'toggle-set:sound')) +
            settingRow('Stars, confetti and fanfares', 'Particles on a tick, confetti when a slot or the day is cleared',
              sw(s.effects, 'toggle-set:effects')) +
            settingRow('Try it', 'Plays the celebration and reports what the audio engine is doing',
              '<button class="btn btn-sm btn-gold" data-action="test-fx">Play</button>') +
            settingRow('Full-width board', 'Hide the left bar to fit more children on screen',
              sw(s.railHidden, 'toggle-rail')) +
          '</div>' +
          '<div class="card-foot tiny faint">Both are skipped automatically when the device asks for reduced motion.</div>' +
        '</section>' +

        '<section class="card"><div class="card-head"><div class="card-title">🌍 Languages in use</div>' + liveDot() + '</div>' +
          '<div class="list">' + DB.kids.map(function(k){
            var l = langOf(k.lang || 'en');
            return '<div class="li click ' + k.color + '" data-action="kid-lang:' + k.id + '">' +
              '<span style="font-size:26px">' + k.emoji + '</span>' +
              '<div class="grow"><div class="bold sm">' + esc(k.name) + '</div>' +
              '<div class="tiny faint">Routine board in ' + l.name + '</div></div>' +
              '<span class="badge badge-tint">' + l.flag + ' ' + (k.lang || 'en').toUpperCase() + '</span>' +
              icon('cright', 'i-sm') + '</div>';
          }).join('') + '</div>' +
          '<div class="card-foot tiny faint">Only the routine board and the child&rsquo;s own view translate.</div>' +
        '</section>' +

        '<section class="card"><div class="card-head"><div class="card-title">🎨 Appearance</div>' + liveDot() + '</div>' +
          '<div class="card-body row wrap">' +
            ['auto', 'light', 'dark'].map(function(th){
              return '<button class="chip' + (s.theme === th ? ' on' : '') +
                     '" data-action="theme:' + th + '">' + th + '</button>'; }).join('') +
          '</div></section>' +

        '<section class="card mock"><div class="card-head"><div class="card-title">🔗 Sync</div>' +
          '<span class="badge badge-mock">mockup</span></div>' +
          '<div class="list">' +
            settingRow('Google Calendar', 'Two-way family calendar sync', sw(true, 'noop')) +
            settingRow('Apple / iCal feed', 'Read-only subscription', sw(false, 'noop')) +
            settingRow('Share with a co-parent', 'kevin@example.com can edit', sw(true, 'noop')) +
          '</div></section>' +

        '<section class="card mock"><div class="card-head"><div class="card-title">🔔 Notifications</div>' +
          '<span class="badge badge-mock">mockup</span></div>' +
          '<div class="list">' +
            settingRow('Morning routine at 7:00am', 'A nudge on the tablet', sw(true, 'noop')) +
            settingRow('Weekly star summary', 'Sunday evening recap', sw(true, 'noop')) +
          '</div></section>' +

        '<section class="card mock"><div class="card-head"><div class="card-title">📖 State requirements</div>' +
          '<span class="badge badge-mock">mockup</span></div>' +
          '<div class="card-body">' +
            '<div class="field mb0"><label>Reporting state</label><select class="inp" disabled>' +
              '<option>' + STATES[s.stateCode].name + '</option></select>' +
              '<div class="hint">Compliance tracking is part of the Records mockup.</div></div>' +
          '</div></section>' +
      '</div>' +
    '</div>';
}

/* ============================================================
   MOCKUP SCREENS - static, watermarked, not wired up.
   ============================================================ */
function todayView(){
  var evs = eventsOn(TODAY, true);
  var totalStars = DB.kids.reduce(function(a, k){ return a + starsOn(k.id, TODAY); }, 0);

  return mockBanner('It sketches a morning dashboard: stat tiles, AI suggestions and a combined agenda.') +
    '<div class="mock">' +
    '<div class="grid-4" style="margin-bottom:18px">' + DB.kids.map(function(k){
      var d = dayProgress(k.id, TODAY);
      return '<div class="stat tint ' + k.color + '">' +
        '<div class="row" style="margin-bottom:8px"><span style="font-size:24px">' + k.emoji + '</span>' +
          '<span class="grow bold" style="font-size:17px">' + esc(k.name) + '</span>' + starPill(starBank(k.id)) + '</div>' +
        '<div class="row-b tiny bold" style="color:var(--c);margin-bottom:6px">' +
          '<span>' + d.done + ' of ' + d.total + ' tasks</span><span>🔥 ' + (k.streak || 0) + '</span></div>' +
        progressBar(d.done, d.total, 'tint') +
      '</div>';
    }).join('') + '</div>' +

    '<div class="grid-2col"><div>' +
      '<section class="card" style="margin-bottom:18px">' +
        '<div class="card-head"><div class="card-title">' + icon('spark') + 'Smart suggestions</div>' +
          '<span class="badge badge-mock">mockup</span></div>' +
        '<div class="list">' + SUGGESTIONS.map(function(g){
          return '<div class="li" style="align-items:flex-start">' +
            '<span style="font-size:26px;line-height:1.2">' + g.emoji + '</span>' +
            '<div class="grow"><div class="bold">' + g.title + '</div>' +
              '<div class="sm muted" style="margin-top:3px">' + g.body + '</div>' +
              '<div class="row" style="margin-top:11px">' +
                '<button class="btn btn-sm" disabled>' + g.action + '</button>' +
                '<button class="btn btn-sm btn-ghost" disabled>Dismiss</button></div>' +
            '</div></div>';
        }).join('') + '</div></section>' +

      '<section class="card"><div class="card-head"><div class="card-title">📅 Today&rsquo;s blocks</div>' +
        '<span class="badge badge-mock">mockup</span></div>' +
        '<div class="list">' + (evs.length ? evs.slice(0, 8).map(function(e){
          var s = subj(e.sk);
          return '<div class="li"><span class="task-emoji ' + s.cls + '">' + s.emoji + '</span>' +
            '<span class="li-time">' + timeLabel(e.start) + '</span>' +
            '<div class="grow bold">' + esc(e.title) + '</div>' +
            '<div class="row hide-sm">' + e.kids.map(function(id){
              var k = kid(id);
              return k ? '<span class="tag ' + k.color + '">' + esc(k.name) + '</span>' : ''; }).join('') + '</div></div>';
        }).join('') : emptyRow('Nothing scheduled.')) + '</div></section>' +
    '</div>' +

    '<div class="stack">' +
      '<section class="card"><div class="card-head"><div class="card-title">⭐ Stars today</div></div>' +
        '<div class="card-body">' +
          '<div class="bignum" style="--c:var(--gold)">' + totalStars + '</div>' +
          '<div class="sm faint" style="margin:8px 0 14px">earned by the family today</div>' +
          '<button class="btn btn-block btn-gold" data-action="nav:routine">Open the routine board</button>' +
        '</div></section>' +
      '<section class="card"><div class="card-head"><div class="card-title">🎉 Recent wins</div></div>' +
        '<div class="list">' + WINS.map(function(w){
          var k = kid(w.kid);
          return '<div class="li ' + (k ? k.color : 'k0') + '"><span style="font-size:24px">' + w.emoji + '</span>' +
            '<div class="grow"><div class="sm bold">' + esc(w.text) + '</div>' +
            '<div class="tiny faint">' + kname(w.kid) + ' &middot; ' + w.when + '</div></div></div>';
        }).join('') + '</div></section>' +
    '</div></div></div>';
}

function lessonsView(){
  var list = COURSES;
  return mockBanner('It sketches lesson lists per subject - ordered lessons rather than dated ones.') +
    '<div class="mock">' + list.map(function(c){
      var s = subj(c.sk), k = kid(c.kid);
      var rows = '';
      for (var i = 0; i < 4; i++){
        var n = c.done - 1 + i;
        if (n < 0 || n >= c.total) continue;
        var status = n < c.done ? 'done' : (n === c.done ? 'today' : 'next');
        rows += '<div class="lesson st-' + status + '">' +
          '<span class="check' + (status === 'done' ? ' on' : '') + '" style="' +
            (status === 'done' ? 'background:var(--ok);border-color:var(--ok)' : '') + '">' +
            '<span style="opacity:' + (status === 'done' ? 1 : 0) + '">' + icon('check') + '</span></span>' +
          '<span class="num">#' + (n + 1) + '</span>' +
          '<span class="grow lt">' + lessonTitle(c.id, n) + '</span>' +
          (status === 'today' ? '<span class="badge badge-accent">today</span>' :
           status === 'done' ? '<span class="tiny faint">done</span>' : '<span class="tiny faint">next</span>') +
        '</div>';
      }
      return '<div class="subjcard ' + s.cls + '" style="margin-bottom:14px">' +
        '<div class="subjhead"><span class="task-emoji">' + s.emoji + '</span>' +
          '<span class="grow"><span class="bold" style="font-size:17px;display:block">' + esc(c.name) + '</span>' +
          '<span class="tiny faint">' + esc(c.book) + '</span></span>' +
          (k ? '<span class="tag ' + k.color + '">' + k.emoji + ' ' + esc(k.name) + '</span>' : '') +
          '<span style="width:120px" class="hide-sm">' + progressBar(c.done, c.total, 'tint') +
            '<span class="tiny faint" style="display:block;margin-top:5px">' + c.done + ' / ' + c.total + '</span></span>' +
        '</div>' + rows + '</div>';
    }).join('') + '</div>';
}

function progressView(){
  var kidId = state.progressKid;
  if (!kid(kidId) && DB.kids.length) kidId = DB.kids[0].id;
  var k = kid(kidId);
  var skills = SKILLS.filter(function(s){ return s.kid === kidId; });
  var bySubject = {};
  skills.forEach(function(s){ (bySubject[s.sk] = bySubject[s.sk] || []).push(s); });
  var got = skills.filter(function(s){ return s.level === 3; }).length;

  return mockBanner('It sketches mastery tracking - Learning / Practising / Got it - in place of grades and a GPA.') +
    '<div class="mock">' +
    '<div class="seg big" style="margin-bottom:18px">' + DB.kids.map(function(x){
      return '<button class="' + (kidId === x.id ? 'on' : '') + '" data-action="progress-kid:' + x.id + '">' +
             x.emoji + ' ' + esc(x.name) + '</button>'; }).join('') + '</div>' +

    (k ? '<div class="grid-4" style="margin-bottom:18px">' +
      statCard({ emoji:'🎯', label:'Skills tracked', value:skills.length, tint:k.color }) +
      statCard({ emoji:'✅', label:'Got it', value:got, unit:'of ' + skills.length, bar:got, barMax:skills.length || 1, barCls:'ok' }) +
      statCard({ emoji:'📚', label:'Subjects', value:Object.keys(bySubject).length }) +
      statCard({ emoji:'🔥', label:'Streak', value:(k.streak || 0), unit:'days' }) +
    '</div>' +
    '<section class="card"><div class="card-head"><div class="card-title">What ' + esc(k.name) + ' can do</div>' +
      '<span class="badge badge-mock">mockup</span></div><div class="card-body">' +
      (skills.length ? Object.keys(bySubject).map(function(key){
        var s = subj(key);
        return '<div style="margin-bottom:20px">' +
          '<div class="row ' + s.cls + '" style="margin-bottom:10px">' +
            '<span class="task-emoji">' + s.emoji + '</span>' +
            '<span class="bold" style="color:var(--c)">' + s.name + '</span></div>' +
          bySubject[key].map(function(sk){
            return '<div class="li ' + s.cls + '" style="border-radius:14px;border:1.5px solid var(--line);margin-bottom:8px">' +
              '<span class="grow bold sm">' + esc(sk.name) + '</span>' +
              '<span class="masterbar">' + [1, 2, 3].map(function(n){
                return '<i class="' + (sk.level >= n ? 'on' : '') + '"></i>'; }).join('') + '</span>' +
              '<span class="badge badge-tint" style="width:92px;justify-content:center">' + LEVEL_NAMES[sk.level] + '</span>' +
            '</div>';
          }).join('') + '</div>';
      }).join('') : '<div class="faint">No sample skills for this child.</div>') +
    '</div></section>' : '<div class="card"><div class="card-body faint">Add a child first.</div></div>') +
    '</div>';
}

var REPORTS = [
  { id:'week',       emoji:'🗓️', name:'Weekly plan',         desc:'The fridge copy - one page for the family.' },
  { id:'chores',     emoji:'✅',  name:'Routine chart',       desc:'A printable chore chart with sticker boxes.' },
  { id:'attendance', emoji:'📋', name:'Attendance register', desc:'Days and hours by month, ready for the district.' },
  { id:'progress',   emoji:'🌱', name:'Progress summary',    desc:'What each child can do, in plain language.' },
  { id:'portfolio',  emoji:'📁', name:'Portfolio export',    desc:'Work samples and reading log as one PDF.' }
];
function heatCalendar(){
  var out = '', d = new Date(YEAR_START.getFullYear(), YEAR_START.getMonth(), 1);
  var last = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
  while (d <= last){
    var first = new Date(d.getFullYear(), d.getMonth(), 1);
    var cells = '';
    for (var p = 0; p < monIdx(first); p++) cells += '<span></span>';
    var day = new Date(first);
    while (day.getMonth() === d.getMonth()){
      var rec = MOCK_ATTENDANCE[ymd(day)];
      cells += '<span class="cellx ' + (rec ? rec.mark : 'f') + '" title="' + fmtShort(day) + '"></span>';
      day = addDays(day, 1);
    }
    out += '<div class="heat-month"><div class="mn">' + MON_ABBR[d.getMonth()] + ' ' + String(d.getFullYear()).slice(2) + '</div>' +
           '<div class="heat-grid">' + DAY_ABBR.map(function(x){ return '<span class="hd2">' + x[0] + '</span>'; }).join('') + '</div>' +
           '<div class="heat-grid">' + cells + '</div></div>';
    d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  }
  return out;
}
function recordsView(){
  var st = STATES[DB.settings.stateCode];
  return mockBanner('It sketches attendance tracking, state compliance rules and printable reports.') +
    '<div class="mock">' +
    '<div class="grid-4" style="margin-bottom:18px">' +
      statCard({ emoji:'📅', label:'Days logged', value:DAYS_DONE, unit:'/ ' + st.days, bar:DAYS_DONE, barMax:st.days || 1 }) +
      statCard({ emoji:'⏱️', label:'Hours logged', value:HOURS_DONE, unit:'/ ' + (st.hours || '-'), bar:HOURS_DONE, barMax:st.hours || 1, barCls:'ok' }) +
      statCard({ emoji:'🎒', label:'Children', value:DB.kids.length }) +
      statCard({ emoji:'🏁', label:'Projected finish', value:fmtShort(addDays(TODAY, 96)) }) +
    '</div>' +
    '<div class="grid-2col">' +
      '<section class="card"><div class="card-head"><div class="card-title">📋 Attendance</div>' +
        '<span class="badge badge-mock">mockup</span></div>' +
        '<div class="card-body"><div class="heat">' + heatCalendar() + '</div></div></section>' +
      '<div class="stack">' +
        '<section class="card"><div class="card-head"><div class="card-title">🖨️ Print</div>' +
          '<span class="badge badge-mock">mockup</span></div>' +
          '<div class="list">' + REPORTS.map(function(r){
            return '<div class="li"><span style="font-size:26px">' + r.emoji + '</span>' +
              '<div class="grow"><div class="bold sm">' + r.name + '</div>' +
              '<div class="tiny faint">' + r.desc + '</div></div></div>';
          }).join('') + '</div></section>' +
        '<section class="card"><div class="card-head"><div class="card-title">📖 ' + st.name + ' rules</div></div>' +
          '<div class="list">' + st.rules.map(function(r){
            return '<div class="li"><span style="color:var(--ok)">' + icon('check', 'i-sm') + '</span>' +
                   '<span class="grow sm">' + r + '</span></div>'; }).join('') + '</div></section>' +
      '</div>' +
    '</div></div>';
}

/* ------------------------------------------------------------------ */
var VIEWS = {
  routine:  { title:'Routine & chores', sub:'Tap to tick, earn stars', icon:'check2', label:'Routine',  render:routineView, live:true },
  rewards:  { title:'Rewards',          sub:'Star bank and store',     icon:'star',   label:'Rewards',  render:rewardsView, live:true },
  calendar: { title:'Calendar',         sub:'Lessons and outings',     icon:'calendar', label:'Calendar', render:calendarView, live:true },
  kids:     { title:'Kids',             sub:'Profiles and colours',    icon:'users',  label:'Kids',     render:kidsView,    live:true },
  today:    { title:'Today',            sub:'Mockup',                  icon:'home',   label:'Today',    render:todayView },
  lessons:  { title:'Lessons',          sub:'Mockup',                  icon:'book',   label:'Lessons',  render:lessonsView },
  progress: { title:'Progress',         sub:'Mockup',                  icon:'target', label:'Progress', render:progressView },
  records:  { title:'Records',          sub:'Mockup',                  icon:'printer', label:'Records', render:recordsView },
  settings: { title:'Settings',         sub:'',                        icon:'settings', label:'Settings', render:settingsView, live:true }
};
var NAV_ORDER = ['routine', 'rewards', 'calendar', 'kids', 'today', 'lessons', 'progress', 'records', 'settings'];
