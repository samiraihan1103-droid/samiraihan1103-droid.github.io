/* Multi-page site: shared shell (nav, footer, curtain transitions) + one renderer per page.
   Each HTML file only sets <body data-page="...">; everything else comes from data/content.json. */
(function () {
  'use strict';
  const { $, $$, esc, emph, strip, md, nonEmpty, img, range, formatDate, readingTime, socialLinks } = Core;
  let C;

  /* ---------------- Page registry ---------------- */
  const PAGES = {
    about: { file: 'about.html', icon: 'fa-solid fa-user', desc: 'My background, motivation and areas of focus.' },
    skills: { file: 'skills.html', icon: 'fa-solid fa-wand-magic-sparkles', desc: 'Languages, tools and strengths I work with.' },
    experience: { file: 'experience.html', icon: 'fa-solid fa-briefcase', desc: 'Roles, internships, leadership and volunteering.' },
    research: { file: 'research.html', icon: 'fa-solid fa-flask', desc: 'Research interests, questions and publications.' },
    projects: { file: 'projects.html', icon: 'fa-solid fa-layer-group', desc: 'Things I have designed, built and shipped.' },
    certificates: { file: 'certificates.html', icon: 'fa-solid fa-certificate', desc: 'Courses, programs and verified credentials.' },
    education: { file: 'education.html', icon: 'fa-solid fa-graduation-cap', desc: 'Where I learned and what I studied.' },
    honors: { file: 'honors.html', icon: 'fa-solid fa-trophy', desc: 'Awards, competitions and achievements.' },
    blog: { file: 'blog.html', icon: 'fa-solid fa-pen-nib', desc: 'Notes, articles and ideas I am exploring.' },
    contact: { file: 'contact.html', icon: 'fa-solid fa-paper-plane', desc: 'Let’s talk about work, research or collaboration.' },
  };
  const pageList = () => (C.sections || []).filter((s) => PAGES[s.id] && s.show !== false);
  const sec = (id) => (C.sections || []).find((s) => s.id === id) || { id, title: id, navLabel: id };
  const label = (s) => s.navLabel || s.id.charAt(0).toUpperCase() + s.id.slice(1);
  const pageNum = (id) => String(pageList().findIndex((s) => s.id === id) + 1).padStart(2, '0');
  const publishedPosts = () => (C.blog || []).filter((p) => p.published !== false).sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const countFor = (id) => ({
    projects: (C.projects || []).length, certificates: (C.certificates || []).length, experience: (C.experience || []).length + (C.volunteering || []).length,
    education: (C.education || []).length, honors: (C.honors || []).length, blog: publishedPosts().length, skills: (C.skills?.groups || []).length,
    research: (C.research?.interests || []).length + (C.research?.publications || []).length,
  })[id];
  const plural = (w, n) => (n === 1 ? w : w.endsWith('y') ? w.slice(0, -1) + 'ies' : w + 's');
  const countWord = { projects: 'project', certificates: 'certificate', experience: 'entry', education: 'entry', honors: 'award', blog: 'article', skills: 'group', research: 'item' };

  /* ---------------- Shell ---------------- */
  function buildShell(page) {
    const p = C.profile || {};
    const name = strip(p.name || '');
    const logo = p.shortName || (name ? name.split(/\s+/).map((w) => w[0]).join('').slice(0, 3) : 'Portfolio');
    const navItems = [{ id: 'home', file: 'index.html', text: 'Home' }, ...pageList().filter((s) => s.inNav !== false).map((s) => ({ id: s.id, file: PAGES[s.id].file, text: label(s) }))];
    const links = navItems.map((n, i) => `<li><a href="${n.file}" class="${n.id === page || (page === 'post' && n.id === 'blog') ? 'active' : ''}" style="--i:${i}">${esc(n.text)}</a></li>`).join('');
    const hasContact = pageList().some((s) => s.id === 'contact');

    document.body.insertAdjacentHTML('afterbegin', `
      <div class="cursor-dot" aria-hidden="true"></div><div class="cursor-ring" aria-hidden="true"><span></span></div>
      <div class="progress-bar" aria-hidden="true"></div>
      <nav class="nav" id="nav"><div class="nav-inner">
        <a href="index.html" class="nav-logo"><span class="logo-mark">${esc(logo.slice(0, 2).toUpperCase())}</span><span class="logo-text">${esc(name || 'Portfolio')}</span></a>
        <ul class="nav-links">${links}</ul>
        <div class="nav-actions">
          ${hasContact ? `<a class="btn btn-sm btn-primary magnetic nav-cta" href="contact.html">Let's talk <i class="fa-solid fa-arrow-right"></i></a>` : ''}
          <button class="nav-toggle" id="nav-toggle" aria-label="Open menu" aria-expanded="false"><span></span><span></span></button>
        </div>
      </div></nav>
      <div class="mobile-menu" id="mobile-menu"><ul>${links}</ul><div class="mobile-social">${socialLinks(p.socials)}</div></div>`);

    document.body.insertAdjacentHTML('beforeend', `
      <div class="modal" id="modal" aria-hidden="true" role="dialog" aria-modal="true">
        <div class="modal-backdrop" data-close></div>
        <div class="modal-panel"><button class="modal-close" data-close aria-label="Close"><i class="fa-solid fa-xmark"></i></button><div class="modal-body" id="modal-body"></div></div>
      </div>`);
    if (Core.isPreview()) document.body.insertAdjacentHTML('beforeend', `<div class="preview-banner"><i class="fa-regular fa-eye"></i> Previewing unsaved changes <button id="exit-preview">Exit</button></div>`);
    $('#exit-preview')?.addEventListener('click', Core.exitPreview);

    const toggle = $('#nav-toggle');
    const setMenu = (open) => { document.body.classList.toggle('menu-open', open); toggle.setAttribute('aria-expanded', open); };
    toggle.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  }

  function footer() {
    const p = C.profile || {};
    const name = strip(p.name || '');
    const hasContact = pageList().some((s) => s.id === 'contact');
    return `<footer class="footer">
      <div class="container">
        <div class="footer-cta reveal">
          <div>
            <span class="kicker light">Available for new ideas</span>
            <h2>${emph(C.site?.footerHeadline || "Let's build something *together.*")}</h2>
          </div>
          <div class="footer-cta-actions">
            ${hasContact ? `<a class="btn btn-white magnetic" href="contact.html">Start a conversation <i class="fa-solid fa-arrow-right"></i></a>` : ''}
            ${p.email ? `<a class="footer-mail" href="mailto:${esc(p.email)}">${esc(p.email)}</a>` : ''}
          </div>
        </div>
        <div class="footer-grid">
          <div>
            <a href="index.html" class="nav-logo"><span class="logo-mark">${esc((p.shortName || name.split(/\s+/).map((w) => w[0]).join('') || 'P').slice(0, 2).toUpperCase())}</span><span class="logo-text">${esc(name || 'Portfolio')}</span></a>
            ${p.tagline ? `<p class="footer-tag">${esc(p.tagline)}</p>` : ''}
            <div class="footer-social">${socialLinks(p.socials)}</div>
          </div>
          <div class="footer-links"><span class="kicker">Explore</span><ul>${pageList().map((s) => `<li><a href="${PAGES[s.id].file}">${esc(label(s))}</a></li>`).join('')}</ul></div>
        </div>
        <div class="footer-bottom">
          <span>© ${new Date().getFullYear()}${name ? ' ' + esc(name) : ''}${C.site?.footerNote ? ' · ' + esc(C.site.footerNote) : ''}</span>
          <a href="#top" class="to-top" data-no-transition>Back to top <span><i class="fa-solid fa-arrow-up"></i></span></a>
        </div>
      </div>
    </footer>`;
  }

  function pageHero(id, extra = '') {
    const s = sec(id);
    return `<header class="page-hero" data-manual>
      <div class="ph-bg"><span class="blob b1"></span><span class="blob b2"></span><span class="blob b3"></span><span class="dots"></span></div>
      <div class="container">
        <nav class="crumbs h-in" style="--delay:.05s"><a href="index.html">Home</a><i class="fa-solid fa-chevron-right"></i><span>${esc(label(s))}</span></nav>
        <span class="kicker h-in" style="--delay:.15s"><span class="num">${pageNum(id)}</span> · ${esc(s.kicker || label(s))}</span>
        <h1 class="page-title split">${emph(s.title || label(s))}</h1>
        ${s.subtitle ? `<p class="page-sub h-in" style="--delay:.5s">${esc(s.subtitle)}</p>` : ''}
        ${extra}
      </div>
    </header>`;
  }

  // "Next page" card at the bottom of every inner page keeps visitors moving through the site.
  function pager(id) {
    const list = pageList(), i = list.findIndex((s) => s.id === id);
    if (i < 0) return '';
    const prev = list[i - 1], next = list[i + 1];
    return `<section class="pager container">
      ${prev ? `<a class="pager-link prev card reveal" href="${PAGES[prev.id].file}"><span class="kicker">← Previous</span><b>${esc(label(prev))}</b></a>` : `<a class="pager-link prev card reveal" href="index.html"><span class="kicker">← Back</span><b>Home</b></a>`}
      ${next ? `<a class="pager-link next card reveal" href="${PAGES[next.id].file}" style="--i:1"><span class="kicker">Next →</span><b>${esc(label(next))}</b></a>` : `<a class="pager-link next card reveal" href="index.html" style="--i:1"><span class="kicker">Finish →</span><b>Back to Home</b></a>`}
    </section>`;
  }

  const empty = (id) => `<div class="empty-state card reveal"><span class="empty-ic"><i class="${PAGES[id]?.icon || 'fa-solid fa-sparkles'}"></i></span><h3>Coming soon</h3><p>This space is reserved for ${esc(label(sec(id)).toLowerCase())}. New content will appear here soon.</p></div>`;
  const block = (title, inner, cls = '') => `<div class="block ${cls}">${title ? `<h2 class="block-title reveal">${emph(title)}</h2>` : ''}${inner}</div>`;

  const cvButton = (cls) => C.profile?.cv ? `<a class="${cls} magnetic" href="${esc(C.profile.cv)}" target="_blank" rel="noopener" download data-no-transition>Download CV <i class="fa-solid fa-arrow-down"></i></a>` : '';
  const chips = (arr) => nonEmpty(arr) ? `<div class="chips">${arr.map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</div>` : '';

  /* ---------------- Home ---------------- */
  function home() {
    const p = C.profile || {};
    const name = strip(p.name || '');
    const pages = pageList();
    const has = (id) => pages.some((s) => s.id === id);
    const stats = (C.stats || []).filter((s) => s.value !== '' && s.value != null);
    const words = C.skills?.marquee || [];
    const eyebrow = p.eyebrow || (p.roles || [])[0] || '';
    const featured = (C.projects || []).map((x, i) => ({ ...x, _i: i })).sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)).slice(0, 3);

    const heroHtml = `<section class="hero" data-manual>
      <div class="hero-bg"><span class="blob b1"></span><span class="blob b2"></span><span class="blob b3"></span><span class="dots"></span><span class="glow"></span></div>
      <div class="container hero-grid">
        <div class="hero-copy">
          ${eyebrow ? `<span class="kicker h-in" style="--delay:.1s"><span class="line"></span>${esc(eyebrow)}</span>` : ''}
          <h1 class="hero-name split">${name ? emph(p.name) + '<em>.</em>' : 'Hello, <em>welcome.</em>'}</h1>
          ${nonEmpty(p.roles) ? `<p class="hero-role h-in" style="--delay:.6s">I'm a <span class="typed"></span><span class="caret"></span></p>` : ''}
          ${p.tagline ? `<p class="hero-tagline h-in" style="--delay:.75s">${esc(p.tagline)}</p>` : ''}
          <div class="hero-cta h-in" style="--delay:.9s">
            ${has('about') ? `<a class="btn btn-primary magnetic" href="about.html">Explore my profile <i class="fa-solid fa-arrow-right"></i></a>` : ''}
            ${has('projects') ? `<a class="btn btn-ghost magnetic" href="projects.html">View projects</a>` : ''}
            ${cvButton('btn btn-ghost')}
          </div>
          ${nonEmpty(p.socials) ? `<div class="hero-social h-in" style="--delay:1.05s">${socialLinks(p.socials)}</div>` : ''}
          ${!name ? `<p class="setup-note h-in" style="--delay:1s"><i class="fa-solid fa-wand-magic-sparkles"></i><span>This site is ready for your content — open the <a href="admin/" data-no-transition>admin dashboard</a> to add your details.</span></p>` : ''}
        </div>
        <div class="hero-visual h-in" style="--delay:.35s">
          <div class="photo-ring"></div>
          <div class="photo-card tilt card" data-tilt="6">
            <img src="${p.photo ? esc(p.photo) : Core.avatar()}" alt="${esc(name)}">
            ${(p.availability || p.location) ? `<div class="photo-caption"><span class="pulse"></span><span>${esc(p.availability || p.location)}</span></div>` : ''}
          </div>
          ${nonEmpty(p.roles) ? `<div class="float-chip c1"><i class="fa-solid fa-code"></i>${esc(p.roles[0])}</div>` : ''}
          ${(C.projects || []).length ? `<div class="float-chip c2"><i class="fa-solid fa-layer-group"></i><b>${C.projects.length}</b> projects</div>` : (p.location && p.availability ? `<div class="float-chip c2"><i class="fa-solid fa-location-dot"></i>${esc(p.location)}</div>` : '')}
        </div>
      </div>
    </section>`;

    const marquee = words.length ? `<div class="marquee" aria-hidden="true"><div class="marquee-track">${[...words, ...words, ...words, ...words].map((w) => `<span class="marquee-item"><i class="fa-solid fa-sparkle"></i>${esc(w)}</span>`).join('')}</div></div>` : '';

    const statsHtml = stats.length ? `<section class="container stats" data-stagger>${stats.map((s) => {
      const n = String(s.value), numeric = /^\d+(\.\d+)?$/.test(n);
      return `<div class="stat card reveal" data-count-root><b>${numeric ? `<span class="count" data-to="${esc(n)}">0</span>` : esc(n)}<span class="suf">${esc(s.suffix || '')}</span></b><span>${esc(s.label)}</span></div>`;
    }).join('')}</section>` : '';

    const explore = pages.length ? `<section class="section">
      <div class="container">
        <div class="section-head split-head">
          <div><span class="kicker reveal"><span class="num">01</span> · Explore</span><h2 class="section-title split">Everything in <em>one place.</em></h2></div>
          <a class="link-arrow reveal" href="${PAGES[pages[0].id].file}">Start with ${esc(label(pages[0]))} <i class="fa-solid fa-arrow-right"></i></a>
        </div>
        <div class="explore-grid" data-stagger>${pages.map((s, i) => {
          const n = countFor(s.id);
          return `<a class="explore-card card tilt reveal" href="${PAGES[s.id].file}" data-tilt="4">
            <div class="ec-top"><span class="ec-num">${String(i + 1).padStart(2, '0')} · ${esc(label(s))}</span><span class="ec-go"><i class="fa-solid fa-arrow-up-right-from-square"></i></span></div>
            <span class="ec-icon"><i class="${PAGES[s.id].icon}"></i></span>
            <h3>${esc(strip(s.title || label(s)))}</h3>
            <p>${esc(s.desc || PAGES[s.id].desc)}</p>
            ${n ? `<span class="ec-meta">${n} ${plural(countWord[s.id] || 'item', n)}</span>` : ''}
          </a>`;
        }).join('')}</div>
      </div>
    </section>` : '';

    const work = featured.length && has('projects') ? `<section class="section soft">
      <div class="container">
        <div class="section-head split-head">
          <div><span class="kicker reveal"><span class="num">02</span> · Selected work</span><h2 class="section-title split">Recent <em>projects.</em></h2></div>
          <a class="link-arrow reveal" href="projects.html">All projects <i class="fa-solid fa-arrow-right"></i></a>
        </div>
        <div class="project-grid three" data-stagger>${featured.map((x) => projectCard(x, true)).join('')}</div>
      </div>
    </section>` : '';

    const testi = nonEmpty(C.testimonials) ? `<section class="section"><div class="container">${testimonials()}</div></section>` : '';
    return heroHtml + marquee + statsHtml + explore + work + testi;
  }

  /* ---------------- Inner pages ---------------- */
  const R = {};

  R.about = () => {
    const p = C.profile || {};
    const hasAny = p.headline || p.bio || nonEmpty(p.facts) || nonEmpty(p.focus);
    if (!hasAny) return empty('about');
    return `<div class="about-grid">
        <div>
          ${p.headline ? `<p class="lead reveal">${emph(p.headline)}</p>` : ''}
          ${p.bio ? `<div class="prose reveal" style="--i:1">${md(p.bio)}</div>` : ''}
          <div class="about-actions reveal" style="--i:2">${cvButton('btn btn-primary')}${pageList().some((s) => s.id === 'contact') ? '<a class="btn btn-ghost magnetic" href="contact.html">Contact me</a>' : ''}</div>
        </div>
        <aside class="about-side">
          ${p.photo ? `<div class="about-photo card reveal-scale"><img src="${esc(p.photo)}" alt=""></div>` : ''}
          ${nonEmpty(p.facts) ? `<ul class="facts card reveal">${p.facts.map((f) => `<li><span>${esc(f.label)}</span><b>${esc(f.value)}</b></li>`).join('')}</ul>` : ''}
        </aside>
      </div>
      ${nonEmpty(p.focus) ? block('What I *focus* on', `<div class="focus-grid" data-stagger>${p.focus.map((f, i) => `
        <article class="focus card tilt reveal"><span class="f-num">${String(i + 1).padStart(2, '0')}</span><span class="ec-icon"><i class="${esc(f.icon || 'fa-solid fa-star')}"></i></span><h3>${esc(f.title)}</h3><p>${esc(f.description)}</p></article>`).join('')}</div>`) : ''}`;
  };

  R.skills = () => {
    const groups = C.skills?.groups || [], words = C.skills?.marquee || [];
    if (!groups.length && !words.length) return empty('skills');
    return `${groups.length ? `<div class="skills-grid" data-stagger>${groups.map((g) => {
      const hasLevels = (g.items || []).some((i) => i.level !== '' && i.level != null);
      return `<article class="skill-card card tilt reveal" data-tilt="3">
        <h3><span class="ec-icon sm"><i class="${esc(g.icon || 'fa-solid fa-star')}"></i></span>${esc(g.name)}</h3>
        ${hasLevels ? (g.items || []).map((i, k) => (i.level !== '' && i.level != null)
          ? `<div class="skill-row"><div class="top"><span>${esc(i.name)}</span><span>${esc(i.level)}%</span></div><div class="bar"><i style="--w:${Math.min(100, +i.level || 0)}%;--i:${k}"></i></div></div>`
          : `<div class="skill-row"><div class="top"><span>${esc(i.name)}</span></div></div>`).join('')
        : chips((g.items || []).map((i) => i.name))}
      </article>`;
    }).join('')}</div>` : ''}
    ${words.length ? block('Also *familiar* with', `<div class="cloud reveal">${words.map((w, i) => `<span class="cloud-chip" style="--i:${i}">${esc(w)}</span>`).join('')}</div>`) : ''}`;
  };

  const tItem = (title, org, orgUrl, meta, date, body, tags, logo, result) => `
    <article class="t-item card">
      <div class="t-head">
        <div class="t-title">
          ${logo ? `<img class="t-logo" src="${esc(logo)}" alt="" loading="lazy">` : ''}
          <div><h3>${esc(title)}</h3><div class="t-org">${orgUrl ? `<a href="${esc(orgUrl)}" target="_blank" rel="noopener">${esc(org)}</a>` : esc(org)}${meta ? ` <span class="t-meta">· ${esc(meta)}</span>` : ''}</div></div>
        </div>
        ${date ? `<span class="t-date">${esc(date)}</span>` : ''}
      </div>
      ${result ? `<div class="t-result"><i class="fa-solid fa-star"></i>${esc(result)}</div>` : ''}
      ${body ? `<div class="prose">${md(body)}</div>` : ''}
      ${chips(tags)}
    </article>`;

  R.experience = () => {
    const ex = C.experience || [], vol = C.volunteering || [];
    if (!ex.length && !vol.length) return empty('experience');
    return `${ex.length ? `<div class="timeline"><span class="timeline-progress"></span>${ex.map((e) => tItem(e.role, e.org, e.orgUrl, [e.type, e.location].filter(Boolean).join(' · '), range(e.start, e.end), e.description, e.highlights, e.logo)).join('')}</div>` : ''}
      ${vol.length ? block('Leadership & *volunteering*', `<div class="vol-grid" data-stagger>${vol.map((v) => `
        <article class="vol card reveal"><span class="t-date">${esc(range(v.start, v.end))}</span><h3>${esc(v.role)}</h3><span class="t-org">${esc(v.org)}</span><p>${esc(v.description)}</p></article>`).join('')}</div>`) : ''}`;
  };

  R.education = () => {
    const ed = C.education || [];
    if (!ed.length) return empty('education');
    return `<div class="timeline"><span class="timeline-progress"></span>${ed.map((e) => tItem(e.degree, e.institution, e.url, e.location, range(e.start, e.end), e.description, null, e.logo, e.result)).join('')}</div>`;
  };

  R.research = () => {
    const r = C.research || {};
    if (!nonEmpty(r.interests) && !nonEmpty(r.publications)) return empty('research');
    return `${nonEmpty(r.interests) ? `<div class="focus-grid" data-stagger>${r.interests.map((x, i) => `
      <article class="focus card tilt reveal"><span class="f-num">${String(i + 1).padStart(2, '0')}</span><span class="ec-icon"><i class="${esc(x.icon || 'fa-solid fa-flask')}"></i></span><h3>${esc(x.title)}</h3><p>${esc(x.description)}</p></article>`).join('')}</div>` : ''}
      ${nonEmpty(r.publications) ? block('Publications', `<div class="pubs">${r.publications.map((p) => `
        <article class="pub card reveal">
          <span class="pub-year">${esc(p.year)}</span>
          <div><h4>${esc(p.title)}</h4><p>${esc(p.authors)}${p.venue ? ` — <i>${esc(p.venue)}</i>` : ''}</p>${p.status ? `<span class="status">${esc(p.status)}</span>` : ''}</div>
          ${p.link ? `<a class="icon-btn magnetic" href="${esc(p.link)}" target="_blank" rel="noopener" aria-label="Open paper"><i class="fa-solid fa-arrow-up-right-from-square"></i></a>` : '<span></span>'}
        </article>`).join('')}</div>`) : ''}`;
  };

  const filterBar = (items, group) => {
    const cats = [...new Set(items.map((i) => i.category).filter(Boolean))];
    if (cats.length < 2) return '';
    return `<div class="filters reveal" data-filter-group="${group}"><button class="filter active" data-filter="*">All <sup>${items.length}</sup></button>${cats.map((c) => `<button class="filter" data-filter="${esc(c)}">${esc(c)} <sup>${items.filter((i) => i.category === c).length}</sup></button>`).join('')}</div>`;
  };

  function projectCard(p, link) {
    const tag = link ? 'a' : 'article';
    return `<${tag} class="project card reveal-scale ${!link && p.featured ? 'featured' : ''}" ${link ? 'href="projects.html"' : `data-project="${p._i}" tabindex="0" role="button"`} data-category="${esc(p.category || '')}" data-cursor="View">
      <div class="project-media"><img src="${img(p.image, p.title, p.title)}" alt="${esc(p.title)}" loading="lazy">${p.featured ? '<span class="badge"><i class="fa-solid fa-star"></i> Featured</span>' : ''}</div>
      <div class="project-body">
        <div class="project-meta"><span>${esc(p.category)}</span><span>${esc(p.year)}</span></div>
        <h3>${esc(p.title)}</h3><p>${esc(p.summary)}</p>
        ${chips(p.tech)}
        ${!link && (p.github || p.demo) ? `<div class="project-links">
          ${p.github ? `<a class="btn btn-sm btn-ghost" href="${esc(p.github)}" target="_blank" rel="noopener"><i class="fa-brands fa-github"></i> Code</a>` : ''}
          ${p.demo ? `<a class="btn btn-sm btn-ghost" href="${esc(p.demo)}" target="_blank" rel="noopener"><i class="fa-solid fa-arrow-up-right-from-square"></i> Live</a>` : ''}
        </div>` : ''}
      </div>
    </${tag}>`;
  }

  R.projects = () => {
    if (!nonEmpty(C.projects)) return empty('projects');
    const list = C.projects.map((p, i) => ({ ...p, _i: i })).sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    return `${filterBar(list, 'projects')}<div class="project-grid" data-filter-target="projects">${list.map((p) => projectCard(p, false)).join('')}</div>`;
  };

  R.certificates = () => {
    if (!nonEmpty(C.certificates)) return empty('certificates');
    return `${filterBar(C.certificates, 'certs')}<div class="cert-grid" data-filter-target="certs">${C.certificates.map((c, i) => `
      <article class="cert card reveal-scale" style="--i:${i % 4}" data-category="${esc(c.category || '')}" data-cert="${i}" tabindex="0" role="button" data-cursor="Open">
        <div class="cert-media"><img src="${c.image ? esc(c.image) : Core.certArt(c)}" alt="${esc(c.title)}" loading="lazy"></div>
        <div class="cert-body"><span class="kicker">${esc([c.category, c.date].filter(Boolean).join(' · '))}</span><h3>${esc(c.title)}</h3><p>${esc(c.issuer)}</p></div>
      </article>`).join('')}</div>`;
  };

  R.honors = () => {
    if (!nonEmpty(C.honors)) return empty('honors');
    return `<div class="honor-grid" data-stagger>${C.honors.map((h) => `
      <article class="honor card tilt reveal">
        <div class="honor-top"><span class="honor-icon"><i class="${esc(h.icon || 'fa-solid fa-trophy')}"></i></span><span class="honor-year">${esc(h.date)}</span></div>
        <h3>${esc(h.title)}</h3><span class="t-org">${esc(h.issuer)}</span>${h.description ? `<p>${esc(h.description)}</p>` : ''}
      </article>`).join('')}</div>`;
  };

  R.blog = () => {
    const posts = publishedPosts();
    if (!posts.length) return empty('blog');
    return `<div class="blog-grid" data-stagger>${posts.map((p) => `
      <a class="post-card card reveal" href="post.html?slug=${encodeURIComponent(p.slug)}" data-cursor="Read">
        <div class="project-media"><img src="${img(p.cover, p.title, p.title)}" alt="" loading="lazy"></div>
        <div class="project-body">
          <div class="project-meta"><span>${esc(formatDate(p.date))}</span><span>${readingTime(p.content)} min read</span></div>
          <h3>${esc(p.title)}</h3><p>${esc(p.excerpt)}</p>
          <span class="link-arrow">Read article <i class="fa-solid fa-arrow-right"></i></span>
        </div>
      </a>`).join('')}</div>`;
  };

  R.contact = () => {
    const p = C.profile || {}, c = C.contact || {};
    return `<div class="contact-grid">
      <div class="contact-info card reveal">
        <span class="ec-icon"><i class="fa-solid fa-paper-plane"></i></span>
        <h3>Get in touch</h3>
        <p>${esc(c.text || 'Have a project, research idea or opportunity in mind? Send a message and I will get back to you.')}</p>
        <ul>
          ${p.email ? `<li><i class="fa-solid fa-envelope"></i><a href="mailto:${esc(p.email)}">${esc(p.email)}</a></li>` : ''}
          ${p.phone ? `<li><i class="fa-solid fa-phone"></i>${esc(p.phone)}</li>` : ''}
          ${p.location ? `<li><i class="fa-solid fa-location-dot"></i>${esc(p.location)}</li>` : ''}
          ${p.availability ? `<li><i class="fa-solid fa-circle-check"></i>${esc(p.availability)}</li>` : ''}
        </ul>
        <div class="hero-social">${socialLinks(p.socials)}</div>
      </div>
      ${c.showForm !== false ? `<form class="contact-form card reveal" style="--i:1" id="contact-form" novalidate>
        <div class="field"><input id="cf-name" name="name" placeholder=" " required><label for="cf-name">Your name</label></div>
        <div class="field"><input id="cf-email" name="email" type="email" placeholder=" " required><label for="cf-email">Email address</label></div>
        <div class="field"><textarea id="cf-msg" name="message" placeholder=" " required></textarea><label for="cf-msg">Your message</label></div>
        <button class="btn btn-primary magnetic" type="submit">Send message <i class="fa-solid fa-paper-plane"></i></button>
        <p class="form-status" role="status"></p>
      </form>` : ''}
    </div>`;
  };

  function testimonials() {
    const t = C.testimonials;
    return `<div class="testi card reveal">
      <i class="fa-solid fa-quote-left testi-mark"></i>
      <div class="testi-viewport"><div class="testi-track">${t.map((x) => `
        <div class="testi-slide"><blockquote>${esc(x.quote)}</blockquote>
          <div class="testi-person"><img src="${img(x.photo, x.name, x.name, 120, 120)}" alt=""><div><b>${esc(x.name)}</b><span>${esc(x.role)}</span></div></div></div>`).join('')}</div></div>
      ${t.length > 1 ? `<div class="testi-dots">${t.map((_, i) => `<button aria-label="Testimonial ${i + 1}" class="${i ? '' : 'active'}"></button>`).join('')}</div>` : ''}
    </div>`;
  }

  function postPage() {
    const posts = publishedPosts();
    const slug = new URLSearchParams(location.search).get('slug');
    const i = posts.findIndex((x) => x.slug === slug), post = posts[i];
    if (!post) return `<header class="page-hero" data-manual><div class="ph-bg"><span class="blob b1"></span><span class="blob b2"></span></div><div class="container"><span class="kicker h-in">404</span><h1 class="page-title split">Article <em>not found.</em></h1><p class="page-sub h-in" style="--delay:.4s"><a class="link-arrow" href="blog.html">Back to all articles <i class="fa-solid fa-arrow-right"></i></a></p></div></header>`;
    document.title = `${post.title} · ${strip(C.profile?.name || 'Blog')}`;
    const newer = posts[i - 1], older = posts[i + 1];
    return `<header class="page-hero" data-manual>
        <div class="ph-bg"><span class="blob b1"></span><span class="blob b2"></span><span class="blob b3"></span><span class="dots"></span></div>
        <div class="container narrow">
          <nav class="crumbs h-in"><a href="index.html">Home</a><i class="fa-solid fa-chevron-right"></i><a href="blog.html">${esc(label(sec('blog')))}</a></nav>
          ${nonEmpty(post.tags) ? `<div class="chips h-in" style="--delay:.15s">${post.tags.map((t) => `<span class="chip accent">${esc(t)}</span>`).join('')}</div>` : ''}
          <h1 class="page-title post-title split">${esc(post.title)}</h1>
          <div class="post-meta h-in" style="--delay:.5s"><span><i class="fa-regular fa-calendar"></i> ${esc(formatDate(post.date, true))}</span><span><i class="fa-regular fa-clock"></i> ${readingTime(post.content)} min read</span></div>
        </div>
      </header>
      <section class="section tight"><div class="container narrow">
        ${post.cover ? `<div class="post-cover reveal-scale"><img src="${esc(post.cover)}" alt=""></div>` : ''}
        <article class="post-body prose reveal">${md(post.content)}</article>
        ${(newer || older) ? `<nav class="pager">${older ? `<a class="pager-link prev card" href="post.html?slug=${encodeURIComponent(older.slug)}"><span class="kicker">← Older</span><b>${esc(older.title)}</b></a>` : '<span></span>'}${newer ? `<a class="pager-link next card" href="post.html?slug=${encodeURIComponent(newer.slug)}"><span class="kicker">Newer →</span><b>${esc(newer.title)}</b></a>` : ''}</nav>` : ''}
      </div></section>`;
  }

  /* ---------------- Behaviour ---------------- */
  function typeRoles() {
    const el = $('.typed'); const roles = (C.profile?.roles || []).filter(Boolean);
    if (!el || !roles.length) return;
    if (Core.reduceMotion) { el.textContent = roles.join(' · '); return; }
    let r = 0, i = 0, del = false;
    const tick = () => {
      const word = roles[r]; i += del ? -1 : 1; el.textContent = word.slice(0, i);
      let wait = del ? 40 : 85;
      if (!del && i === word.length) { del = true; wait = 1900; } else if (del && i === 0) { del = false; r = (r + 1) % roles.length; wait = 350; }
      setTimeout(tick, wait);
    };
    setTimeout(tick, 1200);
  }

  function initFilters() {
    $$('[data-filter-group]').forEach((bar) => {
      const target = $(`[data-filter-target="${bar.dataset.filterGroup}"]`);
      bar.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter'); if (!btn) return;
        $$('.filter', bar).forEach((b) => b.classList.toggle('active', b === btn));
        const f = btn.dataset.filter; let k = 0;
        [...target.children].forEach((el) => {
          const show = f === '*' || el.dataset.category === f;
          el.classList.toggle('is-filtered-out', !show); el.classList.remove('pop-in');
          if (show) { void el.offsetWidth; el.style.setProperty('--i', k++); el.classList.add('in', 'pop-in'); }
        });
      });
    });
  }

  let lastFocus;
  function openModal(html, lightbox) {
    const modal = $('#modal'); lastFocus = document.activeElement;
    $('#modal-body').innerHTML = html; modal.classList.toggle('lightbox', !!lightbox);
    modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); document.body.classList.add('modal-open');
    modal.querySelector('.modal-panel').scrollTop = 0; modal.querySelector('.modal-close').focus();
  }
  function closeModal() { const m = $('#modal'); m.classList.remove('open'); m.setAttribute('aria-hidden', 'true'); document.body.classList.remove('modal-open'); lastFocus?.focus?.(); }

  function initModals() {
    $('#modal').addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeModal(); });
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('#modal').classList.contains('open')) closeModal(); });
    const bind = (sel, attr, fn) => $$(sel).forEach((el) => {
      el.addEventListener('click', (e) => { if (!e.target.closest('a')) fn(+el.dataset[attr]); });
      el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(+el.dataset[attr]); } });
    });
    bind('[data-project]', 'project', (i) => {
      const p = C.projects[i];
      openModal(`<div class="modal-hero"><img src="${img(p.image, p.title, p.title, 1200, 600)}" alt=""></div>
        <div class="modal-content">
          <div class="project-meta"><span>${esc(p.category)}</span><span>${esc(p.year)}</span></div>
          <h2>${esc(p.title)}</h2>${chips(p.tech)}
          <div class="prose">${md(p.description || p.summary)}</div>
          ${nonEmpty(p.gallery) ? `<div class="modal-gallery">${p.gallery.filter(Boolean).map((g) => `<img src="${esc(g)}" alt="" loading="lazy">`).join('')}</div>` : ''}
          <div class="hero-cta">
            ${p.demo ? `<a class="btn btn-primary" href="${esc(p.demo)}" target="_blank" rel="noopener">Live demo <i class="fa-solid fa-arrow-right"></i></a>` : ''}
            ${p.github ? `<a class="btn btn-ghost" href="${esc(p.github)}" target="_blank" rel="noopener"><i class="fa-brands fa-github"></i> Source code</a>` : ''}
          </div>
        </div>`);
    });
    bind('[data-cert]', 'cert', (i) => {
      const c = C.certificates[i], link = c.credentialUrl || c.file;
      openModal(`<img class="lightbox-img" src="${c.image ? esc(c.image) : Core.certArt(c)}" alt="${esc(c.title)}">
        <div class="lightbox-cap"><h3>${esc(c.title)}</h3><p>${esc([c.issuer, c.date, c.credentialId ? 'ID: ' + c.credentialId : ''].filter(Boolean).join(' · '))}</p>
        ${link ? `<a class="btn btn-sm btn-primary" href="${esc(link)}" target="_blank" rel="noopener">${c.credentialUrl ? 'Verify credential' : 'Open certificate'} <i class="fa-solid fa-arrow-right"></i></a>` : ''}</div>`, true);
    });
  }

  function initTestimonials() {
    const track = $('.testi-track'), dots = $$('.testi-dots button');
    if (!track || !dots.length) return;
    let i = 0, timer;
    const go = (n) => { i = (n + dots.length) % dots.length; track.style.transform = `translateX(-${i * 100}%)`; dots.forEach((d, k) => d.classList.toggle('active', k === i)); };
    const auto = () => { clearInterval(timer); timer = setInterval(() => go(i + 1), 6500); };
    dots.forEach((d, k) => d.addEventListener('click', () => { go(k); auto(); }));
    auto();
  }

  function initContactForm() {
    const form = $('#contact-form'); if (!form) return;
    const status = form.querySelector('.form-status');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      if (!data.name || !data.message || !/^\S+@\S+\.\S+$/.test(data.email || '')) { status.className = 'form-status err'; status.textContent = 'Please fill in every field with a valid email.'; return; }
      const id = C.contact?.formspreeId;
      if (!id) {
        location.href = `mailto:${C.profile?.email || ''}?subject=${encodeURIComponent('Hello from ' + data.name)}&body=${encodeURIComponent(data.message + '\n\n— ' + data.name + ' (' + data.email + ')')}`;
        status.className = 'form-status ok'; status.textContent = 'Opening your email app…'; return;
      }
      status.className = 'form-status'; status.textContent = 'Sending…';
      try {
        const res = await fetch(`https://formspree.io/f/${encodeURIComponent(id)}`, { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) });
        if (!res.ok) throw new Error();
        form.reset(); status.className = 'form-status ok'; status.textContent = 'Thank you! Your message has been sent.';
      } catch (err) { status.className = 'form-status err'; status.textContent = 'Something went wrong — please email me directly.'; }
    });
  }

  function initScroll() {
    const bar = $('.progress-bar'), nav = $('#nav');
    let lastY = scrollY, ticking = false;
    const update = () => {
      const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
      nav.classList.toggle('scrolled', y > 30);
      nav.classList.toggle('hide', !document.body.classList.contains('menu-open') && y > lastY && y > 400);
      $$('.timeline').forEach((t) => { const r = t.getBoundingClientRect(); t.style.setProperty('--p', Math.min(1, Math.max(0, (innerHeight * 0.6 - r.top) / r.height)).toFixed(3)); });
      lastY = y; ticking = false;
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
    // Hero glow follows the pointer.
    const hero = $('.hero');
    hero?.addEventListener('pointermove', (e) => { const r = hero.getBoundingClientRect(); hero.style.setProperty('--gx', `${e.clientX - r.left}px`); hero.style.setProperty('--gy', `${e.clientY - r.top}px`); });
  }

  /* ---------------- Curtain page transitions ---------------- */
  const html = document.documentElement;
  function setCurtainLabel(kicker, text) { $('.c-kicker').textContent = kicker; $('.c-label').textContent = text; }

  function revealPage(isFirstVisit) {
    let stored = null;
    try { stored = JSON.parse(sessionStorage.getItem('pt') || 'null'); sessionStorage.removeItem('pt'); sessionStorage.setItem('seen', '1'); } catch (e) { /* ignore */ }
    const name = strip(C.profile?.name || '');
    if (stored) setCurtainLabel(stored.k, stored.t);
    else setCurtainLabel(isFirstVisit ? 'Welcome' : '', isFirstVisit ? (name || 'Portfolio') : '');
    const hold = !html.classList.contains('pt-enter') ? 0 : stored ? 250 : (C.site?.preloader === false ? 100 : 900);
    setTimeout(() => {
      html.classList.add('pt-leave');
      document.body.classList.add('ready');
      $$('[data-manual] .split').forEach((e) => e.classList.add('in'));
      setTimeout(() => { html.classList.remove('pt-enter', 'pt-leave'); $$('.hero .count').forEach(Core.runCount); }, 1100);
    }, hold);
  }

  function initTransitions() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target === '_blank' || a.hasAttribute('download') || a.hasAttribute('data-no-transition')) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || !/(\.html|\/)$/.test(url.pathname)) return;
      if (url.pathname === location.pathname && url.search === location.search) { if (url.hash) return; e.preventDefault(); scrollTo({ top: 0, behavior: 'smooth' }); return; }
      if (Core.reduceMotion) return;
      e.preventDefault();
      document.body.classList.remove('menu-open');
      const file = url.pathname.split('/').pop() || 'index.html';
      const id = Object.keys(PAGES).find((k) => PAGES[k].file === file);
      const t = file === 'index.html' ? 'Home' : id ? label(sec(id)) : strip(a.textContent).trim().slice(0, 40);
      const k = id ? `${pageNum(id)} · ${sec(id).kicker || ''}`.replace(/ · $/, '') : '';
      try { sessionStorage.setItem('pt', JSON.stringify({ t, k })); } catch (er) { /* ignore */ }
      setCurtainLabel(k, t);
      html.classList.remove('pt-enter', 'pt-leave');
      html.classList.add('pt-exit');
      setTimeout(() => { location.href = url.href; }, 750);
    });
    // Coming back with the browser's back button restores a cached page: uncover it.
    addEventListener('pageshow', (e) => { if (e.persisted) html.classList.remove('pt-exit', 'pt-enter', 'pt-leave'); });
  }

  /* ---------------- Boot ---------------- */
  async function boot() {
    const page = document.body.dataset.page || 'home';
    const firstVisit = (() => { try { return !sessionStorage.getItem('seen'); } catch (e) { return false; } })();
    try { C = await Core.loadContent(); }
    catch (e) {
      html.classList.remove('pt-enter');
      $('#app').innerHTML = `<div class="load-error"><h1>Content could not load</h1><p>Open the site through a web server (GitHub Pages, or <code>python -m http.server</code>) — not by double-clicking the file.</p></div>`;
      return;
    }
    Core.applySite(C);
    buildShell(page);

    let body;
    if (page === 'home') body = home();
    else if (page === 'post') body = postPage();
    else if (R[page]) {
      const s = sec(page);
      document.title = `${label(s)} · ${strip(C.profile?.name || C.site?.title || 'Portfolio')}`;
      body = pageHero(page) + `<section class="section tight"><div class="container">${s.show === false ? empty(page) : R[page]()}</div></section>` + pager(page);
    }
    if (page === 'home') document.title = C.site?.title || strip(C.profile?.name) || 'Portfolio';
    $('#app').innerHTML = body + footer();

    $$('[data-manual] .split').forEach(Core.splitWords);
    Core.observeReveals($('#app'));
    Core.initTilt(); Core.initMagnetic(); Core.initCursor(C.site?.cursor);
    initScroll(); typeRoles(); initFilters(); initModals(); initTestimonials(); initContactForm(); initTransitions();
    revealPage(firstVisit);
  }
  boot();
})();
