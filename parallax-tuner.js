/**
 * Shared Parallax & Tuner Registration Module
 * Provides unified functions for hero parallax, image parallax, and reveal animations.
 * Used by all pages — loads unconditionally. Tuner panel (gsap-tuner.js) is optional overlay.
 */
(function() {
  'use strict';

  var _r = window.__GSAP_TUNER_REGISTRY = window.__GSAP_TUNER_REGISTRY || [];
  var isMobile = window.innerWidth <= 600;
  var posStep = isMobile ? 4 : 8;

  // ===================== HERO PARALLAX =====================

  /**
   * Register hero background parallax with unified tuner entry.
   * @param {Object} sel - { bg: '.hero-bg', trigger: '.hero' }
   * @param {Object} defaults - { movement: 30 }
   */
  window.registerHeroParallax = function(sel, defaults) {
    if (!window.gsap || !window.ScrollTrigger) return;
    var bgSel = sel.bg;
    var triggerSel = sel.trigger;
    var def = defaults || {};
    var movement = def.movement != null ? def.movement : 30;

    function build(p) {
      gsap.killTweensOf(bgSel);
      ScrollTrigger.getAll().filter(function(st) { return st.vars.trigger === triggerSel; }).forEach(function(st) { st.kill(); });
      gsap.to(bgSel, {
        yPercent: p.movement, ease: 'none',
        scrollTrigger: { trigger: triggerSel, start: 'top top', end: 'bottom top', scrub: true }
      });
    }

    build({ movement: movement });

    _r.push({
      id: 'hero-parallax',
      label: 'Hero Background',
      selector: bgSel,
      badge: 'parallax',
      params: {
        movement: { value: movement, min: -80, max: 80, step: 1, label: 'Scroll speed', unit: '%', section: 'Movement' }
      },
      rebuild: function(p) { build(p); }
    });
  };

  // ===================== PARALLAX IMAGES =====================

  /**
   * Detect which CSS property (left or right) is explicitly set on an element.
   * Scans stylesheets for explicit declarations — more reliable than getComputedStyle.
   */
  function detectPosition(img) {
    var usesRight = false, usesLeft = false;
    try {
      for (var si = 0; si < document.styleSheets.length; si++) {
        var rules;
        try { rules = document.styleSheets[si].cssRules; } catch(e) { continue; }
        if (!rules) continue;
        for (var ri = 0; ri < rules.length; ri++) {
          var rule = rules[ri];
          if (rule.selectorText && img.matches(rule.selectorText)) {
            if (rule.style.right && rule.style.right !== 'auto' && rule.style.right !== '') usesRight = true;
            if (rule.style.left && rule.style.left !== 'auto' && rule.style.left !== '') usesLeft = true;
          }
        }
      }
    } catch(e) {}
    // Fallback: if neither detected, default to left
    if (!usesRight && !usesLeft) usesLeft = true;
    return { usesRight: usesRight, usesLeft: usesLeft };
  }

  /**
   * Register parallax images with unified tuner entries.
   * Speed slider = direct pixel travel (negative=up, positive=down).
   *
   * @param {string} imgSelector - CSS selector for parallax images (e.g. '.parallax-img')
   * @param {Object} sectionMap - { 'section-class': { name: 'Label', layers: { 'img-class': { label: 'Large image', speed: -200 } } } }
   * @param {Object} [options] - { trigger: '.custom-trigger-selector' } — custom closest() selector for ScrollTrigger trigger
   */
  window.registerParallaxImages = function(imgSelector, sectionMap, options) {
    var triggerSelector = (options && options.trigger) || null;
    if (!window.gsap || !window.ScrollTrigger) return;

    var imgs = document.querySelectorAll(imgSelector);
    imgs.forEach(function(img) {
      var section = (triggerSelector && img.closest(triggerSelector)) || img.closest('section') || img.parentElement;

      // Find which sectionMap entry this image belongs to:
      // 1. Check if the image's parent/ancestor has a class matching a sectionMap key
      // 2. Then find which layer class the image has within that section's layers
      var match = null;
      var matchClass = null;
      var secKey = null;

      // Strategy 1: Find ancestor with section class, then match layer within it
      var secKeys = Object.keys(sectionMap);
      for (var si = 0; si < secKeys.length && !match; si++) {
        var sc = secKeys[si];
        var sec = sectionMap[sc];
        var ancestor = img.closest('.' + sc);
        if (!ancestor) continue;
        var layerKeys = Object.keys(sec.layers);
        for (var li = 0; li < layerKeys.length && !match; li++) {
          if (img.classList.contains(layerKeys[li])) {
            match = sec.layers[layerKeys[li]];
            matchClass = layerKeys[li];
            secKey = sc;
          }
        }
      }

      // Strategy 2: Fallback — images have globally unique classes as keys
      if (!match) {
        for (var si2 = 0; si2 < secKeys.length && !match; si2++) {
          var sc2 = secKeys[si2];
          var sec2 = sectionMap[sc2];
          var lk2 = Object.keys(sec2.layers);
          for (var li2 = 0; li2 < lk2.length && !match; li2++) {
            if (img.classList.contains(lk2[li2])) {
              match = sec2.layers[lk2[li2]];
              matchClass = lk2[li2];
              secKey = sc2;
            }
          }
        }
      }
      if (!match) return;

      var sectionName = sectionMap[secKey].name;
      var speed = match.speed;
      var cs = getComputedStyle(img);
      var pos = detectPosition(img);

      var initTop = Math.round(parseFloat(cs.top)) || 0;
      var initLeft = pos.usesLeft ? (Math.round(parseFloat(cs.left)) || 0) : null;
      var initRight = pos.usesRight ? (Math.round(parseFloat(cs.right)) || 0) : null;
      var initZ = parseInt(cs.zIndex) || 0;

      // Initial animation
      gsap.to(img, {
        y: speed, ease: 'none', immediateRender: true,
        scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true }
      });

      // Build params
      var params = {
        speed: { value: speed, min: -1000, max: 1000, step: 5, label: 'Travel', unit: 'px', section: 'Scroll effect' },
        direction: {
          value: speed, type: 'info', label: 'Direction',
          compute: function(ps) {
            var px = ps.speed.value;
            return px + 'px ' + (px < 0 ? '\u2191 upward' : px > 0 ? '\u2193 downward' : '\u2014 none');
          }
        },
        top: { value: initTop, step: posStep, type: 'stepper', label: 'top', unit: 'px', section: 'Position' }
      };
      if (pos.usesRight) {
        params.right = { value: initRight, step: posStep, type: 'stepper', label: 'right', unit: 'px', section: 'Position' };
      }
      if (pos.usesLeft) {
        params.left = { value: initLeft, step: posStep, type: 'stepper', label: 'left', unit: 'px', section: 'Position' };
      }
      params.zIndex = { value: initZ, step: 1, type: 'stepper', label: 'z-index', section: 'Stacking' };

      // Determine selector for element highlight — scope to parent if layer class isn't unique
      var selectorStr = (secKey && document.querySelectorAll('.' + matchClass).length > 1)
        ? '.' + secKey + ' .' + matchClass
        : '.' + matchClass;

      _r.push({
        id: 'parallax-' + secKey + '-' + matchClass,
        label: sectionName + ' \u2014 ' + match.label,
        selector: selectorStr,
        badge: 'parallax',
        params: params,
        rebuild: function(p) {
          gsap.killTweensOf(img);
          ScrollTrigger.getAll().filter(function(st) {
            return st.animation && st.animation.targets && st.animation.targets().includes(img);
          }).forEach(function(st) { st.kill(); });

          if (p.top != null) img.style.top = p.top + 'px';
          if (p.right != null) img.style.right = p.right + 'px';
          if (p.left != null) img.style.left = p.left + 'px';
          if (p.zIndex != null) img.style.zIndex = p.zIndex;

          gsap.set(img, { y: 0 });
          gsap.to(img, {
            y: p.speed, ease: 'none', immediateRender: true,
            scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true }
          });
        }
      });
    });
  };

  // ===================== REVEAL ANIMATIONS =====================

  /**
   * Register standard reveal-on-scroll animations.
   * Handles both .reveal (fade+slide) and .reveal-stagger (class toggle).
   */
  window.registerRevealAnimations = function() {
    if (!window.gsap || !window.ScrollTrigger) return;

    document.querySelectorAll('.reveal').forEach(function(el) {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 0.6, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 80%', once: true }
      });
    });

    document.querySelectorAll('.reveal-stagger').forEach(function(el) {
      ScrollTrigger.create({
        trigger: el, start: 'top 80%', once: true,
        onEnter: function() { el.classList.add('visible'); }
      });
    });
  };

})();
