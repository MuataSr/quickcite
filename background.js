// Quote Saver & Citation Assistant - Service Worker (Manifest V3)
// This file handles context menu creation and quote capture functionality

// ============================================================================
// INITIALIZATION: Create context menu on extension installation
// ============================================================================
chrome.runtime.onInstalled.addListener(() => {
  // Create the right-click context menu item for quote saving
  chrome.contextMenus.create({
    id: 'saveQuote',
    title: 'Save Quote & Generate Citation',
    contexts: ['selection'] // Only show for selected text
  });

  console.log('Quote Saver: Context menu initialized');
});

// ============================================================================
// QUOTE CAPTURE HANDLER: Process context menu clicks
// ============================================================================
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  // Verify the correct menu item was clicked
  if (info.menuItemId === 'saveQuote') {
    try {
      // Extract the selected text from the context menu info
      const selectedText = info.selectionText;

      // Validate that text was actually selected
      if (!selectedText || selectedText.trim().length === 0) {
        throw new Error('No text selected');
      }

      // Create quote object with the specified schema
      const quote = {
        id: crypto.randomUUID(), // Generate unique identifier
        text: selectedText.trim(), // Clean up whitespace
        sourceTitle: tab.title, // Current page title
        sourceUrl: tab.url, // Current page URL
        timestamp: new Date().toISOString(), // ISO 8601 timestamp
        accessDate: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) // Human-readable access date
      };

      // Save the quote to local storage
      await saveQuoteToStorage(quote);

      // Notify popup to refresh (if open)
      chrome.runtime.sendMessage({ action: 'refreshQuotes' }).catch(() => {
        // Popup might not be open, ignore error
      });

      // Provide user feedback via notification
      await showNotification(quote);

      console.log('Quote saved:', quote.id);

    } catch (error) {
      console.error('Error saving quote:', error);
      // Show error notification to user
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Quote Saver',
        message: 'Error saving quote. Please try again.'
      });
    }
  }
});

// ============================================================================
// STORAGE LOGIC: Save quotes to chrome.storage.local
// ============================================================================
async function saveQuoteToStorage(quote) {
  try {
    // Retrieve existing quotes array from storage
    const result = await chrome.storage.local.get(['quotes']);

    // Get existing quotes or initialize empty array
    const existingQuotes = result.quotes || [];

    // Append new quote to the array
    existingQuotes.push(quote);

    // Save the updated array back to storage
    await chrome.storage.local.set({ quotes: existingQuotes });

    console.log(`Storage: Saved quote ${quote.id}. Total quotes: ${existingQuotes.length}`);

  } catch (error) {
    console.error('Storage error:', error);
    throw error; // Re-throw to be handled by caller
  }
}

// ============================================================================
// USER FEEDBACK: Show Chrome notification
// ============================================================================
async function showNotification(quote) {
  // Truncate source title for notification display (max 50 chars)
  const truncatedTitle = quote.sourceTitle.length > 50
    ? quote.sourceTitle.substring(0, 47) + '...'
    : quote.sourceTitle;

  // Create notification with saved quote information
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: 'Quote Saved',
    message: `Quote saved from "${truncatedTitle}"`
  });

  console.log(`Notification: Quote from "${truncatedTitle}" saved successfully`);
}

// ============================================================================
// MESSAGE HANDLER: Handle requests from popup
// ============================================================================
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);

  if (message.action === 'getQuotes') {
    // Retrieve all quotes
    chrome.storage.local.get(['quotes']).then(result => {
      sendResponse({ success: true, quotes: result.quotes || [] });
    }).catch(error => {
      console.error('Error getting quotes:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Indicates async response

  } else if (message.action === 'deleteQuote') {
    // Delete a specific quote
    const quoteId = message.quoteId;
    chrome.storage.local.get(['quotes']).then(result => {
      const quotes = result.quotes || [];
      const updatedQuotes = quotes.filter(q => q.id !== quoteId);
      return chrome.storage.local.set({ quotes: updatedQuotes });
    }).then(() => {
      sendResponse({ success: true });
    }).catch(error => {
      console.error('Error deleting quote:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true;

  } else if (message.action === 'clearAllQuotes') {
    // Clear all quotes
    chrome.storage.local.set({ quotes: [] }).then(() => {
      sendResponse({ success: true });
    }).catch(error => {
      console.error('Error clearing quotes:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true;

  } else if (message.action === 'notifyQuoteSaved') {
    // Notify popup to refresh quotes
    chrome.runtime.sendMessage({ action: 'refreshQuotes' }).catch(() => {
      // Popup might not be open, ignore error
    });
    sendResponse({ success: true });
  }

  // Always return true for async message handling
  return true;
});
