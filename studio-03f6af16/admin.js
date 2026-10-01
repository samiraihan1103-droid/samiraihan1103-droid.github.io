/* Portfolio admin — edits data/content.json and uploads files through the GitHub API.
   Everything runs in the browser; the access token never leaves this device except to api.github.com. */
(function () {
  'use strict';

  const CONTENT_PATH = 'data/content.json';
  const UPLOAD_DIR = 'assets/uploads';
  const CFG_KEY = 'portfolio-admin', TOKEN_KEY = 'portfolio-admin-token', AUTOSAVE_KEY = 'portfolio-admin-autosave', DRAFT_KEY = 'portfolio-draft';

  const S = { mode: null, owner: '', repo: '', branch: 'main', token: '', data: null, pristine: '', dirty: false, page: SCHEMA[0].key };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const openItems = new WeakSet();

  /* ---------- tiny DOM helper ---------- */
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'value') el.value = v; // property, so <textarea> works too
      else if (k in el && typeof v !== 'string') el[k] = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    kids.flat().forEach((c) => { if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(c)); });
    return el;
  }
  const ic = (cls) => h('i', { class: cls });
  const iconBtn = (icon, title, fn, cls = '') => h('button', { type: 'button', class: 'icon ' + cls, title, 'aria-label': title, onclick: (e) => { e.preventDefault(); e.stopPropagation(); fn(); } }, ic(icon));

  function toast(msg, type = 'info', ms = 4200) {
    const icons = { ok: 'fa-solid fa-circle-check', err: 'fa-solid fa-circle-exclamation', info: 'fa-solid fa-circle-info' };
    const t = h('div', { class: 'toast ' + type }, ic(icons[type]), h('div', { html: msg }));
    $('#toasts').append(t);
    setTimeout(() => { t.style.transition = 'opacity .4s'; t.style.opacity = 0; setTimeout(() => t.remove(), 400); }, ms);
  }

  const slugify = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70);
  const assetUrl = (p) => (!p ? '' : /^(https?:|data:|blob:)/.test(p) ? p : '../' + p.replace(/^\/+/, ''));

  /* ---------- base64 (UTF-8 safe) ---------- */
  function bytesToB64(bytes) { let bin = ''; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(bin); }
  const b64enc = (str) => bytesToB64(new TextEncoder().encode(str));
  const b64dec = (b64) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, '')), (c) => c.charCodeAt(0)));

  /* ---------- GitHub API ---------- */
  async function gh(path, opts = {}) {
    const res = await fetch(`https://api.github.com/repos/${encodeURIComponent(S.owner)}/${encodeURIComponent(S.repo)}${path}`, {
      ...opts, cache: 'no-store',
      headers: { Authorization: `Bearer ${S.token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(opts.body ? { 'Content-Type': 'application/json' } : {}) },
    });
    if (!res.ok) {
      let msg = res.statusText; try { msg = (await res.json()).message || msg; } catch (e) { /* ignore */ }
      const err = new Error(msg); err.status = res.status; throw err;
    }
    return res.status === 204 ? null : res.json();
  }
  const encPath = (p) => p.split('/').map(encodeURIComponent).join('/');
  const getFile = (path) => gh(`/contents/${encPath(path)}?ref=${encodeURIComponent(S.branch)}`);
  async function putFile(path, contentB64, message) {
    let sha;
    try { sha = (await getFile(path)).sha; } catch (e) { if (e.status !== 404) throw e; }
    return gh(`/contents/${encPath(path)}`, { method: 'PUT', body: JSON.stringify({ message, content: contentB64, branch: S.branch, ...(sha ? { sha } : {}) }) });
  }

  /* ---------- Session ---------- */
  function guessRepo() {
    const host = location.hostname;
    if (!host.endsWith('github.io')) return {};
    const owner = host.split('.')[0];
    // The editor folder has a secret name, so judge by depth: /<editor>/ → user site, /<repo>/<editor>/ → project site.
    const parts = location.pathname.split('/').filter((p) => p && p !== 'index.html');
    return { owner, repo: parts.length >= 2 ? parts[0] : `${owner}.github.io` };
  }
  function readCfg() { try { return JSON.parse(localStorage.getItem(CFG_KEY)) || {}; } catch (e) { return {}; } }

  function showLogin() {
    const cfg = { ...guessRepo(), ...readCfg() };
    $('#lg-owner').value = cfg.owner || '';
    $('#lg-repo').value = cfg.repo || '';
    $('#lg-branch').value = cfg.branch || 'main';
    $('#login').hidden = false; $('#app').hidden = true;
  }

  async function connect(owner, repo, branch, token, remember) {
    Object.assign(S, { owner: owner.trim(), repo: repo.trim(), branch: branch.trim() || 'main', token: token.trim(), mode: 'github' });
    const info = await gh('');
    if (info.permissions && !info.permissions.push) throw new Error('This token cannot write to the repository.');
    const file = await getFile(CONTENT_PATH);
    const data = JSON.parse(b64dec(file.content));
    localStorage.setItem(CFG_KEY, JSON.stringify({ owner: S.owner, repo: S.repo, branch: S.branch }));
    sessionStorage.setItem(TOKEN_KEY, S.token);
    if (remember) localStorage.setItem(TOKEN_KEY, S.token); else localStorage.removeItem(TOKEN_KEY);
    start(data);
  }

  async function startLocal() {
    S.mode = 'local';
    let data;
    try { const res = await fetch('../' + CONTENT_PATH, { cache: 'no-store' }); data = await res.json(); }
    catch (e) { toast('Could not read ../data/content.json — run a local web server (see README).', 'err', 8000); return; }
    start(data);
  }

  function start(data) {
    S.data = data; S.pristine = JSON.stringify(data); S.dirty = false;
    $('#login').hidden = true; $('#app').hidden = false;
    const conn = $('#conn');
    if (S.mode === 'github') { conn.textContent = `${S.owner}/${S.repo} · ${S.branch}`; conn.className = 'conn'; $('#save-label').textContent = ' Publish'; }
    else { conn.textContent = 'Local mode — publishing downloads content.json'; conn.className = 'conn local'; $('#save-label').textContent = ' Download'; }
    buildSidebar(); renderPage(); updateDirty();
    try {
      const auto = JSON.parse(localStorage.getItem(AUTOSAVE_KEY) || 'null');
      if (auto && auto.data && JSON.stringify(auto.data) !== S.pristine) $('#restore').hidden = false;
    } catch (e) { /* ignore */ }
  }

  function logout() {
    if (S.dirty && !confirm('You have unsaved changes. Sign out anyway?')) return;
    localStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(TOKEN_KEY);
    S.token = ''; S.dirty = false; location.reload();
  }

  /* ---------- Dirty state ---------- */
  let autosaveTimer;
  function markDirty() {
    S.dirty = JSON.stringify(S.data) !== S.pristine;
    updateDirty();
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      try { if (S.dirty) localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ at: Date.now(), data: S.data })); else localStorage.removeItem(AUTOSAVE_KEY); } catch (e) { /* storage full */ }
    }, 600);
  }
  function updateDirty() {
    $('#dirty-badge').hidden = !S.dirty;
    $('#save-btn').disabled = S.mode === 'github' ? !S.dirty : false;
    updateCounts();
  }

  /* ---------- Sidebar ---------- */
  const GROUPS = { dashboard: 'Overview', profile: 'Content', sections: 'Settings', site: 'Settings' };
  function buildSidebar() {
    const nav = $('#side-nav'); nav.innerHTML = '';
    let lastGroup = '';
    SCHEMA.forEach((p) => {
      const g = GROUPS[p.key] || lastGroup || 'Content';
      if (g !== lastGroup) { nav.append(h('div', { class: 'side-group' }, g)); lastGroup = g; }
      nav.append(h('button', { type: 'button', 'data-page': p.key, class: p.key === S.page ? 'active' : '', onclick: () => { S.page = p.key; renderPage(); $('#sidebar').classList.remove('open'); } },
        ic(p.icon), p.label, p.type === 'list' && !p.fixed ? h('span', { class: 'count' }, '') : null));
    });
    updateCounts();
  }
  function updateCounts() {
    $$('#side-nav button').forEach((b) => {
      const c = b.querySelector('.count'); if (!c || !S.data) return;
      c.textContent = (S.data[b.dataset.page] || []).length;
    });
  }

  function renderPage() {
    const page = SCHEMA.find((p) => p.key === S.page);
    $$('#side-nav button').forEach((b) => b.classList.toggle('active', b.dataset.page === S.page));
    $('#page-title').textContent = page.label;
    const ed = $('#editor'); ed.innerHTML = '';
    ed.style.animation = 'none'; void ed.offsetWidth; ed.style.animation = '';
    if (page.type === 'dashboard') { renderDashboard(ed); return; }
    if (page.help) ed.append(h('p', { class: 'page-help' }, page.help));
    if (page.type === 'list') {
      if (!Array.isArray(S.data[page.key])) S.data[page.key] = [];
      ed.append(renderList(page, S.data[page.key], true));
    } else {
      if (!S.data[page.key] || typeof S.data[page.key] !== 'object') S.data[page.key] = {};
      const panel = h('div', { class: 'panel' }); renderFields(page.fields, S.data[page.key], panel); ed.append(panel);
    }
  }

  /* ---------- Dashboard ---------- */
  const goTo = (key) => { S.page = key; renderPage(); scrollTo(0, 0); };
  function quickAdd(key) {
    const page = SCHEMA.find((p) => p.key === key);
    if (!Array.isArray(S.data[key])) S.data[key] = [];
    const item = blankItem(page.fields);
    if (page.newFirst) S.data[key].unshift(item); else S.data[key].push(item);
    openItems.add(item); markDirty(); goTo(key);
    requestAnimationFrame(() => { const el = $$('.item[open]').pop(); el?.scrollIntoView({ behavior: 'smooth', block: 'start' }); el?.querySelector('input, textarea')?.focus(); });
  }

  // Mirrors the public site's rule: a section shows only when it has content.
  function sectionHasContent(id) {
    const d = S.data, p = d.profile || {}, n = (a) => Array.isArray(a) && a.length > 0;
    return ({
      about: p.headline || p.bio || n(p.facts), skills: n(d.skills?.groups), experience: n(d.experience),
      research: n(d.research?.interests) || n(d.research?.publications), projects: n(d.projects), certificates: n(d.certificates),
      education: n(d.education), honors: n(d.honors), volunteering: n(d.volunteering), testimonials: n(d.testimonials),
      blog: (d.blog || []).some((x) => x.published !== false), contact: p.email || d.contact?.formspreeId || n(p.socials) || d.contact?.text,
    })[id];
  }

  function renderDashboard(ed) {
    const d = S.data, p = d.profile || {};
    const len = (a) => (Array.isArray(a) ? a.length : 0);
    const first = String(p.name || '').replace(/\*/g, '').trim().split(/\s+/)[0];
    const hr = new Date().getHours();
    const greet = hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';

    const checks = [
      ['Add your name', 'profile', !!p.name], ['Upload a profile photo', 'profile', !!p.photo],
      ['Add job titles', 'profile', len(p.roles) > 0], ['Write a hero tagline', 'profile', !!p.tagline],
      ['Write your bio', 'profile', !!p.bio], ['Add your email', 'profile', !!p.email],
      ['Add social links', 'profile', len(p.socials) > 0], ['Upload your CV', 'profile', !!p.cv],
      ['Add some statistics', 'stats', len(d.stats) > 0], ['Add skills', 'skills', len(d.skills?.groups) > 0],
      ['Add a project', 'projects', len(d.projects) > 0], ['Add a certificate', 'certificates', len(d.certificates) > 0],
      ['Add education', 'education', len(d.education) > 0], ['Add experience', 'experience', len(d.experience) > 0],
    ];
    const done = checks.filter((c) => c[2]).length, pct = Math.round((done / checks.length) * 100);
    const C = 2 * Math.PI * 52;
    const ring = h('div', { class: 'ring', html: `<svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" class="track"/><circle cx="60" cy="60" r="52" class="val" style="stroke-dasharray:${C};stroke-dashoffset:${C}"/></svg><div class="ring-num"><b>${pct}%</b><span>complete</span></div>` });
    requestAnimationFrame(() => requestAnimationFrame(() => { ring.querySelector('.val').style.strokeDashoffset = C * (1 - pct / 100); }));

    const posts = d.blog || [], published = posts.filter((x) => x.published !== false).length;
    const tiles = [
      ['projects', 'Projects', len(d.projects), 'fa-solid fa-layer-group'],
      ['certificates', 'Certificates', len(d.certificates), 'fa-solid fa-certificate'],
      ['experience', 'Experience', len(d.experience), 'fa-solid fa-briefcase'],
      ['education', 'Education', len(d.education), 'fa-solid fa-graduation-cap'],
      ['skills', 'Skill groups', len(d.skills?.groups), 'fa-solid fa-wand-magic-sparkles'],
      ['research', 'Publications', len(d.research?.publications), 'fa-solid fa-flask'],
      ['honors', 'Awards', len(d.honors), 'fa-solid fa-trophy'],
      ['blog', 'Blog posts', posts.length, 'fa-solid fa-pen-nib', posts.length ? `${published} live · ${posts.length - published} draft` : ''],
    ];

    const hero = h('div', { class: 'dash-hero' },
      h('div', {},
        h('span', { class: 'dash-kicker' }, new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })),
        h('h1', {}, `${greet}${first ? ', ' + first : ''}.`),
        h('p', {}, pct === 100 ? 'Your portfolio is complete. Keep it fresh with new projects and posts.' : 'Here is how your portfolio is shaping up. Finish the checklist to make it shine.'),
        h('div', { class: 'dash-actions' },
          h('button', { type: 'button', class: 'btn primary', onclick: () => quickAdd('projects') }, ic('fa-solid fa-plus'), ' New project'),
          h('button', { type: 'button', class: 'btn', onclick: () => quickAdd('certificates') }, ic('fa-solid fa-certificate'), ' New certificate'),
          h('button', { type: 'button', class: 'btn', onclick: () => quickAdd('blog') }, ic('fa-solid fa-pen-nib'), ' Write a post'),
          h('button', { type: 'button', class: 'btn ghost', onclick: () => $('#preview-btn').click() }, ic('fa-regular fa-eye'), ' Preview site'))),
      ring);

    const tileGrid = h('div', { class: 'tiles' }, ...tiles.map(([key, label, n, icon, sub]) =>
      h('button', { type: 'button', class: 'tile', onclick: () => goTo(key) },
        h('span', { class: 'tile-ic' }, ic(icon)), h('b', {}, String(n)), h('span', { class: 'tile-l' }, label), sub ? h('small', {}, sub) : null,
        h('i', { class: 'fa-solid fa-arrow-right tile-go' }))));

    const checklist = h('div', { class: 'card-x' }, h('h3', {}, ic('fa-solid fa-list-check'), ' Setup checklist', h('span', { class: 'pill-n' }, `${done}/${checks.length}`)),
      h('ul', { class: 'checklist' }, ...checks.map(([label, key, ok]) => h('li', { class: ok ? 'ok' : '' },
        h('button', { type: 'button', onclick: () => goTo(key) }, h('span', { class: 'cb' }, ok ? ic('fa-solid fa-check') : null), label, ok ? null : h('i', { class: 'fa-solid fa-chevron-right go' }))))));

    const secs = h('div', { class: 'card-x' }, h('h3', {}, ic('fa-solid fa-table-columns'), ' Pages on your site'),
      h('ul', { class: 'sec-list' }, ...(d.sections || []).map((s) => {
        const has = sectionHasContent(s.id);
        const state = s.show === false ? ['hidden', 'Hidden'] : has ? ['live', 'Has content'] : ['empty', 'Shows "Coming soon"'];
        return h('li', {}, h('span', { class: 'sec-name' }, s.navLabel || s.id), h('span', { class: 'state ' + state[0] }, state[1]));
      })),
      h('button', { type: 'button', class: 'btn sm', style: 'margin-top:12px', onclick: () => goTo('sections') }, 'Manage pages'));

    const activity = h('div', { class: 'card-x' }, h('h3', {}, ic('fa-solid fa-clock-rotate-left'), ' Recent publishes'));
    if (S.mode === 'github') {
      const list = h('ul', { class: 'commits' }, h('li', { class: 'muted' }, 'Loading…'));
      activity.append(list);
      gh(`/commits?path=${encodeURIComponent(CONTENT_PATH)}&sha=${encodeURIComponent(S.branch)}&per_page=6`).then((commits) => {
        list.innerHTML = '';
        if (!commits.length) list.append(h('li', { class: 'muted' }, 'Nothing published yet.'));
        commits.forEach((c) => list.append(h('li', {}, h('span', { class: 'c-dot' }), h('div', {}, h('b', {}, c.commit.message.split('\n')[0]),
          h('small', {}, new Date(c.commit.author.date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }))))));
      }).catch(() => { list.innerHTML = ''; list.append(h('li', { class: 'muted' }, 'Could not load history.')); });
    } else activity.append(h('p', { class: 'muted' }, 'Connect with GitHub to publish and see your history here. In local mode, use Download to save content.json.'));

    ed.append(hero, tileGrid, h('div', { class: 'dash-cols' }, checklist, h('div', { class: 'dash-stack' }, secs, activity)));
  }

  /* ---------- Form generation ---------- */
  function blankItem(fields) {
    const o = {};
    fields.forEach((f) => {
      if (f.type === 'list' || f.type === 'tags' || f.type === 'imagelist') o[f.key] = [];
      else if (f.type === 'group') o[f.key] = blankItem(f.fields);
      else if (f.type === 'toggle') o[f.key] = f.default ?? false;
      else if (f.type === 'date') o[f.key] = new Date().toISOString().slice(0, 10);
      else if (f.type === 'select') o[f.key] = f.options[0];
      else o[f.key] = '';
    });
    return o;
  }

  function renderFields(fields, obj, container) {
    // Pair short text fields side by side for a tidier form.
    let pair = null;
    fields.forEach((f) => {
      if (f.type === 'list') { pair = null; container.append(renderList(f, obj[f.key] = Array.isArray(obj[f.key]) ? obj[f.key] : [])); return; }
      if (f.type === 'group') {
        pair = null; obj[f.key] = obj[f.key] || {};
        const fs = h('fieldset', { class: 'sub' }, h('legend', {}, f.label)); renderFields(f.fields, obj[f.key], fs); container.append(fs); return;
      }
      const el = renderField(f, obj);
      const short = ['text', 'url', 'email', 'number', 'date', 'select', 'slug', 'toggle'].includes(f.type) && !f.help?.includes('*');
      if (short) {
        if (pair && pair.children.length < 2) { pair.append(el); if (pair.children.length === 2) pair = null; return; }
        pair = h('div', { class: 'grid2' }, el); container.append(pair); return;
      }
      pair = null; container.append(el);
    });
  }

  let uid = 0;
  function renderField(f, obj) {
    const id = 'f' + (++uid);
    const wrap = h('div', { class: 'f' });
    const label = h('label', { for: id }, f.label);
    const help = f.help ? h('div', { class: 'f-help' }, f.help) : null;
    const set = (v) => { obj[f.key] = v; markDirty(); wrap.dispatchEvent(new CustomEvent('fieldchange', { bubbles: true, detail: { key: f.key } })); };
    const val = obj[f.key];

    switch (f.type) {
      case 'textarea': {
        wrap.append(label, h('textarea', { id, rows: f.rows || 3, value: val ?? '', oninput: (e) => set(e.target.value) }));
        break;
      }
      case 'markdown': wrap.append(label, markdownEditor(id, f, val, set)); break;
      case 'toggle': {
        const on = val ?? f.default ?? false;
        wrap.append(h('label', { class: 'switch' }, h('input', { type: 'checkbox', id, checked: !!on, onchange: (e) => set(e.target.checked) }), f.label));
        break;
      }
      case 'select': {
        const sel = h('select', { id, onchange: (e) => set(e.target.value) }, ...f.options.map((o) => h('option', { value: o, selected: o === val }, o)));
        if (val && !f.options.includes(val)) sel.prepend(h('option', { value: val, selected: true }, val));
        wrap.append(label, sel);
        break;
      }
      case 'number': {
        wrap.append(label, h('input', { id, type: 'number', min: 0, max: 100, value: val ?? '', oninput: (e) => set(e.target.value === '' ? '' : Number(e.target.value)) }));
        break;
      }
      case 'tags': {
        const prev = h('div', { class: 'tag-preview' });
        const draw = (arr) => { prev.innerHTML = ''; arr.forEach((t) => prev.append(h('span', {}, t))); };
        const arr = Array.isArray(val) ? val : [];
        const input = h('input', { id, type: 'text', value: arr.join(', '), placeholder: 'Comma, separated, values',
          oninput: (e) => { const a = e.target.value.split(',').map((s) => s.trim()).filter(Boolean); set(a); draw(a); } });
        draw(arr); wrap.append(label, input, prev);
        break;
      }
      case 'color': {
        const txt = h('input', { type: 'text', value: val || '', placeholder: '#C9A24B' });
        const pick = h('input', { type: 'color', id, value: /^#[0-9a-f]{6}$/i.test(val || '') ? val : '#c9a24b' });
        pick.addEventListener('input', () => { txt.value = pick.value; set(pick.value); });
        txt.addEventListener('input', () => { if (/^#[0-9a-f]{6}$/i.test(txt.value)) pick.value = txt.value; set(txt.value); });
        wrap.append(label, h('div', { class: 'color-field' }, pick, txt));
        break;
      }
      case 'icon': wrap.append(label, iconField(id, val, set)); break;
      case 'image': case 'file': wrap.append(label, mediaField(id, f, val, set)); break;
      case 'imagelist': wrap.append(h('div', { class: 'f-label' }, f.label), galleryField(f, obj)); break;
      case 'slug': {
        const input = h('input', { id, type: 'text', value: val ?? '', oninput: (e) => set(slugify(e.target.value) || e.target.value) });
        input.addEventListener('blur', () => { input.value = slugify(input.value); set(input.value); });
        const gen = h('button', { type: 'button', class: 'btn sm', onclick: () => { input.value = slugify(obj[f.from]); set(input.value); } }, 'From title');
        wrap.append(label, h('div', { class: 'inline' }, input, gen));
        break;
      }
      default: {
        const type = ['url', 'email', 'date'].includes(f.type) ? f.type : 'text';
        wrap.append(label, h('input', { id, type, value: val ?? '', oninput: (e) => set(e.target.value) }));
      }
    }
    if (help) wrap.append(help);
    return wrap;
  }

  function markdownEditor(id, f, val, set) {
    const ta = h('textarea', { id, class: 'md', rows: f.rows || 8, value: val ?? '', oninput: () => set(ta.value) });
    const preview = h('div', { class: 'md-preview', hidden: true });
    const wrapSel = (before, after = before, placeholder = 'text') => {
      const s = ta.selectionStart, e = ta.selectionEnd, sel = ta.value.slice(s, e) || placeholder;
      ta.setRangeText(before + sel + after, s, e, 'select'); ta.focus(); set(ta.value);
    };
    const linePrefix = (prefix) => {
      const s = ta.selectionStart, lineStart = ta.value.lastIndexOf('\n', s - 1) + 1;
      ta.setRangeText(prefix, lineStart, lineStart, 'end'); ta.focus(); set(ta.value);
    };
    const tb = (icon, title, fn) => h('button', { type: 'button', title, onclick: fn }, ic(icon));
    const pvBtn = h('button', { type: 'button', class: 'pv', onclick: () => {
      const showing = preview.hidden;
      preview.hidden = !showing; ta.hidden = showing; pvBtn.classList.toggle('on', showing); pvBtn.textContent = showing ? 'Edit' : 'Preview';
      if (showing) preview.innerHTML = window.marked && window.DOMPurify ? DOMPurify.sanitize(marked.parse(ta.value)) : ta.value;
    } }, 'Preview');
    const tools = h('div', { class: 'md-tools' },
      tb('fa-solid fa-bold', 'Bold', () => wrapSel('**')),
      tb('fa-solid fa-italic', 'Italic', () => wrapSel('*')),
      tb('fa-solid fa-heading', 'Heading', () => linePrefix('## ')),
      tb('fa-solid fa-list-ul', 'List', () => linePrefix('- ')),
      tb('fa-solid fa-quote-left', 'Quote', () => linePrefix('> ')),
      tb('fa-solid fa-code', 'Code', () => wrapSel('`')),
      tb('fa-solid fa-link', 'Link', () => { const url = prompt('Link URL', 'https://'); if (url) wrapSel('[', `](${url})`, 'link text'); }),
      tb('fa-regular fa-image', 'Insert image (uploads it)', () => pickFiles('image/*', false, async ([file]) => {
        const path = await uploadFile(file); if (path) { ta.setRangeText(`\n![](${path})\n`, ta.selectionStart, ta.selectionStart, 'end'); set(ta.value); }
      })),
      h('span', { class: 'sp' }), pvBtn);
    return h('div', {}, tools, ta, preview);
  }

  const ICON_CHOICES = ['fa-solid fa-code', 'fa-solid fa-brain', 'fa-solid fa-robot', 'fa-solid fa-microchip', 'fa-solid fa-database', 'fa-solid fa-server', 'fa-solid fa-cloud', 'fa-solid fa-shield-halved', 'fa-solid fa-lock', 'fa-solid fa-chart-line', 'fa-solid fa-chart-simple', 'fa-solid fa-flask', 'fa-solid fa-atom', 'fa-solid fa-dna', 'fa-solid fa-language', 'fa-solid fa-eye', 'fa-solid fa-mobile-screen', 'fa-solid fa-globe', 'fa-solid fa-palette', 'fa-solid fa-pen-nib', 'fa-solid fa-screwdriver-wrench', 'fa-solid fa-gears', 'fa-solid fa-terminal', 'fa-solid fa-network-wired', 'fa-solid fa-people-group', 'fa-solid fa-comments', 'fa-solid fa-lightbulb', 'fa-solid fa-rocket', 'fa-solid fa-trophy', 'fa-solid fa-medal', 'fa-solid fa-award', 'fa-solid fa-star', 'fa-solid fa-crown', 'fa-solid fa-certificate', 'fa-solid fa-graduation-cap', 'fa-solid fa-book', 'fa-solid fa-microscope', 'fa-solid fa-calculator', 'fa-solid fa-gamepad', 'fa-solid fa-camera', 'fa-solid fa-music', 'fa-solid fa-heart', 'fa-brands fa-python', 'fa-brands fa-js', 'fa-brands fa-react', 'fa-brands fa-java', 'fa-brands fa-git-alt', 'fa-brands fa-linux', 'fa-brands fa-docker', 'fa-brands fa-figma'];
  function iconField(id, val, set) {
    const prev = h('span', { class: 'ip' }, ic(val || 'fa-solid fa-star'));
    const input = h('input', { id, type: 'text', value: val || '', placeholder: 'fa-solid fa-star', oninput: () => { prev.innerHTML = ''; prev.append(ic(input.value)); set(input.value); } });
    const picker = h('div', { class: 'icon-picker', hidden: true }, ...ICON_CHOICES.map((c) => h('button', { type: 'button', title: c, onclick: () => { input.value = c; input.dispatchEvent(new Event('input')); picker.hidden = true; } }, ic(c))));
    const toggle = h('button', { type: 'button', class: 'btn sm', onclick: () => { picker.hidden = !picker.hidden; } }, 'Choose');
    return h('div', {}, h('div', { class: 'icon-field' }, prev, input, toggle), picker,
      h('div', { class: 'f-help', html: 'Any <a href="https://fontawesome.com/search?o=r&m=free" target="_blank" rel="noopener">Font Awesome</a> icon class works.' }));
  }

  function mediaField(id, f, val, set) {
    const isImg = f.type === 'image';
    const thumb = h('div', { class: 'thumb' });
    const draw = (v) => {
      thumb.innerHTML = '';
      if (!v) thumb.append(ic(isImg ? 'fa-regular fa-image' : 'fa-regular fa-file'));
      else if (isImg) thumb.append(h('img', { src: assetUrl(v), alt: '', onerror: (e) => { e.target.replaceWith(ic('fa-solid fa-triangle-exclamation')); } }));
      else thumb.append(ic(/\.pdf$/i.test(v) ? 'fa-regular fa-file-pdf' : 'fa-regular fa-file'));
    };
    const input = h('input', { id, type: 'text', value: val || '', placeholder: isImg ? 'assets/uploads/photo.jpg or https://…' : 'assets/uploads/file.pdf', oninput: () => { set(input.value); draw(input.value); } });
    const box = h('div', { class: 'media' });
    const upload = h('button', { type: 'button', class: 'btn sm primary', onclick: () => pickFiles(isImg ? 'image/*' : (f.accept || '*/*'), false, async ([file]) => {
      box.classList.add('uploading');
      const path = await uploadFile(file);
      box.classList.remove('uploading');
      if (path) { input.value = path; set(path); draw(path); }
    }) }, ic('fa-solid fa-upload'), ' Upload');
    const clear = h('button', { type: 'button', class: 'btn sm ghost', onclick: () => { input.value = ''; set(''); draw(''); } }, 'Remove');
    const open = h('button', { type: 'button', class: 'btn sm ghost', onclick: () => { if (input.value) window.open(assetUrl(input.value), '_blank'); } }, 'Open');
    draw(val);
    box.append(thumb, h('div', { class: 'media-body' }, input, h('div', { class: 'media-actions' }, upload, open, clear)));
    return box;
  }

  function galleryField(f, obj) {
    if (!Array.isArray(obj[f.key])) obj[f.key] = [];
    const arr = obj[f.key];
    const box = h('div', {});
    const draw = () => {
      box.innerHTML = '';
      const g = h('div', { class: 'gallery' });
      arr.forEach((p, i) => g.append(h('div', { class: 'g' }, h('div', { class: 'thumb' }, h('img', { src: assetUrl(p), alt: '' })),
        h('button', { type: 'button', title: 'Remove', onclick: () => { arr.splice(i, 1); markDirty(); draw(); } }, ic('fa-solid fa-xmark')))));
      box.append(g, h('div', { class: 'media-actions', style: 'margin-top:10px' },
        h('button', { type: 'button', class: 'btn sm primary', onclick: () => pickFiles('image/*', true, async (files) => {
          box.classList.add('uploading');
          for (const file of files) { const p = await uploadFile(file); if (p) arr.push(p); }
          box.classList.remove('uploading'); markDirty(); draw();
        }) }, ic('fa-solid fa-upload'), ' Upload images'),
        h('button', { type: 'button', class: 'btn sm ghost', onclick: () => { const u = prompt('Image URL or path'); if (u) { arr.push(u); markDirty(); draw(); } } }, 'Add by URL')));
    };
    draw();
    return box;
  }

  function renderList(f, arr, top = false) {
    const box = h('div', { class: 'list' });
    const rerender = () => { const n = renderList(f, arr, top); box.replaceWith(n); markDirty(); };
    const add = () => {
      const item = blankItem(f.fields);
      if (f.newFirst) arr.unshift(item); else arr.push(item);
      openItems.add(item); rerender();
    };
    box.append(h('div', { class: 'list-head' },
      h('span', { class: 'list-title' }, top ? '' : f.label, h('span', { class: 'count' }, `${arr.length} item${arr.length === 1 ? '' : 's'}`)),
      f.fixed ? null : h('button', { type: 'button', class: 'btn sm primary', onclick: add }, ic('fa-solid fa-plus'), ' Add')));
    if (!top && f.help) box.append(h('div', { class: 'f-help', style: 'margin:-4px 0 10px' }, f.help));

    const items = h('div', { class: 'items' });
    if (!arr.length) items.append(h('div', { class: 'empty' }, 'Nothing here yet. ', f.fixed ? '' : h('a', { href: '#', onclick: (e) => { e.preventDefault(); add(); } }, 'Add the first one'), '.', h('br'), h('small', {}, 'Empty sections are hidden on the site automatically.')));

    arr.forEach((item, i) => {
      const label = h('span', { class: 's-label' });
      const thumbSrc = () => item.image || item.photo || item.cover || item.logo;
      const sThumb = h('img', { class: 's-thumb', alt: '' });
      const drawLabel = () => {
        const text = String(item[f.itemLabel] || item.title || item.name || '').replace(/\*/g, '') || 'Untitled';
        label.innerHTML = '';
        label.append(text);
        if (f.key === 'sections') label.append(h('small', {}, '#' + item.id));
        else if (item.category || item.date || item.year) label.append(h('small', {}, [item.category, item.year || item.date].filter(Boolean).join(' · ')));
        if (item.show === false || item.published === false) label.append(h('span', { class: 'off' }, item.show === false ? 'hidden' : 'draft'));
        const t = thumbSrc(); sThumb.hidden = !t; if (t) sThumb.src = assetUrl(t);
      };
      drawLabel();
      const move = (d) => { const j = i + d; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; rerender(); };
      const actions = h('span', { class: 's-actions' },
        iconBtn('fa-solid fa-arrow-up', 'Move up', () => move(-1)),
        iconBtn('fa-solid fa-arrow-down', 'Move down', () => move(1)),
        f.fixed ? null : iconBtn('fa-regular fa-copy', 'Duplicate', () => { const c = JSON.parse(JSON.stringify(item)); if ('slug' in c) c.slug = ''; arr.splice(i + 1, 0, c); openItems.add(c); rerender(); }),
        f.fixed ? null : iconBtn('fa-regular fa-trash-can', 'Delete', () => { if (confirm(`Delete "${label.firstChild.textContent}"?`)) { arr.splice(i, 1); rerender(); } }, 'del'));
      actions.children[0].disabled = i === 0; actions.children[1].disabled = i === arr.length - 1;

      const body = h('div', { class: 'item-body' });
      const det = h('details', { class: 'item', open: openItems.has(item) },
        h('summary', {}, h('i', { class: 'fa-solid fa-chevron-right chev' }), sThumb, label, actions), body);
      let built = false;
      const build = () => { if (built) return; built = true; renderFields(f.fields, item, body); };
      if (det.open) build();
      det.addEventListener('toggle', () => { if (det.open) { openItems.add(item); build(); } else openItems.delete(item); });
      body.addEventListener('fieldchange', drawLabel);
      items.append(det);
    });
    box.append(items);
    return box;
  }

  /* ---------- Files ---------- */
  function pickFiles(accept, multiple, cb) {
    const input = h('input', { type: 'file', accept, multiple });
    input.addEventListener('change', () => { if (input.files.length) cb([...input.files]); });
    input.click();
  }

  // Downscale very large photos so the site stays fast.
  async function optimise(file) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size < 900 * 1024) return file;
    try {
      const bmp = await createImageBitmap(file);
      const max = 2000, scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
      if (scale === 1 && file.size < 2.5 * 1024 * 1024) return file;
      const c = document.createElement('canvas'); c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
      c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
      const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const blob = await new Promise((r) => c.toBlob(r, type, 0.86));
      return blob && blob.size < file.size ? new File([blob], file.name.replace(/\.\w+$/, type === 'image/png' ? '.png' : '.jpg'), { type }) : file;
    } catch (e) { return file; }
  }

  async function uploadFile(file) {
    const ext = (file.name.match(/\.[a-z0-9]+$/i) || [''])[0].toLowerCase();
    const base = slugify(file.name.replace(/\.[^.]+$/, '')) || 'file';
    if (S.mode !== 'github') {
      const path = `${UPLOAD_DIR}/${base}${ext}`;
      toast(`Local mode: copy <b>${file.name}</b> into <code>${UPLOAD_DIR}/</code> as <code>${base}${ext}</code>. The path has been filled in for you.`, 'info', 9000);
      return path;
    }
    try {
      const f = await optimise(file);
      if (f.size > 25 * 1024 * 1024) { toast('That file is larger than 25 MB — please compress it first.', 'err'); return null; }
      const finalExt = (f.name.match(/\.[a-z0-9]+$/i) || [ext])[0].toLowerCase();
      const path = `${UPLOAD_DIR}/${Date.now().toString(36)}-${base}${finalExt}`;
      toast(`Uploading ${file.name}…`, 'info', 2500);
      const b64 = bytesToB64(new Uint8Array(await f.arrayBuffer()));
      await putFile(path, b64, `Upload ${path} via admin`);
      toast(`Uploaded <b>${file.name}</b>. Remember to <b>Publish</b> so the site uses it.`, 'ok');
      return path;
    } catch (e) { toast('Upload failed: ' + e.message, 'err', 8000); return null; }
  }

  /* ---------- Save / export ---------- */
  function normalise() {
    const seen = new Set();
    (S.data.blog || []).forEach((p) => {
      let s = slugify(p.slug || p.title) || 'post';
      while (seen.has(s)) s += '-2';
      seen.add(s); p.slug = s;
    });
  }
  const serialise = () => JSON.stringify(S.data, null, 2) + '\n';

  function download() {
    normalise();
    const a = h('a', { href: URL.createObjectURL(new Blob([serialise()], { type: 'application/json' })), download: 'content.json' });
    document.body.append(a); a.click(); a.remove();
    toast('Downloaded <b>content.json</b>. Replace <code>data/content.json</code> with it.', 'ok', 7000);
  }

  async function save() {
    if (S.mode !== 'github') { download(); return; }
    const btn = $('#save-btn'); btn.disabled = true; $('#save-label').textContent = ' Publishing…';
    try {
      normalise();
      await putFile(CONTENT_PATH, b64enc(serialise()), 'Update site content via admin');
      S.pristine = JSON.stringify(S.data); S.dirty = false; localStorage.removeItem(AUTOSAVE_KEY);
      const site = `https://${S.repo.endsWith('.github.io') ? S.repo : `${S.owner}.github.io/${S.repo}`}`;
      toast(`Published! Your site updates in about a minute. <a href="${site}" target="_blank" rel="noopener">Open site ↗</a>`, 'ok', 9000);
      renderPage();
    } catch (e) {
      toast(e.status === 409 ? 'The file changed on GitHub. Reload and try again.' : 'Publish failed: ' + e.message, 'err', 9000);
    } finally { $('#save-label').textContent = ' Publish'; updateDirty(); }
  }

  /* ---------- Wire up ---------- */
  function init() {
    $('#login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = $('#login-btn'), err = $('#login-error'); err.textContent = ''; btn.disabled = true;
      try { await connect($('#lg-owner').value, $('#lg-repo').value, $('#lg-branch').value, $('#lg-token').value, $('#lg-remember').checked); }
      catch (ex) {
        err.textContent = ex.status === 401 ? 'The token was rejected. Check it is correct and not expired.'
          : ex.status === 404 ? `Not found. Check the username, repository and branch, and that ${CONTENT_PATH} exists in it.`
          : ex.message;
      } finally { btn.disabled = false; }
    });
    $('#local-btn').addEventListener('click', startLocal);
    // Local mode only makes sense on your own computer; on the public site the token login is the only way in.
    if (!/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) {
      ['#local-btn', '.login .divider', '.login .tiny'].forEach((s) => { const el = $(s); if (el) el.hidden = true; });
    }
    $('#logout-btn').addEventListener('click', logout);
    $('#save-btn').addEventListener('click', save);
    $('#preview-btn').addEventListener('click', () => {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(S.data)); } catch (e) { toast('Preview data is too large for browser storage.', 'err'); return; }
      window.open('../index.html?preview=1', 'portfolio-preview');
    });
    $('#menu-btn').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
    $('#more-btn').addEventListener('click', (e) => { e.stopPropagation(); $('#more-menu').hidden = !$('#more-menu').hidden; });
    document.addEventListener('click', (e) => { if (!e.target.closest('.more')) $('#more-menu').hidden = true; });
    $('#export-btn').addEventListener('click', download);
    $('#import-input').addEventListener('change', async (e) => {
      const file = e.target.files[0]; if (!file) return;
      try { S.data = JSON.parse(await file.text()); markDirty(); buildSidebar(); renderPage(); toast('Imported. Review, then Publish.', 'ok'); }
      catch (ex) { toast('That file is not valid JSON.', 'err'); }
      e.target.value = '';
    });
    $('#reload-btn').addEventListener('click', async () => {
      if (!confirm('Discard all unsaved changes and reload the published content?')) return;
      localStorage.removeItem(AUTOSAVE_KEY);
      if (S.mode === 'github') { const file = await getFile(CONTENT_PATH); start(JSON.parse(b64dec(file.content))); } else startLocal();
    });
    $('#restore-yes').addEventListener('click', () => {
      try { S.data = JSON.parse(localStorage.getItem(AUTOSAVE_KEY)).data; markDirty(); renderPage(); } catch (e) { /* ignore */ }
      $('#restore').hidden = true;
    });
    $('#restore-no').addEventListener('click', () => { localStorage.removeItem(AUTOSAVE_KEY); $('#restore').hidden = true; });
    addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && S.data) { e.preventDefault(); save(); } });
    addEventListener('beforeunload', (e) => { if (S.dirty) { e.preventDefault(); e.returnValue = ''; } });

    // Resume a remembered session automatically.
    const cfg = readCfg();
    const token = sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
    if (cfg.owner && cfg.repo && token) {
      connect(cfg.owner, cfg.repo, cfg.branch || 'main', token, !!localStorage.getItem(TOKEN_KEY))
        .catch((e) => { showLogin(); $('#login-error').textContent = 'Session expired: ' + e.message; });
    } else showLogin();
  }
  init();
})();
