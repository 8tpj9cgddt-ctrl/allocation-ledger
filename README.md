# Allocation Ledger — setup guide

This is your budget splitter as a real, hosted web app: your own URL, syncs
across your devices, works if the Claude artifact ever changes. Total cost: $0.

Do these in order. Takes about 20–30 minutes the first time.

## 1. Create the database (Supabase)

1. Go to supabase.com → sign up (free) → "New project"
2. Pick any name/password/region, wait ~2 min for it to spin up
3. In the left sidebar: **SQL Editor** → **New query**
4. Open `supabase-schema.sql` from this folder, paste the whole thing in, click **Run**
5. Left sidebar: **Project Settings → API**. Copy two values:
   - **Project URL**
   - **anon public** key

## 2. Enable email sign-in

Supabase has email magic-link sign-in on by default — nothing to do here.
(Optional: Authentication → Providers, if you later want Google sign-in too.)

## 3. Set up the code locally

You'll need [Node.js](https://nodejs.org) installed (just click the installer, defaults are fine).

1. Unzip this project folder somewhere
2. Open a terminal in that folder
3. Copy `.env.example` to a new file named `.env`, and paste in your Supabase
   Project URL and anon key from step 1
4. Run:
   ```
   npm install
   npm run dev
   ```
5. Open the link it gives you (usually `http://localhost:5173`) — you should
   see the login screen. Test signing in with your email before moving on.

## 4. Put the code on GitHub

1. Create a free account at github.com if you don't have one
2. Create a new repository (any name, e.g. `allocation-ledger`)
3. Follow GitHub's instructions to push this folder to it (or use GitHub
   Desktop if you'd rather click than type commands)

## 5. Deploy (Vercel)

1. Go to vercel.com → sign up with your GitHub account
2. **Add New → Project** → pick your `allocation-ledger` repo → **Import**
3. Before deploying, add your environment variables (same ones from `.env`):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Click **Deploy**. In ~1 minute you'll get a live URL like
   `allocation-ledger.vercel.app`

## 6. Install it like an app

Open your new URL on your phone → browser share menu → **Add to Home Screen**.
Now it's a real icon, opens full-screen, and your data syncs to any device
you sign into.

---

### If something breaks
- Blank screen → open browser dev tools console, the error usually names
  the missing env var
- Can't sign in → check Supabase → Authentication → Users to see if your
  account got created; check spam folder for the magic link
- Data not saving → Supabase → Table Editor, check `categories` and
  `entries` tables directly to see what's landing there
