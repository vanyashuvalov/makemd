<!--
File: docs/02-ui-components.md
Purpose: UI component inventory and behavior spec derived from the Figma mockups.
Why it exists: the design uses repeated patterns and states, so this file centralizes their responsibilities before code is written.
What it does: documents component purpose, variants, states, dependencies, and recommended FSD placement.
Connected to: Figma design `makemd-app` page 2, node `47:713`, and the future shared/entities/features/widgets layers.
-->

# makemd UI components documentation

## 1. Component map

The design is built from a small number of reusable parts:

- app shell;
- sidebar;
- document history list;
- document list item;
- selection / bulk-actions row;
- warning alert;
- primary action button;
- tabs;
- editor surface;
- preview surface;
- bottom export bar;
- icon buttons;
- checkbox states;
- footer.

## 2. Recommended FSD placement

This is a suggested mapping for future implementation:

- `shared/ui/button` for primary and icon buttons;
- `shared/ui/tabs` for desktop and mobile mode switching;
- `shared/ui/checkbox` for selection controls;
- `shared/ui/alert` for warning cards;
- `entities/document` for history item data and display;
- `widgets/sidebar` for the account, new button, tabs, and document list;
- `widgets/editor-preview` for the split workspace;
- `widgets/export-bar` for the persistent PDF controls;
- `pages/*` for responsive composition of the shell.

## 3. Component specs

### 3.1 App shell

**Purpose**

Provides the full-screen layout that contains the sidebar, editor, preview, and export controls.

**Problem it solves**

Keeps the product layout stable across desktop and mobile while allowing different states to swap in without rewriting structure.

**Context**

Used as the top-level container for authorized, unauthorized, and empty states.

**Connected to**

Sidebar, workspace, export bar, and footer.

**Variants**

- desktop split layout;
- mobile stacked/tabbed layout.

**States**

- loading;
- empty;
- signed out;
- signed in;
- document selected;
- document not selected.

### 3.2 Sidebar

**Purpose**

Holds identity, create-new action, navigation tabs, history list, and footer utilities.

**Problem it solves**

Centralizes document navigation and account-related information in one predictable rail.

**Context**

Appears as a dark vertical panel on desktop and as the primary navigation drawer on mobile.

**Connected to**

`New` button, tabs, document list, warning alert, footer, and auth state.

**Variants**

- authorized;
- unauthorized;
- unauthorized with warning;
- empty list.

**States**

- active document selected;
- bulk selection mode enabled;
- collapsed/compact mobile menu presentation.

### 3.3 Account block

**Purpose**

Displays the signed-in user identity.

**Problem it solves**

Makes it obvious whether the history and saved data belong to a specific account.

**Context**

Shown at the top of the sidebar in the authorized state.

**Connected to**

User auth module, avatar asset, and sidebar layout.

**Variants**

- authenticated with avatar;
- unauthenticated sign-up CTA.

### 3.4 Primary `New` button

**Purpose**

Starts a new document flow.

**Problem it solves**

Gives the user one dominant action and removes ambiguity about where to begin.

**Context**

Placed directly under the account area in the sidebar.

**Connected to**

Document creation feature and sidebar state.

**Variants**

- enabled;
- loading;
- disabled when creation is unavailable.

### 3.5 Tabs

**Purpose**

Switches between logical modes or views.

**Problem it solves**

On mobile, preserves access to Markdown input and preview without a split pane.

**Context**

Shown as two icon-only tabs on desktop sidebar and mobile top bar.

**Connected to**

Editor view and preview view.

**Variants**

- active;
- inactive;
- icon-only;
- icon + label if needed later.

**States**

- keyboard focused;
- selected;
- disabled.

### 3.6 Warning alert

**Purpose**

Communicates that unsaved work can be lost if the current window is closed.

**Problem it solves**

Sets expectations before the user loses content and encourages sign-up or persistence.

**Context**

Used only in the unauthorized state with existing files.

**Connected to**

Auth state, storage/persistence logic, and sidebar.

**Variants**

- warning;
- informational, if the product later adds less severe messaging.

### 3.7 Document history list

**Purpose**

Shows the user's recent documents.

**Problem it solves**

Lets the user reopen previous work quickly and understand the active document context.

**Context**

Rendered in the sidebar under helper text and tabs.

**Connected to**

Document entity, timestamps, selection state, and item actions.

**Variants**

- populated;
- empty;
- bulk-select mode;
- signed-out limited history.

### 3.8 Document list item

**Purpose**

Represents one document in history.

**Problem it solves**

Encodes document identity, freshness, and item-level actions in a compact card.

**Context**

Shows a leading file icon, title, timestamp, optional trailing menu, and selection control.

**Connected to**

Document entity data and per-item action menu.

**Variants**

- default;
- active;
- selected;
- selectable;
- selectable with overflow menu.

**States**

- hovered;
- focused;
- keyboard-selected;
- disabled.

### 3.9 Selection / bulk-actions row

**Purpose**

Shows how many documents are selected and exposes bulk operations.

**Problem it solves**

Supports deleting, downloading, linking, or copying multiple documents at once.

**Context**

Appears only when selection mode is active.

**Connected to**

Checkboxes, document list items, and bulk action handlers.

**Actions shown in the design**

- delete;
- download;
- link;
- copy.

### 3.10 Checkbox

**Purpose**

Marks a document or group as selected.

**Problem it solves**

Provides a clear visual language for single and multi-select modes.

**Context**

Used in sidebar history rows and bulk selection states.

**Connected to**

Document list items and selection row.

**Variants**

- default;
- indeterminate;
- active/checked.

**States**

- hovered;
- focused;
- disabled.

### 3.11 Editor surface

**Purpose**

Lets the user edit Markdown or text.

**Problem it solves**

Provides the source-of-truth input for rendering and export.

**Context**

Displayed as a large white pane with line numbers in desktop mockups and as the main tab on mobile.

**Connected to**

Markdown parser, preview renderer, and PDF export pipeline.

**Variants**

- split-pane desktop editor;
- mobile editor view;
- empty editor;
- populated editor.

**States**

- focused;
- dirty/unsaved;
- read-only if preview-only mode ever appears later.

### 3.12 Preview surface

**Purpose**

Shows the rendered Markdown output.

**Problem it solves**

Lets the user verify structure, typography, and content before export.

**Context**

Displayed next to the editor on desktop and as a separate tab on mobile.

**Connected to**

Markdown renderer, document state, and export pipeline.

**Variants**

- desktop preview;
- mobile preview;
- empty preview;
- rendered preview.

**States**

- loading render;
- synced with editor;
- stale if render fails.

### 3.13 Bottom export bar

**Purpose**

Keeps PDF-related actions visible and always reachable.

**Problem it solves**

Avoids making the user scroll to find export, rename, copy, or edit actions.

**Context**

Anchored to the bottom-right of the desktop workspace and simplified in mobile.

**Connected to**

Document filename, rename action, copy action, and download action.

**Visible controls in the design**

- document name chip with pencil icon;
- copy button;
- download button.

### 3.14 Icon button

**Purpose**

Represents compact actions that would be too dense as text buttons.

**Problem it solves**

Saves space in the export bar, tabs, menus, and sidebar utility areas.

**Context**

Used for menu, download, copy, help, and item overflow actions.

**Connected to**

Shared iconography and action handlers.

**Variants**

- circle;
- square;
- textless;
- with label.

### 3.15 Footer

**Purpose**

Provides low-priority product metadata and help access.

**Problem it solves**

Lets the sidebar close with a clean, non-distracting endcap.

**Context**

Shown at the bottom of the sidebar as `makemd © 2026` plus `Help`.

**Connected to**

Help center, product branding, and global layout.

## 4. Behavior notes

- The sidebar should stay visually stable while document content changes.
- The active document needs a clear selected state.
- Bulk actions should appear only when meaningful.
- The editor and preview should stay synchronized.
- The export bar should remain visible above page edges or internal scrolling.
- Mobile should replace split panes with tabs rather than squeezing the desktop layout.

## 5. Asset and naming notes

The mockups use `tabler:*` icons consistently.
That means the implementation should probably standardize on a single icon set instead of mixing multiple libraries.

Suggested reusable names:

- `Sidebar`;
- `DocumentHistoryList`;
- `DocumentHistoryItem`;
- `DocumentSelectionBar`;
- `MarkdownEditor`;
- `MarkdownPreview`;
- `PdfExportBar`;
- `AppTabs`;
- `WarningAlert`;
- `IconButton`.

## 6. Open questions for UI implementation

- Should the document chip in the export bar open a rename dialog or trigger clear/reset?
- Should the mobile tabs show labels or stay icon-only on small screens?
- Should the document list support keyboard multi-select from day one?
- Should the footer remain visible on very short screens or be hidden behind a drawer on mobile?

