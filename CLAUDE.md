# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**QuickCite** is a Chrome extension (Manifest V3) that saves quotes from web pages with auto-generated MLA/APA/Chicago citations. Uses a service worker + popup UI architecture with source verification, video metadata extraction, and arXiv paper support.

## Architecture

### Components

1. **Service Worker** (`background.js`): Context menu creation, quote capture, author/source metadata extraction, storage, message passing
2. **Popup UI** (`popup.html` + `popup.js`): Tabbed interface (Quotes/Settings), quote list, modal with citations, export, bibliography generation
3. **Styles** (`styles.css`): Modern UI with animations, gradients, responsive design

### Data Model
```javascript
{
  id: string,                           // crypto.randomUUID()
  text: string,                         // Selected quote text
  sourceTitle: string,                  // Page/paper title
  sourceUrl: string,                    // Full URL
  author: string | null,                // Extracted author name
  sourceName: string | null,            // e.g., "arXiv" for academic sources
  timestamp: ISO 8601 string,           // When quote was saved
  accessDate: string,                   // Formatted date string
  creationDate: string | null,          // Publication date from source
  tags: string[],                       // User-defined tags
  volume: string | null,                // Journal volume
  issue: string | null,                 // Journal issue
  pages: string | null,                 // Page range
  doi: string | null,                   // Digital Object Identifier
  publisher: string | null,             // Publisher name
  sourceReliability: string,            // 'high', 'medium-high', 'medium', 'unverified', 'unknown'
  sourceCategory: string,               // 'academic', 'government', 'news', 'reference', 'general'
  sourceWarnings: string[],             // Array of warning strings
  sourceDescription: string | null,     // Meta description
  contentType: string | null,           // 'article', 'book', 'video', 'website'
  isVideo: boolean,                     // Video platform detection
  videoChannel: string | null,          // YouTube channel name
  videoPlatform: string | null,         // 'YouTube', 'Vimeo', 'TED', etc.
  videoUploadDate: string | null        // Video publish date
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
- Sample data available in `popup.js:72-102` (commented out)
- Reset storage: `chrome.storage.local.clear()`

## Key Implementation Details

### Source Type Detection (`popup.js:1613-1735`)
Rule-based detection for: government, legal, patent, standard, video, social_media, academic, book, news, website

### Author Extraction (`background.js:689-1103`)
Multi-tier extraction:
1. Meta tags (`meta[name="author"]`, `article:author`, etc.)
2. JSON-LD structured data
3. DOM selectors (`.author-name`, `[rel="author"]`, etc.)
4. Title patterns: `"Title - By Author"`, `"Title | By Author"`
5. URL patterns: `/author/name`, `/by/name`
6. Fallback: `null` → displays as "Unknown Author"

### Video Platform Support (`background.js:104-312`)
Detects YouTube, Vimeo, Dailymotion, TED, Twitch, Facebook, TikTok with:
- Channel/creator name extraction
- Upload date detection from JSON-LD and meta tags
- YouTube video ID extraction for transcript access

### arXiv Support (`background.js:94-380`)
- Detects `arxiv.org/abs/` and `arxiv.org/pdf/` URLs
- Fetches metadata via arXiv API (`export.arxiv.org/api/query`)
- Extracts: title, all authors, published date

### Source Verification (`background.js:1163-1418`)
Classifies sources by domain:
- **high reliability**: Academic domains (.edu, arxiv.org, scholar.google.com), government (.gov)
- **medium-high**: Major news (NYT, BBC, Washington Post)
- **medium**: Reference sites (Wikipedia, Britannica)
- **unverified**: General websites

### Citation Generation (`popup.js`)
- **MLA 9th Edition** (`generateMlaCitation`:1854-2062)
- **APA 7th Edition** (`generateApaCitation`:2065-2257)
- **Chicago (Notes-Bibliography)** (`generateChicagoCitation`:2260-2418)
- Uses `parseTitleAndWebsite()` to extract clean title and website name
- Smart date selection: prefers `creationDate` for publication year

### Citation Style Reference

#### MLA 9th Edition (Container System)
| Element | Rule |
|---------|------|
| Header | **Works Cited** (centered, not bold) |
| Titles | **Title Case**; short works in "quotes", long in *italics* |
| In-text | `(Author Page)` — no comma, no "p." prefix |
| Two authors | `and` (e.g., "Smith and Jones 101") |
| 3+ authors | `et al.` |
| URLs | Omit `https://`, end with period |
| Access date | Always included: "Accessed 15 Mar. 2024" |

#### APA 7th Edition (Author-Date System)
| Element | Rule |
|---------|------|
| Header | **References** (centered, **bold**) |
| Titles | Sentence case for works, **Title Case** for journal names |
| In-text | `(Author, Year)` or `(Author, Year, p. X)` |
| Two authors | `&` (e.g., "Johnson & Baker, 2020") |
| 3+ authors | `et al.` |
| URLs | Include `https://`, NO trailing period |

#### Chicago Style
Notes-Bibliography format: `Last, First. "Title." Container, Date, URL.`

### Bibliography Generation (`popup.js:775-888`)
- Groups sources by category (academic, government, news, reference, general)
- Alphabetizes by author last name
- Generates both MLA Works Cited and APA References sections
- Export as TXT or PDF (using jsPDF)

### Tag Management (`popup.js:1154-1366`)
- Add/remove tags on individual quotes
- Filter quotes by tag
- Auto-populates tag filter dropdown with existing tags
- Tag suggestions as you type

### Export (`popup.js:699-770`)
- Format: `.txt` file named `quotes-export-YYYY-MM-DD.txt`
- Respects `exportPreferences` (includeMLA, includeAPA, includeMetadata)
- Bibliography generator via `generateBibliography()`:775-888

### Storage Keys
- `quotes`: Array of quote objects
- `userPreferences`: Sort order, auto-refresh, notification settings
- `exportPreferences`: MLA/APA/metadata toggles, groupByType

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
- XSS protection via `escapeHtml()` utility (`popup.js:1501-1505`)
