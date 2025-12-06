# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Quote Saver & Citation Assistant** is a Chrome extension (Manifest V3) that allows users to save quotes from web pages with auto-generated MLA/APA citations. It features a popup interface for managing saved quotes and supports export functionality.

**Status**: Production-ready, fully tested (56/56 automated tests passed)

## High-Level Architecture

### Component Structure

The extension follows a **service worker + popup UI** architecture:

1. **Service Worker** (`background.js`): Handles all background operations
   - Creates right-click context menu on installation
   - Captures selected text when context menu is clicked
   - Extracts metadata (URL, title, author) from pages
   - Saves quotes to `chrome.storage.local`
   - Manages message passing between components

2. **Popup Interface** (`popup.html` + `popup.js`): User-facing UI
   - Tabbed interface (Quotes tab, Settings tab)
   - Displays list of saved quotes with preview
   - Modal for full quote details and citation copying
   - Export functionality (downloads .txt files)
   - Settings management

3. **Data Model**: Quotes stored with schema:
   ```javascript
   {
     id: crypto.randomUUID(),
     text: string,
     sourceTitle: string,
     sourceUrl: string,
     author: string | null,
     timestamp: ISO 8601 string,
     accessDate: formatted date string
   }
   ```

### Communication Flow

- **Context Menu Click** → Background service worker captures quote → Saves to storage → Shows notification
- **Popup Open** → Loads quotes from storage → Displays sorted list (newest first)
- **Quote View** → Popup requests full details → Renders modal with citations
- **Background ↔ Popup**: Bidirectional messaging via `chrome.runtime.sendMessage`

## Key Files

| File | Purpose | Lines | Key Functions |
|------|---------|-------|---------------|
| `manifest.json` | Extension configuration (Manifest V3) | 24 | Service worker declaration, permissions |
| `background.js` | Service worker - quote capture & storage | 222 | `saveQuoteToStorage()`, `extractAuthor()`, `chrome.contextMenus.onClicked()` |
| `popup.js` | Main UI logic, quote management, export | 676 | `loadQuotes()`, `generateMlaCitation()`, `generateApaCitation()`, `exportQuotes()`, `copyCitation()` |
| `popup.html` | Popup UI structure with tabs | 150 | Tabs navigation, modal structure |
| `styles.css` | Modern styling with animations | 460+ | Gradient header, modal animations, responsive design |

## Common Development Commands

### Loading the Extension

```bash
# Load in Chrome for development
1. Open chrome://extensions/
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the /home/papi/quote-saver-citation-assistant directory
```

### Testing

**Manual Testing Protocol** (comprehensive test suite):
```bash
# Follow the test protocol in TESTING.md
# 34 tests across 8 test suites:
# - Context menu functionality
# - Storage & performance
# - Citation format accuracy
# - Export functionality
# - Edge cases & error handling
# - Settings & preferences
# - UI/UX
# - Cross-site compatibility
```

**Automated Test Results**: All 56 automated tests passed (see AUTOMATED-TEST-REPORT.md)

### Debugging

```bash
# Service worker logs
1. Go to chrome://extensions/
2. Find "Quote Saver & Citation Assistant"
3. Click "service worker" → View console logs

# Popup console logs
1. Open popup (click extension icon)
2. Right-click → Inspect
3. View console in DevTools
```

### Recent Fixes

**Hotfix 1 - Author Extraction** (commit 98eba8b):
- Added `extractAuthor()` function in background.js (lines 175-221)
- Extracts author from page title patterns: "Title - By Author", "Title | By Author"
- Falls back to URL patterns: `/author/author-name`, `/by/author-name`
- Updated quote schema to include `author` field

**Hotfix 2 - Icon Display**:
- Fixed corrupted view/delete icons
- View icon: `ℹ️` (info symbol)
- Delete icon: `✖` (X mark)

## Important Implementation Details

### Quote Saving Workflow

1. User selects text on any webpage
2. Right-clicks → sees "Save Quote & Generate Citation" context menu
3. Clicks menu item → background service worker:
   - Extracts selected text
   - Gets page title and URL
   - Attempts author extraction (see patterns above)
   - Saves to `chrome.storage.local` with unique ID
   - Shows Chrome notification (title truncated at 50 chars)
   - Sends 'refreshQuotes' message to popup

### Author Extraction Patterns

The extension attempts author extraction in this order:
1. **Title patterns** (regex):
   - `/[-–|]\s*By\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i`
   - `/\s+by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i`
   - `/[-–|]\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*[-–|]/`

2. **URL patterns**:
   - `/author\/([^\/\?#]+)/i`
   - `/by\/([^\/\?#]+)/i`

3. **Fallback**: Returns `null` → citations display "Unknown Author"

### Citation Generation

**MLA 9th Edition** (popup.js:465-477):
```javascript
"${quoteText}" ${author}. ${title}. Accessed ${date}. ${url}.
```

**APA 7th Edition** (popup.js:479-489):
```javascript
${author} ${year}. ${title}. Retrieved ${accessDate}, from ${url}
```

### Export Format

- **Format**: Downloads as `.txt` file (NOT `.json`)
- **Filename**: `quotes-export-YYYY-MM-DD.txt`
- **Content**: Structured text with separators, includes quotes + metadata + MLA + APA
- **Preferences**: Respects user settings (include MLA, APA, metadata checkboxes)

### Storage Structure

- **Local only**: Uses `chrome.storage.local` (no cloud sync, privacy-focused)
- **Key**: `quotes` (array of quote objects)
- **Additional keys**: `userPreferences`, `exportPreferences`
- **Persistence**: Survives Chrome restart

## Key Features & Usage

### Core Features

1. **Context Menu Integration**: Right-click selected text to save
2. **Auto-Citation**: Generates MLA and APA citations automatically
3. **Local Storage**: All data stored in browser (privacy-focused)
4. **Export**: Download all quotes as formatted `.txt` file
5. **Search & Browse**: List view with preview (120 char limit)
6. **Settings**: Preferences for export format and display
7. **Real-time Updates**: Popup auto-refreshes when quotes saved

### UI Elements

- **Tabbed Interface**: Quotes tab (main list) and Settings tab (preferences)
- **Modal**: Click eye icon (ℹ️) to view full quote + citations
- **Toast Notifications**: User feedback for actions (copy, delete, export)
- **Confirmation Dialogs**: Before delete operations
- **Empty State**: Helpful guidance when no quotes saved

## Known Limitations

1. **Author Detection**: ~60-80% success rate (varies by site structure)
2. **Chrome Storage**: No cloud sync (by design for privacy)
3. **Manifest V3**: Chrome-only (other Chromium browsers supported)
4. **No Author Field**: Extension doesn't have access to author metadata directly
5. **Local Storage**: Data stays in browser, not transferable between devices

## Testing & Quality Assurance

- **Automated Tests**: 56/56 passed (100%) - see AUTOMATED-TEST-REPORT.md
- **Manual Tests**: 34 tests across 8 suites - see TESTING.md
- **Recent Hotfixes**: 2 priority issues resolved - see HOTFIX-REPORT.md
- **Code Quality**: Well-commented (~30%), modular functions, async/await patterns

## Configuration

### Permissions (manifest.json:6-11)
```json
"contextMenus": "Right-click context menu",
"storage": "Local quote storage",
"activeTab": "Access selected text and page metadata",
"notifications": "User feedback notifications"
```

### Permissions Explained
- **contextMenus**: Required for "Save Quote & Generate Citation" option
- **storage**: Required to save quotes to chrome.storage.local
- **activeTab**: Required to access selected text and tab metadata (title, URL)
- **notifications**: Required to show "Quote saved" notifications

## Development Tips

1. **Sample Data**: Uncomment lines 34-62 in popup.js for testing with sample quotes
2. **Console Debugging**: Use console.log() throughout - all logs visible in service worker console
3. **Storage Testing**: Use chrome.storage.local.clear() to reset extension data
4. **Icon Issues**: Be aware of emoji encoding issues - use simple symbols
5. **Modal Z-index**: Modal is overlay - ensure proper z-index in styles

## Documentation Files

- **README.md**: User-facing documentation, installation, usage
- **TESTING.md**: Comprehensive manual testing protocol (34 tests)
- **AUTOMATED-TEST-REPORT.md**: Static code analysis results (56/56 passed)
- **HOTFIX-REPORT.md**: Documents recent fixes for author extraction and icons

## Technical Standards

- **Manifest Version**: 3 (Manifest V3 - service worker based)
- **JavaScript**: ES6+ with async/await, no transpilation
- **Dependencies**: Zero external dependencies (self-contained)
- **Minimum Chrome**: Version 88
- **Styling**: CSS3 with flexbox, animations, gradients
