/* ============================================================
   Modals and drawers. Everything here writes through store.js.
   ============================================================ */

function emojiPicker(list, current, name){
  return '<div class="row wrap" data-picker="' + name + '">' + list.map(function(e){
    return '<button class="chip chip-sm' + (e === current ? ' on' : '') +
           '" style="font-size:22px" data-pick="' + e + '">' + e + '</button>'; }).join('') + '</div>';
}
/* one single-select picker, laid out in labelled groups */
function emojiPickerGrouped(groups, current, name){
  var known = [];
  groups.forEach(function(g){ known = known.concat(g.list); });
  var head = (current && known.indexOf(current) === -1)
    ? [{ name:'Current', list:[current] }] : [];
  return '<div data-picker="' + name + '">' + head.concat(groups).map(function(g){
    return '<div class="emojigroup"><div class="emojigroup-name">' + g.name + '</div>' +
      '<div class="row wrap">' + g.list.map(function(e){
        return '<button class="chip chip-sm' + (e === current ? ' on' : '') +
               '" style="font-size:22px" data-pick="' + e + '">' + e + '</button>'; }).join('') +
      '</div></div>';
  }).join('') + '</div>';
}
function kidPicker(selected, name){
  return '<div class="row wrap" data-picker="' + name + '">' + DB.kids.map(function(k){
    return '<button class="chip ' + k.color + (selected.indexOf(k.id) > -1 ? ' on tint' : '') +
           '" data-pick="' + k.id + '">' + k.emoji + ' ' + esc(k.name) + '</button>'; }).join('') + '</div>';
}
function dayPicker(selected, name){
  return '<div class="row wrap" data-picker="' + name + '">' + DAY_ABBR.map(function(d, i){
    return '<button class="chip' + (selected.indexOf(i) > -1 ? ' on' : '') +
           '" data-pick="' + i + '">' + d + '</button>'; }).join('') + '</div>';
}
/* read a multi-select picker */
function pickedMulti(root, name){
  return $$('[data-picker="' + name + '"] .chip.on', root).map(function(b){ return b.getAttribute('data-pick'); });
}
function pickedOne(root, name){
  var b = $('[data-picker="' + name + '"] .chip.on', root);
  return b ? b.getAttribute('data-pick') : null;
}
/* wire single- and multi-select pickers inside a container */
function wirePickers(root, singles){
  root.addEventListener('click', function(e){
    var b = e.target.closest('[data-pick]');
    if (!b) return;
    var group = b.closest('[data-picker]');
    if (!group) return;
    var name = group.getAttribute('data-picker');
    if (singles && singles.indexOf(name) > -1){
      $$('.chip', group).forEach(function(x){ x.classList.remove('on', 'tint'); });
      b.classList.add('on');
      if (b.className.indexOf('k') > -1) b.classList.add('tint');
    } else {
      b.classList.toggle('on');
      if (name === 'kids') b.classList.toggle('tint');
    }
  });
}

/* ---------------- routine / chore tasks ---------------- */
function manageTasksModal(){
  var api = openModal({
    title: 'Routines &amp; chores',
    sub: 'Changes save straight away',
    size: 'wide',
    body: '',
    foot: '<button class="btn left btn-primary" data-action="task-new">' + icon('plus', 'i-sm') + 'New task</button>' +
          '<button class="btn" data-close="1">Done</button>'
  });
  function draw(){
    api.setBody(
      SLOTS.map(function(s){
        var rows = DB.tasks.filter(function(t){ return t.slot === s.id; });
        return '<div style="margin-bottom:20px">' +
          '<div class="row ' + s.cls + '" style="margin-bottom:10px">' +
            '<span class="task-emoji">' + s.emoji + '</span>' +
            '<span class="bold" style="color:var(--c)">' + s.name + '</span>' +
            '<span class="grow"></span><span class="badge">' + rows.length + '</span></div>' +
          (rows.length ? rows.map(function(t){
            return '<div class="li" style="border-radius:14px;border:1.5px solid var(--line);margin-bottom:8px">' +
              '<span style="font-size:24px">' + t.emoji + '</span>' +
              '<div class="grow"><div class="bold sm">' + esc(t.title) +
                (t.titles && t.titles.ko ? ' <span class="faint" lang="ko">/ ' + esc(t.titles.ko) + '</span>' : '') + '</div>' +
                '<div class="tiny faint">' + t.kind + ' &middot; ' +
                (t.kids.length ? t.kids.map(kname).join(', ') : 'nobody') + ' &middot; ' +
                (t.days && t.days.length < 7 ? t.days.map(function(d){ return DAY_ABBR[d]; }).join(' ') : 'every day') +
                '</div></div>' +
              taskStarsSummary(t) +
              '<button class="btn btn-sm btn-icon" data-action="task-edit:' + t.id + '" aria-label="Edit">' + icon('edit', 'i-sm') + '</button>' +
              '<button class="btn btn-sm btn-icon btn-danger" data-action="task-del:' + t.id + '" aria-label="Delete">' + icon('trash', 'i-sm') + '</button>' +
            '</div>';
          }).join('') : '<div class="tiny faint" style="padding:0 0 8px">Nothing in this slot.</div>') +
        '</div>';
      }).join('')
    );
  }
  draw();
  api.redraw = draw;
  return api;
}

/* one pill if every child earns the same, otherwise one per child */
function taskStarsSummary(t){
  var vals = t.kids.map(function(id){ return starsFor(t, id); });
  var same = vals.every(function(v){ return v === vals[0]; });
  if (same) return starPill(vals.length ? vals[0] : (+t.stars || 0));
  return '<span class="row" style="gap:4px">' + t.kids.map(function(id){
    var k = kid(id);
    return '<span class="star" title="' + esc(k ? k.name : '') + '">' + (k ? k.emoji : '') + ' ' + starsFor(t, id) + '</span>';
  }).join('') + '</span>';
}

function taskEditModal(taskId){
  var t = taskId ? taskById(taskId) : null;
  var isNew = !t;
  if (isNew) t = { title:'', emoji:'⭐', slot:state.slot, stars:DB.settings.starRoutine,
                   kind:'routine', kids:kidIds(), days:[0,1,2,3,4,5,6] };

  var api = openModal({
    title: isNew ? 'New task' : 'Edit task',
    sub: 'Routines and chores live on the board, never the calendar',
    body:
      '<div class="field"><label>What is it?</label>' +
        '<input class="inp" id="tk-title" value="' + esc(t.title) + '" placeholder="Make your bed"></div>' +
      '<div class="field"><label>What is it? &middot; 한국어 <span class="faint">(optional)</span></label>' +
        '<input class="inp" id="tk-title-ko" lang="ko" value="' + esc((t.titles && t.titles.ko) || '') + '" placeholder="이불 정리하기"></div>' +
        '<div class="hint" style="margin:-8px 0 14px">Shown instead of the English name to any child whose routine language is 한국어. Leave it blank to use the English name for everyone.</div>' +
      '<div class="field"><label>Picture</label>' +
        '<div class="emojiscroll">' + emojiPickerGrouped(TASK_EMOJI_GROUPS, t.emoji, 'emoji') + '</div></div>' +
      '<div class="field"><label>Kind</label>' +
        '<div class="row" data-picker="kind">' +
          '<button class="chip' + (t.kind === 'routine' ? ' on' : '') + '" data-pick="routine">Routine</button>' +
          '<button class="chip' + (t.kind === 'chore' ? ' on' : '') + '" data-pick="chore">Chore</button>' +
        '</div></div>' +
      '<div class="field"><label>Part of the day</label>' +
        '<div class="row" data-picker="slot">' + SLOTS.map(function(s){
          return '<button class="chip ' + s.cls + (t.slot === s.id ? ' on tint' : '') + '" data-pick="' + s.id + '">' +
                 s.emoji + ' ' + s.name + '</button>'; }).join('') + '</div></div>' +
      '<div class="field"><label>Who does it?</label>' + kidPicker(t.kids, 'kids') + '</div>' +
      '<div class="field"><label>Stars for each person</label>' +
        '<div id="tk-kidstars" class="kidstars"></div>' +
        '<div class="hint">Older children can earn more for the same job.</div></div>' +
      '<div class="field mb0"><label>Which days?</label>' + dayPicker(t.days || [0,1,2,3,4,5,6], 'days') + '</div>',
    foot:
      (isNew ? '' : '<button class="btn btn-danger left" data-action="task-del:' + t.id + '">' + icon('trash', 'i-sm') + 'Delete</button>') +
      '<button class="btn" data-close="1">Cancel</button>' +
      '<button class="btn btn-primary" id="tk-save">' + (isNew ? 'Add task' : 'Save') + '</button>'
  });

  wirePickers(api.el, ['emoji', 'kind', 'slot']);

  /* per-child star values: kept across redraws so typing isn't lost when a
     child is added or removed */
  var starMap = {};
  t.kids.forEach(function(id){ starMap[id] = starsFor(t, id); });
  function defaultStars(){
    return (pickedOne(api.el, 'kind') === 'chore') ? DB.settings.starChore : DB.settings.starRoutine;
  }
  function captureStars(){
    $$('[data-kidstar]', api.el).forEach(function(inp){
      starMap[inp.getAttribute('data-kidstar')] = Math.max(0, +inp.value || 0);
    });
  }
  function drawKidStars(){
    captureStars();
    var sel = pickedMulti(api.el, 'kids');
    $('#tk-kidstars', api.el).innerHTML = sel.length ? sel.map(function(id){
      var k = kid(id);
      if (starMap[id] == null) starMap[id] = +defaultStars() || 0;
      return '<div class="kidstar ' + k.color + '">' +
        '<span class="grow bold">' + k.emoji + ' ' + esc(k.name) + '</span>' +
        '<button class="btn btn-icon btn-sm" data-step="' + id + ':-1" aria-label="Fewer stars">−</button>' +
        '<input class="inp kidstar-inp" type="number" min="0" inputmode="numeric" data-kidstar="' + id +
          '" value="' + starMap[id] + '" aria-label="Stars for ' + esc(k.name) + '">' +
        '<button class="btn btn-icon btn-sm" data-step="' + id + ':1" aria-label="More stars">+</button>' +
        '<span class="kidstar-star">⭐</span>' +
      '</div>';
    }).join('') : '<div class="hint">Pick who does it first.</div>';
  }
  drawKidStars();
  api.el.addEventListener('click', function(e){
    if (e.target.closest('[data-picker="kids"] [data-pick]')) { drawKidStars(); return; }
    var step = e.target.closest('[data-step]');
    if (step){
      var p = step.getAttribute('data-step').split(':');
      var inp = $('[data-kidstar="' + p[0] + '"]', api.el);
      if (inp) inp.value = Math.max(0, (+inp.value || 0) + (+p[1]));
      captureStars();
    }
  });

  $('#tk-save', api.el).addEventListener('click', function(){
    var title = $('#tk-title', api.el).value.trim();
    if (!title){ toast('Give it a name first', 'warn'); return; }
    var kids = pickedMulti(api.el, 'kids');
    if (!kids.length){ toast('Pick at least one child', 'warn'); return; }
    var days = pickedMulti(api.el, 'days').map(Number);
    if (!days.length) days = [0,1,2,3,4,5,6];
    var ko = $('#tk-title-ko', api.el).value.trim();
    captureStars();
    var starsByKid = {};
    kids.forEach(function(id){ starsByKid[id] = Math.max(0, +starMap[id] || 0); });
    var patch = {
      title: title,
      titles: ko ? { ko: ko } : null,
      emoji: pickedOne(api.el, 'emoji') || '⭐',
      kind:  pickedOne(api.el, 'kind') || 'routine',
      slot:  pickedOne(api.el, 'slot') || 'morning',
      stars: starsByKid[kids[0]],          /* fallback for anything reading one value */
      starsByKid: starsByKid,
      kids:  kids,
      days:  days
    };
    if (isNew) addTask(patch); else updateTask(t.id, patch);
    api.close();
    render(); refreshManager();
    toast(isNew ? 'Task added' : 'Task saved', 'ok', patch.emoji);
  });
  return api;
}

/* ---------------- calendar events ---------------- */
function eventModal(key){
  var ev = EV_INDEX[key];
  if (!ev) return;
  var s = subj(ev.sk);
  var done = isEventDone(ev.key);
  openModal({
    title: evEmoji(ev) + ' ' + esc(ev.title),
    sub: fmtLong(ev.date) + ' &middot; ' + timeLabel(ev.start) + ' - ' + timeLabel(ev.start + ev.dur),
    body:
      '<div class="row wrap" style="gap:8px;margin-bottom:16px">' +
        ev.kids.map(function(id){
          var k = kid(id);
          return k ? '<span class="chip on tint ' + k.color + '">' + k.emoji + ' ' + esc(k.name) + '</span>' : ''; }).join('') +
        '<span class="chip on tint ' + s.cls + '">' + s.emoji + ' ' + s.name + '</span>' +
        (ev.recurring ? '<span class="badge">every ' + DAY_FULL[monIdx(ev.date)] + '</span>' : '<span class="badge">one-off</span>') +
      '</div>' +
      '<div class="tiny faint">This is a calendar entry. Daily routines and chores live on the Routine board.</div>',
    foot:
      '<button class="btn btn-danger left" data-action="ev-delete:' + key + '">' + icon('trash', 'i-sm') + 'Delete</button>' +
      '<button class="btn" data-action="ev-edit:' + ev.id + '">' + icon('edit', 'i-sm') + 'Edit</button>' +
      '<button class="btn" data-action="ev-bump:' + key + '">' + icon('aright', 'i-sm') + 'Tomorrow</button>' +
      '<button class="btn' + (done ? '' : ' btn-primary') + '" data-action="toggle-ev:' + key + '">' +
        icon('check', 'i-sm') + (done ? 'Not done' : 'Mark done') + '</button>'
  });
}

function eventEditModal(eventId, prefill){
  var e = eventId ? eventById(eventId) : null;
  var isNew = !e;
  if (isNew){
    e = { title:'', sk:'circle', kids:kidIds(), start:540, dur:60,
          days:DB.settings.schoolDays.slice(), date:null };
    /* started from a cell on the calendar: that child, that day, that time */
    if (prefill){
      if (prefill.kids && prefill.kids.length) e.kids = prefill.kids.slice();
      if (prefill.date){ e.date = prefill.date; e.days = null; }
      if (prefill.start != null) e.start = prefill.start;
    }
  }
  var repeat = e.date ? 'once' : 'weekly';

  var api = openModal({
    title: isNew ? 'New calendar event' : 'Edit event',
    sub: 'Lessons, co-op, appointments - not routines',
    body:
      '<div class="field"><label>What is it?</label>' +
        '<input class="inp" id="ev-title" value="' + esc(e.title) + '" placeholder="Swimming lesson"></div>' +
      '<div class="field"><label>What is it? &middot; 한국어 <span class="faint">(optional)</span></label>' +
        '<input class="inp" id="ev-title-ko" lang="ko" value="' + esc((e.titles && e.titles.ko) || '') + '" placeholder="수영 수업"></div>' +
        '<div class="hint" style="margin:-8px 0 14px">Used on the routine board for children whose language is 한국어. The calendar itself always shows the English name.</div>' +
      '<div class="field"><label>Picture</label>' +
        '<div class="emojiscroll">' + emojiPickerGrouped(EVENT_EMOJI_GROUPS, evEmoji(e), 'emoji') + '</div>' +
        '<div class="hint">Leave the subject\u2019s own picture if you like - the colour below is what ' +
        'groups the week.</div></div>' +
      '<div class="field"><label>Subject colour</label><div class="row wrap" data-picker="sk">' +
        Object.keys(SUBJECTS).map(function(key){
          var s = SUBJECTS[key];
          return '<button class="chip ' + s.cls + (e.sk === key ? ' on tint' : '') + '" data-pick="' + key + '">' +
                 s.emoji + ' ' + s.name + '</button>'; }).join('') + '</div></div>' +
      '<div class="field"><label>Who is it for?</label>' + kidPicker(e.kids, 'kids') + '</div>' +
      '<div class="f2">' +
        '<div class="field"><label>Start</label>' +
          '<input class="inp" id="ev-start" type="time" value="' + hhmm(e.start) + '"></div>' +
        '<div class="field"><label>Minutes</label>' +
          '<input class="inp" id="ev-dur" type="number" min="5" value="' + e.dur + '"></div>' +
      '</div>' +
      '<div class="field"><label>Repeat</label><div class="row" data-picker="repeat">' +
        '<button class="chip' + (repeat === 'weekly' ? ' on' : '') + '" data-pick="weekly">Every week</button>' +
        '<button class="chip' + (repeat === 'once' ? ' on' : '') + '" data-pick="once">Just once</button>' +
      '</div></div>' +
      '<div class="field mb0" id="ev-when">' +
        '<label>Which days?</label>' + dayPicker(e.days || [0,1,2,3,4], 'days') +
        '<div style="margin-top:12px"><label class="tiny faint">Or a single date</label>' +
        '<input class="inp" id="ev-date" type="date" value="' + (e.date || ymd(state.cursor)) + '"></div>' +
      '</div>',
    foot:
      (isNew ? '' : '<button class="btn btn-danger left" data-action="ev-delete-series:' + e.id + '">' + icon('trash', 'i-sm') + 'Delete</button>') +
      '<button class="btn" data-close="1">Cancel</button>' +
      '<button class="btn btn-primary" id="ev-save">' + (isNew ? 'Add event' : 'Save') + '</button>'
  });

  wirePickers(api.el, ['sk', 'repeat', 'emoji']);
  $('#ev-save', api.el).addEventListener('click', function(){
    var title = $('#ev-title', api.el).value.trim();
    if (!title){ toast('Give it a name first', 'warn'); return; }
    var kids = pickedMulti(api.el, 'kids');
    if (!kids.length){ toast('Pick at least one child', 'warn'); return; }
    var rep = pickedOne(api.el, 'repeat') || 'weekly';
    var koTitle = $('#ev-title-ko', api.el).value.trim();
    var patch = {
      title: title,
      titles: koTitle ? { ko: koTitle } : null,
      sk: pickedOne(api.el, 'sk') || 'circle',
      emoji: pickedOne(api.el, 'emoji') || null,
      kids: kids,
      start: hm($('#ev-start', api.el).value || '09:00'),
      dur: Math.max(5, +$('#ev-dur', api.el).value || 30)
    };
    if (rep === 'once'){
      patch.date = $('#ev-date', api.el).value || ymd(state.cursor);
      patch.days = null;
    } else {
      var days = pickedMulti(api.el, 'days').map(Number);
      patch.days = days.length ? days : [0,1,2,3,4];
      patch.date = null;
    }
    if (isNew) addEvent(patch); else updateEvent(e.id, patch);
    api.close(); render();
    toast(isNew ? 'Event added' : 'Event saved', 'ok', '📅');
  });
  return api;
}

/* ---------------- kids ---------------- */
function kidEditModal(kidId){
  var k = kidId ? kid(kidId) : null;
  var isNew = !k;
  if (isNew) k = { name:'', grade:'Grade 1', age:6, color:firstFreeColor(), emoji:'🐸', likes:'', openingStars:0 };
  var parent = isParent(k);

  var api = openModal({
    title: isNew ? 'Add a family member' : 'Edit ' + esc(k.name),
    body:
      '<div class="field"><label>Who is this?</label><div class="row" data-picker="role">' +
        '<button class="chip' + (parent ? '' : ' on') + '" data-pick="child">🧒 A child</button>' +
        '<button class="chip' + (parent ? ' on' : '') + '" data-pick="parent">🧑 A parent</button>' +
      '</div><div class="hint">Parents get a column, a colour and a calendar row like everyone else - ' +
      'their chores fill the team pot too. Grades and ages are only asked of children.</div></div>' +
      '<div class="f2">' +
        '<div class="field"><label>Name</label>' +
          '<input class="inp" id="kd-name" value="' + esc(k.name) + '" placeholder="' + (parent ? 'Mom' : 'Jonah') + '"></div>' +
        '<div class="field" id="kd-grade-f"' + (parent ? ' hidden' : '') + '><label>Grade</label><select class="inp" id="kd-grade">' +
          GRADES.map(function(g){
            return '<option' + (g === k.grade ? ' selected' : '') + '>' + g + '</option>'; }).join('') +
        '</select></div>' +
      '</div>' +
      '<div class="field"><label>Their colour</label><div class="row wrap" data-picker="color">' +
        PALETTES.map(function(p){
          return '<button class="chip ' + p.id + (k.color === p.id ? ' on tint' : '') + '" data-pick="' + p.id + '">' +
                 '<span class="dot"></span>' + p.name + '</button>'; }).join('') + '</div></div>' +
      '<div class="field"><label>Sign-in picture</label>' + emojiPickerGrouped(MEMBER_EMOJI_GROUPS, k.emoji, 'emoji') + '</div>' +
      '<div class="field"><label>Routine board language</label><div class="row wrap" data-picker="lang">' +
        LANGS.map(function(l){
          return '<button class="chip' + ((k.lang || 'en') === l.id ? ' on' : '') + '" data-pick="' + l.id + '">' +
                 l.flag + ' ' + l.name + '</button>'; }).join('') +
      '</div><div class="hint">Their column, their toasts and their own full-screen view all switch to this.</div></div>' +
      '<div class="f2">' +
        '<div class="field" id="kd-age-f"' + (parent ? ' hidden' : '') + '><label>Age</label>' +
          '<input class="inp" id="kd-age" type="number" min="1" max="18" value="' + (k.age || 6) + '"></div>' +
        '<div class="field"><label>Stars to start with</label>' +
          '<input class="inp" id="kd-stars" type="number" min="0" value="' + (k.openingStars || 0) + '"></div>' +
      '</div>' +
      '<div class="field mb0"><label>Loves</label>' +
        '<input class="inp" id="kd-likes" value="' + esc(k.likes || '') + '" placeholder="Dinosaurs, drawing"></div>' +
      (isNew ? '<div class="hint" style="margin-top:10px">Everyone starts with no routine. Add tasks from the board&rsquo;s <b>Manage</b> button.</div>' : ''),
    foot:
      (isNew ? '' : '<button class="btn btn-danger left" data-action="kid-del:' + k.id + '">' + icon('trash', 'i-sm') + 'Remove</button>') +
      '<button class="btn" data-close="1">Cancel</button>' +
      '<button class="btn btn-primary" id="kd-save">' + (isNew ? 'Add' : 'Save') + '</button>'
  });

  wirePickers(api.el, ['color', 'emoji', 'lang', 'role']);
  /* grade and age only mean something for a child */
  api.el.addEventListener('click', function(e){
    if (!e.target.closest('[data-picker="role"] [data-pick]')) return;
    var asParent = pickedOne(api.el, 'role') === 'parent';
    $('#kd-grade-f', api.el).hidden = asParent;
    $('#kd-age-f', api.el).hidden = asParent;
    var nm = $('#kd-name', api.el);
    nm.placeholder = asParent ? 'Mom' : 'Jonah';
  });
  $('#kd-save', api.el).addEventListener('click', function(){
    var name = $('#kd-name', api.el).value.trim();
    if (!name){ toast('Give them a name first', 'warn'); return; }
    var asParent = pickedOne(api.el, 'role') === 'parent';
    var patch = {
      name: name,
      role: asParent ? 'parent' : 'child',
      grade: asParent ? '' : $('#kd-grade', api.el).value,
      age: asParent ? null : (+$('#kd-age', api.el).value || 6),
      color: pickedOne(api.el, 'color') || 'k4',
      emoji: pickedOne(api.el, 'emoji') || '🐸',
      lang: pickedOne(api.el, 'lang') || 'en',
      likes: $('#kd-likes', api.el).value.trim(),
      openingStars: Math.max(0, +$('#kd-stars', api.el).value || 0)
    };
    if (isNew) addKid(patch); else updateKid(k.id, patch);
    api.close(); render();
    toast(isNew ? name + ' added' : 'Saved', 'ok', patch.emoji);
  });
  return api;
}

/* quick language switch from the globe chip on a child's column */
function langPickerModal(kidId){
  var k = kid(kidId);
  if (!k) return;
  var cur = k.lang || 'en';
  openModal({
    title: k.emoji + ' ' + esc(k.name),
    sub: t('language', cur) + ' &middot; ' + t('tipTitle', cur).slice(0, 40),
    size: 'narrow',
    body: LANGS.map(function(l){
      return '<button class="radio ' + k.color + (l.id === cur ? ' on' : '') +
             '" data-action="set-lang:' + kidId + ':' + l.id + '">' +
        '<span class="mark"></span><span style="font-size:26px">' + l.flag + '</span>' +
        '<span class="grow"><span class="bold">' + l.name + '</span>' +
        '<span class="tiny faint" style="display:block">' + t('todaysLessons', l.id) + ' &middot; ' +
        t('chores', l.id) + '</span></span></button>';
    }).join('') +
    '<div class="hint" style="margin-top:10px">Only the routine board changes. The rest of the app stays in English.</div>',
    foot: '<button class="btn" data-close="1">Close</button>'
  });
}

/* deleting a calendar entry: one day, from here on, or the whole series */
function eventDeleteModal(key){
  var ev = EV_INDEX[key];
  if (!ev) return;
  var s = subj(ev.sk);

  if (!ev.recurring){
    openModal({
      title: 'Delete this event?',
      sub: s.emoji + ' ' + esc(ev.title) + ' &middot; ' + fmtLong(ev.date),
      size: 'narrow',
      body: '<p class="sm muted" style="margin-top:0">This is a one-off, so it will be removed completely.</p>',
      foot: '<button class="btn" data-close="1">Cancel</button>' +
            '<button class="btn btn-danger" data-action="del-series:' + ev.id + '">' +
              icon('trash', 'i-sm') + 'Delete</button>'
    });
    return;
  }

  var count = 0;
  for (var i = 0; i < 180; i++){
    var d = addDays(ev.date, i);
    if (eventsOn(d, true).some(function(e){ return e.id === ev.id; })) count++;
  }
  openModal({
    title: 'Delete a repeating event',
    sub: s.emoji + ' ' + esc(ev.title) + ' &middot; every ' + (ev.days || []).map(function(d){ return DAY_ABBR[d]; }).join(', '),
    body:
      '<p class="sm muted" style="margin-top:0">About <b>' + count + '</b> more of these are scheduled over the next six months. What should go?</p>' +
      '<button class="radio" data-action="del-occurrence:' + key + '">' +
        '<span class="mark"></span><span style="font-size:24px">1️⃣</span>' +
        '<span class="grow"><span class="bold">Only ' + fmtShort(ev.date) + '</span>' +
        '<span class="tiny faint" style="display:block">Skip this one day. The rest of the series carries on.</span></span></button>' +
      '<button class="radio" data-action="del-future:' + key + '">' +
        '<span class="mark"></span><span style="font-size:24px">⏭️</span>' +
        '<span class="grow"><span class="bold">' + fmtShort(ev.date) + ' and everything after</span>' +
        '<span class="tiny faint" style="display:block">Ends the series here. Earlier weeks stay on the calendar.</span></span></button>' +
      '<button class="radio" data-action="del-series:' + ev.id + '">' +
        '<span class="mark"></span><span style="font-size:24px">🗑️</span>' +
        '<span class="grow"><span class="bold">The whole series</span>' +
        '<span class="tiny faint" style="display:block">Removes every occurrence, past and future. Cannot be undone.</span></span></button>',
    foot: '<button class="btn" data-close="1">Cancel</button>'
  });
}

function kidDrawer(kidId, tab){
  var k = kid(kidId);
  if (!k) return;
  tab = tab || 'overview';
  var d = dayProgress(kidId, TODAY);
  var body = '';

  if (tab === 'overview'){
    body =
      '<div class="grid-4" style="margin-bottom:18px">' +
        statCard({ emoji:'⭐', label:'Stars banked', value:starBank(kidId), tint:k.color }) +
        statCard({ emoji:'✅', label:'Today', value:d.done + '/' + d.total }) +
        statCard({ emoji:'🔥', label:'Streak', value:(k.streak || 0) }) +
      '</div>' +
      '<div class="bold" style="margin-bottom:10px">Stars, broken down</div>' +
      '<div class="list">' +
        '<div class="li"><span class="grow sm">Opening balance</span><span class="bold">' +
          (DB.settings.carryOver ? (k.openingStars || 0) : 0) + '</span></div>' +
        '<div class="li"><span class="grow sm">Earned from ticks</span><span class="bold">+' + starsEarnedTotal(kidId) + '</span></div>' +
        '<div class="li"><span class="grow sm">Spent on rewards</span><span class="bold">-' + starsSpent(kidId) + '</span></div>' +
        '<div class="li"><span class="grow bold">Bank</span>' + starPill(starBank(kidId), true) + '</div>' +
      '</div>' +
      (k.likes ? '<div class="bold" style="margin:20px 0 8px">Loves</div><div class="sm muted">' + esc(k.likes) + '</div>' : '') +
      '<button class="btn btn-block" style="margin-top:18px" data-action="edit-kid:' + kidId + '">' +
        icon('edit', 'i-sm') + 'Edit ' + esc(k.name) + '</button>';
  } else if (tab === 'routine'){
    body = SLOTS.map(function(s){
      var ts = tasksFor(kidId, TODAY, s.id);
      return '<div style="margin-bottom:20px">' +
        '<div class="row ' + s.cls + '" style="margin-bottom:10px"><span class="task-emoji">' + s.emoji + '</span>' +
        '<span class="bold" style="color:var(--c)">' + s.name + '</span><span class="grow"></span>' +
        starPill(ts.reduce(function(a, t){ return isTeamTask(t) ? a : a + starsFor(t, kidId); }, 0)) + '</div>' +
        (ts.length ? ts.map(function(t){
          return '<div class="task ' + k.color + (isTaskDone(kidId, t.id, TODAY) ? ' done' : '') + '" style="margin-bottom:8px">' +
            '<span class="task-emoji">' + t.emoji + '</span>' +
            '<span class="grow task-title" lang="' + (k.lang || 'en') + '">' +
            esc(itemTitle(t, k.lang || 'en')) + '</span>' +
            (isTeamTask(t) ? teamPill(starsFor(t, kidId)) : starPill(starsFor(t, kidId))) + '</div>';
        }).join('') : '<div class="tiny faint">Nothing yet.</div>') + '</div>';
    }).join('') +
    '<button class="btn btn-block" data-action="manage-tasks">' + icon('edit', 'i-sm') + 'Manage tasks</button>';
  } else {
    var evs = eventsOn(TODAY, true).filter(function(e){ return e.kids.indexOf(kidId) > -1; });
    body = (evs.length ? evs.map(function(e){
      var s = subj(e.sk);
      return '<div class="task ' + s.cls + '" style="margin-bottom:9px">' +
        '<span class="task-emoji">' + s.emoji + '</span>' +
        '<span class="grow"><span class="task-title" lang="' + (k.lang || 'en') + '">' +
        esc(itemTitle(e, k.lang || 'en')) + '</span>' +
        '<span class="tiny faint" style="display:block">' + timeLabel(e.start) + ' &middot; ' + durLabel(e.dur) + '</span></span></div>';
    }).join('') : '<div class="faint">Nothing on the calendar today.</div>') +
    '<button class="btn btn-block" style="margin-top:12px" data-action="nav:calendar">Open the calendar</button>';
  }

  openDrawer({
    head: '<div class="row ' + k.color + '"><span style="font-size:42px">' + k.emoji + '</span>' +
          '<div class="grow"><div class="page-title">' + esc(k.name) + '</div>' +
          '<div class="page-sub">' + esc(memberSub(k)) + '</div></div>' + starPill(starBank(kidId), true) + '</div>',
    tabs: '<div class="tabs">' + [['overview', 'Overview'], ['routine', 'Routine'], ['today', 'Today']]
            .map(function(t){
              return '<button class="' + (tab === t[0] ? 'on' : '') + '" data-action="kid-tab:' + kidId + ':' + t[0] + '">' +
                     t[1] + '</button>'; }).join('') + '</div>',
    body: body
  });
}

/* ---------------- child-facing mode ---------------- */
function kidMode(kidId){
  var k = kid(kidId);
  if (!k) return;
  var wrap = document.createElement('div');
  wrap.className = 'kidwrap ' + k.color;

  var L = k.lang || 'en';

  function draw(){
    var dt = TODAY;
    var tasks = tasksFor(kidId, dt, state.slot);
    var evs = eventsOn(dt, true).filter(function(e){
      return e.kids.indexOf(kidId) > -1 && slotForMinutes(e.start) === state.slot;
    });
    var d = dayProgress(kidId, dt);
    wrap.lang = L;
    wrap.innerHTML =
      '<div class="kid-top ' + k.color + '"><span style="font-size:42px">' + k.emoji + '</span>' +
        '<div class="grow"><div class="page-title">' + t('greeting', L, { name:esc(k.name) }) + '</div>' +
          '<div class="page-sub">' + t('doneToday', L, { d:d.done, t:d.total }) + '</div></div>' +
        starPill(starBank(kidId), true) +
        '<button class="btn" data-kid-close="1">' + icon('x', 'i-sm') +
          '<span class="hide-sm">' + t('exit', L) + '</span></button>' +
      '</div>' +
      '<div class="kid-inner">' +
        '<div class="seg big" style="width:100%;margin-bottom:18px">' + SLOTS.map(function(s){
          return '<button class="' + (state.slot === s.id ? 'on' : '') + '" style="flex:1" data-kslot="' + s.id + '">' +
                 s.emoji + ' ' + t('slot_' + s.id, L) + '</button>'; }).join('') + '</div>' +
        (evs.length ? '<div class="slotlabel ' + k.color + '">📅 ' + t('todaysLessons', L) + '</div>' +
          evs.map(function(e){
            var s = subj(e.sk);
            return '<div class="kid-task ' + s.cls + (isEventDone(e.key) ? ' done' : '') + '" data-kev="' + e.key + '">' +
              '<span class="task-emoji">' + s.emoji + '</span>' +
              '<span class="grow kt">' + esc(itemTitle(e, L)) + '</span>' +
              '<span class="when">' + timeLabel(e.start) + '</span>' + checkCircle() + '</div>';
          }).join('') : '') +
        (rewardsDue(kidId, dt).length
          ? '<div class="slotlabel ' + k.color + '">🎁 ' + t('rewardSection', L) + '</div>' +
            rewardsDue(kidId, dt).map(function(r){
              return '<div class="kid-task rewardrow' + (isRedemptionDone(r) ? ' done' : '') +
                '" data-kreward="' + r.id + '">' +
                '<span class="task-emoji">' + r.emoji + '</span>' +
                '<span class="grow kt">' + esc(r.name) + '</span>' + checkCircle() + '</div>';
            }).join('')
          : '') +
        (tasks.length ? '<div class="slotlabel ' + k.color + '">' + slotOf(state.slot).emoji + ' ' + t('myJobs', L) + '</div>' : '') +
        tasks.map(function(task){
          var done = isTaskDone(kidId, task.id, dt);
          return '<button class="kid-task ' + k.color + (done ? ' done' : '') + '" data-ktask="' + task.id + '">' +
            '<span class="task-emoji">' + task.emoji + '</span>' +
            '<span class="grow kt">' + esc(itemTitle(task, L)) + '</span>' +
            (isTeamTask(task) ? teamPill(starsFor(task, kidId)) : starPill(starsFor(task, kidId))) +
            checkCircle() + '</button>';
        }).join('') +
        (!tasks.length && !evs.length ? '<div class="ph">' + t('nothingToDo', L) + '</div>' : '') +
        (slotComplete(kidId, dt, state.slot)
          ? '<div class="celebrate"><span class="em">🎉</span><div class="ct">' +
            t('slotDoneKid', L, { slot:t('slot_' + state.slot, L) }) + '</div></div>'
          : '<div class="ph">' + t('tapWhenDone', L) + '</div>') +
      '</div>';
  }
  draw();
  document.body.appendChild(wrap);
  document.body.style.overflow = 'hidden';

  wrap.addEventListener('click', function(e){
    if (e.target.closest('[data-kid-close]')){
      wrap.remove(); document.body.style.overflow = ''; render(); return;
    }
    var sl = e.target.closest('[data-kslot]');
    if (sl){ state.slot = sl.getAttribute('data-kslot'); draw(); return; }

    var rw = e.target.closest('[data-kreward]');
    if (rw){
      var gotIt = toggleRedemptionDone(rw.getAttribute('data-kreward'), TODAY);
      FX.tick(rw, gotIt);
      draw(); return;
    }
    var evEl = e.target.closest('[data-kev]');
    if (evEl){
      var evOn = toggleEventDone(evEl.getAttribute('data-kev'));
      FX.tick(evEl, evOn);
      draw(); return;
    }

    var row = e.target.closest('[data-ktask]');
    if (row){
      var id = row.getAttribute('data-ktask');
      var wasComplete = slotComplete(kidId, TODAY, state.slot);
      var wasDay = dayProgress(kidId, TODAY);
      var nowDone = toggleTask(kidId, id, TODAY);
      var def = taskById(id);
      FX.tick(row, nowDone);
      if (nowDone && def) toast(
        isTeamTask(def) ? t('toastTeam', L, { n:starsFor(def, kidId) })
                        : t('plusStars', L, { n:starsFor(def, kidId) }),
        'gold', isTeamTask(def) ? '🤝' : '⭐');
      draw();
      if (nowDone){
        var nowDay = dayProgress(kidId, TODAY);
        if (nowDay.total > 0 && nowDay.done === nowDay.total && wasDay.done !== wasDay.total){
          setTimeout(function(){ FX.dayDone(); toast(t('allDone', L), 'gold', '🎉'); }, 260);
        } else if (!wasComplete && slotComplete(kidId, TODAY, state.slot)){
          setTimeout(function(){
            FX.slotDone();
            toast(t('slotDoneKid', L, { slot:t('slot_' + state.slot, L) }), 'gold', '🏅');
          }, 260);
        }
      }
    }
  });
}

/* ---------------- rewards ---------------- */
function rewardEditModal(rewardId, asTeam){
  var r = rewardId ? rewardById(rewardId) : null;
  var isNew = !r;
  if (isNew) r = { name:'', emoji: asTeam ? '🤝' : '🍿', cost: asTeam ? 500 : 100,
                   note:'', team: !!asTeam };

  var api = openModal({
    title: isNew ? (asTeam ? 'New family reward' : 'New reward') : 'Edit reward',
    sub: 'Rewards work best when your children help choose them',
    body:
      '<div class="field"><label>Reward</label>' +
        '<input class="inp" id="rw-name" value="' + esc(r.name) + '" placeholder="Movie night pick"></div>' +
      '<div class="field"><label>Who is it for?</label>' +
        '<div class="row" data-picker="who">' +
          '<button class="chip' + (r.team ? '' : ' on') + '" data-pick="one">⭐ One child</button>' +
          '<button class="chip' + (r.team ? ' on' : '') + '" data-pick="team">🤝 The whole family</button>' +
        '</div>' +
        '<div class="hint">A child pays from their own stars; a family reward comes out of the team pot ' +
        'that the chores fill.</div></div>' +
      '<div class="f2">' +
        '<div class="field"><label>Costs (stars)</label>' +
          '<input class="inp" id="rw-cost" type="number" min="1" value="' + r.cost + '"></div>' +
        '<div class="field"><label>Small print</label>' +
          '<input class="inp" id="rw-note" value="' + esc(r.note || '') + '" placeholder="One weekend night"></div>' +
      '</div>' +
      '<div class="field mb0"><label>Picture</label>' +
        '<div class="emojiscroll">' + emojiPickerGrouped(REWARD_EMOJI_GROUPS, r.emoji, 'emoji') + '</div></div>',
    foot:
      (isNew ? '' : '<button class="btn btn-danger left" data-action="reward-del:' + r.id + '">' + icon('trash', 'i-sm') + 'Delete</button>') +
      '<button class="btn" data-close="1">Cancel</button>' +
      '<button class="btn btn-primary" id="rw-save">' + (isNew ? 'Add reward' : 'Save') + '</button>'
  });
  wirePickers(api.el, ['emoji', 'who']);
  $('#rw-save', api.el).addEventListener('click', function(){
    var name = $('#rw-name', api.el).value.trim();
    if (!name){ toast('Give it a name first', 'warn'); return; }
    var patch = {
      name: name,
      emoji: pickedOne(api.el, 'emoji') || '🍿',
      cost: Math.max(1, +$('#rw-cost', api.el).value || 1),
      note: $('#rw-note', api.el).value.trim(),
      team: pickedOne(api.el, 'who') === 'team'
    };
    if (isNew) addReward(patch); else updateReward(r.id, patch);
    api.close(); render();
    toast(isNew ? 'Reward added' : 'Saved', 'ok', patch.emoji);
  });
  return api;
}

function redeemModal(rewardId){
  var r = rewardById(rewardId);
  if (!r) return;
  var lim = rewardLimit();
  /* a family reward is paid by the team, so there is nobody to choose */
  var team = !!r.team;
  var eligible = team ? [] : DB.kids.filter(function(k){ return canRedeem(k.id, r.id).ok; });
  var chosen = team ? TEAM_ID : (eligible.length ? eligible[0].id : null);

  var api = openModal({
    title: r.emoji + ' ' + esc(r.name),
    sub: 'Costs ' + r.cost + (team ? ' team stars' : ' stars') + (r.note ? ' &middot; ' + esc(r.note) : ''),
    size: 'narrow',
    body: (team
      ? '<div class="field mb0">' +
          '<div class="radio on k0"><span class="mark"></span><span style="font-size:26px">🤝</span>' +
            '<span class="grow"><span class="bold">The whole family</span>' +
            '<span class="tiny faint" style="display:block">' + teamBank() + ' in the pot' +
            (lim ? ' &middot; ' + rewardsLeft(TEAM_ID) + ' of ' + lim + ' left this month' : '') +
            '</span></span>' + teamPill(teamBank()) + '</div>' +
          '<div class="hint" style="margin-top:10px">Chores fill this pot. Nobody’s own stars are ' +
          'touched.</div></div>'
      : '<div class="field mb0"><label>Who is cashing in?</label>' +
      DB.kids.map(function(k){
        var bank = starBank(k.id), left = rewardsLeft(k.id), can = canRedeem(k.id, r.id);
        return '<button class="radio ' + k.color + (k.id === chosen ? ' on' : '') + '" data-pick2="' + k.id + '"' +
               (can.ok ? '' : ' disabled style="opacity:.45"') + '>' +
          '<span class="mark"></span><span style="font-size:26px">' + k.emoji + '</span>' +
          '<span class="grow"><span class="bold">' + esc(k.name) + '</span>' +
          '<span class="tiny faint" style="display:block">' + bank + ' banked' +
          (can.why === 'stars' ? ' - needs ' + (r.cost - bank) + ' more'
           : can.why === 'limit' ? ' - used this month’s ' + lim + ' already'
           : lim ? ' &middot; ' + left + ' of ' + lim + ' left this month' : '') +
          '</span></span>' + starPill(bank) + '</button>';
      }).join('') +
      (DB.settings.parentApproves
        ? '<div class="hint" style="margin-top:10px">This will wait for your approval on the Rewards screen.</div>'
        : '<div class="hint" style="margin-top:10px">Approval is off, so this is deducted straight away.</div>') +
      '</div>'),
    foot: '<button class="btn" data-close="1">Cancel</button>' +
          '<button class="btn btn-gold" id="do-redeem"' + (chosen ? '' : ' disabled') + '>⭐ Cash in</button>'
  });

  api.el.addEventListener('click', function(e){
    var b = e.target.closest('[data-pick2]');
    if (b && !b.disabled){
      $$('.radio', api.el).forEach(function(x){ x.classList.remove('on'); });
      b.classList.add('on');
      chosen = b.getAttribute('data-pick2');
      $('#do-redeem', api.el).disabled = false;
    }
    if (e.target.closest('#do-redeem') && chosen){
      var rec = redeem(chosen, r.id);
      if (!rec){
        var why = canRedeem(chosen, r.id);
        toast(why.why === 'limit'
          ? kname(chosen) + ' has already had ' + rewardLimit() + ' this month'
          : 'Not enough stars for that yet', 'warn');
        return;
      }
      api.close(); render();
      toast(rec.status === 'pending'
        ? kname(chosen) + ' asked for ' + r.name
        : kname(chosen) + ' cashed in ' + r.name + '!', 'gold', r.emoji);
    }
  });
}

function spendModal(kidId){
  var bank = starBank(kidId);
  var k = kid(kidId);
  openModal({
    title: k.emoji + ' ' + esc(k.name) + '&rsquo;s stars',
    sub: bank + ' banked',
    body: (rewardLimit()
      ? '<div class="hint" style="margin-bottom:12px">' + rewardsLeft(kidId) + ' of ' +
        rewardLimit() + ' rewards left this month. Family outings come out of the team pot instead.</div>'
      : '') +
      '<div class="grid-3">' + DB.rewards.filter(function(r){ return !r.team; }).map(function(r){
      var can = canRedeem(kidId, r.id), locked = !can.ok;
      return '<div class="rewardcard' + (locked ? ' locked' : '') + '">' +
        '<span class="em">' + r.emoji + '</span>' +
        '<div class="bold sm">' + esc(r.name) + '</div>' + starPill(r.cost) +
        '<button class="btn btn-sm btn-block ' + (locked ? '' : 'btn-gold') + '" data-action="redeem:' + r.id + '"' +
          (locked ? ' disabled' : '') + '>' +
          (can.why === 'stars' ? (r.cost - bank) + ' more' : can.why === 'limit' ? 'None left' : 'Cash in') +
        '</button>' +
      '</div>';
    }).join('') + '</div>',
    foot: '<button class="btn" data-close="1">Close</button>'
  });
}

/* ---------------- data export / import ---------------- */
function exportModal(){
  openModal({
    title: 'Your data',
    sub: 'Everything Hearth has stored in this browser',
    body: '<div class="field mb0"><label>Copy this somewhere safe</label>' +
          '<textarea class="inp" id="ex-text" style="min-height:260px;font-family:ui-monospace,monospace;font-size:12px">' +
          esc(exportDB()) + '</textarea></div>',
    foot: '<button class="btn" data-close="1">Close</button>' +
          '<button class="btn btn-primary" id="ex-copy">' + icon('copy', 'i-sm') + 'Select all</button>',
    onMount: function(api){
      $('#ex-copy', api.el).addEventListener('click', function(){
        var t = $('#ex-text', api.el);
        t.focus(); t.select();
        toast('Selected - press Ctrl+C to copy', 'ok');
      });
    }
  });
}
function importModal(){
  var api = openModal({
    title: 'Restore a backup',
    sub: 'This replaces everything currently stored',
    body: '<div class="field mb0"><label>Paste a Hearth backup</label>' +
          '<textarea class="inp" id="im-text" style="min-height:220px;font-family:ui-monospace,monospace;font-size:12px" ' +
          'placeholder="{ &quot;version&quot;: 2, ... }"></textarea></div>',
    foot: '<button class="btn" data-close="1">Cancel</button>' +
          '<button class="btn btn-primary" id="im-go">Restore</button>'
  });
  $('#im-go', api.el).addEventListener('click', function(){
    try {
      importDB($('#im-text', api.el).value);
      api.close(); render();
      toast('Backup restored', 'ok', '💾');
    } catch (err){
      toast(err.message || 'That did not parse', 'warn');
    }
  });
}

/* ---------------- sync status ---------------- */
function syncInfoModal(){
  var C = window.HearthCloud;
  var body, foot = '<button class="btn" data-close="1">Close</button>';

  if (!C && !HearthSync.isCloudHost()){
    body =
      '<p class="sm muted" style="margin-top:0">This address keeps everything on this device. The cloud version ' +
      'syncs Routine, Rewards, Calendar and Kids between every device you sign in on.</p>' +
      '<p class="sm muted"><b>Move to cloud</b> opens <b>homeschool-7b68e.firebaseapp.com</b> and brings this ' +
      'device&rsquo;s data along. If the family is already in the cloud you&rsquo;ll be asked which copy to keep.</p>' +
      '<p class="sm muted" style="margin-bottom:0">On an iPad, add the new address to the Home Screen afterwards.</p>';
    foot = '<button class="btn" data-close="1">Not now</button>' +
           '<button class="btn btn-primary" data-action="sync-handoff">☁️ Move to cloud</button>';
  } else if (!C){
    body = window.HearthCloudFailed
      ? '<p class="sm muted" style="margin-top:0">Sync could not load - usually because this device is offline. ' +
        'The board still works; changes are kept here. Reload once you&rsquo;re back online.</p>'
      : '<p class="sm muted" style="margin-top:0">Still connecting to the cloud&hellip;</p>';
  } else {
    var rows = {
      synced:  ['☁️', 'Synced', 'Changes here reach your other signed-in devices within a second or two.'],
      saving:  ['☁️', 'Saving', 'Sending your latest change.'],
      connecting: ['⏳', 'Connecting', 'Getting the latest family data. The board still works in the meantime.'],
      offline: ['📴', 'Offline', 'Changes are kept on this device and sync automatically once it&rsquo;s back online.'],
      denied:  ['⚠️', 'No access', esc(C.email) + ' was refused by the database rules. ' +
                 (C.error ? esc(C.error) + ' ' : '') + 'Either this account is not on the family list, or the rules need redeploying.'],
      error:   ['⚠️', 'Sync problem', esc(C.error || 'Something went wrong talking to the cloud.')],
      'signed-out': ['🔒', 'Not signed in', 'This device keeps its changes to itself until you sign in.']
    };
    var r = rows[C.status] || rows.error;
    body =
      '<div class="row" style="gap:14px;margin-bottom:6px"><span style="font-size:36px">' + r[0] + '</span>' +
      '<div class="grow"><div class="bold lg">' + r[1] + '</div>' +
      (C.email ? '<div class="sm faint">' + esc(C.email) + '</div>' : '') + '</div></div>' +
      '<p class="sm muted">' + r[2] + '</p>' +
      '<p class="tiny faint" style="margin-bottom:0">Stored in Google Firestore (us-west1). Theme, sound and the ' +
      'hidden-menu setting stay per device.</p>';
    foot = C.user
      ? '<button class="btn btn-danger left" data-action="sync-signout">Sign out</button><button class="btn" data-close="1">Close</button>'
      : '<button class="btn" data-close="1">Close</button><button class="btn btn-primary" data-action="sync-signin">Sign in with Google</button>';
  }

  openModal({ title: 'Sync', sub: 'Sharing this family between devices', size: 'narrow', body: body, foot: foot });
}
