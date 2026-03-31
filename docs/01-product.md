<!--
File: docs/01-product.md
Purpose: Product-level documentation for makemd based on the current Figma mockups.
Why it exists: the repository currently has no implementation source, so this file captures the product intent before engineering begins.
What it does: defines the product goal, core user flows, screen states, content model, and open questions that the design implies.
Connected to: Figma design `makemd-app` page 2, node `47:713`, and the future app/widgets/pages that will implement this behavior.
-->

# makemd product documentation

## 1. Product summary

`makemd` is a lightweight Markdown-to-PDF workspace with a split editor/preview layout on desktop and a compact tabbed layout on mobile.
The main job of the product is to let a user paste text or drop a file, edit Markdown, preview the rendered result, and export the output as PDF.

## 2. Product goal

The mockups show a product focused on fast, low-friction document transformation rather than a full authoring suite.
The user should be able to:

- start a new document immediately;
- paste Markdown or plain text;
- preview the rendered result without leaving the page;
- export the result to PDF;
- keep a visible history of recent documents when signed in;
- understand when content is not yet saved.

## 3. What problem it solves

The design suggests a simple workflow for people who want to turn short notes, drafts, or imported text into a shareable PDF.
Instead of using a heavyweight editor, the product keeps the mental model narrow:

- input on the left or in a mobile editor tab;
- preview on the right or in a mobile preview tab;
- export action always available;
- history and account state handled in a side rail.

## 4. Main user journeys

### 4.1 Start a new document

The sidebar has a prominent `New` action.
That means the default first step is creating a fresh workspace rather than navigating into an existing document.

Expected behavior:

- create a blank document state;
- move focus to the editor;
- mark the document as currently active;
- add it to history when the user is authenticated.

### 4.2 Paste or drop content

The empty-state mockup says `Paste text or drop file here`.
This indicates the product should accept at least two intake modes:

- direct paste into the editor;
- file drop, likely as a text or markdown source.

Expected behavior:

- normalize input into a document model;
- preserve the original source name when available;
- show the parsed content in the editor and preview areas.

### 4.3 Edit Markdown and verify preview

Desktop mockups use a two-panel layout:

- left side for the Markdown source;
- right side for rendered preview.

This is the central product loop.
The design does not show a rich toolbar, so the expected interaction model is text-first and keyboard-friendly.

### 4.4 Export to PDF

The design includes a persistent download action in the lower-right corner on desktop and in the top-right on mobile.
PDF export is the primary output of the application.

Expected behavior:

- generate a PDF from the current rendered document;
- keep the export action visible regardless of scroll position;
- let the user download the result without navigating away.

### 4.5 Review history and manage documents

The sidebar contains a document list with timestamps and item-level menus.
This implies the product supports a history of generated or edited files.

Expected behavior:

- show recent documents in reverse chronological order;
- indicate the currently selected document;
- support per-document actions such as open, copy, link, download, or delete;
- reveal a bulk-selection mode for multi-document actions.

### 4.6 Handle sign-in state

There are clear authorized and unauthorized states in the designs.
Unauthenticated users see a `Sign up` entry and a warning card about unsaved files.

Expected behavior:

- when signed out, history should be limited or ephemeral;
- when signed in, document history should persist;
- the UI should explain the cost of closing the window with unsaved work.

## 5. Screen states captured in the mockups

### 5.1 Authorized desktop

This is the main working state.
Characteristics:

- dark left sidebar;
- account avatar and email at the top;
- `New` primary button;
- history/document list;
- split editor + preview workspace;
- PDF export controls in the bottom-right;
- footer with help link.

### 5.2 Unauthorized desktop with files

This state replaces the account area with a sign-up CTA and a warning card.
The warning indicates that closing the window may discard unsaved files.

This is the strongest clue that persistence is tied to authentication.

### 5.3 Empty desktop

The empty state removes the document history and replaces it with a single prompt:
`Paste text or drop file here`.

This state likely appears when there are no imported files yet or the user has not created any documents.

### 5.4 Mobile

Mobile uses a compact top bar with:

- menu button;
- editor/preview tabs;
- download button.

The editor and preview are shown as separate views instead of a persistent split pane.
That is the correct mobile adaptation of the desktop experience.

## 6. Content model implied by the design

The mockups suggest a document entity with these fields:

- title or filename;
- content source;
- rendered preview content;
- created or updated timestamp;
- selection state;
- export availability;
- auth ownership or persistence state.

The visible `Heading line here`, `Paste Markdown here.pdf`, and `Today • 12:32` values are placeholder content, so production data should replace them dynamically.

## 7. Product rules implied by the UI

- The workspace is document-centric, not project-centric.
- Export is always available.
- The sidebar is the place for navigation and batch actions.
- The editor and preview must stay in sync.
- Empty and unauthorized states need clear user guidance.
- Mobile should preserve the same mental model with tabs.

## 8. Open questions

These are not answered by the current mockups and should be confirmed before implementation:

- Should the input accept only Markdown, or also plain text and arbitrary files?
- Should export support only PDF or multiple formats later?
- Is sign-in required for all history, or only for cloud sync?
- Should document titles be user-editable separately from file names?
- Should the preview be live-rendered client-side or server-generated for PDF parity?

## 9. Recommended implementation direction

The product should be implemented as a small set of FSD-aligned screens and widgets:

- page-level shell for desktop and mobile layouts;
- sidebar widget for account, new document, history, and warnings;
- editor/preview workspace widget for the document body;
- shared controls for buttons, tabs, checkbox, and icon buttons.

That keeps the product extensible if export formats, persistence, or collaboration are added later.

