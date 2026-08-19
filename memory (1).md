# MEMORY — Intake

**Document:** Persistent Project Memory  
**Product:** Intake  
**Version:** 1.0  
**Date:** 2026-08-18  
**Status:** Initial project baseline

---

# 1. Project Identity

## Product Name

**Intake**

Working category:

> File-request infrastructure for Google Drive.

Core promise:

> **Let anyone upload files to your Google Drive without giving them Drive access.**

---

# 2. Product Thesis

People repeatedly need to collect files from other people.

Typical examples:

```text
"Please send me your logo."

"Please upload the documents."

"Send me the product photos."

"Please share your tax documents."

"Can you send the brand guidelines?"

"Please upload your resume."
```

The current workflow is often fragmented across:

```text
email attachments
WhatsApp
Google Drive shared folders
Dropbox
messaging apps
manual follow-ups
```

The product creates a dedicated workflow:

```text
Requester
    ↓
Creates request
    ↓
Gets one upload link
    ↓
Sends link
    ↓
External person uploads
    ↓
Files automatically reach requester’s Google Drive
```

---

# 3. Core Product Principle

The product is not primarily a storage product.

It is a:

> **Google Drive file-collection workflow layer.**

Google Drive remains the destination.

The product handles:

```text
request creation
+
external upload
+
validation
+
delivery
+
status
```

---

# 4. Primary Target Users

Broad target market:

```text
Agencies
Freelancers
Accountants
Lawyers
Recruiters
Schools
Real estate professionals
Photographers
HR teams
Consultants
Small businesses
```

Common characteristic:

> They repeatedly need other people to send files.

---

# 5. Initial Product Wedge

The strongest initial product combination is:

```text
Request
+
Checklist
+
One upload link
+
No uploader Drive access
+
Automatic Drive delivery
```

The checklist is important because the product should not merely accept arbitrary files.

It should answer:

> **What exactly do I need from this person?**

---

# 6. Core User Experience

## Requester

```text
Sign in with Google
      ↓
Connect Google Drive
      ↓
Choose destination folder
      ↓
Create request
      ↓
Add requested files
      ↓
Generate upload link
      ↓
Send link
      ↓
Watch files arrive
```

## Uploader

```text
Open link
      ↓
See requested files
      ↓
Select files
      ↓
Upload
      ↓
Submit
      ↓
Done
```

The uploader does not need a Google account.

The uploader must not receive Google Drive access.

---

# 7. Core Differentiation Direction

The product should compete on:

```text
simplicity
+
beautiful UX
+
request checklist
+
reliable Drive delivery
+
low-friction uploader experience
```

Not on:

```text
AI
complex workflows
massive integrations
enterprise configuration
generic storage
```

---

# 8. Important Competitive Reality

The category already has competitors and Google Drive-related file-request products.

Therefore:

> The product cannot depend on the assumption that "nobody has built this."

Competitive advantage must come from execution.

Areas to differentiate:

```text
UX
reliability
simplicity
request checklist
professional workflows
Drive-native delivery
speed
pricing
```

Competitor research must remain an active project activity.

---

# 9. Product North Star

Primary product outcome:

> **Successful file collections delivered to Google Drive.**

Important supporting metrics:

```text
requests created
links shared
submissions started
submissions completed
Drive transfers completed
repeat requests
active customers
paid customers
```

Avoid optimizing around signups alone.

---

# 10. Core Product Loop

```text
Create Request
       ↓
Define Files Needed
       ↓
Generate Link
       ↓
Link Shared
       ↓
Uploader Opens
       ↓
Files Uploaded
       ↓
Files Validated
       ↓
Transfer Queued
       ↓
Google Drive
       ↓
Requester Sees Completion
```

This loop is the heart of the product.

---

# 11. Core Technical Architecture

Initial recommended architecture:

```text
                    ┌─────────────────────┐
                    │      Next.js        │
                    │   React + TS        │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │       Backend       │
                    │ APIs / Domain Logic │
                    └───────┬─────┬───────┘
                            │     │
              ┌─────────────┘     └─────────────┐
              ▼                                 ▼
      ┌───────────────┐                 ┌───────────────┐
      │   Supabase    │                 │  Cloudflare   │
      │ PostgreSQL    │                 │      R2       │
      │ Auth          │                 │ Object Store  │
      └───────────────┘                 └───────┬───────┘
                                                │
                                                ▼
                                      ┌──────────────────┐
                                      │ Cloudflare Queue │
                                      └────────┬─────────┘
                                               │
                                               ▼
                                      ┌──────────────────┐
                                      │ Transfer Worker  │
                                      └────────┬─────────┘
                                               │
                                               ▼
                                      ┌──────────────────┐
                                      │ Google Drive API │
                                      └──────────────────┘
```

Potential supporting services:

```text
Vercel
Cloudflare Workers
Supabase
R2
Google Drive API
Resend
PostHog
Sentry
GitHub
```

Exact provider choices remain subject to technical validation.

---

# 12. Storage Model

The system intentionally separates three forms of data.

## Application Metadata

```text
Supabase / PostgreSQL
```

Stores:

```text
users
requests
request items
submissions
uploaded file metadata
transfer jobs
notifications
audit events
usage
```

## Temporary Binary Storage

```text
Cloudflare R2
```

Stores files while they are being processed/transferred.

## Final Customer-Owned Storage

```text
Google Drive
```

The user's Drive is the final destination.

---

# 13. File Lifecycle

Preferred lifecycle:

```text
Browser
   ↓
R2
   ↓
Validate
   ↓
Scan / process where applicable
   ↓
Queue
   ↓
Google Drive
   ↓
Verify
   ↓
Delete temporary R2 object
```

Temporary files should not become permanent duplicate storage.

---

# 14. Core Domain Entities

Current domain model:

```text
User
GoogleConnection
DriveDestination
Request
RequestItem
Submission
UploadedFile
TransferJob
Notification
AuditEvent
UsageRecord
```

---

# 15. Request Lifecycle

Current planned states:

```text
DRAFT
ACTIVE
PAUSED
EXPIRED
CLOSED
```

Rules:

```text
DRAFT → ACTIVE
ACTIVE → PAUSED
PAUSED → ACTIVE
ACTIVE → EXPIRED
ACTIVE → CLOSED
```

Server-side validation must enforce legal transitions.

---

# 16. Submission Lifecycle

Planned states:

```text
STARTED
UPLOADING
PROCESSING
COMPLETED
FAILED
```

Do not collapse upload and final Drive delivery into one boolean.

---

# 17. Uploaded File Lifecycle

Conceptually:

```text
CREATED
UPLOADING
UPLOADED
PROCESSING
QUEUED
TRANSFERRING
TRANSFERRED
FAILED
```

Exact implementation may evolve.

---

# 18. Transfer Job Lifecycle

Planned:

```text
QUEUED
PROCESSING
RETRYING
SUCCEEDED
FAILED
DEAD_LETTER
```

Transfer is asynchronous.

---

# 19. Public Request Security Model

Public request links use high-entropy random tokens.

Conceptually:

```text
/r/<secure-random-token>
```

The token acts as a bearer credential.

Rules:

```text
never use sequential IDs
never log raw tokens
never expose tokens to analytics
never store raw tokens unnecessarily
```

Prefer storing a secure token hash.

---

# 20. Public User Security Boundary

External uploaders must never receive:

```text
Google access tokens
Google refresh tokens
Drive API credentials
Supabase service role key
R2 secret credentials
internal secrets
```

They only interact with the public request workflow.

---

# 21. Google Drive Integration

Core functionality:

```text
Google Sign-in
OAuth
Drive connection
folder selection
token refresh
Drive file creation
Drive error handling
reconnection
```

Important technical questions still requiring validation:

```text
minimum required Google scopes
drive.file feasibility
folder picker behavior
Google OAuth verification
Workspace restrictions
Shared Drive support
token lifecycle
```

Do not assume these details from memory.

Validate against current official Google documentation before production implementation.

---

# 22. Upload Architecture

Preferred public upload flow:

```text
Public page
   ↓
Upload initialization
   ↓
Server validation
   ↓
Temporary upload authorization
   ↓
Browser → R2
```

The application server should not unnecessarily proxy every file byte.

---

# 23. Large File Strategy

Small/medium files may use direct upload.

Large files should use:

```text
multipart / resumable upload
```

The system should avoid loading entire large files into server memory.

---

# 24. Transfer Architecture

Preferred:

```text
R2 object
   ↓
Transfer Job
   ↓
Queue
   ↓
Worker
   ↓
Google Drive
```

The uploader should not wait for the entire Drive transfer.

The browser may close after the upload has been safely accepted.

---

# 25. Reliability Principles

Critical rules:

```text
idempotency
retry
backoff
jitter
dead-letter handling
state recovery
verification
cleanup
```

Retryable failures must retry.

Permanent failures must not retry forever.

---

# 26. Idempotency Requirement

Drive transfers must not create duplicate files when a job is retried.

Important invariant:

```text
uploaded_file.drive_file_id exists
```

means:

```text
do not create another Drive file
```

---

# 27. Failure Philosophy

Every operation should end in a known state.

Never allow indefinite:

```text
PROCESSING
```

without recovery.

Failures should be classified as:

```text
automatic recovery
user recovery
permanent failure
unexpected error
```

---

# 28. Security Priorities

P0 security concerns:

```text
cross-user data access
public token security
Google OAuth credentials
file upload abuse
malicious files
service-role exposure
database authorization
secret leakage
```

RLS must protect user-owned database data.

---

# 29. Abuse Protection

Public upload endpoints are hostile surfaces.

Required protections include:

```text
rate limits
file size limits
file count limits
submission limits
account quotas
request expiration
abuse detection
risk challenges where needed
```

Do not provide unlimited anonymous upload infrastructure.

---

# 30. Malware Strategy

The architecture must support:

```text
QUARANTINED
→ SCANNING
→ APPROVED
→ TRANSFERRED
```

Before broad public launch, the malware-scanning approach must be deliberately chosen and implemented where required by the product's threat model.

---

# 31. Privacy Principles

Collect only what is needed.

Potential uploader information:

```text
name
email
```

should remain optional unless there is a validated reason to require it.

Do not send:

```text
file contents
OAuth credentials
raw request tokens
```

to analytics.

---

# 32. Temporary Storage Retention

Normal successful flow:

```text
Drive transfer confirmed
→ R2 object deleted
```

Failed/abandoned flow:

```text
temporary retention
→ retry/recovery
→ expiration
→ cleanup
```

No indefinite orphaned storage.

---

# 33. Notifications

Initial useful notifications:

```text
new files received
transfer failure requiring action
```

Optional later:

```text
request expiration reminder
```

Email is asynchronous and must not determine whether a file transfer succeeds.

---

# 34. Analytics

Important events:

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

Analytics must never contain sensitive file data or credentials.

---

# 35. Observability

The system should be traceable using:

```text
request_id
submission_id
uploaded_file_id
transfer_job_id
correlation_id
```

A developer should be able to answer:

> Why did this file fail?

by tracing:

```text
upload
→ R2
→ validation
→ queue
→ worker
→ Drive API
→ final state
```

---

# 36. Design Direction

Visual identity:

```text
minimal
premium
professional
calm
modern
trustworthy
```

Design inspiration direction:

```text
Google Drive simplicity
Stripe clarity
Linear polish
```

without copying any product.

---

# 37. Design Anti-Direction

Avoid:

```text
heavy gradients
glassmorphism
neon aesthetics
excessive shadows
AI sparkle visuals
huge rounded cards
dashboard clutter
enterprise complexity
```

---

# 38. Typography

Preferred:

```text
Inter
```

or equivalent modern system sans-serif.

Suggested hierarchy:

```text
Display
H1
H2
H3
Body
Small
Caption
```

---

# 39. Color Direction

Neutral-first.

Base:

```text
near-white
white
near-black
gray
light borders
```

Primary accent direction:

```text
deep blue / indigo
```

Semantic:

```text
green
amber
red
blue
```

Exact brand color remains open for final visual testing.

---

# 40. Core UI Surfaces

Required:

```text
Landing page
Authentication
Onboarding
Dashboard
Request builder
Request detail
Public upload page
Upload success
Error states
Settings
```

---

# 41. Most Important UI Surface

The public upload page is a first-class product surface.

It must be:

```text
mobile-first
fast
minimal
accessible
clear
trustworthy
```

The uploader should understand the task immediately.

---

# 42. Core Public UX

Target flow:

```text
Open link
   ↓
See request
   ↓
See checklist
   ↓
Choose files
   ↓
Upload
   ↓
See progress
   ↓
Submit
   ↓
Confirmation
```

No account creation.

No Drive login.

No unnecessary setup.

---

# 43. Request Builder UX

Basic creation:

```text
Title
Description
Files needed
Destination
Create
```

Advanced options remain secondary.

---

# 44. Core Request Checklist

Example:

```text
Files needed

○ Logo
○ Brand guidelines
○ Product images
○ Legal documents
```

Each item may support:

```text
required / optional
description
allowed file types
maximum size
```

---

# 45. Request Detail UX

The requester should immediately know:

```text
what is requested
what arrived
what is missing
where files are going
what needs attention
```

---

# 46. Status Language

Prefer human states:

```text
Active
Waiting
Uploading…
Processing…
Sending to Google Drive…
Saved to Google Drive
Needs attention
Expired
Closed
```

Avoid exposing:

```text
QUEUE_PROCESSING
R2_OBJECT
HTTP_403
```

---

# 47. Product Voice

Tone:

```text
direct
friendly
confident
human
```

Avoid:

```text
corporate jargon
technical terminology
AI-generated sounding copy
unnecessary exclamation marks
```

---

# 48. Core Marketing Message

Primary:

> **Get files from anyone, straight into your Google Drive.**

Secondary:

> **Send one link. They upload. Everything lands in your Drive.**

Alternative concise statement:

> **Request files without giving anyone Drive access.**

---

# 49. Initial Product Scope

MVP includes:

```text
Google authentication
Google Drive connection
Drive folder selection
request creation
request checklist
public request link
anonymous file upload
temporary storage
background Drive transfer
transfer status
request dashboard
basic notifications
basic analytics
security controls
```

---

# 50. Explicit MVP Exclusions

Do not prioritize initially:

```text
AI document classification
AI summaries
Dropbox integration
OneDrive integration
native mobile app
complex CRM
client portal
advanced approvals
enterprise SSO
complex automation
advanced white-label
```

These require evidence.

---

# 51. Potential Expansion

After product validation:

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
webhooks
Shared Drives
Dropbox
OneDrive
Box
```

AI can be considered later if customer behavior proves the need.

---

# 52. Recommended Tech Direction

Current recommended stack:

```text
Frontend:
Next.js
React
TypeScript
Tailwind
shadcn/ui

Backend:
Next.js server/API layer
modular domain services

Database/Auth:
Supabase
PostgreSQL
Supabase Auth

Temporary storage:
Cloudflare R2

Async:
Cloudflare Queues
Cloudflare Workers

Drive:
Google Drive API

Email:
Resend

Analytics:
PostHog

Error monitoring:
Sentry

Hosting:
Vercel

Source control:
GitHub
```

This is a recommended baseline, not an irreversible commitment.

Provider choices must be validated during the technical feasibility phase.

---

# 53. Architecture Philosophy

Prefer:

```text
modular monolith
+
background worker
+
managed infrastructure
```

Avoid premature:

```text
microservices
Kubernetes
multi-region architecture
```

The system should remain understandable to a small team.

---

# 54. No-Code Development Philosophy

No-code/AI-assisted development is acceptable.

However:

> **No-code must not mean no engineering discipline.**

The implementation still requires:

```text
security
authorization
database design
testing
observability
reliability
documentation
```

---

# 55. AI Coding Agent Rules

Agents must:

```text
read project artifacts
inspect existing code
make small changes
test changes
review against rules
report limitations
update memory
```

Agents must not:

```text
rewrite entire app
silently change architecture
remove security
fake functionality
disable tests
hide errors
expose secrets
```

---

# 56. Current Project Documents

The project has six persistent artifacts:

```text
prd.md
architecture.md
rules.md
phases.md
design.md
memory.md
```

Purpose:

### prd.md

Defines:

```text
what we are building
why
for whom
requirements
scope
success
```

### architecture.md

Defines:

```text
how the system works
services
data
APIs
infrastructure
security architecture
```

### rules.md

Defines:

```text
non-negotiable engineering/product/security rules
```

### phases.md

Defines:

```text
execution roadmap
milestones
acceptance gates
```

### design.md

Defines:

```text
UX
UI
visual system
components
flows
copy direction
```

### memory.md

Defines:

```text
current project state
decisions
completed work
known issues
next action
```

---

# 57. Current Execution State

Current project status:

```text
Strategy / Product definition:
IN PROGRESS / INITIALIZED

Architecture:
DEFINED AT HIGH LEVEL

Engineering rules:
DEFINED

Execution phases:
DEFINED

Design system:
DEFINED

Implementation:
NOT YET STARTED / REQUIRES VALIDATION
```

The next actual engineering work should not be blindly building the full product.

---

# 58. Immediate Next Step

Before significant implementation:

```text
1. Validate current competitors.
2. Validate Google Drive OAuth/scopes.
3. Validate Drive folder selection.
4. Prove anonymous upload.
5. Prove R2 upload.
6. Prove R2 → Drive transfer.
7. Prove retries/idempotency.
8. Lock architecture.
```

The technical proof-of-concept is the most important next milestone.

---

# 59. Critical Unknowns

These are intentionally unresolved until research/POC:

```text
exact Google OAuth scopes
Google verification requirements
drive.file limitations
folder-picker implementation
Shared Drive support
maximum practical file size
best temporary storage provider
malware-scanning provider
exact queue implementation
exact pricing
exact free-plan limits
exact rate limits
billing model
```

Do not invent answers.

---

# 60. Critical Technical Risks

Highest priority:

```text
Google OAuth restrictions
Drive API behavior
large-file transfer
Google API quotas
public upload abuse
malicious uploads
duplicate Drive files
temporary storage cost
OAuth token security
cross-tenant authorization
```

---

# 61. Critical Product Risks

Highest priority:

```text
category already has competitors
users may solve problem with existing Drive folders
users may not perceive enough value to pay
upload experience may not be meaningfully better
Google permissions may create onboarding friction
large files may make infrastructure expensive
```

These must be validated with evidence.

---

# 62. Product Strategy

The product should win through:

```text
clarity
speed
reliability
simplicity
workflow fit
```

Not feature count.

---

# 63. MVP Strategy

Build one complete vertical slice first:

```text
Google sign-in
→ Drive connection
→ folder selection
→ create request
→ generate link
→ open link in separate browser
→ upload one file
→ R2
→ queue
→ Drive
→ confirmation
```

Only after this works should the product expand.

---

# 64. Expansion Strategy

Then move to:

```text
one file
→ multiple files
→ checklist
→ required/optional
→ multiple submissions
→ expiration
→ pause/close
→ notifications
→ dashboard
→ billing
```

---

# 65. Quality Bar

A feature is complete only when:

```text
implemented
+
tested
+
secured
+
error-handled
+
observable
+
documented
```

A visual demo is not enough.

---

# 66. Production Readiness Definition

The product is production-ready only when a real user can:

```text
create a request
→ send it to a real client
→ client uploads without Drive access
→ files reach correct Drive folder
→ failures recover safely
→ requester sees correct state
```

And:

```text
security boundaries
+
abuse controls
+
monitoring
+
backups
+
privacy documentation
```

are in place.

---

# 67. Current Product Priorities

Priority order:

```text
P0
Google feasibility
Core file workflow
Security
Reliability

P1
Uploader UX
Request checklist
Dashboard
Notifications

P2
Billing
Templates
Branding
Growth

P3
Integrations
AI
Advanced enterprise features
```

---

# 68. Current North-Star Question

Every major product decision should answer:

> **Does this make it easier, safer, or more reliable for someone to collect files into their Google Drive?**

If not, it is probably not a current priority.

---

# 69. Current Founder/AI Operating Model

The founder remains:

```text
Product decision maker
Priority setter
Final reviewer
```

AI/no-code tools act as:

```text
research assistant
designer
developer
tester
debugger
documentation assistant
```

but must operate under:

```text
prd.md
architecture.md
rules.md
phases.md
design.md
memory.md
```

---

# 70. Memory Update Protocol

After every meaningful implementation milestone, update this file.

Update:

```text
Current Execution State
Completed Work
Technical Decisions
Verified Behavior
Known Issues
Critical Unknowns
Next Step
```

Do not rewrite historical decisions unnecessarily.

---

# 71. Decision Log

## Decision 001 — Product Direction

**Decision:**

Build a dedicated file-request layer for Google Drive.

**Why:**

The problem is simple, recurring, and understandable.

**Status:**

Accepted.

---

## Decision 002 — No AI Dependency

**Decision:**

Core MVP does not require AI.

**Why:**

The workflow is valuable without AI and reliability is more important than artificial intelligence.

**Status:**

Accepted.

---

## Decision 003 — Google Drive As Destination

**Decision:**

Google Drive remains the primary storage destination.

**Why:**

The target customer already uses Drive and does not need another storage system.

**Status:**

Accepted.

---

## Decision 004 — External Uploader Does Not Need Drive Access

**Decision:**

The uploader interacts only with the Intake public experience.

**Why:**

This is the central security/value proposition.

**Status:**

Accepted.

---

## Decision 005 — Temporary Object Storage

**Decision:**

Use temporary object storage between browser upload and Drive delivery.

**Why:**

Improves reliability, asynchronous processing, retry behavior, and large-file handling.

**Status:**

Recommended; provider choice subject to POC.

---

## Decision 006 — Asynchronous Drive Transfer

**Decision:**

Drive delivery occurs through background jobs.

**Why:**

The uploader should not depend on Google Drive API latency or browser lifetime.

**Status:**

Accepted.

---

## Decision 007 — Modular Monolith

**Decision:**

Start with a modular monolith plus background workers.

**Why:**

Keeps MVP understandable and reduces infrastructure complexity.

**Status:**

Accepted.

---

# 72. Open Decisions

These must be resolved with evidence:

```text
1. R2 vs Supabase Storage
2. exact Google Drive OAuth scopes
3. Google verification path
4. folder-picker implementation
5. malware scanning provider
6. queue configuration
7. exact file-size limits
8. pricing model
9. billing implementation
10. exact free-plan limits
11. Shared Drive support timing
```

---

# 73. Current Next Action

The next project action should be:

> **Perform a technical feasibility sprint for Google Drive + anonymous uploads + R2 + background Drive transfer before building the full UI.**

Required proof:

```text
Google OAuth
→ Drive folder
→ public request
→ anonymous upload
→ temporary storage
→ background transfer
→ Google Drive
```

---

# 74. Final Project Memory

The project is intentionally being built around one extremely simple promise:

> **Send someone a link. They upload files. The files arrive in your Google Drive.**

Everything else is secondary.

The product should hide its technical complexity.

Underneath:

```text
OAuth
R2
queues
workers
validation
retries
database
Drive API
security
monitoring
```

On top:

```text
Create request.
Send link.
Get files.
```

That is the product.

The long-term objective is not to build the largest file-request platform.

It is to build the:

> **simplest, most reliable and delightful way to collect files into Google Drive.**
