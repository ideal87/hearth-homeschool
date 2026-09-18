/* ============================================================
   Cloud sync - the pure part.

   Turns the in-memory DB into Firestore documents and back, and
   works out the smallest set of field changes between two DBs.
   No Firebase imports here, so it runs (and is tested) anywhere.

   Layout in Firestore
     families/main                 kids, tasks, events, rewards,
                                   redemptions, exceptions, settings
     families/main/days/YYYY-MM    completions, eventDone and the star
                                   ledger for that month

   Ticks are sharded by month because they grow forever; a single
   document would pass Firestore's 1 MiB limit in about 18 months.

   Lists (kids, tasks...) are stored as maps keyed by id with an
   _i order field, so two devices editing different records never
   overwrite each other - each change is a single field path.
   ============================================================ */
(function(root){
  var LIST_SECTIONS = ['kids', 'tasks', 'events', 'rewards', 'redemptions'];
  var MAIN_MAPS     = ['exceptions', 'settings'];
  /* All three are keyed '...|YYYY-MM-DD', so they shard by month the same way.
     'ledger' holds a day's finished star totals once the books are closed on
     it; the individual ticks are dropped at that point. */
  var DAY_MAPS      = ['completions', 'eventDone', 'ledger'];

  /* preferences that belong to a device, not the family: the kitchen iPad
     can hide the menu and mute sound without doing the same to a laptop */
  var DEVICE_SETTINGS = ['theme', 'sound', 'effects', 'railHidden', 'showTips', 'tipsOff', 'seenWelcome'];

  var CLOUD_HOSTS = ['homeschool-7b68e.firebaseapp.com', 'homeschool-7b68e.web.app', 'localhost'];
  var CLOUD_URL   = 'https://homeschool-7b68e.firebaseapp.com/';

  function clone(x){ return x === undefined ? undefined : JSON.parse(JSON.stringify(x)); }

  /* key-order independent stringify - Firestore returns map keys sorted */
  function stable(x){
    if (x === null || typeof x !== 'object') return JSON.stringify(x);
    if (Array.isArray(x)) return '[' + x.map(stable).join(',') + ']';
    return '{' + Object.keys(x).sort().map(function(k){
      return JSON.stringify(k) + ':' + stable(x[k]);
    }).join(',') + '}';
  }

  function monthOf(key){
    var m = /\|(\d{4}-\d{2})-\d{2}$/.exec(key);
    return m ? m[1] : null;
  }

  /* DB -> { main: {...}, days: { 'YYYY-MM': { completions, eventDone } } } */
  function toDocs(db){
    var main = { version: db.version || 2 };
    LIST_SECTIONS.forEach(function(sec){
      var m = {};
      (db[sec] || []).forEach(function(rec, i){
        if (!rec || rec.id == null) return;
        var r = clone(rec); r._i = i; m[rec.id] = r;
      });
      main[sec] = m;
    });
    main.exceptions = clone(db.exceptions || {});
    var s = clone(db.settings || {});
    DEVICE_SETTINGS.forEach(function(k){ delete s[k]; });
    main.settings = s;

    var days = {};
    DAY_MAPS.forEach(function(sec){
      var src = db[sec] || {};
      Object.keys(src).forEach(function(key){
        var mon = monthOf(key);
        if (!mon) return;
        if (!days[mon]){
          days[mon] = {};
          DAY_MAPS.forEach(function(s2){ days[mon][s2] = {}; });
        }
        days[mon][sec][key] = src[key];
      });
    });
    return { main: main, days: days };
  }

  /* docs -> DB. localDb supplies the device-only settings to keep. */
  function fromDocs(docs, localDb){
    var main = (docs && docs.main) || {};
    var db = { version: main.version || 2 };
    LIST_SECTIONS.forEach(function(sec){
      var m = main[sec] || {};
      db[sec] = Object.keys(m).map(function(k){ return m[k]; })
        .sort(function(a, b){ return (a._i || 0) - (b._i || 0); })
        .map(function(r){ var c = clone(r); delete c._i; return c; });
    });
    db.exceptions = clone(main.exceptions || {});
    var s = clone(main.settings || {});
    var local = (localDb && localDb.settings) || {};
    DEVICE_SETTINGS.forEach(function(k){
      if (Object.prototype.hasOwnProperty.call(local, k)) s[k] = clone(local[k]);
    });
    db.settings = s;

    DAY_MAPS.forEach(function(sec){ db[sec] = {}; });
    var days = (docs && docs.days) || {};
    Object.keys(days).forEach(function(mon){
      DAY_MAPS.forEach(function(sec){
        var src = (days[mon] && days[mon][sec]) || {};
        Object.keys(src).forEach(function(k){ db[sec][k] = src[k]; });
      });
    });
    return db;
  }

  /* smallest set of field changes that turns prev into next.
     op = { doc: 'main' | 'YYYY-MM', path: [..], value } or { ..., del: true } */
  function diff(prevDb, nextDb){
    var a = toDocs(prevDb), b = toDocs(nextDb), ops = [];

    if (a.main.version !== b.main.version) ops.push({ doc:'main', path:['version'], value:b.main.version });

    LIST_SECTIONS.concat(MAIN_MAPS).forEach(function(sec){
      var am = a.main[sec] || {}, bm = b.main[sec] || {};
      Object.keys(bm).forEach(function(k){
        if (!(k in am)){ ops.push({ doc:'main', path:[sec, k], value:bm[k] }); return; }
        if (stable(am[k]) === stable(bm[k])) return;
        /* a record that only moved position: touch just its order field,
           so a concurrent edit to its contents on another device survives */
        if (LIST_SECTIONS.indexOf(sec) > -1 && am[k] && bm[k]){
          var x = clone(am[k]), y = clone(bm[k]);
          delete x._i; delete y._i;
          if (stable(x) === stable(y)){ ops.push({ doc:'main', path:[sec, k, '_i'], value:bm[k]._i }); return; }
        }
        ops.push({ doc:'main', path:[sec, k], value:bm[k] });
      });
      Object.keys(am).forEach(function(k){
        if (!(k in bm)) ops.push({ doc:'main', path:[sec, k], del:true });
      });
    });

    var months = {};
    Object.keys(a.days).concat(Object.keys(b.days)).forEach(function(m){ months[m] = true; });
    Object.keys(months).forEach(function(mon){
      DAY_MAPS.forEach(function(sec){
        var am = (a.days[mon] && a.days[mon][sec]) || {};
        var bm = (b.days[mon] && b.days[mon][sec]) || {};
        Object.keys(bm).forEach(function(k){
          if (stable(am[k]) !== stable(bm[k])) ops.push({ doc:mon, path:[sec, k], value:bm[k] });
        });
        Object.keys(am).forEach(function(k){
          if (!(k in bm)) ops.push({ doc:mon, path:[sec, k], del:true });
        });
      });
    });
    return ops;
  }

  /* apply ops to docs in memory - mirrors what Firestore does server-side */
  function applyOps(docs, ops){
    var out = { main: clone(docs.main || {}), days: clone(docs.days || {}) };
    ops.forEach(function(op){
      var target;
      if (op.doc === 'main') target = out.main;
      else target = out.days[op.doc] = out.days[op.doc] || {};
      for (var i = 0; i < op.path.length - 1; i++){
        var seg = op.path[i];
        if (target[seg] == null || typeof target[seg] !== 'object') target[seg] = {};
        target = target[seg];
      }
      var last = op.path[op.path.length - 1];
      if (op.del) delete target[last];
      else target[last] = clone(op.value);
    });
    return out;
  }

  function sameDB(x, y){
    var a = toDocs(x), b = toDocs(y);
    return stable(a) === stable(b);
  }

  /* ---------- hosts + handing data from the old address to the new one ---------- */
  function isCloudHost(){
    return typeof location !== 'undefined' && CLOUD_HOSTS.indexOf(location.hostname) > -1;
  }

  function encodeHandoff(db){
    return btoa(unescape(encodeURIComponent(JSON.stringify(db))));
  }
  function decodeHandoff(s){
    return JSON.parse(decodeURIComponent(escape(atob(s))));
  }
  var HANDOFF_KEY = 'hearth.handoff';
  var HANDOFF_LIMIT = 60000;   /* characters; beyond this, use Export / Import */

  function handoffUrl(db){
    var payload = encodeHandoff(db);
    if (payload.length > HANDOFF_LIMIT) return null;
    return CLOUD_URL + '#handoff=' + payload;
  }

  /* on the cloud host, capture a #handoff before the router sees the hash */
  function captureHandoff(){
    if (typeof location === 'undefined') return;
    var h = location.hash || '';
    if (h.indexOf('#handoff=') !== 0) return;
    try {
      var db = decodeHandoff(h.slice('#handoff='.length));
      sessionStorage.setItem(HANDOFF_KEY, JSON.stringify(db));
    } catch (e){}
    try { history.replaceState(null, '', location.pathname + location.search + '#/routine'); }
    catch (e){ location.hash = '#/routine'; }
  }
  function takeHandoff(){
    try {
      var raw = sessionStorage.getItem(HANDOFF_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e){ return null; }
  }
  function clearHandoff(){ try { sessionStorage.removeItem(HANDOFF_KEY); } catch (e){} }

  var api = {
    LIST_SECTIONS: LIST_SECTIONS, DAY_MAPS: DAY_MAPS, DEVICE_SETTINGS: DEVICE_SETTINGS,
    CLOUD_HOSTS: CLOUD_HOSTS, CLOUD_URL: CLOUD_URL,
    clone: clone, stable: stable, monthOf: monthOf,
    toDocs: toDocs, fromDocs: fromDocs, diff: diff, applyOps: applyOps, sameDB: sameDB,
    isCloudHost: isCloudHost, handoffUrl: handoffUrl,
    encodeHandoff: encodeHandoff, decodeHandoff: decodeHandoff,
    captureHandoff: captureHandoff, takeHandoff: takeHandoff, clearHandoff: clearHandoff
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.HearthSync = api;
})(typeof window !== 'undefined' ? window : globalThis);
