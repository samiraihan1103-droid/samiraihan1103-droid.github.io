# পোর্টফোলিও ওয়েবসাইট — বাংলা গাইড

এই ওয়েবসাইটের সব লেখা, ছবি ও তথ্য থাকে একটি ফাইলে: `data/content.json`।
এখন ফাইলটি খালি। আপনি **Admin Dashboard** থেকে নিজের তথ্য যোগ করবেন, কোড লিখতে হবে না।

---

## ধাপ ১ — নিজের কম্পিউটারে প্রজেক্ট চালানো

**যা লাগবে:** Python (সাধারণত আগেই ইনস্টল থাকে)। না থাকলে <https://www.python.org/downloads/> থেকে ইনস্টল করুন। ইনস্টলের সময় **"Add Python to PATH"** টিক দিন।

1. `portfolio-website` ফোল্ডারটি খুলুন।
2. ফোল্ডারের ভেতরে ফাঁকা জায়গায় **Shift + Right-click** করে **"Open in Terminal"** (বা "Open PowerShell window here") চাপুন।
3. নিচের কমান্ডটি লিখে Enter চাপুন:
   ```bash
   python -m http.server 8000
   ```
4. ব্রাউজারে খুলুন:
   - ওয়েবসাইট: <http://localhost:8000>
   - অ্যাডমিন ড্যাশবোর্ড: <http://localhost:8000/admin/>
5. বন্ধ করতে Terminal-এ **Ctrl + C** চাপুন।

> ⚠️ `index.html` ফাইলে ডাবল-ক্লিক করে খুললে সাইট কাজ করবে না। সবসময় উপরের কমান্ড দিয়ে চালান।
> বিকল্প: VS Code ব্যবহার করলে **Live Server** এক্সটেনশন দিয়ে `index.html`-এ ডান-ক্লিক করে **"Open with Live Server"** চাপুন।

## ধাপ ২ — লোকালি তথ্য যোগ করা (Local mode)

1. <http://localhost:8000/admin/> খুলুন এবং **"Work locally"** বাটনে চাপুন।
2. **Dashboard**-এ দেখবেন কতটুকু সম্পূর্ণ হয়েছে (% চিহ্ন), একটি চেকলিস্ট, আর "New project", "New certificate", "Write a post"-এর মতো দ্রুত বাটন।
3. বাম পাশের মেনু থেকে **Profile**, **Projects**, **Certificates** ইত্যাদিতে গিয়ে তথ্য লিখুন।
4. **Preview** চাপলে আপনার পরিবর্তনসহ সাইটটি দেখা যাবে।
5. কাজ শেষে **Download** চাপুন। একটি নতুন `content.json` ডাউনলোড হবে। সেটি দিয়ে প্রজেক্টের `data/content.json` ফাইলটি **রিপ্লেস** করুন।
6. Local mode-এ ছবি/PDF আপলোড করলে ফাইলটি নিজে `assets/uploads/` ফোল্ডারে কপি করে রাখতে হবে। পাথটি অ্যাডমিন নিজেই বসিয়ে দেয়।

## ধাপ ৩ — ইন্টারনেটে প্রকাশ করা (GitHub Pages, ফ্রি)

1. <https://github.com>-এ একটি অ্যাকাউন্ট খুলুন।
2. নতুন রিপোজিটরি তৈরি করুন, নাম দিন হুবহু **`আপনার-username.github.io`**, এবং **Public** রাখুন।
3. রিপোজিটরিতে **Add file → Upload files** চাপুন। `portfolio-website` ফোল্ডারের **ভেতরের সব ফাইল ও ফোল্ডার** টেনে দিন (`.nojekyll` ফাইলসহ), তারপর **Commit changes** চাপুন।
4. **Settings → Pages**-এ যান। *Deploy from a branch* → **main** → **/(root)** বেছে **Save** চাপুন।
5. ১–২ মিনিট পর সাইট চালু হবে: `https://আপনার-username.github.io/`

## ধাপ ৪ — অনলাইনে Admin ব্যবহার (Access Token)

Admin থেকে সরাসরি সাইট আপডেট করতে একটি GitHub **Token** লাগে। এটি পাসওয়ার্ডের মতো, কাউকে দেবেন না।

1. <https://github.com/settings/personal-access-tokens/new> খুলুন।
2. **Token name:** `Portfolio admin`। **Expiration:** পছন্দমতো, যেমন ১ বছর।
3. **Repository access → Only select repositories** → আপনার সাইটের রিপোজিটরি বেছে নিন।
4. **Permissions → Repository permissions → Contents → "Read and write"** দিন।
5. **Generate token** চাপুন এবং টোকেনটি (`github_pat_...`) কপি করুন।
6. `https://আপনার-username.github.io/admin/` খুলুন। Username, Repository, Branch (`main`) ও Token দিয়ে **Connect** চাপুন।
7. তথ্য যোগ/পরিবর্তন করে **Publish** চাপুন (বা **Ctrl + S**)। ১–২ মিনিটে সাইট আপডেট হবে। পুরোনো সাইট দেখালে **Ctrl + F5** চাপুন।

## আগের ভার্সন আপডেট করা (GitHub-এ আগে আপলোড করে থাকলে)

1. রিপোজিটরিতে **Add file → Upload files** চাপুন।
2. `portfolio-website` ফোল্ডারের **ভেতরের সবকিছু** আবার টেনে দিন। একই নামের ফাইলগুলো নিজে থেকেই রিপ্লেস হয়ে যাবে।
3. **Commit changes** চাপুন।
4. পুরোনো `js/main.js` ও `js/post.js` আর দরকার নেই। চাইলে GitHub থেকে মুছে ফেলতে পারেন। রেখে দিলেও কোনো সমস্যা নেই।

## দরকারি টিপস

- শিরোনামে কোনো শব্দ `*তারকা*`-র মধ্যে লিখলে সেটি সোনালি italic হয়ে যাবে। যেমন: `Things I've *built*`।
- Bio, প্রজেক্টের বিস্তারিত ও ব্লগে **Markdown** চলে: `**bold**`, `## শিরোনাম`, `- তালিকা`।
- যে সেকশনে কোনো তথ্য নেই, সেটি সাইটে নিজে থেকেই লুকিয়ে থাকে।
- **Pages & menu** থেকে পেজ লুকানো, ক্রম বদলানো, মেনুতে দেখানো/না-দেখানো এবং হোম পেজের কার্ডের লেখা বদলানো যায়।
- কোনো পেজে তথ্য না থাকলে সেখানে সুন্দর একটি **"Coming soon"** কার্ড দেখাবে।
- **Site settings** থেকে রঙ (accent colour), ট্যাবের নাম, intro loader ও cursor চালু/বন্ধ করা যায়।
- কন্টাক্ট ফর্মের মেসেজ সরাসরি ইমেইলে পেতে <https://formspree.io>-তে ফ্রি ফর্ম খুলে তার ID **Admin → Contact → Formspree form ID**-তে বসান।
- টোকেন কোথাও ফাঁস হলে <https://github.com/settings/tokens?type=beta> থেকে মুছে নতুন একটি তৈরি করুন।
