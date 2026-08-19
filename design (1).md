# DESIGN — Intake

**Document:** Product UX, UI & Design System Specification  
**Product:** Intake  
**Version:** 1.0  
**Date:** 2026-08-18  
**Status:** Master design specification

---

# 1. Design North Star

The product should feel like:

> **Google Drive's simplicity + Stripe's clarity + Linear's polish + Dropbox File Request's utility.**

But it must not visually copy any competitor.

The experience should communicate:

```text
Simple
Fast
Trustworthy
Professional
Calm
Modern
```

The product should never feel like:

```text
AI wrapper
generic form builder
bloated enterprise SaaS
technical developer tool
cheap upload utility
```

---

# 2. Core Design Principle

The product has two very different users.

## Requester

The person who owns the Google Drive.

They want:

```text
Create request
→ Send link
→ Know files arrived
```

## Uploader

The external person receiving the link.

They want:

```text
Open link
→ Understand what is needed
→ Select files
→ Upload
→ Done
```

The uploader should not feel like they are "using a SaaS application."

They should feel like:

> **"I was asked to send some files, and this is the easiest possible way to do it."**

---

# 3. Primary Product Promise

The entire interface should reinforce:

> **Request files directly into your Google Drive.**

Supporting message:

> **Send one link. They upload. Everything lands in your Drive.**

---

# 4. Design Principles

## 4.1 One Primary Action

Every screen should have one obvious primary action.

Examples:

```text
Dashboard
→ Create request

Request builder
→ Create request

Request detail
→ Copy link

Uploader
→ Upload files

Upload complete
→ Done
```

---

## 4.2 Progressive Disclosure

Do not expose every setting immediately.

Default:

```text
Title
Description
Files
Destination
Create
```

Advanced options can appear behind:

```text
More options
```

---

## 4.3 Reduce Cognitive Load

Never make users understand internal concepts such as:

```text
submission
transfer job
storage object
queue
OAuth
R2
```

Use human language.

Instead of:

```text
TransferJob: PROCESSING
```

show:

```text
Sending to Google Drive…
```

---

## 4.4 Status Must Be Honest

Never show:

```text
Complete
```

until the operation is actually complete.

Use meaningful states:

```text
Uploading…
Processing…
Sending to Drive…
Saved to Drive
```

---

## 4.5 Trust Is a Feature

The product handles customer documents.

Visual design must communicate:

```text
secure
private
reliable
professional
```

Avoid exaggerated security claims.

---

# 5. Visual Direction

## Overall Style

Use:

```text
minimal SaaS
high whitespace
strong typography
subtle borders
soft surfaces
restrained shadows
small-radius controls
minimal decoration
```

Avoid:

```text
heavy gradients
glassmorphism everywhere
huge shadows
neon colors
excessive rounded cards
3D illustrations
AI sparkle effects
```

---

# 6. Color System

Use a neutral-first system.

## Base

```text
Background:
near-white / very light neutral

Surface:
white

Foreground:
near-black

Muted:
gray

Border:
light gray
```

## Primary Accent

Use one restrained brand accent.

Suggested direction:

```text
deep blue / indigo
```

The exact brand color should be finalized after visual testing.

## Semantic Colors

Use:

```text
Success → green
Warning → amber
Error → red
Info → blue
```

Semantic colors should never become the dominant visual identity.

---

# 7. Dark Mode

Dark mode should be supported architecturally but does not need to be the initial design priority.

If implemented:

```text
background → deep neutral
surface → slightly lighter neutral
foreground → near-white
border → subtle dark gray
```

Avoid pure:

```text
#000000
```

for the entire interface.

---

# 8. Typography

Use a modern system sans-serif.

Recommended:

```text
Inter
```

or a strong system fallback.

Typography hierarchy:

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

# 9. Typography Scale

Suggested baseline:

```text
Display:
48–64px

H1:
32–40px

H2:
24–32px

H3:
18–22px

Body:
15–16px

Small:
13–14px

Caption:
12px
```

Mobile should reduce display sizes appropriately.

---

# 10. Font Weight

Use:

```text
Regular
Medium
Semibold
Bold
```

Avoid excessive bold text.

Primary actions should generally use:

```text
Medium / Semibold
```

---

# 11. Spacing System

Use a consistent spacing scale.

Recommended:

```text
4
8
12
16
20
24
32
40
48
64
80
96
```

Do not use arbitrary spacing values throughout the UI.

---

# 12. Border Radius

Use restrained rounding.

Suggested:

```text
Buttons:
8–10px

Inputs:
8–10px

Cards:
12–16px

Large surfaces:
16–20px
```

Avoid making every element a pill.

Pills should be reserved for:

```text
status
tags
small labels
```

---

# 13. Shadows

Use shadows sparingly.

Primary surfaces should rely more on:

```text
border
surface contrast
spacing
```

than heavy shadows.

---

# 14. Icons

Use one icon system consistently.

Recommended:

```text
Lucide
```

Icons should be:

```text
simple
stroke-based
consistent
```

Avoid mixing multiple icon libraries.

---

# 15. Logo

The brand mark should be:

```text
simple
recognizable
usable at 16–24px
```

The logo should not visually depend on:

```text
Google Drive logo
```

The product integrates with Drive but is not Google Drive.

---

# 16. Layout System

Authenticated application:

```text
sidebar
+
main content
```

Desktop:

```text
┌──────────────┬──────────────────────────────┐
│              │                              │
│   Sidebar    │          Main                │
│              │                              │
│              │                              │
└──────────────┴──────────────────────────────┘
```

Mobile:

```text
Header
──────
Content
──────
Bottom / menu navigation where needed
```

---

# 17. Application Navigation

Keep navigation minimal.

Initial:

```text
Requests
Settings
```

Potential later:

```text
Templates
Team
Billing
Integrations
```

Do not expose future sections before they exist.

---

# 18. Sidebar

Sidebar should contain:

```text
Logo
Requests
────────
Settings
Help
Account
```

Primary CTA:

```text
+ New request
```

Keep it visually dominant.

---

# 19. Top Bar

Top bar can contain:

```text
Page title
optional breadcrumb
search only if needed
account menu
```

Do not add a large navigation header to every page.

---

# 20. Landing Page

The landing page should explain the product in seconds.

Structure:

```text
Navbar
↓
Hero
↓
How it works
↓
Problem / workflow
↓
Product preview
↓
Use cases
↓
Trust / security
↓
Pricing
↓
FAQ
↓
CTA
↓
Footer
```

---

# 21. Landing Navbar

Minimal:

```text
Logo
Product
Pricing
Resources
Log in
Get started
```

Do not overcrowd the navbar.

---

# 22. Hero

The hero should immediately answer:

```text
What is it?
Who is it for?
Why is it useful?
```

Suggested structure:

### Eyebrow

```text
FILE REQUESTS FOR GOOGLE DRIVE
```

### Headline

> **Get files from anyone, straight into your Google Drive.**

### Supporting copy

> **Create a request, send one link, and let clients upload files without giving them access to your Drive.**

### Primary CTA

```text
Create a request
```

### Secondary CTA

```text
See how it works
```

---

# 23. Hero Visual

Do not use a generic stock illustration.

Use an actual product UI composition.

Example:

```text
Request created
      ↓
"Website Redesign"
      ↓
✓ Logo
○ Brand Guidelines
○ Product Images
      ↓
[ Copy upload link ]
```

The visual should demonstrate the product immediately.

---

# 24. Product Preview

Use real-looking UI.

Never create a fake dashboard that contains functionality the product does not actually have.

Marketing screenshots should remain consistent with the real application.

---

# 25. How It Works

Three steps:

```text
01
Create a request

02
Send the link

03
Files land in Drive
```

Each step should use one sentence.

No long technical explanation.

---

# 26. Problem Section

Show the old workflow:

```text
"Please email me the files."

"Can you resend the logo?"

"Where should I upload these?"

"Can you give me Drive access?"
```

Then:

```text
One link.
One place.
Done.
```

Use this section to communicate pain rather than overexplaining features.

---

# 27. Use Cases

Cards:

```text
Agencies
Freelancers
Accountants
Recruiters
Lawyers
Photographers
Real estate
Small businesses
```

Each should have a one-line workflow example.

Example:

```text
Agencies
Collect logos, brand assets, content and approvals from clients.
```

---

# 28. Trust Section

Communicate:

```text
Your files go to your Google Drive.
Uploaders don't get Drive access.
```

Do not claim:

```text
military-grade
100% secure
completely anonymous
```

unless technically and legally defensible.

---

# 29. Pricing

Keep pricing simple.

Initial structure can be:

```text
Free
Pro
Business
```

Exact pricing should be validated separately.

Avoid 5–7 plans.

---

# 30. FAQ

Questions should address actual objections:

```text
Does the uploader need a Google account?
Can they see my Drive?
Where do uploaded files go?
What happens if my Drive connection expires?
What file sizes are supported?
Can I close a request?
Can I receive multiple submissions?
```

---

# 31. Authentication Screen

Authentication should be extremely simple.

Primary:

```text
Continue with Google
```

Supporting copy:

```text
Connect your Google Drive and start collecting files.
```

Do not require a traditional email/password system in MVP unless there is a validated reason.

---

# 32. Onboarding

The onboarding should not be a multi-page tutorial.

Ideal flow:

```text
Sign in
↓
Connect Drive
↓
Choose folder
↓
Create first request
```

The first request itself should teach the product.

---

# 33. First-Time Empty State

Dashboard empty state:

```text
No requests yet.

Collect files without giving anyone
access to your Google Drive.

[ Create your first request ]
```

Include a small product preview if useful.

---

# 34. Dashboard

The dashboard should answer:

```text
What requests exist?
What needs attention?
What arrived recently?
```

---

# 35. Dashboard Layout

Suggested:

```text
┌──────────────────────────────────────────────┐
│ Requests                          + New      │
├──────────────────────────────────────────────┤
│                                              │
│ Active requests                              │
│                                              │
│ Website redesign     3/5 files     Active    │
│ Tax documents        8/8 files     Complete  │
│ Hiring documents     1/4 files     Active    │
│                                              │
└──────────────────────────────────────────────┘
```

---

# 36. Request Card

Each card should show:

```text
Request title
status
progress
last activity
expiration
```

Example:

```text
Website redesign

3 of 5 files received

● Active
Updated 12 min ago
```

Primary interaction:

```text
Open request
```

---

# 37. Status Design

Use text + subtle visual indicator.

Examples:

```text
● Active
● Paused
● Complete
● Expired
● Closed
```

Do not rely on color alone.

---

# 38. Request Builder

The request builder is one of the most important authenticated screens.

Structure:

```text
Title
Description

Files needed
┌───────────────────────────┐
│ Logo              Required│
│ Brand guidelines  Required│
│ Product images    Optional│
└───────────────────────────┘

Destination
Google Drive / Client Assets

Advanced options

[ Create request ]
```

---

# 39. Request Builder Header

Use:

```text
Create request
```

Supporting text:

```text
Tell people what you need and we'll give you one upload link.
```

---

# 40. File Requirement Component

Each item should contain:

```text
icon
name
required/optional
allowed file types
optional description
delete
reorder
```

Example:

```text
▦  Logo
    Required
```

---

# 41. Adding Requirements

Primary interaction:

```text
+ Add file requirement
```

When clicked:

```text
Name
Description
Required?
Allowed types
Maximum size
```

Keep advanced configuration collapsed.

---

# 42. Request Destination

Display clearly:

```text
Google Drive
Website Redesign
```

Use a Drive-style folder icon only as an integration indicator.

Do not imply the uploader can browse the folder.

---

# 43. Advanced Options

Potential:

```text
Expiration
Uploader name
Uploader email
Maximum submission size
Branding
```

Do not make advanced settings visually equal to the core flow.

---

# 44. Create Request CTA

Primary button:

```text
Create request
```

After creation:

```text
Request created
```

Then immediately present:

```text
Upload link
[ Copy link ]
```

---

# 45. Request Detail Page

This is the requester's operational hub.

Header:

```text
Website redesign
Active
```

Primary CTA:

```text
Copy upload link
```

---

# 46. Request Detail Layout

Suggested:

```text
Header
↓
Progress
↓
Requested files
↓
Recent submissions
↓
Drive destination
↓
Request settings
```

---

# 47. Progress Component

Example:

```text
3 of 5 files received

██████████░░░░░
```

Progress must reflect actual successfully received state.

---

# 48. File Status

Example:

```text
✓ Logo
  Saved to Google Drive

✓ Brand guidelines
  Saved to Google Drive

○ Product images
  Waiting
```

For transfer state:

```text
Uploading…
Processing…
Sending to Google Drive…
```

---

# 49. Recent Submission

Show:

```text
Alex Morgan
4 files
Completed
Today, 3:42 PM
```

Do not expose more uploader information than necessary.

---

# 50. Public Upload Page

This is the highest-priority external experience.

The page should feel:

```text
lightweight
trustworthy
focused
```

No dashboard navigation.

---

# 51. Public Page Layout

Desktop:

```text
             Logo

        Website redesign

     Please send the following files.

     ┌───────────────────────────┐
     │ ✓ Logo                    │
     │ ○ Brand guidelines        │
     │ ○ Product images          │
     └───────────────────────────┘

        [ Select files ]

       Upload status

     Files will be securely delivered
     to the requested destination.

             Footer
```

---

# 52. Public Header

Keep it minimal.

Potential:

```text
brand
```

or:

```text
Requested by [business]
```

Do not expose the requester's Google account.

---

# 53. Public Request Title

Large and prominent.

Example:

> **Website redesign**

Supporting text:

> Please upload the files below.

---

# 54. Request Checklist

This is a core differentiator.

Example:

```text
Files needed

○ Logo
  PNG, SVG, or JPG

✓ Brand guidelines
  PDF

○ Product images
  JPG or PNG
```

The checklist should update as files arrive.

---

# 55. Upload Area

Initial state:

```text
┌──────────────────────────────────┐
│                                  │
│       Drop files here            │
│                                  │
│       or                         │
│                                  │
│       [ Choose files ]           │
│                                  │
│       Max 2 GB per file          │
│                                  │
└──────────────────────────────────┘
```

On mobile:

```text
[ Choose files ]
```

should be the dominant interaction.

---

# 56. Upload File Row

Example:

```text
logo.png
1.8 MB

████████████░░ 82%

Uploading…
```

After upload:

```text
✓ logo.png

Uploaded
```

During transfer:

```text
✓ logo.png

Sending to Google Drive…
```

For public UX, the uploader should not need to understand the technical difference between R2 and Drive.

---

# 57. Multiple Files

Show all selected files in a clear list.

Example:

```text
3 files selected

✓ logo.png
✓ brand-guide.pdf
↻ products.zip
```

Allow removing a file before final submission.

---

# 58. Submission CTA

Use:

```text
Submit files
```

only if the workflow requires an explicit submission step.

If files automatically submit after upload, use:

```text
Upload files
```

The final interaction must be extremely clear.

---

# 59. Public Success Screen

Success should feel reassuring.

Example:

> **Files sent.**

Supporting text:

> Your files have been submitted successfully.

If Drive transfer is asynchronous:

```text
Your files are being delivered.
You can close this page.
```

Do not falsely claim:

```text
Saved to Google Drive
```

until backend confirmation exists.

---

# 60. Public Error Screen

Avoid technical errors.

Bad:

```text
Error 500 / Google Drive API exception
```

Good:

> **Something went wrong.**

Then:

```text
Your files are still safe.
Try again.
```

If the issue requires requester action:

> **This upload request is temporarily unavailable. Please contact the person who sent you the link.**

---

# 61. Expired Request Screen

Example:

> **This request has expired.**

Supporting text:

> Ask the person who sent this link for a new upload request.

No login CTA.

---

# 62. Closed Request Screen

Example:

> **This request is closed.**

Supporting text:

> The requester is no longer accepting files through this link.

---

# 63. Paused Request Screen

Example:

> **Uploads are temporarily paused.**

Supporting text:

> Please try again later or contact the requester.

---

# 64. Invalid Link

Do not reveal whether a particular token ever existed.

Generic message:

> **This upload link isn't available.**

This reduces enumeration leakage.

---

# 65. Uploader Identity

If configured:

```text
Your name
Your email
```

Keep it optional by default.

Do not force account creation.

---

# 66. Mobile Design

Mobile is critical.

Public upload page should prioritize:

```text
request title
checklist
choose files
progress
submit
```

Avoid:

```text
sidebar
complex navigation
large marketing sections
```

---

# 67. Mobile File Picker

The design should work naturally with:

```text
camera
photos
files
downloads
cloud providers
```

where supported by the browser/OS.

---

# 68. Responsive Breakpoints

Use a simple responsive system.

Suggested:

```text
mobile:
< 640px

tablet:
640–1024px

desktop:
> 1024px
```

Do not design every breakpoint independently.

---

# 69. Accessibility

Every interactive element must support:

```text
keyboard
focus
screen reader labels
semantic HTML
```

Upload status should be announced appropriately.

---

# 70. Focus States

Never remove browser focus indicators without replacing them with a clearly visible custom state.

---

# 71. Forms

Inputs should have:

```text
label
placeholder where useful
helper text
error text
```

Never use placeholder text as the only label.

---

# 72. Validation

Validation should be:

```text
immediate where helpful
server-validated always
specific
actionable
```

Example:

Bad:

```text
Invalid file.
```

Good:

```text
Product images must be JPG or PNG.
```

---

# 73. Buttons

Primary:

```text
Create request
Upload files
Copy link
Connect Drive
```

Secondary:

```text
Cancel
Back
Settings
```

Destructive:

```text
Close request
Delete
Disconnect Drive
```

Destructive actions should require confirmation when consequences are significant.

---

# 74. Button States

Every asynchronous button needs:

```text
default
hover
active
disabled
loading
success/error where appropriate
```

Loading state must prevent accidental duplicate actions.

---

# 75. Toasts

Use toasts for lightweight confirmations:

```text
Link copied
Request created
Settings saved
```

Do not use toasts for important persistent errors.

---

# 76. Modals

Use modals only when the user must focus on a decision.

Good:

```text
Close request?
```

Avoid modalizing routine actions.

---

# 77. Confirmation Dialogs

Destructive:

```text
Close request?

People will no longer be able to upload files
through this link.

[ Cancel ] [ Close request ]
```

---

# 78. Loading Design

Prefer skeletons for page-level loading.

Use spinners for:

```text
button action
short operation
```

Do not create infinite spinners.

Every loading operation needs timeout/error behavior.

---

# 79. Empty States

Empty state should always include:

```text
what happened
why it matters
what to do next
```

---

# 80. Error States

Every major page needs a designed error state.

Structure:

```text
What happened
What the user can do
Retry
```

---

# 81. Notifications

Email design should be simple.

Example:

```text
New files received

Website redesign

Alex uploaded 4 files.

[ View request ]
```

Avoid exposing sensitive content in email.

---

# 82. Email Visual Identity

Email should match the application:

```text
logo
neutral background
white content card
clear typography
one primary CTA
```

---

# 83. Dashboard Notification

Do not create an excessive notification center in MVP.

A small:

```text
recent activity
```

section is enough.

---

# 84. Request Link Sharing

After creation, show a dedicated sharing panel:

```text
Your upload link

https://...

[ Copy link ]

Share via:
Email
Copy
```

The link should be the hero action.

---

# 85. Link Copy Feedback

After click:

```text
✓ Link copied
```

No modal.

---

# 86. QR Code

Do not include in MVP unless a use case emerges.

---

# 87. Branding

Initial product should have:

```text
product branding
```

Later Pro/Business may support:

```text
company logo
brand color
custom thank-you message
```

Do not build a complex branding editor initially.

---

# 88. File Icons

Use recognizable icons for:

```text
PDF
image
document
spreadsheet
archive
video
generic
```

Do not depend on color alone.

---

# 89. File Size Formatting

Use human-readable:

```text
1.8 MB
420 KB
2.4 GB
```

not:

```text
1892314 bytes
```

---

# 90. Time Formatting

Use human-friendly timestamps:

```text
Just now
12 min ago
Today, 3:42 PM
Yesterday
Aug 18, 2026
```

---

# 91. Request Expiration UI

Show subtle but visible information:

```text
Expires in 3 days
```

If close:

```text
Expires tomorrow
```

Do not create unnecessary urgency.

---

# 92. Design System Components

Core component inventory:

```text
Button
Input
Textarea
Select
Checkbox
Switch
Badge
Avatar
Tooltip
Dropdown
Modal
Toast
Tabs
Card
Table
Progress
Skeleton
Alert
FileDropzone
FileRow
RequestCard
RequestChecklist
StatusBadge
DriveFolderPicker
UploadProgress
SubmissionCard
```

---

# 93. Component Rule

Every component must have:

```text
clear purpose
consistent spacing
accessible semantics
loading state where applicable
error state where applicable
mobile behavior
```

---

# 94. Design Tokens

Define tokens for:

```text
color
spacing
radius
shadow
typography
z-index
motion
```

Do not scatter raw values throughout the codebase.

---

# 95. Motion

Motion should be subtle.

Use animation for:

```text
page transitions
upload progress
status changes
button feedback
```

Avoid:

```text
constant floating animations
scroll-jacking
large entrance animations
```

---

# 96. Motion Duration

Suggested:

```text
micro interaction:
100–150ms

normal:
150–250ms

large transition:
250–350ms
```

Respect:

```text
prefers-reduced-motion
```

---

# 97. Upload Animation

Progress should visually communicate:

```text
uploading
processing
complete
failed
```

Do not use decorative animation that hides the actual state.

---

# 98. Microcopy

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
AI-generated sounding copy
unnecessary exclamation marks
technical terminology
```

---

# 99. Microcopy Examples

Instead of:

```text
Initialize file transfer
```

Use:

```text
Upload files
```

Instead of:

```text
Authentication token invalid
```

Use:

```text
Reconnect Google Drive to continue.
```

Instead of:

```text
Submission successfully persisted
```

Use:

```text
Files received.
```

---

# 100. Brand Voice

The product should sound like:

> A smart professional helping you get files from someone.

Not:

> A technical platform explaining its infrastructure.

---

# 101. Security Copy

Good:

> **Uploaders don't get access to your Google Drive.**

Good:

> **Files are delivered to the Drive folder you choose.**

Avoid claims that cannot be verified.

---

# 102. Uploader Trust Copy

Near the upload area:

> **You don't need a Google account to upload.**

If technically true and supported by the current implementation.

Optional:

> **Your files will be sent to the requester through this upload link.**

---

# 103. Requester Trust Copy

Near Drive connection:

> **Choose where incoming files should be delivered.**

Avoid:

> "Give us access to your entire Drive."

---

# 104. Google Integration UI

When connected:

```text
Google Drive

Connected
```

Show destination:

```text
📁 Client Assets
```

If reauth required:

```text
Google Drive needs to be reconnected.

[ Reconnect ]
```

---

# 105. Drive Folder Picker

The picker should be intentionally limited.

Display:

```text
My Drive
  ↓
Clients
  ↓
Acme
  ↓
Website redesign
```

Do not build a full Drive file browser.

The goal is:

> Choose where files should go.

---

# 106. Request Detail — Drive Destination

Display:

```text
Files will be delivered to

Google Drive
Website redesign
```

Optional:

```text
Open folder
```

This action is requester-only.

---

# 107. Data Privacy In UI

Do not show:

```text
OAuth token
internal IDs
storage keys
queue IDs
database IDs
```

to users.

---

# 108. Settings

MVP settings:

```text
Profile
Google Drive connection
Email preferences
Account
```

Potential later:

```text
Team
Billing
Branding
Integrations
API
```

---

# 109. Account Deletion

Make it clear and serious.

Example:

> **Delete your account?**

Explain:

```text
Your Intake account and associated metadata will be deleted according to the data retention policy.

Files already delivered to your Google Drive will remain in your Drive.
```

---

# 110. Request Deletion

Avoid deleting Drive files when deleting a request unless explicitly designed and confirmed.

Default:

```text
delete request metadata
keep customer-owned Drive files
```

---

# 111. Pricing UX

Pricing page should answer:

```text
Who is this for?
What limit applies?
What happens if I exceed it?
```

Avoid complicated usage calculators initially.

---

# 112. Upgrade CTA

Do not interrupt the uploader's experience with pricing.

Billing belongs to the requester.

---

# 113. Responsive Dashboard

On mobile:

```text
Requests
↓
Request card
↓
Progress
↓
Actions
```

Tables should transform into cards where necessary.

---

# 114. Responsive Request Builder

On mobile:

```text
Title
↓
Description
↓
Files
↓
Destination
↓
Advanced
↓
Create
```

Use a sticky bottom CTA only if it genuinely improves usability.

---

# 115. Responsive Public Upload

Prioritize:

```text
title
checklist
file picker
progress
submit
```

The public page should be usable one-handed.

---

# 116. Performance Design

Do not load the entire application on the public page.

Public page should be:

```text
lightweight
fast
minimal JavaScript
```

Authenticated dashboard can load richer application components.

---

# 117. Skeleton Design

Skeletons should approximate the final layout.

Avoid giant blank spinners.

---

# 118. Offline / Network Loss UX

If upload loses network:

```text
Connection interrupted.

Trying again…
```

For resumable uploads:

```text
Resuming upload…
```

Do not reset the user's progress unnecessarily.

---

# 119. Duplicate File UX

If duplicate filenames are allowed:

```text
logo.png
logo (1).png
```

or store distinct files without confusing the uploader.

The exact naming strategy should be decided at implementation time.

---

# 120. File Requirement Matching

Do not attempt complex AI matching in MVP.

Basic matching should use explicit request items.

Example:

```text
Requested:
Logo

Uploaded:
logo-final.png
```

The user can associate files with the requirement where needed.

---

# 121. Multiple Upload Strategy

The UX should support:

```text
drag multiple files
select multiple files
upload individual files
```

without requiring the user to understand file-item relationships.

---

# 122. Large Upload UX

For large files:

```text
Uploading 1.4 GB…

You can leave this page open.
```

If resumable:

```text
Upload paused.
Resume
```

---

# 123. Accessibility of File Upload

The dropzone must have an accessible equivalent:

```text
Choose files
```

Drag-and-drop must never be the only interaction.

---

# 124. Color Accessibility

Do not communicate:

```text
success = green
error = red
```

without text/icons.

Always combine:

```text
icon + label + color
```

---

# 125. Marketing vs Product Design

Marketing pages can be expressive.

Product UI should be restrained.

Do not import every marketing animation into the dashboard.

---

# 126. Design Quality Bar

Before calling UI "finished," ask:

### Visual

- Is spacing consistent?
- Is typography coherent?
- Are borders/radii consistent?
- Are icons consistent?

### UX

- Is the next action obvious?
- Are errors understandable?
- Are loading states clear?
- Can a first-time user finish without instructions?

### Trust

- Does the product look safe?
- Does the copy avoid exaggerated claims?
- Does the UI make file delivery understandable?

### Mobile

- Does it work on a small screen?
- Are buttons easy to tap?
- Is upload obvious?

---

# 127. Usability Test

Before beta, test the following task:

> "You need to collect a logo and brand guidelines from a client. Use the product to create an upload request and send it to them."

Observe:

```text
Can they create it?
Do they understand the destination?
Do they find the link?
Does the uploader understand what to do?
```

Do not explain the product during the first attempt.

---

# 128. Five-Second Test

Show the landing page for five seconds.

Ask:

> "What does this product do?"

Expected answer should be close to:

> "It lets me collect files into my Google Drive."

If users answer:

```text
file sharing
cloud storage
forms
AI document management
```

the positioning/design needs improvement.

---

# 129. Uploader Five-Second Test

Open the public link.

Ask:

> "What are you supposed to do?"

Expected:

> "Upload these files."

If anything else is the dominant interpretation, simplify the page.

---

# 130. Design Anti-Patterns

Do not use:

```text
❌ huge hero copy with no product explanation
❌ fake dashboard screenshots
❌ excessive rounded cards
❌ excessive gradients
❌ decorative AI icons
❌ confusing status colors
❌ tiny upload buttons
❌ hidden error messages
❌ giant forms
❌ unnecessary onboarding tours
❌ technical terminology
❌ cluttered sidebar
❌ modal-heavy workflows
```

---

# 131. Design Priorities

Rank all design work:

```text
P0
Public upload experience
Request creation
Drive connection
Request status

P1
Dashboard
Request detail
Notifications
Settings

P2
Marketing polish
Advanced branding
Templates

P3
Decorative enhancements
```

---

# 132. Product UI Hierarchy

The visual hierarchy should consistently be:

```text
Primary action
↓
Current task
↓
Current status
↓
Supporting information
↓
Advanced controls
```

Never reverse this.

---

# 133. Final Core Flow

The complete experience should feel like:

```text
LANDING

"Get files from anyone,
straight into Google Drive."

        ↓

CREATE REQUEST

Website redesign

What do you need?

✓ Logo
✓ Brand guidelines
○ Product images

Choose Drive folder

[ Create request ]

        ↓

SHARE

Your request is ready.

[ Copy upload link ]

        ↓

UPLOADER

Website redesign

Please upload:

○ Logo
○ Brand guidelines
○ Product images

[ Choose files ]

        ↓

UPLOAD

logo.png          ✓
brand-guide.pdf   ✓
products.zip      ↗

        ↓

SUCCESS

Files received.

You can close this page.

        ↓

REQUESTER

Website redesign

3 of 3 files received

✓ Logo
✓ Brand guidelines
✓ Product images

Saved to Google Drive.
```

This is the design the entire product should optimize around.

---

# 134. Final Design Rule

The product should make the complicated system underneath feel invisible.

Under the hood:

```text
OAuth
R2
Queues
Workers
Validation
Retries
Drive API
Database
Monitoring
```

To the user:

```text
Create request.
Send link.
Get files.
```

That gap between technical complexity and perceived simplicity is the core design objective.

> **Make the system sophisticated underneath and almost boringly simple on top.**
