# Testing Phase 2: Context Menu & Quote Capture

## Load the Extension in Chrome

1. Open Chrome browser
2. Navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked" button
5. Select the `/home/papi/quote-saver-citation-assistant/` directory
6. The extension should now appear in the list with:
   - Name: "Quote Saver & Citation Assistant"
   - Status: Enabled
   - Icon: Should show "QS" in toolbar

## Test the Context Menu

### Test 1: Verify Context Menu Appears
1. Go to any webpage (e.g., https://example.com, news article, etc.)
2. Select any text on the page (click and drag to highlight)
3. Right-click on the selected text
4. **Expected Result**: You should see "Save Quote & Generate Citation" in the context menu

### Test 2: Save a Quote
1. Select some text on a webpage
2. Right-click and select "Save Quote & Generate Citation"
3. **Expected Result**:
   - A Chrome notification appears saying "Quote saved from [page title]"
   - No errors in Chrome console

### Test 3: Verify Multiple Quotes
1. Go to 2-3 different websites
2. Save quotes from each
3. **Expected Result**: Each quote is saved separately with different timestamps

## Check Chrome Console for Errors

1. Go to `chrome://extensions/`
2. Find "Quote Saver & Citation Assistant"
3. Click "Inspect views: service worker"
4. **Expected Output**: Should see:
   ```
   Quote Saver: Context menu initialized
   Storage: Saved quote [UUID]. Total quotes: [count]
   Notification: Quote from "[title]" saved successfully
   ```

## Common Issues & Solutions

**Context menu doesn't appear:**
- Check that text is actually selected (highlighted)
- Verify extension is enabled in chrome://extensions/

**Notification doesn't show:**
- Check Chrome notification permissions
- Look for errors in service worker console

**Service worker errors:**
- Open "Inspect views: service worker" in chrome://extensions/
- Report any error messages

## Next Steps After Testing

Once all tests pass, proceed to Phase 3: Popup UI Implementation
