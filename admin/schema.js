/* Describes every editable part of data/content.json.
   The admin UI is generated from this — add a field here and it appears in the editor.
   Field types: text, textarea, markdown, url, email, image, file, toggle, select, tags, color, number, icon, group, list */
window.SCHEMA = [
  { key: 'dashboard', label: 'Dashboard', icon: 'fa-solid fa-gauge-high', type: 'dashboard' },
  {
    key: 'profile', label: 'Profile', icon: 'fa-solid fa-user', type: 'group',
    help: 'Your name, photo, intro text and social links — shown in the hero, About and Contact sections.',
    fields: [
      { key: 'name', label: 'Full name', type: 'text', help: 'Wrap a word in *asterisks* to make it italic & gold.' },
      { key: 'shortName', label: 'Logo initials', type: 'text', help: 'Two letters shown in the logo badge, e.g. SR.' },
      { key: 'eyebrow', label: 'Small line above your name', type: 'text', help: 'e.g. CSE UNDERGRADUATE · MIST' },
      { key: 'photo', label: 'Profile photo', type: 'image', help: 'Portrait photo works best (4:5 ratio).' },
      { key: 'roles', label: 'Rotating job titles', type: 'tags', help: 'Typed one after another in the hero. Separate with commas.' },
      { key: 'tagline', label: 'Hero tagline', type: 'textarea' },
      { key: 'availability', label: 'Availability badge', type: 'text', help: 'e.g. "Open to opportunities". Leave empty to hide.' },
      { key: 'headline', label: 'About — headline', type: 'textarea', help: 'Large sentence at the top of About. *word* = gradient highlight.' },
      { key: 'bio', label: 'About — biography', type: 'markdown' },
      {
        key: 'focus', label: 'About — focus areas', type: 'list', itemLabel: 'title', help: 'Cards under "What I focus on" on the About page.',
        fields: [{ key: 'title', label: 'Title', type: 'text' }, { key: 'icon', label: 'Icon', type: 'icon' }, { key: 'description', label: 'Description', type: 'textarea' }],
      },
      { key: 'cv', label: 'CV / Résumé (PDF)', type: 'file', accept: '.pdf,.doc,.docx', help: 'Leave empty to show "CV coming soon".' },
      { key: 'email', label: 'Email', type: 'email' },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'location', label: 'Location', type: 'text' },
      {
        key: 'facts', label: 'Quick facts', type: 'list', itemLabel: 'label', help: 'Small table beside your bio.',
        fields: [{ key: 'label', label: 'Label', type: 'text' }, { key: 'value', label: 'Value', type: 'text' }],
      },
      {
        key: 'socials', label: 'Social links', type: 'list', itemLabel: 'platform',
        fields: [
          { key: 'platform', label: 'Platform', type: 'select', options: ['github', 'linkedin', 'email', 'scholar', 'researchgate', 'orcid', 'twitter', 'facebook', 'instagram', 'youtube', 'medium', 'kaggle', 'leetcode', 'codeforces', 'stackoverflow', 'dribbble', 'behance', 'whatsapp', 'telegram', 'discord', 'website', 'blog'] },
          { key: 'url', label: 'URL', type: 'url', help: 'For email use mailto:you@example.com' },
        ],
      },
    ],
  },
  {
    key: 'stats', label: 'Statistics', icon: 'fa-solid fa-chart-simple', type: 'list', itemLabel: 'label',
    help: 'Animated counters on the home page.',
    fields: [
      { key: 'value', label: 'Number', type: 'text' },
      { key: 'suffix', label: 'Suffix', type: 'text', help: 'e.g. + or %' },
      { key: 'label', label: 'Label', type: 'text' },
    ],
  },
  {
    key: 'skills', label: 'Skills', icon: 'fa-solid fa-wand-magic-sparkles', type: 'group',
    fields: [
      { key: 'marquee', label: 'Scrolling skill words', type: 'tags', help: 'The moving ribbon on the home page and "Also familiar with" on the Skills page.' },
      {
        key: 'groups', label: 'Skill groups', type: 'list', itemLabel: 'name',
        fields: [
          { key: 'name', label: 'Group name', type: 'text' },
          { key: 'icon', label: 'Icon', type: 'icon' },
          {
            key: 'items', label: 'Skills', type: 'list', itemLabel: 'name', help: 'Leave level empty to show the skill as a tag instead of a bar.',
            fields: [{ key: 'name', label: 'Skill', type: 'text' }, { key: 'level', label: 'Level (0–100)', type: 'number' }],
          },
        ],
      },
    ],
  },
  {
    key: 'experience', label: 'Experience', icon: 'fa-solid fa-briefcase', type: 'list', itemLabel: 'role',
    fields: [
      { key: 'role', label: 'Role / title', type: 'text' },
      { key: 'org', label: 'Organisation', type: 'text' },
      { key: 'orgUrl', label: 'Organisation website', type: 'url' },
      { key: 'type', label: 'Type', type: 'text', help: 'Full-time, Internship, Part-time…' },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'start', label: 'Start', type: 'text', help: 'e.g. Jan 2025' },
      { key: 'end', label: 'End', type: 'text', help: 'Leave empty for "Present".' },
      { key: 'logo', label: 'Logo', type: 'image' },
      { key: 'description', label: 'Description', type: 'markdown' },
      { key: 'highlights', label: 'Skills / tags', type: 'tags' },
    ],
  },
  {
    key: 'research', label: 'Research', icon: 'fa-solid fa-flask', type: 'group',
    fields: [
      {
        key: 'interests', label: 'Research interests', type: 'list', itemLabel: 'title',
        fields: [{ key: 'title', label: 'Title', type: 'text' }, { key: 'icon', label: 'Icon', type: 'icon' }, { key: 'description', label: 'Description', type: 'textarea' }],
      },
      {
        key: 'publications', label: 'Publications', type: 'list', itemLabel: 'title',
        fields: [
          { key: 'title', label: 'Paper title', type: 'text' },
          { key: 'authors', label: 'Authors', type: 'text' },
          { key: 'venue', label: 'Journal / conference', type: 'text' },
          { key: 'year', label: 'Year', type: 'text' },
          { key: 'status', label: 'Status', type: 'text', help: 'Published, Under review, Preprint…' },
          { key: 'link', label: 'Link (DOI / PDF)', type: 'url' },
        ],
      },
    ],
  },
  {
    key: 'projects', label: 'Projects', icon: 'fa-solid fa-layer-group', type: 'list', itemLabel: 'title',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'category', label: 'Category', type: 'text', help: 'Used for the filter buttons (e.g. AI / ML, Web).' },
      { key: 'year', label: 'Year', type: 'text' },
      { key: 'featured', label: 'Featured (large card, shown first)', type: 'toggle' },
      { key: 'image', label: 'Cover image', type: 'image', help: 'Landscape, about 1600×1000.' },
      { key: 'summary', label: 'Short summary', type: 'textarea' },
      { key: 'description', label: 'Full write-up (opens in a popup)', type: 'markdown' },
      { key: 'tech', label: 'Tech stack', type: 'tags' },
      { key: 'github', label: 'Source code URL', type: 'url' },
      { key: 'demo', label: 'Live demo URL', type: 'url' },
      { key: 'gallery', label: 'Extra screenshots', type: 'imagelist' },
    ],
  },
  {
    key: 'certificates', label: 'Certificates', icon: 'fa-solid fa-certificate', type: 'list', itemLabel: 'title',
    fields: [
      { key: 'title', label: 'Certificate title', type: 'text' },
      { key: 'issuer', label: 'Issuer', type: 'text' },
      { key: 'date', label: 'Date', type: 'text' },
      { key: 'category', label: 'Category', type: 'text', help: 'Used for the filter buttons.' },
      { key: 'image', label: 'Certificate image', type: 'image', help: 'Screenshot or photo of the certificate (JPG/PNG).' },
      { key: 'file', label: 'Certificate PDF (optional)', type: 'file', accept: '.pdf' },
      { key: 'credentialUrl', label: 'Verification URL', type: 'url' },
      { key: 'credentialId', label: 'Credential ID', type: 'text' },
    ],
  },
  {
    key: 'education', label: 'Education', icon: 'fa-solid fa-graduation-cap', type: 'list', itemLabel: 'institution',
    fields: [
      { key: 'institution', label: 'Institution', type: 'text' },
      { key: 'degree', label: 'Degree / programme', type: 'text' },
      { key: 'url', label: 'Institution website', type: 'url' },
      { key: 'start', label: 'Start', type: 'text' },
      { key: 'end', label: 'End', type: 'text' },
      { key: 'result', label: 'Result / GPA', type: 'text' },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'logo', label: 'Logo', type: 'image' },
      { key: 'description', label: 'Description', type: 'markdown' },
    ],
  },
  {
    key: 'honors', label: 'Honors & awards', icon: 'fa-solid fa-trophy', type: 'list', itemLabel: 'title',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'issuer', label: 'Awarded by', type: 'text' },
      { key: 'date', label: 'Year', type: 'text' },
      { key: 'icon', label: 'Icon', type: 'icon' },
      { key: 'description', label: 'Description', type: 'textarea' },
    ],
  },
  {
    key: 'volunteering', label: 'Leadership', icon: 'fa-solid fa-hand-holding-heart', type: 'list', itemLabel: 'role',
    fields: [
      { key: 'role', label: 'Role', type: 'text' },
      { key: 'org', label: 'Organisation', type: 'text' },
      { key: 'start', label: 'Start', type: 'text' },
      { key: 'end', label: 'End', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
    ],
  },
  {
    key: 'testimonials', label: 'Testimonials', icon: 'fa-solid fa-quote-left', type: 'list', itemLabel: 'name',
    fields: [
      { key: 'quote', label: 'Quote', type: 'textarea' },
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'role', label: 'Role / organisation', type: 'text' },
      { key: 'photo', label: 'Photo', type: 'image' },
    ],
  },
  {
    key: 'blog', label: 'Blog posts', icon: 'fa-solid fa-pen-nib', type: 'list', itemLabel: 'title', newFirst: true,
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'slug', label: 'URL slug', type: 'slug', from: 'title', help: 'Used in the link: post.html?slug=…' },
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'published', label: 'Published', type: 'toggle', default: true },
      { key: 'cover', label: 'Cover image', type: 'image' },
      { key: 'tags', label: 'Tags', type: 'tags' },
      { key: 'excerpt', label: 'Excerpt', type: 'textarea' },
      { key: 'content', label: 'Article (Markdown)', type: 'markdown', rows: 18 },
    ],
  },
  {
    key: 'contact', label: 'Contact', icon: 'fa-solid fa-envelope', type: 'group',
    fields: [
      { key: 'text', label: 'Intro text', type: 'textarea' },
      { key: 'showForm', label: 'Show contact form', type: 'toggle', default: true },
      { key: 'formspreeId', label: 'Formspree form ID', type: 'text', help: 'Create a free form at formspree.io and paste the ID (e.g. xyzabcd). Empty = form opens the visitor\'s email app.' },
    ],
  },
  {
    key: 'sections', label: 'Pages & menu', icon: 'fa-solid fa-table-columns', type: 'list', itemLabel: 'navLabel', fixed: true,
    help: 'Every item here is a page of your site. Reorder with the arrows (this sets the menu, the Explore grid and the Next/Previous links), hide pages, and rename titles.',
    fields: [
      { key: 'show', label: 'Visible', type: 'toggle', default: true },
      { key: 'inNav', label: 'Show in top menu', type: 'toggle', default: true },
      { key: 'navLabel', label: 'Menu label', type: 'text' },
      { key: 'kicker', label: 'Small label above title', type: 'text' },
      { key: 'title', label: 'Title', type: 'text', help: '*word* = gradient highlight.' },
      { key: 'subtitle', label: 'Subtitle', type: 'text' },
      { key: 'desc', label: 'Card text on the home page', type: 'textarea', help: 'Short description shown on this page\'s card in the home "Explore" grid. Empty = a default sentence.' },
    ],
  },
  {
    key: 'site', label: 'Site settings', icon: 'fa-solid fa-gear', type: 'group',
    fields: [
      { key: 'title', label: 'Browser tab title', type: 'text' },
      { key: 'description', label: 'Search engine description', type: 'textarea' },
      { key: 'accent', label: 'Accent colour', type: 'color' },
      { key: 'accent2', label: 'Secondary accent', type: 'color' },
      { key: 'favicon', label: 'Favicon', type: 'image' },
      { key: 'preloader', label: 'Show welcome screen on first visit', type: 'toggle', default: true },
      { key: 'cursor', label: 'Custom animated cursor', type: 'toggle', default: true },
      { key: 'footerHeadline', label: 'Footer headline', type: 'text', help: '*word* = highlighted.' },
      { key: 'footerNote', label: 'Footer note', type: 'text' },
    ],
  },
];
