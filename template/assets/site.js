(function () {
  var doc = document.documentElement;
  var he = doc.lang === 'he';
  doc.classList.add('js');

  // Mobile navigation
  var toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open);
    });
    document.querySelectorAll('.nav a').forEach(function (a) {
      a.addEventListener('click', function () { document.body.classList.remove('nav-open'); toggle.setAttribute('aria-expanded', 'false'); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('nav-open')) { document.body.classList.remove('nav-open'); toggle.setAttribute('aria-expanded', 'false'); toggle.focus(); }
    });
  }

  // Header becomes solid after leaving the hero
  var header = document.querySelector('.site-header');
  var hero = document.querySelector('.hero');
  if (header && hero) {
    var onScroll = function () { header.classList.toggle('is-solid', window.scrollY > hero.offsetHeight - 120); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Hero slideshow
  var slides = document.querySelectorAll('.hero-slides img');
  if (slides.length > 1 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var i = 0;
    setInterval(function () {
      slides[i].classList.remove('is-active');
      i = (i + 1) % slides.length;
      slides[i].classList.add('is-active');
    }, 7000);
  }

  // Reveal on scroll
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-in'); });
  }

  // Lightbox for [data-lightbox] links
  var links = Array.prototype.slice.call(document.querySelectorAll('a[data-lightbox]'));
  if (links.length) {
    var lb = document.createElement('div');
    lb.className = 'lightbox'; lb.hidden = true; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true');
    lb.innerHTML = '<figure style="margin:0"><img alt=""><p></p></figure>' +
      '<button class="lb-close" aria-label="' + (he ? 'סגירה' : 'Close') + '">×</button>' +
      '<button class="lb-prev" aria-label="' + (he ? 'הקודם' : 'Previous') + '">' + (he ? '›' : '‹') + '</button>' +
      '<button class="lb-next" aria-label="' + (he ? 'הבא' : 'Next') + '">' + (he ? '‹' : '›') + '</button>';
    document.body.appendChild(lb);
    var lbImg = lb.querySelector('img'), lbCap = lb.querySelector('p'), cur = 0, lastFocus;
    var show = function (n) {
      cur = (n + links.length) % links.length;
      var a = links[cur], im = a.querySelector('img');
      lbImg.src = a.href; lbImg.alt = im ? im.alt : '';
      lbCap.textContent = a.getAttribute('data-caption') || (im ? im.alt : '');
    };
    var close = function () { lb.hidden = true; document.body.style.overflow = ''; if (lastFocus) lastFocus.focus(); };
    links.forEach(function (a, n) {
      a.addEventListener('click', function (e) { e.preventDefault(); lastFocus = a; show(n); lb.hidden = false; document.body.style.overflow = 'hidden'; lb.querySelector('.lb-close').focus(); });
    });
    lb.querySelector('.lb-close').onclick = close;
    lb.querySelector('.lb-prev').onclick = function () { show(cur - 1); };
    lb.querySelector('.lb-next').onclick = function () { show(cur + 1); };
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(he ? cur + 1 : cur - 1);
      if (e.key === 'ArrowRight') show(he ? cur - 1 : cur + 1);
    });
  }

  // Enquiry form -> pre-filled WhatsApp message (no server needed)
  document.querySelectorAll('form[data-whatsapp]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var lines = [form.getAttribute('data-intro') || ''];
      form.querySelectorAll('input, select, textarea').forEach(function (f) {
        if (!f.name || !f.value.trim()) return;
        var label = f.closest('label');
        var name = label ? label.firstChild.textContent.trim().replace(/\?$/, '') : f.name;
        lines.push(name + ': ' + f.value.trim());
      });
      window.open('https://wa.me/' + form.getAttribute('data-whatsapp') + '?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
    });
  });

  // Footer year
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  // One-page site: a link to a section of the page we are already on scrolls instead of reloading
  var here = location.pathname.replace(/\/$/, '/index.html');
  document.querySelectorAll('a[href*="#"]').forEach(function (a) {
    var href = a.getAttribute('href') || '';
    if (!href || href.charAt(0) === '#') return;
    var hash = href.slice(href.indexOf('#'));
    if (hash.length < 2 || a.pathname !== here) return;
    a.addEventListener('click', function (e) {
      var target = document.querySelector(hash);
      if (!target) return;
      e.preventDefault();
      document.body.classList.remove('nav-open');
      target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      history.replaceState(null, '', hash);
    });
  });

  // Review marks: list everything highlighted before the site goes live
  if (doc.getAttribute('data-mode') !== 'preview') return;
  var marks = Array.prototype.slice.call(document.querySelectorAll('.rv, .rv-block'));
  if (!marks.length) return;
  var KEY = 'rv-hidden';
  var hidden = false;
  try { hidden = localStorage.getItem(KEY) === '1'; } catch (e) {}
  var t = he
    ? { count: ' לבדיקה בעמוד', title: 'פריטים לבדיקה מול ורד', hide: 'הסתרת הסימון', show: 'הצגת הסימון', hiddenLabel: 'הסימון מוסתר' }
    : { count: ' to review on this page', title: 'Items to review with Vered', hide: 'Hide highlights', show: 'Show highlights', hiddenLabel: 'Highlights hidden' };
  var fab = document.createElement('button');
  fab.className = 'rv-fab'; fab.type = 'button';
  var panel = document.createElement('div');
  panel.className = 'rv-panel'; panel.hidden = true;
  var list = marks.map(function (m, n) {
    var text = (m.classList.contains('rv-block') ? '' : m.textContent.trim()).replace(/\s+/g, ' ');
    if (text.length > 70) text = text.slice(0, 70) + '…';
    var note = m.getAttribute('data-note') || '';
    return '<li><button type="button" data-i="' + n + '">' + (text ? '«' + escapeHtml(text) + '»' : escapeHtml(note)) +
      (text && note ? '<small>' + escapeHtml(note) + '</small>' : '') + '</button></li>';
  }).join('');
  panel.innerHTML = '<header><span>' + t.title + '</span><button type="button" class="rv-toggle"></button></header><ol>' + list + '</ol>';
  document.body.appendChild(panel); document.body.appendChild(fab);
  marks.forEach(function (m) { if (m.getAttribute('data-note') && !m.title) m.title = m.getAttribute('data-note'); });

  function render() {
    doc.classList.toggle('rv-hidden', hidden);
    fab.textContent = hidden ? '🟨 ' + t.hiddenLabel : '🟨 ' + marks.length + t.count;
    panel.querySelector('.rv-toggle').textContent = hidden ? t.show : t.hide;
  }
  fab.onclick = function () { panel.hidden = !panel.hidden; };
  panel.querySelector('.rv-toggle').onclick = function () {
    hidden = !hidden;
    try { localStorage.setItem(KEY, hidden ? '1' : '0'); } catch (e) {}
    render();
  };
  panel.querySelectorAll('li button').forEach(function (b) {
    b.onclick = function () {
      var m = marks[+b.getAttribute('data-i')];
      var details = m.closest('details'); if (details) details.open = true;
      m.scrollIntoView({ behavior: 'smooth', block: 'center' });
      m.classList.remove('rv-flash'); void m.offsetWidth; m.classList.add('rv-flash');
    };
  });
  render();

  function escapeHtml(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
})();
