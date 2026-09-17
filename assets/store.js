/* ============================================================
   Browser-backed store.
   Everything the FUNCTIONAL pages (Kids, Routine, Rewards,
   Calendar and their settings) read or write lives in DB and is
   persisted to localStorage. Nothing here talks to a server.
   ============================================================ */

var STORE_KEY = 'hearth.db.v2';
var DB = null;

function uid(prefix){
  return (prefix || 'x') + Date.now().toString(36).slice(-4) + Math.random().toString(36).slice(2, 7);
}

/* ---------------- seed ----------------
   The family configuration a fresh browser starts with, and what
   Settings -> Reset restores. Dates here are real dates, not offsets. */
function seedDB(){
  return {
    version: 2,
    kids: [
      {
        id:'k1',
        name:'Hannah',
        grade:'Grade 4',
        age:9,
        color:'k2',
        emoji:'🐬',
        openingStars:0,
        streak:6,
        lang:'en',
        likes:'Building things, soccer, dinosaurs',
        goals:['Read 20 minutes every day', 'Know all the times tables']
      },
      {
        id:'k2',
        name:'Juan',
        grade:'Grade 1',
        age:6,
        color:'k6',
        emoji:'🦋',
        openingStars:0,
        streak:4,
        lang:'en',
        likes:'Ballet, drawing, animal books',
        goals:['Read a whole chapter book', 'Count to 200']
      },
      {
        id:'k3',
        name:'Ian',
        grade:'Pre-K',
        age:4,
        color:'k3',
        emoji:'🐨',
        openingStars:0,
        streak:9,
        lang:'ko',
        likes:'Playdough, singing, the sandbox',
        goals:['Sound out three-letter words', 'Write all my letters']
      }
    ],
    tasks: [
      {
        id:'t1',
        title:'Wake up & make bed',
        emoji:'⏰',
        slot:'morning',
        stars:5,
        kind:'routine',
        kids:['k1', 'k2', 'k3'],
        days:[0,1,2,3,4,5,6],
        titles:{ ko:'일어나서 이불 정리하기' }
      },
      {
        id:'t2',
        title:'Get dressed',
        emoji:'👕',
        slot:'morning',
        stars:5,
        kind:'routine',
        kids:['k3'],
        days:[0,1,2,3,4,5,6],
        titles:{ ko:'옷 입기' }
      },
      {
        id:'t3',
        title:'Brush teeth',
        emoji:'🦷',
        slot:'morning',
        stars:5,
        kind:'routine',
        kids:['k1', 'k2', 'k3'],
        days:[0,1,2,3,4,5,6],
        titles:{ ko:'이 닦기' }
      },
      {
        id:'t6',
        title:'Water the plant',
        emoji:'🪴',
        slot:'midday',
        stars:5,
        kind:'chore',
        kids:['k1'],
        days:[0,2,4,6],
        titles:{ ko:'화분에 물 주기' }
      },
      {
        id:'t7',
        title:'QT',
        emoji:'📖',
        slot:'morning',
        stars:10,
        kind:'routine',
        kids:['k1', 'k2', 'k3'],
        days:[0,1,2,3,4],
        titles:null
      },
      {
        id:'t11',
        title:'Reading Time',
        emoji:'📚',
        slot:'evening',
        stars:5,
        kind:'routine',
        kids:['k1', 'k2', 'k3'],
        days:[0,1,2,3,4],
        titles:{ ko:'어른과 함께 책 읽기' }
      },
      {
        id:'t12',
        title:'Activities with brothers',
        emoji:'🎨',
        slot:'midday',
        stars:10,
        kind:'chore',
        kids:['k1'],
        days:[0,1,2,3,4,5],
        titles:{ ko:'현관 쓸기' }
      },
      {
        id:'t13',
        title:'Family Meeting',
        emoji:'☀️',
        slot:'evening',
        stars:5,
        kind:'routine',
        kids:['k1', 'k2', 'k3'],
        days:[6],
        titles:{ ko:'가족 회의' }
      },
      {
        id:'t14',
        title:'Set the table',
        emoji:'🍴',
        slot:'evening',
        stars:5,
        kind:'chore',
        kids:['k1', 'k2', 'k3'],
        days:[0,1,2,3,4,5,6],
        titles:{ ko:'식탁 차리기' }
      },
      {
        id:'t16',
        title:'Put the toys away',
        emoji:'🧸',
        slot:'evening',
        stars:5,
        kind:'chore',
        kids:['k1', 'k2', 'k3'],
        days:[0,1,2,3,4,5,6],
        titles:{ ko:'장난감 정리하기' }
      },
      {
        id:'t17',
        title:'Laundry in the basket',
        emoji:'🧺',
        slot:'evening',
        stars:10,
        kind:'chore',
        kids:['k1', 'k2', 'k3'],
        days:[1,3,5],
        titles:{ ko:'빨래 바구니에 넣기' }
      },
      {
        id:'t18',
        title:'Pack tomorrow’s bag',
        emoji:'🎒',
        slot:'evening',
        stars:5,
        kind:'routine',
        kids:['k1', 'k2', 'k3'],
        days:[0,1,2,3],
        titles:{ ko:'내일 가방 싸기' }
      },
      {
        id:'t19',
        title:'Pajamas & teeth',
        emoji:'🌙',
        slot:'evening',
        stars:5,
        kind:'routine',
        kids:['k1', 'k2', 'k3'],
        days:[0,1,2,3,4,5,6],
        titles:{ ko:'잠옷 입고 이 닦기' }
      },
      {
        id:'t20',
        title:'Tidy your room',
        emoji:'🛏️',
        slot:'midday',
        stars:5,
        kind:'chore',
        kids:['k1'],
        days:[0,1,2,3,4],
        titles:{ ko:'방 정리하기' }
      },
      {
        id:'t3yevb0alp',
        title:'Exercise',
        emoji:'⚽',
        slot:'evening',
        stars:5,
        kind:'routine',
        kids:['k1', 'k2', 'k3'],
        days:[0,1,2,3,4],
        titles:{ ko:'운동하기' }
      }
    ],
    events: [
      {
        id:'e2',
        title:'Math',
        sk:'math',
        kids:['k1'],
        days:[0,2,4],
        start:600,
        dur:40,
        date:null,
        titles:{ ko:'수학' }
      },
      {
        id:'e8',
        title:'Spritual Diary',
        sk:'write',
        kids:['k1', 'k2', 'k3'],
        days:[0,1,2,3,4,5,6],
        start:1200,
        dur:30,
        date:null,
        titles:{ ko:'영성일기' }
      },
      {
        id:'e21',
        title:'Field trip: the aquarium',
        sk:'sci',
        kids:['k1', 'k2', 'k3'],
        date:'2026-09-06',
        start:570,
        dur:210,
        titles:{ ko:'현장학습: 수족관' }
      },
      {
        id:'e22',
        title:'Library story hour',
        sk:'read',
        kids:['k2', 'k3'],
        date:'2026-09-13',
        start:630,
        dur:60,
        titles:{ ko:'도서관 이야기 시간' }
      }
    ],
    rewards: [
      { id:'w1', name:'Movie night pick', emoji:'🍿', cost:120, note:'You choose the film' },
      { id:'w2', name:'Stay up 30 min', emoji:'🌙', cost:160, note:'One weekend night' },
      { id:'w3', name:'Pick dinner', emoji:'🍕', cost:200, note:'Anything we can cook' },
      { id:'w4', name:'Park afternoon', emoji:'🛝', cost:240, note:'Two hours, your choice' },
      { id:'w5', name:'Ice cream trip', emoji:'🍦', cost:300, note:'Two scoops' },
      { id:'w6', name:'A new book', emoji:'📚', cost:400, note:'Bookshop, you pick' },
      { id:'w7', name:'Toy shop visit', emoji:'🧸', cost:800, note:'Up to $10' },
      { id:'w8', name:'Friend sleepover', emoji:'🎪', cost:1000, note:'Invite one friend' },
      /* team rewards - the whole family goes, paid out of the team pot */
      { id:'g1', name:'Serve together day', emoji:'🤝', cost:300,  note:'Food bank, church or a neighbour', team:true },
      { id:'g2', name:'Nature hike & picnic', emoji:'🥾', cost:400,  note:'Pack lunch, pick a trail', team:true },
      { id:'g3', name:'Pizza & film night', emoji:'🍕', cost:500,  note:'Everyone votes on the film', team:true },
      { id:'g4', name:'STEM activity', emoji:'🔬', cost:600,  note:'A science kit or experiment day', team:true },
      { id:'g5', name:'Bowling afternoon', emoji:'🎳', cost:700,  note:'Two games each', team:true },
      { id:'g6', name:'Eating out', emoji:'🍔', cost:800,  note:'Family dinner, you choose where', team:true },
      { id:'g7', name:'Maker workshop', emoji:'🎨', cost:900,  note:'Art, pottery or building day', team:true },
      { id:'g8', name:'Museum field trip', emoji:'🏛️', cost:1200, note:'Science centre, zoo or aquarium', team:true },
      { id:'g9', name:'Family camp-out', emoji:'⛺', cost:1500, note:'A night under canvas', team:true }
    ],
    redemptions: [],
    completions: {},
    eventDone: {},
    exceptions: {},
    settings: {
      schoolName:'Bennett Family Academy',
      yearStart:'2026-03-20',
      targetDays:180,
      schoolDays:[0,1,2,3,4],
      starRoutine:5,
      starChore:10,
      carryOver:true,
      parentApproves:true,
      stateCode:'PA',
      theme:'auto',
      sound:true,
      effects:true,
      showTips:true,
      tipsOff:['t-routine', 't-kids'],
      seenWelcome:true,
      railHidden:false,
      rewardCostsDoubled:true,
      rewardsPerMonth:1,
      teamRewardsAdded:true
    }
  };
}

/* ---------------- load / save ---------------- */
/* fill in anything a newer version expects: settings added since this copy
   was saved, and every section present even if empty */
function normaliseDB(db){
  var fresh = seedDB();
  db.settings = db.settings || {};
  /* One-time: reward prices were doubled in September 2026. This runs before
     defaults are filled in, so data saved before then - on any device, or
     already in the cloud - is doubled exactly once, and the flag syncs so no
     other device doubles it again. */
  if (!Object.prototype.hasOwnProperty.call(db.settings, 'rewardCostsDoubled')){
    (db.rewards || []).forEach(function(r){ r.cost = (+r.cost || 0) * 2; });
    db.settings.rewardCostsDoubled = true;
  }
  /* One-time: rewards the whole family shares arrived in September 2026.
     Added by name, so a family that already invented their own "Eating out"
     keeps theirs. The flag syncs, so no device adds them twice. */
  if (!db.settings.teamRewardsAdded){
    db.rewards = db.rewards || [];
    var had = {};
    db.rewards.forEach(function(r){ had[String(r.name || '').toLowerCase()] = true; });
    fresh.rewards.forEach(function(r){
      if (r.team && !had[r.name.toLowerCase()]) db.rewards.push(r);
    });
    db.settings.teamRewardsAdded = true;
  }
  for (var k in fresh.settings)
    if (!Object.prototype.hasOwnProperty.call(db.settings, k)) db.settings[k] = fresh.settings[k];
  ['kids', 'tasks', 'events', 'rewards', 'redemptions'].forEach(function(s){ db[s] = db[s] || []; });
  ['completions', 'eventDone', 'exceptions'].forEach(function(s){ db[s] = db[s] || {}; });
  db.version = db.version || 2;
  return db;
}
function loadDB(){
  try {
    var raw = localStorage.getItem(STORE_KEY);
    if (raw){
      var parsed = JSON.parse(raw);
      if (parsed && parsed.version === 2) return normaliseDB(parsed);
    }
  } catch (e){}
  return seedDB();
}
/* Every mutation ends here. The local copy is written first so the device
   keeps working offline; if cloud sync is signed in, the changed fields go
   up too (cloud.js works out which). */
function saveDB(){
  var ok = true;
  try { localStorage.setItem(STORE_KEY, JSON.stringify(DB)); } catch (e){ ok = false; }
  if (window.HearthCloud && window.HearthCloud.push) window.HearthCloud.push();
  return ok;
}
/* Swap in data that arrived from the cloud. Does not push it back. */
function replaceDB(next){
  DB = normaliseDB(next);
  backfillSeedTitles(DB);
  try { localStorage.setItem(STORE_KEY, JSON.stringify(DB)); } catch (e){}
}
function resetDB(){ DB = seedDB(); saveDB(); }

/* Translations for the sample routines and events were added after v2 first
   shipped, so a browser that saved data before then still holds English-only
   titles. Copy them across on load - but never onto an item the parent has
   renamed or already given a translation, so edits are preserved. */
function backfillSeedTitles(db){
  var seed = seedDB(), byKey = {}, filled = 0;
  seed.tasks.forEach(function(x){ byKey['t|' + x.id] = x; });
  seed.events.forEach(function(x){ byKey['e|' + x.id] = x; });

  function fill(list, prefix){
    (list || []).forEach(function(item){
      var s = byKey[prefix + '|' + item.id];
      if (!s || !s.titles) return;                       /* not a seed item */
      if (item.titles && item.titles.ko) return;          /* already translated */
      if (item.title !== s.title) return;                 /* renamed - leave alone */
      item.titles = { ko: s.titles.ko };
      filled++;
    });
  }
  fill(db.tasks, 't');
  fill(db.events, 'e');
  return filled;
}

DB = loadDB();
if (backfillSeedTitles(DB)) saveDB();

/* ---------------- kids ---------------- */
function allKids(){ return DB.kids; }
function kid(id){
  for (var i = 0; i < DB.kids.length; i++) if (DB.kids[i].id === id) return DB.kids[i];
  return null;
}
function kname(id){
  if (id === TEAM_ID) return 'The team';
  var k = kid(id); return k ? k.name : 'Someone';
}
function kidIds(){ return DB.kids.map(function(k){ return k.id; }); }

function addKid(o){
  o.id = uid('k');
  o.openingStars = o.openingStars || 0;
  o.lang = o.lang || 'en';
  o.streak = 0;
  o.goals = o.goals || [];
  DB.kids.push(o); saveDB(); return o;
}
function updateKid(id, patch){
  var k = kid(id); if (!k) return;
  for (var p in patch) k[p] = patch[p];
  saveDB();
}
function removeKid(id){
  DB.kids = DB.kids.filter(function(k){ return k.id !== id; });
  DB.tasks.forEach(function(t){ t.kids = t.kids.filter(function(x){ return x !== id; }); });
  DB.tasks = DB.tasks.filter(function(t){ return t.kids.length; });
  DB.events.forEach(function(e){ e.kids = e.kids.filter(function(x){ return x !== id; }); });
  DB.events = DB.events.filter(function(e){ return e.kids.length; });
  DB.redemptions = DB.redemptions.filter(function(r){ return r.kid !== id; });
  Object.keys(DB.completions).forEach(function(key){
    if (key.split('|')[0] === id) delete DB.completions[key];
  });
  saveDB();
}

/* ---------------- tasks (routines + chores) ---------------- */
function taskById(id){
  for (var i = 0; i < DB.tasks.length; i++) if (DB.tasks[i].id === id) return DB.tasks[i];
  return null;
}
function addTask(o){ o.id = uid('t'); DB.tasks.push(o); saveDB(); return o; }
function updateTask(id, patch){
  var t = taskById(id); if (!t) return;
  for (var p in patch) t[p] = patch[p];
  saveDB();
}
function removeTask(id){
  DB.tasks = DB.tasks.filter(function(t){ return t.id !== id; });
  Object.keys(DB.completions).forEach(function(key){
    if (key.split('|')[1] === id) delete DB.completions[key];
  });
  saveDB();
}
/* tasks for one child on one date, optionally in one slot */
function tasksFor(kidId, dateObj, slot){
  var wd = monIdx(dateObj);
  return DB.tasks.filter(function(t){
    return t.kids.indexOf(kidId) > -1 &&
           (!t.days || t.days.indexOf(wd) > -1) &&
           (!slot || t.slot === slot);
  });
}

function compKey(kidId, taskId, dateObj){ return kidId + '|' + taskId + '|' + ymd(dateObj); }
function isTaskDone(kidId, taskId, dateObj){ return !!DB.completions[compKey(kidId, taskId, dateObj)]; }
function toggleTask(kidId, taskId, dateObj){
  var key = compKey(kidId, taskId, dateObj);
  if (DB.completions[key]) delete DB.completions[key];
  else DB.completions[key] = true;
  saveDB();
  return !!DB.completions[key];
}

/* ---------------- events (calendar only) ---------------- */
function eventById(id){
  for (var i = 0; i < DB.events.length; i++) if (DB.events[i].id === id) return DB.events[i];
  return null;
}
function addEvent(o){ o.id = uid('e'); DB.events.push(o); saveDB(); return o; }
function updateEvent(id, patch){
  var e = eventById(id); if (!e) return;
  for (var p in patch) e[p] = patch[p];
  saveDB();
}
function removeEvent(id){
  DB.events = DB.events.filter(function(e){ return e.id !== id; });
  delete DB.exceptions[id];
  saveDB();
}
/* stop a repeating event from the given date onwards */
function endSeriesBefore(id, dateObj){
  updateEvent(id, { until: ymd(addDays(dateObj, -1)) });
}
function skipOccurrence(id, dateObj){
  var key = ymd(dateObj);
  DB.exceptions[id] = DB.exceptions[id] || [];
  if (DB.exceptions[id].indexOf(key) === -1) DB.exceptions[id].push(key);
  saveDB();
}
/* every event occurring on a date, expanded from weekly rules + one-offs */
function eventsOn(dateObj, ignoreFilter){
  var wd = monIdx(dateObj), key = ymd(dateObj), out = [];
  DB.events.forEach(function(e){
    var occurs = e.date ? (e.date === key) : (e.days && e.days.indexOf(wd) > -1);
    if (!occurs) return;
    if (e.until && key > e.until) return;
    if (DB.exceptions[e.id] && DB.exceptions[e.id].indexOf(key) > -1) return;
    out.push({
      id:e.id, key:e.id + '|' + key, title:e.title, titles:e.titles, sk:e.sk, kids:e.kids,
      start:e.start, dur:e.dur, date:dateObj, ymd:key, recurring:!e.date
    });
  });
  out = out.filter(function(e){ return ignoreFilter || passesFilter(e); });
  return out.sort(function(a, b){ return a.start - b.start; });
}
function isEventDone(evKey){ return !!DB.eventDone[evKey]; }
function toggleEventDone(evKey){
  if (DB.eventDone[evKey]) delete DB.eventDone[evKey];
  else DB.eventDone[evKey] = true;
  saveDB();
  return !!DB.eventDone[evKey];
}

/* ---------------- rewards + stars ---------------- */
function rewardById(id){
  for (var i = 0; i < DB.rewards.length; i++) if (DB.rewards[i].id === id) return DB.rewards[i];
  return null;
}
function addReward(o){ o.id = uid('w'); DB.rewards.push(o); saveDB(); return o; }
function updateReward(id, patch){
  var r = rewardById(id); if (!r) return;
  for (var p in patch) r[p] = patch[p];
  saveDB();
}
function removeReward(id){
  DB.rewards = DB.rewards.filter(function(r){ return r.id !== id; });
  saveDB();
}

var SLOT_IDS = ['morning', 'midday', 'evening'];

/* what one task is worth to one child - children can earn different
   amounts for the same job, falling back to the task's own value */
function starsFor(task, kidId){
  if (!task) return 0;
  var m = task.starsByKid;
  if (m && m[kidId] != null && m[kidId] !== '') return +m[kidId] || 0;
  return +task.stars || 0;
}

/* Who a task pays. Routines pay the child who ticks them; chores pay the
   family pot instead, in full - a chore is never worth anything to one
   child's own bank. */
function isTeamTask(task){ return !!task && task.kind === 'chore'; }

/* stars a child earned on one date: the routines they ticked */
function starsOn(kidId, dateObj){
  var total = 0;
  tasksFor(kidId, dateObj).forEach(function(t){
    if (isTeamTask(t)) return;
    if (isTaskDone(kidId, t.id, dateObj)) total += starsFor(t, kidId);
  });
  return total;
}
/* the most a child could earn on a date if they did every routine */
function maxStarsOn(kidId, dateObj){
  return tasksFor(kidId, dateObj).reduce(function(a, t){
    return isTeamTask(t) ? a : a + starsFor(t, kidId); }, 0);
}
/* what one child's chores put into the team pot on a date */
function teamStarsFrom(kidId, dateObj){
  var total = 0;
  tasksFor(kidId, dateObj).forEach(function(t){
    if (!isTeamTask(t)) return;
    if (isTaskDone(kidId, t.id, dateObj)) total += starsFor(t, kidId);
  });
  return total;
}
function maxTeamStarsFrom(kidId, dateObj){
  return tasksFor(kidId, dateObj).reduce(function(a, t){
    return isTeamTask(t) ? a + starsFor(t, kidId) : a; }, 0);
}
/* Monday to Sunday around a date */
function weekDays(dateObj){
  var ws = startOfWeek(dateObj), out = [];
  for (var i = 0; i < 7; i++) out.push(addDays(ws, i));
  return out;
}
function starsInWeek(kidId, dateObj){
  return weekDays(dateObj).reduce(function(a, d){ return a + starsOn(kidId, d); }, 0);
}
function maxStarsInWeek(kidId, dateObj){
  return weekDays(dateObj).reduce(function(a, d){ return a + maxStarsOn(kidId, d); }, 0);
}

/* ---- the team pot: every star from every chore, whoever did it ---- */
var TEAM_ID = 'team';
function teamStarsOn(dateObj){
  return DB.kids.reduce(function(a, k){ return a + teamStarsFrom(k.id, dateObj); }, 0);
}
function maxTeamStarsOn(dateObj){
  return DB.kids.reduce(function(a, k){ return a + maxTeamStarsFrom(k.id, dateObj); }, 0);
}
function teamStarsInWeek(dateObj){
  return weekDays(dateObj).reduce(function(a, d){ return a + teamStarsOn(d); }, 0);
}
function maxTeamStarsInWeek(dateObj){
  return weekDays(dateObj).reduce(function(a, d){ return a + maxTeamStarsOn(d); }, 0);
}
/* every chore star ever ticked, honouring the carry-over setting like a bank */
function teamEarnedTotal(){
  var weekStart = startOfWeek(TODAY), total = 0;
  DB.kids.forEach(function(k){
    earnedDates(k.id).forEach(function(key){
      var dt = parseYmd(key);
      if (!DB.settings.carryOver && dt < weekStart) return;
      total += teamStarsFrom(k.id, dt);
    });
  });
  return total;
}
function teamSpent(){
  return DB.redemptions
    .filter(function(r){ return r.kid === TEAM_ID && r.status !== 'denied'; })
    .reduce(function(a, r){ return a + r.cost; }, 0);
}
function teamBank(){ return teamEarnedTotal() - teamSpent(); }
function teamStars(dateObj){
  return {
    today: teamStarsOn(dateObj),
    week:  teamStarsInWeek(dateObj),
    total: teamEarnedTotal(),
    bank:  teamBank()
  };
}
function slotTasks(kidId, dateObj, slot){ return tasksFor(kidId, dateObj, slot); }
function slotComplete(kidId, dateObj, slot){
  var ts = tasksFor(kidId, dateObj, slot);
  if (!ts.length) return false;
  for (var i = 0; i < ts.length; i++) if (!isTaskDone(kidId, ts[i].id, dateObj)) return false;
  return true;
}
function slotProgress(kidId, dateObj, slot){
  var ts = tasksFor(kidId, dateObj, slot);
  var done = 0;
  ts.forEach(function(t){ if (isTaskDone(kidId, t.id, dateObj)) done++; });
  return { done:done, total:ts.length };
}
function dayProgress(kidId, dateObj){
  var ts = tasksFor(kidId, dateObj);
  var done = 0;
  ts.forEach(function(t){ if (isTaskDone(kidId, t.id, dateObj)) done++; });
  return { done:done, total:ts.length };
}

/* every date this child has ticked something, so the bank can be summed */
function earnedDates(kidId){
  var seen = {};
  Object.keys(DB.completions).forEach(function(key){
    var p = key.split('|');
    if (p[0] === kidId) seen[p[2]] = true;
  });
  return Object.keys(seen);
}
function parseYmd(s){ var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }

/* total stars earned, honouring the "carry over each week" setting */
function starsEarnedTotal(kidId){
  var weekStart = startOfWeek(TODAY);
  var total = 0;
  earnedDates(kidId).forEach(function(key){
    var dt = parseYmd(key);
    if (!DB.settings.carryOver && dt < weekStart) return;
    total += starsOn(kidId, dt);
  });
  return total;
}
function starsSpent(kidId){
  return DB.redemptions
    .filter(function(r){ return r.kid === kidId && r.status !== 'denied'; })
    .reduce(function(a, r){ return a + r.cost; }, 0);
}
function starBank(kidId){
  var k = kid(kidId);
  if (!k) return 0;
  var opening = DB.settings.carryOver ? (+k.openingStars || 0) : 0;
  return opening + starsEarnedTotal(kidId) - starsSpent(kidId);
}

/* A bank belongs to a child, or to the team - the team spends chore stars. */
function bankFor(who){ return who === TEAM_ID ? teamBank() : starBank(who); }

/* How many rewards one child (or the team) may still cash in this month.
   0 in Settings means no limit at all. */
function rewardLimit(){
  var n = DB.settings.rewardsPerMonth;
  return n == null ? 1 : Math.max(0, +n || 0);
}
function redemptionsInMonth(who, monthKey){
  return DB.redemptions.filter(function(r){
    if (r.kid !== who || r.status === 'denied') return false;
    return String(r.onYmd || (r.at || '').slice(0, 10)).slice(0, 7) === monthKey;
  });
}
function rewardsLeft(who, dateObj){
  var lim = rewardLimit();
  if (!lim) return Infinity;
  return Math.max(0, lim - redemptionsInMonth(who, ymd(dateObj || TODAY).slice(0, 7)).length);
}
/* every reason a Cash in button might not work, so the UI can say which */
function canRedeem(who, rewardId){
  var r = rewardById(rewardId);
  if (!r) return { ok:false, why:'gone' };
  if (!!r.team !== (who === TEAM_ID)) return { ok:false, why:'wrong-purse' };
  if (bankFor(who) < r.cost) return { ok:false, why:'stars', short: r.cost - bankFor(who) };
  if (!rewardsLeft(who)) return { ok:false, why:'limit', limit: rewardLimit() };
  return { ok:true };
}

function redeem(kidId, rewardId){
  var r = rewardById(rewardId);
  if (!r || !canRedeem(kidId, rewardId).ok) return null;
  var rec = {
    id: uid('r'), kid:kidId, rewardId:r.id, name:r.name, emoji:r.emoji, cost:r.cost,
    at: new Date().toISOString(),
    onYmd: ymd(TODAY),          /* the day it was cashed in, in local time */
    doneOn: null,               /* the day it was actually collected */
    status: DB.settings.parentApproves ? 'pending' : 'approved'
  };
  DB.redemptions.push(rec); saveDB();
  return rec;
}
/* Rewards a child still owes themselves. An approved redemption appears on the
   board from the day it was cashed in and carries forward until it is ticked;
   once ticked it shows only on the day it was collected. Stars left the bank at
   redemption time either way. */
function rewardsDue(kidId, dateObj){
  var key = ymd(dateObj);
  return DB.redemptions.filter(function(r){
    if (r.kid !== kidId || r.status !== 'approved') return false;
    var from = r.onYmd || (r.at || '').slice(0, 10);
    if (from > key) return false;
    return r.doneOn ? r.doneOn === key : true;
  });
}
function isRedemptionDone(r){ return !!r.doneOn; }
function toggleRedemptionDone(id, dateObj){
  var out = false;
  DB.redemptions.forEach(function(r){
    if (r.id !== id) return;
    r.doneOn = r.doneOn ? null : ymd(dateObj);
    out = !!r.doneOn;
  });
  saveDB();
  return out;
}
function setRedemptionStatus(id, status){
  DB.redemptions.forEach(function(r){ if (r.id === id) r.status = status; });
  saveDB();
}

/* ---------------- settings ---------------- */
function setSetting(key, value){ DB.settings[key] = value; saveDB(); }

function exportDB(){ return JSON.stringify(DB, null, 2); }
function importDB(text){
  var parsed = JSON.parse(text);
  if (!parsed || !parsed.version) throw new Error('That does not look like a Hearth backup.');
  DB = parsed; saveDB();
}
