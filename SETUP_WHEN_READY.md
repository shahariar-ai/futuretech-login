# যখন সময় পাবেন — Supabase, Netlify আর শেষ টেস্ট

এই ফাইলে আপনার বাকি কাজগুলো সহজ ভাষায়, ধাপে ধাপে দেওয়া আছে।
কোড সব তৈরি — আপনাকে শুধু Supabase আর Netlify ওয়েবসাইটে কিছু বোতাম চাপতে হবে।
বোতাম আর মেনুর নাম ইংরেজিতেই রাখা হলো, কারণ ওয়েবসাইটে সেগুলো ইংরেজিতে থাকে।

মোট সময়: প্রায় ১ ঘণ্টা (Supabase ~২০ মিনিট, Netlify ~১৫ মিনিট, শেষ টেস্ট ~৩০ মিনিট)।

> ⚠️ **কখনো কাউকে দেবেন না, চ্যাটে বা কোডে রাখবেন না:**
> database password, `service_role` / `secret` key, আপনার কোনো password।
> শুধু **Project URL** আর **anon / publishable key** কোডে রাখা নিরাপদ — এগুলো পাবলিক হওয়ার জন্যই বানানো।
> আসল নিরাপত্তা আসে ডাটাবেসের RLS (Row Level Security) থেকে, যেটা `schema.sql` চালু করে দেয়।

> ℹ️ Google / GitHub login আপনি চাননি, তাই এখানে সেগুলো নেই।

---

## অংশ ১ — Supabase প্রজেক্ট (প্রায় ২০ মিনিট)

### ধাপ ১.১ — নতুন প্রজেক্ট তৈরি

1. <https://supabase.com> এ যান → **Sign in** (GitHub দিয়ে সাইন ইন করা সবচেয়ে সহজ)।
2. **New project** এ ক্লিক করুন।
3. Organization বেছে নিন (না থাকলে একটি বানান, **Free** plan)।
4. **Project name:** `futuretech-login`
5. **Database Password:** **Generate a password** ক্লিক করুন → পাসওয়ার্ডটি কপি করে **অফলাইনে** রাখুন (পাসওয়ার্ড ম্যানেজার বা খাতায়)।
6. **Region:** `Southeast Asia (Singapore)` — বাংলাদেশের সবচেয়ে কাছে।
7. **Create new project** ক্লিক করুন → ১–২ মিনিট অপেক্ষা করুন, যতক্ষণ না প্রজেক্ট "Healthy" দেখায়।

### ধাপ ১.২ — Email login সেটিংস

1. বাম মেনু → **Authentication** → **Sign In / Providers** (পুরোনো ড্যাশবোর্ডে **Providers**)।
2. **Email** খুলুন:
   - **Enable Email provider:** ON
   - **Confirm email:** **ON** রাখুন ✅
   - **Minimum password length:** `8`
   - **Password requirements** থাকলে: `Letters and digits` বেছে নিন।
3. **Save** ক্লিক করুন।

### ধাপ ১.৩ — Database টেবিল আর নিরাপত্তা (`schema.sql` চালানো)

1. VS Code এ `supabase/schema.sql` খুলুন → **Ctrl+A** → **Ctrl+C** (পুরোটা কপি)।
2. Supabase এ বাম মেনু → **SQL Editor** → **New query**।
3. পেস্ট করুন (**Ctrl+V**) → নিচে ডানে **Run** (বা **Ctrl+Enter**)।
4. "destructive operation" জাতীয় সতর্কবার্তা এলে → **Run this query** ক্লিক করুন।
   (স্ক্রিপ্টে `drop policy if exists` আছে, তাই এটা আসে; কোনো ডেটা মুছবে না।)
5. প্রত্যাশিত ফল: **"Success. No rows returned"** ✅
6. যাচাই করুন:
   - **Table Editor** → `profiles` টেবিল আছে, আর পাশে **RLS enabled** লেখা (লাল "RLS disabled" নয়)।
   - **Authentication** → **Policies** → `profiles` এর নিচে দুটি policy:
     "Users can view their own profile" আর "Users can update their own profile"।

### ধাপ ১.৪ — URL Configuration (নিজের ল্যাপটপে টেস্টের জন্য)

1. **Authentication** → **URL Configuration**।
2. **Site URL:** `http://127.0.0.1:5500` → **Save**।
3. **Redirect URLs** → **Add URL** দিয়ে একে একে যোগ করুন:
   - `http://127.0.0.1:5500/index.html`
   - `http://127.0.0.1:5500/reset-password.html`
   - `http://127.0.0.1:5500/dashboard.html`
   - `http://localhost:5500/**` (যদি Live Server `localhost` ঠিকানায় খোলে)
4. **Save URLs**।

> Live Server ডিফল্টভাবে port **5500** এ চলে। অন্য port হলে উপরের URL গুলোতেও সেই port দিন।

### ধাপ ১.৫ — Project URL আর anon key কোডে বসানো

1. বাম পাশের নিচে ⚙️ **Project Settings** → **Data API** (কিছু অ্যাকাউন্টে **API**) → **Project URL** কপি করুন।
   দেখতে এমন: `https://abcdefghijkl.supabase.co`
2. **API Keys** → **anon public** key কপি করুন (নতুন ড্যাশবোর্ডে **Publishable key**, শুরু হয় `sb_publishable_…` দিয়ে)।
   - ❌ `service_role` বা `secret` key কপি করবেন **না**।
3. VS Code এ `js/config.js` খুলুন। শুধু এই দুটি লাইন বদলান:

   ```js
   export const SUPABASE_CONFIG = {
     url: 'https://abcdefghijkl.supabase.co',
     anonKey: 'এখানে আপনার anon / publishable key',
   };
   ```

4. `AUTH_PROVIDER = 'auto'` যেমন আছে তেমনই রাখুন। দুটি মান বসালেই সাইট নিজে থেকে আসল Supabase ব্যবহার শুরু করবে।
5. Save (**Ctrl+S**)।

### ধাপ ১.৬ — ল্যাপটপে ছোট্ট একটা টেস্ট

1. VS Code এ `index.html` এ রাইট-ক্লিক → **Open with Live Server**।
2. উপরের **"Demo mode"** ব্যাজটি আর দেখা যাবে না — মানে Supabase চালু হয়েছে ✅
3. **Create account** → আপনার আসল ইমেইল দিয়ে একটি অ্যাকাউন্ট খুলুন → ইমেইলের লিংকে ক্লিক করুন → Dashboard খুলবে।

সব ঠিক থাকলে Git এ সেভ করুন (VS Code টার্মিনালে):

```bash
git add js/config.js
git commit -m "config: connect Supabase project"
```

(anon key পাবলিক, তাই এটা commit করা নিরাপদ।)

---

## অংশ ২ — অনলাইনে তোলা: GitHub + Netlify (প্রায় ১৫ মিনিট)

### ধাপ ২.১ — GitHub এ কোড তোলা

1. <https://github.com/new> এ যান।
2. **Repository name:** `futuretech-login` → **Public** (পোর্টফোলিওর জন্য) → **README যোগ করবেন না** (আমাদের আগেই আছে) → **Create repository**।
3. VS Code টার্মিনালে (প্রজেক্ট ফোল্ডারে) এগুলো চালান — `YOUR-USERNAME` এর জায়গায় আপনার GitHub নাম দিন:

   ```bash
   git remote add origin https://github.com/YOUR-USERNAME/futuretech-login.git
   git push -u origin main
   ```

4. লগইন চাইলে ব্রাউজারে GitHub এ অনুমতি দিন।
5. GitHub পেজ রিফ্রেশ করুন — সব ফাইল দেখা যাবে ✅

> GitHub Desktop পছন্দ করলে: **File → Add local repository** → ফোল্ডারটি বেছে নিন → **Publish repository**।

### ধাপ ২.২ — Netlify তে সাইট চালু

1. <https://app.netlify.com> → **Sign up / Log in** (GitHub দিয়ে)।
2. **Add new site** (বা **Add new project**) → **Import an existing project** → **GitHub**।
3. `futuretech-login` রিপো বেছে নিন।
4. সেটিংস:
   - **Branch:** `main`
   - **Build command:** খালি রাখুন
   - **Publish directory:** `.` (`netlify.toml` এ আগেই লেখা আছে, তাই নিজে থেকে বসে যাবে)
5. **Deploy** ক্লিক করুন → ১ মিনিটের মধ্যে একটি লিংক পাবেন, যেমন `https://random-name-123.netlify.app`।
6. (ঐচ্ছিক) **Site configuration → Change site name** → যেমন `futuretech-login` → লিংক হবে `https://futuretech-login.netlify.app`।

`netlify.toml` নিজে থেকেই নিরাপত্তা headers (CSP ইত্যাদি) যোগ করে দেয় — আপনাকে কিছু করতে হবে না।

### ধাপ ২.৩ — Supabase এ লাইভ লিংক যোগ করা

এটা না করলে ইমেইলের লিংক আপনার ল্যাপটপের ঠিকানায় (`127.0.0.1`) চলে যাবে।

1. Supabase → **Authentication** → **URL Configuration**।
2. **Site URL:** আপনার Netlify লিংক, যেমন `https://futuretech-login.netlify.app` → **Save**।
3. **Redirect URLs** এ **যোগ করুন** (পুরোনো লোকাল URL গুলো মুছবেন না — ল্যাপটপে টেস্টের জন্য লাগবে):
   - `https://futuretech-login.netlify.app/index.html`
   - `https://futuretech-login.netlify.app/reset-password.html`
   - `https://futuretech-login.netlify.app/dashboard.html`
4. **Save URLs**।
5. README.md এর "Live demo" লাইনে লিংকটি বসিয়ে commit + push করুন:

   ```bash
   git add README.md
   git commit -m "docs: add live link"
   git push
   ```

   Push করলেই Netlify নিজে থেকে নতুন ভার্সন তুলে দেবে।

---

## অংশ ৩ — ইমেইল আর ফ্রি প্ল্যানের সীমা (জেনে রাখুন)

- **ইমেইল সীমা:** Supabase এর নিজস্ব ইমেইল সার্ভিস **ঘণ্টায় মাত্র কয়েকটি** ইমেইল পাঠায় — শুধু টেস্টের জন্য।
  টেস্টের সময় পরপর অনেকবার sign up / reset করবেন না। "Too many attempts" দেখালে এক ঘণ্টা পরে আবার চেষ্টা করুন।
- **আসল ব্যবহারকারীদের জন্য:** custom SMTP সেট করুন, যেমন [Resend](https://resend.com) (ফ্রি প্ল্যান আছে)।
  জায়গা: Supabase → **Authentication** → **Emails** → **SMTP Settings**। SMTP password শুধু ওখানেই বসবে, কোডে কখনো না।
  চাইলে পরে আমাকে বলুন, ধাপে ধাপে দেখিয়ে দেব।
- **ইমেইলের লেখা বদলানো:** **Authentication** → **Emails** → **Templates** → "Confirm signup" আর "Reset password" এ
  FutureTech.ai নাম দিয়ে নিজের মতো লেখা দিন। `{{ .ConfirmationURL }}` অংশটি মুছবেন না — ওটাই লিংক।
- **প্রজেক্ট ঘুমিয়ে পড়া:** ফ্রি Supabase প্রজেক্ট প্রায় **এক সপ্তাহ** কেউ ব্যবহার না করলে pause হয়ে যায়।
  তখন সাইনইন কাজ করবে না। Supabase ড্যাশবোর্ডে ঢুকে **Restore / Resume** চাপলেই আবার চালু হবে।
  ক্লায়েন্টকে ডেমো দেখানোর আগে একবার ঢুকে দেখে নিন।

---

## অংশ ৪ — শেষ টেস্ট (প্রায় ৩০ মিনিট)

লাইভ লিংকে টেস্ট করুন, অন্তত **দুটি ব্রাউজারে** (যেমন Chrome আর Edge/Firefox), বা দুটি ল্যাপটপে।
কোনোটা কাজ না করলে টিক দেবেন না — কোনটা, কী দেখলেন লিখে রাখুন, পরে আমাকে দিন। প্রতিটি phase আলাদা commit করা আছে, তাই সমস্যাটা কোথা থেকে এল দ্রুত খুঁজে ঠিক করা যাবে।

- [ ] **Sign up:** নতুন অ্যাকাউন্ট → confirmation ইমেইল আসে → লিংকে ক্লিক → Dashboard খোলে → পরে sign in করা যায়
- [ ] **ভুল পাসওয়ার্ড:** বাতি ঝিকমিক করে নিভে যায়, কার্ড কাঁপে, লেখা আসে "Email or password is incorrect."
- [ ] **ইমেইল confirm না করে sign in:** "Confirm your email first" আসে → **Resend email** চাপলে নতুন ইমেইল আসে
- [ ] **Forgot password:** ইমেইল আসে → লিংক reset পেজ খোলে → নতুন পাসওয়ার্ড দিয়ে sign in হয়, পুরোনোটা দিয়ে হয় না
- [ ] **Remember me বন্ধ রেখে sign in** → ব্রাউজার পুরো বন্ধ করে আবার খুলুন → আবার sign in চাইবে
      (কিছু ব্রাউজারে "Continue where you left off" চালু থাকলে session থেকে যেতে পারে — সেটা ব্রাউজারের সেটিং)
- [ ] **Sign out অবস্থায়** ঠিকানায় সরাসরি `/dashboard.html` লিখুন → sign in পেজে ফেরত যায়, Dashboard এক ঝলকও দেখা যায় না
- [ ] **একজন আরেকজনের তথ্য দেখতে পারে না** (নিচে "RLS টেস্ট" দেখুন)
- [ ] **দুই ট্যাব:** একই সাইট দুই ট্যাবে খুলুন, একটিতে Sign out → অন্যটিও sign in পেজে চলে যায়
- [ ] **পেজ বদলানোর অ্যানিমেশন:** Chrome/Edge এ বাতি আর কার্ড মসৃণভাবে পরের পেজে যায়; Firefox এ সাধারণ fade হয় (দুটোই ঠিক)
- [ ] **অ্যাপ হিসেবে ইনস্টল:** Chrome/Edge এ **Install app** বোতাম বা ঠিকানার ঘরের ইনস্টল আইকন → আলাদা জানালায় খোলে, ঠিক আইকন দেখায়
- [ ] **শুধু কীবোর্ড:** Tab আর Enter দিয়ে পুরো sign in করা যায়, কোন ঘরে আছেন সবসময় দেখা যায়
- [ ] **কম অ্যানিমেশন:** Windows → Settings → Accessibility → Visual effects → **Animation effects: Off** → সাইটে ঝাঁকুনি/কণা থাকে না, শুধু হালকা fade
- [ ] **Screen reader (ঐচ্ছিক):** Windows এ **Ctrl+Win+Enter** চাপলে Narrator চালু হয় → sign in করলে "Signed in as …" শোনা যায়
- [ ] **মোবাইল/ছোট স্ক্রিন:** Chrome এ **F12** → ফোন আইকন (**Ctrl+Shift+M**) → 360, 390, 768, 1024, 1440 চওড়ায় দেখুন → পাশে স্ক্রল হয় না;
      **Console** ট্যাবে লাল error নেই
- [ ] **Demo mode এখনো কাজ করে:** `js/config.js` এ `AUTH_PROVIDER = 'demo'` করে Live Server এ খুলুন → "Demo mode" ব্যাজ দেখায়, sign in কাজ করে →
      পরীক্ষা শেষে আবার `'auto'` করে দিন (এটা commit করবেন না)

### RLS টেস্ট — User A কি User B এর তথ্য দেখতে পারে?

দুটি আলাদা অ্যাকাউন্ট লাগবে (A আর B)। দুটোই আগে sign up + confirm করে নিন।

1. লাইভ সাইটে **User A** দিয়ে sign in করুন → Dashboard খোলা থাকুক।
2. **F12** → **Console** ট্যাব।
3. নিচের কোডটি পুরো কপি করে পেস্ট করুন → **Enter**।
   (Chrome প্রথমবার পেস্ট আটকাতে পারে — তখন `allow pasting` লিখে Enter চাপুন, তারপর আবার পেস্ট করুন।)

   ```js
   const { SUPABASE_CONFIG: cfg } = await import('./js/config.js');
   const key = [...Object.keys(localStorage), ...Object.keys(sessionStorage)].find((k) => k.endsWith('-auth-token'));
   const session = JSON.parse(localStorage.getItem(key) || sessionStorage.getItem(key));
   const headers = { apikey: cfg.anonKey, Authorization: 'Bearer ' + session.access_token, 'Content-Type': 'application/json', Prefer: 'return=representation' };
   const rows = await (await fetch(cfg.url + '/rest/v1/profiles?select=id,full_name', { headers })).json();
   console.log('Profiles A can read:', rows.length, rows);
   const changed = await (await fetch(cfg.url + '/rest/v1/profiles?id=neq.' + session.user.id, { method: 'PATCH', headers, body: JSON.stringify({ full_name: 'Hacked' }) })).json();
   console.log('Other profiles A changed:', changed.length);
   ```

4. প্রত্যাশিত ফল ✅:
   - `Profiles A can read: 1` — শুধু A এর নিজের সারি
   - `Other profiles A changed: 0` — অন্য কারো নাম বদলানো যায়নি
5. দুই ক্ষেত্রেই সংখ্যা ১ আর ০ হলে RLS ঠিকমতো কাজ করছে। অন্য কিছু দেখলে আর এগোবেন না, আমাকে জানান।
6. চাইলে Supabase → **Table Editor** → `profiles` এ দেখে নিন, B এর নাম "Hacked" হয়নি।

---

## সব শেষ হলে আমাকে যা লিখবেন

```
Setup done.
- Live link: https://....netlify.app
- Supabase: schema.sql Success, RLS enabled, URL Configuration এ লাইভ লিংক যোগ করেছি
- শেষ টেস্ট: ✅ কোনগুলো পাস / ❌ কোনগুলো ফেল (কী দেখলেন)
```

তারপর আমি কোনো সমস্যা থাকলে ঠিক করব, আর Upwork এর জন্য কী দেখাবেন সেটা গুছিয়ে দেব।
