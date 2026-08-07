# TOEFL Pilot Batch Registration — Leap Scholar

Single-file landing page built directly on your existing Online BPT template
(same indigo brand, Geist font, animations, header/footer, sticky bottom
strip) with content swapped for the TOEFL Pilot Batch, no slot picker (this
is a batch registration, not a slot booking), and the single payment button
upgraded to three payment tiers.

## Files

```
index.html          Everything — markup, CSS, and JS in one file (matches your BPT template's structure)
apps-script/
  Code.gs            Paste into a Google Sheet's Apps Script editor
README.md            This file
```

## 1. Set up the Google Sheet backend

1. Create a new Google Sheet (or reuse one) — this is where registrations land.
2. **Extensions > Apps Script**. Delete any starter code and paste in
   `apps-script/Code.gs` from this project.
3. **Deploy > New deployment**
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Copy the **Web app URL** (`https://script.google.com/macros/s/.../exec`).
5. A `Registrations` tab is created automatically on first submission, with
   columns: Timestamp, Name, Email, Phone, Source, Page URL.

> Editing `Code.gs` later? Use **Deploy > Manage deployments > Edit (pencil)
> > New version** — saving alone does not update the live URL.

## 2. Point the page at your Apps Script

Open `index.html`, find the `CONFIG` block near the top of the `<script>`
section, and set:

```js
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/XXXXXXXX/exec';
```

That's the only required edit. Everything else (batch date, price, payment
links) is already filled in from your brief.

## 3. Payment links

The three payment tiers are wired into the success modal (shown after a
successful registration):

| Tier | Amount | Link |
|---|---|---|
| Token (hold seat) | ₹3,000 | `https://leapscholar.com/pay/user-payment/msiqohqt-fakw` |
| Partial | ₹12,999 | `https://leapscholar.com/pay/user-payment/msiqqnxb-cu1x` |
| Full | ₹15,999 | `https://leapscholar.com/pay/user-payment/msiqj2l1-89fk` |

Search for `pay-tier-card` in `index.html` if you ever need to update these.

## 4. Push to GitHub

```bash
cd toefl-batch-v2
git init
git add .
git commit -m "TOEFL pilot batch registration site"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

## 5. Deploy on Vercel

1. [vercel.com](https://vercel.com) → sign in with GitHub.
2. **Add New… > Project** → import the repo you just pushed.
3. Framework preset: **Other** (static site, no build step).
4. Leave build/output settings blank → **Deploy**.
5. You'll get a live URL (e.g. `https://toefl-pilot-batch.vercel.app`) —
   attach a custom domain from Settings > Domains if you have one.

## How it works

1. Visitor fills in Name, Phone, Email and submits.
2. Client-side validation runs (same rules as your BPT form: 10-digit phone,
   valid email).
3. The form POSTs to your Apps Script URL, which appends a row to the
   `Registrations` sheet and returns `{status: "success"}`.
4. On success, a modal appears with three payment options (token / partial /
   full), each opening in a new tab.
5. `?src=` query param support is preserved from your BPT template for
   campaign source tracking (e.g. `?src=cl` for a particular counsellor/link).

## Things to double-check before going live

- The Sheet is your source of truth for *who registered* — it does not track
  *who paid*. Reconcile against your payment gateway's dashboard separately.
- Phone validation assumes 10-digit Indian mobile numbers.
- Batch date (31 Aug 2026) and price (₹15,999) are hardcoded in a few places
  in `index.html` — search for them if either changes.
