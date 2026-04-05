# Signit — Document Preparation & eSign Platform

## Overview

Signit is a contract lifecycle management (CLM) and eSignature platform built as a client-side React prototype. It guides users through a 3-step flow to prepare, annotate, and send documents for signing.

---

## Architecture

- **Framework**: React 18 + Vite 5 + TypeScript 5
- **Styling**: Tailwind CSS v3 with semantic HSL design tokens in `index.css`
- **UI Library**: shadcn/ui components + Hugeicons icon set
- **Animation**: Framer Motion for panels, overlays, and transitions
- **State**: Global `EditorProvider` context wrapping all routes (persists data across steps)
- **Routing**: React Router v6 — `/` → `/participants` → `/editor`

---

## 3-Step Flow

### Step 1 — Add Documents (`/`)
- Upload files via drag-and-drop or file picker
- Classify each as **Primary**, **Supplement**, or **Attachment**
- Import from Google Drive, Dropbox, OneDrive
- Use templates or AI-generated documents
- Document queue panel (260px sidebar) with colored type indicators, reordering, rotation (PDF), and preview
- Validation: at least one primary document required to proceed

### Step 2 — Add Participants (`/participants`)
- Add signers, approvers, viewers with name + email/phone
- Contact autocomplete from mock data
- Sequential signing with parallel groups and order adjustment
- Approvers locked at Step 0
- Document visibility assignment per participant

### Step 3 — Prepare & Send (`/editor`)
- Full document editor workspace with annotation placement
- Right-side panel toolbar with grouped icons
- Dual-mode: CLM (full) and eSign modes via pill-style toggle in top bar
- Canvas starts empty — no pre-loaded annotations

---

## Editor Panel System (Step 3)

### Right Panel Toolbar — Icon Order

**CLM Mode** (top to bottom):
1. Fields (opens by default)
2. Variables
3. Comments
4. *(divider)*
5. AI Assistant (highlighted, spinning gradient border)
6. *(divider)*
7. Workflow
8. Tasks
9. Properties
10. Participants

**eSign Mode**: Fields, Participants, AI (only)

### Panel Behavior
- Panels slide in/out from the right (380px width, animated)
- Only one panel open at a time
- Mobile: panels render as bottom sheet (80vh)
- Mobile: toolbar becomes horizontal bottom bar

### Field Settings (DocuSign-style)
- Clicking a placed field opens settings **inline** within the Fields panel (replaces list)
- Back arrow returns to the Fields list
- Settings do NOT shift the canvas — no layout push
- Field settings are NOT shown on initial field placement — only on subsequent click

---

## Field Annotations

### Placement
- Drag field types from the Fields panel onto document pages
- Fields are color-coded per participant
- No auto-selection on drop — user must click to select

### Interaction
- **Drag**: Click and drag anywhere on the field to reposition freely
- **Resize**: Grab the bottom-right handle to resize (min 40×20px)
- **Select**: Click to select → shows resize handle + action toolbar
- **Deselect**: Click canvas background
- **Duplicate**: Via floating toolbar (copies with +20px offset)
- **Delete**: Via floating toolbar or hover × button

### Edge Cases
- Fields are absolute-positioned within document containers
- Dragging uses mouse event listeners on `window` for smooth tracking
- Resize handle is 3×3px larger than visual for easier grab
- `pointer-events-none` on label text prevents interfering with drag

---

## Top Bar Actions

### Document Title
- Displays as text with pencil icon on hover
- Click to switch to editable input
- Press Enter or blur to confirm
- Default: "Untitled Document"

### Assign Dialog
- Multi-assignee chip input with autocomplete (users + teams)
- Type to search, click or Enter (for emails) to add
- Backspace removes last chip when input is empty
- Role selector: Reviewer / Approver
- Permission level: stepped slider (View → Comment → Suggest → Edit)
- Optional message textarea
- Suggestions dropdown with avatar initials

### Share Dialog
- Email invite with permission levels (View/Comment/Edit)
- Collaborator list with roles
- Copy link functionality

### Settings Dialog
- Expiration date, reminders, language, access permissions

### Three-Dot Menu
- Share
- Export PDF

### Send Flow
1. Click "Send" → runs validation
2. **If issues found**: Shows "Review before sending" warning dialog
3. **If no issues**: Skips directly to Review & Send dialog
4. Post-send: Full-screen success overlay with auto-redirect

---

## Pre-Send Validation

### Missing Fields Warning Dialog
Triggered when:
- A signer has zero fields on any primary document
- A signer is visible to supplement/attachment documents without fields

### Dialog Structure
- Grouped by participant (card per signer)
- Primary doc issues: Shows animated SVG illustration + explanation text
- Supplement/Attachment issues: Radio selection for acknowledgment level:
  - **No action needed** — document for reference only
  - **Must view and accept** — signer must explicitly accept
- No inline action buttons — footer handles navigation (Go back / Continue to send)
- Info note about self-placement behavior

### Edge Cases
- If ALL signers have fields on ALL visible documents → dialog is skipped entirely
- Acknowledgment state is local to the dialog, saved to global context on "Continue"
- Both primary and supplement issues can appear in the same participant card

---

## Comments System

### Types
- **Inline**: Anchored to document sections, shown as margin bubbles
- **General**: Not section-specific, shown in comments panel

### Features
- Text selection → floating toolbar → "Add comment" action
- Comment bubbles in right margin (hidden when panel is open)
- Replies, resolve/reopen status
- Pending comment ref passed through context

---

## Design System

### Color Tokens (HSL)
- All colors defined as CSS variables in `:root` and `.dark`
- Semantic tokens: `--primary`, `--background`, `--foreground`, `--muted`, `--accent`, etc.
- Brand colors: `--brand-indigo`, participant colors
- Document type borders: Indigo (primary), Amber (supplement), Gray (attachment)

### Typography
- Font: system default via Tailwind
- Sizes: `text-[9px]` to `text-base` for UI elements

### Responsive
- Desktop: full panel layout with sidebar toolbar
- Mobile (`< 768px`): bottom toolbar + sheet panels
- `useIsMobile` hook for breakpoint detection

---

## State Management

### EditorProvider Context
Stores and persists across all 3 steps:
- `participants` — list of signers/approvers/viewers
- `placedFields` — annotation fields on documents (starts empty)
- `selectedFieldId` — currently selected field (null = none)
- `comments` — inline + general comments
- `variableValues` — smart field values (e.g., Client.Name)
- `documentAcknowledgments` — supplement/attachment ack levels per participant

---

## Known Limitations / Prototype Scope

1. **No real backend** — all data is in-memory mock state
2. **No PDF rendering** — documents are HTML mock content
3. **No file persistence** — uploaded files reset on refresh
4. **No real authentication** — no user sessions
5. **Field positions are pixel-based** — no percentage-based responsive positioning
6. **Mock participants** — pre-defined contact list for autocomplete
7. **No real email sending** — Send action shows success animation only
8. **PDF rotation** is visual only (CSS transforms, no file modification)
9. **Variables** use hardcoded mock values
10. **Comments** are seeded with mock data, not persisted
