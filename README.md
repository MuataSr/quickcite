# Quote Saver & Citation Assistant

A Chrome extension that allows users to right-click selected text to save quotes with auto-generated citations, then manage them through a popup interface.

## Features

- **Right-click Quote Saving**: Select text on any webpage, right-click, and save with automatic citation generation
- **Auto-Generated Citations**: Automatically captures:
  - Page URL
  - Page title
  - Date of extraction
  - Timestamp of quote
- **Quote Management**: View and manage all saved quotes through an intuitive popup interface
- **Storage**: Local storage using chrome.storage.local for privacy and quick access
- **Export**: Export quotes in JSON format for backup or external use
- **Clean Interface**: Simple, distraction-free popup UI for managing your quote collection

## Screenshots

*Screenshots will be added here*

1. **Context Menu**: Right-click on selected text shows "Save this quote" option
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

1. **Save a Quote**:
   - Select text on any webpage
   - Right-click and select "Save this quote"
   - The quote is automatically saved with citation metadata

2. **View Quotes**:
   - Click the extension icon in the Chrome toolbar
   - Browse your saved quotes in the popup interface
   - Click on any quote to view full details

3. **Export Quotes**:
   - Click "Export Quotes" button in the popup
   - Downloads a JSON file with all your saved quotes

## File Structure

```
quote-saver-citation-assistant/
├── manifest.json          # Extension manifest (Manifest V3)
├── background.js          # Background service worker
├── popup.html             # Extension popup UI
├── popup.js               # Popup functionality
├── styles.css             # Popup styling
├── icons/
│   └── icon48.png         # Extension icon
└── _metadata/             # Development notes and metadata
```

## Permissions

- `storage`: For saving quotes locally
- `activeTab`: For accessing selected text and page metadata
- `contextMenus`: For right-click context menu integration

## License

MIT License - feel free to use, modify, and distribute as needed.

## Contributing

Open to contributions! Please feel free to submit pull requests or open issues for bugs and feature requests.

## Author

Open Source Project
