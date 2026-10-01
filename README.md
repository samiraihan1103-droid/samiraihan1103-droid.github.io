# Personal Portfolio

An animated personal website (light design) with a built-in admin dashboard. A Bangla guide is in README.bn.md. No coding is needed to update it. It is a static site: plain HTML, CSS and JavaScript with no build step, and it is hosted for free on **GitHub Pages**.

```
index.html, about.html, skills.html, experience.html, research.html,
projects.html, certificates.html, education.html, honors.html,
blog.html, post.html, contact.html   ← one file per page (all share the same layout)
<secret-folder>/     ← your private dashboard (folder name kept secret; not linked anywhere)
data/content.json   ← ALL site content lives here
assets/uploads/     ← images & PDFs you upload from the admin panel
css/style.css       ← design (Sky & Lavender theme)
js/core.js, js/site.js ← page rendering, animations and curtain page transitions
tools/make-pages.js ← regenerates the page HTML files (developers only)
```

---

## 1. Put the site online (one-time, about 10 minutes)

1. Create a free account at <https://github.com> if you don't have one.
2. Create a **new repository** named exactly **`<your-username>.github.io`** and make it **Public**.
   *(Your site will then be at `https://<your-username>.github.io/`. Any other repo name also works. The site then lives at `https://<your-username>.github.io/<repo-name>/`.)*
3. Upload the files. In the new repo, click **Add file → Upload files** and drag in **everything inside this folder**, including the `admin`, `assets`, `css`, `data` and `js` folders and the `.nojekyll` file. Then click **Commit changes**.
   *(Or, with Git installed:)*
   ```bash
   git init && git add . && git commit -m "Initial site" && git branch -M main && git remote add origin https://github.com/<your-username>/<your-username>.github.io.git && git push -u origin main
   ```
4. Go to the repo's **Settings → Pages**. Under *Build and deployment*, choose **Deploy from a branch**, then **main** and **/ (root)**, and click **Save**.
5. After about a minute your site is live at `https://<your-username>.github.io/`.

## 2. Create your admin key (one-time)

The admin panel saves changes by committing to your repository, so it needs a GitHub **access token**. Treat the token like a password.

1. Open <https://github.com/settings/personal-access-tokens/new> to create a **fine-grained** token.
2. **Token name:** `Portfolio admin`. **Expiration:** choose what you like, for example 1 year.
3. **Repository access → Only select repositories** → pick your site's repository.
4. **Permissions → Repository permissions → Contents → Read and write.** Nothing else is needed.
5. Click **Generate token** and copy it. It starts with `github_pat_`.

## 3. Edit your site

1. Visit **`https://<your-username>.github.io/<your-secret-folder>/`**. The link isn't shown anywhere on the site, and search engines are told not to index it.
2. Enter your GitHub username, the repository name, branch `main`, and paste your token. Tick *Remember on this device* only on your own computer.
3. Edit anything you like:
   - **Profile:** name, photo, job titles, bio, CV, contact details and social links
   - **Projects, Certificates, Experience, Education, Honors, Leadership, Testimonials, Blog:** add, edit, reorder (↑ ↓), duplicate or delete items
   - **Upload** buttons store images and PDFs in `assets/uploads/`. Large photos are resized automatically.
   - **Sections & layout:** show or hide sections, reorder them, rename titles, and pick a background tone (light, white or tint) for each one
   - **Site settings:** accent colours, page title, intro loader, custom cursor and footer
4. Click **Preview** to see your unsaved changes on the real design.
5. Click **Publish** (or press Ctrl+S). The live site updates within 1–2 minutes. Refresh with Ctrl+F5 if you still see the old version.

Your edits are also auto-saved in the browser, so an accidental tab close won't lose your work.

**Formatting tips**
- In titles, wrap a word in `*asterisks*` to make it *italic and gold*, for example `Things I've *built*`.
- Bios, project write-ups and blog posts support **Markdown**: `**bold**`, `*italic*`, `## Heading`, `- list`, `[link](https://…)`. Use the toolbar and the *Preview* button.
- Leave a skill's *Level* empty to show it as a tag instead of a progress bar.
- A section with no items is hidden automatically.
- Icons: click **Choose** to pick one, or paste any free [Font Awesome](https://fontawesome.com/search?o=r&m=free) class, for example `fa-solid fa-robot`.

## 4. Contact form (optional)

By default, the contact form opens the visitor's email app. To receive messages directly in your inbox instead:
1. Create a free form at <https://formspree.io> and copy its ID (the part after `/f/`).
2. Paste it into **Admin → Contact → Formspree form ID** and click Publish.

## 5. Working offline / on your computer

Browsers block loading `content.json` from a double-clicked file, so run a tiny local server from this folder:

```bash
python -m http.server 8000
```

Then open <http://localhost:8000> for the site and `http://localhost:8000/<your-secret-folder>/` for the editor. In the editor, choose **Work locally**. **Download** saves a new `content.json`, which you put into the `data/` folder yourself.

## Security notes
- The token is stored only in your browser. It is sent only to `api.github.com`.
- Even if someone finds the editor folder, nobody can change anything without a valid token for your repository.
- If a token is ever exposed, delete it at <https://github.com/settings/tokens?type=beta> and create a new one.
