/* ============================================================
   UI primitives: modal, drawer, toast, and shared fragments.
   ============================================================ */

function $(sel, root){ return (root || document).querySelector(sel); }
function $$(sel, root){ return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
function esc(s){
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function pct(a, b){ return b ? Math.round(a / b * 100) : 0; }

/* ---------- toast ---------- */
function toast(msg, kind, emoji){
  var root = $('#toast-root');
  var el = document.createElement('div');
  el.className = 'toast ' + (kind || '');
  el.innerHTML = (emoji ? '<span class="em">' + emoji + '</span>' : icon(kind === 'ok' ? 'check' : 'spark', 'i-sm')) +
                 '<span>' + esc(msg) + '</span>';
  root.appendChild(el);
  setTimeout(function(){
    el.style.transition = 'opacity .25s, transform .25s';
    el.style.opacity = '0'; el.style.transform = 'translateY(8px)';
    setTimeout(function(){ el.remove(); }, 260);
  }, 2800);
}

/* ---------- modal ---------- */
var _modalStack = [];
function openModal(opts){
  var back = document.createElement('div');
  back.className = 'backdrop';
  back.innerHTML =
    '<div class="modal ' + (opts.size || '') + '" role="dialog" aria-modal="true">' +
      '<div class="modal-head">' +
        '<div><div class="page-title">' + (opts.title || '') + '</div>' +
        (opts.sub ? '<div class="page-sub">' + opts.sub + '</div>' : '') + '</div>' +
        '<button class="btn btn-ghost btn-icon" data-close="1" aria-label="Close">' + icon('x') + '</button>' +
      '</div>' +
      '<div class="modal-body"></div>' +
      '<div class="modal-foot"></div>' +
    '</div>';
  $('#modal-root').appendChild(back);

  var api = {
    el: back,
    body: $('.modal-body', back),
    foot: $('.modal-foot', back),
    setBody: function(html){ api.body.innerHTML = html; return api; },
    setFoot: function(html){ api.foot.innerHTML = html; api.foot.classList.toggle('hidden', !html); return api; },
    close: function(){
      back.remove();
      _modalStack = _modalStack.filter(function(m){ return m !== api; });
      if (!_modalStack.length) document.body.style.overflow = '';
    }
  };
  api.setBody(opts.body || '');
  api.setFoot(opts.foot || '');

  back.addEventListener('click', function(e){
    if (e.target === back) api.close();
    if (e.target.closest && e.target.closest('[data-close]')) api.close();
  });
  document.body.style.overflow = 'hidden';
  _modalStack.push(api);
  if (opts.onMount) opts.onMount(api);
  return api;
}
function closeTopModal(){ if (_modalStack.length) _modalStack[_modalStack.length - 1].close(); }
document.addEventListener('keydown', function(e){
  if (e.key === 'Escape'){
    if (typeof Tour !== 'undefined' && Tour.active){ Tour.stop(); return; }
    if ($('.kidwrap')){ $('.kidwrap').remove(); document.body.style.overflow = ''; return; }
    if ($('.drawer')){ closeDrawer(); return; }
    closeTopModal();
  }
});

/* ---------- drawer ---------- */
function openDrawer(opts){
  closeDrawer();
  var back = document.createElement('div');
  back.className = 'drawer-back';
  var d = document.createElement('aside');
  d.className = 'drawer';
  d.innerHTML =
    '<div class="drawer-head">' +
      '<div class="row-b"><div class="grow">' + (opts.head || '') + '</div>' +
      '<button class="btn btn-ghost btn-icon" data-drawer-close="1" aria-label="Close">' + icon('x') + '</button></div>' +
    '</div>' +
    (opts.tabs || '') +
    '<div class="drawer-body">' + (opts.body || '') + '</div>';
  document.body.appendChild(back);
  document.body.appendChild(d);
  back.addEventListener('click', closeDrawer);
  d.addEventListener('click', function(e){ if (e.target.closest('[data-drawer-close]')) closeDrawer(); });
  return d;
}
function closeDrawer(){
  var d = $('.drawer'), b = $('.drawer-back');
  if (d) d.remove();
  if (b) b.remove();
}

/* ---------- shared fragments ---------- */
function face(kidId, size){
  var k = kid(kidId);
  if (!k) return '';
  return '<span class="face ' + k.color + (size ? ' face-' + size : '') + '">' + k.emoji + '</span>';
}
function kidDot(kidId){
  var k = kid(kidId);
  return k ? '<span class="dot-c ' + k.color + '"></span>' : '';
}

function starPill(n, big){
  return '<span class="star' + (big ? ' big' : '') + '">⭐ ' + n + '</span>';
}
function progressBar(value, total, cls, fat){
  return '<div class="bar' + (fat ? ' fat' : '') + '"><i class="' + (cls || '') +
         '" style="width:' + Math.min(100, pct(value, total)) + '%"></i></div>';
}
function statCard(o){
  return '<div class="stat' + (o.tint ? ' tint ' + o.tint : '') + '">' +
    '<div class="k">' + (o.emoji ? '<span>' + o.emoji + '</span>' : icon(o.icon, 'i-sm')) + o.label + '</div>' +
    '<div class="v">' + o.value + (o.unit ? ' <small>' + o.unit + '</small>' : '') + '</div>' +
    (o.bar != null ? '<div style="margin-top:10px">' + progressBar(o.bar, o.barMax, o.barCls) + '</div>' : '') +
    (o.note ? '<div class="n">' + o.note + '</div>' : '') +
  '</div>';
}
function checkCircle(){ return '<span class="check">' + icon('check') + '</span>'; }
function sw(on, action){
  return '<button class="switch' + (on ? ' on' : '') + '" data-action="' + action + '" role="switch" aria-checked="' + (!!on) + '"></button>';
}
function tipBanner(id, title, text){
  if (!DB.settings.showTips || DB.settings.tipsOff.indexOf(id) > -1) return '';
  return '<div class="tip" data-tipid="' + id + '">' + icon('spark') +
    '<div class="tip-body"><b>' + title + '</b><p>' + text + '</p></div>' +
    '<button class="btn btn-sm btn-ghost" data-action="tip-off:' + id + '">Got it</button>' +
  '</div>';
}
function emptyRow(text){ return '<div class="li"><span class="faint">' + text + '</span></div>'; }
