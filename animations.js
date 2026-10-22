/**
 * MOTION DESIGN — Servants de Messe
 * Effets JS globaux : loader, barre de scroll, reveal au scroll,
 * ripples, tilt 3D, compteurs animés, retour en haut, navbar scrollée.
 * Partagé par toutes les pages de la plateforme.
 */
(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ==================== LOADER DE PAGE ==================== */
  function initLoader() {
    if (reducedMotion) return;
    var loader = document.createElement('div');
    loader.className = 'md-loader';
    loader.innerHTML =
      '<img src="logoservantdemesse.jpg" alt="Servants de Messe" onerror="this.style.display=\'none\'">' +
      '<div class="md-loader-ring"></div>' +
      '<div class="md-loader-text">Servants de Messe</div>';
    document.body.appendChild(loader);

    var hidden = false;
    function hide() {
      if (hidden) return;
      hidden = true;
      loader.classList.add('md-loader-hidden');
      setTimeout(function () { loader.remove(); }, 600);
    }
    window.addEventListener('load', hide);
    setTimeout(hide, 2200); // garde-fou
  }

  /* ==================== BARRE DE PROGRESSION SCROLL ==================== */
  function initScrollProgress() {
    var bar = document.createElement('div');
    bar.id = 'mdScrollProgress';
    document.body.appendChild(bar);
    var ticking = false;
    function update() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ==================== REVEAL AU SCROLL ==================== */
  var REVEAL_SELECTORS = [
    '.card', '.card-soft', '.stat-widget', '.activities li',
    '.about-text', '.about-image', '.gallery-slider', '.section-title',
    '.level-card-clickable', '.next-session-card', '.signature-box',
    '.mobile-session-card', '.trainer-item', '.month-nav', '.filter-bar',
    '.news-card', '.archive-item', '.admin-card', '.form-card'
  ].join(',');

  var io = null;
  function initReveal() {
    if (!('IntersectionObserver' in window)) {
      // Pas d'observer : tout visible directement
      document.querySelectorAll(REVEAL_SELECTORS).forEach(function (el) {
        el.classList.add('revealed');
      });
      return;
    }
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });

    tagRevealElements(document);

    // Re-tag le contenu injecté dynamiquement (formateurs, calendrier…)
    var mo = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) return;
          tagRevealElements(node.parentNode || document);
        });
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  function tagRevealElements(root) {
    var els = (root || document).querySelectorAll(REVEAL_SELECTORS + ':not([data-reveal-done])');
    var groupIndex = {};
    els.forEach(function (el) {
      if (el.closest('.reveal') || el.classList.contains('reveal')) return;
      el.setAttribute('data-reveal-done', '1');
      el.classList.add('reveal');
      // Stagger : délai progressif par groupe de voisins
      var parent = el.parentElement || document.body;
      var key = parent.className + '|' + (parent.id || '');
      groupIndex[key] = (groupIndex[key] || 0) + 1;
      el.style.setProperty('--reveal-delay', Math.min((groupIndex[key] - 1) * 90, 450) + 'ms');
      if (io) io.observe(el);
      else el.classList.add('revealed');
    });
  }

  /* ==================== RIPPLE SUR LES BOUTONS ==================== */
  function initRipple() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.btn, .level-chip, .gallery-btn');
      if (!btn) return;
      var rect = btn.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height);
      var span = document.createElement('span');
      span.className = 'md-ripple';
      span.style.width = span.style.height = size + 'px';
      span.style.left = (e.clientX - rect.left - size / 2) + 'px';
      span.style.top = (e.clientY - rect.top - size / 2) + 'px';
      btn.appendChild(span);
      setTimeout(function () { span.remove(); }, 650);
    });
  }

  /* ==================== NAVBAR ÉTAT SCROLLÉ ==================== */
  function initNavbarScroll() {
    var header = document.querySelector('.header');
    var navbar = document.querySelector('.topbar');
    if (!header && !navbar) return;
    function update() {
      var scrolled = window.scrollY > 40;
      if (header) header.classList.toggle('md-scrolled', scrolled);
      if (navbar) navbar.classList.toggle('md-scrolled', scrolled);
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ==================== BOUTON RETOUR EN HAUT ==================== */
  function initBackToTop() {
    var btn = document.createElement('button');
    btn.className = 'md-back-top';
    btn.setAttribute('aria-label', 'Retour en haut de page');
    btn.innerHTML = '&#8679;';
    document.body.appendChild(btn);
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    });
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        btn.classList.toggle('md-visible', window.scrollY > 420);
        ticking = false;
      });
    }, { passive: true });
  }

  /* ==================== TILT 3D SUR LES CARTES ==================== */
  function initTilt() {
    if (reducedMotion || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    var TILT_SELECTOR = '.stat-widget, .level-card-clickable, .card';
    var MAX = 4; // degrés

    document.addEventListener('mousemove', function (e) {
      var card = e.target.closest(TILT_SELECTOR);
      document.querySelectorAll('.md-tilt').forEach(function (el) {
        if (el !== card) { el.style.transform = ''; el.classList.remove('md-tilt'); }
      });
      if (!card) return;
      var rect = card.getBoundingClientRect();
      var px = (e.clientX - rect.left) / rect.width - 0.5;
      var py = (e.clientY - rect.top) / rect.height - 0.5;
      card.classList.add('md-tilt');
      card.style.transform =
        'perspective(700px) rotateX(' + (-py * MAX).toFixed(2) + 'deg)' +
        ' rotateY(' + (px * MAX).toFixed(2) + 'deg) translateY(-6px)';
    }, { passive: true });

    document.addEventListener('mouseleave', function () {
      document.querySelectorAll('.md-tilt').forEach(function (el) {
        el.style.transform = '';
        el.classList.remove('md-tilt');
      });
    });
  }

  /* ==================== COMPTEURS ANIMÉS ==================== */
  function initCounters() {
    if (reducedMotion || !('IntersectionObserver' in window)) return;
    var targets = document.querySelectorAll('.stat-widget .fw-bold, [data-count]');
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        cio.unobserve(entry.target);
        animateCount(entry.target);
      });
    }, { threshold: 0.6 });
    targets.forEach(function (t) { cio.observe(t); });
  }

  function animateCount(el) {
    var text = el.textContent;
    var match = text.match(/\d+/);
    if (!match) return;
    var target = parseInt(match[0], 10);
    if (target < 2 || target > 999) return;
    var start = performance.now();
    var duration = 900;
    function tick(now) {
      var p = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = text.replace(match[0], Math.round(target * eased));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ==================== PARALLAXE HERO LÉGER ==================== */
  function initParallax() {
    if (reducedMotion) return;
    var hero = document.querySelector('.hero-content');
    if (!hero) return;
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        if (y < window.innerHeight) {
          hero.style.transform = 'translateY(' + (y * 0.12) + 'px)';
          hero.style.opacity = Math.max(1 - y / (window.innerHeight * 0.85), 0);
        }
        ticking = false;
      });
    }, { passive: true });
  }

  /* ==================== BOOT ==================== */
  // Le loader démarre immédiatement (le script est chargé en fin de <body>,
  // body existe déjà — sinon on attend DOMContentLoaded)
  if (document.body) initLoader();
  else document.addEventListener('DOMContentLoaded', initLoader);

  function init() {
    initScrollProgress();
    initReveal();
    initNavbarScroll();
    initBackToTop();
    initCounters();
    initParallax();
    if (!reducedMotion) initRipple();
    initTilt();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
