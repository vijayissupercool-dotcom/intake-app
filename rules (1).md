# RULES — Intake

**Document:** Engineering, Product, Security & AI-Agent Rules  
**Product:** Intake  
**Version:** 1.0  
**Date:** 2026-08-18  
**Status:** Mandatory project rules

---

# 1. Purpose

This document defines the non-negotiable rules for building Intake.

These rules apply to:

- Founder decisions
- Product decisions
- UX/design
- No-code implementation
- AI coding agents
- Backend
- Frontend
- Database
- Google Drive integration
- File uploads
- Security
- Infrastructure
- Testing
- Deployment
- Future feature development

The objective is not merely to make the application work.

The objective is to make it:

> **Reliable, secure, maintainable, understandable, scalable, and genuinely ready for market.**

---

# 2. Core Product Rule

The product exists to solve one problem:

> **Let anyone upload files to your Google Drive without giving them Drive access.**

Every product decision must strengthen this workflow.

Core loop:

```text
Create Request
      ↓
Define What Is Needed
      ↓
Generate Link
      ↓
External Person Uploads
      ↓
Validate
      ↓
Transfer
      ↓
Google Drive
      ↓
Requester Knows What Arrived
```

If a feature does not materially improve this loop, it should not be prioritized for MVP.

---

# 3. Product Positioning Rule

The product is not:

- another cloud storage provider
- another generic form builder
- another CRM
- another project management tool
- another AI wrapper
- a Dropbox clone

The product is:

> **A file-collection workflow layer for Google Drive.**

The Google Drive destination remains central.

---

# 4. Founder Rule

The founder is the final product decision maker.

AI agents and development tools are implementation assistants.

They must not independently:

- change the product strategy
- remove important functionality
- weaken security
- change the architecture
- change infrastructure providers
- introduce a new dependency without justification
- alter database semantics
- silently change API behavior

Any meaningful architectural or product deviation must be documented before implementation.

---

# 5. AI Agent Rule

AI coding agents must never be instructed to blindly "build the whole app."

Work must be divided into explicit phases.

Correct pattern:

```text
Research
→ Plan
→ Define
→ Implement one module
→ Test
→ Review
→ Fix
→ Integrate
→ Verify
```

Incorrect pattern:

```text
"Build the entire SaaS."
```

---

# 6. AI Must Read Project Artifacts First

Before modifying the codebase, an AI agent must inspect:

```text
prd.md
architecture.md
rules.md
phases.md
design.md
memory.md
```

If one of these documents does not yet exist, the agent must not invent its content silently.

---

# 7. No-Code Does Not Mean No Architecture

Using no-code or AI-assisted coding tools does not justify:

- poor security
- unstructured database design
- hard-coded secrets
- duplicated logic
- undocumented APIs
- giant components
- uncontrolled dependencies
- missing tests
- missing error handling

The generated system must still follow professional software engineering principles.

---

# 8. Build Small, Verify Often

Every implementation step must be:

```text
Small
→ Testable
→ Reversible
→ Observable
```

Do not make dozens of unrelated changes before testing.

After each major feature:

1. build
2. lint
3. test
4. inspect runtime behavior
5. verify database state
6. verify API behavior
7. verify UI
8. document important decisions

---

# 9. Never Hide Errors

Do not suppress errors simply to make the application appear functional.

Bad:

```text
catch(error) {
  return true;
}
```

Bad:

```text
try {
  ...
} catch {
  // ignore
}
```

Good:

```text
detect
→ classify
→ log safely
→ recover if possible
→ expose useful state
```

A feature is not complete if failures are silently swallowed.

---

# 10. No Fake Functionality

Never implement fake behavior that looks real.

Examples of prohibited shortcuts:

- fake Google Drive uploads
- fake success messages
- fake progress bars
- hard-coded request counts
- mock data presented as production data
- fake OAuth state
- pretending a file reached Drive
- marking a transfer successful before verification

During development, mocks are allowed only when explicitly labeled and isolated.

---

# 11. Production State Must Be Real

The following states must represent actual backend state:

```text
Request status
Submission status
Upload status
Transfer status
Drive connection status
Notification status
```

The frontend must not invent these states.

---

# 12. Source of Truth Rule

There are three categories of state.

## Application state

```text
Supabase/PostgreSQL
```

## Temporary binary state

```text
Cloudflare R2
```

## Final file state

```text
Google Drive
```

Do not confuse these layers.

---

# 13. Database Is Not File Storage

Do not store uploaded binary files directly in PostgreSQL.

The database stores metadata:

```text
filename
mime_type
size
checksum
storage_key
status
drive_file_id
```

Binary content belongs in object storage during processing.

---

# 14. Google Drive Is Not Temporary Upload Storage

Do not immediately send arbitrary public uploads directly to the user's Drive before validation.

Preferred flow:

```text
External uploader
      ↓
R2
      ↓
Validate
      ↓
Optional malware scan
      ↓
Queue
      ↓
Google Drive
```

---

# 15. Public Uploader Rule

The external uploader must never receive:

- Google access token
- Google refresh token
- Drive API credentials
- Supabase service key
- R2 secret credentials
- internal encryption keys
- arbitrary database credentials

The public browser gets only the minimum temporary authorization necessary to upload.

---

# 16. Zero Drive Access Rule

An external uploader must never be able to:

- browse the requester's Drive
- list Drive folders
- inspect unrelated files
- download existing Drive files
- change the destination folder
- access another request
- access another submission

The uploader interacts with the Intake application only.

---

# 17. Public Token Rule

Every public request URL must use a cryptographically secure, high-entropy token.

Never use:

```text
/r/123
/r/request-123
/r/acme
```

as the authorization credential.

Use:

```text
/r/<random-high-entropy-token>
```

The raw token should not be stored unnecessarily.

Prefer storing a secure hash of the token.

---

# 18. Token Logging Rule

Never log raw public request tokens.

Never send raw request tokens to:

- analytics
- Sentry
- third-party tracking
- logs
- error messages

Treat request tokens as bearer credentials.

---

# 19. Request Expiration Rule

Every request must have a server-enforced lifecycle.

Possible states:

```text
DRAFT
ACTIVE
PAUSED
EXPIRED
CLOSED
```

If a request is:

```text
PAUSED
EXPIRED
CLOSED
```

the server must reject new uploads.

The frontend state alone is never sufficient.

---

# 20. Server Authorization Rule

Every protected backend operation must verify:

```text
Who?
What resource?
Does this actor own it?
Is the resource in a valid state?
Is this operation allowed?
```

Never trust a client-provided:

```text
user_id
request_id
destination_id
submission_id
```

without server-side authorization.

---

# 21. Tenant Isolation Rule

User A must never access User B's:

- requests
- submissions
- files
- Drive connections
- destinations
- audit logs
- usage data

This must be enforced at the database and application layers.

---

# 22. Row-Level Security Rule

For Supabase/PostgreSQL:

> Row-Level Security must be enabled for user-owned application data.

Do not rely solely on frontend filtering.

Do not assume that hiding a resource from the UI is authorization.

---

# 23. Service Role Key Rule

The Supabase service-role key is privileged.

It must:

- exist only server-side
- never be exposed to the browser
- never be committed to Git
- never be printed in logs
- never be included in public environment variables

---

# 24. Secrets Rule

Secrets must never be:

- hard-coded
- committed to Git
- placed in frontend source
- placed in screenshots
- pasted into client-visible logs
- returned from APIs
- sent to analytics

Examples:

```text
Google client secret
Google refresh token
R2 secret key
Supabase service role key
encryption key
Resend API key
Stripe secret
```

---

# 25. Environment Separation Rule

Maintain separate:

```text
development
staging
production
```

configuration wherever practical.

Never accidentally connect:

```text
local development
→ production database
```

or:

```text
staging
→ founder's personal Google Drive
```

---

# 26. Google OAuth Rule

Google OAuth is a critical dependency.

Never assume the required scopes without validating them.

Before production:

- identify minimum scopes
- validate folder selection
- validate file creation
- validate token refresh
- validate token revocation
- verify Google consent requirements
- verify Google verification requirements
- verify Workspace restrictions

Do not request broad Drive access merely because it is easier.

---

# 27. OAuth State Rule

OAuth callbacks must validate a secure `state` value.

Reject:

- missing state
- invalid state
- expired state
- reused state
- state belonging to another session

OAuth CSRF protection is mandatory.

---

# 28. OAuth Token Rule

OAuth refresh tokens must be treated as highly sensitive credentials.

They must never reach:

- browser JavaScript
- public upload pages
- logs
- analytics
- client-side error reports

Store them encrypted where practical.

---

# 29. OAuth Reauthorization Rule

The system must handle:

```text
token expired
token revoked
permission removed
connection invalid
```

without crashing.

Expected state:

```text
DRIVE_REAUTH_REQUIRED
```

The requester should be guided through reconnecting Drive.

---

# 30. Upload Rule

The application server should not proxy every byte of every upload.

Preferred:

```text
Browser
   ↓
R2
```

with the backend issuing short-lived upload authorization.

This improves:

- performance
- scalability
- reliability
- cost

---

# 31. Large File Rule

Large uploads must not require loading the entire file into browser/server memory.

Use:

- multipart upload
- resumable upload
- bounded chunks
- streaming where appropriate

Never design:

```text
entire 5 GB file
→ memory
→ server
```

---

# 32. Upload Validation Rule

Validate files server-side.

Validate:

- request status
- expiration
- file count
- file size
- MIME type
- allowed extensions
- quota
- submission state
- upload session

Never trust browser validation.

---

# 33. Filename Rule

Filenames are untrusted input.

Never use filenames as:

- storage authorization
- database identity
- path identity

Prevent:

```text
../
../../
control characters
unsafe path sequences
```

Escape filenames correctly when rendered in HTML.

---

# 34. MIME Type Rule

Never trust the browser-provided MIME type alone.

Where practical, validate using:

- extension
- MIME metadata
- file signature
- server-side inspection
- malware scanning

---

# 35. Malware Rule

The architecture must support:

```text
QUARANTINED
→ SCANNING
→ APPROVED
→ TRANSFERRED
```

Do not silently treat every arbitrary external upload as trusted content.

If malware scanning is not present in an early development build, that limitation must be explicit and isolated so scanning can be added before broad public launch.

---

# 36. Upload Abuse Rule

Every public upload endpoint must be considered hostile.

Protect with:

- rate limiting
- quotas
- file size limits
- file count limits
- request expiration
- account limits
- abuse detection
- optional CAPTCHA/risk challenge

Do not provide unlimited anonymous uploads.

---

# 37. Rate Limit Rule

Rate-limit at multiple levels:

```text
IP/network signal
request
submission
account
endpoint
```

At minimum protect:

```text
public request resolution
submission creation
upload initialization
upload completion
```

---

# 38. Quota Rule

Every plan/request must have product-level limits.

Possible limits:

```text
max file size
max files per submission
max total submission size
max submissions per request
max submissions per hour
max active requests
max monthly volume
```

Never rely solely on provider limits.

---

# 39. Storage Cleanup Rule

Temporary files must always have a cleanup path.

Normal:

```text
R2
→ Drive success
→ delete temporary object
```

Abandoned:

```text
R2
→ lifecycle expiration
→ automatic cleanup
```

Failed:

```text
R2
→ retry
→ failure retention window
→ cleanup
```

---

# 40. No Permanent File Copy by Default

The product should not become a second permanent file-storage provider.

Preferred:

```text
temporary file
→ customer Drive
→ temporary copy deleted
```

This reduces:

- cost
- privacy exposure
- security risk
- storage complexity

---

# 41. Transfer Rule

The final customer-visible success condition is:

> **The file is available in the requester's Google Drive.**

Not merely:

> "The browser uploaded the file."

Therefore:

```text
Uploaded
```

and:

```text
Transferred to Drive
```

must be separate states.

---

# 42. Asynchronous Transfer Rule

Never make the external uploader wait for Google Drive transfer to complete.

Correct:

```text
Upload
→ accepted
→ queued
→ transfer
→ Drive
```

Incorrect:

```text
Upload
→ synchronous Google API call
→ wait
→ response
```

---

# 43. Queue Rule

Google Drive transfers must use a durable asynchronous job mechanism.

The job must survive:

- browser closing
- server restart
- network failure
- temporary Google failure

---

# 44. Retry Rule

Retry only errors that are actually retryable.

Retryable examples:

- temporary network errors
- transient 5xx
- 429
- temporary provider failures

Do not endlessly retry:

- revoked authorization
- invalid destination
- invalid file
- permanently forbidden operation

---

# 45. Exponential Backoff Rule

Retries must use:

```text
exponential backoff
+
jitter
+
maximum attempt count
```

Never implement:

```text
while(error) retry()
```

without a limit.

---

# 46. Idempotency Rule

Every retryable operation must be safe to execute multiple times.

Particularly:

```text
submission creation
upload completion
transfer creation
Drive file creation
notification sending
```

Repeated execution must not create duplicate files or duplicate business events.

---

# 47. Duplicate Drive File Rule

Before creating a Drive file:

```text
Does this UploadedFile already have drive_file_id?
```

If yes:

```text
do not create another file
```

Drive file identity must be persisted immediately after successful creation.

---

# 48. Transaction Rule

Do not hold database transactions open while waiting for external services.

Never do:

```text
BEGIN
→ call Google
→ wait
→ call R2
→ wait
→ call email
→ COMMIT
```

Prefer:

```text
persist state
→ commit
→ external operation
→ persist result
```

---

# 49. External API Rule

External APIs must be hidden behind service adapters.

Do not scatter raw Google Drive API calls throughout the application.

Use:

```text
DriveService
StorageService
NotificationService
QueueService
```

or equivalent abstractions.

---

# 50. Google Drive Adapter Rule

Only the Drive integration layer should understand Google-specific details.

The request domain should not depend directly on:

```text
Google Drive REST response shapes
Google OAuth internals
Google API error codes
```

This preserves future flexibility.

---

# 51. Storage Adapter Rule

The application domain should not be tightly coupled to:

```text
R2 bucket names
R2 object APIs
S3 implementation details
```

Use a storage abstraction.

---

# 52. Queue Adapter Rule

Queue implementation details should stay in infrastructure code.

Business logic should think in terms of:

```text
TransferJob
```

rather than:

```text
Cloudflare queue message
```

---

# 53. API Rule

APIs must have:

- explicit schemas
- predictable response formats
- stable error codes
- authorization
- validation
- rate limiting where needed

Use a schema validation library such as Zod.

---

# 54. Error Response Rule

Do not return raw infrastructure errors to users.

Bad:

```text
GoogleApiError: 403: insufficientFilePermissions...
```

Good:

```text
DRIVE_REAUTH_REQUIRED

Reconnect Google Drive to continue.
```

Internal diagnostic information belongs in logs, not user-facing responses.

---

# 55. Error Handling Rule

Every error must fall into one of:

```text
recover automatically
recover with user action
permanent failure
unexpected system error
```

The system should never leave an operation in an ambiguous state.

---

# 56. Frontend Rule

The frontend is not the source of truth.

Do not rely on:

- local state
- optimistic UI
- browser validation
- URL parameters
- hidden fields

for security or durable business state.

---

# 57. UI State Rule

Every important asynchronous operation needs explicit states.

Example:

```text
idle
loading
success
retryable error
permanent error
```

For uploads:

```text
queued
uploading
uploaded
processing
transferring
transferred
failed
```

---

# 58. No Fake Progress Rule

Do not create a progress animation that reaches 100% independently of the actual upload.

Progress must represent actual browser/upload state.

---

# 59. Public UX Rule

The uploader should not need to understand:

- Google Drive
- OAuth
- storage providers
- queues
- backend processing
- technical errors

The public experience should communicate only what the uploader needs.

---

# 60. Requester UX Rule

The requester should immediately understand:

```text
What is requested?
What has arrived?
What is missing?
Where are the files?
What should I do next?
```

---

# 61. Simplicity Rule

Prefer:

```text
one clear action
```

over:

```text
five configurable options
```

especially on the external upload page.

---

# 62. Design Rule

The product should feel:

- premium
- calm
- trustworthy
- modern
- fast
- professional

Avoid:

- unnecessary gradients
- excessive animations
- dashboard clutter
- fake AI branding
- enterprise complexity
- excessive onboarding

---

# 63. External Upload Page Rule

The external page is a first-class product surface.

It must be:

- mobile-first
- fast
- accessible
- minimal
- clear
- trustworthy

The uploader should be able to understand the task immediately.

---

# 64. Accessibility Rule

Core flows must support:

- keyboard navigation
- accessible labels
- visible focus states
- readable contrast
- semantic buttons
- screen-reader-friendly upload states
- error announcements where appropriate

---

# 65. Mobile Rule

Assume many external uploads will happen on phones.

The uploader must support:

- mobile file picker
- camera/file selection where browser supports it
- responsive layout
- touch-friendly controls
- reliable progress state
- recovery after temporary network loss

---

# 66. Request Builder Rule

The request builder should optimize for:

```text
What do you need?
```

not:

```text
How many settings can we expose?
```

Basic creation should be possible quickly.

Advanced controls should remain secondary.

---

# 67. Required Item Rule

Required file items must be visually obvious.

Example:

```text
✓ Logo
✓ Brand Guidelines
○ Product Images
```

The requester should be able to distinguish:

```text
required
```

from:

```text
optional
```

without ambiguity.

---

# 68. Submission Rule

A submission must preserve the distinction between:

```text
uploaded by sender
```

and:

```text
successfully delivered to Drive
```

Do not collapse these into one boolean.

---

# 69. Notification Rule

Notifications must be asynchronous.

Do not make core upload completion depend on email delivery.

If email fails:

```text
file transfer remains successful
notification = failed/retryable
```

---

# 70. Notification Idempotency Rule

Never send duplicate completion emails because a worker retried.

Use a unique event identity.

---

# 71. Analytics Rule

Analytics must measure product value.

Important events:

```text
drive_connected
request_created
request_link_copied
submission_started
upload_completed
drive_transfer_completed
submission_completed
```

Do not optimize the product around:

```text
page views
```

alone.

---

# 72. Analytics Privacy Rule

Never send:

- file contents
- OAuth credentials
- raw request tokens
- storage credentials

to analytics.

Avoid collecting sensitive uploader information unnecessarily.

---

# 73. Logging Rule

Use structured logs.

Useful fields:

```text
timestamp
level
service
event
request_id
submission_id
uploaded_file_id
transfer_job_id
correlation_id
error_code
```

Do not log secrets.

---

# 74. Sentry Rule

Error monitoring must be sanitized.

Never send:

- access tokens
- refresh tokens
- raw request tokens
- file binary content
- secret headers

to Sentry.

---

# 75. Audit Rule

Security-relevant actions must be auditable.

Examples:

```text
DRIVE_CONNECTED
REQUEST_CREATED
REQUEST_PAUSED
REQUEST_CLOSED
SUBMISSION_CREATED
FILE_TRANSFERRED
DRIVE_REAUTH_REQUIRED
```

Audit logs must not contain sensitive credentials.

---

# 76. Database Schema Rule

Database schema must represent the domain clearly.

Core entities:

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

Do not create arbitrary tables without a domain reason.

---

# 77. State Machine Rule

Important lifecycle transitions must be enforced server-side.

Example:

```text
DRAFT → ACTIVE
ACTIVE → PAUSED
ACTIVE → CLOSED
ACTIVE → EXPIRED
PAUSED → ACTIVE
```

An invalid transition must be rejected.

---

# 78. Database Constraint Rule

Use database constraints to protect invariants where possible.

Examples:

```text
unique public token hash
unique transfer job per uploaded file
valid foreign keys
non-null required fields
```

Do not rely entirely on application code.

---

# 79. Migration Rule

Database changes must be made through migrations.

Never manually modify production schema without recording the change.

Every migration must be:

- versioned
- reproducible
- reviewed
- tested

---

# 80. Data Deletion Rule

Deleting the application account must not unexpectedly delete the user's Google Drive files.

The product must clearly distinguish:

```text
our metadata
```

from:

```text
customer-owned Drive files
```

---

# 81. Privacy Rule

Collect only information required to run the workflow.

Potential uploader information:

```text
name
email
```

must be optional unless a product requirement explicitly makes it mandatory.

---

# 82. IP Address Rule

Do not retain raw IP addresses indefinitely.

If network information is required for abuse prevention:

- minimize it
- hash/pseudonymize where appropriate
- define retention
- document its purpose

---

# 83. Data Retention Rule

Temporary binary data must have a defined lifecycle.

Every uploaded object must eventually reach:

```text
TRANSFERRED → DELETED
```

or:

```text
FAILED → RETENTION WINDOW → DELETED
```

No abandoned object should remain indefinitely.

---

# 84. Security Headers Rule

Production web surfaces should use appropriate security headers, including where applicable:

```text
Content-Security-Policy
X-Content-Type-Options
Referrer-Policy
Strict-Transport-Security
frame protections
```

Configuration must be tested rather than copied blindly.

---

# 85. CORS Rule

Do not use permissive CORS unnecessarily.

Prefer explicit application origins.

Especially protect upload/session APIs.

---

# 86. Dependency Rule

Do not install a package simply because an AI agent recommends it.

Before adding a dependency, consider:

- necessity
- maintenance
- security
- bundle size
- license
- compatibility
- alternative using existing stack

---

# 87. Version Rule

Pin or lock dependency versions through the package manager lockfile.

Do not casually upgrade major dependencies during feature implementation.

---

# 88. No Unnecessary Abstractions

Do not create abstractions merely to look "architectural."

Good abstraction:

```text
DriveService
```

because Google Drive is an external provider.

Bad abstraction:

```text
UniversalMegaDataManagerFactory
```

with no actual need.

Keep architecture clear.

---

# 89. No Premature Microservices

MVP must not become:

```text
12 services
7 databases
4 queues
```

Use a modular monolith plus background workers.

Split services only when there is a measurable reason.

---

# 90. No Premature Kubernetes

Do not introduce Kubernetes for MVP.

Managed platforms are preferred.

---

# 91. No Premature Multi-Region

Do not implement multi-region infrastructure before the product has meaningful scale.

Design for future expansion without paying today's complexity cost.

---

# 92. Performance Rule

Optimize the actual bottlenecks.

Priorities:

1. public upload startup
2. upload reliability
3. Drive transfer
4. dashboard query performance
5. public page loading

Do not spend weeks micro-optimizing code before measuring.

---

# 93. Bundle Rule

The public upload page should not load the entire authenticated dashboard application unnecessarily.

Keep the public experience lightweight.

---

# 94. Image Rule

Marketing assets should be optimized.

Use:

- modern image formats
- responsive sizes
- lazy loading where appropriate

Do not ship massive assets unnecessarily.

---

# 95. API Performance Rule

Avoid unnecessary round trips.

For example, request creation should not require ten sequential API calls when one transaction can safely create the required records.

---

# 96. Polling Rule

If polling is used:

- use reasonable intervals
- stop when state is terminal
- stop when page is hidden where appropriate
- avoid hundreds of concurrent polling loops

---

# 97. Realtime Rule

Realtime is optional.

Do not introduce realtime infrastructure merely because it is fashionable.

Use it when it materially improves:

- transfer status
- dashboard freshness
- collaboration

---

# 98. Testing Rule

Every major feature must have tests at the appropriate layer.

Minimum:

```text
unit
integration
end-to-end
security
```

---

# 99. Security Test Rule

Before launch, test:

```text
User A → User B request
User A → User B submission
User A → User B file
invalid token
expired token
closed token
oversized file
wrong MIME
duplicate completion
duplicate transfer
revoked Google token
deleted Drive folder
```

All must behave safely.

---

# 100. End-to-End Test Rule

The most important test is:

```text
Requester
→ Google login
→ Drive connection
→ folder selection
→ request creation
→ public link
→ external upload
→ R2
→ transfer queue
→ Google Drive
→ requester confirmation
```

If this path fails, cosmetic work is irrelevant.

---

# 101. Production Testing Rule

Do not test production using:

- real customer documents
- founder's primary Drive
- real customer OAuth credentials

Use dedicated test accounts.

---

# 102. Staging Rule

Staging must have:

```text
test database
test storage bucket
test Google Drive
test OAuth credentials
```

Never allow staging to accidentally send files to production destinations.

---

# 103. Deployment Rule

Every production deployment must be reproducible.

The application should be deployable from:

```text
Git repository
+
environment configuration
+
database migrations
```

No undocumented manual steps.

---

# 104. CI Rule

CI should eventually run:

```text
typecheck
lint
unit tests
integration tests
build
```

before production deployment.

---

# 105. Build Rule

A feature is not complete merely because:

```text
npm run dev
```

works.

It must also:

- build successfully
- pass type checking
- pass relevant tests
- work in production configuration
- handle errors
- preserve security boundaries

---

# 106. TypeScript Rule

Avoid:

```text
any
```

unless there is a documented reason.

Prefer explicit types.

Do not allow AI agents to silence type errors with:

```text
as any
```

as a shortcut.

---

# 107. Type Safety Rule

External API responses must be validated.

Do not assume Google/R2/third-party response structures are correct.

---

# 108. Frontend Component Rule

Components should have one clear responsibility.

Avoid giant components containing:

- UI
- API calls
- database logic
- Drive logic
- business rules
- analytics

all together.

---

# 109. Server/Client Boundary Rule

Privileged logic belongs server-side.

Examples:

```text
Google token operations
Drive API
R2 secret credentials
service-role database operations
billing secrets
```

must never be moved into client components.

---

# 110. Business Logic Rule

Business rules should live in server/domain services.

Example:

```text
Can this request accept uploads?
```

must not be determined only by React UI logic.

---

# 111. Configuration Rule

Do not hard-code:

```text
file limits
plan limits
URLs
bucket names
email settings
```

when they are environment/product configuration.

Use typed configuration.

---

# 112. Feature Flag Rule

Feature flags may be used for:

- experimental workflows
- beta features
- gradual rollout

Do not use feature flags to hide broken production logic indefinitely.

---

# 113. No AI Feature Rule

AI is not a requirement.

Do not add:

- AI summaries
- AI naming
- AI classification
- AI OCR

unless customer research proves a meaningful workflow problem.

The core product must be valuable without AI.

---

# 114. Feature Priority Rule

Prioritize in this order:

```text
Reliability
Security
Core workflow
UX
Observability
Performance
Retention features
Growth features
AI / advanced features
```

---

# 115. Feature Acceptance Rule

Every feature needs:

```text
purpose
user story
acceptance criteria
failure states
security implications
analytics event if relevant
test coverage
```

---

# 116. Research Rule

Before implementing a major integration, research the current official documentation.

Especially for:

- Google OAuth
- Google Drive API
- Google quotas
- R2 uploads
- Supabase
- payment APIs

Never rely on outdated AI memory for provider behavior.

---

# 117. Official Source Rule

For technical provider decisions, prefer:

1. official documentation
2. official changelogs
3. official API references
4. reputable technical sources

Do not base critical architecture on random tutorials.

---

# 118. Current API Rule

Third-party APIs change.

Before implementing:

```text
Google Drive
Cloudflare R2
Supabase
Stripe
Resend
```

verify the current API behavior.

---

# 119. Architecture Change Rule

If implementation discovers that an architecture decision is wrong:

Do not force the implementation to match a broken plan.

Instead:

```text
identify problem
→ explain impact
→ propose alternative
→ update architecture
→ implement
```

---

# 120. Documentation Rule

Important technical decisions must be documented.

Examples:

```text
Why R2?
Why Supabase?
Why queue-based transfer?
Why this OAuth scope?
Why this upload limit?
```

---

# 121. Decision Record Rule

For high-impact decisions, create a lightweight ADR.

Format:

```text
Decision
Context
Options
Chosen option
Why
Tradeoffs
```

---

# 122. Memory Rule

`memory.md` must remain a concise project memory.

It should contain:

- current state
- completed phases
- active architecture decisions
- known issues
- unresolved decisions
- next action

Do not turn it into a giant duplicate PRD.

---

# 123. Phase Rule

Implementation must follow `phases.md`.

Do not skip foundational validation to reach UI polish.

Especially do not skip:

```text
OAuth proof
Drive transfer proof
upload reliability
security isolation
```

---

# 124. No UI-First Rule

Do not spend the majority of development time polishing the dashboard before proving:

```text
Google OAuth
→ upload
→ Drive transfer
```

The backend workflow is the product's primary technical risk.

---

# 125. Vertical Slice Rule

Whenever possible, build complete vertical slices.

Example:

```text
Create Request
+
Generate Link
+
Open Public Page
+
Upload One File
+
Transfer to Drive
+
Show Success
```

A working vertical slice is more valuable than ten unfinished screens.

---

# 126. MVP Rule

MVP means:

> **The smallest production-quality version of the core workflow.**

MVP does not mean:

> **the fastest hack possible.**

---

# 127. Market Readiness Rule

Before calling the product "ready":

- real Google accounts must work
- real Drive destinations must work
- public links must work
- real external uploads must work
- Drive transfers must work
- failure recovery must work
- security boundaries must be tested
- abuse controls must exist
- privacy documentation must exist

---

# 128. Demo Rule

A demo is not proof of production readiness.

A successful:

```text
happy-path demo
```

does not prove:

```text
reliability
security
scalability
```

All three must be tested separately.

---

# 129. Manual QA Rule

Before each major release, manually test:

```text
desktop requester
mobile requester
desktop uploader
mobile uploader
slow network
large file
invalid file
expired request
paused request
closed request
Drive revoked
Drive folder deleted
duplicate upload
browser refresh
browser close/reopen
```

---

# 130. Browser Compatibility Rule

The public uploader should be tested on major current browsers, especially:

```text
Chrome
Safari
Edge
Firefox
iOS Safari
Android Chrome
```

Exact support matrix can be narrowed based on analytics after launch.

---

# 131. Accessibility QA Rule

Test:

```text
keyboard only
screen reader where practical
mobile touch
zoom
focus navigation
error announcements
```

---

# 132. Security Review Rule

Before public launch, perform a focused security review covering:

```text
authentication
authorization
public tokens
uploads
storage
OAuth
database
secrets
CORS
CSRF
XSS
rate limiting
abuse
file processing
```

---

# 133. Dependency Security Rule

Run dependency vulnerability checks before production.

Do not knowingly deploy critical vulnerabilities without a documented mitigation.

---

# 134. Secret Rotation Rule

The project must have a plan to rotate:

```text
Google secrets
R2 credentials
database credentials
API keys
encryption keys
```

If a secret leaks:

```text
revoke
rotate
audit
deploy
```

Do not merely delete the secret from the codebase.

---

# 135. Incident Rule

If production has a serious incident:

1. contain
2. protect users
3. stop abuse
4. preserve relevant logs
5. identify root cause
6. fix
7. test
8. document
9. prevent recurrence

---

# 136. No Silent Data Loss Rule

Never silently delete user files or metadata.

If data cannot be transferred:

```text
show failure
retain temporarily
allow recovery
```

within the defined retention window.

---

# 137. Customer-Owned Drive Rule

The user's Google Drive remains customer-owned.

The application must not:

- delete unrelated files
- modify unrelated permissions
- move unrelated files
- scan unrelated content

---

# 138. Minimum Google Drive Access Rule

Only request and use the Drive access necessary for the workflow.

Do not turn a file-request tool into a full Drive browser without an explicit product/security reason.

---

# 139. Folder Isolation Rule

The selected destination folder is the boundary for delivery.

The application should not assume access to the rest of the Drive.

---

# 140. Public Request Privacy Rule

The public page should reveal only:

```text
request title
description
requested items
upload constraints
configured branding
```

Nothing else.

---

# 141. Email Privacy Rule

Do not expose other uploader identities in notification emails unless the requester explicitly needs that information.

---

# 142. SEO Rule

SEO content must solve actual search intent.

Do not generate hundreds of low-quality AI pages merely to capture keywords.

---

# 143. Growth Rule

Growth features must not compromise the core product.

Do not:

- add intrusive referral popups
- spam uploaders
- sell uploader data
- add unnecessary ads
- interfere with file collection

---

# 144. Monetization Rule

Charge the requester.

Do not make the external uploader pay to submit a file in the standard workflow.

---

# 145. Free Plan Abuse Rule

If a free plan exists, it must have explicit usage limits.

Never allow:

```text
unlimited anonymous uploads
```

on a free plan without strong abuse controls.

---

# 146. Pricing Rule

Pricing must be validated through customer research.

Do not assume:

```text
$9 / $19 / $49
```

is correct merely because it is common SaaS pricing.

---

# 147. Billing Rule

Billing must not block the core engineering architecture.

Stripe/payment implementation should be isolated behind a billing module.

---

# 148. Future Integration Rule

Future providers should be implemented as adapters:

```text
GoogleDriveAdapter
DropboxAdapter
OneDriveAdapter
```

Do not rewrite the request domain for every new storage provider.

---

# 149. Future AI Rule

If AI is added later, AI must be:

```text
optional
explainable
bounded
privacy-conscious
```

AI must never silently process sensitive customer files for unrelated purposes.

---

# 150. AI Coding Safety Rule

An AI coding agent must not:

- remove security checks to fix a bug
- disable RLS
- expose service keys
- broaden OAuth scopes without approval
- disable rate limits
- remove validation
- ignore TypeScript errors
- suppress tests
- delete failing tests
- hard-code credentials
- replace real APIs with fake success
- silently rewrite architecture

---

# 151. AI Debugging Rule

When an AI agent encounters an error, it must:

```text
reproduce
→ inspect
→ identify root cause
→ propose fix
→ implement
→ test
→ report
```

Not:

```text
change random files until error disappears
```

---

# 152. AI Context Rule

AI agents should receive only the context required for the current task.

Do not repeatedly ask an agent to regenerate the entire application.

---

# 153. AI Code Review Rule

After AI implementation, review:

```text
security
authorization
data flow
error handling
performance
duplicate logic
dependencies
tests
```

AI-generated code is not automatically trusted.

---

# 154. AI Completion Claim Rule

An AI agent may not claim:

> "Feature complete"

unless:

- implementation exists
- build passes
- tests pass
- runtime behavior is verified
- known limitations are stated

---

# 155. No Unverified Claims Rule

Never state:

```text
Google Drive integration works
```

unless a real integration test has succeeded.

Never state:

```text
uploads are secure
```

without appropriate security testing.

---

# 156. Documentation Consistency Rule

When architecture changes, update:

```text
architecture.md
memory.md
phases.md
```

where relevant.

Do not allow documents to describe contradictory systems.

---

# 157. Versioning Rule

Each major artifact should have:

```text
version
date
status
```

When major decisions change, increment the version.

---

# 158. Definition of Complete

A feature is complete only when:

```text
implemented
+
validated
+
tested
+
error-handled
+
secured
+
observable
+
documented
```

---

# 159. Definition of Production Ready

Production-ready means:

```text
Core workflow works
+
Google OAuth works
+
Drive transfer works
+
Failure recovery works
+
Security boundaries work
+
Abuse controls work
+
Monitoring works
+
Backups work
+
Privacy behavior is documented
+
Deployment is reproducible
```

---

# 160. Final Non-Negotiable Rules

The following rules override convenience:

```text
1. Never expose Google credentials to uploaders.

2. Never trust the client for authorization.

3. Never treat an upload as complete before backend verification.

4. Never treat an upload as finally delivered before Drive transfer succeeds.

5. Never perform Drive transfer as an unbounded synchronous request.

6. Never retry forever.

7. Never create duplicate Drive files because of retries.

8. Never store permanent copies of customer files without a clear product reason.

9. Never disable security controls to make a demo work.

10. Never ship fake functionality.

11. Never silently swallow production errors.

12. Never use production credentials for unsafe development testing.

13. Never broaden Google OAuth permissions without deliberate review.

14. Never let one user access another user's data.

15. Never allow public upload endpoints to operate without abuse controls.

16. Never let AI coding agents silently change architecture.

17. Never optimize vanity metrics over successful file collection.

18. Never add AI just because the product is an AI-era startup.

19. Never sacrifice reliability for visual polish.

20. The core workflow always comes first.
```

---

# 161. Ultimate Project Rule

Everything in this project should ultimately protect one promise:

> **Create a request, send one link, let someone upload without Drive access, and reliably get those files into your Google Drive.**

If the system does that exceptionally well, the product has a foundation.

If it cannot do that reliably, no amount of:

- AI
- animations
- dashboards
- templates
- integrations
- marketing
- branding

can compensate.

The engineering priority is therefore:

```text
CORRECTNESS
    ↓
SECURITY
    ↓
RELIABILITY
    ↓
SIMPLICITY
    ↓
UX
    ↓
PERFORMANCE
    ↓
SCALE
    ↓
GROWTH
    ↓
ADVANCED FEATURES
```

This ordering should govern the entire project.
