# MedLens — Database & Dashboard Setup

You now have an admin dashboard that manages **chapters → sections → lessons** and a public page that renders a chapter's syllabus straight from the database.

## Files

| File | Purpose |
|---|---|
| `db/schema.sql` | Postgres tables, security policies, and a seed of your existing content |
| `config.js` | Where you paste your Supabase URL + key |
| `db.js` | Data layer (auth + CRUD). Falls back to **demo mode** until configured |
| `seed.js` | Sample data used only by demo mode |
| `login.html` | Sign‑in (Supabase email/password) |
| `dashboard.html` + `admin.css` | The admin CMS |
| `chapter.html` | Public chapter page, rendered live from the DB (`chapter.html?slug=cardiology`) |

## Try it right now (no setup)

Open `login.html`. With no credentials yet, the app runs in **demo mode**: press *Enter demo workspace* and you can add/edit/delete chapters, sections, and lessons. Demo changes live in your browser only.

## Connect Supabase (makes it real)

1. **Create a project** at [supabase.com](https://supabase.com) (free tier is fine).
2. **Run the schema.** In the dashboard: **SQL Editor → New query**, paste all of `db/schema.sql`, and **Run**. This creates the tables, Row‑Level Security policies, the `profiles`/admin role, and seeds your Cardiology + Respiratory content. (It's safe to re‑run.)
3. **Add your keys.** Go to **Project Settings → Data API** for the **Project URL**, and **Project Settings → API Keys** for the **publishable key** (the legacy *anon* key also works). Paste both into `config.js`:
   ```js
   export const SUPABASE_URL = "https://YOURPROJECT.supabase.co";
   export const SUPABASE_KEY = "sb_publishable_xxx";   // or the anon key
   ```
   The publishable/anon key is meant to be public — your data is protected by the RLS policies, not by hiding the key. **Never** put the `service_role`/secret key here.
4. **Create your admin user.** Either sign up once through `login.html`, or in Supabase go to **Authentication → Users → Add user** (email + password). Then promote that account to admin in the **SQL Editor**:
   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```
   Until a user is an admin, the dashboard loads read‑only (writes are blocked by RLS — by design).
5. **Sign in** at `login.html`. The badge in the top bar will read **Live · Supabase**.

## How security works

- **Public visitors** (and the public site) can read only **published** chapters and their sections/lessons.
- **Drafts** are invisible to everyone except admins.
- **Writes** (create/update/delete) are limited to users whose `profiles.role = 'admin'`.

This is enforced in the database by RLS, so it holds no matter what calls the API.

## Connecting the public site to the DB

`chapter.html?slug=cardiology` already renders from the database. To make the homepage's chapter cards open the live version, point their links at `chapter.html?slug=<slug>` instead of the static files. The static `cardiology.html` / `respiratory.html` can stay as-is or be retired once the dynamic page covers them.

## What's next (Claude API)

Each lesson has a `content` JSONB column that's currently empty. The lesson editor shows a placeholder for it. The planned step is a "Generate with Claude" action that fills `content` for a lesson (title + lenses become the prompt), which the lesson page then renders. The schema and dashboard are already shaped for it.
