# INTAKE — Production Setup, Deployment & QA Plan

**Project:** Intake  
**Purpose:** Turn the current Intake codebase into a secure, reliable, publicly accessible product with GitHub-based development, Vercel deployment, Google Drive integration, Cloudflare R2 uploads, background transfer, observability, and automated testing.

**Source of truth:** This document + `prd.md` + `architecture.md` + `rules.md` + `phases.md` + `design.md` + `memory.md`.

**Execution mode:** AI/no-code assisted, but production engineering standards are mandatory.

---

# 0. CRITICAL DEPLOYMENT DECISION

## Vercel Hobby is NOT the final commercial production plan

As of August 2026, Vercel's Hobby plan is restricted to personal/non-commercial use. Vercel's current Terms and Fair Use documentation explicitly state that commercial usage requires Pro or Enterprise.

Therefore:

```text
Hobby
  ↓
Personal development
Private testing
Non-commercial demo
Proof of concept

Pro
  ↓
Public commercial SaaS
Paid customers
Business operation
```

Do **not** launch a revenue-generating commercial Intake service on Vercel Hobby.

The application can still be engineered so that the initial infrastructure is inexpensive and can run on Hobby for non-commercial validation, then move to Pro without an architectural rewrite.

Current Vercel documentation also lists substantial Hobby function capacity, but plan limits and commercial-use restrictions must be treated separately. Verify current Vercel limits before every production launch.

---

# 1. CURRENT CODEBASE AUDIT

The uploaded project already contains:

```text
Next.js 16
React 19
TypeScript
Tailwind
shadcn/ui
Supabase
Google Drive API
Cloudflare R2
Resend
Sentry
PostHog
Cloudflare Worker
```

Current application areas include:

```text
src/app/
src/components/
src/lib/
supabase/
workers/transfer-worker/
```

Current routes include:

```text
/auth/callback
/requests
/requests/[id]
/requests/new
/r/[token]

/api/requests
/api/requests/[id]
/api/public/request/[token]
/api/upload/presign
/api/upload/complete
/api/drive/folders
/api/auth/callback
/api/notifications
/api/transfer
```

The project currently has **no automated test suite**.

That is a launch blocker.

---

# 2. CURRENT CRITICAL FINDINGS

The current implementation must NOT be treated as production-ready merely because it builds.

The following areas require explicit engineering verification/fixes.

## 2.1 Transfer architecture is currently incomplete

The current Cloudflare Worker calls:

```text
POST /api/transfer
```

but the current transfer API expects:

```text
uploadId
```

The Worker currently does not provide a specific upload ID.

Therefore the background transfer system is not a complete reliable queue/dispatcher yet.

### Required fix

Change the transfer architecture to:

```text
Upload completes
      ↓
Upload status = uploaded
      ↓
Transfer job becomes queued
      ↓
Cloudflare Worker / scheduled dispatcher
      ↓
Fetch bounded batch of queued uploads
      ↓
Claim jobs atomically
      ↓
Process
      ↓
Retry failures
      ↓
Dead-letter permanent failures
```

The worker must process a batch rather than pretending a single upload ID exists.

---

# 3. SECOND CRITICAL ISSUE — SYNCHRONOUS TRANSFER

The current `/api/upload/complete` route calls the Drive transfer directly.

Current conceptual flow:

```text
Browser
  ↓
R2 upload
  ↓
/api/upload/complete
  ↓
Google Drive transfer
  ↓
HTTP response
```

This is not the final production architecture.

Required:

```text
Browser
  ↓
R2 upload
  ↓
/api/upload/complete
  ↓
status = uploaded
  ↓
enqueue/dispatch
  ↓
return quickly
```

Then:

```text
Background worker
  ↓
R2
  ↓
Google Drive
```

The uploader should not wait for Google Drive transfer.

---

# 4. THIRD CRITICAL ISSUE — WHOLE FILE BUFFERING

The current transfer worker uses a function equivalent to:

```text
downloadFileBuffer(...)
```

and then uploads a complete `Buffer` to Google Drive.

This is not acceptable as the long-term large-file architecture.

Required:

```text
R2 object stream
      ↓
bounded streaming / resumable transfer
      ↓
Google Drive
```

Do not unnecessarily hold large uploaded files entirely in Vercel function memory.

Initial MVP file limits may remain conservative, but the architecture must not fundamentally depend on:

```text
entire file = memory buffer
```

---

# 5. FOURTH CRITICAL ISSUE — REQUEST TOKEN SECURITY

The current database stores request tokens directly.

For production:

```text
raw public token
```

should not be exposed through database queries or logs.

Preferred model:

```text
public random token
      ↓
hash
      ↓
database lookup
```

The raw token is only presented in the URL.

Never:

```text
log raw token
send raw token to analytics
store raw token unnecessarily
expose raw token through admin APIs
```

---

# 6. FIFTH CRITICAL ISSUE — PUBLIC API ABUSE

The public endpoints currently allow anonymous operations.

They require:

```text
rate limiting
request limits
file limits
IP/session abuse controls
request expiry
quota enforcement
```

At minimum protect:

```text
GET /api/public/request/[token]

POST /api/upload/presign

POST /api/upload/complete
```

The goal is:

```text
one legitimate user
≠
unlimited anonymous infrastructure
```

---

# 7. SIXTH CRITICAL ISSUE — RACE CONDITIONS

The current design checks:

```text
upload_count >= max_files
```

before creating an upload.

Two simultaneous requests can both pass this check.

Production implementation must use atomic server-side enforcement.

Similarly:

```text
upload_count
request status
transfer state
```

must not rely on client-side assumptions.

---

# 8. SEVENTH CRITICAL ISSUE — IDEMPOTENCY

The transfer system must tolerate:

```text
duplicate worker execution
network retry
browser retry
Vercel retry
Cloudflare retry
manual retry
```

without creating duplicate Google Drive files.

Required invariant:

```text
one logical uploaded file
→ at most one successful Drive delivery
```

Persist:

```text
drive_file_id
transfer_attempts
transfer_started_at
transfer_completed_at
last_error
idempotency_key
```

where appropriate.

---

# 9. EIGHTH CRITICAL ISSUE — RLS REVIEW

The current Supabase schema has RLS enabled, which is good.

However, every policy must be re-reviewed before launch.

Particularly:

```text
requests
uploads
google_connections
notifications
```

Never depend solely on frontend filtering.

Every authenticated database operation must enforce tenant ownership.

Public request access should be intentionally handled by secure server-side endpoints rather than broad database exposure.

---

# 10. NINTH CRITICAL ISSUE — GOOGLE TOKENS

Google OAuth tokens are highly sensitive.

Required:

```text
never send tokens to browser
never log tokens
never expose tokens in errors
never commit tokens
never store them in client-side storage
```

Prefer encrypted-at-rest storage for refresh tokens if the chosen database/storage architecture supports it.

At minimum:

```text
server-only
RLS protected
service/secret access only
```

Google reauthorization and revoked-token behavior must be tested.

---

# 11. TENTH CRITICAL ISSUE — EMAIL IS NON-CRITICAL

Email must never determine whether a file transfer succeeds.

Correct:

```text
Drive transfer
    ↓
SUCCESS

then

email notification
```

If email fails:

```text
file remains successfully delivered
notification status = failed
retry email separately
```

Never:

```text
Drive success + email failure
→ entire upload = failed
```

---

# 12. TARGET PRODUCTION ARCHITECTURE

Use:

```text
                       ┌───────────────────┐
                       │     GitHub        │
                       │ Source + PRs      │
                       └─────────┬─────────┘
                                 │
                                 ▼
                       ┌───────────────────┐
                       │      Vercel      │
                       │     Next.js      │
                       └───────┬───────────┘
                               │
               ┌───────────────┼────────────────┐
               │               │                │
               ▼               ▼                ▼
        ┌────────────┐  ┌─────────────┐  ┌─────────────┐
        │ Supabase   │  │ Google      │  │ Resend      │
        │ Auth + DB  │  │ Drive API   │  │ Email       │
        └────────────┘  └─────────────┘  └─────────────┘
               │
               │
               ▼
        ┌────────────┐
        │ Cloudflare │
        │     R2     │
        └──────┬─────┘
               │
               ▼
        ┌────────────┐
        │ Cloudflare │
        │   Worker   │
        │ Scheduler  │
        └──────┬─────┘
               │
               ▼
        ┌────────────┐
        │ Transfer   │
        │ Pipeline   │
        └──────┬─────┘
               │
               ▼
        ┌────────────┐
        │ Google     │
        │ Drive      │
        └────────────┘
```

---

# 13. RESPONSIBILITY OF EACH SERVICE

## Vercel

Responsible for:

```text
web application
server-rendered pages
API routes
authentication callbacks
request management
dashboard
public upload UI
```

Not responsible for:

```text
large-file storage
long-running file transfer
persistent background queue
```

---

## Supabase

Responsible for:

```text
authentication
PostgreSQL
RLS
request metadata
upload metadata
transfer state
notifications
audit data
```

---

## Cloudflare R2

Responsible for:

```text
temporary uploaded objects
```

Not:

```text
final customer storage
```

Google Drive remains the final destination.

---

## Cloudflare Worker

Responsible for:

```text
background transfer dispatch
retry scheduling
processing pending transfer jobs
cleanup
```

---

## Google Drive

Responsible for:

```text
final customer-owned file storage
```

---

## Resend

Responsible for:

```text
email notifications
```

---

## Sentry

Responsible for:

```text
runtime errors
exceptions
performance problems
```

---

## PostHog

Responsible for:

```text
product analytics
activation
workflow funnel
retention
```

Do not send:

```text
file contents
OAuth tokens
public request tokens
sensitive document metadata
```

---

# 14. GIT + GITHUB SETUP

## Repository

Create:

```text
intake
```

Prefer a private GitHub repository during development.

Suggested:

```text
github.com/<account>/intake
```

---

# 15. Git Branch Strategy

Use:

```text
main
develop
feature/*
fix/*
chore/*
```

For a solo founder, the minimal workflow can be:

```text
main
feature/*
```

Production branch:

```text
main
```

---

# 16. Git Rules

Never commit:

```text
.env
.env.local
.env.production
.dev.vars
Google client secrets
Supabase service keys
R2 secret keys
Resend API keys
Sentry auth tokens
worker secrets
```

The existing `.gitignore` already ignores `.env*`, but verify every sensitive file before the first push.

---

# 17. BEFORE FIRST GITHUB PUSH

Run:

```bash
git status
git diff
git ls-files
```

Search for secrets:

```bash
grep -R "AIza" . --exclude-dir=node_modules --exclude-dir=.git
grep -R "sk_" . --exclude-dir=node_modules --exclude-dir=.git
grep -R "service_role" . --exclude-dir=node_modules --exclude-dir=.git
grep -R "SECRET" . --exclude-dir=node_modules --exclude-dir=.git
```

Do not blindly trust these patterns; inspect suspicious files manually.

---

# 18. GitHub README

README must contain:

```text
product overview
architecture
local setup
environment variables
database setup
Google OAuth setup
R2 setup
worker setup
testing
deployment
production checklist
```

Never put secrets in README.

---

# 19. COMMIT CONVENTION

Use:

```text
feat:
fix:
refactor:
test:
docs:
chore:
security:
```

Examples:

```text
feat: add request creation flow
fix: prevent duplicate transfer jobs
test: add public upload integration tests
security: harden public upload rate limits
```

---

# 20. VERCEL PROJECT SETUP

Connect GitHub repository directly to Vercel.

Vercel's Git integration supports automatic deployments and preview deployments for Git branches and pull requests.

Recommended workflow:

```text
feature branch
    ↓
GitHub push
    ↓
Vercel preview
    ↓
tests
    ↓
manual QA
    ↓
PR
    ↓
merge main
    ↓
Vercel production
```

---

# 21. VERCEL PROJECT SETTINGS

Framework:

```text
Next.js
```

Root directory:

```text
/
```

Build command:

```bash
npm run build
```

Install command:

```bash
npm ci
```

Production branch:

```text
main
```

---

# 22. VERCEL ENVIRONMENT STRATEGY

Separate:

```text
Development
Preview
Production
```

Environment variables must be configured independently.

Never use production credentials in Preview.

---

# 23. ENVIRONMENT VARIABLES

Required server-side:

```text
NEXT_PUBLIC_APP_URL

NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

GOOGLE_DRIVE_CLIENT_ID
GOOGLE_DRIVE_CLIENT_SECRET

R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
R2_ENDPOINT

RESEND_API_KEY
EMAIL_FROM

SENTRY_DSN
SENTRY_AUTH_TOKEN

NEXT_PUBLIC_POSTHOG_KEY
NEXT_PUBLIC_POSTHOG_HOST

TRANSFER_WORKER_SECRET
```

Prefer modern Supabase publishable/secret keys for new setups where supported, while keeping the existing legacy names only if the codebase still requires them.

Never expose:

```text
SUPABASE_SERVICE_ROLE_KEY
GOOGLE_DRIVE_CLIENT_SECRET
R2_SECRET_ACCESS_KEY
RESEND_API_KEY
SENTRY_AUTH_TOKEN
TRANSFER_WORKER_SECRET
```

to browser code.

---

# 24. ENVIRONMENT VALIDATION

`src/lib/config/env.ts` must:

```text
validate required variables
fail clearly on server startup/build where appropriate
never print secret values
```

Do not silently substitute fake production values.

---

# 25. LOCAL ENV FILES

Create:

```text
.env.local
```

from:

```text
.env.example
```

Keep:

```text
.env.example
```

updated with names and safe placeholders only.

---

# 26. SUPABASE PRODUCTION SETUP

Create a dedicated Supabase project.

Do not use a development database as production.

Configure:

```text
Authentication
Google provider
redirect URLs
site URL
database
RLS
indexes
functions
triggers
```

---

# 27. DATABASE MIGRATIONS

Do not rely on manually rerunning one giant `schema.sql` forever.

Move toward:

```text
supabase/migrations/
```

Example:

```text
001_initial_schema.sql
002_request_security.sql
003_transfer_jobs.sql
004_rate_limits.sql
005_audit_events.sql
```

Every production database change must be reproducible.

---

# 28. DATABASE PRODUCTION SCHEMA REQUIREMENTS

Before launch, add/verify:

```text
transfer_jobs
audit_events
request_items
request state
upload state
retry counters
idempotency
timestamps
```

Recommended transfer fields:

```text
id
upload_id
status
attempts
available_at
started_at
completed_at
last_error
idempotency_key
created_at
updated_at
```

---

# 29. DATABASE INDEXES

Verify indexes for:

```text
requests.user_id
requests.token_hash
requests.active
uploads.request_id
uploads.status
uploads.created_at
transfer_jobs.status
transfer_jobs.available_at
transfer_jobs.upload_id
notifications.user_id
```

Do not add indexes blindly; validate query plans as usage grows.

---

# 30. RLS ACCEPTANCE TESTS

Create automated tests proving:

```text
User A cannot read User B requests.
User A cannot modify User B requests.
User A cannot read User B uploads.
User A cannot read User B Google connections.
User A cannot read User B notifications.
```

Also test:

```text
unauthenticated user
```

against every exposed table.

---

# 31. GOOGLE CLOUD PRODUCTION SETUP

Create a dedicated Google Cloud project for Intake.

Enable:

```text
Google Drive API
```

Configure OAuth consent screen.

Configure:

```text
app name
logo
support email
developer contact
authorized domains
privacy policy URL
terms URL
redirect URIs
```

---

# 32. GOOGLE OAUTH ENVIRONMENTS

Development:

```text
http://localhost:3000
```

Production:

```text
https://<production-domain>
```

Never mix production and localhost redirect URLs incorrectly.

---

# 33. GOOGLE OAUTH CALLBACKS

Current architecture has a dedicated Drive callback.

Verify:

```text
/api/auth/callback
```

and Supabase authentication callback:

```text
/api/auth/callback-supabase
```

These are separate flows and must not be confused.

---

# 34. GOOGLE OAUTH TEST MATRIX

Test:

```text
first connection
existing connection
token refresh
expired token
revoked token
wrong Google account
disconnect
reconnect
Drive API disabled
folder deleted
folder permission removed
```

---

# 35. GOOGLE SCOPE MINIMIZATION

Request the minimum Google scopes actually required.

Do not request:

```text
full Drive access
```

unless technically unavoidable.

Before production, verify current Google OAuth/Drive policies and whether the selected scopes require verification or additional review.

---

# 36. R2 PRODUCTION SETUP

Create separate buckets:

```text
intake-dev
intake-preview
intake-prod
```

If using only one account, use strict naming and access separation.

---

# 37. R2 CORS

Because the browser uploads directly to R2 using presigned URLs, configure R2 CORS.

Production origin:

```text
https://<production-domain>
```

Development origin:

```text
http://localhost:3000
```

Allowed method:

```text
PUT
```

Potentially:

```text
HEAD
```

only if required.

Allowed headers should match the headers signed/sent by the application, especially:

```text
Content-Type
```

Do not use:

```text
AllowedOrigins: ["*"]
```

for the production upload bucket unless there is a deliberate security reason.

---

# 38. R2 PRESIGNED URL RULES

Presigned URLs are bearer credentials.

Therefore:

```text
short expiry
one object key
specific content type
no public bucket
```

The current application uses a one-hour expiry.

Re-evaluate this.

For normal upload flows, use the shortest practical lifetime.

---

# 39. R2 OBJECT KEY

Use non-guessable object paths.

Example:

```text
uploads/<request-id>/<upload-id>/<random-name>
```

Do not use:

```text
uploads/<request-id>/<original-filename>
```

as the only uniqueness mechanism.

---

# 40. R2 UPLOAD VERIFICATION

After browser upload:

```text
HEAD object
↓
verify exists
↓
verify expected size
↓
verify content type where applicable
↓
mark uploaded
```

Never trust only the browser saying:

```text
upload completed
```

---

# 41. R2 CLEANUP

Successful:

```text
Drive verified
→ delete R2 object
```

Failed:

```text
retain temporarily
→ retry
```

Abandoned:

```text
lifecycle cleanup
```

Incomplete multipart uploads:

```text
automatic lifecycle cleanup
```

Configure lifecycle rules appropriate to the product.

---

# 42. TRANSFER WORKER REDESIGN

Current worker design must be corrected.

Target:

```text
Cloudflare Cron
    ↓
Worker
    ↓
POST authenticated internal endpoint
    ↓
fetch N pending jobs
    ↓
claim jobs
    ↓
process
    ↓
release / retry
```

The Worker must not simply call `/api/transfer` without identifying what it is asking the application to do.

---

# 43. INTERNAL TRANSFER ENDPOINT

Create a dedicated internal endpoint.

Example conceptual:

```text
POST /api/internal/transfers/process
```

Authentication:

```text
Bearer TRANSFER_WORKER_SECRET
```

The endpoint must reject:

```text
missing secret
wrong secret
browser requests
public access
```

---

# 44. TRANSFER BATCHING

Process a bounded batch.

Example:

```text
10 jobs per invocation
```

Exact number should be measured.

Never attempt:

```text
all pending uploads
```

in one function invocation.

---

# 45. JOB CLAIMING

Job claiming must be atomic.

Avoid:

```text
SELECT pending
then
UPDATE pending
```

because two workers can select the same job.

Prefer:

```text
atomic claim
```

using:

```text
transaction
FOR UPDATE SKIP LOCKED
```

or equivalent safe mechanism.

---

# 46. TRANSFER RETRIES

Suggested model:

```text
attempt 1
↓
1 min
↓
attempt 2
↓
5 min
↓
attempt 3
↓
15 min
↓
attempt 4
↓
1 hour
↓
dead letter
```

Exact values can change.

Use:

```text
exponential backoff
+
jitter
```

---

# 47. ERROR CLASSIFICATION

Retryable:

```text
429
500
502
503
504
network timeout
temporary R2 failure
temporary Google failure
```

Potentially non-retryable:

```text
invalid request
missing Drive folder
permission permanently removed
malformed file
unsupported configuration
revoked authorization requiring user action
```

The exact classification must be implemented per provider response.

---

# 48. DEAD-LETTER STATE

A permanently failed job should become:

```text
DEAD_LETTER
```

or equivalent.

Store:

```text
last error
attempt count
timestamp
reason
```

The requester should see:

```text
Needs attention
```

not a technical stack trace.

---

# 49. GOOGLE DRIVE TRANSFER

For each transfer:

```text
load job
↓
load request
↓
load user connection
↓
refresh token if required
↓
verify destination
↓
stream/resumable upload
↓
verify Drive file
↓
persist Drive ID
↓
cleanup R2
↓
notify
```

---

# 50. GOOGLE DRIVE IDEMPOTENCY

Before creating a new Drive file:

```text
check whether the upload already has drive_file_id
```

If yes:

```text
mark success / reconcile
```

Do not create a second file.

For stronger recovery, persist a transfer idempotency key.

---

# 51. TOKEN REFRESH CONCURRENCY

Multiple jobs for the same user may discover an expired access token simultaneously.

Prevent a token-refresh race.

Possible strategy:

```text
refresh
→ update shared connection
→ reuse refreshed token
```

Use a short-lived lock or transactional strategy where necessary.

---

# 52. PUBLIC REQUEST SECURITY

Public route:

```text
/r/[token]
```

must only expose:

```text
request title
description
requested items
allowed file rules
expiry state
safe branding
```

Never expose:

```text
requester email
Google email
Drive folder ID
Drive folder name if sensitive
internal user ID
database IDs
tokens
```

unless deliberately designed.

---

# 53. PUBLIC TOKEN ENUMERATION

Invalid tokens should produce the same generic response.

Do not reveal:

```text
token exists
token was valid
token belonged to another account
token expired
```

unless that information is intentionally safe to disclose.

---

# 54. UPLOAD API SECURITY

For every upload initialization:

```text
validate request token/request ID relationship
validate request active
validate expiry
validate file size
validate file type
validate remaining quota
rate-limit caller
create upload record
generate scoped presigned URL
```

The client must never be able to choose:

```text
arbitrary R2 key
arbitrary request ID without server validation
arbitrary destination
```

---

# 55. UPLOAD COMPLETION SECURITY

`uploadId` alone must not be sufficient to mutate arbitrary records.

The server must verify:

```text
upload exists
upload belongs to active request
upload has expected state
R2 object exists
object metadata is consistent
request is still accepting uploads
```

---

# 56. FILE TYPE SECURITY

Do not trust only:

```text
file extension
MIME type from browser
```

For high-risk file types, consider content inspection.

At minimum:

```text
size validation
extension validation
MIME validation
```

For public production with sensitive customers:

```text
malware scanning
```

must be evaluated before broad launch.

---

# 57. RATE LIMITING

Implement rate limits at:

```text
request lookup
upload initialization
upload completion
```

Possible dimensions:

```text
IP
request token
upload session
account
```

Do not rely only on IP because multiple legitimate users may share an IP.

---

# 58. REQUEST LIMITS

MVP defaults should be conservative.

Examples:

```text
max files/request
max file size
max total submission size
max submissions/request
max active requests/account
```

These should be server-enforced.

---

# 59. PUBLIC UPLOAD UX

The uploader must not need:

```text
Google account
Intake account
Drive access
installation
```

Flow:

```text
Open link
↓
Understand request
↓
Choose files
↓
Upload
↓
Wait for confirmation
↓
Done
```

---

# 60. UPLOADER CLOSE/REFRESH BEHAVIOR

If the user refreshes:

```text
already completed uploads
```

must not duplicate.

If a network interruption occurs:

```text
show retry/resume
```

Do not silently lose progress.

---

# 61. DASHBOARD ACCEPTANCE

Requester must be able to:

```text
sign in
connect Drive
choose folder
create request
copy link
open request
see received files
see missing files
pause
resume
close
```

---

# 62. REQUEST CHECKLIST

Current product direction requires structured requested items.

Example:

```text
Website redesign

Required:
□ Logo
□ Brand guidelines

Optional:
□ Product images
```

The database and UI should support this as a first-class entity.

Do not fake checklist behavior only in frontend state.

---

# 63. REQUEST STATUS

Implement:

```text
DRAFT
ACTIVE
PAUSED
EXPIRED
CLOSED
```

State transitions must be server-validated.

---

# 64. UPLOAD STATUS

Use explicit states:

```text
PENDING
UPLOADING
UPLOADED
QUEUED
TRANSFERRING
COMPLETED
FAILED
DEAD_LETTER
```

Do not collapse all failures into:

```text
failed
```

if recovery behavior differs.

---

# 65. NOTIFICATIONS

Notification pipeline:

```text
file completed
↓
database notification
↓
email job
```

Email failure must not reverse file success.

Add email idempotency.

---

# 66. OBSERVABILITY

## Sentry

Track:

```text
server errors
client errors
worker errors
Google API failures
R2 failures
database failures
```

Do not include:

```text
OAuth tokens
refresh tokens
public request tokens
file contents
```

in error payloads.

---

# 67. STRUCTURED LOGGING

Every important backend operation should include:

```text
request_id
upload_id
transfer_job_id
user_id where safe
operation
status
duration
error code
```

Never include:

```text
access_token
refresh_token
R2 secret
service role key
raw public token
```

---

# 68. HEALTH ENDPOINT

Add:

```text
/api/health
```

It should verify application-level availability without exposing secrets.

Example:

```text
status: ok
version: <commit>
environment: production
```

Do not expose internal credentials or database details.

---

# 69. WORKER HEALTH

Worker should have a safe authenticated/manual endpoint or observable scheduled logs.

Verify:

```text
worker deployed
cron active
worker can reach Vercel
secret matches
batch processing works
```

---

# 70. POSTHOG EVENTS

Track:

```text
signup_completed
drive_connected
request_created
request_link_copied
public_request_viewed
upload_started
upload_completed
drive_transfer_completed
request_completed
```

Never track:

```text
filename if sensitive
file contents
OAuth tokens
request tokens
private Drive metadata
```

---

# 71. TESTING STACK

Add:

```text
Vitest
React Testing Library
Playwright
```

Optional later:

```text
MSW
```

for API mocking.

---

# 72. PACKAGE SCRIPTS

Target:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "npm run lint && npm run typecheck && npm run test && npm run build && npm run test:e2e"
  }
}
```

Exact commands can be adapted to the chosen tooling.

---

# 73. UNIT TESTS

Test:

```text
validators
file-size validation
MIME validation
request state transitions
expiry calculations
token generation
token hashing
filename sanitization
R2 key generation
retry classification
backoff calculation
Drive error classification
notification formatting
```

---

# 74. API TESTS

Test:

```text
request creation
request update
request deletion
public request lookup
upload presign
upload complete
Drive folder listing
notifications
internal transfer endpoint
```

For every API:

```text
valid
invalid
unauthenticated
unauthorized
expired
malformed
rate limited
```

---

# 75. SECURITY TESTS

Mandatory:

```text
User A cannot access User B request.
User A cannot modify User B request.
User A cannot access User B uploads.
User A cannot access Google tokens.
Public user cannot access dashboard.
Public user cannot access arbitrary upload IDs.
Public user cannot choose arbitrary R2 key.
Public user cannot change Drive destination.
```

---

# 76. RLS TESTS

Test directly against Supabase/Postgres.

Do not only test through UI.

Required:

```text
anon
authenticated User A
authenticated User B
service/secret backend
```

---

# 77. UPLOAD TEST MATRIX

Test:

```text
0-byte file
1-byte file
small file
max-size file
over-limit file
wrong MIME
wrong extension
Unicode filename
very long filename
duplicate filename
many files
concurrent uploads
```

---

# 78. FILE TRANSFER TEST MATRIX

Test:

```text
normal file
large file
Google 401
Google 403
Google 404
Google 429
Google 500
network timeout
R2 missing object
Drive folder deleted
Drive permission revoked
expired OAuth
duplicate worker execution
worker restart
```

Expected behavior must be documented for every case.

---

# 79. END-TO-END HAPPY PATH

This is the mandatory golden test:

```text
1. Open production app.
2. Sign in with Google.
3. Connect Drive.
4. Choose destination folder.
5. Create "Website Redesign" request.
6. Add:
   - Logo
   - Brand Guidelines
   - Product Images
7. Create request.
8. Copy public link.
9. Open link in private/incognito browser.
10. Upload real test files.
11. Observe progress.
12. Close uploader.
13. Wait for background processing.
14. Verify files appear in correct Drive folder.
15. Verify dashboard shows completion.
16. Verify notification.
17. Verify temporary R2 objects are cleaned.
```

This test must pass repeatedly.

---

# 80. FAILURE E2E TEST

Simulate:

```text
Google authorization revoked
```

Expected:

```text
upload remains safe
transfer becomes attention-required
requester is informed
reconnect action available
```

---

# 81. DUPLICATE E2E TEST

Run completion/transfer twice.

Expected:

```text
one logical upload
one Drive file
```

not:

```text
two Drive files
```

---

# 82. CONCURRENT E2E TEST

Upload multiple files simultaneously.

Expected:

```text
all files accepted within limits
all jobs created
all transfers complete
no duplicate files
no counter corruption
```

---

# 83. REQUEST EXPIRATION TEST

Create request:

```text
expires immediately
```

Then attempt upload.

Expected:

```text
HTTP 410 or equivalent
friendly expired page
no R2 upload
```

---

# 84. REQUEST CLOSURE TEST

Close request.

Then attempt:

```text
public link
presign
upload complete
```

All must fail safely.

---

# 85. DRIVE FOLDER DELETION TEST

Create request.

Delete destination folder externally.

Upload file.

Expected:

```text
file remains recoverable temporarily
transfer marked failed/attention
requester sees clear action
no silent loss
```

---

# 86. BROWSER MATRIX

Test:

```text
Chrome desktop
Safari desktop
Firefox desktop
Edge desktop

iOS Safari
Android Chrome
```

Prioritize:

```text
public uploader
```

because it is the most important cross-device surface.

---

# 87. MOBILE TESTS

Test:

```text
camera/photo picker
file picker
multiple selection
large upload
screen lock
backgrounding
network switch
refresh
back button
```

---

# 88. NETWORK TESTS

Simulate:

```text
slow connection
temporary disconnect
high latency
connection restoration
```

Expected:

```text
clear progress
retry
resume where possible
no silent failure
```

---

# 89. ACCESSIBILITY TESTING

Use:

```text
keyboard-only
screen reader
focus navigation
color contrast
reduced motion
```

Verify:

```text
buttons labeled
inputs labeled
errors announced
upload progress announced
status not color-only
```

---

# 90. PERFORMANCE TESTING

Measure:

```text
landing page
public request page
dashboard
request builder
API response latency
upload initialization
database queries
worker processing
```

Use:

```text
Lighthouse
Web Vitals
Sentry performance
browser network tools
```

---

# 91. PERFORMANCE TARGETS

Initial targets:

```text
Public request page:
fast first render

Dashboard:
<2 seconds perceived load under normal conditions

API:
low hundreds of milliseconds for ordinary metadata operations

Upload initialization:
near-instant relative to network conditions

File transfer:
optimized for throughput and reliability
```

Do not use arbitrary performance targets to hide reliability problems.

---

# 92. DATABASE PERFORMANCE

Review queries for:

```text
N+1 queries
unindexed filters
large SELECT *
```

Do not use:

```text
select("*")
```

for production endpoints when only a few fields are required.

Especially avoid returning:

```text
tokens
secrets
internal metadata
```

unnecessarily.

---

# 93. ERROR UX

Never expose:

```text
stack traces
SQL errors
Google API raw errors
R2 signatures
environment variables
```

to end users.

Use:

```text
human message
retry
next action
support reference
```

---

# 94. SUPPORT REFERENCE

For important failures, create a safe reference:

```text
Error reference: IN-7K4M2
```

The reference can be used to find the event in Sentry/logs.

Never put secrets in the reference.

---

# 95. SECURITY HEADERS

Configure appropriate:

```text
Content-Security-Policy
Strict-Transport-Security
X-Content-Type-Options
Referrer-Policy
frame-ancestors / X-Frame-Options
Permissions-Policy
```

Do not break:

```text
Google OAuth
R2 uploads
PostHog
Sentry
```

without deliberately allowing required origins.

---

# 96. CSRF / ORIGIN PROTECTION

For authenticated mutation endpoints:

```text
validate session
validate request origin where appropriate
use SameSite secure cookies
```

Do not assume bearer/public APIs are automatically protected from every abuse case.

---

# 97. CORS

Application API should not use:

```text
Access-Control-Allow-Origin: *
```

unless explicitly required.

R2 CORS must be separately configured for browser direct uploads.

---

# 98. CONTENT SECURITY POLICY

Start restrictive.

Explicitly allow only required:

```text
self
Supabase
Google OAuth
R2
PostHog
Sentry
```

exact origins must be determined from actual network behavior.

---

# 99. DOMAIN SETUP

Recommended:

```text
intake.<domain>
```

or:

```text
useintake.<domain>
```

The exact domain should be selected after availability/trademark review.

Production URLs:

```text
https://<domain>
https://<domain>/r/<token>
```

---

# 100. DOMAIN RULE

The public uploader must never use:

```text
vercel.app
```

as the permanent customer-facing URL if a real product domain is available.

Vercel domain can remain as fallback.

---

# 101. SSL

Production must use:

```text
HTTPS only
```

Verify:

```text
http → https redirect
```

where applicable.

---

# 102. LEGAL PAGES

Before real public use:

```text
/privacy
/terms
```

Potential:

```text
/security
/subprocessors
```

depending on product maturity.

Do not make unsupported security/legal claims.

---

# 103. PRIVACY POLICY MUST COVER

At minimum:

```text
account data
Google account connection
Drive metadata
uploaded files
temporary storage
email
analytics
error monitoring
retention
deletion
third-party providers
```

---

# 104. DATA RETENTION POLICY

Define:

```text
temporary R2 file lifetime
failed upload lifetime
request metadata retention
account deletion behavior
logs retention
analytics retention
```

---

# 105. ACCOUNT DELETION

When a requester deletes the Intake account:

```text
Intake metadata deleted according to policy
Google connection revoked/deleted
temporary files deleted
notifications deleted
analytics handling documented
```

Do not delete files already delivered to the customer's Google Drive unless the user explicitly requests it and the product is designed to support that.

---

# 106. BACKUPS

Supabase production database must have a recovery strategy.

Verify:

```text
backup availability
restore procedure
migration recovery
```

Do not assume:

```text
"Supabase has backups"
```

means the application has tested disaster recovery.

---

# 107. DISASTER RECOVERY DRILL

Before public launch, simulate:

```text
database outage
R2 outage
Google Drive outage
worker outage
Vercel outage
```

Define:

```text
what fails
what remains safe
what recovers automatically
what requires manual action
```

---

# 108. COST CONTROLS

Track:

```text
Vercel usage
Supabase usage
R2 storage
R2 operations
R2 egress
Worker execution
Google API usage
Resend email
Sentry
PostHog
```

Create alerts where supported.

---

# 109. ABUSE COST TEST

Simulate:

```text
10 requests
100 files
1 GB each
```

and:

```text
100 requests
1000 files
```

Measure:

```text
storage
bandwidth
worker processing
database load
email
```

Do not launch unrestricted anonymous uploads without understanding worst-case economics.

---

# 110. VERCEL HOBBY OPERATIONAL RULE

For non-commercial validation only:

```text
Vercel Hobby
+
Supabase free/appropriate tier
+
Cloudflare R2 appropriate tier
+
Cloudflare Worker
```

For actual commercial operation:

```text
Vercel Pro
```

or another host that permits the intended commercial use.

Do not design the business around violating Vercel's Hobby terms.

---

# 111. VERCEL CRON RULE

Do not use Vercel Hobby Cron for frequent transfer processing.

Current Vercel documentation limits Hobby Cron schedules to once per day.

Therefore:

```text
Vercel Cron
```

is not the correct 5-minute transfer mechanism for the free Hobby setup.

Use:

```text
Cloudflare Worker Cron
```

for the transfer dispatcher.

---

# 112. CLOUDLFARE WORKER SCHEDULE

Current worker is configured for:

```text
*/5 * * * *
```

Keep the five-minute schedule only if it is actually useful and supported by the chosen Cloudflare Worker setup.

The Worker must:

```text
wake
→ authenticate
→ claim pending jobs
→ process batch
→ report metrics
```

Do not rely on it merely calling an endpoint that cannot determine which jobs to process.

---

# 113. TRANSFER LATENCY EXPECTATION

The MVP may have:

```text
upload completed
↓
background worker
↓
Drive delivery
```

with a small delay.

The public UI should say:

```text
Files uploaded successfully.
We're delivering them to Google Drive…
```

rather than pretending Drive delivery is instant.

---

# 114. PRODUCTION READINESS CHECKLIST

## Code

- [ ] TypeScript passes.
- [ ] ESLint passes.
- [ ] Build passes.
- [ ] No TODO launch blockers.
- [ ] No debug logs.
- [ ] No secrets.
- [ ] No fake functionality.

## Database

- [ ] Production Supabase created.
- [ ] Migrations reproducible.
- [ ] RLS tested.
- [ ] Indexes reviewed.
- [ ] Backup/recovery understood.

## Google

- [ ] OAuth configured.
- [ ] Drive API enabled.
- [ ] Correct scopes.
- [ ] Redirect URLs correct.
- [ ] Token refresh tested.
- [ ] Reauth tested.
- [ ] Verification requirements resolved.

## R2

- [ ] Production bucket.
- [ ] Private bucket.
- [ ] CORS configured.
- [ ] Presigned upload tested.
- [ ] Lifecycle cleanup.
- [ ] Object verification.

## Worker

- [ ] Deployed.
- [ ] Cron active.
- [ ] Secret configured.
- [ ] Batch processing works.
- [ ] Retry works.
- [ ] Dead-letter behavior works.

## Vercel

- [ ] GitHub connected.
- [ ] Production branch = main.
- [ ] Environment variables configured.
- [ ] Preview deployment works.
- [ ] Production deployment works.
- [ ] Custom domain works.

## Security

- [ ] RLS tested.
- [ ] Public token hardened.
- [ ] Rate limits active.
- [ ] File limits enforced.
- [ ] Secrets server-only.
- [ ] Security headers.
- [ ] Error sanitization.
- [ ] No cross-tenant access.

## Testing

- [ ] Unit tests.
- [ ] API tests.
- [ ] Security tests.
- [ ] E2E tests.
- [ ] Mobile tests.
- [ ] Browser tests.
- [ ] Failure tests.
- [ ] Load/concurrency tests.

## Operations

- [ ] Sentry.
- [ ] PostHog.
- [ ] Structured logs.
- [ ] Health endpoint.
- [ ] Alerts.
- [ ] Cost monitoring.

## Legal

- [ ] Privacy.
- [ ] Terms.
- [ ] Retention policy.
- [ ] Account deletion.
- [ ] Third-party provider disclosures.

---

# 115. GITHUB ACTIONS CI

Add:

```text
.github/workflows/ci.yml
```

Run on:

```text
push
pull_request
```

Pipeline:

```text
npm ci
↓
npm run lint
↓
npm run typecheck
↓
npm run test
↓
npm run build
```

E2E can run separately because it requires external services/browser setup.

---

# 116. CI FAILURE RULE

A PR must not be merged if:

```text
lint fails
typecheck fails
unit tests fail
build fails
security checks fail
```

Do not:

```text
disable tests
skip failing checks
comment out code
```

to make CI green.

---

# 117. PLAYWRIGHT E2E ENVIRONMENT

Use a dedicated test configuration.

Never run destructive E2E tests against production.

Preferred:

```text
local
```

or:

```text
staging/preview
```

with isolated database/storage.

---

# 118. E2E TEST ACCOUNTS

Create dedicated test identities.

Do not use:

```text
personal production Google account
real client account
real customer files
```

---

# 119. TEST FILE FIXTURES

Create:

```text
tests/fixtures/
```

with:

```text
small.txt
sample.pdf
sample.jpg
large-test-file
invalid-file
unicode-name.txt
```

Do not put copyrighted/customer/private files in Git.

---

# 120. TEST DATABASE

Use a separate database or isolated test project.

Never:

```text
test → production database
```

---

# 121. SMOKE TEST AFTER EVERY PRODUCTION DEPLOY

Run:

```text
1. homepage
2. login
3. dashboard
4. create request
5. public request
6. upload
7. Drive delivery
8. notification
```

If any P0 step fails:

```text
rollback
```

---

# 122. ROLLBACK STRATEGY

Because Vercel supports Git-connected deployments and rollbacks, maintain:

```text
last known good production commit
```

If deployment breaks:

```text
identify failing commit
↓
rollback
↓
verify smoke tests
↓
fix on feature branch
↓
redeploy
```

---

# 123. PRODUCTION DEPLOYMENT PROCESS

## Step 1

Create GitHub repository.

## Step 2

Push clean code.

## Step 3

Run CI.

## Step 4

Connect repository to Vercel.

## Step 5

Configure Preview environment.

## Step 6

Configure Supabase.

## Step 7

Configure Google OAuth.

## Step 8

Configure R2.

## Step 9

Configure Worker.

## Step 10

Configure Resend.

## Step 11

Configure Sentry/PostHog.

## Step 12

Deploy Preview.

## Step 13

Run complete E2E suite.

## Step 14

Fix all P0/P1 issues.

## Step 15

Configure production environment.

## Step 16

Deploy `main`.

## Step 17

Attach custom domain.

## Step 18

Update Google OAuth production redirect URLs.

## Step 19

Run production smoke test.

## Step 20

Monitor.

---

# 124. FIRST PRODUCTION TEST

Do not invite users immediately.

First perform:

```text
Founder test
```

using:

```text
real browser
incognito browser
real Google account
test Drive folder
real small files
```

Then:

```text
second independent Google account
```

Then:

```text
mobile device
```

---

# 125. BETA TEST

Start with:

```text
5–10 trusted testers
```

Then:

```text
10–30 users
```

Do not immediately open unlimited anonymous access.

---

# 126. BETA SUCCESS CRITERIA

Measure:

```text
request creation success
upload success
Drive transfer success
time to first request
repeat usage
failure rate
support issues
```

---

# 127. LAUNCH BLOCKERS

Do NOT launch publicly if any of these exist:

```text
cross-account data leak
Drive token exposure
duplicate Drive file creation
silent file loss
unbounded anonymous upload
broken expiry
broken request closure
broken Drive reconnection
worker cannot reliably process jobs
no recovery from transfer failure
no database backup/recovery strategy
no privacy/terms pages
```

---

# 128. P0 / P1 / P2 PRIORITY

## P0

```text
security
data loss
Google integration
file transfer
public upload
authentication
database authorization
```

## P1

```text
notifications
analytics
mobile polish
performance
advanced error recovery
```

## P2

```text
branding
templates
billing
advanced integrations
AI
```

---

# 129. IMPLEMENTATION ORDER

The coding agent must follow this order.

## Phase A — Stabilize

```text
typecheck
lint
build
remove dead code
fix environment validation
```

## Phase B — Security

```text
RLS
tokens
public APIs
rate limits
authorization
security headers
```

## Phase C — Transfer

```text
transfer_jobs
worker
batch processing
retry
idempotency
streaming
cleanup
```

## Phase D — Core UX

```text
request builder
checklist
public uploader
dashboard
```

## Phase E — Observability

```text
Sentry
PostHog
logs
health
```

## Phase F — Tests

```text
unit
API
security
E2E
mobile
failure
```

## Phase G — Deployment

```text
GitHub
CI
Vercel preview
production
custom domain
```

---

# 130. AI AGENT MASTER PROMPT

Use this prompt with the coding agent:

```text
You are the lead production engineer for Intake.

Read these files before changing anything:

- prd.md
- architecture.md
- rules.md
- phases.md
- design.md
- memory.md
- production-setup.md

You are working on an existing codebase, not starting a new project.

First inspect the repository.

Do not rewrite the application.

Identify:
1. current architecture
2. working functionality
3. broken functionality
4. security risks
5. deployment risks
6. missing tests
7. missing infrastructure
8. files that need changes

Then create a precise implementation plan.

Important production requirements:

- Vercel hosts the Next.js application.
- Supabase handles auth/database.
- Google Drive is the final destination.
- Cloudflare R2 is temporary storage.
- Cloudflare Worker handles background transfer dispatch.
- Public uploaders do not authenticate with Google.
- Public uploaders never receive Drive credentials.
- Google tokens remain server-only.
- R2 credentials remain server-only.
- Supabase secret/service credentials remain server-only.
- No silent file loss.
- No duplicate Drive files.
- All important operations are idempotent.
- All public endpoints are rate limited.
- All tenant access is authorization checked.
- RLS must be correct.
- No production operation depends on the browser remaining open.
- No large file should be unnecessarily loaded entirely into memory.
- Do not expose secrets in logs or errors.

Critical existing issue to investigate first:

The current transfer Worker calls /api/transfer without a specific upload ID while the API expects uploadId. Redesign this into a real batch transfer dispatcher.

Second critical issue:

The current upload completion route can synchronously execute the Drive transfer. Refactor so upload completion queues the transfer and returns quickly.

Third critical issue:

The current transfer implementation buffers complete R2 objects. Replace this with a safer streaming/resumable architecture.

Fourth:

Review and harden public request tokens, RLS, rate limiting, upload authorization, and race conditions.

Fifth:

There is currently no automated test suite. Add Vitest/React Testing Library/Playwright and create unit, API, security, integration, and E2E coverage.

Work incrementally.

For each task:
1. inspect
2. plan
3. implement
4. run tests
5. run lint
6. run typecheck
7. run build
8. manually verify
9. review security
10. update memory.md

Never:
- fake functionality
- disable tests
- weaken security
- expose secrets
- silently swallow failures
- rewrite unrelated modules
- invent provider behavior
- claim something works without testing it
```

---

# 131. DEFINITION OF DONE FOR EVERY FEATURE

A feature is not complete until:

```text
code exists
+
happy path works
+
error path works
+
authorization works
+
security tested
+
mobile tested where relevant
+
unit/API tests
+
E2E coverage where relevant
+
lint passes
+
typecheck passes
+
build passes
+
documentation updated
```

---

# 132. FINAL GOLDEN TEST

The application must be able to complete this exact scenario:

```text
REQUESTER

Google login
↓
Connect Drive
↓
Choose:

/Clients/Acme/Website Redesign

↓
Create request:

Website Redesign

Required:
Logo
Brand Guidelines
Product Images

↓
Generate public link
↓
Copy link


UPLOADER

Open link without Google login
↓
See:

Website Redesign

Logo
Brand Guidelines
Product Images

↓
Select files
↓
Upload
↓
See real progress
↓
Receive confirmation
↓
Close browser


BACKEND

R2 object exists
↓
Upload verified
↓
Transfer job queued
↓
Worker claims job
↓
Google token refreshed if required
↓
Drive upload
↓
Drive file verified
↓
Drive ID persisted
↓
R2 object deleted
↓
Notification created
↓
Email sent


REQUESTER

Dashboard updates
↓
3/3 files received
↓
Drive files visible in correct folder
```

This is the minimum complete product loop.

---

# 133. FINAL FAILURE TEST

Then deliberately:

```text
revoke Google authorization
```

Expected:

```text
upload is not lost
R2 object remains temporarily
job enters recoverable state
requester sees action required
reconnect works
retry works
file eventually reaches Drive
temporary object is cleaned
```

---

# 134. FINAL SECURITY TEST

Attempt:

```text
User A → User B request
User A → User B upload
Public → arbitrary upload ID
Public → arbitrary R2 object
Public → arbitrary Drive folder
Public → dashboard
Public → Google token
Public → Supabase secret
```

Every unauthorized operation must fail.

---

# 135. FINAL PERFORMANCE TEST

Simulate:

```text
10 simultaneous uploaders
```

then:

```text
50 simultaneous uploads
```

Measure:

```text
API latency
R2 success
database load
worker queue
Drive transfer
errors
```

The goal is not massive scale.

The goal is predictable behavior under normal early-stage load.

---

# 136. FINAL PRODUCTION CHECK

Before telling anyone:

> "Intake is live."

The coding agent/founder must be able to prove:

```text
✓ GitHub clean
✓ CI green
✓ Vercel deployment green
✓ Domain green
✓ Supabase green
✓ Google OAuth green
✓ R2 green
✓ Worker green
✓ Resend green
✓ Sentry green
✓ PostHog green
✓ E2E green
✓ Security tests green
✓ Failure tests green
✓ Backup strategy confirmed
✓ Privacy/Terms live
✓ Smoke test green
```

---

# 137. OPERATING MODEL AFTER LAUNCH

Every deployment:

```text
feature branch
↓
CI
↓
PR
↓
Vercel preview
↓
manual QA
↓
merge main
↓
production deployment
↓
smoke test
↓
monitor Sentry
```

Never directly edit production code.

---

# 138. WEEKLY PRODUCTION REVIEW

Review:

```text
uploads
successful transfers
failed transfers
retry count
Drive API failures
Google reauth events
R2 storage
R2 cleanup
database errors
Sentry errors
public abuse
user feedback
```

---

# 139. INCIDENT RESPONSE

If a serious issue occurs:

```text
1. Stop harmful operation.
2. Disable affected endpoint if necessary.
3. Preserve logs.
4. Identify affected records.
5. Fix root cause.
6. Deploy fix.
7. Verify recovery.
8. Assess whether users/data were affected.
9. Document incident.
10. Add regression test.
```

---

# 140. NEVER SACRIFICE THESE

For speed, do not sacrifice:

```text
authorization
data isolation
file integrity
idempotency
secret management
backup/recovery
error visibility
```

You can sacrifice:

```text
animation
advanced branding
AI
extra integrations
advanced analytics
```

---

# 141. CURRENT PROJECT STATUS AFTER THIS PLAN

The uploaded codebase is:

```text
FUNCTIONAL FOUNDATION
```

not yet:

```text
PRODUCTION READY
```

The goal of this document is to move it through:

```text
Existing code
    ↓
Stabilized code
    ↓
Secure architecture
    ↓
Reliable transfer system
    ↓
Automated tests
    ↓
Preview deployment
    ↓
Production deployment
    ↓
Real-user beta
    ↓
Public launch
```

---

# 142. FINAL PRINCIPLE

The goal is not:

> "Make the code deploy to Vercel."

The goal is:

> **Make Intake a system that a stranger can use from their phone, upload important files through, close their browser, and trust that the files will arrive in the correct Google Drive folder — while the requester can safely manage the entire workflow.**

Deployment is only successful when the complete product loop is reliable.

