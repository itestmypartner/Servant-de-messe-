/**
 * MOTION DESIGN — Servants de Messe
 * Style fluide et élégant : reveal au scroll, barre de progression,
 * header au scroll, retour en haut, compteurs. Aucun loader bloquant.
 * Partagé par toutes les pages de la plateforme.
 */
(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Éléments statiques révélés au scroll. Le contenu rendu dynamiquement
  // (planning, cartes mobiles, calendrier) est animé en CSS via --i.
  var REVEAL_SELECTORS = [
    '.section-title', '.card', '.stat-widget', '.activities li',
    '.about-text', '.about-image', '.gallery-slider',
    '.card-soft', '.level-card-clickable', '.form-card', '.admin-card'
  ].join(',');

  /* ==================== SCROLL : une seule boucle rAF ==================== */
  function initScroll() {
    var bar = document.createElement('div');
    bar.id = 'mdScrollProgress';
    document.body.appendChild(bar);

    var back = document.createElement('button');
    back.className = 'md-back-top';
    back.type = 'button';
    back.setAttribute('aria-label', 'Retour en haut de page');
    back.innerHTML = '&#8593;';
    document.body.appendChild(back);
    back.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    });

    var headers = document.querySelectorAll('.header, .topbar');
    var ticking = false;

    function update() {
      var h = document.documentElement;
      var y = window.scrollY;
      var max = h.scrollHeight - h.clientHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
      back.classList.toggle('md-visible', y > 480);
      headers.forEach(function (el) { el.classList.toggle('md-scrolled', y > 24); });
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ==================== REVEAL AU SCROLL ==================== */
  function initReveal() {
    var els = Array.prototype.filter.call(
      document.querySelectorAll(REVEAL_SELECTORS),
      function (el) { return !el.parentElement.closest('.reveal') && !el.closest('.modal'); }
    );

    if (reducedMotion || !('IntersectionObserver' in window)) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('revealed');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    var viewportH = window.innerHeight;
    els.forEach(function (el) {
      // Cascade douce entre éléments frères (max 4 crans)
      var siblings = Array.prototype.filter.call(el.parentElement.children, function (c) {
        return els.indexOf(c) !== -1;
      });
      var idx = Math.min(siblings.indexOf(el), 4);
      el.style.setProperty('--reveal-delay', (idx * 80) + 'ms');
      el.classList.add('reveal');
      // Déjà visible au chargement : révélé immédiatement (pas de flash)
      if (el.getBoundingClientRect().top < viewportH) {
        requestAnimationFrame(function () { el.classList.add('revealed'); });
      } else {
        io.observe(el);
      }
    });
  }

  /* ==================== COMPTEURS ==================== */
  function initCounters() {
    if (reducedMotion || !('IntersectionObserver' in window)) return;
    var targets = document.querySelectorAll('[data-count], .stat-number');
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
    if (target < 2 || target > 9999) return;
    var start = performance.now();
    var duration = 1200;
    function tick(now) {
      var p = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 4);
      el.textContent = text.replace(match[0], Math.round(target * eased));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function init() {
    initScroll();
    initReveal();
    initCounters();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
