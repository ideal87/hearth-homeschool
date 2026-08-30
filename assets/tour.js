/* ============================================================
   Tutorial layer: spotlight coachmarks + first-run welcome.
   ============================================================ */

var Tour = {
  active:false, steps:[], i:0,

  start: function(steps){
    if (!steps || !steps.length) return;
    Tour.stop();
    Tour.steps = steps; Tour.i = 0; Tour.active = true;

    var block = document.createElement('div'); block.className = 'tour-block';
    var hole  = document.createElement('div'); hole.className  = 'tour-hole';
    var pop   = document.createElement('div'); pop.className   = 'tour-pop';
    $('#tour-root').append(block, hole, pop);

    pop.addEventListener('click', function(e){
      if (e.target.closest('[data-tour-next]')) Tour.go(1);
      else if (e.target.closest('[data-tour-prev]')) Tour.go(-1);
      else if (e.target.closest('[data-tour-stop]')) Tour.stop();
    });
    block.addEventListener('click', function(){ Tour.stop(); });
    window.addEventListener('resize', Tour.place);
    window.addEventListener('scroll', Tour.place, true);
    Tour.show();
  },

  go: function(d){
    var n = Tour.i + d;
    if (n < 0) return;
    if (n >= Tour.steps.length){ Tour.stop(); toast('That is the tour - press ? any time', 'ok', '👍'); return; }
    Tour.i = n; Tour.show();
  },

  show: function(){
    var s = Tour.steps[Tour.i];
    if (s.view && state.view !== s.view){ state.view = s.view; render(); }
    if (s.before) s.before();
    setTimeout(function(){
      var t = s.sel ? $(s.sel) : null;
      if (s.sel && !t){ Tour.go(1); return; }
      if (t && t.scrollIntoView) t.scrollIntoView({ block:'center', inline:'nearest' });

      $('.tour-pop').innerHTML =
        '<h4>' + (s.emoji ? '<span>' + s.emoji + '</span>' : icon('spark', 'i-sm')) + s.title + '</h4>' +
        '<p>' + s.body + '</p>' +
        '<div class="tour-foot">' +
          '<span class="tour-count">' + (Tour.i + 1) + ' / ' + Tour.steps.length + '</span>' +
          '<div class="row">' +
            '<button class="btn btn-sm btn-ghost" data-tour-stop="1">Skip</button>' +
            (Tour.i ? '<button class="btn btn-sm" data-tour-prev="1">Back</button>' : '') +
            '<button class="btn btn-sm btn-primary" data-tour-next="1">' +
              (Tour.i === Tour.steps.length - 1 ? 'Done' : 'Next') + '</button>' +
          '</div>' +
        '</div>';
      Tour.place();
    }, s.view || s.before ? 70 : 0);
  },

  place: function(){
    if (!Tour.active) return;
    var s = Tour.steps[Tour.i];
    var hole = $('.tour-hole'), pop = $('.tour-pop');
    if (!hole || !pop) return;
    var t = s.sel ? $(s.sel) : null;

    if (!t){
      hole.style.display = 'none';
      pop.style.top  = (window.innerHeight / 2 - pop.offsetHeight / 2) + 'px';
      pop.style.left = (window.innerWidth / 2 - pop.offsetWidth / 2) + 'px';
      return;
    }
    hole.style.display = '';
    var r = t.getBoundingClientRect(), pad = 8;
    hole.style.top    = (r.top - pad) + 'px';
    hole.style.left   = (r.left - pad) + 'px';
    hole.style.width  = (r.width + pad * 2) + 'px';
    hole.style.height = (r.height + pad * 2) + 'px';

    var pw = pop.offsetWidth, ph = pop.offsetHeight, gap = 16;
    var side = s.side || (r.bottom + gap + ph < window.innerHeight ? 'bottom'
                        : r.top - gap - ph > 0 ? 'top'
                        : r.right + gap + pw < window.innerWidth ? 'right' : 'left');
    var top, left;
    if (side === 'bottom'){ top = r.bottom + gap; left = r.left + r.width / 2 - pw / 2; }
    else if (side === 'top'){ top = r.top - ph - gap; left = r.left + r.width / 2 - pw / 2; }
    else if (side === 'right'){ left = r.right + gap; top = r.top; }
    else { left = r.left - pw - gap; top = r.top; }

    pop.style.top  = Math.max(10, Math.min(top, window.innerHeight - ph - 10)) + 'px';
    pop.style.left = Math.max(10, Math.min(left, window.innerWidth - pw - 10)) + 'px';
  },

  stop: function(){
    Tour.active = false;
    ['.tour-block', '.tour-hole', '.tour-pop'].forEach(function(sel){
      var e = $(sel); if (e) e.remove();
    });
    window.removeEventListener('resize', Tour.place);
    window.removeEventListener('scroll', Tour.place, true);
  }
};

/* ------------------------------------------------------------------ */
var TOURS = {
  routine: [
    { sel:'.board', emoji:'📋', title:'One column per child',
      body:'The whole family on one screen, colour-coded. On a tablet you swipe sideways; on a big screen they sit side by side. Every tick is saved in this browser straight away.' },
    { sel:'.ringwrap', emoji:'🎯', title:'How far through the day',
      body:'The ring fills as tasks get ticked - a glanceable answer to "are we nearly done?" that works for a child who cannot read yet.' },
    { sel:'.slotbar', emoji:'☀️', title:'Morning, midday, evening',
      body:'Three fat buttons, each showing how many are done. Children only see the part of the day they are actually in.' },
    { sel:'.evrow', emoji:'📅', title:'Today&rsquo;s lessons appear here',
      body:'The dashed cards are entries from the <b>Calendar</b> scheduled for that child today, dropped into the right part of the day. The calendar itself never shows routines - that would bury it in "brush teeth".' },
    { sel:'.task', emoji:'👆', title:'The whole row is the button',
      body:'No tiny checkbox to aim at. Tap anywhere and it ticks, turns the child&rsquo;s colour, and pays out its stars.' },
    { sel:'.bonus, .celebrate', emoji:'🏅', title:'Bonus for a clean sweep',
      body:'Clearing a whole slot pays a bonus on top of the individual stars - which is what actually gets the last two jobs done. Set the amount in Settings.' },
    { sel:'[data-action="manage-tasks"]', emoji:'✏️', title:'Add your own',
      body:'<b>Manage</b> opens the full list: add, edit or delete routines and chores, set who does them, which days, and what they are worth.' }
  ],
  rewards: [
    { sel:'.bankcard', emoji:'🏦', title:'The star bank',
      body:'Worked out live from the ticks on the routine board minus anything cashed in, so the two can never drift apart.' },
    { sel:'.rewardcard', emoji:'🏪', title:'A store you set together',
      body:'Add, rename, reprice or delete rewards. They work best as experiences - a film pick, a later bedtime - chosen with your child.' },
    { sel:'.card .card-title', emoji:'✋', title:'Approve before stars leave',
      body:'With parent approval on (Settings), cashing in creates a request you approve or deny here. Denied requests refund the stars.' }
  ],
  calendar: [
    { sel:'.lanes', emoji:'🎨', title:'Rows are children, colours are subjects',
      body:'Maths blue, reading red, science green. You read the shape of the week without reading a word. Which weekday columns appear is set in Settings.' },
    { sel:'.cal-toolbar .seg', emoji:'🔍', title:'Day, week or month',
      body:'Week is the planning view, day breaks it out per child, month spots co-op weeks and trips.' },
    { sel:'[data-action="new-event"]', emoji:'➕', title:'Add a real event',
      body:'Pick who it is for, a subject colour, a time, and whether it repeats weekly or happens once. Saved to this browser.' }
  ],
  kids: [
    { sel:'.card.tint', emoji:'👧', title:'A profile per child',
      body:'Name, grade, colour and sign-in animal. Change any of it and every other live screen follows immediately.' },
    { sel:'[data-action^="edit-kid"]', emoji:'✏️', title:'Fully editable',
      body:'Add a child, recolour them, or remove them entirely. Removing also clears their tasks, stars and calendar entries.' },
    { sel:'[data-action^="kid-mode"]', emoji:'👀', title:'Their own view',
      body:'Hand the tablet over: only their tasks, in huge rows, with their star total. They sign in by tapping an animal, not typing a password.' }
  ],
  settings: [
    { sel:'[data-set="slotBonus"]', emoji:'⭐', title:'Star values are yours',
      body:'Change the slot bonus and go back to the board - every total recalculates immediately.' },
    { sel:'[data-action="export-data"]', emoji:'💾', title:'It is your data',
      body:'Everything lives in this browser only. Export a JSON snapshot to keep it, or import one to move it to another machine.' },
    { sel:'.card.mock', emoji:'🚧', title:'Marked mockup',
      body:'Cards and screens with this badge are sketches - sync, notifications, and the compliance tracking are not wired up.' }
  ],
  today:    [{ emoji:'🚧', title:'This screen is a mockup', body:'It sketches a morning dashboard. The live screens are Routine, Rewards, Calendar and Kids.' }],
  lessons:  [{ emoji:'🚧', title:'This screen is a mockup', body:'It sketches per-subject lesson lists. Nothing here is saved.' }],
  progress: [{ emoji:'🚧', title:'This screen is a mockup', body:'It sketches mastery tracking instead of grades. Nothing here is saved.' }],
  records:  [{ emoji:'🚧', title:'This screen is a mockup', body:'It sketches attendance and printable reports. Nothing here is saved.' }]
};

function welcomeModal(){
  openModal({
    title: 'Welcome to Hearth',
    sub: 'A touch-first calendar for homeschooling little ones',
    size: 'narrow',
    body:
      '<div class="welcome-art">' +
        '<div class="k1"><span class="em">✅</span>Routines<br>&amp; chores</div>' +
        '<div class="k2"><span class="em">⭐</span>Stars<br>&amp; rewards</div>' +
        '<div class="k3"><span class="em">🎨</span>A colour<br>per child</div>' +
      '</div>' +
      '<p class="sm muted" style="margin:0 0 12px">Built for children in <b>Kindergarten, Grade 1 and Grade 4</b> - so there are no grades, no GPA and no transcripts.</p>' +
      '<p class="sm muted" style="margin:0 0 12px"><b>Routine, Rewards, Calendar and Kids really work</b>, and everything you change is saved in this browser. <b>Today, Lessons, Progress and Records</b> are still static mockups and say so.</p>' +
      '<p class="sm muted" style="margin:0">Nothing is uploaded anywhere - Settings has an export if you want a copy.</p>',
    foot:
      '<button class="btn left btn-ghost" data-action="never-mind">Skip</button>' +
      '<button class="btn btn-primary" data-action="tour-start">Show me the board</button>'
  });
}
