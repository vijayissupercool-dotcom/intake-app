# Architecture — Intake

**Document:** System Architecture  
**Product:** Intake  
**Version:** 1.0  
**Date:** 2026-08-18  
**Status:** Pre-build / production architecture  
**Architecture owner:** Founder / Engineering

---

## 1. Architecture Objective

Build a production-grade SaaS that allows an authenticated Google Drive user to create a secure public file-request link and receive external uploads directly into a selected Google Drive folder.

The architecture must optimize for:

- reliability
- security
- upload performance
- Google API correctness
- low infrastructure complexity
- no-code / AI-assisted development
- observability
- recoverability
- low operating cost
- future extensibility

The core system must remain simple:

```text
Requester
    │
    ▼
Web App
    │
    ├── Authentication
    ├── Request management
    └── Google Drive connection
            │
            ▼
        API / Backend
            │
            ├── PostgreSQL
            ├── Request service
            ├── Upload service
            ├── Job service
            └── Drive integration
                    │
                    ▼
                Google Drive

External uploader
    │
    ▼
Public request page
    │
    ▼
Direct/resumable upload
    │
    ▼
Temporary object storage
    │
    ▼
Transfer worker
    │
    ▼
Google Drive
```

---

# 2. Architecture Decision Summary

The recommended production architecture is:

| Layer | Recommended technology |
|---|---|
| Frontend | Next.js + TypeScript |
| Hosting / frontend edge | Vercel |
| Primary database | Supabase PostgreSQL |
| Application auth | Supabase Auth |
| Temporary file storage | Cloudflare R2 |
| Upload mechanism | R2 presigned URLs + multipart uploads |
| Backend API | Next.js server routes / server actions for application operations |
| Background processing | Cloudflare Workers / Queues |
| Google integration | Google Drive API |
| Google OAuth | Google OAuth 2.0 |
| Email | Resend |
| Rate limiting / edge protection | Cloudflare |
| Analytics | PostHog |
| Error monitoring | Sentry |
| Product logging | Structured application logs |
| Payments | Stripe, post-MVP |
| DNS/CDN | Cloudflare |
| CI/CD | GitHub + Vercel |
| Secrets | Platform secret stores + encrypted database storage where required |

This is intentionally a hybrid architecture.

The product should **not** try to make one platform perform every function.

---

# 3. Why This Architecture

The most important architectural decision is separating:

### Application state

from:

### Temporary binary file data

and from:

### Google Drive delivery.

The database should never become the file store.

The application server should not proxy every byte of every upload.

Instead:

```text
Browser
  │
  │ direct upload
  ▼
Cloudflare R2
  │
  │ asynchronous transfer
  ▼
Google Drive
```

This prevents the application backend from becoming the bandwidth bottleneck.

Cloudflare R2 supports S3-compatible uploads and multipart uploads up to 5 TiB, with resumability and parallel part uploads. citeturn0search1turn0search2

R2 also does not charge egress fees, which is particularly attractive for a temporary-file workflow where files need to leave our storage and enter Google Drive. citeturn0search5turn0search6

---

# 4. High-Level System

```text
                          ┌──────────────────────┐
                          │      Requester       │
                          │   Google Account     │
                          └──────────┬───────────┘
                                     │
                                     │ OAuth
                                     ▼
┌─────────────────────────────────────────────────────────────┐
│                        WEB APPLICATION                      │
│                                                             │
│  Next.js                                                    │
│  ├── Dashboard                                               │
│  ├── Request Builder                                         │
│  ├── Request Detail                                          │
│  ├── Settings                                                 │
│  └── Public Upload Page                                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
                 ┌─────────────────────┐
                 │ Application Backend │
                 │                     │
                 │ Auth                │
                 │ Requests            │
                 │ Upload Sessions     │
                 │ Drive Integration   │
                 │ Notifications       │
                 └──────┬───────┬──────┘
                        │       │
             ┌──────────┘       └────────────┐
             ▼                               ▼
   ┌──────────────────┐             ┌──────────────────┐
   │ Supabase Postgres│             │ Cloudflare R2    │
   │                  │             │                  │
   │ Users            │             │ Temporary files  │
   │ Requests         │             │ Multipart upload │
   │ Submissions      │             │ Quarantine       │
   │ File metadata    │             └────────┬─────────┘
   │ Jobs             │                      │
   │ Audit events     │                      │
   └──────────────────┘                      ▼
                                    ┌──────────────────┐
                                    │ Transfer Worker  │
                                    │                  │
                                    │ Retry / Queue    │
                                    │ Drive API        │
                                    └────────┬─────────┘
                                             │
                                             ▼
                                    ┌──────────────────┐
                                    │   Google Drive   │
                                    │                  │
                                    │ Selected folder  │
                                    └──────────────────┘
```

---

# 5. Trust Boundaries

There are four major trust zones.

## Zone A — Authenticated requester

The person who owns the Google Drive destination.

Capabilities:

- create requests
- configure requests
- view submissions
- connect Drive
- manage request lifecycle

---

## Zone B — Public uploader

An unauthenticated external person.

Capabilities:

- access one request through a secure token
- see intentionally exposed request information
- upload files
- submit files

The uploader has **zero direct authorization against the requester's application account or Google Drive**.

---

## Zone C — Application backend

Trusted server-side environment.

Capabilities:

- validate requests
- issue upload credentials
- read/write database
- access encrypted Google OAuth credentials
- initiate Drive transfers
- enqueue jobs

---

## Zone D — Google Drive

External system of record for delivered files.

The application interacts with Drive only through authorized Google APIs.

---

# 6. Core Architectural Principle

The public uploader should never receive:

- Google OAuth access tokens
- Google refresh tokens
- Google Drive folder IDs
- arbitrary database IDs
- Supabase service keys
- internal object storage credentials
- application secrets

The browser should receive only narrowly scoped, short-lived upload credentials.

---

# 7. Frontend Architecture

## 7.1 Framework

Recommended:

```text
Next.js
TypeScript
React
Tailwind CSS
shadcn/ui or equivalent component system
```

The frontend should use a single application rather than separate frontend repositories.

---

## 7.2 Route structure

Conceptually:

```text
/
├── landing
├── login
├── app
│   ├── dashboard
│   ├── requests
│   ├── requests/new
│   ├── requests/[id]
│   ├── requests/[id]/settings
│   ├── submissions/[id]
│   └── settings
│
└── r
    └── [public-token]
```

The public request route must be isolated from authenticated application routes.

---

# 8. Rendering Strategy

## Marketing pages

Use server-rendered/static content where possible.

Goals:

- SEO
- fast first load
- minimal JavaScript

## Authenticated application

Use client-side interactions where required.

Goals:

- fast request editing
- upload progress
- optimistic UI where safe

## Public upload page

Optimize aggressively for:

- mobile
- low bandwidth
- large file uploads
- minimal JavaScript
- clear progress

---

# 9. Authentication Architecture

There are two distinct concepts:

### Application authentication

Used by the requester.

### Google Drive authorization

Used to access the requester's Drive.

They must not be treated as the same thing.

---

## 9.1 Application authentication

Recommended:

```text
Supabase Auth
```

Primary login:

```text
Continue with Google
```

Supabase manages the application session.

---

## 9.2 Drive authorization

The requester separately authorizes Google Drive access.

Conceptually:

```text
Supabase user
      │
      │
      ▼
Connect Google Drive
      │
      ▼
Google OAuth
      │
      ▼
Drive connection record
```

This separation allows the application identity to remain stable even if the Drive connection is revoked.

---

# 10. Google OAuth Architecture

This is one of the highest-risk areas of the system.

The application must request the minimum practical Drive scope.

Do not automatically request broad access to the user's entire Drive.

The architecture must validate whether `drive.file` is sufficient for the actual folder-selection and file-creation workflow before committing to production.

Google's Drive API has quota limits at project and per-user levels, and Drive enforces additional upload constraints. As of the current 2026 documentation, project quotas include 1,000,000 quota units/minute, per-user quotas of 325,000 quota units/minute, and a 1 TB/day project egress threshold; Google also documents a 750 GB/day upload limit per Workspace user and a 5 TB maximum file size. citeturn0search0

These provider limits are not the product's own limits.

The product must enforce substantially safer product-level limits.

---

# 11. Drive Credential Storage

Google access/refresh credentials are highly sensitive.

Recommended design:

```text
Google OAuth
    │
    ▼
Backend
    │
    ├── encrypt credentials
    │
    ▼
Database
```

Never expose refresh tokens to:

- browser
- public upload page
- client-side JavaScript
- analytics
- logs

Never print OAuth credentials in error logs.

---

# 12. Token Refresh

The Drive service should automatically refresh access credentials when required.

Conceptual:

```text
Drive operation
      │
      ▼
Access token valid?
   /       \
 yes       no
  │         │
  ▼         ▼
API      refresh
           │
           ▼
        retry API
```

If refresh fails:

```text
DRIVE_REAUTH_REQUIRED
```

The requester should see:

> Google Drive needs to be reconnected.

---

# 13. Database Architecture

Use:

```text
Supabase PostgreSQL
```

The database is the source of truth for application state.

It should store:

- users
- Drive connections
- requests
- request items
- submissions
- uploaded file metadata
- transfer jobs
- notifications
- audit events
- usage data

It should not store binary file contents.

---

# 14. Database Schema

## 14.1 users

```text
id
email
name
avatar_url
created_at
updated_at
deleted_at
```

---

## 14.2 google_connections

```text
id
user_id
google_account_id
email
encrypted_access_token
encrypted_refresh_token
token_expires_at
scopes
status
created_at
updated_at
last_verified_at
```

Statuses:

```text
ACTIVE
REAUTH_REQUIRED
DISCONNECTED
ERROR
```

---

## 14.3 drive_destinations

```text
id
user_id
google_connection_id
folder_id
folder_name
drive_type
status
created_at
updated_at
```

`drive_type`:

```text
MY_DRIVE
SHARED_DRIVE
```

MVP should prioritize `MY_DRIVE`.

---

## 14.4 requests

```text
id
user_id
destination_id
public_token_hash
title
description
status
expires_at
settings_json
created_at
updated_at
closed_at
```

Important:

Store a hash of the public token rather than unnecessarily storing the raw token.

---

## 14.5 request_items

```text
id
request_id
name
description
required
accepted_types
max_files
max_file_size_bytes
sort_order
created_at
updated_at
```

---

## 14.6 submissions

```text
id
request_id
uploader_name
uploader_email
status
started_at
completed_at
created_at
updated_at
```

---

## 14.7 uploaded_files

```text
id
submission_id
request_item_id
storage_key
original_filename
normalized_filename
mime_type
size_bytes
checksum
status
drive_file_id
drive_web_url
created_at
updated_at
```

---

## 14.8 transfer_jobs

```text
id
uploaded_file_id
status
attempt_count
available_at
locked_at
last_error_code
last_error_message
created_at
updated_at
completed_at
```

Statuses:

```text
QUEUED
PROCESSING
SUCCEEDED
RETRYING
FAILED
DEAD_LETTER
```

---

## 14.9 audit_events

```text
id
user_id
request_id
submission_id
event_type
actor_type
metadata_json
created_at
```

---

# 15. Row-Level Security

Supabase PostgreSQL Row Level Security must be enabled for application-owned records.

Core rule:

> A requester can only access records belonging to their own account.

Examples:

```text
users
→ current authenticated user

requests
→ request.user_id = auth.uid()

request_items
→ request belongs to current user

submissions
→ submission.request belongs to current user

uploaded_files
→ file.submission.request belongs to current user
```

Public uploader access must not bypass application authorization.

Public request operations should happen through controlled backend endpoints rather than exposing broad database access.

---

# 16. Public Request Token Architecture

A request URL contains a high-entropy token.

Example:

```text
/r/7Qp9...random...
```

Recommended flow:

```text
Raw token
    │
    ▼
SHA-256
    │
    ▼
token hash in database
```

On request:

```text
URL token
    │
    ▼
hash
    │
    ▼
database lookup
    │
    ├── not found → 404
    ├── expired → expired page
    ├── closed → closed page
    └── active → request context
```

The raw token should not be logged.

---

# 17. Token Security

Token requirements:

- cryptographically random
- minimum 128 bits of entropy
- preferably 192–256 bits
- non-sequential
- not derived from database IDs
- revocable
- expirable

The token is a bearer credential.

Anyone who possesses it can potentially upload to that request.

Therefore the system must treat it as sensitive.

---

# 18. Public Request Authorization

The public uploader does not authenticate as a user.

Instead:

```text
Bearer request token
        ↓
Request authorization
        ↓
Short-lived upload session
        ↓
Short-lived storage credentials
```

The public token should not be reused directly as a storage credential.

---

# 19. Upload Session Architecture

When the uploader chooses a file:

```text
Browser
  │
  │ initialize upload
  ▼
Backend
  │
  ├── validate request
  ├── validate file metadata
  ├── enforce quota
  ├── create UploadedFile
  └── create storage upload
  │
  ▼
Short-lived upload credentials
  │
  ▼
Browser
```

The browser then uploads directly to R2.

---

# 20. Temporary Storage

Use:

```text
Cloudflare R2
```

for temporary uploaded objects.

Object key structure:

```text
uploads/
  {request-id}/
    {submission-id}/
      {uploaded-file-id}/
        original
```

Never use the original filename as the storage key.

This prevents:

- path collisions
- traversal problems
- unsafe names
- accidental overwrites

---

# 21. R2 Upload Architecture

For small/medium files:

```text
Browser
   │
   ▼
presigned PUT
   │
   ▼
R2
```

For large files:

```text
Browser
   │
   ▼
Create multipart upload
   │
   ├── part 1
   ├── part 2
   ├── part 3
   └── ...
   │
   ▼
Complete multipart upload
   │
   ▼
R2
```

R2's current documentation recommends multipart uploads for large files and workloads where resumability is important; multipart uploads support parallel parts and retrying failed parts rather than restarting the entire object. citeturn0search1

---

# 22. Why Not Upload Through Next.js?

Do not use:

```text
Browser
  ↓
Next.js server
  ↓
R2
```

for every byte of every upload.

This creates:

- bandwidth bottlenecks
- higher compute costs
- timeout risk
- unnecessary server load
- worse scalability

Prefer:

```text
Browser
  ↓
R2
```

with the application backend only issuing authorization and tracking state.

---

# 23. Upload Completion

The browser must not be trusted to declare a file complete.

Flow:

```text
Browser
  │
  │ upload complete
  ▼
Backend
  │
  ├── verify storage object exists
  ├── verify expected size
  ├── verify metadata
  ├── verify upload session
  └── mark file UPLOADED
```

If checks fail:

```text
UPLOAD_VERIFICATION_FAILED
```

---

# 24. File Integrity

Where practical, store:

```text
size_bytes
checksum
mime_type
```

The checksum should be used to improve integrity and idempotency.

Do not rely solely on:

```text
filename
```

to identify a file.

---

# 25. Malware Scanning

The architecture must support a quarantine state.

Recommended flow:

```text
R2
 │
 ▼
QUARANTINED
 │
 ▼
Malware scan
 │
 ├── clean ────────► APPROVED
 │                      │
 │                      ▼
 │                 Drive transfer
 │
 └── malicious ────► REJECTED
```

For the first production release, the exact scanning vendor may be selected after evaluating:

- cost
- maximum file size
- latency
- API support
- supported file types
- no-code compatibility

The database must support the state regardless of which scanning provider is selected.

---

# 26. Transfer Architecture

The transfer from R2 to Google Drive must be asynchronous.

Never make the public uploader wait for:

```text
R2 → Google Drive
```

to finish before showing a successful upload.

Instead:

```text
Upload
  ↓
Validated
  ↓
Queued
  ↓
Drive transfer
  ↓
Completed
```

The uploader can see:

> Upload received. We're finishing delivery to Google Drive.

---

# 27. Background Job System

Use:

```text
Cloudflare Workers + Queues
```

for asynchronous transfer processing.

Conceptual:

```text
API
 │
 ▼
transfer_jobs
 │
 ▼
Queue
 │
 ▼
Worker
 │
 ├── fetch R2 object
 ├── refresh Google token
 ├── upload to Drive
 ├── verify result
 └── update database
```

This separates user-facing latency from third-party API latency.

---

# 28. Worker Responsibilities

The transfer worker should:

1. receive transfer job
2. validate job state
3. acquire/refresh Google credentials
4. retrieve R2 object
5. upload to Drive
6. persist Drive file ID
7. persist Drive URL
8. mark transfer successful
9. delete temporary object
10. update submission progress
11. emit analytics/audit event
12. trigger notification if submission is complete

---

# 29. Worker Idempotency

The worker must be safe to execute more than once.

Before creating a Drive file:

```text
Does uploaded_file.drive_file_id exist?
```

If yes:

```text
Do not create another Drive file.
```

If no:

```text
perform transfer
```

The system must also use a deterministic transfer identity where possible.

---

# 30. Retry Strategy

Google documents that quota/rate-limit failures can occur and recommends exponential backoff. citeturn0search0

Recommended:

```text
Attempt 1
   ↓
1–2 sec
   ↓
Attempt 2
   ↓
4 sec
   ↓
Attempt 3
   ↓
8 sec
   ↓
Attempt 4
   ↓
16 sec
   ↓
...
```

Use jitter.

Do not retry indefinitely.

---

# 31. Retry Classification

## Retryable

- 429
- temporary 5xx
- network timeout
- transient Google API errors
- temporary R2 failure

## Non-retryable

- invalid destination
- revoked authorization
- permanently forbidden operation
- invalid file
- request closed
- quota/account restriction requiring user action

Non-retryable errors should move to a user-action state.

---

# 32. Dead-Letter Queue

After a configurable number of failed attempts:

```text
FAILED
  ↓
DEAD_LETTER
```

The requester should see:

> We couldn't deliver this file to Google Drive.

with a recovery action where possible.

The system should retain diagnostic information without exposing sensitive credentials.

---

# 33. Drive Transfer Method

The Drive API supports resumable uploads, which should be preferred for files where a resumable session provides reliability benefits.

Conceptually:

```text
Worker
  │
  ▼
Create resumable Drive upload session
  │
  ▼
Stream R2 object
  │
  ▼
Drive
```

The implementation should avoid loading an entire large file into worker memory.

Use streaming/chunked transfer where supported by the runtime and SDK.

---

# 34. Important Storage Constraint

The product should not assume:

```text
R2 object
→ download entire file into memory
→ upload entire file to Drive
```

That is unacceptable for large files.

The worker must use streaming or bounded chunks.

---

# 35. Temporary Object Lifecycle

After successful Drive delivery:

```text
R2 object
   ↓
delete
```

Recommended default:

```text
Successful transfer → delete shortly after confirmation
```

Failed transfers:

```text
retain temporarily
→ retry
→ eventually delete / quarantine
```

R2 lifecycle rules should also be configured as a safety net for abandoned uploads.

R2 supports multipart uploads and automatic cleanup of incomplete multipart uploads after a default lifecycle period, which can be configured as part of the storage design. citeturn0search1

---

# 36. Request Lifecycle

```text
DRAFT
  │
  │ activate
  ▼
ACTIVE
  │
  ├───────────────┐
  │               │
  ▼               ▼
PAUSED          EXPIRED
  │
  │ resume
  ▼
ACTIVE
  │
  │ close
  ▼
CLOSED
```

---

# 37. Submission Lifecycle

```text
STARTED
   ↓
UPLOADING
   ↓
PROCESSING
   ↓
COMPLETED
```

Alternative:

```text
UPLOADING
   ↓
PARTIAL_FAILURE
   ↓
COMPLETED
```

or:

```text
PROCESSING
   ↓
FAILED
```

---

# 38. Uploaded File Lifecycle

```text
INITIALIZED
    ↓
UPLOADING
    ↓
UPLOADED
    ↓
QUARANTINED
    ↓
APPROVED
    ↓
TRANSFER_QUEUED
    ↓
TRANSFERRING
    ↓
TRANSFERRED
```

Failure branches:

```text
UPLOADING → FAILED
TRANSFERRING → RETRYING
RETRYING → FAILED
FAILED → DEAD_LETTER
```

---

# 39. Request Progress Calculation

Do not use a simplistic count of uploaded files if a request item can require multiple files.

The system should calculate progress from request-item requirements.

Example:

```text
Required:
Logo              ✓
Brand Guidelines  ✓
Product Images    ○

Progress:
2 / 3 required items
```

For multiple-file items:

```text
Product Images
2 / 5 received
```

---

# 40. Submission Completion Rules

A submission can be marked:

```text
COMPLETED
```

when:

1. all required files have been accepted
2. all required files have successfully transferred to Drive
3. no required transfer remains unresolved

Optional files can remain pending without preventing completion.

---

# 41. Notification Architecture

Notification events should be asynchronous.

```text
Submission completed
       │
       ▼
Notification job
       │
       ▼
Email provider
```

Do not send email inside the core upload transaction.

Recommended provider:

```text
Resend
```

Initial emails:

- new submission
- transfer failure requiring action
- optional request expiration reminder

---

# 42. Email Idempotency

Each notification should have a unique event identity.

Example:

```text
submission.completed:{submission_id}
```

Before sending:

```text
Was this event already delivered?
```

If yes:

```text
do not resend
```

---

# 43. Rate Limiting

Rate limits must exist at multiple levels.

## Public

- request page views
- submission initialization
- upload initialization
- completion
- status polling

## Authenticated

- request creation
- Drive folder listing
- Drive API actions
- dashboard queries

## Account

- active requests
- total uploads
- total bytes
- daily submissions

---

# 44. Abuse Protection Architecture

Public upload endpoints are high-risk.

Protection stack:

```text
Cloudflare
   ↓
WAF / bot controls
   ↓
Application rate limit
   ↓
Request token validation
   ↓
Upload quota
   ↓
File validation
   ↓
Storage
```

Potential adaptive challenge:

```text
normal traffic → no CAPTCHA

suspicious traffic
       ↓
risk challenge
       ↓
continue
```

Do not make CAPTCHA the default experience unless abuse data justifies it.

---

# 45. Quota Architecture

Every request should have limits.

Example:

```text
max_files_per_submission
max_file_size
max_total_submission_size
max_submissions_per_hour
max_active_requests
```

Limits should be configurable by plan.

---

# 46. Google API Quota Protection

Do not let arbitrary public uploads directly create uncontrolled Drive API calls.

Use:

```text
Public upload
      ↓
Application state
      ↓
Queue
      ↓
Controlled Drive transfer rate
```

This provides backpressure.

Google currently enforces project and per-user Drive API quotas and returns rate-limit errors such as 403/429 when limits are exceeded. citeturn0search0

---

# 47. Backpressure

If Drive becomes temporarily unavailable:

```text
Uploads continue
       ↓
Transfer queue grows
       ↓
Workers process at controlled rate
```

The system must not:

```text
fail every upload
```

simply because Google Drive is temporarily slow.

However, product-level storage retention limits must prevent the queue from becoming an uncontrolled storage bill.

---

# 48. Drive Destination Validation

Before activating a request:

```text
verify destination exists
verify user can write
verify connection active
```

If validation fails:

```text
do not activate request
```

If the folder later becomes unavailable:

```text
ACTIVE request
       ↓
Drive destination failure
       ↓
TRANSFER_BLOCKED
```

The requester should be asked to reconnect or select another destination.

---

# 49. Destination Changes

MVP should allow changing the destination folder only from the authenticated requester interface.

Never allow an external uploader to change it.

Changing the destination must not rewrite historical files.

It affects future transfers only.

---

# 50. Security Model

## Principle

```text
Default deny
```

Every protected operation must answer:

1. Who is making the request?
2. What resource are they accessing?
3. Does the actor own or have permission for the resource?
4. Is the resource still active?
5. Is the operation allowed in its current state?

---

# 51. Public API Model

Public endpoints should expose only request-specific operations.

Conceptual:

```text
GET  /api/public/requests/:token
POST /api/public/requests/:token/submissions
POST /api/public/uploads/init
POST /api/public/uploads/complete
POST /api/public/submissions/:id/complete
```

Never expose:

```text
GET /api/requests
GET /api/users
GET /api/drive/files
```

to the public uploader.

---

# 52. Authenticated API Model

Conceptual:

```text
GET    /api/requests
POST   /api/requests
GET    /api/requests/:id
PATCH  /api/requests/:id
DELETE /api/requests/:id

POST   /api/drive/connect
GET    /api/drive/folders

GET    /api/submissions/:id
POST   /api/requests/:id/pause
POST   /api/requests/:id/resume
POST   /api/requests/:id/close
```

Exact route implementation may differ depending on the final framework conventions.

---

# 53. API Response Principles

Never leak:

- refresh tokens
- internal database identifiers unnecessarily
- storage credentials
- raw Google API error payloads
- stack traces
- private Drive metadata

Return stable application-level errors.

Example:

```json
{
  "code": "DRIVE_REAUTH_REQUIRED",
  "message": "Reconnect Google Drive to continue."
}
```

---

# 54. Observability Architecture

Three levels:

## Logs

Structured server logs.

## Metrics

Track:

- upload success rate
- upload failure rate
- Drive transfer success
- transfer latency
- queue depth
- retry count
- API error rate
- OAuth failures
- storage volume

## Traces

Trace:

```text
request
→ submission
→ file
→ transfer job
→ Drive API
```

Every important operation should have a correlation ID.

---

# 55. Correlation IDs

Every upload/submission should have:

```text
request_id
submission_id
uploaded_file_id
transfer_job_id
correlation_id
```

Logs should be searchable by these IDs.

---

# 56. Error Monitoring

Use:

```text
Sentry
```

for application exceptions and frontend errors.

Never send sensitive file contents or OAuth credentials to Sentry.

Sanitize:

- tokens
- emails where unnecessary
- file names where sensitive
- request URLs
- authorization headers

---

# 57. Product Analytics

Use:

```text
PostHog
```

for product events.

Do not track:

- file contents
- uploaded binary data
- OAuth credentials
- sensitive document metadata unnecessarily

Track behavior:

```text
request_created
link_copied
submission_started
upload_completed
drive_transfer_completed
```

---

# 58. Analytics Privacy

The public uploader may not be authenticated.

Therefore:

- avoid unnecessary fingerprinting
- avoid storing raw IP addresses unless legally justified
- prefer short-lived or privacy-safe abuse identifiers
- document analytics behavior in the privacy policy

---

# 59. Data Retention Architecture

Application metadata:

```text
retain while account exists
```

Temporary file data:

```text
delete after successful Drive transfer
```

Failed files:

```text
retain only long enough for retry/recovery
```

Abandoned uploads:

```text
automatic cleanup
```

Audit logs:

```text
retention policy defined separately
```

---

# 60. Disaster Recovery

The application should be recoverable from:

- database backup
- source repository
- infrastructure configuration
- environment variables/secrets
- deployment configuration

Google Drive is the final destination for user files.

The product should not depend on its temporary storage as the permanent source of truth.

---

# 61. Backup Strategy

Database:

- automated Supabase backups
- point-in-time recovery where plan supports it
- periodic restoration test

R2:

- temporary data only
- lifecycle cleanup
- no assumption that R2 is the permanent archive

Code:

```text
GitHub
```

Infrastructure configuration:

```text
version controlled
```

Secrets:

```text
managed securely outside source control
```

---

# 62. Deployment Architecture

Recommended:

```text
GitHub
   │
   ▼
Vercel
   │
   ├── Production
   ├── Preview
   └── Development
```

Cloudflare:

```text
DNS
WAF
R2
Workers
Queues
```

Supabase:

```text
Postgres
Auth
Database APIs
```

---

# 63. Environments

Minimum:

```text
development
staging
production
```

Do not use the production Google OAuth client for local experimentation where avoidable.

Use separate credentials/configuration per environment.

---

# 64. Environment Variables

Conceptual:

```text
NEXT_PUBLIC_APP_URL

SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET

R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET

RESEND_API_KEY

SENTRY_DSN
POSTHOG_KEY
```

Secrets must never be committed to Git.

---

# 65. No-Code / Vibe-Coding Compatibility

The architecture is intentionally designed so AI/no-code tools can implement the system incrementally.

The development tool must be instructed to treat these as separate modules:

```text
/auth
/requests
/public-upload
/uploads
/drive
/transfers
/notifications
/analytics
/security
```

Do not ask an AI coding agent to build the entire system in one generation.

---

# 66. Module Boundaries

## Auth module

Responsible for:

- sessions
- account identity
- authorization

## Request module

Responsible for:

- requests
- request items
- lifecycle

## Public upload module

Responsible for:

- public token
- uploader UI
- upload sessions

## Storage module

Responsible for:

- R2
- upload initialization
- object verification
- cleanup

## Drive module

Responsible for:

- OAuth
- token refresh
- folder access
- Drive uploads

## Transfer module

Responsible for:

- queues
- retries
- idempotency
- transfer state

## Notification module

Responsible for:

- email
- notification state

## Security module

Responsible for:

- rate limits
- validation
- abuse controls
- audit events

---

# 67. Dependency Direction

The system should follow:

```text
UI
 ↓
Application services
 ↓
Domain logic
 ↓
Infrastructure adapters
```

Avoid:

```text
UI
 ↓
direct Google API
```

Avoid:

```text
UI
 ↓
direct database mutation for privileged operations
```

---

# 68. Google Drive Adapter

The application should hide Google API details behind a Drive adapter.

Conceptual interface:

```text
DriveService

connect()
refreshToken()
validateDestination()
listFolders()
createFile()
uploadFile()
getFile()
```

The rest of the application should not know Google's raw API implementation details.

This creates future flexibility for:

```text
Dropbox
OneDrive
Box
S3
```

without rewriting request logic.

---

# 69. Storage Adapter

Similarly:

```text
StorageService

createUpload()
completeUpload()
verifyObject()
getObjectStream()
deleteObject()
```

The product should not hard-code R2 concepts throughout the domain logic.

This allows future migration.

---

# 70. Queue Adapter

Use an abstraction:

```text
JobQueue

enqueue()
retry()
acknowledge()
deadLetter()
```

The first implementation can use Cloudflare Queues.

---

# 71. Domain Model

The central domain relationship is:

```text
Request
 ├── Destination
 ├── RequestItems
 └── Submissions
       └── UploadedFiles
              └── TransferJob
```

This is the core of the product.

Do not allow infrastructure objects to become the domain model.

---

# 72. State Machine Enforcement

Important transitions must be server-controlled.

Example:

```text
ACTIVE → PAUSED
ACTIVE → CLOSED
ACTIVE → EXPIRED
```

An uploader cannot transition:

```text
ACTIVE → CLOSED
```

The server owns lifecycle transitions.

---

# 73. Concurrency

Potential race:

```text
Two browser tabs
      ↓
same upload completion
```

or:

```text
Two workers
      ↓
same transfer job
```

Use:

- database transactions
- unique constraints
- idempotency keys
- job locks where necessary
- state checks

---

# 74. Unique Constraints

Recommended constraints include:

```text
requests.public_token_hash UNIQUE

transfer_jobs.uploaded_file_id UNIQUE

submission completion event UNIQUE

notification event key UNIQUE
```

The exact schema should be finalized during implementation.

---

# 75. Transaction Boundaries

Do not hold a database transaction open while calling:

- Google APIs
- R2
- email provider

Instead:

```text
transaction
  ↓
persist state
  ↓
commit
  ↓
external call
  ↓
persist result
```

This avoids long-running database locks.

---

# 76. Example End-to-End Upload Flow

```text
1. Uploader opens /r/:token
2. Backend hashes token
3. Request found
4. Request ACTIVE
5. Request configuration returned
6. Uploader selects file
7. Browser calls initialize-upload
8. Backend validates:
   - request
   - file count
   - size
   - MIME
   - quota
9. UploadedFile row created
10. R2 multipart upload initialized
11. Browser receives temporary upload authorization
12. Browser uploads directly to R2
13. Browser completes multipart upload
14. Backend verifies R2 object
15. UploadedFile → UPLOADED
16. TransferJob → QUEUED
17. Worker receives job
18. Worker obtains Google access token
19. Worker streams object from R2
20. Worker uploads to Drive
21. Drive file ID stored
22. UploadedFile → TRANSFERRED
23. Temporary R2 object deleted
24. Submission progress recalculated
25. Submission → COMPLETED if requirements met
26. Notification job queued
27. Requester receives email
```

---

# 77. Failure Example — Google OAuth Revoked

```text
Upload
 ↓
R2 success
 ↓
Transfer job
 ↓
Google API
 ↓
401 / invalid credentials
 ↓
refresh fails
 ↓
DRIVE_REAUTH_REQUIRED
```

The file should remain temporarily available for recovery.

Requester:

```text
Reconnect Google Drive
```

After reconnect:

```text
retry transfer
```

The uploader should not have to re-upload if the temporary retention window is still active.

---

# 78. Failure Example — Drive Rate Limit

```text
Transfer worker
 ↓
429
 ↓
retryable
 ↓
exponential backoff
 ↓
queue delayed
 ↓
retry
```

No duplicate Drive file should be created.

---

# 79. Failure Example — Destination Folder Deleted

```text
Transfer
 ↓
Drive says destination unavailable
 ↓
TRANSFER_BLOCKED
```

Requester sees:

> The destination folder is no longer available. Choose a new Drive folder.

Existing successful files remain untouched.

---

# 80. Failure Example — Browser Disconnect

```text
Browser
 ↓
multipart upload
 ↓
network disconnect
```

Uploader returns:

```text
request page
 ↓
resume upload
```

Only failed/missing parts should need to be uploaded again when the multipart implementation supports resumption.

---

# 81. Failure Example — User Closes Browser After Upload

If R2 upload has completed:

```text
R2 object remains
 ↓
backend state persisted
 ↓
transfer job continues
```

The Drive transfer should continue independently.

---

# 82. Request Token Leakage

Because public request URLs are bearer credentials, the application must reduce accidental leakage.

Avoid putting sensitive token data into:

- analytics event payloads
- logs
- error reports
- referrer headers where possible

Recommended public-page policy:

```text
Referrer-Policy: no-referrer
```

and appropriate cache/security headers.

---

# 83. Browser Security

Public upload page should use:

- HTTPS
- secure headers
- Content Security Policy
- X-Content-Type-Options
- Referrer-Policy
- frame restrictions where appropriate
- secure cookies for authenticated sessions

Do not allow uploaded filenames or request descriptions to create HTML injection.

---

# 84. Filename Security

Original filenames are untrusted input.

Never render them as raw HTML.

Normalize for display/storage metadata.

Reject or safely transform:

```text
../
../../
HTML payloads
control characters
invalid Unicode sequences
```

The actual Drive filename should be sanitized according to Google Drive API behavior and product policy.

---

# 85. MIME Security

Do not trust:

```text
Content-Type: application/pdf
```

alone.

Use:

- browser metadata
- server-side inspection
- file signatures where practical
- malware scanning

For MVP, supported file types should be deliberately limited/configurable.

---

# 86. CORS

R2 upload endpoints should be configured for the production application origin(s) only.

Do not use:

```text
Access-Control-Allow-Origin: *
```

for authenticated or sensitive upload flows unless there is a documented reason.

---

# 87. Caching

Public request metadata can potentially be cached carefully, but request state changes quickly.

Default recommendation:

```text
no-store
```

for personalized/request-sensitive responses.

Uploaded binary objects should not become publicly cacheable.

---

# 88. Database Indexing

Important indexes:

```text
requests.user_id
requests.public_token_hash
requests.status
requests.expires_at

request_items.request_id

submissions.request_id
submissions.status

uploaded_files.submission_id
uploaded_files.status
uploaded_files.drive_file_id

transfer_jobs.status
transfer_jobs.available_at
transfer_jobs.uploaded_file_id

audit_events.user_id
audit_events.request_id
audit_events.created_at
```

---

# 89. Query Principles

Avoid N+1 queries in dashboard views.

Prefer:

```text
request
+ aggregated progress
+ latest submission
```

through efficient queries/views where appropriate.

Do not expose raw internal database structures directly to the UI.

---

# 90. API Pagination

Dashboard and submission lists must be paginated.

Do not return unlimited:

```text
requests
submissions
audit events
```

Use cursor-based pagination where scale warrants it.

---

# 91. Storage Cost Control

Temporary storage is the major variable cost risk.

Control through:

```text
per-file limits
per-submission limits
per-account limits
automatic cleanup
transfer timeout
abandoned upload cleanup
plan-based quotas
```

The system should measure:

```text
bytes_uploaded
bytes_pending
bytes_transferred
bytes_deleted
```

---

# 92. Upload Cost Model

Conceptually:

```text
Uploader
  │
  │ Internet
  ▼
R2
  │
  │ no R2 egress charge
  ▼
Worker
  │
  ▼
Google Drive
```

The product should still monitor bandwidth and worker execution costs.

---

# 93. Scaling Model

The architecture scales horizontally.

### Web

Vercel scales request handling.

### Database

Supabase/Postgres handles persistent state.

### Storage

R2 scales object storage.

### Queue

Cloudflare Queues buffers transfer workload.

### Workers

Multiple workers can process jobs concurrently with controlled concurrency.

### Google Drive

Application-side concurrency must respect Drive API quotas.

---

# 94. Worker Concurrency

Do not maximize concurrency blindly.

Use:

```text
global concurrency
per-Google-user concurrency
per-request concurrency
```

Example concept:

```text
Global: 20
Per Google account: 2
Per request: 3
```

Exact numbers must be load-tested and tuned.

---

# 95. Queue Backpressure Policy

If Google API errors rise:

```text
reduce transfer concurrency
```

If queue depth rises:

```text
increase within safe limits
```

The architecture should eventually support adaptive concurrency.

MVP can use conservative static limits.

---

# 96. Security Logging

Log:

```text
authentication events
Drive connection events
request lifecycle events
public upload abuse events
transfer failures
authorization failures
```

Never log:

```text
OAuth refresh token
access token
raw request token
file contents
storage secret
```

---

# 97. Audit vs Analytics

These are different.

### Audit

Security/workflow record.

Example:

```text
REQUEST_CLOSED
actor=user
request_id=...
timestamp=...
```

### Analytics

Product behavior.

Example:

```text
request_closed
```

Audit data should be durable and controlled.

Analytics data can be sampled/retained differently.

---

# 98. Privacy Architecture

The product should follow data minimization.

Store only:

```text
what is required to run the workflow
```

Do not build a permanent copy of customer files.

Ideal lifecycle:

```text
external file
   ↓
temporary processing
   ↓
customer's Google Drive
   ↓
temporary copy deleted
```

---

# 99. Security Testing

Before launch, test:

### Authentication

- session fixation
- unauthorized access
- account isolation

### Public token

- brute force
- enumeration
- expired token
- revoked token
- token reuse

### Upload

- oversized files
- wrong MIME
- malicious names
- path traversal
- duplicate completion
- parallel uploads

### Authorization

- request A accessing request B
- user A accessing user B
- submission ID manipulation
- destination ID manipulation

### Drive

- revoked OAuth
- expired token
- wrong folder
- folder deleted
- permission removed

---

# 100. Test Architecture

Testing layers:

```text
Unit tests
   ↓
Domain tests
   ↓
API tests
   ↓
Security tests
   ↓
Integration tests
   ↓
End-to-end tests
   ↓
Load tests
```

---

# 101. Critical Automated Tests

At minimum:

```text
create request
create public token
resolve public request
reject invalid token
reject expired request
reject closed request
initialize upload
reject oversized file
complete upload
create transfer job
retry transfer
prevent duplicate transfer
Drive token refresh
Drive transfer success
Drive transfer failure
cross-user access denied
```

---

# 102. End-to-End Test

The most important automated test:

```text
Requester signs in
→ connects Drive
→ creates destination
→ creates request
→ public uploader opens request
→ uploads test file
→ file enters R2
→ transfer worker runs
→ file appears in Drive
→ requester sees completed state
```

This should run against a dedicated test Google account/environment.

---

# 103. Staging

Staging should use:

```text
separate database
separate R2 bucket
separate Google OAuth credentials
separate test Google Drive account
separate email configuration
```

Never allow staging to write into the founder's real Drive.

---

# 104. Production Readiness Gates

Do not launch until:

```text
OAuth verified
        +
Security tests passed
        +
Upload reliability passed
        +
Drive transfer passed
        +
Rate limiting passed
        +
Monitoring active
        +
Backup verified
```

---

# 105. Architecture Tradeoffs

## Why R2 instead of Supabase Storage?

Supabase Storage has strong integration with Postgres and supports resumable uploads through TUS, which makes it a legitimate alternative. citeturn0search4turn0search10

However, this product has a distinctive requirement:

```text
external upload
→ temporary storage
→ Google Drive
```

R2 is attractive because:

- S3 compatibility
- multipart uploads
- direct browser upload
- strong temporary-object workflow
- no egress fees
- Cloudflare edge ecosystem

Therefore R2 is the recommended binary-storage layer.

Supabase remains the recommended application/database layer.

---

# 106. Why Not Store Files in Supabase?

It is technically possible.

However, mixing:

```text
database
+
auth
+
application state
+
large temporary binaries
```

into one provider creates unnecessary coupling.

The recommended split is:

```text
Supabase
→ application state

R2
→ temporary binary state
```

---

# 107. Why Not Use Google Drive as Temporary Storage?

Do not upload an external file directly into Drive before the application has validated the request and file.

Reasons:

- harder abuse control
- harder quarantine
- harder retry semantics
- public upload should not directly control Drive API
- Drive quota consumption becomes tightly coupled to hostile traffic

Use:

```text
R2
→ validate
→ process
→ Drive
```

---

# 108. Why Not Make the Browser Upload Directly to Google Drive?

This would require exposing Google authorization context to an unauthenticated external browser or creating complicated delegated upload flows.

It also couples the external user experience directly to the requester's Drive authorization.

The safer architecture is:

```text
external browser
→ temporary storage
→ trusted backend
→ authorized Drive
```

---

# 109. Why Not Use a Single Server?

A single traditional server could implement the product.

But it would become responsible for:

- uploads
- large-file streaming
- Drive transfers
- queues
- retries
- API
- auth
- notifications

That creates unnecessary operational burden for a no-code/vibe-coded startup.

Managed services allow the founder to focus on product rather than infrastructure.

---

# 110. Why Not Use Microservices?

Do not create separate deployable microservices for:

```text
auth
requests
uploads
Drive
notifications
```

at MVP stage.

Use modular code inside a small number of deployables.

Recommended:

```text
Next.js application
+
Cloudflare Worker/Queue transfer service
```

with clear internal modules.

This provides most of the architectural benefits without microservice overhead.

---

# 111. Recommended Deployment Topology

```text
                     INTERNET
                         │
                         ▼
                 Cloudflare Edge
                         │
             ┌───────────┴───────────┐
             │                       │
             ▼                       ▼
         Vercel                  R2 / Workers
             │                       │
             │                       ├── Uploads
             │                       ├── Queue
             │                       └── Transfers
             │
             ▼
        Next.js App
             │
       ┌─────┴─────┐
       ▼           ▼
   Supabase     Google APIs
   Postgres     Drive
   Auth
```

---

# 112. Source-of-Truth Rules

There are three types of truth.

## Application truth

```text
Supabase
```

## Temporary binary truth

```text
R2
```

## Final customer file truth

```text
Google Drive
```

The system should never confuse these.

---

# 113. State Synchronization

The database records:

```text
drive_file_id
```

as the authoritative link between an application file and its Drive representation.

The application should not repeatedly search the user's Drive to determine whether its own file exists.

Persist the Drive ID immediately after successful creation.

---

# 114. Drive File Metadata

When creating the Drive file, include only necessary metadata.

Recommended:

```text
name
mimeType
parents
```

Potential future metadata:

```text
description
appProperties
```

Do not write sensitive application metadata into Drive unnecessarily.

---

# 115. Drive Folder Selection

MVP UX:

```text
Connect Drive
      ↓
Choose folder
      ↓
Confirm:
"My Drive / Clients / Acme"
```

The application should not automatically index the entire Drive.

Only retrieve enough hierarchy/data for the user to select a destination.

---

# 116. Folder Picker Strategy

Possible approaches:

### Option A

Custom folder browser using Drive API.

### Option B

Google Picker.

The final choice should be validated against the OAuth scope strategy.

The architecture should isolate folder selection so it can switch implementations without changing request logic.

---

# 117. Google Picker Consideration

If Google Picker is used, it should only expose resources the authenticated user can legitimately select.

The browser should not receive broader Drive credentials than necessary.

---

# 118. Public Request Metadata

The public uploader may receive:

```text
request title
request description
requested items
allowed file types
max file size
expiration state
branding
```

Never expose:

```text
owner email unless explicitly intended
Drive folder name
Drive folder ID
other requests
submission history
other uploader identity
internal IDs
```

---

# 119. Public Request Caching

Because request status can change, public request metadata should be fetched dynamically or with very short controlled caching.

If a request is closed, the change should propagate quickly.

---

# 120. Upload Progress

Upload progress should be calculated from actual browser upload state.

Example:

```text
logo.svg
████████████████ 100%

brand.pdf
████████░░░░░░░░ 48%
```

The UI should distinguish:

```text
Uploading
```

from:

```text
Delivering to Google Drive
```

---

# 121. Polling vs Realtime

MVP can use lightweight polling for:

```text
transfer status
submission completion
```

Example:

```text
poll every 2–5 seconds
```

For a later version, use Supabase Realtime or equivalent.

Do not add realtime infrastructure unless it improves the actual UX.

---

# 122. Recommended Realtime Evolution

MVP:

```text
polling
```

Scale:

```text
database event
→ realtime channel
→ browser
```

This keeps MVP simpler.

---

# 123. API Security

All authenticated API requests must validate:

```text
session
user ownership
resource state
input schema
```

Use schema validation with a library such as:

```text
Zod
```

---

# 124. Input Validation

Validate:

- title length
- description length
- item count
- item name length
- file size
- MIME type
- expiration
- destination ID
- uploader fields

Never trust frontend validation.

---

# 125. Secrets Architecture

Secrets belong only in server environments.

```text
Browser
  ✗ Google client secret
  ✗ R2 secret
  ✗ Supabase service key
  ✗ encryption key

Server
  ✓ secrets
```

Public environment variables must contain no privileged credentials.

---

# 126. Encryption

Use encryption:

### In transit

```text
HTTPS/TLS
```

### At rest

Provider-managed encryption for:

- Postgres
- R2
- infrastructure

Sensitive OAuth credentials should have an additional application-level encryption layer where practical.

---

# 127. Encryption Key Management

Do not store an encryption key in the database next to the encrypted credential.

Use platform secret management.

Rotation strategy should be documented before production.

---

# 128. Google OAuth Callback

Conceptual:

```text
/connect/google
       ↓
Google consent
       ↓
/api/google/callback
       ↓
validate state
       ↓
exchange code
       ↓
encrypt credentials
       ↓
save connection
       ↓
redirect to Drive setup
```

Use OAuth `state` to prevent CSRF.

---

# 129. OAuth CSRF Protection

Every OAuth initiation should generate a short-lived state value bound to the authenticated requester/session.

Callback must reject:

- missing state
- mismatched state
- expired state
- reused state

---

# 130. Webhook Strategy

MVP should avoid depending on Google Drive webhooks for core functionality.

The application knows when it creates a file.

Therefore:

```text
successful Drive API response
→ persist Drive file ID
```

is enough for initial delivery.

Drive change notifications can be added later for synchronization features.

---

# 131. Billing Architecture

Billing is not required for the first technical MVP.

But the architecture should reserve:

```text
subscription
plan
usage
```

entities.

Do not allow billing logic to infect request/upload domain logic.

---

# 132. Usage Metering

Track:

```text
requests_created
submissions_received
files_uploaded
bytes_uploaded
bytes_transferred
active_requests
```

Usage events should be immutable where possible.

Billing can aggregate them later.

---

# 133. Plan Enforcement

Example:

```text
Free
→ 3 active requests
→ 1 GB/month

Pro
→ 50 active requests
→ 100 GB/month
```

These are placeholders only.

The actual limits must be validated economically.

---

# 134. Cost Observability

Monitor:

```text
R2 storage
R2 operations
Worker execution
Queue usage
Supabase database
Vercel functions
Email
Sentry
PostHog
Google API usage
```

The product should calculate approximate infrastructure cost per active account.

---

# 135. Scaling Milestones

## 0–100 users

Focus:

- correctness
- security
- observability
- simple architecture

## 100–1,000 users

Focus:

- queue tuning
- database indexes
- upload limits
- Google quota monitoring

## 1,000–10,000 users

Focus:

- worker concurrency
- account-level quotas
- advanced abuse prevention
- database optimization

## 10,000+ users

Evaluate:

- dedicated worker pools
- advanced queue partitioning
- multi-region strategy
- dedicated Google API projects if justified
- more advanced observability

Do not prematurely build for millions of users.

---

# 136. Multi-Tenancy

The application is multi-tenant at the account level.

Every resource must belong to a tenant/user.

Future team support can introduce:

```text
Organization
 ├── Members
 ├── Requests
 ├── Connections
 └── Billing
```

Do not build organization/team complexity into MVP unless customer validation demands it.

---

# 137. Future Multi-Provider Storage

The architecture should eventually support:

```text
DriveAdapter
DropboxAdapter
OneDriveAdapter
BoxAdapter
S3Adapter
```

Core domain:

```text
Request
→ Destination
→ StorageAdapter
```

MVP:

```text
StorageAdapter = GoogleDrive
```

---

# 138. Future Workflow Engine

Do not build a generic workflow engine now.

Future:

```text
Request created
→ wait
→ reminder
→ submission
→ notify
→ approval
```

For MVP, use explicit application logic.

---

# 139. Future Templates

Templates should eventually be represented as:

```text
RequestTemplate
 ├── title
 ├── description
 ├── request_items
 └── default_settings
```

Templates should instantiate normal Requests.

Do not create a separate execution model.

---

# 140. Future Integrations

Integration architecture:

```text
Domain event
    ↓
Event bus / webhook layer
    ↓
Integration adapters
```

Examples:

```text
request.completed
submission.completed
file.transferred
```

Potential consumers:

```text
Slack
Zapier
Make
Gmail
Teams
```

MVP does not need this infrastructure.

---

# 141. Domain Events

Even if a full event bus is not implemented, important events should have explicit names:

```text
RequestCreated
RequestActivated
SubmissionStarted
FileUploaded
FileTransferred
SubmissionCompleted
TransferFailed
DriveReauthRequired
```

This will make future automation easier.

---

# 142. Architecture Invariants

These must never be violated.

### Invariant 1

Public uploader never receives Drive credentials.

### Invariant 2

Public uploader never gets Drive listing access.

### Invariant 3

Files are not considered finally delivered until Drive transfer succeeds.

### Invariant 4

Drive transfer is asynchronous.

### Invariant 5

Drive transfer is retryable.

### Invariant 6

Drive transfer is idempotent.

### Invariant 7

Temporary files have an expiration/cleanup path.

### Invariant 8

Every authenticated resource is tenant-isolated.

### Invariant 9

Every public upload is subject to quotas and abuse controls.

### Invariant 10

Secrets never enter client-side code or logs.

---

# 143. Critical Technical Proofs

Before building the full UI, validate:

```text
POC-01 Google OAuth
POC-02 Drive folder access
POC-03 drive.file scope feasibility
POC-04 anonymous request token
POC-05 direct R2 upload
POC-06 multipart upload
POC-07 R2 → Drive transfer
POC-08 Drive resumable upload
POC-09 OAuth token refresh
POC-10 transfer retry
POC-11 idempotent transfer
POC-12 cleanup after transfer
POC-13 rate limiting
POC-14 cross-account isolation
```

These proofs have higher priority than visual polish.

---

# 144. Architecture Validation Order

The build should proceed in this order:

```text
1. Google OAuth feasibility
2. Google Drive folder/file API
3. R2 upload
4. R2 → Drive streaming
5. queue/retry
6. database state machine
7. security isolation
8. public upload UX
9. requester dashboard
10. notifications
11. analytics
12. billing
```

This order reduces the risk of building a beautiful UI around an unproven backend.

---

# 145. Recommended Build Stack

Final recommended stack:

```text
Frontend:
Next.js
TypeScript
React
Tailwind
shadcn/ui

Backend:
Next.js server-side application layer

Database:
Supabase PostgreSQL

Auth:
Supabase Auth

Temporary storage:
Cloudflare R2

Upload:
R2 presigned URLs
R2 multipart uploads

Background:
Cloudflare Workers
Cloudflare Queues

Destination:
Google Drive API

Email:
Resend

Analytics:
PostHog

Error monitoring:
Sentry

Hosting:
Vercel

DNS / Edge:
Cloudflare

Repository:
GitHub
```

---

# 146. Alternative Stack

If the selected no-code tool has excellent native Supabase integration but poor Cloudflare integration, an alternative is:

```text
Next.js
+
Supabase Auth
+
Supabase Postgres
+
Supabase Storage
+
Supabase Edge Functions
+
Google Drive API
```

Supabase Storage currently supports resumable uploads through TUS, particularly for large files and unstable networks. citeturn0search4

This is simpler operationally but should be cost-tested against the R2 design before production.

---

# 147. Stack Decision Rule

Use the R2 architecture if:

- large uploads matter
- low egress cost matters
- Cloudflare integration is easy in the chosen development environment
- direct multipart upload is reliable

Use Supabase Storage if:

- simplicity materially accelerates development
- expected file volume is initially low
- the selected no-code platform integrates substantially better with Supabase
- upload performance remains acceptable

Do not choose a provider based only on popularity.

Choose based on:

```text
reliability
+
security
+
developer experience
+
cost
+
no-code compatibility
```

---

# 148. Final Architecture

The intended production architecture is:

```text
                         ┌───────────────────────┐
                         │       REQUESTER       │
                         │   Google Sign-in      │
                         └───────────┬───────────┘
                                     │
                                     ▼
                         ┌───────────────────────┐
                         │      NEXT.JS APP      │
                         │                       │
                         │ Dashboard             │
                         │ Request Builder       │
                         │ Request Detail        │
                         │ Public Upload UI      │
                         └───────────┬───────────┘
                                     │
                      ┌──────────────┼──────────────┐
                      │              │              │
                      ▼              ▼              ▼
                 Supabase       Google OAuth     R2 API
                 Postgres            │              │
                 Auth                │              │
                      │              │              │
                      │              ▼              │
                      │        Google Drive         │
                      │              ▲              │
                      │              │              │
                      └──────────────┼──────────────┘
                                     │
                                     ▼
                            Cloudflare Queue
                                     │
                                     ▼
                            Transfer Worker
                                     │
                              ┌──────┴──────┐
                              │             │
                              ▼             ▼
                             R2        Google Drive
                          temporary       final
                           object        destination
```

The key architectural separation is:

```text
APPLICATION STATE
      ↓
  Supabase

TEMPORARY FILE STATE
      ↓
     R2

FINAL FILE STATE
      ↓
Google Drive
```

This separation gives the product a strong foundation without introducing unnecessary microservices.

---

# 149. Final Architecture Principle

The system should be engineered around one invariant:

> **A public upload should be easy for the sender, controlled by the application, durable enough to survive transient failures, and ultimately delivered to the requester's Google Drive without exposing the Drive itself.**

Everything else is implementation detail.

The core loop remains:

```text
CREATE REQUEST
      ↓
GENERATE SECURE LINK
      ↓
EXTERNAL UPLOAD
      ↓
TEMPORARY STORAGE
      ↓
VALIDATE
      ↓
QUEUE
      ↓
TRANSFER
      ↓
GOOGLE DRIVE
      ↓
CONFIRM
      ↓
CLEAN UP
```

That is the architecture the rest of the project should be built around.
