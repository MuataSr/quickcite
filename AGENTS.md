# AGENTS.md

Guidelines for agentic coding agents working in the QuickCite repository.

## Project Overview

QuickCite is a Chrome extension (Manifest V3) for saving quotes from web pages with auto-generated MLA/APA/Chicago citations. It uses a service worker + popup UI architecture with no external build tools or dependencies.

## Build/Lint/Test Commands

This project has no build system, package.json, or automated tests. All testing is manual.

### Manual Testing

1. Load extension: `chrome://extensions/` → Enable "Developer mode" → "Load unpacked" → Select project directory
2. Follow test cases in `TESTING.md`
3. Debug service worker: `chrome://extensions/` → Click "service worker" link
4. Debug popup: Right-click popup → Inspect

### Reset Storage

```javascript
chrome.storage.local.clear()
```

### No Linting

No linter is configured. Follow code style guidelines below.

## Code Style Guidelines

### JavaScript

#### Imports

No imports needed. This is a Chrome extension using global Chrome APIs:
- `chrome.contextMenus`
- `chrome.storage.local`
- `chrome.scripting`
- `chrome.runtime`
- `chrome.tabs`

#### Formatting

- 2-space indentation
- Single quotes for strings (double quotes for HTML inside template literals)
- No trailing commas
- Max line length: 100 characters

#### Section Headers

Organize code with block comments:

```javascript
// ============================================================================
// SECTION NAME: Brief description
// ============================================================================
```

#### Function Naming

- Use camelCase: `createQuoteItem`, `generateMlaCitation`
- Prefix with verb: `get`, `set`, `create`, `delete`, `load`, `save`, `extract`, `generate`
- Boolean functions: `isVideoUrl`, `isArxivUrl`, `hasVideoMetadata`

#### Variable Naming

- camelCase for all variables
- DOM elements: descriptive names like `quoteList`, `emptyState`, `modalQuoteText`
- Boolean variables: prefix with `is`, `has`, `should`

#### Error Handling

Always use try/catch with console logging:

```javascript
try {
  // operation
} catch (error) {
  console.error('Operation failed:', error);
}
```

#### Async/Await

Use async/await (not `.then()` chains):

```javascript
async function loadQuotes() {
  try {
    const result = await chrome.storage.local.get('quotes');
    // process result
  } catch (error) {
    console.error('Failed to load quotes:', error);
  }
}
```

#### Template Literals

Use template literals for HTML generation and string interpolation:

```javascript
const html = `
  <div class="quote-item">
    <p class="quote-text">"${escapeHtml(text)}"</p>
  </div>
`;
```

### HTML

- Use semantic elements where appropriate
- Quote attributes with double quotes
- Inline SVG icons (no icon library)

### CSS

#### Theming

All styles use CSS custom properties defined in theme files (`themes/*.css`):

```css
:root {
  --color-bg: #F8F6F1;
  --color-text-primary: #1A1A1A;
  --font-body: 'Courier Prime', monospace;
}
```

Never hardcode colors directly. Always reference CSS variables.

#### Organization

Each theme file is self-contained with:
1. CSS custom properties (`:root`)
2. Reset & base styles
3. Component styles
4. Utility classes

### Data Model

Quote objects follow this schema:

```javascript
{
  id: string,              // crypto.randomUUID()
  text: string,            // Selected quote text
  sourceTitle: string,     // Page/paper title
  sourceUrl: string,       // Full URL
  author: string | null,   // Extracted author
  sourceName: string | null,
  timestamp: ISO 8601 string,
  accessDate: string,
  creationDate: string | null,
  tags: string[],
  volume: string | null,
  issue: string | null,
  pages: string | null,
  doi: string | null,
  publisher: string | null,
  sourceReliability: string,
  sourceCategory: string,
  sourceWarnings: string[],
  sourceDescription: string | null,
  contentType: string | null,
  isVideo: boolean,
  videoChannel: string | null,
  videoPlatform: string | null,
  videoUploadDate: string | null
}
```

### Security

- Always escape HTML when inserting user content: `escapeHtml(text)`
- Use `chrome.storage.local` (not `localStorage`)
- Never log or expose secrets/API keys

### Chrome Extension Best Practices

- Service worker (`background.js`) is the extension's background process
- Use `chrome.scripting.executeScript` for content script injection
- Message passing: `chrome.runtime.sendMessage` / `chrome.runtime.onMessage`
- Context menus must be created on install and service worker start

### File Structure

```
/
├── manifest.json       # Extension manifest (Manifest V3)
├── background.js       # Service worker (context menu, quote capture)
├── popup.html          # Extension popup UI
├── popup.js            # Popup functionality
├── styles.css          # Redirects to themes/typewriter.css
├── themes/             # Theme CSS files
│   ├── typewriter.css  # Default theme (retro newsroom)
│   ├── neon.css        # High-contrast dark theme
│   └── ...
├── icons/              # Extension icons (16, 32, 48, 128px)
├── model/              # ML model for citation classification
├── models/             # Trained model weights
├── docs/               # Documentation
│   └── internal/       # Internal dev docs (not for distribution)
├── store/              # Chrome Web Store assets
│   ├── listing.md      # Store description draft
│   ├── PRE-SUBMISSION-CHECKLIST.md
│   └── screenshots/    # Store screenshots (1280x800)
├── LICENSE             # MIT License
├── PRIVACY.md          # Privacy policy
├── TESTING.md          # Manual test protocol
├── AGENTS.md           # This file - guidelines for AI agents
└── .gitignore          # Git exclusions
```

### Permissions Justification

| Permission | Purpose |
|------------|---------|
| `storage` | Save quotes locally on user's device |
| `activeTab` | Access selected text when user interacts with extension |
| `contextMenus` | Add "Save Quote" to right-click menu |
| `scripting` | Inject toast notifications into pages |
| `notifications` | Show error notifications (fallback) |
| `host_permissions: <all_urls>` | Capture quotes from any webpage user visits |

### Key Functions Reference

| File | Function | Purpose |
|------|----------|---------|
| background.js | `createContextMenu()` | Set up right-click menu |
| background.js | `extractAuthor()` | Multi-tier author extraction |
| background.js | `fetchArxivMetadata()` | Get paper metadata from arXiv API |
| background.js | `extractVideoMetadata()` | Get video platform/channel info |
| background.js | `verifySource()` | Classify source reliability |
| popup.js | `loadQuotes()` | Load and display quotes |
| popup.js | `createQuoteItem()` | Generate quote list item HTML |
| popup.js | `generateMlaCitation()` | MLA 9th Edition format |
| popup.js | `generateApaCitation()` | APA 7th Edition format |
| popup.js | `generateChicagoCitation()` | Chicago Notes-Bibliography |
| popup.js | `detectSourceType()` | Rule-based source classification |
| popup.js | `escapeHtml()` | XSS protection |

### Citation Standards

- MLA 9th Edition: Title case, URLs without `https://`, access date required
- APA 7th Edition: Sentence case for titles, URLs with `https://`, no trailing period
- Chicago: Notes-Bibliography format

### When Making Changes

1. Test manually in Chrome after changes
2. Verify citations match academic standards (Purdue OWL reference)
3. Test across different source types (news, academic, video, blogs)
4. Check special characters and Unicode handling
5. Verify storage persistence across browser restarts
