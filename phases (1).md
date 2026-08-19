# PHASES — Intake

**Document:** Production Build & Validation Roadmap  
**Product:** Intake  
**Version:** 1.0  
**Date:** 2026-08-18  
**Status:** Master execution plan

---

# 0. How To Use This Document

This is the execution roadmap for turning the product from an idea into a production-ready SaaS.

The project must not be built as one giant AI/no-code generation task.

The required execution model is:

```text
Phase
  ↓
Goal
  ↓
Tasks
  ↓
Verification
  ↓
Acceptance Gate
  ↓
Memory / Documentation Update
  ↓
Next Phase
```

A phase is complete only when its acceptance gate passes.

The most important rule:

> **Do not move forward merely because the UI looks finished. Move forward when the underlying product behavior has been proven.**

---

# 1. Master Roadmap

```text
PHASE 0  → Project Initialization
PHASE 1  → Market + Competitive Validation
PHASE 2  → Technical Feasibility / Google Validation
PHASE 3  → Architecture + Stack Lock
PHASE 4  → Design System + UX
PHASE 5  → Infrastructure Foundation
PHASE 6  → Authentication + Google Drive Connection
PHASE 7  → Request Domain
PHASE 8  → Public Request Experience
PHASE 9  → Upload Infrastructure
PHASE 10 → R2 → Google Drive Transfer Pipeline
PHASE 11 → Reliability + Failure Recovery
PHASE 12 → Security + Abuse Prevention
PHASE 13 → Notifications + Product Analytics
PHASE 14 → Requester Dashboard + Polish
PHASE 15 → End-to-End QA + Performance
PHASE 16 → Production Hardening
PHASE 17 → Private Beta
PHASE 18 → Launch
PHASE 19 → Post-Launch Iteration
```

---

# 2. Critical Path

The highest-risk technical path is:

```text
Google OAuth
    ↓
Drive authorization
    ↓
Folder selection
    ↓
Anonymous request
    ↓
External upload
    ↓
Temporary storage
    ↓
Background job
    ↓
Google Drive transfer
    ↓
Retry
    ↓
Verification
```

This path must be proven before spending significant time on advanced UI, templates, AI, integrations, or growth features.

---

# 3. Phase 0 — Project Initialization

## Objective

Create the project foundation and make every future AI/no-code implementation operate from the same source of truth.

## Tasks

### 0.1 Repository

Create:

```text
Git repository
```

Recommended structure:

```text
/app
/components
/lib
/domain
/integrations
/workers
/db
/tests
/docs
```

Exact structure may change after stack validation.

### 0.2 Project artifacts

Ensure these exist:

```text
prd.md
architecture.md
rules.md
phases.md
design.md
memory.md
```

### 0.3 Development environments

Define:

```text
development
staging
production
```

### 0.4 Coding conventions

Define:

- TypeScript rules
- naming conventions
- component conventions
- API conventions
- database conventions
- error conventions
- Git conventions

### 0.5 AI-agent workflow

Define a standard prompt sequence:

```text
Read project docs
→ inspect current implementation
→ identify task
→ implement only requested scope
→ run checks
→ report changes
→ report remaining issues
```

## Acceptance Gate

- [ ] Repository exists.
- [ ] Core documentation exists.
- [ ] Development workflow works.
- [ ] AI coding agent can understand project context.
- [ ] No production secrets exist locally or in Git.

---

# 4. Phase 1 — Market + Competitive Validation

## Objective

Prove that the problem is real, understand existing solutions, and identify the product's strongest differentiation.

The category is not empty.

Existing products already provide Google Drive file-request/upload functionality, including cloudHQ's File Request for Google Drive and other upload-oriented products.

Therefore the objective is not:

> "Find out whether anyone has built this."

It is:

> **Determine why someone would choose our product instead.**

---

## 4.1 Competitor Research

Research:

- cloudHQ File Request for Google Drive
- FileDrop
- FileChute
- Google Forms
- Dropbox File Requests
- Google Drive shared-folder workflows
- other Google Workspace Marketplace products
- emerging 2026 competitors

For each competitor capture:

```text
product
website
pricing
free plan
upload limits
storage model
Google integration
request/checklist functionality
branding
notifications
templates
analytics
team features
reviews
complaints
UX quality
target customer
estimated traction where reliably available
```

---

## 4.2 Customer Pain Research

Research conversations from:

- Google Drive Community
- Reddit
- Google Workspace communities
- freelancer communities
- agency communities
- accountant communities
- recruiter communities
- small business communities

Search for actual complaints such as:

```text
"please send me files"
"Google Drive file request"
"upload files to my Google Drive"
"client upload Google Drive"
"request documents from client"
"Google Drive external upload"
"Dropbox file request alternative"
```

---

## 4.3 Identify the Wedge

Test these hypotheses:

### Hypothesis A

Simple anonymous Drive upload.

### Hypothesis B

Checklist-based file requests.

### Hypothesis C

Professional recurring workflows.

### Hypothesis D

Beautiful external uploader UX.

### Hypothesis E

Reliable automatic organization in Drive.

The strongest combination is expected to be:

```text
Request
+
Checklist
+
External upload
+
Drive delivery
```

---

## Acceptance Gate

Do not proceed until:

- [ ] At least 5 serious competitors have been analyzed.
- [ ] At least 3 major customer segments have been analyzed.
- [ ] Competitor weaknesses are documented.
- [ ] Initial USP is explicitly defined.
- [ ] At least 10–20 real-world pain examples have been collected.
- [ ] The team can answer "Why us?" in one sentence.

---

# 5. Phase 2 — Technical Feasibility / Google Validation

## Objective

Prove the hardest technical assumptions before building the full application.

This phase is more important than UI development.

---

# 5.1 Google OAuth Proof

Test:

```text
Google login
→ OAuth consent
→ callback
→ token storage
→ refresh
```

Determine:

- required scopes
- `drive.file` feasibility
- folder selection feasibility
- token refresh behavior
- revoked-token behavior
- Google verification requirements
- Workspace restrictions

---

# 5.2 Drive Folder Proof

Create a test Google account.

Verify:

```text
Connect Drive
→ list/select destination folder
→ persist folder ID
```

Do not use the founder's primary Drive for development.

---

# 5.3 Drive File Creation Proof

Test:

```text
Authorized account
→ selected folder
→ create file
→ retrieve file ID
→ verify file exists
```

---

# 5.4 External Upload Proof

Create:

```text
public request token
```

Then from a browser without Google authentication:

```text
open link
→ upload file
```

Verify the external browser never receives Drive credentials.

---

# 5.5 R2 Proof

Test:

```text
browser
→ R2
```

for:

- small file
- medium file
- large file
- failed upload
- retry
- multipart upload

Cloudflare's current R2 documentation recommends single PUT uploads for small/medium objects and multipart uploads when large files or resumability are important. Multipart uploads support up to 10,000 parts and objects up to 5 TiB. citeturn0search0turn0search5

---

# 5.6 R2 → Drive Proof

Test:

```text
R2 object
→ worker
→ Google Drive
```

Do not load the whole object into memory.

Verify streaming/bounded transfer.

---

# 5.7 Queue Proof

Test:

```text
API
→ Queue
→ Worker
→ Drive
```

Cloudflare Queues currently support guaranteed delivery, retries, delays, batching, and dead-letter queues, making them appropriate for the transfer pipeline. citeturn0search9turn0search3

---

# 5.8 Retry Proof

Simulate:

```text
Google 429
Google 500
network failure
expired access token
destination deleted
```

Verify correct classification.

---

# 5.9 Idempotency Proof

Run the same transfer twice.

Expected:

```text
1 Drive file
```

not:

```text
2 Drive files
```

---

## Acceptance Gate

The phase passes only when the following real end-to-end proof works:

```text
Google login
→ Drive connection
→ folder selection
→ public request
→ anonymous upload
→ R2
→ queue
→ worker
→ Drive
```

And:

- [ ] OAuth refresh works.
- [ ] Revocation is handled.
- [ ] R2 upload works.
- [ ] Multipart upload works.
- [ ] Drive transfer works.
- [ ] Retry works.
- [ ] Duplicate transfer is prevented.
- [ ] External uploader has no Drive access.

If any critical proof fails, remain in this phase.

---

# 6. Phase 3 — Architecture + Stack Lock

## Objective

Freeze the production architecture after technical validation.

---

## 6.1 Recommended stack

```text
Next.js
TypeScript
React
Tailwind
shadcn/ui

Supabase
  ├── PostgreSQL
  └── Auth

Cloudflare
  ├── R2
  ├── Workers
  └── Queues

Google Drive API
Resend
PostHog
Sentry
Vercel
GitHub
```

---

## 6.2 Validate Alternatives

Compare:

### Option A

```text
Supabase Storage
```

versus:

### Option B

```text
Cloudflare R2
```

Supabase Storage supports resumable uploads through TUS, so it remains a legitimate simpler alternative. citeturn0search0

Final choice should be based on:

```text
reliability
cost
no-code compatibility
large-file handling
developer experience
operational complexity
```

---

## 6.3 Architecture Freeze

Document:

- services
- database
- storage
- queue
- API
- auth
- Drive integration
- environments
- secrets
- monitoring

---

## Acceptance Gate

- [ ] Stack selected.
- [ ] Architecture documented.
- [ ] Major alternatives evaluated.
- [ ] No unresolved critical architecture decision remains.
- [ ] All major provider assumptions have evidence.

---

# 7. Phase 4 — Design System + UX

## Objective

Design the complete user experience before implementing the majority of the interface.

---

# 7.1 Design Principles

```text
Minimal
Fast
Professional
Trustworthy
Clear
Low friction
```

---

# 7.2 Primary User Flow

```text
Landing
→ Sign in
→ Connect Drive
→ Select folder
→ Create request
→ Add requirements
→ Generate link
→ Copy link
```

---

# 7.3 Public Flow

```text
Open link
→ Understand request
→ Select files
→ Upload
→ Submit
→ Confirmation
```

---

# 7.4 Requester Dashboard

Design:

- request list
- progress
- statuses
- create request CTA
- latest submissions
- Drive destination

---

# 7.5 Request Builder

Design:

```text
Title
Description
Requested files
Required/optional
File rules
Destination
Expiration
```

Primary goal:

> Create a useful request quickly.

---

# 7.6 Public Upload Page

This is a critical differentiator.

Design mobile-first.

Must clearly show:

```text
What is needed
What is missing
What has uploaded
What is processing
What is complete
```

---

# 7.7 States

Design all states before coding:

```text
loading
empty
active
paused
expired
closed
uploading
processing
success
partial failure
fatal error
Drive reauth required
```

---

## Acceptance Gate

- [ ] Core screens designed.
- [ ] Mobile layout designed.
- [ ] Empty/error states designed.
- [ ] Upload states designed.
- [ ] Design system documented.
- [ ] UX has been tested with at least a few target users or realistic walkthroughs.

---

# 8. Phase 5 — Infrastructure Foundation

## Objective

Create the production-grade technical foundation.

---

## Tasks

### 8.1 Vercel

Configure:

```text
development
preview
production
```

### 8.2 Supabase

Create:

```text
development DB
staging DB
production DB
```

### 8.3 R2

Create:

```text
development bucket
staging bucket
production bucket
```

### 8.4 Queue

Create transfer queue.

Configure retry/dead-letter behavior.

### 8.5 Cloudflare

Configure:

- DNS
- HTTPS
- WAF
- R2
- Workers

### 8.6 Monitoring

Configure:

```text
Sentry
PostHog
structured logs
```

---

## Acceptance Gate

- [ ] All environments deploy.
- [ ] Database connection works.
- [ ] R2 works.
- [ ] Queue works.
- [ ] Secrets are configured.
- [ ] Monitoring receives a test event.
- [ ] No production secret exists in source code.

---

# 9. Phase 6 — Authentication + Google Drive Connection

## Objective

Build the authenticated requester foundation.

---

## 9.1 Authentication

Implement:

```text
Google Sign-in
session
logout
account
```

---

## 9.2 Drive Connection

Implement:

```text
Connect Drive
OAuth
callback
token storage
refresh
disconnect
reauth
```

---

## 9.3 Folder Selection

Implement:

```text
select destination folder
```

MVP should prioritize:

```text
My Drive
```

Shared Drives can follow after core reliability is proven.

---

## 9.4 Connection Health

Show:

```text
Connected
Needs reconnection
Disconnected
```

---

## Acceptance Gate

- [ ] Google sign-in works.
- [ ] Drive connection works.
- [ ] Folder selection works.
- [ ] Tokens are securely handled.
- [ ] Token refresh works.
- [ ] Revocation is handled.
- [ ] Wrong account cannot access another account's data.

---

# 10. Phase 7 — Request Domain

## Objective

Build the core business object.

---

# 10.1 Database

Implement:

```text
requests
request_items
drive_destinations
```

with proper relationships and RLS.

---

# 10.2 Request Creation

Implement:

```text
title
description
destination
items
required/optional
file constraints
expiration
```

---

# 10.3 Request Lifecycle

Implement:

```text
DRAFT
ACTIVE
PAUSED
EXPIRED
CLOSED
```

Server-side state validation is mandatory.

---

# 10.4 Public Token

Implement:

```text
secure random token
token hashing
lookup
expiration
revocation
```

---

# 10.5 Request Builder

Build the UI only after backend behavior works.

---

## Acceptance Gate

- [ ] Request can be created.
- [ ] Request items can be added.
- [ ] Request can activate.
- [ ] Public token works.
- [ ] Request can pause.
- [ ] Request can resume.
- [ ] Request can close.
- [ ] Expiration works.
- [ ] Invalid state transitions are rejected.

---

# 11. Phase 8 — Public Request Experience

## Objective

Build the external user experience without requiring Drive access.

---

# 11.1 Public Request Resolution

Implement:

```text
/r/:token
```

Flow:

```text
token
→ hash
→ database
→ validate
→ render request
```

---

# 11.2 Public Information

Show only:

```text
title
description
requested items
constraints
expiration state
branding
```

Do not expose Drive details.

---

# 11.3 Uploader Fields

Implement optional:

```text
name
email
```

---

# 11.4 Submission

Create:

```text
submission
```

with lifecycle:

```text
STARTED
UPLOADING
PROCESSING
COMPLETED
FAILED
```

---

## Acceptance Gate

- [ ] Public page works without login.
- [ ] Invalid token rejected.
- [ ] Expired token rejected.
- [ ] Closed request rejected.
- [ ] Requester Drive information hidden.
- [ ] Submission can be created.
- [ ] Mobile UX works.

---

# 12. Phase 9 — Upload Infrastructure

## Objective

Build reliable browser-to-temporary-storage uploads.

---

# 12.1 Upload Initialization

Flow:

```text
browser
→ initialize upload
→ backend validation
→ UploadedFile record
→ R2 upload authorization
```

---

# 12.2 Small Files

Use simple direct upload where appropriate.

---

# 12.3 Large Files

Use multipart/resumable uploads.

Cloudflare's current documentation recommends multipart uploads for large files or when resumability is important, with failed parts able to retry independently. citeturn0search0

---

# 12.4 Upload Progress

Track real progress.

Show:

```text
uploading
uploaded
processing
```

---

# 12.5 Verification

After browser upload:

```text
verify object
→ size
→ metadata
→ state
```

---

# 12.6 Cleanup

Implement:

```text
abandoned upload cleanup
multipart abort
lifecycle expiration
```

Cloudflare documents automatic cleanup of incomplete multipart uploads after seven days by default, while allowing custom lifecycle policies. citeturn0search4

---

## Acceptance Gate

- [ ] Small upload works.
- [ ] Large upload works.
- [ ] Multipart upload works.
- [ ] Upload progress is real.
- [ ] Browser refresh/retry behavior is acceptable.
- [ ] Invalid files are rejected.
- [ ] Upload quotas work.
- [ ] Abandoned uploads are cleaned.

---

# 13. Phase 10 — R2 → Google Drive Transfer Pipeline

## Objective

Build the most important backend workflow.

---

# 13.1 Transfer Job

Create:

```text
TransferJob
```

with:

```text
QUEUED
PROCESSING
RETRYING
SUCCEEDED
FAILED
DEAD_LETTER
```

---

# 13.2 Queue

Implement:

```text
UploadedFile
→ TransferJob
→ Cloudflare Queue
```

---

# 13.3 Worker

Worker:

```text
receive job
→ validate
→ obtain Google token
→ stream R2
→ upload Drive
→ verify
→ persist Drive ID
→ cleanup
```

---

# 13.4 Drive Upload

Use Drive's appropriate upload mechanism, preferring resumable transfer behavior for large files.

---

# 13.5 Idempotency

Implement:

```text
if drive_file_id exists:
    do not create duplicate
```

---

# 13.6 Retry

Implement:

```text
transient
→ retry
```

and:

```text
permanent
→ failure requiring action
```

---

# 13.7 Cleanup

On successful transfer:

```text
Drive confirmed
→ delete R2 object
```

---

## Acceptance Gate

The following must work repeatedly:

```text
Upload
→ R2
→ Queue
→ Worker
→ Drive
```

And:

- [ ] Drive file appears in correct folder.
- [ ] Drive ID is stored.
- [ ] Worker survives browser closure.
- [ ] Retry works.
- [ ] Duplicate transfer is prevented.
- [ ] R2 object is deleted after success.
- [ ] Failed transfer remains recoverable.

---

# 14. Phase 11 — Reliability + Failure Recovery

## Objective

Turn the happy path into a dependable production system.

---

# 14.1 Failure Matrix

Test:

```text
browser closes
browser refreshes
network disconnect
R2 failure
R2 timeout
Google 401
Google 403
Google 404
Google 429
Google 500
worker restart
queue retry
destination deleted
destination permission removed
duplicate completion
duplicate transfer
```

---

# 14.2 State Recovery

Every interrupted operation must have a recoverable state.

Never leave:

```text
PROCESSING
```

forever.

---

# 14.3 Retry Policy

Implement:

```text
exponential backoff
jitter
max attempts
dead-letter
```

---

# 14.4 User Recovery

Examples:

### Drive authorization

```text
Reconnect Google Drive
```

### Destination missing

```text
Choose a new folder
```

### Temporary transfer failure

```text
We're retrying automatically.
```

### Permanent failure

```text
We couldn't deliver this file.
Retry / choose action.
```

---

## Acceptance Gate

- [ ] No known failure leaves permanent ambiguous state.
- [ ] All retryable failures retry.
- [ ] Non-retryable failures surface clearly.
- [ ] User recovery works.
- [ ] Dead-letter jobs can be diagnosed.
- [ ] No duplicate Drive files occur.

---

# 15. Phase 12 — Security + Abuse Prevention

## Objective

Harden the public upload system before real users can abuse it.

---

# 15.1 Authentication Security

Test:

- session handling
- OAuth state
- token refresh
- logout
- account isolation

---

# 15.2 Authorization

Test:

```text
User A → User B request
User A → User B submission
User A → User B files
```

All must fail.

---

# 15.3 Public Token Security

Test:

- random token
- brute force resistance
- enumeration
- expiry
- revocation
- leakage prevention

---

# 15.4 Upload Security

Test:

- oversized file
- invalid MIME
- dangerous filename
- malformed upload
- excessive file count
- excessive total size
- repeated requests

---

# 15.5 Abuse

Implement:

```text
rate limits
quotas
request expiration
account limits
risk challenges
abuse monitoring
```

---

# 15.6 Malware

Integrate the chosen malware-scanning strategy if required for public production launch.

---

# 15.7 Security Headers

Configure and test:

```text
CSP
HSTS
X-Content-Type-Options
Referrer-Policy
frame restrictions
```

---

## Acceptance Gate

- [ ] Cross-account security tests pass.
- [ ] Public token security passes.
- [ ] Upload abuse controls work.
- [ ] Rate limiting works.
- [ ] Secrets are protected.
- [ ] Security headers are configured.
- [ ] Malware strategy is implemented or launch-blocking limitation is explicitly resolved.

---

# 16. Phase 13 — Notifications + Product Analytics

## Objective

Add the minimum operational communication layer.

---

# 16.1 Email

Implement:

```text
submission completed
transfer failure requiring action
```

Optional:

```text
request expiration reminder
```

---

# 16.2 Notification State

Track:

```text
PENDING
SENT
FAILED
```

---

# 16.3 Idempotency

Prevent duplicate emails from job retries.

---

# 16.4 Analytics

Implement:

```text
user_signed_up
drive_connected
request_created
request_link_copied
request_viewed
submission_started
upload_started
upload_completed
drive_transfer_completed
submission_completed
request_expired
```

---

# 16.5 Metrics

Dashboard:

```text
activation
request creation
submission rate
transfer success
retention
```

---

## Acceptance Gate

- [ ] Email works.
- [ ] Duplicate emails are prevented.
- [ ] Analytics events work.
- [ ] Sensitive data is not sent to analytics.
- [ ] North-star metric is measurable.

---

# 17. Phase 14 — Requester Dashboard + Product Polish

## Objective

Turn the functional system into a polished product.

---

# 17.1 Dashboard

Implement:

```text
requests
status
progress
latest activity
create request
```

---

# 17.2 Request Detail

Show:

```text
progress
missing items
received items
submissions
Drive destination
request link
```

---

# 17.3 Submission Detail

Show:

```text
uploader
files
status
Drive status
timestamp
```

---

# 17.4 UX Polish

Improve:

- loading
- empty states
- errors
- transitions
- keyboard accessibility
- mobile layout
- responsive behavior

---

# 17.5 Request Creation Speed

Target:

```text
first request
→ completed in a few minutes
```

Experienced user:

```text
new request
→ link
```

in roughly one minute or less.

---

## Acceptance Gate

- [ ] Dashboard is coherent.
- [ ] Request lifecycle is understandable.
- [ ] Missing files are obvious.
- [ ] Mobile behavior is good.
- [ ] Accessibility basics pass.
- [ ] Product feels coherent rather than prototype-like.

---

# 18. Phase 15 — End-to-End QA + Performance

## Objective

Test the product as a complete system.

---

# 18.1 End-to-End Test

Run:

```text
Google login
→ Drive connection
→ folder selection
→ request creation
→ public link
→ external upload
→ R2
→ queue
→ Drive
→ dashboard
→ email
```

---

# 18.2 Browser Matrix

Test:

```text
Chrome
Safari
Firefox
Edge
iOS Safari
Android Chrome
```

---

# 18.3 Network Matrix

Test:

```text
fast Wi-Fi
slow Wi-Fi
mobile network
temporary disconnect
high latency
```

---

# 18.4 File Matrix

Test:

```text
tiny text file
PDF
DOCX
JPG
PNG
ZIP
large video
large archive
invalid file
duplicate filename
Unicode filename
very long filename
```

---

# 18.5 Concurrency

Test:

```text
multiple files
multiple submissions
multiple requests
multiple users
```

---

# 18.6 Performance

Measure:

```text
public page load
upload initialization
upload throughput
Drive transfer latency
queue delay
dashboard load
database query latency
```

---

## Acceptance Gate

- [ ] End-to-end tests pass.
- [ ] Major browsers pass.
- [ ] Mobile passes.
- [ ] Large files pass within product limits.
- [ ] Concurrency is acceptable.
- [ ] No critical performance bottleneck remains.

---

# 19. Phase 16 — Production Hardening

## Objective

Prepare the actual production environment.

---

# 19.1 Infrastructure

Verify:

```text
production database
production R2
production queue
production Worker
production Vercel
production domain
```

---

# 19.2 Secrets

Verify:

- no secrets in Git
- environment variables correct
- rotation procedure exists
- staging credentials separated

---

# 19.3 Database

Verify:

- migrations
- indexes
- RLS
- backups
- recovery

---

# 19.4 Monitoring

Verify:

```text
Sentry
PostHog
logs
queue monitoring
Drive transfer monitoring
```

---

# 19.5 Alerts

Create alerts for:

```text
high Drive failure rate
high upload failure rate
queue backlog
database errors
authentication errors
abuse spike
worker errors
```

---

# 19.6 Legal / Trust

Prepare:

```text
Privacy Policy
Terms of Service
Cookie/analytics disclosure where required
Data retention policy
Account deletion policy
```

---

# 19.7 Google Launch Requirements

Verify current Google requirements for:

- OAuth consent
- verification
- requested scopes
- application branding
- production publishing
- restricted scopes/security assessment if applicable

Do not launch broadly before resolving applicable requirements.

---

## Acceptance Gate

Production is technically deployable only when:

- [ ] Monitoring works.
- [ ] Backups work.
- [ ] Secrets are secure.
- [ ] Google authorization requirements are resolved.
- [ ] Legal pages exist.
- [ ] Recovery procedures exist.
- [ ] Production smoke tests pass.

---

# 20. Phase 17 — Private Beta

## Objective

Test with real users before public launch.

---

# 20.1 Beta Target

Start with approximately:

```text
10–30 users
```

from:

- freelancers
- agencies
- accountants
- recruiters
- consultants
- small businesses

Prioritize users who repeatedly collect files.

---

# 20.2 Beta Instrumentation

Measure:

```text
sign-up
Drive connection
request creation
link sharing
submission
successful Drive transfer
repeat request
```

---

# 20.3 Qualitative Feedback

Ask:

1. What were you trying to collect?
2. How did you previously collect it?
3. Was anything confusing?
4. Did the uploader understand what to do?
5. Did files reach the correct Drive folder?
6. Did you have to follow up with the uploader?
7. Would you use this again?
8. Would you pay for it?
9. What would make this indispensable?

---

# 20.4 Observe Behavior

Do not rely only on what users say.

Look for:

```text
Do they create multiple requests?
Do they return?
Do they send links?
Do recipients complete uploads?
```

---

# 20.5 Beta Success Criteria

Potential targets:

```text
High first-request completion
High successful transfer rate
Low critical failure rate
Multiple requests per activated user
Positive willingness-to-pay signal
```

Exact numeric thresholds should be chosen after baseline data exists.

---

# 21. Phase 18 — Launch

## Objective

Launch publicly with a narrow, clear message.

---

# 21.1 Launch Positioning

Primary:

> **Request files directly into Google Drive.**

Secondary:

> **Send one link. They upload. Everything lands in your Drive.**

---

# 21.2 Launch Website

Required:

```text
Hero
Problem
How it works
Example request
Uploader experience
Security/trust
Pricing
FAQ
CTA
```

---

# 21.3 Launch Channels

Potential channels:

```text
Product Hunt
Google Workspace communities
freelancer communities
agency communities
Reddit where promotion is permitted
SEO
direct outreach
content marketing
small business communities
```

---

# 21.4 SEO

Target real intent:

```text
Google Drive file request
Google Drive request files
Google Drive upload link
upload files to my Google Drive
client upload Google Drive
Google Drive external upload
Google Drive file request alternative
```

---

# 21.5 Launch Monitoring

During launch watch:

```text
signups
OAuth failures
request creation
upload failures
Drive transfer failures
queue depth
abuse
cost
support issues
```

---

## Acceptance Gate

- [ ] Production stable.
- [ ] No critical security issue.
- [ ] Core workflow reliable.
- [ ] Support process exists.
- [ ] Pricing active if monetizing.
- [ ] Analytics active.
- [ ] Launch messaging is clear.

---

# 22. Phase 19 — Post-Launch Iteration

## Objective

Turn actual usage into product decisions.

Do not immediately build every requested feature.

---

# 22.1 Weekly Review

Review:

```text
activation
successful collections
failed transfers
repeat requests
retention
support
revenue
cost
```

---

# 22.2 Identify Bottleneck

Ask:

```text
Where does the funnel lose users?
```

Example:

```text
Signup
  ↓ 90%
Drive connect
  ↓ 60%
Request creation
  ↓ 80%
Link shared
  ↓ 40%
Submission
```

If link sharing is the problem, do not build AI.

Fix onboarding or request creation.

---

# 22.3 Feature Prioritization

Prioritize features using:

```text
customer pain
frequency
revenue impact
retention impact
implementation cost
risk
```

---

# 22.4 Likely Next Features

Only after validation:

```text
request templates
automatic reminders
custom branding
custom domains
team collaboration
recurring requests
Gmail integration
Slack integration
Zapier/Make
shared drives
```

---

# 23. Feature Expansion Roadmap

## Stage A — Core Product

```text
Google Drive
+
Request
+
Checklist
+
Upload
+
Transfer
```

## Stage B — Retention

```text
Templates
+
Reminders
+
Recurring requests
+
Better notifications
```

## Stage C — Professionalization

```text
Branding
+
Custom domain
+
Teams
+
Client workflows
```

## Stage D — Integrations

```text
Gmail
Slack
Teams
Zapier
Make
Webhooks
```

## Stage E — Storage Expansion

```text
Dropbox
OneDrive
Box
S3
```

## Stage F — Intelligence

Only after validated demand:

```text
document classification
smart naming
OCR
missing-document detection
workflow suggestions
```

---

# 24. Phase Dependencies

The project must respect these dependencies:

```text
Phase 0
  ↓
Phase 1
  ↓
Phase 2
  ↓
Phase 3
  ↓
Phase 4
  ↓
Phase 5
  ↓
Phase 6
  ↓
Phase 7
  ↓
Phase 8
  ↓
Phase 9
  ↓
Phase 10
  ↓
Phase 11
  ↓
Phase 12
  ↓
Phase 13
  ↓
Phase 14
  ↓
Phase 15
  ↓
Phase 16
  ↓
Phase 17
  ↓
Phase 18
  ↓
Phase 19
```

Some work can happen in parallel, but no phase should bypass a critical dependency.

---

# 25. Parallel Workstreams

The following can be developed in parallel after Phase 3:

```text
UX design
database foundation
infrastructure
OAuth POC
upload POC
marketing research
```

But the final integration must follow the architecture.

---

# 26. Recommended AI Coding Workflow Per Phase

For every phase:

## Step 1 — Context

Give the AI agent:

```text
prd.md
architecture.md
rules.md
phases.md
design.md
memory.md
```

plus the current task.

## Step 2 — Inspect

Tell it:

```text
Inspect the existing implementation first.
Do not modify anything yet.
Report relevant files, dependencies, current behavior, and risks.
```

## Step 3 — Plan

Require:

```text
implementation plan
files to change
database changes
security implications
tests
```

## Step 4 — Implement

Only then allow code changes.

## Step 5 — Verify

Run:

```text
lint
typecheck
tests
build
```

plus manual verification.

## Step 6 — Review

Ask the AI:

```text
Review your own implementation against rules.md and architecture.md.
Identify violations and fix them.
```

## Step 7 — Memory

Update:

```text
memory.md
```

with:

```text
completed
current state
known issues
next step
```

---

# 27. AI Prompt Pattern

Use this structure:

```text
You are working on Intake.

Read:
- prd.md
- architecture.md
- rules.md
- phases.md
- design.md
- memory.md

Current phase:
<PHASE>

Current task:
<TASK>

Before changing anything:
1. inspect the existing implementation
2. identify relevant files
3. identify dependencies
4. identify security implications
5. propose a small implementation plan

Then implement only this task.

After implementation:
1. run tests
2. run typecheck
3. run lint
4. run build
5. verify runtime behavior
6. check against rules.md
7. report files changed
8. report known issues
9. report what remains
```

---

# 28. Do Not Give AI Agents These Prompts

Avoid:

```text
Build my entire SaaS.
```

```text
Make everything production ready.
```

```text
Fix all errors.
```

```text
Improve the whole application.
```

```text
Make it like Dropbox.
```

These are too broad.

Prefer:

```text
Implement the request creation backend according to PRD sections X–Y and architecture rules A–B.
Do not modify unrelated modules.
```

---

# 29. Phase Completion Template

At the end of every phase, update `memory.md`:

```text
## Current Phase

Phase X — <name>

## Completed

- ...

## Technical Decisions

- ...

## Verified

- ...

## Known Issues

- ...

## Risks

- ...

## Next Phase

Phase X+1 — <name>

## Immediate Next Task

- ...
```

---

# 30. Critical Gates

The project has five major gates.

---

## Gate 1 — Idea Validated

Must prove:

```text
real pain
+
real target users
+
competitive gap
+
potential willingness to pay
```

---

## Gate 2 — Technology Validated

Must prove:

```text
Google OAuth
+
Drive access
+
anonymous upload
+
temporary storage
+
Drive transfer
```

---

## Gate 3 — MVP Validated

Must prove:

```text
complete workflow
+
security
+
reliability
```

---

## Gate 4 — Beta Validated

Must prove:

```text
real users
+
repeat usage
+
successful collections
+
willingness to pay
```

---

## Gate 5 — Scale Validated

Only after meaningful traction:

```text
cost economics
+
queue scaling
+
Google quotas
+
abuse prevention
+
retention
```

---

# 31. Technical Risk Priority

Risks are ranked:

## P0 — Launch blockers

```text
Google OAuth feasibility
Drive file transfer reliability
cross-account data leak
public token vulnerability
uncontrolled upload abuse
permanent data loss
duplicate Drive files
```

## P1 — Major risks

```text
large-file reliability
Google quota limits
storage costs
malware handling
OAuth verification
queue reliability
```

## P2 — Important but later

```text
advanced analytics
team collaboration
templates
branding
integrations
```

## P3 — Nice-to-have

```text
AI
advanced animations
native mobile apps
complex automation
```

---

# 32. Performance Targets

Initial targets should be treated as engineering goals rather than hard promises.

### Public page

Aim for:

```text
fast first render
minimal JavaScript
good Core Web Vitals
```

### Request creation

Aim for:

```text
sub-second perceived interaction
```

### Upload initialization

Aim for:

```text
near-instant authorization response
```

### Drive transfer

Optimize for:

```text
throughput + reliability
```

rather than arbitrary latency targets.

### Dashboard

Aim for:

```text
<1–2 second perceived load
```

under normal conditions.

---

# 33. Reliability Targets

Before public launch, establish measured targets for:

```text
upload success rate
Drive transfer success rate
duplicate transfer rate
queue failure rate
notification success rate
```

The target should be:

> **No silent loss of accepted files.**

---

# 34. Cost Validation Phase

Before pricing is finalized, measure:

```text
average file size
files per submission
submissions per request
requests per customer
R2 storage duration
R2 operations
Worker compute
Queue usage
database usage
email cost
monitoring cost
```

Calculate:

```text
cost per active customer
cost per successful submission
cost per GB processed
```

---

# 35. Pricing Validation

Test pricing hypotheses only after observing real usage.

Potential dimensions:

```text
active requests
monthly submissions
monthly upload volume
team seats
advanced features
```

Do not accidentally create a pricing model where heavy but profitable customers are punished disproportionately by storage costs.

---

# 36. Abuse Economics Phase

Before broad launch, simulate:

```text
1 attacker
10 requests
100 uploads
1 GB each
```

and larger scenarios.

Measure:

```text
bandwidth
storage
worker cost
queue cost
Drive API calls
```

The service must remain economically defensible under abuse.

---

# 37. Observability Acceptance

You must be able to answer:

```text
Why did this file fail?
```

within a reasonable debugging session.

Given:

```text
submission_id
uploaded_file_id
```

you should be able to trace:

```text
upload
→ storage
→ verification
→ queue
→ worker
→ Drive API
→ final state
```

---

# 38. Recovery Drill

Before launch, intentionally break the system.

Examples:

```text
revoke Google authorization
delete destination folder
force R2 error
force Drive 429
kill worker
interrupt browser
```

Then verify recovery.

A system is not production-ready until failures have been tested deliberately.

---

# 39. Launch Checklist

```text
## Product

- [ ] Core workflow is obvious.
- [ ] Request creation is fast.
- [ ] External upload is frictionless.
- [ ] Missing files are visible.
- [ ] Success state is clear.

## Google

- [ ] OAuth verified.
- [ ] Required scopes approved.
- [ ] Drive connection reliable.
- [ ] Token refresh works.
- [ ] Reauth works.

## Upload

- [ ] Small files work.
- [ ] Large files work.
- [ ] Multipart works.
- [ ] Retry works.
- [ ] Cleanup works.

## Transfer

- [ ] R2 → Drive works.
- [ ] Idempotency works.
- [ ] Queue works.
- [ ] Dead-letter works.
- [ ] Failure recovery works.

## Security

- [ ] RLS enabled.
- [ ] Cross-user tests pass.
- [ ] Public tokens secure.
- [ ] Rate limits active.
- [ ] Quotas active.
- [ ] Secrets protected.
- [ ] Security headers active.

## Operations

- [ ] Sentry works.
- [ ] Analytics works.
- [ ] Logs work.
- [ ] Alerts work.
- [ ] Backups work.

## Trust

- [ ] Privacy policy.
- [ ] Terms.
- [ ] Data retention policy.
- [ ] Account deletion.
- [ ] Google OAuth disclosure.

## Business

- [ ] Pricing validated.
- [ ] Payment flow tested.
- [ ] Support channel exists.
- [ ] Launch site ready.
```

---

# 40. Post-Launch Operating Cadence

## Daily during first launch period

Review:

```text
errors
uploads
Drive failures
queue
abuse
support
```

## Weekly

Review:

```text
activation
successful collections
repeat usage
retention
revenue
cost
```

## Monthly

Review:

```text
customer segments
pricing
churn
infrastructure economics
feature adoption
product roadmap
```

---

# 41. North-Star Metric

The north-star metric is:

> **Successful file collections delivered to Google Drive.**

Supporting metrics:

```text
requests created
submissions completed
Drive transfer success
repeat requests
active customers
paid customers
```

Do not optimize around:

```text
signups alone
```

---

# 42. What Not To Build Before Product-Market Evidence

Do not build these early merely because they sound impressive:

```text
AI document classification
AI summaries
custom domains
white-label
native mobile app
Dropbox integration
OneDrive integration
complex CRM
client portals
advanced approvals
enterprise SSO
complex workflow automation
```

The product should first prove:

```text
people repeatedly create requests
+
people repeatedly send them
+
recipients successfully upload
+
files reliably reach Drive
+
customers are willing to pay
```

---

# 43. Recommended MVP Timeline Structure

Do not optimize for a fixed calendar date before technical validation.

Instead use milestone-based progression.

### Milestone 1

```text
Google Drive POC
```

### Milestone 2

```text
One complete vertical slice
```

### Milestone 3

```text
Secure functional MVP
```

### Milestone 4

```text
Private beta
```

### Milestone 5

```text
Production launch
```

The project should move forward based on evidence, not arbitrary deadlines.

---

# 44. One Vertical Slice First

Before implementing the complete dashboard, build this:

```text
Requester
  ↓
Google Sign-in
  ↓
Connect Drive
  ↓
Select folder
  ↓
Create:
"Send Brand Assets"
  ↓
Generate link
  ↓
External browser
  ↓
Upload:
logo.png
  ↓
R2
  ↓
Queue
  ↓
Worker
  ↓
Google Drive
  ↓
Success
```

Then expand to:

```text
multiple requested files
multiple submissions
expiration
pause/close
notifications
```

This drastically reduces integration risk.

---

# 45. Expansion Order After Vertical Slice

Once one file works:

```text
1 file
→ multiple files
→ request checklist
→ required/optional
→ multiple submissions
→ expiration
→ pause/close
→ notifications
→ dashboard
→ analytics
→ billing
```

Do not implement all complexity before proving one complete path.

---

# 46. Definition of MVP

MVP is complete when a real user can:

```text
1. Sign in with Google.
2. Connect Google Drive.
3. Choose a folder.
4. Create a request.
5. Define requested files.
6. Generate a link.
7. Send it to someone.
8. Recipient uploads without Drive access.
9. Files are validated.
10. Files are delivered into the selected Drive folder.
11. Requester sees the received state.
12. Failures recover safely.
```

---

# 47. Definition of Beta Ready

Beta-ready means:

```text
MVP
+
security
+
observability
+
failure recovery
+
basic notifications
+
privacy documentation
```

and real users can safely use the product.

---

# 48. Definition of Public Launch Ready

Public launch requires:

```text
Beta feedback
+
stable infrastructure
+
Google production readiness
+
security review
+
abuse protection
+
cost validation
+
support process
+
pricing
```

---

# 49. Definition of Scale Ready

Scale readiness comes later.

It requires evidence around:

```text
retention
revenue
upload volume
Google quotas
worker capacity
storage cost
abuse
support
```

Do not optimize for scale before the product has users.

---

# 50. Final Execution Strategy

The project should be built using this hierarchy:

```text
                    PRODUCT VALUE
                         ▲
                         │
                 Growth / Expansion
                         │
                  Retention Features
                         │
                    Great UX
                         │
                  Reliable System
                         │
                    Secure System
                         │
                 Core Backend Flow
                         │
             Google Drive Integration
                         │
                  Upload Pipeline
                         │
                    Architecture
                         │
                  Technical POC
                         │
                Market Validation
```

The bottom must be proven before building the top.

---

# 51. Final Project Sequence

```text
RESEARCH
   ↓
VALIDATE THE MARKET
   ↓
VALIDATE GOOGLE
   ↓
VALIDATE FILE TRANSFER
   ↓
LOCK ARCHITECTURE
   ↓
DESIGN UX
   ↓
BUILD INFRASTRUCTURE
   ↓
BUILD AUTH
   ↓
BUILD REQUEST DOMAIN
   ↓
BUILD PUBLIC UPLOAD
   ↓
BUILD R2 UPLOAD
   ↓
BUILD DRIVE TRANSFER
   ↓
BUILD RETRIES
   ↓
HARDEN SECURITY
   ↓
ADD NOTIFICATIONS
   ↓
POLISH DASHBOARD
   ↓
QA
   ↓
PRIVATE BETA
   ↓
MEASURE
   ↓
FIX
   ↓
LAUNCH
   ↓
ITERATE
```

---

# 52. Final Rule For The Entire Roadmap

Never ask:

> "How quickly can we build the whole app?"

Ask:

> **"What is the riskiest assumption, and how quickly can we prove it?"**

For this product, the riskiest assumptions are:

```text
Google OAuth/scopes
+
Drive destination access
+
anonymous external upload
+
large-file reliability
+
R2 → Drive transfer
+
abuse economics
```

Once those are proven, the rest of the product becomes controlled execution.

The ultimate milestone is not:

> "The website is finished."

It is:

> **A real professional can create a request, send the link to a real client, the client can upload files without seeing the Drive, and those files reliably appear in the correct Google Drive folder — even when something goes wrong.**

That is the product we are building.
