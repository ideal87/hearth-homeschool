/* ============================================================
   Sound + visual effects for the routine board.
   All audio is synthesised with WebAudio - no files, works offline.
   Everything is a no-op when the matching setting is off, or when
   the viewer asks for reduced motion.
   ============================================================ */

var FX = {
  ctx: null,
  master: null,

  /* AudioContext can only start from a user gesture, so build it lazily */
  ensure: function(){
    if (!DB.settings.sound) return null;
    try {
      if (!FX.ctx){
        var Ctor = window.AudioContext || window.webkitAudioContext;
        if (!Ctor) return null;
        FX.ctx = new Ctor();
        FX.master = FX.ctx.createGain();
        FX.master.gain.value = 0.32;
        FX.master.connect(FX.ctx.destination);
      }
      if (FX.ctx.state === 'suspended') FX.ctx.resume();
      return FX.ctx;
    } catch (e){ return null; }
  },

  /* one bell-ish partial */
  tone: function(freq, delay, dur, peak, type){
    var ctx = FX.ctx;
    if (!ctx) return;
    var at = ctx.currentTime + delay;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, at);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(peak, at + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(gain);
    gain.connect(FX.master);
    osc.start(at);
    osc.stop(at + dur + 0.03);
  },

  /* soft rising triad - the tick sound */
  chime: function(){
    if (!FX.ensure()) return;
    var notes = [880, 1108.73, 1318.51];        /* A5  C#6  E6 */
    notes.forEach(function(f, i){
      FX.tone(f, i * 0.055, 0.55, 0.5, 'sine');
      FX.tone(f * 2, i * 0.055, 0.28, 0.10, 'sine');   /* shimmer */
    });
  },

  /* quieter falling pair - undoing a tick */
  unchime: function(){
    if (!FX.ensure()) return;
    FX.tone(660, 0, 0.22, 0.26, 'sine');
    FX.tone(494, 0.07, 0.26, 0.20, 'sine');
  },

  /* four-note arpeggio - a whole slot cleared */
  fanfare: function(){
    if (!FX.ensure()) return;
    var notes = [1046.5, 1318.51, 1567.98, 2093];   /* C6 E6 G6 C7 */
    notes.forEach(function(f, i){
      FX.tone(f, i * 0.085, 0.7, 0.46, 'triangle');
      FX.tone(f * 1.5, i * 0.085 + 0.02, 0.3, 0.08, 'sine');
    });
  },

  /* longer flourish - the whole day cleared */
  hooray: function(){
    if (!FX.ensure()) return;
    var notes = [783.99, 1046.5, 1318.51, 1567.98, 2093, 2637];
    notes.forEach(function(f, i){
      FX.tone(f, i * 0.075, 0.85, 0.42, 'triangle');
    });
    FX.tone(523.25, 0.5, 1.1, 0.3, 'sine');
  },

  /* ---------- visuals ---------- */
  reduced: function(){
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
    catch (e){ return false; }
  },
  layer: function(){
    var l = document.getElementById('fx-layer');
    if (!l){
      l = document.createElement('div');
      l.id = 'fx-layer';
      l.className = 'fx-layer';
      document.body.appendChild(l);
    }
    return l;
  },

  /* stars flying off the row you just tapped */
  burst: function(el, emoji){
    if (!DB.settings.effects || FX.reduced() || !el) return;
    var r = el.getBoundingClientRect();
    var layer = FX.layer();
    var cx = r.left + r.width * 0.82, cy = r.top + r.height / 2;
    for (var i = 0; i < 9; i++){
      var p = document.createElement('span');
      p.className = 'fx-p';
      p.textContent = emoji || (i % 3 === 0 ? '✨' : '⭐');
      var ang = (-90 + (Math.random() * 120 - 60)) * Math.PI / 180;
      var dist = 60 + Math.random() * 70;
      p.style.left = cx + 'px';
      p.style.top = cy + 'px';
      p.style.setProperty('--dx', Math.cos(ang) * dist + 'px');
      p.style.setProperty('--dy', Math.sin(ang) * dist + 'px');
      p.style.setProperty('--rot', (Math.random() * 540 - 270) + 'deg');
      p.style.animationDelay = (Math.random() * 0.08) + 's';
      p.style.fontSize = (14 + Math.random() * 12) + 'px';
      layer.appendChild(p);
      setTimeout((function(node){ return function(){ node.remove(); }; })(p), 1100);
    }
  },

  /* full-width confetti for a finished slot or day */
  confetti: function(big){
    if (!DB.settings.effects || FX.reduced()) return;
    var layer = FX.layer();
    var colours = ['#f2b705', '#e0574f', '#3f8f8a', '#7a55c8', '#2b6fc4', '#2c8b58'];
    var n = big ? 70 : 38;
    for (var i = 0; i < n; i++){
      var c = document.createElement('span');
      c.className = 'fx-c';
      c.style.left = (Math.random() * 100) + 'vw';
      c.style.background = colours[i % colours.length];
      c.style.setProperty('--dy', (window.innerHeight + 80) + 'px');
      c.style.setProperty('--rot', (Math.random() * 900 - 450) + 'deg');
      c.style.setProperty('--dur', (1.5 + Math.random() * 1.4) + 's');
      c.style.animationDelay = (Math.random() * 0.45) + 's';
      if (Math.random() > 0.6) c.style.borderRadius = '50%';
      layer.appendChild(c);
      setTimeout((function(node){ return function(){ node.remove(); }; })(c), 3400);
    }
  },

  /* one call covering the whole "a task was ticked" moment */
  tick: function(el, done){
    if (done){ FX.chime(); FX.burst(el); }
    else FX.unchime();
  },
  slotDone: function(){ FX.fanfare(); FX.confetti(false); },
  dayDone: function(){ FX.hooray(); FX.confetti(true); }
};
