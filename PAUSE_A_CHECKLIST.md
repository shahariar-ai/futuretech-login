# Pause A — Supabase setup checklist

এই কাজগুলো আপনাকে নিজের হাতে Supabase ড্যাশবোর্ডে করতে হবে (আমি আপনার অ্যাকাউন্টে ঢুকতে পারি না)।
একবারে বসে সব শেষ করুন — প্রায় ১৫–২০ মিনিট লাগবে। বোতাম আর মেনুর নাম ইংরেজিতেই দেওয়া হলো, কারণ ড্যাশবোর্ডে সেগুলো ইংরেজিতে থাকে।

> ⚠️ **কখনো চ্যাটে পেস্ট করবেন না:** database password, `service_role` / `secret` key, বা কোনো password।
> শুধু **Project URL** আর **anon / publishable key** শেয়ার করা নিরাপদ — এগুলো পাবলিক হওয়ার জন্যই বানানো।
>
> Google / GitHub login: আপনি **না** বলেছেন, তাই এই চেকলিস্টে সেগুলো নেই।

---

## ধাপ ১ — নতুন প্রজেক্ট তৈরি

1. <https://supabase.com> এ যান → **Sign in** (GitHub দিয়ে সাইন ইন করা সবচেয়ে সহজ)।
2. **New project** এ ক্লিক করুন।
3. Organization বেছে নিন (না থাকলে একটি বানান, Free plan)।
4. **Project name:** `futuretech-login`
5. **Database Password:** **Generate a password** ক্লিক করুন → পাসওয়ার্ডটি কপি করে **অফলাইনে** রাখুন (পাসওয়ার্ড ম্যানেজার বা খাতায়)। চ্যাটে দেবেন না।
6. **Region:** `Southeast Asia (Singapore)` — বাংলাদেশের সবচেয়ে কাছে।
7. **Create new project** ক্লিক করুন → ১–২ মিনিট অপেক্ষা করুন, যতক্ষণ না প্রজেক্ট "Healthy" দেখায়।

## ধাপ ২ — Project URL আর anon key কপি করা

1. বাম পাশের নিচে ⚙️ **Project Settings** এ যান।
2. **Data API** (কিছু অ্যাকাউন্টে **API**) → **Project URL** কপি করুন। দেখতে এমন: `https://abcdefghijkl.supabase.co`
3. **API Keys** → **anon public** key (নতুন ড্যাশবোর্ডে **Publishable key**, শুরু হয় `sb_publishable_…` দিয়ে) কপি করুন।
   - ❌ `service_role` বা `secret` key কপি করবেন **না**।
4. VS Code এ `js/config.js` খুলুন এবং এভাবে বসান (শুধু এই দুটি লাইন বদলাবেন):

   ```js
   export const SUPABASE_CONFIG = {
     url: 'https://abcdefghijkl.supabase.co',
     anonKey: 'eyJhbGciOi…  অথবা  sb_publishable_…',
   };
   ```

   `AUTH_PROVIDER = 'demo'` এখনই বদলাবেন না — Phase 4 এ আমি বদলাব।
   (চাইলে config.js এ না বসিয়ে URL আর anon key চ্যাটে পাঠাতে পারেন, আমি বসিয়ে দেব।)

## ধাপ ৩ — Email login সেটিংস

1. বাম মেনু → **Authentication** → **Sign In / Providers** (পুরোনো ড্যাশবোর্ডে **Providers**)।
2. **Email** খুলুন:
   - **Enable Email provider:** ON
   - **Confirm email:** **ON** রাখুন ✅
   - **Minimum password length:** `8`
   - **Password requirements** থাকলে: `Letters and digits` বেছে নিন।
3. **Save** ক্লিক করুন।

## ধাপ ৪ — Database টেবিল আর নিরাপত্তা (schema.sql চালানো)

1. VS Code এ `supabase/schema.sql` খুলুন → **Ctrl+A** → **Ctrl+C** (পুরোটা কপি)।
2. Supabase এ বাম মেনু → **SQL Editor** → **New query**।
3. পেস্ট করুন (**Ctrl+V**) → নিচে ডানে **Run** (বা **Ctrl+Enter**)।
4. যদি "destructive operation" জাতীয় সতর্কবার্তা আসে → **Run this query** ক্লিক করুন (স্ক্রিপ্টে `drop policy if exists` আছে, তাই এটা আসে; কোনো ডেটা মুছবে না)।
5. প্রত্যাশিত ফল: **"Success. No rows returned"** ✅
6. যাচাই করুন:
   - **Table Editor** → `profiles` টেবিল দেখা যাচ্ছে, এবং পাশে **RLS enabled** লেখা (লাল "RLS disabled" নয়)।
   - **Authentication** → **Policies** → `profiles` এর নিচে দুটি policy:
     "Users can view their own profile" আর "Users can update their own profile"।

## ধাপ ৫ — URL Configuration (লোকাল টেস্টের জন্য)

1. **Authentication** → **URL Configuration**।
2. **Site URL:** `http://127.0.0.1:5500` → **Save**।
3. **Redirect URLs** → **Add URL** দিয়ে একে একে এগুলো যোগ করুন:
   - `http://127.0.0.1:5500/index.html`
   - `http://127.0.0.1:5500/reset-password.html`
   - `http://127.0.0.1:5500/dashboard.html`
   - `http://localhost:5500/**` (যদি Live Server `localhost` ঠিকানায় খোলে)
4. **Save URLs**।

> Live Server অবশ্যই port **5500** এ চলতে হবে (ডিফল্ট)। অন্য port হলে উপরের URL গুলোতেও সেই port দিন।
> Netlify তে অনলাইনে তোলার সময় (Pause B) লাইভ URL গুলো যোগ করা হবে।

## ধাপ ৬ — (ঐচ্ছিক, এখনই দরকার নেই) Email সীমা

Supabase এর বিল্ট-ইন ইমেইল সার্ভিস **ঘণ্টায় মাত্র কয়েকটি** ইমেইল পাঠায়। টেস্টের সময় নিজের আসল ইমেইল ঠিকানা ব্যবহার করুন,
আর পরপর অনেকবার sign up / reset চেষ্টা করবেন না। আসল ব্যবহারকারীদের জন্য পরে (Phase 9) custom SMTP (যেমন Resend) সেট করব।

---

## ✅ শেষ হলে আমাকে যা লিখবেন

```
Pause A done.
- config.js এ URL আর anon key বসিয়েছি   (অথবা: URL = …, anon key = …)
- schema.sql চালিয়েছি: Success. No rows returned
- profiles টেবিলে RLS enabled দেখাচ্ছে
- Confirm email ON, min password 8
- URL Configuration সেট করেছি
```

এরপর আমি Phase 4–8 একটানা করব: আসল sign up / sign in / email confirmation, forgot + reset password, dashboard, page transitions আর PWA।
