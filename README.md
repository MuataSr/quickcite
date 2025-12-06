# QuickCite

A Chrome extension that allows users to right-click selected text to save quotes with auto-generated citations, then manage them through a popup interface.

## Features

### 📝 Quote Capture
- **Right-click Quote Saving**: Select text on any webpage, right-click, and save with automatic citation generation
- **Context Menu**: Easy access via "Save Quote & Generate Citation" option
- **Automatic Metadata**: Captures page URL, title, date, and timestamp

### 📖 Quote Management
- **Popup Interface**: Clean, modern UI to view all saved quotes
- **Quote Details**: Click any quote to view full details with metadata
- **Real-time Count**: See total number of quotes at a glance
- **Search & Browse**: Organized list view with source information

### 📚 Citation Generation
- **MLA Format**: Auto-generated MLA citations with proper formatting
- **APA Format**: Auto-generated APA citations with proper formatting
- **One-Click Copy**: Copy citations to clipboard for papers and documents
- **Complete Metadata**: Includes source, URL, and access date

### 💾 Export & Organization
- **Export JSON**: Download all quotes as structured JSON file
- **Delete Options**: Remove individual quotes or clear all at once
- **Local Storage**: All data stored locally using chrome.storage.local for privacy
- **Auto-Refresh**: Popup automatically updates when new quotes are saved

### 🎨 User Experience
- **Modern UI**: Clean, professional design with smooth animations
- **Toast Notifications**: User-friendly feedback for all actions
- **Responsive Layout**: Optimized for Chrome extension popup (400px wide)
- **Empty State**: Helpful guidance when no quotes are saved

## Screenshots

*Screenshots will be added here*

1. **Context Menu**: Right-click on selected text shows "Save Quote & Generate Citation" option
2. **Popup Interface**: Clean list view of all saved quotes with metadata
3. **Quote Detail**: Individual quote view with full citation information

## Installation

This is a Manifest V3 Chrome extension. To install:

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `quote-saver-citation-assistant` directory
5. The extension should now appear in your Chrome toolbar

## Usage

### Step 1: Save Quotes
1. **Select text** on any webpage
2. **Right-click** on the selected text
3. Choose **"Save Quote & Generate Citation"** from the context menu
4. ✅ Chrome notification confirms: "Quote saved from [page title]"

### Step 2: View & Manage Quotes
1. Click the **QS icon** in your Chrome toolbar
2. View all saved quotes in the popup interface
3. Each quote shows:
   - Preview of the quote text
   - Source page title
   - Website URL
   - Date saved

### Step 3: Quote Details & Citations
1. Click the **eye icon (👁️)** on any quote
2. View full details in the modal:
   - Complete quote text
   - Source information
   - Timestamp
3. **Copy Citations**:
   - Click **"Copy"** for MLA format
   - Click **"Copy"** for APA format
4. **Delete** if needed with the delete button

### Step 4: Export or Clear
- **Export All**: Click "Export All" to download JSON file with all quotes
- **Clear All**: Click "Clear All" to delete all quotes (with confirmation)
- **Refresh**: Click refresh button (↻) to reload quotes

### Additional Features
- **Real-time Updates**: Popup automatically refreshes when you save quotes
- **Sort Order**: Quotes sorted by newest first
- **Toast Notifications**: Get feedback for all actions (copy, delete, export)
- **Confirmation Dialogs**: Prevent accidental deletions

## File Structure

```
quote-saver-citation-assistant/
├── manifest.json          # Extension manifest (Manifest V3)
├── background.js          # Background service worker
├── popup.html             # Extension popup UI
├── popup.js               # Popup functionality
├── styles.css             # Popup styling
└── icons/
    └── icon48.png         # Extension icon (48x48px)
```

## Permissions

- `storage`: For saving quotes locally
- `activeTab`: For accessing selected text and page metadata
- `contextMenus`: For right-click context menu integration
- `notifications`: For user feedback when quotes are saved

## License

MIT License - feel free to use, modify, and distribute as needed.

## Contributing

Open to contributions! Please feel free to submit pull requests or open issues for bugs and feature requests.

## Author

Open Source Project
