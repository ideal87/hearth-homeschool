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

/* ---------------- seed ---------------- */
function seedDB(){
  var d = function(off){ return ymd(addDays(TODAY, off)); };
  return {
    version: 2,
    kids: [
      { id:'k1', name:'Eli',  grade:'Grade 4',      age:9, color:'k1', emoji:'🦊', openingStars:245, streak:6, lang:'en',
        likes:'Building things, soccer, dinosaurs',
        goals:['Read 20 minutes every day', 'Know all the times tables'] },
      { id:'k2', name:'Maya', grade:'Grade 1',      age:6, color:'k2', emoji:'🐰', openingStars:180, streak:4, lang:'ko',
        likes:'Ballet, drawing, animal books',
        goals:['Read a whole chapter book', 'Count to 200'] },
      { id:'k3', name:'Nora', grade:'Kindergarten', age:5, color:'k3', emoji:'🐻', openingStars:120, streak:9, lang:'en',
        likes:'Playdough, singing, the sandbox',
        goals:['Sound out three-letter words', 'Write all my letters'] }
    ],

    /* routines + chores. days = weekdays it applies (0 = Monday) */
    tasks: [
      { id:'t1',  title:'Wake up & make bed',   emoji:'⏰', slot:'morning', stars:5,  kind:'routine', kids:['k1','k2','k3'], days:[0,1,2,3,4,5,6], titles:{ko:'일어나서 이불 정리하기'} },
      { id:'t2',  title:'Get dressed',          emoji:'👕', slot:'morning', stars:5,  kind:'routine', kids:['k1','k2','k3'], days:[0,1,2,3,4,5,6], titles:{ko:'옷 입기'} },
      { id:'t3',  title:'Brush teeth',          emoji:'🦷', slot:'morning', stars:5,  kind:'routine', kids:['k1','k2','k3'], days:[0,1,2,3,4,5,6], titles:{ko:'이 닦기'} },
      { id:'t4',  title:'Eat breakfast',        emoji:'🥣', slot:'morning', stars:5,  kind:'routine', kids:['k1','k2','k3'], days:[0,1,2,3,4,5,6], titles:{ko:'아침 먹기'} },
      { id:'t5',  title:'Feed the dog',         emoji:'🐕', slot:'morning', stars:10, kind:'chore',   kids:['k1','k2'],      days:[0,1,2,3,4,5,6], titles:{ko:'강아지 밥 주기'} },
      { id:'t6',  title:'Water the plant',      emoji:'🪴', slot:'morning', stars:10, kind:'chore',   kids:['k3'],           days:[0,1,2,3,4,5,6], titles:{ko:'화분에 물 주기'} },
      { id:'t7',  title:'Ready for circle time',emoji:'☀️', slot:'morning', stars:10, kind:'routine', kids:['k1','k2','k3'], days:[0,1,2,3,4], titles:{ko:'모임 시간 준비하기'} },

      { id:'t8',  title:'Clear the school table', emoji:'🧹', slot:'midday', stars:10, kind:'chore',   kids:['k1','k2','k3'], days:[0,1,2,3,4], titles:{ko:'공부 책상 정리하기'} },
      { id:'t9',  title:'Lunch dishes to sink',   emoji:'🍽️', slot:'midday', stars:5,  kind:'chore',   kids:['k1','k2','k3'], days:[0,1,2,3,4,5,6], titles:{ko:'점심 그릇 싱크대에 넣기'} },
      { id:'t10', title:'Read 20 minutes',        emoji:'📖', slot:'midday', stars:15, kind:'routine', kids:['k1'],           days:[0,1,2,3,4,5,6], titles:{ko:'20분 책 읽기'} },
      { id:'t11', title:'Read with a grown-up',   emoji:'📚', slot:'midday', stars:10, kind:'routine', kids:['k2','k3'],      days:[0,1,2,3,4,5,6], titles:{ko:'어른과 함께 책 읽기'} },
      { id:'t12', title:'Sweep the porch',        emoji:'🧹', slot:'midday', stars:15, kind:'chore',   kids:['k1'],           days:[1,3], titles:{ko:'현관 쓸기'} },
      { id:'t13', title:'Put shoes away',         emoji:'👟', slot:'midday', stars:5,  kind:'chore',   kids:['k1','k2','k3'], days:[0,1,2,3,4,5,6], titles:{ko:'신발 정리하기'} },

      { id:'t14', title:'Set the table',          emoji:'🍴', slot:'evening', stars:10, kind:'chore',   kids:['k1'],           days:[0,1,2,3,4,5,6], titles:{ko:'식탁 차리기'} },
      { id:'t15', title:'Fill the water cups',    emoji:'🥤', slot:'evening', stars:10, kind:'chore',   kids:['k2'],           days:[0,1,2,3,4,5,6], titles:{ko:'물컵 채우기'} },
      { id:'t16', title:'Put the toys away',      emoji:'🧸', slot:'evening', stars:10, kind:'chore',   kids:['k3'],           days:[0,1,2,3,4,5,6], titles:{ko:'장난감 정리하기'} },
      { id:'t17', title:'Laundry in the basket',  emoji:'🧺', slot:'evening', stars:10, kind:'chore',   kids:['k1','k2','k3'], days:[0,1,2,3,4,5,6], titles:{ko:'빨래 바구니에 넣기'} },
      { id:'t18', title:'Pack tomorrow’s bag',    emoji:'🎒', slot:'evening', stars:5,  kind:'routine', kids:['k1','k2'],      days:[0,1,2,3,4], titles:{ko:'내일 가방 싸기'} },
      { id:'t19', title:'Pajamas & teeth',        emoji:'🌙', slot:'evening', stars:5,  kind:'routine', kids:['k1','k2','k3'], days:[0,1,2,3,4,5,6], titles:{ko:'잠옷 입고 이 닦기'} },
      { id:'t20', title:'Tidy your room',         emoji:'🛏️', slot:'evening', stars:15, kind:'chore',   kids:['k1','k2','k3'], days:[4,5], titles:{ko:'방 정리하기'} }
    ],

    /* calendar events only - routines and chores are NEVER stored here */
    events: [
      { id:'e1',  title:'Circle time',    sk:'circle', kids:['k1','k2','k3'], days:[0,1,2,3,4], start:540,  dur:30, titles:{ko:'모임 시간'} },
      { id:'e2',  title:'Math',           sk:'math',   kids:['k1'],           days:[0,1,2,3,4], start:575,  dur:40, titles:{ko:'수학'} },
      { id:'e3',  title:'Math',           sk:'math',   kids:['k2'],           days:[0,1,2,3,4], start:575,  dur:25, titles:{ko:'수학'} },
      { id:'e4',  title:'Phonics',        sk:'read',   kids:['k3'],           days:[0,1,2,3,4], start:575,  dur:20, titles:{ko:'파닉스'} },
      { id:'e5',  title:'Reading',        sk:'read',   kids:['k1'],           days:[0,1,2,3,4], start:620,  dur:30, titles:{ko:'읽기'} },
      { id:'e6',  title:'Reading',        sk:'read',   kids:['k2'],           days:[0,1,2,3,4], start:605,  dur:25, titles:{ko:'읽기'} },
      { id:'e7',  title:'Math games',     sk:'math',   kids:['k3'],           days:[0,2,4],     start:605,  dur:20, titles:{ko:'수학 놀이'} },
      { id:'e8',  title:'Writing',        sk:'write',  kids:['k1'],           days:[0,2,4],     start:660,  dur:25, titles:{ko:'글쓰기'} },
      { id:'e9',  title:'Handwriting',    sk:'write',  kids:['k2'],           days:[0,1,2,3,4], start:635,  dur:20, titles:{ko:'글씨 쓰기'} },
      { id:'e10', title:'Art & crafts',   sk:'art',    kids:['k3'],           days:[1,3],       start:635,  dur:30, titles:{ko:'미술과 만들기'} },
      { id:'e11', title:'Read aloud',     sk:'read',   kids:['k1','k2','k3'], days:[0,1,2,3,4], start:690,  dur:30, titles:{ko:'소리 내어 읽기'} },
      { id:'e12', title:'Science',        sk:'sci',    kids:['k1','k2'],      days:[2],         start:780,  dur:45, titles:{ko:'과학'} },
      { id:'e13', title:'History story',  sk:'hist',   kids:['k1','k2','k3'], days:[0],         start:780,  dur:30, titles:{ko:'역사 이야기'} },
      { id:'e14', title:'Outside play',   sk:'out',    kids:['k1','k2','k3'], days:[0,1,2,3,4], start:825,  dur:60, titles:{ko:'바깥 놀이'} },
      { id:'e15', title:'Music & movement', sk:'music', kids:['k1','k2','k3'], days:[1,3],      start:690,  dur:25, titles:{ko:'음악과 율동'} },
      { id:'e16', title:'Co-op at Grace Chapel', sk:'out', kids:['k1','k2','k3'], days:[4],     start:780,  dur:150, titles:{ko:'그레이스 채플 코업'} },
      { id:'e17', title:'Library day',    sk:'read',   kids:['k1','k2','k3'], days:[0],         start:930,  dur:60, titles:{ko:'도서관 가는 날'} },
      { id:'e18', title:'Soccer practice',sk:'out',    kids:['k1'],           days:[3],         start:990,  dur:60, titles:{ko:'축구 연습'} },
      { id:'e19', title:'Ballet class',   sk:'music',  kids:['k2'],           days:[1],         start:960,  dur:45, titles:{ko:'발레 수업'} },
      { id:'e20', title:'Dentist',        sk:'out',    kids:['k2','k3'],      date:d(2),        start:660,  dur:60, titles:{ko:'치과'} },
      { id:'e21', title:'Field trip: the aquarium', sk:'sci', kids:['k1','k2','k3'], date:d(6), start:570, dur:210, titles:{ko:'현장학습: 수족관'} },
      { id:'e22', title:'Library story hour', sk:'read', kids:['k2','k3'],    date:d(13),       start:630,  dur:60, titles:{ko:'도서관 이야기 시간'} }
    ],

    rewards: [
      { id:'w1', name:'Movie night pick', emoji:'🍿', cost:60,  note:'You choose the film' },
      { id:'w2', name:'Stay up 30 min',   emoji:'🌙', cost:80,  note:'One weekend night' },
      { id:'w3', name:'Pick dinner',      emoji:'🍕', cost:100, note:'Anything we can cook' },
      { id:'w4', name:'Park afternoon',   emoji:'🛝', cost:120, note:'Two hours, your choice' },
      { id:'w5', name:'Ice cream trip',   emoji:'🍦', cost:150, note:'Two scoops' },
      { id:'w6', name:'A new book',       emoji:'📚', cost:200, note:'Bookshop, you pick' },
      { id:'w7', name:'Toy shop visit',   emoji:'🧸', cost:400, note:'Up to $10' },
      { id:'w8', name:'Friend sleepover', emoji:'⛺', cost:500, note:'Invite one friend' }
    ],

    redemptions: [],      /* {id, kid, rewardId, name, emoji, cost, at, status} */
    completions: {},      /* "kidId|taskId|YYYY-MM-DD" -> true */
    eventDone: {},        /* "eventId|YYYY-MM-DD" -> true */
    exceptions: {},       /* eventId -> [YYYY-MM-DD] skipped occurrences */

    settings: {
      schoolName:'Bennett Family Academy',
      yearStart: ymd(addDays(TODAY, -164)),
      targetDays:180,
      schoolDays:[0,1,2,3,4],
      starRoutine:5,
      starChore:10,
      slotBonus:10,
      weeklyBonus:25,
      carryOver:true,
      parentApproves:true,
      stateCode:'PA',
      theme:'auto',
      sound:true,
      effects:true,
      showTips:true,
      tipsOff:[],
      seenWelcome:false
    }
  };
}

/* ---------------- load / save ---------------- */
function loadDB(){
  try {
    var raw = localStorage.getItem(STORE_KEY);
    if (raw){
      var parsed = JSON.parse(raw);
      if (parsed && parsed.version === 2){
        var fresh = seedDB();
        /* fill in any setting added after this browser last saved */
        for (var k in fresh.settings)
          if (!Object.prototype.hasOwnProperty.call(parsed.settings || {}, k))
            (parsed.settings = parsed.settings || {})[k] = fresh.settings[k];
        return parsed;
      }
    }
  } catch (e){}
  return seedDB();
}
function saveDB(){
  try { localStorage.setItem(STORE_KEY, JSON.stringify(DB)); return true; }
  catch (e){ return false; }
}
function resetDB(){ DB = seedDB(); saveDB(); }
DB = loadDB();

/* ---------------- kids ---------------- */
function allKids(){ return DB.kids; }
function kid(id){
  for (var i = 0; i < DB.kids.length; i++) if (DB.kids[i].id === id) return DB.kids[i];
  return null;
}
function kname(id){ var k = kid(id); return k ? k.name : 'Someone'; }
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

/* stars a child earned on one date: task values + a bonus per cleared slot */
function starsOn(kidId, dateObj){
  var total = 0;
  tasksFor(kidId, dateObj).forEach(function(t){
    if (isTaskDone(kidId, t.id, dateObj)) total += (+t.stars || 0);
  });
  SLOT_IDS.forEach(function(s){
    if (slotComplete(kidId, dateObj, s)) total += (+DB.settings.slotBonus || 0);
  });
  return total;
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

function redeem(kidId, rewardId){
  var r = rewardById(rewardId);
  if (!r) return null;
  var rec = {
    id: uid('r'), kid:kidId, rewardId:r.id, name:r.name, emoji:r.emoji, cost:r.cost,
    at: new Date().toISOString(),
    status: DB.settings.parentApproves ? 'pending' : 'approved'
  };
  DB.redemptions.push(rec); saveDB();
  return rec;
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
