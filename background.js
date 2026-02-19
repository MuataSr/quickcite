// QuickCite - Service Worker (Manifest V3)
// This file handles context menu creation and quote capture functionality

// ============================================================================
// CONTEXT MENU: Create and manage context menu
// ============================================================================

function createContextMenu() {
  try {
    // Remove existing menu
    chrome.contextMenus.removeAll();

    // Create new menu
    chrome.contextMenus.create({
      id: 'saveQuote',
      title: 'Save Quote & Generate Citation',
      contexts: ['selection']
    });

    console.log('✅ Context menu created');
  } catch (error) {
    console.error('❌ Failed to create context menu:', error);
  }
}

// Create on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('📦 Extension installed');
  createContextMenu();
});

// Also create when service worker starts
createContextMenu();

// ============================================================================
// QUOTE CAPTURE HANDLER: Process context menu clicks
// ============================================================================
// ============================================================================
// TOAST CREATION: Function to inject toast into webpage
// ============================================================================
function createToast(message) {
  const toast = document.createElement('div');
  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
    <span style="white-space: nowrap;">${message}</span>
  `;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #10b981;
    color: white;
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    display: flex;
    align-items: center;
    gap: 10px;
    transform: translateX(400px);
    opacity: 0;
    transition: all 0.3s ease;
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  document.body.appendChild(toast);

  // Animate in
  setTimeout(() => {
    toast.style.transform = 'translateX(0)';
    toast.style.opacity = '1';
  }, 10);

  // Auto-remove
  setTimeout(() => {
    toast.style.transform = 'translateX(400px)';
    toast.style.opacity = '0';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 2500);
}

// ============================================================================
// ARXIV SUPPORT: Detect arxiv URLs and fetch metadata from API
// ============================================================================

// Check if URL is from arxiv.org (PDF or abstract page)
function isArxivUrl(url) {
  return /arxiv\.org\/(abs|pdf)\//.test(url);
}

// ============================================================================
// VIDEO PLATFORM DETECTION AND METADATA EXTRACTION
// ============================================================================

// Check if URL is a video platform
function isVideoUrl(url) {
  const videoPlatforms = [
    /youtube\.com\/watch/,
    /youtu\.be\//,
    /vimeo\.com\/\d+/,
    /dailymotion\.com\/video/,
    /ted\.com\/talks/,
    /twitch\.tv\/videos/,
    /facebook\.com\/.*\/videos/,
    /tiktok\.com\/@.*\/video/
  ];
  return videoPlatforms.some(pattern => pattern.test(url));
}

// Detect video platform from URL
function detectVideoPlatform(url) {
  if (/youtube\.com|youtu\.be/.test(url)) return 'YouTube';
  if (/vimeo\.com/.test(url)) return 'Vimeo';
  if (/dailymotion\.com/.test(url)) return 'Dailymotion';
  if (/ted\.com/.test(url)) return 'TED';
  if (/twitch\.tv/.test(url)) return 'Twitch';
  if (/facebook\.com/.test(url)) return 'Facebook';
  if (/tiktok\.com/.test(url)) return 'TikTok';
  return 'Online Video';
}

// Extract YouTube video ID from URL
function extractYouTubeId(url) {
  // Handle youtube.com/watch?v=ID
  const watchMatch = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
  if (watchMatch) return watchMatch[1];

  // Handle youtu.be/ID
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (shortMatch) return shortMatch[1];

  // Handle youtube.com/embed/ID
  const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
  if (embedMatch) return embedMatch[1];

  return null;
}

// Content script to extract video metadata from page
function extractVideoMetadataFromPage() {
  const metadata = {
    title: null,
    channel: null,
    uploadDate: null,
    duration: null,
    platform: null
  };

  // =========================================================================
  // YouTube-specific selectors (comprehensive for transcripts and main page)
  // =========================================================================

  // Video title - multiple fallback selectors
  const ytTitleSelectors = [
    'h1.ytd-video-primary-info-renderer yt-formatted-string',
    'h1.ytd-watch-metadata yt-formatted-string',
    '#title h1 yt-formatted-string',
    'h1.title',
    '[itemprop="name"]',
    'meta[property="og:title"]'
  ];

  for (const selector of ytTitleSelectors) {
    const el = document.querySelector(selector);
    if (el) {
      metadata.title = el.tagName === 'META' ? el.getAttribute('content') : el.textContent?.trim();
      if (metadata.title) break;
    }
  }

  // Channel name - comprehensive selectors for YouTube
  // These work on main video page, transcript view, and embedded views
  const ytChannelSelectors = [
    // Modern YouTube selectors
    '#channel-name yt-formatted-string a',
    '#channel-name a',
    'ytd-channel-name yt-formatted-string a',
    'ytd-channel-name a',
    '#owner #channel-name a',
    '#owner-name a',
    // Video owner section
    'ytd-video-owner-renderer #channel-name a',
    'ytd-video-owner-renderer a.yt-simple-endpoint',
    // Fallback selectors
    '[itemprop="author"] [itemprop="name"]',
    '[itemprop="author"] a',
    'a.yt-simple-endpoint.style-scope.yt-formatted-string',
    // Link with channel URL pattern
    'a[href*="/channel/"]',
    'a[href*="/@"]'
  ];

  for (const selector of ytChannelSelectors) {
    const el = document.querySelector(selector);
    if (el) {
      const channelText = el.textContent?.trim();
      // Filter out non-channel text (like "Subscribe" buttons)
      if (channelText && channelText.length > 0 && channelText.length < 100 &&
          !channelText.toLowerCase().includes('subscribe') &&
          !channelText.toLowerCase().includes('share')) {
        metadata.channel = channelText;
        break;
      }
    }
  }

  // Upload date from meta tags or page content
  const dateMeta = document.querySelector('meta[itemprop="uploadDate"]') ||
                   document.querySelector('meta[itemprop="datePublished"]');
  if (dateMeta) {
    metadata.uploadDate = dateMeta.getAttribute('content');
  } else {
    // Try to find date in page text
    const dateSelectors = [
      '#info-strings yt-formatted-string',
      '#info span',
      '.date',
      'ytd-video-primary-info-renderer #info-strings yt-formatted-string'
    ];
    for (const selector of dateSelectors) {
      const dateElement = document.querySelector(selector);
      if (dateElement) {
        const dateText = dateElement.textContent?.trim();
        // Check if it looks like a date (contains numbers or month names)
        if (dateText && /\d|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i.test(dateText)) {
          metadata.uploadDate = dateText;
          break;
        }
      }
    }
  }

  // Try JSON-LD structured data (most reliable source)
  const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (const script of jsonLdScripts) {
    try {
      const data = JSON.parse(script.textContent);
      if (data['@type'] === 'VideoObject') {
        metadata.title = metadata.title || data.name;
        metadata.uploadDate = metadata.uploadDate || data.uploadDate;
        metadata.duration = data.duration;
        if (data.author) {
          // Author can be string or object
          if (typeof data.author === 'string') {
            metadata.channel = metadata.channel || data.author;
          } else if (data.author.name) {
            metadata.channel = metadata.channel || data.author.name;
          }
        }
      }
    } catch (e) {
      // Invalid JSON, skip
    }
  }

  // Try Open Graph tags
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogSiteName = document.querySelector('meta[property="og:site_name"]');
  if (ogTitle && !metadata.title) {
    metadata.title = ogTitle.getAttribute('content');
  }
  if (ogSiteName) {
    metadata.platform = ogSiteName.getAttribute('content');
  }

  // Clean up channel name - remove extra whitespace and newlines
  if (metadata.channel) {
    metadata.channel = metadata.channel.replace(/\s+/g, ' ').trim();
  }

  return metadata;
}

// Main function to extract video metadata
async function extractVideoMetadata(tabId, url) {
  const videoData = {
    isVideo: true,
    platform: detectVideoPlatform(url),
    title: null,
    channel: null,
    uploadDate: null
  };

  try {
    // Try to extract metadata from page content
    const results = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      function: extractVideoMetadataFromPage,
    });

    if (results && results[0] && results[0].result) {
      const pageData = results[0].result;
      videoData.title = pageData.title;
      videoData.channel = pageData.channel;
      videoData.uploadDate = pageData.uploadDate;
      videoData.platform = pageData.platform || videoData.platform;
    }
  } catch (error) {
    console.log('Video metadata extraction failed:', error.message);
  }

  console.log('Video metadata extracted:', videoData);
  return videoData;
}

// Extract arxiv paper ID from URL
// Handles: arxiv.org/abs/2301.00001, arxiv.org/pdf/2301.00001.pdf, arxiv.org/pdf/2301.00001v2
function extractArxivId(url) {
  const match = url.match(/arxiv\.org\/(?:abs|pdf)\/([0-9]+\.[0-9]+(?:v[0-9]+)?)/);
  if (match) return match[1];

  // Also handle older format: arxiv.org/abs/cs/9901002
  const oldMatch = url.match(/arxiv\.org\/(?:abs|pdf)\/([a-z-]+\/[0-9]+(?:v[0-9]+)?)/);
  if (oldMatch) return oldMatch[1];

  return null;
}

// Fetch metadata from arxiv API
async function fetchArxivMetadata(arxivId) {
  try {
    const apiUrl = `https://export.arxiv.org/api/query?id_list=${arxivId}`;
    console.log('Fetching arxiv metadata:', apiUrl);

    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Arxiv API error: ${response.status}`);
    }

    const xmlText = await response.text();
    console.log('Arxiv API response length:', xmlText.length);

    // Parse XML with regex (DOMParser not available in service workers)

    // Extract title - look for <title> inside <entry>
    const entryMatch = xmlText.match(/<entry>([\s\S]*?)<\/entry>/);
    if (!entryMatch) {
      console.error('No entry found in arxiv response');
      return null;
    }
    const entryXml = entryMatch[1];

    // Extract title (remove newlines and extra spaces)
    const titleMatch = entryXml.match(/<title>([\s\S]*?)<\/title>/);
    const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : null;

    // Extract all authors
    const authorRegex = /<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/g;
    const authors = [];
    let authorMatch;
    while ((authorMatch = authorRegex.exec(entryXml)) !== null) {
      authors.push(authorMatch[1].trim());
    }
    const authorString = authors.length > 0 ? authors.join(' and ') : null;

    // Extract published date
    const publishedMatch = entryXml.match(/<published>([\s\S]*?)<\/published>/);
    const published = publishedMatch ? publishedMatch[1].trim() : null;

    console.log('Arxiv metadata extracted:', { title, authors: authorString, published });

    return {
      title: title,
      author: authorString,
      published: published,
      source: 'arXiv'
    };
  } catch (error) {
    console.error('Error fetching arxiv metadata:', error);
    return null;
  }
}

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

      // Initialize quote metadata with defaults
      let sourceTitle = tab.title;
      let author = null;
      let sourceName = null;

      // Video metadata (will be populated if this is a video)
      let videoMetadata = null;

      // Check if this is a video URL
      if (isVideoUrl(tab.url)) {
        console.log('Detected video URL:', tab.url);
        videoMetadata = await extractVideoMetadata(tab.id, tab.url);
        if (videoMetadata) {
          // Use video title if extracted, otherwise fall back to page title
          sourceTitle = videoMetadata.title || sourceTitle;
          // Use channel name as author
          author = videoMetadata.channel || author;
          sourceName = videoMetadata.platform;
        }
      }
      // Check if this is an arxiv URL - fetch metadata from API
      else if (isArxivUrl(tab.url)) {
        const arxivId = extractArxivId(tab.url);
        if (arxivId) {
          console.log('Detected arxiv paper:', arxivId);
          const arxivData = await fetchArxivMetadata(arxivId);
          if (arxivData) {
            sourceTitle = arxivData.title || sourceTitle;
            author = arxivData.author;
            sourceName = 'arXiv';
          }
        }
      }

      // If not video/arxiv or extraction failed, use standard extraction
      if (!author) {
        author = await extractAuthor(tab.id, tab.url, tab.title);
      }

      // Extract creation date from the source
      const creationDate = await extractCreationDate(tab.id);

      // Extract publication details from the source
      const publicationDetails = await extractPublicationDetails(tab.id);

      // Verify source and extract metadata
      const sourceVerification = await verifySource(tab.id, tab.url);

      // Create quote object with the specified schema
      const quote = {
        id: crypto.randomUUID(), // Generate unique identifier
        text: selectedText.trim(), // Clean up whitespace
        sourceTitle: sourceTitle, // Paper title or page title
        sourceUrl: tab.url, // Current page URL
        author: author, // Extracted author name
        sourceName: sourceName, // e.g., "arXiv" for academic sources
        timestamp: new Date().toISOString(), // ISO 8601 timestamp
        accessDate: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }), // Human-readable access date
        creationDate: creationDate, // Creation date from source (nullable)
        tags: [], // User-defined tags for organization
        // Publication details (extracted from page)
        volume: publicationDetails.volume, // Volume number (e.g., "5", "Volume 5")
        issue: publicationDetails.issue, // Issue number (e.g., "2", "No. 2")
        pages: publicationDetails.pages, // Page range (e.g., "123-145", "pp. 123-145")
        doi: publicationDetails.doi, // DOI (Digital Object Identifier)
        publisher: publicationDetails.publisher, // Publisher name
        // Source verification data
        sourceReliability: sourceVerification.reliability, // 'high', 'medium-high', 'medium', 'unverified', 'unknown'
        sourceCategory: sourceVerification.category, // 'academic', 'government', 'news', 'reference', 'general'
        sourceWarnings: sourceVerification.warnings, // Array of warning strings
        sourceDescription: sourceVerification.metadata?.description || null, // Meta description
        contentType: videoMetadata ? 'video' : (sourceVerification.contentType || sourceVerification.metadata?.contentType || null), // 'article', 'book', 'video', etc.
        // Video-specific metadata
        isVideo: videoMetadata ? true : false,
        videoChannel: videoMetadata?.channel || null, // YouTube channel, Vimeo user, etc.
        videoPlatform: videoMetadata?.platform || null, // YouTube, Vimeo, TED, etc.
        videoUploadDate: videoMetadata?.uploadDate || null // Video upload/publish date
      };

      // Check for duplicate quotes before saving
      const duplicateCheck = await checkForDuplicate(quote);

      let toastMessage = 'Source Saved';

      if (duplicateCheck.isDuplicate) {
        // Found duplicate - DO NOT save, just notify user
        console.log('Duplicate quote detected, not saving:', duplicateCheck.existingQuote?.id);
        toastMessage = 'Already Saved';

        // Show toast and exit early (don't save)
        try {
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: createToast,
            args: [toastMessage]
          });
        } catch (error) {
          console.error('Failed to inject toast:', error);
        }
        return; // Exit early - don't save duplicate
      }

      // Save the quote to local storage (only if not duplicate)
      await saveQuoteToStorage(quote);

      // Notify popup to refresh (if open)
      chrome.runtime.sendMessage({ action: 'refreshQuotes' }).catch(() => {
        // Popup might not be open, ignore error
      });

      // Show custom toast directly on the webpage (works even when popup is closed)
      console.log('Showing toast:', toastMessage);

      try {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: createToast,
          args: [toastMessage]
        });
        console.log('Toast injected successfully');
      } catch (error) {
        console.error('Failed to inject toast:', error);
      }

      console.log('Quote saved:', quote.id);

    } catch (error) {
      console.error('Error saving quote:', error);
      // Show error notification to user
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'QuickCite',
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
// DUPLICATE DETECTION: Check if a quote already exists
// ============================================================================
async function checkForDuplicate(newQuote) {
  try {
    const result = await chrome.storage.local.get(['quotes']);
    const existingQuotes = result.quotes || [];

    if (existingQuotes.length === 0) {
      return { isDuplicate: false, existingQuote: null };
    }

    // Normalize text for comparison (lowercase, remove extra whitespace)
    const normalizeText = (text) => {
      return text.toLowerCase().replace(/\s+/g, ' ').trim();
    };

    const newTextNormalized = normalizeText(newQuote.text);

    // Check for exact or near-exact text matches
    for (const existingQuote of existingQuotes) {
      const existingTextNormalized = normalizeText(existingQuote.text);

      // Exact match
      if (newTextNormalized === existingTextNormalized) {
        return { isDuplicate: true, existingQuote: existingQuote, matchType: 'exact' };
      }

      // Near match (one contains the other, for partial selections)
      if (newTextNormalized.includes(existingTextNormalized) ||
          existingTextNormalized.includes(newTextNormalized)) {
        // Only flag if significant overlap (>80% of shorter text)
        const shorter = Math.min(newTextNormalized.length, existingTextNormalized.length);
        const longer = Math.max(newTextNormalized.length, existingTextNormalized.length);
        if (shorter / longer > 0.8) {
          return { isDuplicate: true, existingQuote: existingQuote, matchType: 'partial' };
        }
      }

      // Same URL check (might be selecting different text from same source)
      if (newQuote.sourceUrl === existingQuote.sourceUrl &&
          calculateSimilarity(newTextNormalized, existingTextNormalized) > 0.85) {
        return { isDuplicate: true, existingQuote: existingQuote, matchType: 'similar' };
      }
    }

    return { isDuplicate: false, existingQuote: null };

  } catch (error) {
    console.error('Error checking for duplicates:', error);
    return { isDuplicate: false, existingQuote: null };
  }
}

// Calculate simple text similarity (Jaccard similarity on words)
function calculateSimilarity(text1, text2) {
  const words1 = new Set(text1.split(' '));
  const words2 = new Set(text2.split(' '));

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  // Prevent division by zero
  if (union.size === 0) return 0;

  return intersection.size / union.size;
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

// ============================================================================
// AUTHOR EXTRACTION: Extract author name from page using content script
// ============================================================================

// Content script function to extract author from page DOM
function extractAuthorFromPage() {
  // Helper to clean author name
  const cleanAuthorName = (name) => {
    if (!name) return null;
    // Remove common prefixes
    name = name.replace(/^(by|written by|author:|posted by|published by)\s*/i, '');
    // Remove extra whitespace
    name = name.replace(/\s+/g, ' ').trim();
    // Skip if it looks like a URL, email, or is too short/long
    if (name.includes('@') || name.includes('http') || name.length < 2 || name.length > 50) {
      return null;
    }
    return name;
  };

  // 1. Try meta tags first (most reliable)
  const metaSelectors = [
    'meta[name="author"]',
    'meta[property="author"]',
    'meta[property="article:author"]',
    'meta[name="twitter:creator"]',
    'meta[property="og:article:author"]',
  ];

  for (const selector of metaSelectors) {
    const meta = document.querySelector(selector);
    if (meta) {
      const content = meta.getAttribute('content');
      const cleaned = cleanAuthorName(content);
      if (cleaned) return cleaned;
    }
  }

  // 2. Try JSON-LD structured data
  const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (const script of jsonLdScripts) {
    try {
      const data = JSON.parse(script.textContent);
      // Handle array of schemas
      const schemas = Array.isArray(data) ? data : [data];
      for (const schema of schemas) {
        if (schema.author) {
          const author = schema.author;
          if (typeof author === 'string') {
            const cleaned = cleanAuthorName(author);
            if (cleaned) return cleaned;
          } else if (author.name) {
            const cleaned = cleanAuthorName(author.name);
            if (cleaned) return cleaned;
          } else if (Array.isArray(author) && author[0]) {
            const firstAuthor = author[0];
            const name = typeof firstAuthor === 'string' ? firstAuthor : firstAuthor.name;
            const cleaned = cleanAuthorName(name);
            if (cleaned) return cleaned;
          }
        }
      }
    } catch (e) {
      // Invalid JSON, skip
    }
  }

  // 3. Try common DOM selectors for author elements
  const domSelectors = [
    '[rel="author"]',
    '[itemprop="author"]',
    '.author-name',
    '.author',
    '.byline-name',
    '.byline a',
    '.byline',
    '.post-author',
    '.article-author',
    '.entry-author',
    'a[href*="/author/"]',
    '.writer-name',
    '.contributor-name',
  ];

  for (const selector of domSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      // Get text content, prioritizing nested links
      const link = element.querySelector('a');
      const text = link ? link.textContent : element.textContent;
      const cleaned = cleanAuthorName(text);
      if (cleaned) return cleaned;
    }
  }

  return null;
}

// ============================================================================
// CREATION DATE EXTRACTION: Extract creation date from page using content script
// ============================================================================

// Content script function to extract creation date from page DOM
function extractCreationDateFromPage() {
  // Helper to format date
  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 1. Try meta tags (most reliable for news/blog sites)
  const metaSelectors = [
    'meta[property="article:published_time"]',
    'meta[property="og:pubdate"]',
    'meta[property="og:article:published_time"]',
    'meta[name="article:published_time"]',
    'meta[name="date"]',
    'meta[name="pubdate"]',
    'meta[name="DC.date"]',
    'meta[name="DC.date.issued"]',
    'meta[name="dcterms.date"]',
    'meta[name="dcterms.created"]',
    'meta[property="event:start_date"]',
  ];

  for (const selector of metaSelectors) {
    const meta = document.querySelector(selector);
    if (meta) {
      const content = meta.getAttribute('content');
      const formatted = formatDate(content);
      if (formatted) return formatted;
    }
  }

  // 2. Try time elements
  const timeSelectors = [
    'time[datetime]',
    'time[itemprop="datePublished"]',
    'time[itemprop="pubdate"]',
  ];

  for (const selector of timeSelectors) {
    const time = document.querySelector(selector);
    if (time) {
      const datetime = time.getAttribute('datetime');
      const formatted = formatDate(datetime);
      if (formatted) return formatted;
    }
  }

  // 3. Try JSON-LD structured data
  const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (const script of jsonLdScripts) {
    try {
      const data = JSON.parse(script.textContent);
      const schemas = Array.isArray(data) ? data : [data];
      for (const schema of schemas) {
        if (schema.datePublished) {
          const formatted = formatDate(schema.datePublished);
          if (formatted) return formatted;
        } else if (schema.dateCreated) {
          const formatted = formatDate(schema.dateCreated);
          if (formatted) return formatted;
        } else if (schema.dateModified) {
          // Only use modified date if no published date found
          // const formatted = formatDate(schema.dateModified);
          // if (formatted) return formatted;
        }
      }
    } catch (e) {
      // Invalid JSON, skip
    }
  }

  return null;
}

// Extract publication details from page content
function extractPublicationDetailsFromPage() {
  const details = {
    volume: null,
    issue: null,
    pages: null,
    doi: null,
    publisher: null
  };

  // 1. Extract DOI (most important for academic papers)
  // Look in meta tags
  const doiMetaSelectors = [
    'meta[name="citation_doi"]',
    'meta[name="dc.identifier"]',
    'meta[property="article:identifier"]',
    'meta[property="og:identifier"]'
  ];

  for (const selector of doiMetaSelectors) {
    const meta = document.querySelector(selector);
    if (meta) {
      const doi = meta.getAttribute('content');
      if (doi && doi.includes('10.')) {
        details.doi = doi;
        break;
      }
    }
  }

  // Look in text
  if (!details.doi) {
    const doiRegex = /10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i;
    const bodyText = document.body.textContent;
    const doiMatch = bodyText.match(doiRegex);
    if (doiMatch) {
      details.doi = doiMatch[0];
    }
  }

  // Look in URL
  if (!details.doi && window.location.href.includes('doi.org')) {
    const doiMatch = window.location.href.match(/doi\.org\/(.+)/i);
    if (doiMatch) {
      details.doi = doiMatch[1];
    }
  }

  // 2. Extract volume
  const volumeRegexes = [
    /vol\.?\s*(\d+)/i,
    /volume\s*(\d+)/i,
    /vol\.?\s*([IVX]+)/i  // Roman numerals
  ];

  for (const regex of volumeRegexes) {
    const match = document.body.textContent.match(regex);
    if (match) {
      details.volume = match[1];
      break;
    }
  }

  // 3. Extract issue
  const issueRegexes = [
    /no\.?\s*(\d+)/i,
    /issue\s*(\d+)/i,
    /no\.?\s*([IVX]+)/i
  ];

  for (const regex of issueRegexes) {
    const match = document.body.textContent.match(regex);
    if (match) {
      details.issue = match[1];
      break;
    }
  }

  // 4. Extract pages
  const pagesRegexes = [
    /pp?\.?\s*(\d+[\s\-–]+\d+)/i,
    /pages?\s*(\d+[\s\-–]+\d+)/i,
    /(\d+[\s\-–]+\d+)/  // Just page ranges
  ];

  for (const regex of pagesRegexes) {
    const match = document.body.textContent.match(regex);
    if (match) {
      details.pages = match[1].replace(/\s+/g, '');
      break;
    }
  }

  // 5. Extract publisher
  // From meta tags
  const publisherMetaSelectors = [
    'meta[name="citation_publisher"]',
    'meta[name="publisher"]',
    'meta[property="og:site_name"]',
    'meta[name="DC.publisher"]',
    'meta[name="dcterms.publisher"]'
  ];

  for (const selector of publisherMetaSelectors) {
    const meta = document.querySelector(selector);
    if (meta) {
      const publisher = meta.getAttribute('content');
      if (publisher && publisher.length > 2) {
        details.publisher = publisher;
        break;
      }
    }
  }

  // From JSON-LD
  if (!details.publisher) {
    const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of jsonLdScripts) {
      try {
        const data = JSON.parse(script.textContent);
        const schemas = Array.isArray(data) ? data : [data];
        for (const schema of schemas) {
          if (schema.publisher) {
            if (typeof schema.publisher === 'string') {
              details.publisher = schema.publisher;
              break;
            } else if (schema.publisher.name) {
              details.publisher = schema.publisher.name;
              break;
            }
          }
        }
      } catch (e) {
        // Invalid JSON, skip
      }
    }
  }

  // From URL domain (fallback)
  if (!details.publisher) {
    const hostname = window.location.hostname.replace('www.', '');
    const domainParts = hostname.split('.');
    if (domainParts.length > 1) {
      // Use the main domain name
      details.publisher = domainParts[domainParts.length - 2];
    }
  }

  return details;
}

// Fallback: Extract author from title string
function extractAuthorFromTitle(title) {
  if (!title) return null;

  // Patterns to match author in title (case-insensitive, flexible spacing)
  const patterns = [
    /[-–—|]\s*(?:by|written by|author:?)\s+([A-Za-z][A-Za-z\s.'-]+)/i,
    /\s+(?:by|written by)\s+([A-Za-z][A-Za-z\s.'-]+?)(?:\s*[-–—|]|$)/i,
    /[-–—|]\s*([A-Za-z][a-z]+(?:\s+[A-Za-z][a-z]+){1,3})\s*$/,
  ];

  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match && match[1]) {
      const author = match[1].trim();
      // Validate: should be 2-4 words, reasonable length
      const words = author.split(/\s+/);
      if (words.length >= 1 && words.length <= 4 && author.length <= 40) {
        return author;
      }
    }
  }
  return null;
}

// Fallback: Extract author from URL
function extractAuthorFromUrl(url) {
  if (!url) return null;

  const patterns = [
    /\/author\/([^\/\?#]+)/i,
    /\/by\/([^\/\?#]+)/i,
    /\/writers?\/([^\/\?#]+)/i,
    /\/contributors?\/([^\/\?#]+)/i,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      let author = decodeURIComponent(match[1]);
      author = author.replace(/[-_]/g, ' ');
      // Title case
      author = author.replace(/\b\w/g, l => l.toUpperCase());
      if (author.length >= 2 && author.length <= 40) {
        return author;
      }
    }
  }
  return null;
}

// Main author extraction function
async function extractAuthor(tabId, url, title) {
  try {
    // 1. Try content script injection to get author from page
    const results = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      function: extractAuthorFromPage,
    });

    if (results && results[0] && results[0].result) {
      console.log('Author found via content script:', results[0].result);
      return results[0].result;
    }
  } catch (error) {
    console.log('Content script injection failed (may be restricted page):', error.message);
  }

  // 2. Fallback: Try title patterns
  const titleAuthor = extractAuthorFromTitle(title);
  if (titleAuthor) {
    console.log('Author found in title:', titleAuthor);
    return titleAuthor;
  }

  // 3. Fallback: Try URL patterns
  const urlAuthor = extractAuthorFromUrl(url);
  if (urlAuthor) {
    console.log('Author found in URL:', urlAuthor);
    return urlAuthor;
  }

  // 4. No author found
  console.log('No author found for:', title);
  return null;
}

// ============================================================================
// EXTRACT CREATION DATE FROM SOURCE
// ============================================================================

async function extractCreationDate(tabId) {
  try {
    // Try to extract creation date from page content
    const results = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      function: extractCreationDateFromPage,
    });

    if (results && results[0] && results[0].result) {
      console.log('Creation date found:', results[0].result);
      return results[0].result;
    }
  } catch (error) {
    console.log('Content script injection failed (may be restricted page):', error.message);
  }

  // No creation date found
  console.log('No creation date found');
  return null;
}

// Extract publication details (volume, issue, pages, DOI, publisher)
async function extractPublicationDetails(tabId) {
  try {
    // Try to extract publication details from page content
    const results = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      function: extractPublicationDetailsFromPage,
    });

    if (results && results[0] && results[0].result) {
      console.log('Publication details found:', results[0].result);
      return results[0].result;
    }
  } catch (error) {
    console.log('Content script injection failed (may be restricted page):', error.message);
  }

  // No publication details found
  console.log('No publication details found');
  return {
    volume: null,
    issue: null,
    pages: null,
    doi: null,
    publisher: null
  };
}

// ============================================================================
// SOURCE VERIFICATION: Validate URL and extract additional metadata
// ============================================================================

// Content script to extract source verification metadata
function extractSourceMetadataFromPage() {
  const metadata = {
    description: null,
    keywords: null,
    contentType: null,
    language: null,
    lastModified: null,
    canonical: null,
    ogType: null,
    siteName: null
  };

  // Extract meta description
  const descMeta = document.querySelector('meta[name="description"]') ||
                   document.querySelector('meta[property="og:description"]');
  if (descMeta) {
    metadata.description = descMeta.getAttribute('content');
  }

  // Extract keywords
  const keywordsMeta = document.querySelector('meta[name="keywords"]');
  if (keywordsMeta) {
    metadata.keywords = keywordsMeta.getAttribute('content');
  }

  // Extract content type from og:type
  const ogTypeMeta = document.querySelector('meta[property="og:type"]');
  if (ogTypeMeta) {
    metadata.ogType = ogTypeMeta.getAttribute('content');
    // Map og:type to content type
    const ogType = metadata.ogType.toLowerCase();
    if (ogType === 'article' || ogType.includes('article')) {
      metadata.contentType = 'article';
    } else if (ogType === 'book' || ogType.includes('book')) {
      metadata.contentType = 'book';
    } else if (ogType === 'video' || ogType.includes('video')) {
      metadata.contentType = 'video';
    } else if (ogType === 'website') {
      metadata.contentType = 'website';
    }
  }

  // Extract language
  const htmlLang = document.documentElement.lang;
  if (htmlLang) {
    metadata.language = htmlLang;
  }

  // Extract last modified from meta tag
  const lastModMeta = document.querySelector('meta[name="last-modified"]') ||
                      document.querySelector('meta[http-equiv="last-modified"]');
  if (lastModMeta) {
    metadata.lastModified = lastModMeta.getAttribute('content');
  }

  // Extract canonical URL
  const canonicalLink = document.querySelector('link[rel="canonical"]');
  if (canonicalLink) {
    metadata.canonical = canonicalLink.getAttribute('href');
  }

  // Extract site name
  const siteNameMeta = document.querySelector('meta[property="og:site_name"]');
  if (siteNameMeta) {
    metadata.siteName = siteNameMeta.getAttribute('content');
  }

  // Determine content type from structured data if not found
  if (!metadata.contentType) {
    // Check for JSON-LD
    const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of jsonLdScripts) {
      try {
        const data = JSON.parse(script.textContent);
        const type = data['@type'] || (Array.isArray(data) ? data[0]?.['@type'] : null);
        if (type) {
          const typeLower = type.toLowerCase();
          if (typeLower.includes('article') || typeLower.includes('newsarticle') || typeLower.includes('blogposting')) {
            metadata.contentType = 'article';
          } else if (typeLower.includes('scholarlyarticle')) {
            metadata.contentType = 'academic';
          } else if (typeLower.includes('book')) {
            metadata.contentType = 'book';
          } else if (typeLower.includes('video') || typeLower.includes('movie')) {
            metadata.contentType = 'video';
          }
          break;
        }
      } catch (e) {
        // Invalid JSON-LD, skip
      }
    }
  }

  // Fallback content type detection from page elements
  if (!metadata.contentType) {
    // Check for article indicators
    if (document.querySelector('article') ||
        document.querySelector('[itemprop="articleBody"]') ||
        document.querySelector('.article-content') ||
        document.querySelector('.post-content')) {
      metadata.contentType = 'article';
    }
  }

  return metadata;
}

// Validate URL format
function isValidUrl(url) {
  try {
    const urlObj = new URL(url);
    // Check for valid protocols
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch (e) {
    return false;
  }
}

// Classify source reliability based on domain
function classifySourceReliability(url) {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase();

    // Academic/Research domains - high reliability
    const academicDomains = ['.edu', '.ac.uk', '.edu.au', '.ac.jp', '.edu.cn'];
    const academicSites = ['scholar.google.com', 'jstor.org', 'pubmed.ncbi.nlm.nih.gov',
                          'sciencedirect.com', 'springer.com', 'wiley.com', 'nature.com',
                          'science.org', 'arxiv.org', 'researchgate.net', 'academia.edu'];

    // Government domains - high reliability
    const govDomains = ['.gov', '.gov.uk', '.gov.au', '.gc.ca', '.mil'];

    // Major news organizations - medium-high reliability
    const majorNews = ['nytimes.com', 'washingtonpost.com', 'bbc.com', 'bbc.co.uk',
                      'reuters.com', 'apnews.com', 'theguardian.com', 'wsj.com',
                      'economist.com', 'npr.org', 'pbs.org'];

    // Reference sites - medium reliability
    const referenceSites = ['wikipedia.org', 'britannica.com', 'merriam-webster.com',
                           'dictionary.com', 'encyclopedia.com'];

    // Check academic
    for (const acadDomain of academicDomains) {
      if (domain.endsWith(acadDomain)) {
        return { reliability: 'high', category: 'academic' };
      }
    }
    for (const site of academicSites) {
      if (domain.includes(site)) {
        return { reliability: 'high', category: 'academic' };
      }
    }

    // Check government
    for (const govDomain of govDomains) {
      if (domain.endsWith(govDomain)) {
        return { reliability: 'high', category: 'government' };
      }
    }

    // Check major news
    for (const news of majorNews) {
      if (domain.includes(news)) {
        return { reliability: 'medium-high', category: 'news' };
      }
    }

    // Check reference
    for (const ref of referenceSites) {
      if (domain.includes(ref)) {
        return { reliability: 'medium', category: 'reference' };
      }
    }

    // Default - unverified
    return { reliability: 'unverified', category: 'general' };

  } catch (e) {
    return { reliability: 'unknown', category: 'unknown' };
  }
}

// Main source verification function
async function verifySource(tabId, url) {
  const verification = {
    isValid: false,
    reliability: 'unknown',
    category: 'unknown',
    metadata: null,
    warnings: []
  };

  // Step 1: Validate URL format
  if (!isValidUrl(url)) {
    verification.warnings.push('Invalid URL format');
    return verification;
  }
  verification.isValid = true;

  // Step 2: Classify source reliability
  const classification = classifySourceReliability(url);
  verification.reliability = classification.reliability;
  verification.category = classification.category;

  // Step 3: Extract page metadata
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      function: extractSourceMetadataFromPage,
    });

    if (results && results[0] && results[0].result) {
      verification.metadata = results[0].result;

      // Add warnings for missing important metadata
      if (!verification.metadata.description) {
        verification.warnings.push('No meta description found');
      }

      // Update content type if found
      if (verification.metadata.contentType) {
        verification.contentType = verification.metadata.contentType;
      }
    }
  } catch (error) {
    console.log('Source metadata extraction failed:', error.message);
    verification.warnings.push('Could not extract page metadata');
  }

  // Step 4: Check for potential issues
  try {
    const urlObj = new URL(url);

    // Warn about HTTP (not HTTPS)
    if (urlObj.protocol === 'http:') {
      verification.warnings.push('Source uses insecure HTTP connection');
    }

    // Warn about suspicious TLDs
    const suspiciousTlds = ['.xyz', '.top', '.click', '.gq', '.ml', '.tk'];
    for (const tld of suspiciousTlds) {
      if (urlObj.hostname.endsWith(tld)) {
        verification.warnings.push('Suspicious domain extension');
        break;
      }
    }

  } catch (e) {
    // URL parsing failed
  }

  console.log('Source verification:', verification);
  return verification;
}
