'use strict';

/* ═══════════════════════════════════════════════════════
   main.js — Chirag Sharma Portfolio
   ANIMATION ENGINE v3 — 192 frames, buttery smooth
   • devicePixelRatio-aware canvas  → crisp on all screens
   • Adjacent-frame alpha blending  → no hard cuts
   • Lerp-based smooth frame cursor → eased animation
   • requestAnimationFrame loop     → 60fps locked
   • Priority preload first 12 frames → instant first paint
═══════════════════════════════════════════════════════ */

const TOTAL_FRAMES = 192;
const FRAMES_DIR   = './frames/';

/* ─── 1. HERO FRAME ANIMATION ────────────────────────── */
(function initHeroCanvas() {
  const canvas = document.getElementById('hero-canvas');
  const ctx    = canvas.getContext('2d');
  const heroEl = document.getElementById('hero');

  /* Images array index 0 … 191 */
  const images = new Array(TOTAL_FRAMES).fill(null);

  let currentFloat = 0;   // fractional frame currently rendered
  let targetFloat  = 0;   // fractional frame scroll wants
  let rafId        = null;

  /* ── DPR-AWARE CANVAS SETUP ──────────────────────────
     canvas.width = logical_w × devicePixelRatio
     ctx is scaled so all draw calls use logical pixels.
     imageSmoothingQuality MUST be set after every resize
     because assigning canvas.width resets ALL ctx state.
  ── */
  function setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const lw  = window.innerWidth;
    const lh  = window.innerHeight;

    canvas.width        = Math.round(lw * dpr);
    canvas.height       = Math.round(lh * dpr);
    canvas.style.width  = lw  + 'px';
    canvas.style.height = lh  + 'px';

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  }

  window.addEventListener('resize', () => {
    setupCanvas();
    renderAt(currentFloat);
  }, { passive: true });

  setupCanvas();

  /* ── COVER-FIT DRAW with optional alpha blend ────────
     Maintains aspect ratio, crops to fill viewport.
  ── */
  function drawImg(img, alpha) {
    if (!img || !img.complete || !img.naturalWidth) return;

    const cw = window.innerWidth;
    const ch = window.innerHeight;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    const canvasRatio = cw / ch;
    const imgRatio    = iw / ih;

    let sx, sy, sw, sh;

    if (imgRatio > canvasRatio) {
      // wider image → crop sides, center horizontally
      sh = ih;
      sw = sh * canvasRatio;
      sx = (iw - sw) * 0.5;
      sy = 0;
    } else {
      // taller image → crop bottom, keep top (face area)
      sw = iw;
      sh = sw / canvasRatio;
      sx = 0;
      sy = 0;  // anchor to top so face stays visible
    }

    if (alpha < 0.999) ctx.globalAlpha = alpha;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
    if (alpha < 0.999) ctx.globalAlpha = 1;
  }

  /* ── BLENDED RENDER at fractional frame position ─────
     frameFloat = 14.6  →  draw frame[14] at 100%
                            draw frame[15] at 60% on top
     → seamless blend, no visible jump between frames
  ── */
  function renderAt(frameFloat) {
    const lo    = Math.floor(frameFloat);
    const hi    = Math.min(lo + 1, TOTAL_FRAMES - 1);
    const blend = frameFloat - lo;

    const imgLo = images[lo];
    const imgHi = images[hi];

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    if (imgLo && imgLo.complete && imgLo.naturalWidth) {
      drawImg(imgLo, 1);
    }
    if (blend > 0.01 && imgHi && imgHi.complete && imgHi.naturalWidth) {
      drawImg(imgHi, blend);
    }
  }

  /* ── RAF ANIMATION LOOP ──────────────────────────────
     Lerp speed 0.16 = smooth but responsive.
     Stops loop when settled → saves CPU.
  ── */
  function animLoop() {
    currentFloat += (targetFloat - currentFloat) * 0.16;
    renderAt(currentFloat);

    if (Math.abs(targetFloat - currentFloat) > 0.05) {
      rafId = requestAnimationFrame(animLoop);
    } else {
      currentFloat = targetFloat;
      renderAt(currentFloat);
      rafId = null;
    }
  }

  /* ── SCROLL → TARGET FRAME ───────────────────────────
     #hero is 600vh tall, sticky child pins at top.
     Progress 0→1 maps to frames 0→191.
  ── */
  function onScroll() {
    const heroTop   = heroEl.offsetTop;
    const heroRange = heroEl.offsetHeight - window.innerHeight;
    if (heroRange <= 0) return;

    const progress = Math.min(Math.max(
      (window.scrollY - heroTop) / heroRange, 0), 1);

    targetFloat = progress * (TOTAL_FRAMES - 1);

    if (!rafId) rafId = requestAnimationFrame(animLoop);
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  /* ── PRELOAD ─────────────────────────────────────────
     First 12 frames load with high priority (shown immediately).
     Remaining 180 load in the background after a short delay.
  ── */
  function loadFrame(i) {
    const img = new Image();
    img.onload = () => {
      images[i] = img;
      if (i === 0) renderAt(0); // paint first frame instantly
    };
    img.src = `${FRAMES_DIR}ezgif-frame-${String(i + 1).padStart(3, '0')}.jpg`;
  }

  // Priority: first 12 frames
  for (let i = 0; i < 12; i++) loadFrame(i);

  // Background: rest after 100ms
  setTimeout(() => {
    for (let i = 12; i < TOTAL_FRAMES; i++) loadFrame(i);
  }, 100);

  onScroll();
})();


/* ─── 2. NAVBAR FROSTED-GLASS ON SCROLL ─────────────── */
(function initNavbar() {
  const nav = document.getElementById('navbar');
  function update() {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  }
  window.addEventListener('scroll', update, { passive: true });
  update();
})();


/* ─── 2b. HAMBURGER MOBILE MENU ──────────────────────── */
(function initHamburger() {
  const btn   = document.getElementById('hamburger');
  const links = document.getElementById('nav-links');
  if (!btn || !links) return;

  btn.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    btn.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open);
  });

  // Close menu when a nav link is clicked
  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      links.classList.remove('open');
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', false);
    });
  });
})();


/* ─── 3. REVEAL ON SCROLL ────────────────────────────── */
(function initReveal() {
  const obs = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    }),
    { threshold: 0.12, rootMargin: '0px 0px -50px 0px' }
  );
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
})();


/* ─── 4. ACTIVE NAV LINK HIGHLIGHT ──────────────────── */
(function initActiveNav() {
  const links = document.querySelectorAll('.nav-links a');
  const obs = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        const a = document.querySelector(`.nav-links a[href="#${e.target.id}"]`);
        if (a) a.classList.add('active');
      }
    }),
    { rootMargin: '-40% 0px -55% 0px' }
  );
  document.querySelectorAll('section[id]').forEach(s => obs.observe(s));
})();


/* ─── 5. HERO TEXT ROLE SWITCHER ──────────────────────── */
(function initHeroTextSwitcher() {
  const el = document.getElementById('hero-word');
  if (!el) return;

  const words = ['Scalable', 'Beautiful', 'Vibe-Driven', 'Performant'];
  let idx = 0;

  setInterval(() => {
    el.classList.add('word-out');
    
    setTimeout(() => {
      idx = (idx + 1) % words.length;
      el.textContent = words[idx];
      el.classList.remove('word-out');
      el.classList.add('word-in');
      
      // Trigger reflow
      void el.offsetWidth;
      
      el.classList.remove('word-in');
    }, 250); // Matches transition duration
  }, 2500);
})();

