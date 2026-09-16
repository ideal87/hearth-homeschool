/* ============================================================
   Cloud sync - the Firebase part.

   Loaded only on the Firebase Hosting domains (and localhost for
   testing). Everywhere else the app keeps working exactly as before,
   on this device's localStorage.

   Flow
   1. The app boots from localStorage immediately, so the board shows
      even before the network answers.
   2. Once signed in, this module listens to families/main and its
      month documents, merges any edits made on this device since
      the last sync, and swaps the result in.
   3. From then on every saveDB() pushes just the fields that changed.
      The Firestore SDK applies them locally at once, queues them if
      offline, and delivers other devices' changes back here live.
   ============================================================ */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import {
  getAuth, GoogleAuthProvider, onAuthStateChanged, getRedirectResult,
  signInWithPopup, signInWithRedirect, signOut as fbSignOut
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import {
  initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager,
  doc, collection, onSnapshot, writeBatch, runTransaction,
  FieldPath, deleteField, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

/* Not secret: this identifies the project to Google. Access is controlled by
   sign-in plus the rules in firestore.rules. */
const firebaseConfig = {
  apiKey: 'AIzaSyAJP9khbsb2VQVrxwcIaxBhEuXm6fQw6T4',
  authDomain: 'homeschool-7b68e.firebaseapp.com',
  projectId: 'homeschool-7b68e',
  storageBucket: 'homeschool-7b68e.firebasestorage.app',
  messagingSenderId: '443622165243',
  appId: '1:443622165243:web:36ab029178797be3ed3e5e'
};

const S = window.HearthSync;
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

let fs;
try {
  fs = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    ignoreUndefinedProperties: true
  });
} catch (e) {
  fs = getFirestore(app);            /* private browsing etc. - memory cache only */
}

const mainRef = doc(fs, 'families', 'main');
const daysCol = collection(fs, 'families', 'main', 'days');

/* what we believe the cloud holds, in DB form. Everything pushed is the
   difference between this and the live DB. Starts as this device's copy. */
let synced = S.clone(DB);
let mainSnap = null, daysSnap = null;
let unsubMain = null, unsubDays = null;
let creating = false, handoffAsked = false, backedUp = false;
let firstApplyTimer = null;

const MESSAGES = {
  'auth/configuration-not-found':
    'Google sign-in is not switched on for this project yet. In the Firebase console open Authentication, press Get started, then enable Google under Sign-in method.',
  'auth/operation-not-allowed':
    'Google sign-in is turned off. In the Firebase console enable Google under Authentication > Sign-in method.',
  'auth/unauthorized-domain':
    'This address is not on the sign-in list. Use https://homeschool-7b68e.firebaseapp.com instead.',
  'auth/network-request-failed':
    'No connection. Try again once this device is online.'
};

const C = window.HearthCloud = {
  mode: 'cloud',
  status: 'connecting',          /* connecting | signed-out | synced | saving | offline | denied | error */
  ready: false,
  user: null,
  email: '',
  error: '',
  signIn, signOut, push,
  label() {
    switch (C.status) {
      case 'signed-out': return 'Not signed in - saved on this device only';
      case 'connecting': return 'Connecting to the cloud...';
      case 'synced':     return 'Synced as ' + C.email;
      case 'saving':     return 'Saving...';
      case 'offline':    return 'Offline - changes will sync when back online';
      case 'denied':     return C.email + ' does not have access to this family';
      default:           return C.error || 'Sync problem';
    }
  }
};

function setStatus(next, err) {
  const prev = C.status;
  if (err !== undefined) C.error = err;
  if (prev === next && err === undefined) return;
  C.status = next;
  /* banners on the board depend on these, so they need a full render;
     saving/synced flips only touch the icon, so the ticks don't re-animate */
  const contentChange = (prev === 'signed-out') !== (next === 'signed-out')
    || next === 'denied' || next === 'error' || prev === 'denied' || prev === 'error';
  if (contentChange && typeof render === 'function') render();
  else if (typeof renderChrome === 'function') renderChrome();
}

/* ---------------- sign in / out ---------------- */
function isAppleTouch() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}
function isStandalone() {
  return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
}

async function signIn() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    /* A Home Screen app on iPad cannot hand a popup back reliably. Redirect is
       safe here because authDomain is this same site. */
    if (isAppleTouch() || isStandalone()) { markRedirect(); await signInWithRedirect(auth, provider); }
    else await signInWithPopup(auth, provider);
  } catch (e) {
    const code = e && e.code;
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return;
    if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
      try { markRedirect(); await signInWithRedirect(auth, provider); return; } catch (e2) { return authFail(e2); }
    }
    authFail(e);
  }
}
function authFail(e) {
  const msg = MESSAGES[e && e.code] || ((e && e.message) || 'Sign-in failed');
  toast(msg, 'warn');
  setStatus(C.user ? C.status : 'signed-out', msg);
}

async function signOut() {
  detach();
  try { await fbSignOut(auth); } catch (e) {}
}

/* Only ask for a redirect result when this device actually started one.
   Asking eagerly makes every page load wait on Google's sign-in helper. */
const REDIRECT_FLAG = 'hearth.signin-redirect';
function markRedirect() { try { sessionStorage.setItem(REDIRECT_FLAG, '1'); } catch (e) {} }
try {
  if (sessionStorage.getItem(REDIRECT_FLAG)) {
    sessionStorage.removeItem(REDIRECT_FLAG);
    getRedirectResult(auth).catch(authFail);
  }
} catch (e) {}

/* If Google's sign-in helper never answers (sign-in not enabled, blocked
   network), don't leave a spinner forever - offer Sign in so it can retry. */
let authKnown = false;
const authWatchdog = setTimeout(() => {
  if (!authKnown) setStatus('signed-out', 'Google sign-in did not respond. Check the connection, then press Sign in.');
}, 10000);

onAuthStateChanged(auth, (user) => {
  authKnown = true;
  clearTimeout(authWatchdog);
  detach();
  C.user = user || null;
  C.email = (user && user.email) || '';
  C.ready = false;
  if (!user) { setStatus('signed-out', ''); return; }
  setStatus('connecting', '');
  attach();
});

/* ---------------- listening ---------------- */
function attach() {
  mainSnap = daysSnap = null;
  unsubMain = onSnapshot(mainRef, { includeMetadataChanges: true },
    (snap) => { mainSnap = snap; onSnaps(); }, (e) => onListenError(e, 'family document'));
  unsubDays = onSnapshot(daysCol, { includeMetadataChanges: true },
    (qs) => { daysSnap = qs; onSnaps(); }, (e) => onListenError(e, 'day documents'));
  /* if the network is flaky, accept the cached copy rather than wait forever */
  clearTimeout(firstApplyTimer);
  firstApplyTimer = setTimeout(() => { if (!C.ready) onSnaps(true); }, 8000);
}
function detach() {
  if (unsubMain) unsubMain();
  if (unsubDays) unsubDays();
  unsubMain = unsubDays = null;
  clearTimeout(firstApplyTimer);
  C.ready = false;
}

function onListenError(err, source) {
  /* naming the source makes a rules problem diagnosable without guesswork */
  if (err && err.code === 'permission-denied') {
    detach();
    setStatus('denied', 'Reading the ' + (source || 'data') + ' was refused.');
    return;
  }
  setStatus('error', ((err && err.message) || 'Could not reach the cloud') + ' (' + (source || '') + ')');
}

function remoteDB() {
  const days = {};
  daysSnap.forEach((d) => { days[d.id] = d.data(); });
  return S.fromDocs({ main: mainSnap.data(), days }, DB);
}

function onSnaps(acceptCache) {
  if (!mainSnap || !daysSnap) return;
  const md = mainSnap.metadata, dmd = daysSnap.metadata;

  if (!mainSnap.exists()) {
    if (md.fromCache && !acceptCache) { setStatus(navigator.onLine ? 'connecting' : 'offline'); return; }
    if (!md.fromCache) createFamily();
    return;
  }

  if (!C.ready) {
    /* wait for the server's copy of both so star banks don't flash wrong */
    if ((md.fromCache || dmd.fromCache) && navigator.onLine && !acceptCache) return;
    firstApply();
  } else {
    applyRemote();
  }

  const pending = md.hasPendingWrites || dmd.hasPendingWrites;
  const cached = md.fromCache || dmd.fromCache;
  setStatus(!navigator.onLine ? 'offline' : pending ? 'saving' : cached ? 'connecting' : 'synced');
}

/* first contact after signing in: cloud wins, but anything changed on this
   device since it last synced is replayed on top rather than thrown away */
function firstApply() {
  clearTimeout(firstApplyTimer);
  const remote = remoteDB();
  const localOps = S.diff(synced, DB);

  if (!backedUp && !S.sameDB(remote, DB)) {
    try { localStorage.setItem(STORE_KEY + '.before-sync', JSON.stringify(DB)); } catch (e) {}
    backedUp = true;
  }

  const merged = localOps.length
    ? S.fromDocs(S.applyOps(S.toDocs(remote), localOps), DB)
    : remote;

  synced = S.clone(remote);
  replaceDB(merged);
  C.ready = true;
  push();                 /* sends the replayed edits, plus any title backfill */
  render();
  maybeOfferHandoff();
}

function applyRemote() {
  const remote = remoteDB();
  if (S.sameDB(remote, DB)) { synced = S.clone(DB); return; }   /* our own write echoing back */
  synced = S.clone(remote);
  replaceDB(remote);
  push();
  render();
}

/* ---------------- writing ---------------- */
function push() {
  if (!C.ready || !C.user) return;
  const ops = S.diff(synced, DB);
  if (!ops.length) return;
  synced = S.clone(DB);

  const batch = writeBatch(fs);
  const mainPairs = [];
  const months = {};

  ops.forEach((op) => {
    if (op.doc === 'main') {
      mainPairs.push(new FieldPath(...op.path), op.del ? deleteField() : op.value);
    } else {
      /* month docs may not exist yet, so merge-set rather than update */
      const root = months[op.doc] = months[op.doc] || {};
      let t = root;
      for (let i = 0; i < op.path.length - 1; i++) t = t[op.path[i]] = t[op.path[i]] || {};
      t[op.path[op.path.length - 1]] = op.del ? deleteField() : op.value;
    }
  });

  if (mainPairs.length) batch.update(mainRef, 'updatedAt', serverTimestamp(), ...mainPairs);
  Object.keys(months).forEach((m) => batch.set(doc(daysCol, m), months[m], { merge: true }));

  batch.commit().catch((e) => {
    if (e && e.code === 'permission-denied') { detach(); setStatus('denied', ''); return; }
    toast('Could not save to the cloud: ' + ((e && e.message) || e), 'warn');
    setStatus('error', (e && e.message) || 'Save failed');
  });
}

/* the very first sign-in for this family: upload what this device has */
async function createFamily() {
  if (creating) return;
  creating = true;
  const handoff = S.takeHandoff();
  const initial = handoff ? S.fromDocs(S.toDocs(handoff), DB) : DB;
  const docs = S.toDocs(initial);
  try {
    await runTransaction(fs, async (tx) => {
      const snap = await tx.get(mainRef);
      if (snap.exists()) return;                     /* another device beat us to it */
      tx.set(mainRef, Object.assign({}, docs.main, {
        createdAt: serverTimestamp(), createdBy: C.email, updatedAt: serverTimestamp()
      }));
      Object.keys(docs.days).forEach((m) => tx.set(doc(daysCol, m), docs.days[m]));
    });
    if (handoff) { S.clearHandoff(); handoffAsked = true; }
    synced = S.clone(initial);
    toast('Your family is now in the cloud', 'ok', '☁️');
  } catch (e) {
    if (e && e.code === 'permission-denied') { detach(); setStatus('denied', ''); }
    else setStatus('error', (e && e.message) || 'Could not create the family');
  } finally {
    creating = false;
  }
}

/* arrived from the old address carrying data, but the cloud already has some */
function maybeOfferHandoff() {
  if (handoffAsked) return;
  const handoff = S.takeHandoff();
  if (!handoff) return;
  handoffAsked = true;
  if (S.sameDB(S.fromDocs(S.toDocs(handoff), DB), DB)) { S.clearHandoff(); return; }

  const api = openModal({
    title: 'Which data should the family use?',
    sub: 'You came from the old address with data from that device',
    size: 'narrow',
    body:
      '<p class="sm muted" style="margin-top:0">The cloud already has this family\'s data, and it differs from what this device brought across.</p>' +
      '<p class="sm muted"><b>Keep cloud data</b> is the safe choice if another device has been in use. ' +
      '<b>Use this device\'s data</b> replaces the cloud copy on every signed-in device.</p>',
    foot:
      '<button class="btn" id="ho-keep">Keep cloud data</button>' +
      '<button class="btn btn-danger" id="ho-use">Use this device\'s data</button>'
  });
  api.el.querySelector('#ho-keep').addEventListener('click', () => {
    S.clearHandoff(); api.close(); toast('Kept the cloud data', 'ok');
  });
  api.el.querySelector('#ho-use').addEventListener('click', () => {
    replaceDB(S.fromDocs(S.toDocs(handoff), DB));
    S.clearHandoff(); api.close(); push(); render();
    toast('Replaced the cloud data with this device\'s', 'ok', '☁️');
  });
}

window.addEventListener('online',  () => { if (C.user) onSnaps(); });
window.addEventListener('offline', () => { if (C.user) setStatus('offline'); });

/* the icon was showing "loading" until now */
if (typeof renderChrome === 'function') renderChrome();
