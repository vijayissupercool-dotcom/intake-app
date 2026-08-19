# Intake

Collect files from anyone directly into your Google Drive — no account required for uploaders.

## Overview

- **Requester** (Google Drive owner): signs in, connects Google Drive, creates file-request links with rules (folder, size limits, expiry), and receives files directly into their chosen Drive folder.
- **Uploader** (external person): opens a public link, optionally enters their name/email, and drag-and-drops files. No account or Drive access needed.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, TypeScript, Tailwind v4, shadcn/ui) |
| Auth + DB | Supabase (PostgreSQL, Row Level Security) |
| Temporary storage | Cloudflare R2 (presigned URLs) |
| File delivery | Google Drive API |
| Email | Resend |
| Background transfer | Cloudflare Workers + Cron |
| Observability | Sentry, PostHog |

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env.local` and fill in real values:

```bash
cp .env.example .env.local
```

> `.env` contains placeholder values only to allow offline builds. Never commit real secrets.

### 3. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run the contents of [`supabase/schema.sql`](supabase/schema.sql) to create all tables, RLS policies, triggers, and indexes.
3. In **Authentication → Providers**, enable **Google** and add your Google OAuth client.
4. In **Authentication → URL Configuration**, set the Site URL and add redirect URLs:
   - `http://localhost:3000/api/auth/callback-supabase`
5. Copy the project URL, anon key, and service role key into `.env.local`.

### 4. Google Cloud OAuth

1. Create a project at [Google Cloud Console](https://console.cloud.google.com).
2. Configure the **OAuth consent screen** and add your domain as an authorized domain.
3. Create **OAuth 2.0 Client IDs** (Web application). Add these redirect URIs:
   - `http://localhost:3000/api/auth/callback` (Drive connection)
4. Enable the **Google Drive API**.
5. Add the client ID and secret to `.env.local`.

### 5. Cloudflare R2

1. Create an R2 bucket in Cloudflare.
2. Generate an API token with read/write access to that bucket.
3. Add `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, and `R2_ENDPOINT` to `.env.local`.

### 6. Resend

1. Create an API key at [resend.com](https://resend.com).
2. Add it as `RESEND_API_KEY` and set `EMAIL_FROM`.

### 7. Run the app

```bash
npm run dev
```

## Transfer Worker (optional, for production)

The app can trigger transfers server-side after each upload. For resilience against
process restarts, deploy the Cloudflare Worker in `workers/transfer-worker/`, which
runs every 5 minutes and picks up any `uploaded` files not yet transferred.

```bash
cd workers/transfer-worker
npm install
wrangler deploy
```

Set the worker's `APP_URL` and `TRANSFER_WORKER_SECRET` bindings to match `.env.local`.

## Environment Variables

See [`.env.example`](.env.example) for the full list and descriptions.

## Scripts

```bash
npm run dev              # start dev server
npm run build            # production build
npm run start            # start production server
npm run lint             # run ESLint
npm run typecheck        # TypeScript type check
npm run test             # run all unit + integration tests
npm run test:unit        # unit tests only
npm run test:integration # integration tests only
npm run test:e2e         # Playwright end-to-end tests (requires dev server)
npm run test:e2e:ui      # Playwright with browser UI
```

## Architecture

The core flow:

```
Uploader uploads file
  → POST /api/upload/presign (validates, creates upload record, returns R2 presigned URL)
  → PUT file to R2 directly from the browser
  → POST /api/upload/complete (marks "uploaded", triggers transfer server-side)
  → transfer pipeline downloads from R2, uploads to Google Drive
  → upload marked "completed", R2 object deleted, user notified
```

Auth-protected routes use Supabase SSR session cookies via the middleware (`src/proxy.ts`).