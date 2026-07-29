# Sched

A personal dashboard PWA: Apple Calendar and Reminders (live via CalDAV), plus local-only Notes,
People, Tasks, Projects, Goals, and a Past Log — with push notifications for anything due.

## Architecture

- **Calendar/Reminders**: never stored anywhere in this app. Every read/write goes straight to
  iCloud over CalDAV (`src/lib/caldav/`), using an Apple ID + app-specific password kept server-side.
- **Everything else** (Notes, People, Tasks, Projects, Goals, Log): stored only in the browser's
  IndexedDB (`src/lib/db/`, via Dexie). No server database, no cross-device sync, no backup.
- **Push notifications**: a thin index (title + due date only — no content) syncs to Upstash Redis
  so a scheduled job (`/api/cron/notify`) can notify you about due tasks/project items, plus it
  queries CalDAV directly for calendar/reminder due items.

## Local development

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in values (see below).
3. `npm run dev`, open http://localhost:3000.

## Environment variables

| Variable | Required for | Notes |
|---|---|---|
| `APP_PASSWORD` | Login gate | Long random string — this is the only thing standing between the internet and your data. |
| `SESSION_SECRET` | Login gate | Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`. |
| `ICLOUD_APPLE_ID` | Calendar/Reminders | Your Apple ID email. |
| `ICLOUD_APP_PASSWORD` | Calendar/Reminders | Generate at [appleid.apple.com](https://appleid.apple.com) → Sign-In and Security → App-Specific Passwords. **Not** your real Apple ID password. |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Push | Generate with `npx web-push generate-vapid-keys`. |
| `VAPID_SUBJECT` | Push | `mailto:you@example.com`. |
| `CRON_SECRET` | Push | Any random string; also set it in Vercel's cron config so `/api/cron/notify` can verify the caller. |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Push | From a Redis integration added via the Vercel Marketplace (Storage → Redis). |

## Deploying

1. Push this repo to GitHub, import it into Vercel.
2. Add all the environment variables above in the Vercel project settings.
3. Add a Redis integration (Vercel Marketplace → Storage) — it auto-injects the `UPSTASH_REDIS_REST_*` vars.
4. `vercel.json` already declares the cron schedule for `/api/cron/notify` (7am and 6pm daily).
   **Vercel's Hobby plan limits cron jobs to once a day per job** — verify your current plan's limits
   and adjust the schedule/job count if needed.
5. On your iPhone, open the deployed URL in Safari, log in, then Share → Add to Home Screen.
   Push notifications only work once it's installed this way (iOS 16.4+) — a plain Safari tab won't
   receive them. Turn notifications on from the Settings page after installing.

## Known limitations

- IndexedDB has no export/backup — clearing Safari's site data or deleting the PWA loses local data.
- Daily/recurring goals don't yet participate in push notifications (only one-off due dates on
  tasks and project items do); the Dashboard still shows them, just without a push reminder.
- The cron job's "today"/"tomorrow" is based on the server's clock (UTC on Vercel), which can be
  off by a day from your local date right around midnight in your timezone.
