# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**QuickCite** is a Chrome extension (Manifest V3) that saves quotes from web pages with auto-generated MLA/APA citations. Uses a service worker + popup UI architecture.

## Architecture

### Components

1. **Service Worker** (`background.js`): Context menu creation, quote capture, author extraction, storage, message passing
2. **Popup UI** (`popup.html` + `popup.js`): Tabbed interface (Quotes/Settings), quote list, modal with citations, export
3. **Styles** (`styles.css`): Modern UI with animations, gradients, responsive design

### Data Model
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
- Context menu click → `background.js` captures quote → saves to `chrome.storage.local` → injects toast on page
- Popup open → loads from storage → displays sorted list
- Background ↔ Popup: `chrome.runtime.sendMessage` for `refreshQuotes`, `getQuotes`, `deleteQuote`, `clearAllQuotes`

## Development

### Loading the Extension
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" → select this directory

### Debugging
- **Service worker logs**: `chrome://extensions/` → click "service worker" link
- **Popup logs**: Right-click popup → Inspect

### Testing
- Manual tests documented in `TESTING.md`
- Sample data available in `popup.js:33-63` (commented out)
- Reset storage: `chrome.storage.local.clear()`

## Key Implementation Details

### Author Extraction (`background.js:242-284`)
Tries patterns in order:
1. Title patterns: `"Title - By Author"`, `"Title | By Author"`
2. URL patterns: `/author/name`, `/by/name`
3. Fallback: `null` → displays as "Unknown Author"

### Citation Generation (`popup.js`)
- **MLA 9th Edition** (`generateMlaCitation`:638-667)
- **APA 7th Edition** (`generateApaCitation`:670-700)
- Uses `parseTitleAndWebsite()` to extract clean title and website name from page titles

### Citation Style Reference

#### MLA 9th Edition (Container System)
**Format:** `Author. "Title of Source." Title of Container, Contributors, Version, Number, Publisher, Date, Location.`

| Element | Rule |
|---------|------|
| Header | **Works Cited** (centered, not bold) |
| Spacing | Hanging indent, double-spaced |
| Titles | **Title Case** for all; short works in "quotes", long in *italics* |
| In-text | `(Author Page)` — no comma, no "p." prefix |
| Two authors | `and` (e.g., "Smith and Jones 101") |
| 3+ authors | `et al.` (e.g., "Patel et al. 3") |
| URLs | Omit `https://`, end with period |

**Website Example:**
`Alvarez, Maria. "Article Title." Website Name, Publisher, 15 Mar. 2024, www.example.com/article.`

#### APA 7th Edition (Author-Date System)
**Format:** `Author. (Date). Title of work. Source.`

| Element | Rule |
|---------|------|
| Header | **References** (centered, **bold**) |
| Spacing | Hanging indent, double-spaced |
| Titles | **Sentence case** for books/articles; **Title Case** for journal names |
| In-text | `(Author, Year)` or `(Author, Year, p. X)` for quotes |
| Two authors | `&` (e.g., "Johnson & Baker, 2020") |
| 3+ authors | `et al.` (e.g., "Li et al., 2020") |
| URLs | Include `https://`, NO trailing period |

**Website Example:**
`Kozinski, A. (2023, October 4). Title in sentence case. Site Name. https://example.com/article`

#### LLM/AI Citation
- **MLA:** `"Prompt used" prompt. ChatGPT, GPT-4 version, OpenAI, 4 Oct. 2024, chat.openai.com.`
- **APA:** `OpenAI. (2024). ChatGPT (GPT-4 version) [Large language model]. https://chat.openai.com/`

### Export (`popup.js:378-449`)
- Format: `.txt` file named `quotes-export-YYYY-MM-DD.txt`
- Respects `exportPreferences` (includeMLA, includeAPA, includeMetadata)
- Bibliography generator available via `generateBibliography()`:454-540

### Storage Keys
- `quotes`: Array of quote objects
- `userPreferences`: Sort order, auto-refresh, notification settings
- `exportPreferences`: MLA/APA/metadata toggles

## Permissions
- `contextMenus`: Right-click "Save Quote & Generate Citation"
- `storage`: Local quote storage
- `activeTab`: Access selected text and tab metadata
- `notifications`: Error notifications
- `scripting`: Inject toast on webpage after save
- `<all_urls>`: Host permission for scripting on any page

## Technical Standards
- Manifest V3, Chrome 88+
- ES6+ with async/await, zero dependencies
- XSS protection via `escapeHtml()` utility
