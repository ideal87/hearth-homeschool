/* ============================================================
   Date helpers, shared vocabulary, and the static sample data
   used ONLY by the mockup screens (Today, Lessons, Progress,
   Records). Live data lives in store.js.
   ============================================================ */

var DAY_ABBR = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
var DAY_FULL = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
var MON_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];
var MON_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/* The family runs on Pacific time, whatever the device is set to, so a tablet
   taken to another timezone still shows the right day and part of the day. */
var APP_TZ = 'America/Los_Angeles';
function nowLocal(){
  try {
    var f = new Intl.DateTimeFormat('en-US', {
      timeZone: APP_TZ, year:'numeric', month:'2-digit', day:'2-digit',
      hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false
    }).formatToParts(new Date());
    var g = {};
    f.forEach(function(p){ g[p.type] = p.value; });
    var hh = +g.hour === 24 ? 0 : +g.hour;          /* some engines report 24 */
    return new Date(+g.year, +g.month - 1, +g.day, hh, +g.minute, +g.second);
  } catch (e){ return new Date(); }                  /* no Intl - use the device */
}
function today(){ var n = nowLocal(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); }
function minutesNow(){ var n = nowLocal(); return n.getHours() * 60 + n.getMinutes(); }
function addDays(dt, n){ var x = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()); x.setDate(x.getDate() + n); return x; }
function monIdx(dt){ return (dt.getDay() + 6) % 7; }          /* 0 = Monday */
function startOfWeek(dt){ return addDays(dt, -monIdx(dt)); }
function ymd(dt){
  var m = String(dt.getMonth() + 1).padStart(2, '0');
  var d = String(dt.getDate()).padStart(2, '0');
  return dt.getFullYear() + '-' + m + '-' + d;
}
function sameDay(a, b){ return ymd(a) === ymd(b); }
function isWeekend(dt){ return monIdx(dt) > 4; }
function fmtLong(dt){ return DAY_FULL[monIdx(dt)] + ', ' + MON_FULL[dt.getMonth()] + ' ' + dt.getDate(); }
function fmtShort(dt){ return MON_ABBR[dt.getMonth()] + ' ' + dt.getDate(); }
function hm(s){ var p = String(s).split(':'); return (+p[0]) * 60 + (+p[1] || 0); }
function hhmm(mins){
  return String(Math.floor(mins / 60)).padStart(2, '0') + ':' + String(mins % 60).padStart(2, '0');
}
function timeLabel(mins){
  var h = Math.floor(mins / 60), m = mins % 60;
  var ap = h >= 12 ? 'pm' : 'am';
  var hh = ((h + 11) % 12) + 1;
  return m ? hh + ':' + String(m).padStart(2, '0') + ap : hh + ap;
}
function durLabel(m){ return m >= 60 ? (m % 60 ? (m / 60).toFixed(1) + ' hr' : (m / 60) + ' hr') : m + ' min'; }

var TODAY = today();

/* ---------------- shared vocabulary ---------------- */
var SUBJECTS = {
  circle: { name:'Circle time', emoji:'☀️',  cls:'sub-circle' },
  math:   { name:'Math',        emoji:'🔢',  cls:'sub-math' },
  read:   { name:'Reading',     emoji:'📖',  cls:'sub-read' },
  write:  { name:'Writing',     emoji:'✏️',  cls:'sub-write' },
  sci:    { name:'Science',     emoji:'🔬',  cls:'sub-sci' },
  hist:   { name:'History',     emoji:'🏛️', cls:'sub-hist' },
  art:    { name:'Art',         emoji:'🎨',  cls:'sub-art' },
  music:  { name:'Music',       emoji:'🎵',  cls:'sub-music' },
  out:    { name:'Outside',     emoji:'⚽',  cls:'sub-out' }
};
function subj(key){ return SUBJECTS[key] || SUBJECTS.circle; }

var SLOTS = [
  { id:'morning', name:'Morning', emoji:'☀️',  cls:'slot-morning' },
  { id:'midday',  name:'Midday',  emoji:'🌤️', cls:'slot-midday' },
  { id:'evening', name:'Evening', emoji:'🌙',  cls:'slot-evening' }
];
function slotOf(id){
  for (var i = 0; i < SLOTS.length; i++) if (SLOTS[i].id === id) return SLOTS[i];
  return SLOTS[0];
}
/* Slot boundaries: morning 6:00, midday 12:00, evening 17:00. */
var SLOT_START = { morning: 6 * 60, midday: 12 * 60, evening: 17 * 60 };
/* which slot a scheduled lesson belongs to */
function slotForMinutes(m){
  return m < SLOT_START.midday ? 'morning' : m < SLOT_START.evening ? 'midday' : 'evening';
}
/* which slot it is right now - before 6am still counts as the evening before */
function currentSlot(){
  var m = minutesNow();
  if (m >= SLOT_START.evening || m < SLOT_START.morning) return 'evening';
  if (m >= SLOT_START.midday) return 'midday';
  return 'morning';
}

var PALETTES = [
  { id:'k1', name:'Teal' }, { id:'k2', name:'Rose' },  { id:'k3', name:'Grape' },
  { id:'k4', name:'Amber' }, { id:'k5', name:'Sky' },  { id:'k6', name:'Mint' }
];
var KID_EMOJI = ['🦊','🐰','🐻','🐸','🦁','🐬','🦉','🐢','🦋','🐼','🐨','🦄'];
/* Routine tasks can also use the subject icons the calendar uses, so
   "Math practice" can look like Math. Events do not get the household icons -
   an event's picture comes from its subject. */
var TASK_EMOJI = (function(){
  var base = ['⏰','👕','🦷','🥣','🐕','🪴','🧹','🍽️','📚','🍴','🥤','🧸','🧺','🎒','🌙','🛏️','🚿','🧦','💧','🗑️','🏃','🎵'];
  Object.keys(SUBJECTS).forEach(function(k){
    var e = SUBJECTS[k].emoji;
    if (base.indexOf(e) === -1) base.push(e);
  });
  return base;
})();
var REWARD_EMOJI = ['🍿','🌙','🍕','🛝','🍦','📚','🧸','⛺','🎬','🎮','🚲','🏊'];
var GRADES = ['Pre-K','Kindergarten','Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6'];

/* ---------------- runtime (not persisted) ---------------- */
var state = {
  view:'routine',
  filter:[],
  cursor:TODAY,
  calMode:'week',
  slot:currentSlot(),      /* follows the clock until the user picks one */
  slotManual:false,
  lessonKid:'all',
  progressKid:'k1',
  openCourses:{}
};
function passesFilter(ev){
  if (!state.filter.length) return true;
  for (var i = 0; i < ev.kids.length; i++) if (state.filter.indexOf(ev.kids[i]) > -1) return true;
  return false;
}
function visibleKids(){
  return state.filter.length
    ? DB.kids.filter(function(k){ return state.filter.indexOf(k.id) > -1; })
    : DB.kids;
}

/* ============================================================
   Below here: sample data for the MOCKUP screens only.
   ============================================================ */
var COURSES = [
  { id:'c1',  kid:'k1', sk:'math',  name:'Math',         book:'Beast Academy 4',     total:160, done:96 },
  { id:'c2',  kid:'k1', sk:'read',  name:'Reading',      book:'All About Reading 3', total:120, done:79 },
  { id:'c3',  kid:'k1', sk:'write', name:'Writing',      book:'Journal + copywork',  total:90,  done:57 },
  { id:'c4',  kid:'k1', sk:'sci',   name:'Science',      book:'Weather & Water',     total:60,  done:33 },
  { id:'c5',  kid:'k2', sk:'math',  name:'Math',         book:'RightStart B',        total:120, done:71 },
  { id:'c6',  kid:'k2', sk:'read',  name:'Reading',      book:'All About Reading 1', total:100, done:62 },
  { id:'c7',  kid:'k2', sk:'write', name:'Handwriting',  book:'Logic of English',    total:80,  done:48 },
  { id:'c8',  kid:'k3', sk:'read',  name:'Phonics',      book:'Foundations A',       total:160, done:88 },
  { id:'c9',  kid:'k3', sk:'math',  name:'Math games',   book:'RightStart A',        total:100, done:60 },
  { id:'c10', kid:'k3', sk:'art',   name:'Art & crafts', book:'Nature journal',      total:36,  done:19 }
];
var TOPICS = {
  c1:['Multi-digit multiplication','Area models','Factors & multiples','Fractions on a number line','Long division'],
  c2:['Suffix -tion','Open syllables','Fluency passage','Vowel teams','Read: a chapter book'],
  c3:['Topic sentences','Copywork: a poem','Journal entry','Editing marks','Story sequence'],
  c4:['The water cycle','Cloud types','Air pressure','Build a rain gauge','Storm safety'],
  c5:['Adding to 20','Tens and ones','Skip counting by 5','Coins','Word problems'],
  c6:['Short vowel a','Blending CVC','Sight word: said','A short story','Rhyming pairs'],
  c7:['Lowercase b and d','Letter spacing','Writing my name','Capital letters','Numbers'],
  c8:['Letter sounds m, s','Blending two sounds','Rhyme time','Sight word: the','Letter hunt'],
  c9:['Counting to 50','Tally marks','Sorting shapes','Number bonds','Pattern blocks'],
  c10:['Leaf rubbings','Mixing colours','Playdough animals','Nature collage','Finger painting']
};
function lessonTitle(cid, n){ var t = TOPICS[cid] || ['Lesson']; return t[n % t.length]; }
function coursesFor(kidId){ return COURSES.filter(function(c){ return c.kid === kidId; }); }

var SKILLS = [
  { kid:'k1', sk:'math',  name:'Times tables to 12',       level:2 },
  { kid:'k1', sk:'math',  name:'Long division',            level:1 },
  { kid:'k1', sk:'read',  name:'Reads chapter books',      level:3 },
  { kid:'k1', sk:'write', name:'Paragraph writing',        level:2 },
  { kid:'k1', sk:'sci',   name:'Explains the water cycle', level:3 },
  { kid:'k2', sk:'math',  name:'Adding to 20',             level:3 },
  { kid:'k2', sk:'math',  name:'Telling time',             level:1 },
  { kid:'k2', sk:'read',  name:'Blending CVC words',       level:3 },
  { kid:'k2', sk:'read',  name:'Sight words (100)',        level:2 },
  { kid:'k2', sk:'write', name:'Lowercase letters',        level:2 },
  { kid:'k3', sk:'read',  name:'Knows letter sounds',      level:2 },
  { kid:'k3', sk:'read',  name:'Rhyming',                  level:3 },
  { kid:'k3', sk:'math',  name:'Counts to 100',            level:1 },
  { kid:'k3', sk:'math',  name:'Sorts by shape',           level:3 },
  { kid:'k3', sk:'art',   name:'Holds scissors safely',    level:2 }
];
var LEVEL_NAMES = ['Not yet', 'Learning', 'Practising', 'Got it!'];

var WINS = [
  { kid:'k3', text:'Read her first three-letter word out loud', when:'yesterday',  emoji:'🎉' },
  { kid:'k1', text:'Finished the whole water cycle unit',       when:'2 days ago', emoji:'🌧️' },
  { kid:'k2', text:'Wrote her name in cursive',                 when:'3 days ago', emoji:'✍️' }
];
var SUGGESTIONS = [
  { id:'g1', emoji:'⭐', title:'Nora is 2 stars from her park afternoon',
    body:'She has kept a 9-day streak. One more evening routine and she can cash it in.', action:'Open rewards' },
  { id:'g2', emoji:'🔄', title:'Eli skipped reading three days running',
    body:'It sits right after a 40-minute math block. Try moving it before math?', action:'Move reading earlier' },
  { id:'g3', emoji:'✅', title:'You are 6 days ahead of your 180-day requirement',
    body:'Take the Friday before spring break off and you will still finish with days to spare.', action:'Add a day off' }
];

var STATES = {
  PA: { name:'Pennsylvania', days:180, hours:900,
        rules:['180 days or 900 hours for elementary grades',
               'Portfolio of work samples + a log of books read',
               'Annual evaluation by a qualified evaluator',
               'Standardized testing in grades 3, 5 and 8',
               'Affidavit filed with the district by August 1'] },
  TX: { name:'Texas', days:0, hours:0,
        rules:['No attendance or hour requirement', 'Curriculum must be in visual form',
               'Cover reading, spelling, grammar, math and citizenship', 'No notification required'] },
  NY: { name:'New York', days:180, hours:900,
        rules:['180 days / 900 hours for grades 1-6', 'IHIP filed annually',
               'Quarterly reports to the district', 'Annual assessment required'] },
  CA: { name:'California', days:175, hours:0,
        rules:['175 days as a private school affidavit filer', 'Attendance register required',
               'Record of courses offered', 'No testing requirement'] }
};

var SCHOOL_DAYS_REQUIRED = 180;
function schoolDaysBetween(a, b){
  var n = 0, d = new Date(a);
  while (d <= b){ if (!isWeekend(d)) n++; d = addDays(d, 1); }
  return n;
}
var YEAR_START = addDays(TODAY, -164);
var DAYS_DONE = schoolDaysBetween(YEAR_START, addDays(TODAY, -1)) - 6;
var HOURS_DONE = Math.round(DAYS_DONE * 3.6);
var YEAR_LABEL = YEAR_START.getFullYear() + '-' + String((YEAR_START.getFullYear() + 1) % 100).padStart(2, '0');

function seedAttendance(){
  var att = {}, d = new Date(YEAR_START), i = 0;
  while (d < TODAY){
    if (!isWeekend(d)){
      var mark = 'p';
      if (i % 37 === 12 || i % 53 === 5) mark = 'h';
      else if (i % 41 === 19) mark = 'a';
      att[ymd(d)] = { mark:mark, hours: mark === 'p' ? (3 + ((i * 7) % 5) * 0.3) : 0 };
    }
    d = addDays(d, 1); i++;
  }
  return att;
}
var MOCK_ATTENDANCE = seedAttendance();
