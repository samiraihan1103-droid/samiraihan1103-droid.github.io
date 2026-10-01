// Regenerates every page's HTML from one template. Run from the project root:  node tools/make-pages.js
const fs = require('fs');
const path = require('path');

const pages = {
  'index.html': ['home', 'Portfolio'],
  'about.html': ['about', 'About'],
  'skills.html': ['skills', 'Skills'],
  'experience.html': ['experience', 'Experience'],
  'research.html': ['research', 'Research'],
  'projects.html': ['projects', 'Projects'],
  'certificates.html': ['certificates', 'Certificates'],
  'education.html': ['education', 'Education'],
  'honors.html': ['honors', 'Honors'],
  'blog.html': ['blog', 'Blog'],
  'post.html': ['post', 'Article'],
  'contact.html': ['contact', 'Contact'],
};

const template = (page, title) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <meta name="description" content="">
  <meta name="theme-color" content="#F5F7FF">
  <link rel="icon" href="assets/favicon.svg" type="image/svg+xml" id="favicon">
  <script>
    /* Cover the page with the transition curtain before first paint (first visit or after a link click). */
    try { if (!matchMedia('(prefers-reduced-motion: reduce)').matches && (sessionStorage.getItem('pt') || !sessionStorage.getItem('seen'))) document.documentElement.classList.add('pt-enter'); } catch (e) {}
    setTimeout(function () { document.documentElement.classList.remove('pt-enter'); }, 5000);
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400..800;1,400..700&family=Inter:wght@400..700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">
  <link rel="stylesheet" href="css/style.css">
</head>
<body data-page="${page}">
  <span id="top"></span>
  <div class="curtain" aria-hidden="true">
    <div class="c1"></div>
    <div class="c2"><div class="c-inner"><span class="c-kicker"></span><span class="c-label"></span><span class="c-bar"><i></i></span></div></div>
  </div>
  <main id="app"></main>
  <script src="https://cdn.jsdelivr.net/npm/marked@12/marked.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/dompurify@3/dist/purify.min.js"></script>
  <script src="js/core.js"></script>
  <script src="js/site.js"></script>
</body>
</html>
`;

const root = path.join(__dirname, '..');
for (const [file, [page, title]] of Object.entries(pages)) fs.writeFileSync(path.join(root, file), template(page, title));
console.log('Wrote', Object.keys(pages).length, 'pages');
