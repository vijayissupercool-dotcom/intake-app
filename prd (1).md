# PRD — Intake

**Document:** Product Requirements Document  
**Product:** Intake  
**Status:** Product definition / pre-build  
**Version:** 1.0  
**Date:** 2026-08-18  
**Owner:** Founder  
**Primary platform:** Web application  
**Initial integration:** Google Drive

---

## 1. Product Summary

Intake is a focused SaaS product that lets a Google Drive user create a secure file-request link and collect files from another person without giving that person access to the user's Google Drive.

The core promise:

> **Let anyone upload files to your Google Drive without giving them Drive access.**

The product sits between the requester's workflow and Google Drive:

```text
Requester
    │
    ├── Connect Google Drive
    │
    ├── Create File Request
    │       ├── Request title
    │       ├── Description
    │       ├── Required file items
    │       ├── Destination Drive folder
    │       └── Request settings
    │
    └── Generate secure upload link
                    │
                    ▼
             External uploader
                    │
                    ├── Opens link
                    ├── Sees only request information
                    ├── Uploads requested files
                    └── Submits
                    │
                    ▼
              Intake backend
                    │
                    ├── Validates request
                    ├── Validates upload
                    ├── Transfers file
                    ├── Creates metadata
                    └── Writes file to Drive
                    │
                    ▼
              Requester's Google Drive
```

The product is intentionally not another cloud-storage product. Files ultimately belong in the requester's Google Drive, while this product provides the missing collection workflow around Drive.

---

## 2. Problem

Google Drive is excellent at storing, sharing, and collaborating on files, but it does not provide a native Dropbox-style file-request workflow.

A March 2026 Google Drive Community thread specifically asked for a "file request" option; a Google Product Expert stated that this is not currently a Drive feature and pointed to Google Forms' file-upload question as the closest native workaround.

Source:
- Google Drive Community — "file request option", March 12, 2026:
  https://support.google.com/drive/thread/416603777/file-request-option?hl=en

The resulting workflow is fragmented.

### Current workflow

A professional often has to:

1. Create a Drive folder.
2. Share the folder.
3. Explain permissions.
4. Ask the client to upload files.
5. Follow up when files are missing.
6. Manually determine which files were received.
7. Rename or organize files.
8. Repeat the process for the next client.

This creates unnecessary communication and operational overhead.

### The real pain

The painful sentence is:

> "Please send me these files."

The deeper operational problem is:

> **There is no simple, structured, external-facing collection layer around the user's existing Google Drive.**

---

## 3. Opportunity

The opportunity is not to compete with Google Drive as storage.

The opportunity is to become:

> **The file-collection workflow layer for Google Drive.**

The initial product should solve one narrow workflow extremely well:

```text
Create request
→ define what is needed
→ generate link
→ external person uploads
→ files land in selected Drive folder
→ requester knows what arrived
```

This creates a natural recurring SaaS use case.

### High-frequency customer segments

- Freelancers
- Design agencies
- Web development agencies
- Marketing agencies
- Accountants
- Tax professionals
- Lawyers
- Recruiters
- HR teams
- Real-estate professionals
- Photographers
- Schools
- Consultants
- Small businesses
- Operations teams

The strongest early customers are expected to be professionals who repeatedly collect multiple files from external people.

---

## 4. Product Positioning

### Primary positioning

> **Request files directly into Google Drive.**

### Core value proposition

> **Send one link. They upload. Everything goes straight to your Google Drive.**

### Alternative concise positioning

> **The missing File Request button for Google Drive.**

The product should avoid positioning itself initially as:

- generic file storage
- generic forms
- Dropbox replacement
- AI document management
- enterprise content management
- generic customer portal

---

## 5. Product Principles

### 5.1 One job, extremely well

The product should make file collection dramatically easier without becoming a general-purpose workflow platform.

### 5.2 Google Drive remains the source of truth

The user's Drive is the destination and long-term storage system.

### 5.3 External uploader should not need Drive access

The uploader should interact with the request page, not the requester's Drive.

### 5.4 No unnecessary account creation

For the initial upload experience, the recipient should be able to upload through a request link without creating an account.

### 5.5 Structured requests beat generic upload boxes

The product should let requesters explicitly define what they need.

### 5.6 Security before convenience

A public upload link is an abuse target. Request tokens, rate limiting, upload restrictions, expiration, validation, abuse controls, and safe storage/transfer behavior are first-class requirements.

### 5.7 Do not reinvent storage

Avoid permanently storing user files on our infrastructure unless technically required for upload processing.

---

# 6. Goals

## 6.1 MVP goals

The MVP must allow a user to:

1. Sign in.
2. Connect Google Drive.
3. Select or create a destination folder.
4. Create a file request.
5. Add required and optional file items.
6. Configure basic upload rules.
7. Generate a unique shareable upload URL.
8. Share that URL with an external person.
9. Let the external person upload files without accessing Drive.
10. Transfer the files into the requester's selected Drive folder.
11. Show successful submission status.
12. Show received files in the requester dashboard.
13. Allow the requester to deactivate or expire a request.
14. Provide useful error states when uploads or Drive transfers fail.

## 6.2 Product-quality goals

The MVP should feel like a real SaaS product rather than a prototype.

It must have:

- polished responsive UI
- clear onboarding
- predictable states
- reliable uploads
- robust error handling
- secure request tokens
- observable backend operations
- retry-safe file transfer
- clean Google OAuth handling
- privacy-conscious architecture
- production-ready database structure
- useful audit events
- accessible UI

---

# 7. Non-Goals for MVP

The following are explicitly outside MVP scope:

- Dropbox integration
- OneDrive integration
- Box integration
- generic S3 storage
- full CRM
- full project management
- document editing
- e-signatures
- advanced OCR
- AI document classification
- AI summaries
- complex approval workflows
- native mobile applications
- enterprise SSO/SAML
- complex team permissions
- custom domains
- white-labeling
- advanced automation integrations
- public marketplace
- embedded website widgets

These may be evaluated after product-market validation.

---

# 8. Target Users

## 8.1 Primary persona — Freelancer

### Situation

A freelancer works with several clients and repeatedly asks clients for:

- logos
- brand assets
- copy
- product photos
- contracts
- reference material

### Current behavior

Email, WhatsApp, Google Drive shared folders, Google Forms.

### Pain

- Missing files
- Confusing permissions
- Repeated follow-ups
- Poor organization

### Desired outcome

Create a request in under one minute and send one link.

---

## 8.2 Primary persona — Agency

An agency collects assets during onboarding.

Example:

```text
Client: Acme
Project: Website Redesign

Required:
✓ Logo
✓ Brand Guidelines
○ Product Images
○ Existing Website Assets
○ Legal Documents
```

The agency needs a repeatable workflow rather than a one-off upload link.

---

## 8.3 Primary persona — Accountant / Tax Professional

Example request:

```text
Tax Return 2026

Required:
✓ PAN
✓ Aadhaar
○ Bank Statement
○ Form 16
○ Investment Proof
○ Rent Receipts
○ Previous ITR
```

The recurring nature makes this segment especially attractive.

---

## 8.4 Secondary personas

- Recruiter collecting candidate documents
- HR collecting employee onboarding documents
- Lawyer collecting case documents
- Realtor collecting property documents
- Photographer collecting client assets
- School collecting student/parent documents
- Consultant collecting project inputs

---

# 9. Core User Journeys

## 9.1 First-time requester

```text
Landing page
→ Sign up / Continue with Google
→ Connect Google Drive
→ Select destination folder
→ Create first request
→ Add requested files
→ Configure request
→ Create request
→ Copy link
```

Success condition:

The user has a functioning upload URL in less than a few minutes.

---

## 9.2 External uploader

```text
Open link
→ View request title + instructions
→ See requested files
→ Select/upload files
→ See progress
→ Fix validation errors if needed
→ Submit
→ See confirmation
```

The uploader should not need to understand how Google Drive works.

---

## 9.3 Requester receives files

```text
Upload begins
→ Backend validates
→ File transfer starts
→ File appears in destination Drive folder
→ Request status updates
→ Requester can see received item
```

The system must make the final state clear even if Drive transfer is temporarily delayed.

---

# 10. Core Features

## 10.1 Authentication

### MVP

- Google sign-in
- Session management
- Logout
- Account deletion
- Basic user profile

Google authentication is preferred because the core product destination is Google Drive.

---

## 10.2 Google Drive connection

The requester must explicitly authorize access to Google Drive.

The system should:

- initiate OAuth
- securely store refresh credentials/tokens as appropriate
- identify the connected Drive account
- allow selecting a destination folder
- verify access before creating requests
- handle revoked/expired authorization
- provide reconnect flow

Google Drive API exposes file creation/upload functionality and supports large media uploads. The API documentation currently lists a maximum file size of 5,120 GB for `files.create`.

Source:
- Google Drive API — `files.create`:
  https://developers.google.com/workspace/drive/api/reference/rest/v3/files/create

The final implementation must still enforce product-level upload limits well below provider maximums where appropriate.

---

# 11. File Request

A request is the primary product object.

### Request fields

```text
id
owner_id
destination_folder_id
destination_folder_name
title
description
slug/token
status
expires_at
created_at
updated_at
submitted_at
settings
```

### Request statuses

```text
DRAFT
ACTIVE
PAUSED
EXPIRED
CLOSED
```

### Request lifecycle

```text
DRAFT
  ↓
ACTIVE
  ↓
PAUSED
  ↓
ACTIVE
  ↓
CLOSED

ACTIVE
  ↓
EXPIRED
```

---

# 12. Requested File Items

Each request can contain multiple requested file items.

### Example

```text
Website Redesign

[Required] Logo
[Required] Brand Guidelines
[Required] Product Images
[Optional] Existing Website Assets
```

### Fields

```text
id
request_id
name
description
required
accepted_file_types
max_files
max_file_size
sort_order
status
created_at
updated_at
```

### Item states

```text
MISSING
UPLOADING
RECEIVED
FAILED
```

MVP should support multiple uploaded files per request item where useful, but the UI should remain simple.

---

# 13. Upload Link

Every active request gets a secure, non-guessable public token.

Example conceptual URL:

```text
https://app.example.com/r/<secure-token>
```

The token must:

- have high entropy
- not contain sequential IDs
- not expose internal database identifiers
- be revocable
- support expiration
- be rate-limited
- be safe to place in email/chat
- not reveal the requester's Drive information

The request page should expose only information intentionally configured for external users.

---

# 14. External Upload Experience

The external upload page is one of the most important product surfaces.

### Required UI

```text
[Brand / Product]

Website Redesign

Please upload the files below.

✓ Logo
✓ Brand Guidelines
○ Product Images
○ Legal Documents

[ Add files ]

[ Submit files ]

Files are uploaded securely.
```

### Requirements

- mobile responsive
- drag and drop on desktop
- file picker
- upload progress
- per-file progress
- retry failed upload
- remove selected file
- clear validation errors
- required/optional indication
- total upload progress
- completion state
- expiration state
- closed request state

---

# 15. Uploader Identity

MVP should support optional uploader information.

Possible fields:

- Name
- Email

The requester can enable or disable these fields.

Default recommendation:

- Name: optional
- Email: optional

Do not require a Google account.

If email is provided, it can be stored with the submission for audit/context.

---

# 16. Submission

A submission represents one uploader's upload session.

### Fields

```text
id
request_id
uploader_name
uploader_email
ip_hash / privacy-safe network identifier
user_agent_metadata
status
started_at
completed_at
created_at
updated_at
```

### Submission statuses

```text
STARTED
UPLOADING
PROCESSING
COMPLETED
PARTIAL_FAILURE
FAILED
```

The system should distinguish:

- uploader successfully submitted
- file successfully uploaded
- file successfully transferred to Google Drive

These are not necessarily the same event.

---

# 17. File Upload

Each uploaded file should have a separate lifecycle.

### File fields

```text
id
submission_id
request_item_id
original_filename
normalized_filename
mime_type
size_bytes
checksum
upload_status
drive_file_id
drive_web_url
failure_code
created_at
updated_at
```

### Upload states

```text
INITIALIZED
UPLOADING
UPLOADED
PROCESSING
TRANSFERRED
FAILED
QUARANTINED
```

---

# 18. Google Drive Destination

The requester selects a Drive folder.

The system should store:

```text
drive_account_id
drive_folder_id
drive_folder_name
```

The actual files should be written into the authorized user's selected Drive destination.

Google's Drive API supports file permissions and folder/file operations, including support for My Drive and shared drives where the authenticated user has appropriate access.

Source:
- Google Drive API — sharing and permissions:
  https://developers.google.com/workspace/drive/api/guides/manage-sharing

MVP should prioritize **My Drive folders** first.

Shared Drives should be treated as a later compatibility milestone unless the implementation can support them without increasing reliability risk.

---

# 19. File Transfer Architecture Requirement

The architecture must avoid coupling the public upload request directly to a fragile synchronous Google Drive API request.

Preferred conceptual flow:

```text
Uploader
   ↓
Upload service
   ↓
Temporary upload state
   ↓
Validation
   ↓
Transfer job
   ↓
Google Drive API
   ↓
Destination folder
```

The transfer operation must be retryable.

A failed Google Drive transfer must not require the uploader to upload the file again when the file is already safely held for retry.

---

# 20. Reliability Requirements

The system must be designed around failure.

### Possible failures

- uploader disconnects
- browser closes
- file upload fails
- request expires
- Google OAuth token expires
- Google revokes access
- Drive API returns transient error
- Drive quota exceeded
- destination folder deleted
- destination folder permission changes
- duplicate submission
- webhook/job retry
- server restart during processing

### Requirements

- resumable upload where appropriate
- retryable Drive transfer
- idempotent transfer jobs
- idempotent completion handling
- persistent job status
- exponential backoff
- dead-letter/failure state
- user-visible recovery path
- server-side validation

---

# 21. Security Requirements

Security is a core product requirement because the service handles files uploaded by unknown external parties.

## 21.1 Public request tokens

Use cryptographically secure random tokens.

Never use:

```text
/request/123
/request/acme-001
```

as the sole authorization mechanism.

---

## 21.2 Authorization isolation

An uploader must never be able to:

- list the requester's Drive
- list other requests
- see other submissions
- access another request's files
- retrieve arbitrary files by guessing IDs
- change destination folder
- modify request configuration

---

## 21.3 Upload validation

Validate on the server:

- request status
- request expiration
- file size
- MIME type
- file count
- request-item rules
- rate limits
- abuse limits

Never trust browser-provided MIME type alone.

---

## 21.4 Malware / dangerous content

The initial architecture must leave room for malware scanning.

MVP policy should be explicit.

Possible implementation:

```text
Upload
→ quarantine
→ scan
→ approved
→ Drive transfer
```

If a third-party scanning service is not used in the first release, the product must clearly document the limitation and keep the storage/processing layer isolated enough to add scanning later.

---

## 21.5 Rate limiting

Rate-limit:

- public request page
- submission creation
- upload initialization
- upload requests
- completion calls
- authentication endpoints
- Drive operations

Rate limits should be per request, IP/network signal, account, and other appropriate dimensions.

---

## 21.6 Abuse prevention

The system must be designed to prevent:

- spam upload links
- malicious file flooding
- storage abuse
- automated submission attacks
- denial-of-service through public requests
- request enumeration
- token brute forcing

Potential controls:

- per-request file count
- per-file size
- per-request total size
- request expiration
- CAPTCHA/risk challenge when suspicious
- rate limits
- account-level quotas
- abuse monitoring

CAPTCHA should not be forced on every legitimate uploader unless necessary.

---

# 22. Privacy Requirements

The product should minimize access to user data.

### Principle

> Access only what is necessary to deliver the requested workflow.

The application should avoid reading the user's entire Drive.

The user should select a destination folder, and the application should use the minimum practical permissions/scopes needed for the implemented workflow.

Google's API documentation indicates that several Drive scopes are classified as restricted and may require security assessment. OAuth scope selection therefore needs to be treated as a product-launch dependency, not an afterthought.

Source:
- Google Drive API authorization scope documentation:
  https://developers.google.com/workspace/drive/api/reference/rest/v3/files/create
- Google Drive API permissions documentation:
  https://developers.google.com/workspace/drive/api/guides/manage-sharing

The exact OAuth scope strategy must be validated experimentally before implementation is finalized.

---

# 23. Google OAuth / API Risk

This is one of the highest-risk technical areas.

The architecture must explicitly investigate:

1. Minimum viable OAuth scopes.
2. Whether `drive.file` is sufficient for the entire workflow.
3. Folder selection requirements.
4. Shared Drive support.
5. Token refresh behavior.
6. Token revocation.
7. Google OAuth consent-screen requirements.
8. Verification requirements.
9. Restricted-scope implications.
10. Security assessment implications.
11. Workspace admin restrictions.
12. Quota and rate-limit behavior.

The product must not assume that a broad `drive` scope is automatically acceptable for production.

---

# 24. Request Dashboard

The dashboard should show:

```text
Requests

Website Redesign
3 / 5 received
ACTIVE

Tax Documents 2026
7 / 7 received
COMPLETED

Candidate Documents
2 / 4 received
ACTIVE
```

### Dashboard actions

- Create request
- Open request
- Copy link
- Pause
- Resume
- Close
- Delete
- View submissions
- View destination folder
- Edit request

---

# 25. Request Detail

Example:

```text
Website Redesign

Status: Active
Destination: My Drive / Clients / Acme

Progress
████████████░░ 3 / 5

Files
✓ Logo
✓ Brand Guidelines
✓ Product Images
○ Legal Documents
○ Existing Website Assets

[Copy upload link]
[Open upload page]
[Pause request]
```

---

# 26. Submission Detail

The requester should be able to see:

- uploader name if provided
- uploader email if provided
- submission date/time
- requested items
- received files
- failed files
- Drive destination
- transfer status

Example:

```text
Submission #1042

Sarah Johnson
sarah@example.com

Received:
✓ logo.svg
✓ brand-guidelines.pdf
✓ product-images.zip

Drive status:
✓ All files transferred
```

---

# 27. Notifications

MVP should support at least one useful notification channel.

Recommended initial notification:

### Email notification to requester

```text
New files received

Sarah uploaded 3 files to:
Website Redesign

Open Request
```

Notifications should be configurable.

Do not overbuild a notification platform in MVP.

---

# 28. Request Settings

MVP settings:

### Request status

- Active
- Paused
- Closed

### Expiration

- Never
- Custom date

### Uploader fields

- Name
- Email

### File limits

- Max file size
- Allowed file types
- Max number of files

### Submission behavior

- Require all required items
- Allow partial submissions

The default should favor simplicity.

---

# 29. Request Templates

Not required for the first functional MVP, but architecture should allow templates later.

Example:

```text
Client Onboarding
- Logo
- Brand guidelines
- Company details
- Brand assets
```

Then:

```text
Create request
→ Use template
→ customize
→ generate link
```

Templates can become a strong retention feature.

---

# 30. UX Requirements

## 30.1 Product personality

The product should feel:

- calm
- trustworthy
- fast
- premium
- minimal
- professional
- obvious

Avoid:

- clutter
- excessive dashboards
- unnecessary animations
- enterprise jargon
- AI gimmicks
- complicated settings

---

## 30.2 Primary UX principle

A new user should understand the product in five seconds:

> **Create a request → send the link → receive files in Drive.**

---

# 31. Critical UI Screens

MVP screens:

1. Landing page
2. Sign in
3. Onboarding
4. Connect Drive
5. Dashboard
6. Create request
7. Request detail
8. Request settings
9. External upload page
10. Upload progress state
11. Upload success page
12. Submission detail
13. Error states
14. Account/settings
15. Billing placeholder if monetization is enabled

---

# 32. Landing Page Requirements

Hero:

> **Request files directly into Google Drive.**

Supporting statement:

> Send one link. Anyone can upload files without getting access to your Drive.

Primary CTA:

> Create a file request

Secondary CTA:

> See how it works

The landing page should demonstrate the workflow visually:

```text
Create request
      ↓
Send link
      ↓
Client uploads
      ↓
Files appear in Drive
```

---

# 33. Functional Requirements

## FR-001 — Authentication

The system shall allow a requester to authenticate securely.

## FR-002 — Drive connection

The system shall allow an authenticated requester to connect a Google Drive account.

## FR-003 — Destination selection

The system shall allow the requester to select a destination folder that they can write to.

## FR-004 — Request creation

The system shall allow creation of a request with title, description, settings, destination folder, and requested file items.

## FR-005 — Secure request URL

The system shall generate a cryptographically secure public request token.

## FR-006 — Public request access

The system shall allow an external uploader to open an active request without accessing the requester's Drive.

## FR-007 — File selection

The uploader shall be able to select one or more files.

## FR-008 — Validation

The system shall validate file count, size, type, request state, and expiration.

## FR-009 — Upload

The system shall upload files reliably and provide progress feedback.

## FR-010 — Drive transfer

The system shall transfer approved files into the requester's configured Google Drive destination.

## FR-011 — Transfer status

The system shall persist Drive transfer state.

## FR-012 — Retry

The system shall retry transient transfer failures.

## FR-013 — Completion

The system shall provide an unambiguous success state to the uploader.

## FR-014 — Dashboard

The requester shall be able to view all requests and their status.

## FR-015 — Request management

The requester shall be able to pause, resume, close, and delete requests.

## FR-016 — Submission history

The requester shall be able to view submissions and received files.

## FR-017 — Expiration

The system shall prevent new uploads after a request expires.

## FR-018 — Revocation

The requester shall be able to immediately invalidate a public upload link.

## FR-019 — Notifications

The system shall notify the requester when a submission is successfully completed.

## FR-020 — Auditability

The system shall record security- and workflow-relevant events.

---

# 34. Non-Functional Requirements

## NFR-001 — Performance

The dashboard should feel responsive under normal network conditions.

## NFR-002 — Upload reliability

Large uploads should not fail merely because a temporary network error occurs.

## NFR-003 — Security

Public upload endpoints must be protected against token enumeration and abuse.

## NFR-004 — Isolation

Requests belonging to one account must never be accessible to another account.

## NFR-005 — Availability

Core request and upload infrastructure should be designed for high availability.

## NFR-006 — Observability

Important upload and Drive transfer operations must be traceable.

## NFR-007 — Recoverability

Drive transfer failures must be recoverable without unnecessary re-upload.

## NFR-008 — Privacy

The product should minimize collection and retention of uploaded data.

## NFR-009 — Accessibility

Core flows should be usable with keyboard navigation and accessible labels.

## NFR-010 — Mobile usability

The external upload experience must work well on mobile browsers.

---

# 35. Data Model — Product-Level

The initial domain model should contain approximately:

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

### Relationships

```text
User
 ├── GoogleConnection
 ├── Request
 │    ├── RequestItem
 │    ├── Submission
 │    │    └── UploadedFile
 │    └── AuditEvent
 └── Notification

UploadedFile
 └── TransferJob
```

The architecture document will define the implementation-level schema.

---

# 36. Idempotency

Every operation that can be retried must be designed for idempotency.

Examples:

```text
create submission
initialize upload
complete upload
create transfer job
transfer file
mark submission complete
send notification
```

A repeated request must not accidentally:

- create duplicate Drive files
- duplicate submissions
- send duplicate notifications
- create duplicate jobs

Idempotency keys should be used where appropriate.

---

# 37. Drive File Naming

MVP should preserve original filenames by default.

Future optional naming rules may support:

```text
{request}-{item}-{original}
```

or:

```text
{client}-{item}-{date}
```

Do not force renaming in MVP.

---

# 38. Duplicate Files

The system should define a deterministic policy.

Recommended MVP:

- allow duplicate filenames
- Drive can distinguish files by ID
- show duplicate status in dashboard if useful

Future:

- replace
- skip
- version
- auto-rename

---

# 39. Upload Limits

Product-level limits should be configurable.

Example initial policy:

```text
Free:
- limited active requests
- limited total upload volume

Paid:
- higher limits
- larger files
- more active requests
```

Exact limits should be finalized after infrastructure and cost testing.

The product must never rely blindly on Google Drive's maximum theoretical file size.

---

# 40. Abuse / Cost Protection

Public upload links create a financial risk because an attacker could abuse the service to generate bandwidth, compute, storage, or Drive API usage.

The product must enforce:

- request-level quotas
- account-level quotas
- upload-size limits
- file-count limits
- rate limits
- request expiration
- abuse detection
- suspicious traffic controls
- transfer queue limits

The product should avoid unlimited anonymous uploads in the free tier.

---

# 41. Monetization Strategy

The product should eventually monetize the requester, not the uploader.

Potential dimensions:

- active requests
- monthly submission volume
- team seats
- advanced controls
- branding
- templates
- notifications
- analytics
- custom domains
- integrations

### Initial conceptual pricing

```text
Free
$9/mo
$19/mo
$49/mo
```

Pricing is a hypothesis, not a final requirement.

The final pricing should be based on customer interviews, competitor research, infrastructure costs, and willingness-to-pay testing.

---

# 42. MVP Definition

The MVP is complete when this end-to-end flow works reliably:

```text
User signs in with Google
        ↓
Connects Google Drive
        ↓
Selects a folder
        ↓
Creates:
"Website Redesign"
        ↓
Adds:
- Logo
- Brand Guidelines
- Product Images
        ↓
Generates request link
        ↓
Client opens link
        ↓
Client uploads 3 files
        ↓
Upload completes
        ↓
Backend validates
        ↓
Files transfer to Google Drive
        ↓
Requester sees:
3 / 3 received
        ↓
Files are visible in selected Drive folder
```

If any of the above is unreliable, the product is not MVP-complete.

---

# 43. MVP Acceptance Criteria

### Authentication

- [ ] Google sign-in works.
- [ ] Logout works.
- [ ] Sessions are secure.
- [ ] Account isolation works.

### Google Drive

- [ ] OAuth connection works.
- [ ] Destination folder selection works.
- [ ] Authorization errors are handled.
- [ ] Revoked access is detected.
- [ ] Reconnect flow works.

### Request creation

- [ ] Request can be created.
- [ ] Request title works.
- [ ] Description works.
- [ ] File items work.
- [ ] Required/optional works.
- [ ] Expiration works.
- [ ] Request can be paused.
- [ ] Request can be closed.

### Public uploader

- [ ] Link opens without Drive access.
- [ ] Request information renders.
- [ ] Files can be selected.
- [ ] File validation works.
- [ ] Upload progress works.
- [ ] Failed uploads can retry.
- [ ] Completion works.
- [ ] Expired requests cannot receive uploads.

### Drive delivery

- [ ] Files reach correct destination folder.
- [ ] Original filenames are preserved.
- [ ] Drive file IDs are persisted.
- [ ] Transfer status is persisted.
- [ ] Transient failures retry.
- [ ] Permanent failures are visible.
- [ ] Duplicate processing is prevented.

### Dashboard

- [ ] Requests are listed.
- [ ] Progress is shown.
- [ ] Submissions are visible.
- [ ] Drive destination is visible.
- [ ] Link can be copied.
- [ ] Request can be paused/closed.

### Security

- [ ] Request tokens are unguessable.
- [ ] Cross-account access is impossible.
- [ ] Public endpoints are rate-limited.
- [ ] Upload limits are enforced server-side.
- [ ] Sensitive credentials are not exposed to clients.
- [ ] Audit events exist for important actions.

---

# 44. Success Metrics

The product should be measured around successful file collection, not vanity metrics.

## Activation

Primary activation event:

> User successfully creates a request and receives at least one uploaded file into Google Drive.

### Supporting metrics

- sign-up → Drive connection rate
- Drive connection → request creation rate
- request creation → link share rate
- link share → first submission rate
- first submission → successful Drive transfer rate

---

# 45. Retention Metrics

Track:

- requests created per active account
- submissions per account
- active requests per account
- repeat request creation
- 7-day requester retention
- 30-day requester retention
- monthly file-collection volume

The strongest retention signal is:

> **A user creates multiple requests for different people/projects.**

---

# 46. Revenue Metrics

Eventually track:

- free → paid conversion
- MRR
- ARPU
- churn
- expansion revenue
- active paid accounts
- revenue per active request
- cost per active account
- gross margin

---

# 47. Product-Market Fit Signal

A strong early signal would be users saying:

> "I send these requests to clients every week."

A weaker signal is:

> "Cool, I tried the uploader once."

The product needs recurring workflows.

---

# 48. Competitive Context

The market is not empty.

Examples of existing solutions include:

- cloudHQ's "File Request for Google Drive"
- FileDrop / FileDrop Forms
- FileChute
- other Google Drive upload/form products

cloudHQ currently lists a Google Workspace Marketplace product specifically for collecting files directly into Google Drive, with secure upload links, email alerts, and tracking. The listing was updated July 21, 2026.

Source:
- Google Workspace Marketplace — File Request for Google Drive by cloudHQ:
  https://workspace.google.com/marketplace/app/file_request_for_google_drive_by_cloudhq/723821788650

Competitive analysis also shows a category of Google Drive upload tools ranging from simple upload links to more workflow-oriented file collection products.

Source:
- FileDrop comparison, June 2026:
  https://getfiledrop.com/best-google-drive-file-upload-tools-compared/

Therefore, the product cannot rely on:

> "Nobody does this."

That would be false.

The opportunity is to build a substantially better, simpler, more modern workflow.

---

# 49. Differentiation Strategy

The product should differentiate around:

## 49.1 Request-first workflow

Not a generic upload form.

## 49.2 Required-file checklist

The requester defines exactly what is needed.

## 49.3 Excellent external UX

The uploader experience should be faster and cleaner than traditional forms.

## 49.4 Google Drive-native destination

Files appear in the user's existing workflow.

## 49.5 Zero Drive exposure

The external person interacts only with the request.

## 49.6 Reliable transfer

The system should make "files are in my Drive" the final guaranteed workflow state.

## 49.7 Professional use cases

Templates and repeat workflows should eventually target specific professional jobs.

---

# 50. Risks

## Risk 1 — Google API / OAuth restrictions

Potentially the biggest technical launch risk.

Mitigation:

- validate OAuth scopes early
- build a minimal technical proof
- document Google verification requirements
- avoid unnecessary Drive scopes

---

## Risk 2 — Existing competitors

Competitors already provide Drive upload links.

Mitigation:

- better UX
- checklist-first requests
- strong workflow
- modern design
- excellent reliability
- targeted vertical templates

---

## Risk 3 — Abuse

Public links can be abused.

Mitigation:

- rate limits
- quotas
- expiration
- request-level controls
- abuse detection
- CAPTCHA/risk challenges when necessary

---

## Risk 4 — Google Drive transfer failure

Mitigation:

- queue-based transfer
- retry
- idempotency
- durable job states
- reconnect flow

---

## Risk 5 — Infrastructure costs

Anonymous uploads can generate large bandwidth costs.

Mitigation:

- quotas
- upload limits
- paid usage thresholds
- direct/resumable upload strategy where appropriate
- minimize unnecessary file movement

---

## Risk 6 — Product becomes bloated

Mitigation:

Maintain the core loop:

```text
Request → Upload → Drive
```

Every feature must improve this loop.

---

# 51. Technical Validation Before Full Build

Before building the complete application, the following proof must succeed:

### POC-001

Google OAuth login.

### POC-002

Connect Drive.

### POC-003

Select a destination folder.

### POC-004

Create a test file in that folder through the Drive API.

### POC-005

Generate a public request token.

### POC-006

Anonymous browser uploads a file.

### POC-007

Backend transfers the file into the authorized user's Drive.

### POC-008

Uploader cannot access Drive metadata.

### POC-009

OAuth token refresh works.

### POC-010

Drive API failure can be retried without duplicate file creation.

### POC-011

Large-file upload behavior is acceptable.

### POC-012

Request expiration prevents new submissions.

The complete product should not be built before these critical assumptions are proven.

---

# 52. No-Code / Vibe-Coding Requirement

The product will be developed using no-code / AI-assisted coding tools.

Therefore, all implementation decisions must favor:

- clear architecture
- modular services
- explicit data models
- simple deployment
- managed infrastructure
- strong API boundaries
- minimal custom infrastructure
- observable workflows
- reproducible environments
- documented configuration
- easy debugging

No-code does not mean no engineering discipline.

The generated system must still behave like a production SaaS.

---

# 53. Recommended Product Architecture Direction

The exact stack belongs in `architecture.md`, but the PRD requires the following architectural properties:

```text
Web Client
   │
   ▼
Application/API Layer
   │
   ├── Auth
   ├── Requests
   ├── Submissions
   ├── Uploads
   ├── Drive Integration
   ├── Notifications
   └── Billing/Usage
          │
          ▼
       Database
          │
          ├── Request state
          ├── Upload state
          ├── Drive metadata
          └── Audit state

Upload Processing
   │
   ▼
Transfer Queue / Jobs
   │
   ▼
Google Drive API
```

The architecture document must choose the concrete no-code/low-code stack and deployment model after evaluating:

- Google OAuth
- file-upload handling
- background jobs
- object storage
- database
- secrets
- rate limiting
- email
- observability
- cost
- vendor lock-in

---

# 54. Design System Direction

The design document will define the exact visual system.

High-level requirements:

### Requester dashboard

- minimal
- dense enough for professional work
- clear status
- excellent hierarchy

### Create request

Should feel like a focused builder, not a complicated form.

### External upload page

Should feel almost frictionless.

Primary visual priority:

```text
What do you need?
        ↓
Upload here
        ↓
You're done
```

No dashboard-like UI should be exposed to the uploader.

---

# 55. Analytics Events

Core events:

```text
user_signed_up
drive_connected
drive_connection_failed
request_created
request_updated
request_activated
request_paused
request_closed
request_link_copied
request_page_viewed
submission_started
file_selected
upload_started
upload_progress
upload_failed
upload_completed
drive_transfer_started
drive_transfer_failed
drive_transfer_completed
submission_completed
notification_sent
request_expired
```

Analytics must never leak sensitive file contents.

---

# 56. Audit Events

Security/workflow events should include:

```text
AUTH_LOGIN
AUTH_LOGOUT
DRIVE_CONNECTED
DRIVE_RECONNECTED
DRIVE_DISCONNECTED
REQUEST_CREATED
REQUEST_UPDATED
REQUEST_PAUSED
REQUEST_RESUMED
REQUEST_CLOSED
REQUEST_EXPIRED
SUBMISSION_CREATED
FILE_UPLOADED
FILE_TRANSFERRED
FILE_TRANSFER_FAILED
```

---

# 57. Error Handling

Errors must be understandable.

Bad:

> Error 403.

Good:

> Google Drive access is no longer available. Reconnect your Drive account to continue receiving files.

Uploader:

> This request is no longer accepting files.

Upload:

> This file is larger than the allowed limit.

Transfer:

> Your file was uploaded successfully, but we're still moving it into Google Drive. You can safely leave this page.

This distinction is important because upload completion and Drive transfer completion are different states.

---

# 58. Account Deletion

Account deletion must:

1. revoke/disconnect Google authorization where appropriate
2. stop active request processing
3. invalidate public request tokens
4. delete application metadata according to retention policy
5. avoid deleting user-owned Drive files unless explicitly intended and clearly confirmed
6. document what happens to already-transferred files

The product must never unexpectedly delete the user's Google Drive content.

---

# 59. Data Retention

The product should minimize retention.

Preferred model:

```text
Temporary upload data
        ↓
Transfer to Drive
        ↓
Delete temporary data after successful transfer
```

Retention exceptions may exist for:

- failed transfers
- support/debugging
- abuse investigation
- legal obligations

Retention periods must be explicitly defined in the security/privacy implementation.

---

# 60. MVP Privacy Promise

The product should communicate clearly:

> Your files are delivered to your connected Google Drive. We do not use your files for AI training or advertising.

Any final privacy claim must match the actual infrastructure and data-processing behavior.

---

# 61. Future Roadmap

## Phase after MVP

### Workflow improvements

- request templates
- recurring requests
- automatic reminders
- request duplication
- better notifications
- client identification

### Professional workflows

- accountant onboarding template
- agency asset collection
- recruiting document collection
- legal intake
- real-estate document collection

### Integrations

- Gmail
- Slack
- Microsoft Teams
- Zapier
- Make
- webhooks

### Destination expansion

- Dropbox
- OneDrive
- Box
- S3

### Branding

- logo
- colors
- custom domain
- white-label pages

### Advanced workflow

- approvals
- review status
- comments
- document verification
- automated organization

AI should only be introduced when it solves a demonstrated workflow problem.

---

# 62. Launch Strategy

Initial acquisition should focus on users who already experience the pain.

Potential channels:

- freelancer communities
- agency communities
- accountant communities
- recruiter communities
- Google Workspace communities
- productivity communities
- SEO pages targeting file-request workflows
- comparison pages
- Product Hunt
- Reddit/community discussions where promotion is permitted
- direct outreach to small agencies and professionals

The strongest message remains:

> **Stop chasing clients for files. Send one upload link.**

---

# 63. SEO Opportunities

Potential intent-driven pages:

- Google Drive file request
- Google Drive request files
- Google Drive upload link
- upload files to Google Drive without access
- Google Drive client file upload
- collect files into Google Drive
- Dropbox file request alternative for Google Drive
- Google Drive file upload form
- Google Drive client portal upload
- Google Drive external file upload

SEO pages must provide genuinely useful workflow information rather than thin AI-generated pages.

---

# 64. Product North Star

The product's north-star metric should be:

> **Successful file collections delivered to Google Drive.**

A collection is successful when the requested files have been uploaded and are available in the requester's configured Drive destination.

This metric aligns product usage with actual customer value.

---

# 65. Definition of Done — Production MVP

The product is production-ready only when:

### Product

- [ ] Core workflow is intuitive.
- [ ] External upload experience is polished.
- [ ] Request management works.
- [ ] Required-file checklist works.

### Engineering

- [ ] Database migrations are reproducible.
- [ ] Secrets are managed securely.
- [ ] API authorization is enforced.
- [ ] Upload jobs are retryable.
- [ ] Drive transfers are idempotent.
- [ ] Rate limiting is active.
- [ ] Error states are handled.
- [ ] Logging is structured.

### Security

- [ ] Public tokens are high entropy.
- [ ] Cross-user access tests pass.
- [ ] Upload limits are enforced.
- [ ] Abuse controls exist.
- [ ] OAuth scopes are reviewed.
- [ ] Sensitive credentials never reach browser code.

### Reliability

- [ ] Google token refresh works.
- [ ] Drive API failures recover.
- [ ] Browser refresh does not corrupt submissions.
- [ ] Duplicate operations do not create duplicate files.
- [ ] Expired requests are blocked.

### Operations

- [ ] Error monitoring exists.
- [ ] Application health can be observed.
- [ ] Background jobs are visible.
- [ ] Failed transfers can be diagnosed.
- [ ] Backup/recovery procedures exist.

### Legal / trust

- [ ] Privacy policy exists.
- [ ] Terms exist.
- [ ] Data retention policy is defined.
- [ ] Account deletion behavior is documented.
- [ ] Google OAuth consent messaging is accurate.

---

# 66. Open Questions Requiring Validation

These must be answered during the architecture/technical validation phase:

1. What is the minimum Google Drive OAuth scope that supports folder selection and file creation reliably?
2. Can the application use `drive.file` for the entire MVP workflow?
3. What Google verification/security assessment requirements apply to the chosen scopes?
4. What is the best upload architecture for large files?
5. Should files temporarily pass through object storage, or can they be transferred more directly?
6. What no-code/low-code platform can reliably support resumable uploads and background jobs?
7. What database is best suited to the chosen platform?
8. What is the cheapest reliable job/queue mechanism?
9. How should malware scanning be integrated?
10. What exact quota limits should be applied per request/account?
11. How should shared drives be handled?
12. What happens if the destination folder is deleted?
13. What happens if the user's Drive authorization is revoked during an upload?
14. How should duplicate uploads be handled?
15. How should failed Drive transfers be surfaced to the requester?
16. How long should temporary uploaded files be retained?
17. Which competitor features are table stakes versus differentiators?
18. Which initial customer segment has the strongest willingness to pay?
19. What is the minimum feature set that users will pay for?
20. What pricing model best aligns with customer value and infrastructure costs?

---

# 67. Product Decision Rules

These rules guide future product decisions:

### Rule 1

If a feature does not improve file collection, organization, visibility, or reliability, it probably does not belong in the MVP.

### Rule 2

Never make the external uploader understand Google Drive.

### Rule 3

Never expose the requester's Drive structure to an external uploader.

### Rule 4

Never depend on a single synchronous request for a large-file transfer.

### Rule 5

Never trust client-side validation alone.

### Rule 6

Never add AI merely because it is fashionable.

### Rule 7

Every public upload endpoint must be treated as potentially hostile.

### Rule 8

The final customer-visible state is not "upload complete"; it is "files are safely in Drive."

### Rule 9

Prefer simple workflows over feature-rich dashboards.

### Rule 10

Build the MVP around recurring professional workflows rather than generic one-time uploads.

---

# 68. Final Product Thesis

Intake should become the simplest way for professionals to collect files from external people without giving those people access to Google Drive.

The winning product loop is:

```text
WHAT DO YOU NEED?
        ↓
CREATE REQUEST
        ↓
SEND LINK
        ↓
THEY UPLOAD
        ↓
FILES LAND IN DRIVE
        ↓
YOU KNOW WHAT'S MISSING
```

The product should not try to replace Google Drive.

It should make Google Drive dramatically better at one thing it currently does not provide natively:

> **Receiving structured file submissions from people outside your Drive.**

The product's long-term moat should not be the upload box.

It should be the accumulated workflow around file collection:

```text
Requests
→ Checklists
→ Submissions
→ Organization
→ Notifications
→ Templates
→ Recurring workflows
→ Integrations
→ Professional workflows
```

The initial product remains intentionally narrow.

**One promise. One core workflow. Extremely reliable execution.**
