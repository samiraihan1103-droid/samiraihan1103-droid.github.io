/* Shared helpers + animation primitives used by every page. */
(function () {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // *word* -> <em>word</em>, rendered as gradient text
  const emph = (s) => esc(s).replace(/\*(.+?)\*/g, '<em>$1</em>');
  const strip = (s) => String(s ?? '').replace(/\*/g, '');
  const nonEmpty = (a) => Array.isArray(a) && a.length > 0;

  function md(text) {
    if (!text) return '';
    if (window.marked && window.DOMPurify) return DOMPurify.sanitize(marked.parse(String(text)));
    return String(text).split(/\n{2,}/).map((p) => `<p>${esc(p)}</p>`).join('');
  }

  function hash(s) { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); }
  const svgUri = (svg) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  const accent = () => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#6D5DF6';

  // Soft pastel artwork used until an image is uploaded.
  const PASTELS = [['#E0E7FF', '#C7D2FE'], ['#FCE7F3', '#FBCFE8'], ['#E0F2FE', '#BAE6FD'], ['#EDE9FE', '#DDD6FE'], ['#F5F3FF', '#E9D5FF'], ['#ECFEFF', '#C7F0F7']];
  function placeholder(seed, label, w = 800, h = 560) {
    const [a, b] = PASTELS[hash(seed) % PASTELS.length];
    const initials = String(label || seed || '').replace(/\*/g, '').split(/\s+/).filter((x) => /^[\p{L}\p{N}]/u.test(x)).slice(0, 2).map((x) => x[0]).join('').toUpperCase();
    return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient><pattern id="p" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.4" fill="rgba(30,27,75,.08)"/></pattern></defs><rect width="100%" height="100%" fill="url(#g)"/><rect width="100%" height="100%" fill="url(#p)"/><circle cx="${w * .85}" cy="${h * .15}" r="${h * .4}" fill="rgba(255,255,255,.45)"/><circle cx="${w * .08}" cy="${h * .95}" r="${h * .32}" fill="rgba(255,255,255,.35)"/><text x="50%" y="53%" text-anchor="middle" dominant-baseline="middle" font-family="Plus Jakarta Sans,Arial,sans-serif" font-weight="800" font-size="${h * .2}" fill="rgba(30,27,75,.55)">${esc(initials)}</text></svg>`);
  }
  function avatar() {
    const a = accent();
    return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 720"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#EEF2FF"/><stop offset="1" stop-color="#FCE7F3"/></linearGradient></defs><rect width="600" height="720" fill="url(#g)"/><circle cx="300" cy="290" r="100" fill="${a}" fill-opacity=".18"/><path d="M95 720c0-125 92-225 205-225s205 100 205 225z" fill="${a}" fill-opacity=".18"/></svg>`);
  }
  function certArt(c) {
    const a = accent();
    const wrap = (t, n) => { const out = []; let line = ''; String(t || '').split(/\s+/).forEach((w) => { if ((line + ' ' + w).trim().length > n) { out.push(line); line = w; } else line = (line + ' ' + w).trim(); }); if (line) out.push(line); return out.slice(0, 3); };
    const lines = wrap(c.title, 24).map((l, i) => `<text x="400" y="${270 + i * 44}" text-anchor="middle" font-family="Plus Jakarta Sans,Arial,sans-serif" font-weight="700" font-size="34" fill="#1E1B4B">${esc(l)}</text>`).join('');
    return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="#FFFFFF"/><rect width="800" height="600" fill="${a}" fill-opacity=".05"/><rect x="26" y="26" width="748" height="548" rx="18" fill="none" stroke="${a}" stroke-width="3"/><rect x="42" y="42" width="716" height="516" rx="12" fill="none" stroke="#F472B6" stroke-opacity=".5"/><text x="400" y="150" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="18" letter-spacing="8" fill="${a}">CERTIFICATE</text><text x="400" y="192" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="20" fill="#64748B">of achievement</text>${lines}<line x1="290" y1="440" x2="510" y2="440" stroke="#CBD5E1"/><text x="400" y="472" text-anchor="middle" font-family="Arial,sans-serif" font-size="17" fill="#64748B">${esc(String(c.issuer || '').slice(0, 44))}</text><circle cx="660" cy="470" r="44" fill="${a}"/><circle cx="660" cy="470" r="34" fill="none" stroke="#fff" stroke-opacity=".7" stroke-dasharray="3 4"/><path d="M640 508l-12 46 20-12 12 18 4-48zM680 508l12 46-20-12-12 18-4-48z" fill="#F472B6"/></svg>`);
  }
  const img = (path, seed, label, w, h) => (path ? esc(path) : placeholder(seed, label, w, h));
  const range = (a, b) => [a, b === undefined ? '' : (b || 'Present')].filter(Boolean).join(' — ');
  function formatDate(d, long) {
    const dt = new Date(d);
    return !d ? '' : isNaN(dt) ? d : dt.toLocaleDateString('en-US', { year: 'numeric', month: long ? 'long' : 'short', day: 'numeric' });
  }
  const readingTime = (t) => Math.max(1, Math.round(String(t || '').split(/\s+/).length / 220));

  const ICONS = {
    github: 'fa-brands fa-github', gitlab: 'fa-brands fa-gitlab', linkedin: 'fa-brands fa-linkedin-in', twitter: 'fa-brands fa-x-twitter',
    x: 'fa-brands fa-x-twitter', facebook: 'fa-brands fa-facebook-f', instagram: 'fa-brands fa-instagram', youtube: 'fa-brands fa-youtube',
    medium: 'fa-brands fa-medium', kaggle: 'fa-brands fa-kaggle', researchgate: 'fa-brands fa-researchgate', orcid: 'fa-brands fa-orcid',
    scholar: 'fa-solid fa-graduation-cap', stackoverflow: 'fa-brands fa-stack-overflow', dribbble: 'fa-brands fa-dribbble', behance: 'fa-brands fa-behance',
    whatsapp: 'fa-brands fa-whatsapp', telegram: 'fa-brands fa-telegram', discord: 'fa-brands fa-discord', leetcode: 'fa-solid fa-code',
    codeforces: 'fa-solid fa-chart-simple', email: 'fa-solid fa-envelope', website: 'fa-solid fa-globe', blog: 'fa-solid fa-pen-nib', phone: 'fa-solid fa-phone',
  };
  const iconFor = (p) => ICONS[String(p || '').toLowerCase()] || 'fa-solid fa-link';
  const socialLinks = (list, cls = 'icon-btn') => (list || []).filter((s) => s.url).map((s) =>
    `<a class="${cls} magnetic" href="${esc(s.url)}" target="_blank" rel="noopener" aria-label="${esc(s.platform)}"><i class="${iconFor(s.platform)}"></i></a>`).join('');

  function hexToRgb(hex) {
    const m = String(hex || '').replace('#', '').match(/^([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (!m) return null;
    let h = m[1]; if (h.length === 3) h = [...h].map((c) => c + c).join('');
    const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  /* Content: the admin "Preview" opens the site with ?preview=1; the flag sticks for the tab
     so you can click through every page with your unsaved draft. */
  const isPreview = () => { try { return sessionStorage.getItem('preview-mode') === '1'; } catch (e) { return false; } };
  async function loadContent() {
    try { if (new URLSearchParams(location.search).has('preview')) sessionStorage.setItem('preview-mode', '1'); } catch (e) { /* ignore */ }
    if (isPreview()) {
      try { const d = localStorage.getItem('portfolio-draft'); if (d) return JSON.parse(d); } catch (e) { /* fall through */ }
    }
    const res = await fetch('data/content.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error('Could not load data/content.json');
    return res.json();
  }
  function exitPreview() { try { sessionStorage.removeItem('preview-mode'); } catch (e) { /* ignore */ } location.href = location.pathname; }

  function applySite(c) {
    const s = c.site || {};
    const root = document.documentElement.style;
    if (s.accent) { root.setProperty('--accent', s.accent); const rgb = hexToRgb(s.accent); if (rgb) root.setProperty('--accent-rgb', rgb.join(',')); }
    if (s.accent2) { root.setProperty('--accent-2', s.accent2); const rgb = hexToRgb(s.accent2); if (rgb) root.setProperty('--accent-2-rgb', rgb.join(',')); }
    const desc = $('meta[name="description"]'); if (desc && s.description) desc.content = s.description;
    if (s.favicon) { const f = $('#favicon'); if (f) { f.href = s.favicon; f.removeAttribute('type'); } }
  }

  /* ---------- Animations ---------- */
  function splitWords(el) {
    if (el.dataset.split) return; el.dataset.split = '1';
    let i = 0;
    const walk = (node) => [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(document.createTextNode(' ')); return; }
          const w = document.createElement('span'); w.className = 'w';
          const inner = document.createElement('span'); inner.textContent = part; inner.style.setProperty('--d', i++);
          w.append(inner); frag.append(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
    walk(el);
  }

  let io;
  function observeReveals(root = document) {
    $$('.split', root).forEach(splitWords);
    $$('[data-stagger]', root).forEach((p) => [...p.children].forEach((c, i) => c.style.setProperty('--i', i % 6)));
    const els = $$('.reveal, .reveal-scale, .split, .t-item, .skill-card, [data-count-root]', root).filter((e) => !e.closest('[data-manual]'));
    if (reduceMotion || !('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); $$('.count', root).forEach(runCount); return; }
    io = io || new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      $$('.count', e.target).forEach(runCount);
      io.unobserve(e.target);
    }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach((e) => io.observe(e));
  }

  function runCount(el) {
    if (el.dataset.done) return; el.dataset.done = '1';
    const to = parseFloat(el.dataset.to);
    if (isNaN(to) || reduceMotion) { el.textContent = el.dataset.to; return; }
    const decimals = (String(el.dataset.to).split('.')[1] || '').length, dur = 1800, t0 = performance.now();
    const step = (t) => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4); el.textContent = (to * e).toFixed(decimals); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }

  function initCursor(enabled) {
    if (!finePointer || reduceMotion || enabled === false) return;
    const dot = $('.cursor-dot'), ring = $('.cursor-ring'); if (!dot || !ring) return;
    const label = ring.querySelector('span');
    let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;
    addEventListener('mousemove', (e) => { x = e.clientX; y = e.clientY; document.body.classList.add('has-cursor'); dot.style.transform = `translate(${x}px,${y}px)`; }, { passive: true });
    document.addEventListener('mouseleave', () => document.body.classList.remove('has-cursor'));
    (function loop() { rx += (x - rx) * 0.18; ry += (y - ry) * 0.18; ring.style.transform = `translate(${rx}px,${ry}px)`; requestAnimationFrame(loop); })();
    document.addEventListener('mouseover', (e) => {
      const t = e.target.closest('[data-cursor]'), h = e.target.closest('a, button, input, textarea, .filter, label');
      ring.classList.toggle('label', !!t); ring.classList.toggle('hover', !t && !!h); label.textContent = t ? t.dataset.cursor : '';
    });
  }

  function initMagnetic(root = document) {
    if (!finePointer || reduceMotion) return;
    $$('.magnetic', root).forEach((el) => {
      if (el.dataset.mag) return; el.dataset.mag = '1';
      el.addEventListener('mousemove', (e) => { const r = el.getBoundingClientRect(); el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`; });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  function initTilt(root = document) {
    $$('.card', root).forEach((el) => {
      if (el.dataset.glow) return; el.dataset.glow = '1';
      el.insertAdjacentHTML('afterbegin', '<span class="card-glow"></span>');
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${e.clientX - r.left}px`); el.style.setProperty('--my', `${e.clientY - r.top}px`);
        if (finePointer && !reduceMotion && el.classList.contains('tilt')) {
          const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5, amt = +(el.dataset.tilt || 5);
          el.style.transform = `perspective(1000px) rotateX(${-py * amt}deg) rotateY(${px * amt}deg) translateY(-4px)`;
        }
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  window.Core = {
    $, $$, esc, emph, strip, md, nonEmpty, placeholder, avatar, certArt, img, range, formatDate, readingTime, iconFor, socialLinks, hexToRgb,
    reduceMotion, finePointer, loadContent, isPreview, exitPreview, applySite, splitWords, observeReveals, runCount, initCursor, initMagnetic, initTilt,
  };
})();
