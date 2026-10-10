(function(){
  'use strict';
  document.querySelectorAll('.ano').forEach(function(el){ el.textContent = new Date().getFullYear(); });

  /* Header + menu mobile */
  var header = document.querySelector('header.site');
  window.addEventListener('scroll', function(){ header.classList.toggle('scrolled', window.scrollY > 10); }, {passive:true});
  var burger = document.getElementById('burger'), menu = document.getElementById('menu');
  if (burger && menu){
    var setMenu = function(open){
      menu.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    };
    burger.addEventListener('click', function(){ setMenu(!menu.classList.contains('open')); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape') setMenu(false); });
  }

  /* Compartilhar (matéria) */
  var url = window.location.href.split('#')[0];
  var title = document.title;
  var targets = {
    whatsapp: 'https://api.whatsapp.com/send/?text=' + encodeURIComponent(title + ' ' + url),
    linkedin: 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url),
    facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url)
  };
  document.querySelectorAll('[data-share]').forEach(function(el){
    var kind = el.getAttribute('data-share');
    if (targets[kind]){
      el.setAttribute('href', targets[kind]);
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener noreferrer');
    } else if (kind === 'copy'){
      el.addEventListener('click', function(){
        var msg = document.querySelector('.copied');
        var done = function(){ if (msg){ msg.textContent = 'Link copiado!'; setTimeout(function(){ msg.textContent = ''; }, 2500); } };
        if (navigator.clipboard && window.isSecureContext){ navigator.clipboard.writeText(url).then(done, function(){}); }
        else {
          var t = document.createElement('textarea'); t.value = url; t.setAttribute('readonly', ''); t.style.position = 'absolute'; t.style.left = '-9999px';
          document.body.appendChild(t); t.select();
          try { document.execCommand('copy'); done(); } catch (e) {}
          document.body.removeChild(t);
        }
      });
    }
  });

  /* Listagem: busca, filtro por ano e paginação */
  var grid = document.getElementById('grid');
  if (!grid) return;
  var cards = Array.prototype.slice.call(grid.querySelectorAll('.press'));
  var q = document.getElementById('q'), chips = document.querySelectorAll('.chip');
  var countEl = document.getElementById('count'), emptyEl = document.getElementById('empty'), pager = document.getElementById('pager');
  var PER = 12, page = 1, year = '', term = '';

  var norm = function(s){ return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
  cards.forEach(function(c){ c._s = norm(c.getAttribute('data-search')); });

  /* estado na URL (?q=&ano=&p=) para links e botão voltar */
  var params = new URLSearchParams(window.location.search);
  term = (params.get('q') || '').slice(0, 80); year = params.get('ano') || ''; page = parseInt(params.get('p'), 10) || 1;
  if (q) q.value = term;

  function syncUrl(){
    var p = new URLSearchParams();
    if (term) p.set('q', term); if (year) p.set('ano', year); if (page > 1) p.set('p', page);
    var s = p.toString();
    try { history.replaceState(null, '', s ? '?' + s : window.location.pathname); } catch (e) {}
  }

  function btn(label, target, opts){
    var b = document.createElement('button');
    b.type = 'button'; b.textContent = label;
    if (opts && opts.aria) b.setAttribute('aria-label', opts.aria);
    if (opts && opts.current) b.setAttribute('aria-current', 'page');
    if (opts && opts.disabled) b.disabled = true;
    b.addEventListener('click', function(){ page = target; render(true); });
    return b;
  }

  function render(scroll){
    var t = norm(term).trim();
    var match = cards.filter(function(c){
      return (!year || c.getAttribute('data-year') === year) && (!t || c._s.indexOf(t) !== -1);
    });
    var pages = Math.max(1, Math.ceil(match.length / PER));
    if (page > pages) page = pages;
    var start = (page - 1) * PER, visible = match.slice(start, start + PER);
    cards.forEach(function(c){ c.hidden = true; });
    visible.forEach(function(c){ c.hidden = false; });
    countEl.textContent = match.length === 1 ? '1 publicação' : match.length + ' publicações';
    emptyEl.hidden = match.length !== 0;

    pager.innerHTML = '';
    if (pages > 1){
      pager.appendChild(btn('←', page - 1, {aria:'Página anterior', disabled: page === 1}));
      var shown = {};
      [1, 2, page - 1, page, page + 1, pages - 1, pages].forEach(function(n){ if (n >= 1 && n <= pages) shown[n] = true; });
      var last = 0;
      Object.keys(shown).map(Number).sort(function(a, b){ return a - b; }).forEach(function(n){
        if (n - last > 1){ var g = document.createElement('span'); g.className = 'gap'; g.textContent = '…'; pager.appendChild(g); }
        pager.appendChild(btn(String(n), n, {aria:'Página ' + n, current: n === page}));
        last = n;
      });
      pager.appendChild(btn('→', page + 1, {aria:'Próxima página', disabled: page === pages}));
    }
    chips.forEach(function(c){ c.setAttribute('aria-pressed', String(c.getAttribute('data-year') === year)); });
    syncUrl();
    if (scroll) countEl.scrollIntoView({behavior:'smooth', block:'start'});
  }

  var timer;
  q.addEventListener('input', function(){
    clearTimeout(timer);
    timer = setTimeout(function(){ term = q.value.slice(0, 80); page = 1; render(false); }, 180);
  });
  chips.forEach(function(c){
    c.addEventListener('click', function(){ year = c.getAttribute('data-year'); page = 1; render(false); });
  });
  render(false);
})();
