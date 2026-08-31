/* ============================================================
   Per-child localisation for the Routine board.
   Each child carries a `lang`. Their column - and their own
   full-screen view - render entirely in it.
   ============================================================ */

/* Flag emoji do not render on Windows, so every language uses a globe and
   is identified by its own name instead. */
var LANGS = [
  { id:'en', name:'English',  flag:'🌐', locale:'en-US' },
  { id:'ko', name:'한국어',    flag:'🌐', locale:'ko-KR' },
  { id:'es', name:'Español',  flag:'🌐', locale:'es-ES' },
  { id:'fr', name:'Français', flag:'🌐', locale:'fr-FR' }
];
function langOf(id){
  for (var i = 0; i < LANGS.length; i++) if (LANGS[i].id === id) return LANGS[i];
  return LANGS[0];
}

var STRINGS = {
  en: {
    slot_morning:'Morning', slot_midday:'Midday', slot_evening:'Evening',
    routine_morning:'Morning routine', routine_midday:'Midday routine', routine_evening:'Evening routine',
    chores:'Chores',
    todaysLessons:'Today’s lessons',
    today:'Today', backToToday:'Back to today', manage:'Manage', rewards:'Rewards',
    starsToday:'{n} today',
    doneCount:'{d} / {t} done',
    starsEarnedToday:'⭐ {n} today',
    streak:'streak',
    nothingFor:'Nothing for {slot} yet.',
    addTaskHint:'<b>Manage</b> adds a task.',
    allDone:'Everything done today!',
    starsEarned:'{n} stars earned',
    plusStars:'+{n} stars!',
    toastStars:'{name} +{n} stars',
    toastSlot:'{name} finished the whole {slot}!',
    greeting:'Hi, {name}!',
    doneToday:'{d} of {t} done today',
    myJobs:'My jobs',
    exit:'Exit',
    tapWhenDone:'Tap a row when you finish it',
    nothingToDo:'Nothing to do right now!',
    slotDoneKid:'{slot} all done!',
    tipTitle:'The board the whole family runs on',
    tipBody:'One column per child, colour-coded. Tap <b>☀️ 🌤️ 🌙</b> to move through the day. The dashed cards are lessons scheduled on the calendar for that child today - tap anything to tick it. Every tick is saved in this browser.',
    rewardSection:'Reward',
    language:'Language'
  },
  ko: {
    slot_morning:'아침', slot_midday:'낮', slot_evening:'저녁',
    routine_morning:'아침 루틴', routine_midday:'낮 루틴', routine_evening:'저녁 루틴',
    chores:'집안일',
    todaysLessons:'오늘의 수업',
    today:'오늘', backToToday:'오늘로 가기', manage:'관리', rewards:'보상',
    starsToday:'오늘 {n}개',
    doneCount:'{t}개 중 {d}개 완료',
    starsEarnedToday:'⭐ 오늘 {n}개',
    streak:'연속',
    nothingFor:'{slot}에 할 일이 없어요.',
    addTaskHint:'<b>관리</b>에서 추가할 수 있어요.',
    allDone:'오늘 할 일을 다 했어요!',
    starsEarned:'별 {n}개 획득',
    plusStars:'별 +{n}개!',
    toastStars:'{name} 별 +{n}개',
    toastSlot:'{name} {slot} 전부 완료!',
    greeting:'안녕, {name}!',
    doneToday:'오늘 {t}개 중 {d}개 완료',
    myJobs:'내 할 일',
    exit:'나가기',
    tapWhenDone:'다 하면 눌러 주세요',
    nothingToDo:'지금은 할 일이 없어요!',
    slotDoneKid:'{slot} 전부 완료!',
    tipTitle:'온 가족이 함께 쓰는 보드',
    tipBody:'아이마다 색깔이 다른 칸이 하나씩 있어요. <b>☀️ 🌤️ 🌙</b> 를 눌러 하루를 이동하세요. 점선 카드는 오늘 그 아이의 달력에 있는 수업이에요. 아무 곳이나 누르면 완료 표시가 되고, 모든 기록은 이 브라우저에 저장돼요.',
    rewardSection:'보상',
    language:'언어'
  },
  es: {
    slot_morning:'Mañana', slot_midday:'Mediodía', slot_evening:'Tarde',
    routine_morning:'Rutina de la mañana', routine_midday:'Rutina del mediodía', routine_evening:'Rutina de la tarde',
    chores:'Tareas de casa',
    todaysLessons:'Clases de hoy',
    today:'Hoy', backToToday:'Volver a hoy', manage:'Gestionar', rewards:'Premios',
    starsToday:'{n} hoy',
    doneCount:'{d} / {t} hechas',
    starsEarnedToday:'⭐ {n} hoy',
    streak:'racha',
    nothingFor:'Nada para {slot} todavía.',
    addTaskHint:'<b>Gestionar</b> añade una tarea.',
    allDone:'¡Todo hecho por hoy!',
    starsEarned:'{n} estrellas ganadas',
    plusStars:'¡+{n} estrellas!',
    toastStars:'{name} +{n} estrellas',
    toastSlot:'¡{name} completó la rutina!',
    greeting:'¡Hola, {name}!',
    doneToday:'{d} de {t} hechas hoy',
    myJobs:'Mis tareas',
    exit:'Salir',
    tapWhenDone:'Toca una fila cuando la termines',
    nothingToDo:'¡Nada que hacer ahora mismo!',
    slotDoneKid:'¡Rutina completa!',
    tipTitle:'El tablero de toda la familia',
    tipBody:'Una columna por niño, con su color. Toca <b>☀️ 🌤️ 🌙</b> para moverte por el día. Las tarjetas con borde discontinuo son las clases del calendario de ese niño para hoy. Todo se guarda en este navegador.',
    rewardSection:'Premio',
    language:'Idioma'
  },
  fr: {
    slot_morning:'Matin', slot_midday:'Midi', slot_evening:'Soir',
    routine_morning:'Routine du matin', routine_midday:'Routine du midi', routine_evening:'Routine du soir',
    chores:'Tâches ménagères',
    todaysLessons:'Les cours d’aujourd’hui',
    today:'Aujourd’hui', backToToday:'Revenir à aujourd’hui', manage:'Gérer', rewards:'Récompenses',
    starsToday:'{n} aujourd’hui',
    doneCount:'{d} / {t} faits',
    starsEarnedToday:'⭐ {n} aujourd’hui',
    streak:'série',
    nothingFor:'Rien pour le {slot} pour l’instant.',
    addTaskHint:'<b>Gérer</b> ajoute une tâche.',
    allDone:'Tout est fini pour aujourd’hui !',
    starsEarned:'{n} étoiles gagnées',
    plusStars:'+{n} étoiles !',
    toastStars:'{name} +{n} étoiles',
    toastSlot:'{name} a fini la routine !',
    greeting:'Salut, {name} !',
    doneToday:'{d} sur {t} faits aujourd’hui',
    myJobs:'Mes tâches',
    exit:'Quitter',
    tapWhenDone:'Touche une ligne quand c’est fini',
    nothingToDo:'Rien à faire pour le moment !',
    slotDoneKid:'Routine terminée !',
    tipTitle:'Le tableau de toute la famille',
    tipBody:'Une colonne par enfant, avec sa couleur. Touche <b>☀️ 🌤️ 🌙</b> pour parcourir la journée. Les cartes en pointillés sont les cours du calendrier de cet enfant aujourd’hui. Tout est enregistré dans ce navigateur.',
    rewardSection:'Récompense',
    language:'Langue'
  }
};

function t(key, lang, vars){
  var dict = STRINGS[lang] || STRINGS.en;
  var s = dict[key];
  if (s == null) s = STRINGS.en[key];
  if (s == null) return key;
  if (vars) for (var k in vars) s = s.split('{' + k + '}').join(vars[k]);
  return s;
}
/* A task's or event's own name in a given language.
   Titles are your data, so they are only translated when you have supplied a
   translation - otherwise the original wording is shown unchanged. */
function itemTitle(item, lang){
  if (!item) return '';
  if (lang && lang !== 'en' && item.titles && item.titles[lang]) return item.titles[lang];
  return item.title || '';
}

/* localised long date, e.g. Monday, 31 August */
function fmtLongLoc(dt, lang){
  try {
    return dt.toLocaleDateString(langOf(lang).locale,
      { weekday:'long', month:'long', day:'numeric' });
  } catch (e){ return fmtLong(dt); }
}
/* language shown on the board chrome: a single child in view wins */
function boardLang(){
  var ks = visibleKids();
  if (ks.length === 1) return ks[0].lang || 'en';
  return 'en';
}
