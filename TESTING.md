# Quote Saver & Citation Assistant - Integration Testing Protocol

## Test Environment
- **Extension Version:** 1.0.0
- **Chrome Version:** Latest (Manifest V3)
- **Test Date:** _______________
- **Tester:** _______________

---

## TEST SUITE 1: Context Menu Functionality

### Objective
Verify that the context menu appears and functions correctly across different websites.

### Test 1.1: Context Menu Appearance
**Steps:**
1. Open Chrome and load the extension from `chrome://extensions/`
2. Navigate to **https://www.bbc.com/news**
3. Select any text paragraph (click and drag to highlight)
4. Right-click on the selected text

**Expected Result:**
- ✅ Context menu appears with option: **"Save Quote & Generate Citation"**
- ❌ If missing: FAIL

**Pass: ☐ | Fail: ☐**

---

### Test 1.2: Quote Capture - News Website
**Steps:**
1. On BBC News, select a sentence from an article
2. Right-click → select **"Save Quote & Generate Citation"**
3. Check for Chrome notification

**Expected Result:**
- ✅ Notification appears: "Quote saved from [article title]"
- ✅ No error messages
- ❌ If notification missing or error: FAIL

**Pass: ☐ | Fail: ☐**

---

### Test 1.3: Quote Capture - Blog Website
**Steps:**
1. Navigate to **https://medium.com** or a tech blog
2. Select a paragraph from a blog post
3. Right-click → select **"Save Quote & Generate Citation"**
4. Check notification

**Expected Result:**
- ✅ Notification shows correct blog title
- ✅ Quote saved successfully
- ❌ If issues: FAIL

**Pass: ☐ | Fail: ☐**

---

### Test 1.4: Quote Capture - Academic Website
**Steps:**
1. Navigate to **https://www.ncbi.nlm.nih.gov** or university site
2. Select 2-3 sentences from an article
3. Right-click → select **"Save Quote & Generate Citation"**

**Expected Result:**
- ✅ Quote saved with full article title
- ✅ URL captured correctly
- ❌ If issues: FAIL

**Pass: ☐ | Fail: ☐**

---

### Test 1.5: No Selection Error Handling
**Steps:**
1. Navigate to any website
2. Do NOT select any text
3. Right-click on normal page area
4. Verify context menu does NOT show "Save Quote & Generate Citation"

**Expected Result:**
- ✅ Context menu does NOT show the quote option when no text is selected
- ❌ If option appears: FAIL

**Pass: ☐ | Fail: ☐**

---

## TEST SUITE 2: Storage & Performance

### Objective
Verify that the extension can handle multiple quotes efficiently without performance degradation.

### Test 2.1: Save 20 Quotes
**Steps:**
1. Visit 5 different websites
2. Save 4 quotes from each site (20 total)
3. Monitor Chrome's performance

**Expected Result:**
- ✅ All 20 quotes save successfully
- ✅ No lag or freezing
- ✅ Notifications appear for each save
- ❌ If any failures or performance issues: FAIL

**Pass: ☐ | Fail: ☐**

---

### Test 2.2: Popup Load Performance
**Steps:**
1. With 20+ quotes saved, click the **QS icon** in Chrome toolbar
2. Time how long the popup takes to load
3. Check if all quotes display

**Expected Result:**
- ✅ Popup loads in < 2 seconds
- ✅ All quotes visible
- ✅ Quote count displays correctly (20+)
- ✅ Scroll through the list smoothly
- ❌ If lag > 2 seconds or missing quotes: FAIL

**Actual Load Time:** _____ seconds

**Pass: ☐ | Fail: ☐**

---

### Test 2.3: Storage Persistence
**Steps:**
1. Save 5 quotes
2. Close all Chrome tabs
3. Reopen Chrome
4. Click the extension icon

**Expected Result:**
- ✅ All 5 quotes still present
- ✅ No data loss
- ❌ If quotes missing: FAIL

**Pass: ☐ | Fail: ☐**

---

### Test 2.4: Sort Order (Newest First)
**Steps:**
1. Save a quote from Site A
2. Wait 10 seconds
3. Save a quote from Site B
4. Open popup

**Expected Result:**
- ✅ Second quote (Site B) appears at TOP of list
- ✅ Quotes sorted by newest first
- ❌ If incorrect order: FAIL

**Pass: ☐ | Fail: ☐**

---

## TEST SUITE 3: Citation Format Accuracy

### Objective
Verify that MLA and APA citations match academic standards (Purdue OWL reference).

### Reference Standards
- **MLA 9th Edition:** https://owl.purdue.edu/owl/research_and_citation/mla_style/mla_formatting_and_style_guide/mla_formatting_and_style_guide.html
- **APA 7th Edition:** https://owl.purdue.edu/owl/research_and_citation/apa_style/apa_formatting_and_style_guide/apa_formatting_and_style_guide.html

---

### Test 3.1: MLA Format - Standard Quote
**Test Data:**
- Quote: "The only way to do great work is to love what you do."
- Source: "Steve Jobs Biography"
- URL: https://example.com/jobs
- Date: January 15, 2024

**Steps:**
1. Save the above quote
2. Open popup
3. Click eye icon (👁️) to view details
4. Copy MLA citation

**Expected MLA Format:**
```
"The only way to do great work is to love what you do." Unknown Author. Steve Jobs Biography. Accessed January 15, 2024. https://example.com/jobs.
```

**Actual Generated:**
```
_________________________________
```

**Pass: ☐ | Fail: ☐**

---

### Test 3.2: APA Format - Standard Quote
**Test Data:**
Same as Test 3.1

**Steps:**
1. With quote details open (from Test 3.1)
2. Copy APA citation

**Expected APA Format:**
```
Unknown Author. (2024). Steve Jobs Biography. Retrieved January 15, 2024, from https://example.com/jobs
```

**Actual Generated:**
```
_________________________________
```

**Pass: ☐ | Fail: ☐**

---

### Test 3.3: Citation Copy Functionality
**Steps:**
1. Open any quote details
2. Click **"Copy"** button for MLA format
3. Open Notepad/TextEdit
4. Paste (Ctrl+V / Cmd+V)

**Expected Result:**
- ✅ Toast shows "Copied!" message
- ✅ Text pastes correctly into text editor
- ✅ No extra characters or formatting issues
- ❌ If copy fails or formatting wrong: FAIL

**Pass: ☐ | Fail: ☐**

---

### Test 3.4: Multiple Citation Copies
**Steps:**
1. Open 3 different quotes
2. Copy MLA from each
3. Copy APA from each

**Expected Result:**
- ✅ Each copy works independently
- ✅ Correct citation for each quote
- ✅ No cross-contamination between quotes
- ❌ If citations mixed up: FAIL

**Pass: ☐ | Fail: ☐**

---

## TEST SUITE 4: Export Functionality

### Objective
Verify that the export feature generates a properly formatted .txt file compatible with Microsoft Word.

---

### Test 4.1: Export with Quotes
**Steps:**
1. Save at least 5 quotes from different sources
2. Click **"Export All"** button
3. Locate downloaded file: `quotes-export-YYYY-MM-DD.txt`

**Expected Result:**
- ✅ File downloads successfully
- ✅ File opens in any text editor
- ✅ File contains all 5 quotes
- ✅ Proper formatting with separators

**Pass: ☐ | Fail: ☐**

---

### Test 4.2: Open Export File in Microsoft Word
**Steps:**
1. Locate exported .txt file from Test 4.1
2. Right-click → **Open with** → Microsoft Word
3. Verify formatting

**Expected Result:**
- ✅ File opens in Word
- ✅ Text is readable
- ✅ No encoding issues (special characters display correctly)
- ✅ Quote numbers and sections clearly separated

**Pass: ☐ | Fail: ☐**

---

### Test 4.3: Export File Content Verification
**Steps:**
1. Open the exported .txt file
2. Verify structure includes:

**Expected Content Structure:**
```
QUOTE SAVER & CITATION ASSISTANT - EXPORT
Exported: [Date and Time]
Total Quotes: [Number]
===============================================================================

QUOTE 1
--------------------------------------------------------------------------------
Quote:
"[Actual quote text]"

Source: [Source Title]
URL: [URL]
Saved: [Date]
Timestamp: [ISO Timestamp]

MLA Format:
  [MLA citation]

APA Format:
  [APA citation]

===============================================================================
[Repeats for each quote]
```

**Pass: ☐ | Fail: ☐**

---

### Test 4.4: Export Empty State
**Steps:**
1. If no quotes saved, click **"Export All"**
2. OR delete all quotes and try to export

**Expected Result:**
- ✅ Toast notification: "No quotes to export"
- ✅ No file downloaded
- ✅ No error messages

**Pass: ☐ | Fail: ☐**

---

## TEST SUITE 5: Edge Cases & Error Handling

### Objective
Verify that the extension handles unusual scenarios gracefully.

---

### Test 5.1: Special Characters in Quote
**Steps:**
1. Find or create a quote with special characters: `“ ” ‘ ’ — – … © ™ " ' & < > @ # $ % ^ * ( )`
2. Save the quote
3. Open popup and view details

**Expected Result:**
- ✅ Quote saves correctly
- ✅ Special characters display properly
- ✅ Citations include special characters correctly
- ❌ If characters garbled or lost: FAIL

**Pass: ☐ | Fail: ☐**

---

### Test 5.2: Very Long Quote
**Steps:**
1. Select a large block of text (500+ characters)
2. Save the quote
3. View in popup

**Expected Result:**
- ✅ Quote saves completely
- ✅ Preview in list shows truncated text with "..."
- ✅ Full text visible in details modal
- ❌ If text truncated incorrectly: FAIL

**Pass: ☐ | Fail: ☐**

---

### Test 5.3: Very Long Source Title
**Steps:**
1. Find a page with a very long title (>100 characters)
2. Save a quote from it
3. Check notification

**Expected Result:**
- ✅ Notification shows truncated title (max 50 chars + "...")
- ✅ Full title saved correctly in storage
- ✅ Full title displayed in details
- ❌ If title handling incorrect: FAIL

**Pass: ☐ | Fail: ☐**

---

### Test 5.4: URL with Special Characters
**Steps:**
1. Save quote from URL with query parameters: `https://example.com/page?id=123&type=article`
2. Save quote from URL with anchor: `https://example.com/page#section`
3. View quotes

**Expected Result:**
- ✅ URLs save completely with all parameters
- ✅ URLs are clickable and open correctly
- ✅ Citations include full URLs
- ❌ If URLs broken or incomplete: FAIL

**Pass: ☐ | Fail: ☐**

---

### Test 5.5: Non-English Characters
**Steps:**
1. Find text with accented characters: `café, naïve, résumé, Москва, 東京`
2. Save the quote
3. View in popup

**Expected Result:**
- ✅ Special characters preserved
- ✅ Text displays correctly
- ✅ Citations include characters properly
- ❌ If encoding issues: FAIL

**Pass: ☐ | Fail: ☐**

---

### Test 5.6: Empty Storage Protection
**Steps:**
1. Delete all quotes (Clear All)
2. Open popup
3. Try various actions

**Expected Result:**
- ✅ Empty state displays helpful message
- ✅ Export button shows "No quotes to export" when clicked
- ✅ No errors or crashes
- ❌ If errors occur: FAIL

**Pass: ☐ | Fail: ☐**

---

## TEST SUITE 6: Settings & Preferences

### Objective
Verify that the settings tab functions correctly and preferences are saved.

---

### Test 6.1: Access Settings Tab
**Steps:**
1. Click **Settings** tab in popup
2. Verify settings page loads

**Expected Result:**
- ✅ Settings page displays
- ✅ Shows export preferences (MLA, APA, metadata checkboxes)
- ✅ Shows display preferences (sort order, auto-refresh)
- ❌ If settings page fails to load: FAIL

**Pass: ☐ | Fail: ☐**

---

### Test 6.2: Save Settings
**Steps:**
1. Uncheck "Include MLA citations"
2. Click **"Save Settings"**
3. Close and reopen popup
4. Go to Settings tab

**Expected Result:**
- ✅ Toast shows "Settings saved successfully"
- ✅ MLA checkbox remains unchecked after reopen
- ✅ Setting persisted
- ❌ If setting not saved: FAIL

**Pass: ☐ | Fail: ☐**

---

### Test 6.3: Reset Settings
**Steps:**
1. Change several settings (uncheck boxes, change dropdown)
2. Click **"Reset to Default"**
3. Confirm dialog

**Expected Result:**
- ✅ Confirmation dialog appears
- ✅ After confirm, all settings reset to default values
- ✅ Toast shows "Settings reset to default"
- ❌ If reset doesn't work: FAIL

**Pass: ☐ | Fail: ☐**

---

## TEST SUITE 7: User Interface & Experience

### Objective
Verify that the UI is intuitive and user-friendly.

---

### Test 7.1: Visual Design
**Steps:**
1. Open popup with quotes saved
2. Inspect visual elements

**Expected Result:**
- ✅ Header has gradient background (purple/blue)
- ✅ Quote list items have hover effects
- ✅ Buttons have hover states
- ✅ Modal has smooth slide-in animation
- ✅ Toast notifications appear at bottom center
- ❌ If visual issues: FAIL

**Pass: ☐ | Fail: ☐**

---

### Test 7.2: Empty State Guidance
**Steps:**
1. Delete all quotes
2. Open popup

**Expected Result:**
- ✅ Empty state shows helpful message
- ✅ Instructions to right-click and save quotes
- ✅ Icon or illustration present
- ❌ If unhelpful or confusing: FAIL

**Pass: ☐ | Fail: ☐**

---

### Test 7.3: Confirmation Dialogs
**Steps:**
1. Try to delete a single quote
2. Try to clear all quotes

**Expected Result:**
- ✅ "Are you sure?" dialog appears before deletion
- ✅ Clear All has stronger warning: "delete ALL quotes? This cannot be undone."
- ✅ User can cancel deletion
- ❌ If no confirmations: FAIL

**Pass: ☐ | Fail: ☐**

---

### Test 7.4: Auto-Refresh
**Steps:**
1. Open popup
2. In another tab, save a quote
3. Return to popup (without clicking refresh)

**Expected Result:**
- ✅ Popup automatically refreshes with new quote
- ✅ Quote count increases
- ✅ New quote appears in list
- ❌ If no auto-refresh: FAIL

**Pass: ☐ | Fail: ☐**

---

## TEST SUITE 8: Cross-Site Compatibility

### Objective
Verify extension works across different types of websites.

---

### Test 8.1: News Sites
**Tested Sites:**
- BBC News
- CNN
- Reuters

**Steps:**
1. Visit each site
2. Save 1 quote from each
3. Check popup

**Expected Result:**
- ✅ All quotes save correctly
- ✅ Source titles accurate
- ✅ URLs correct

**Pass: ☐ | Fail: ☐**

---

### Test 8.2: Blogs & Articles
**Tested Sites:**
- Medium
- TechCrunch
- Personal blogs

**Expected Result:**
- ✅ Quotes save from blog posts
- ✅ Author names captured in titles
- ✅ Blog URLs saved correctly

**Pass: ☐ | Fail: ☐**

---

### Test 8.3: Academic Sites
**Tested Sites:**
- NCBI
- University websites
- Research journals

**Expected Result:**
- ✅ Quotes save from academic papers
- ✅ Long article titles handled correctly
- ✅ URLs with complex parameters work

**Pass: ☐ | Fail: ☐**

---

### Test 8.4: Social Media
**Tested Sites:**
- Twitter/X
- LinkedIn
- Reddit

**Expected Result:**
- ✅ Quotes save from posts
- ✅ Post titles/captions captured
- ✅ URLs from these platforms work

**Pass: ☐ | Fail: ☐**

---

## FINAL TEST SUMMARY

### Test Results Count

| Test Suite | Total Tests | Passed | Failed |
|------------|------------|--------|--------|
| 1. Context Menu | 5 | __ | __ |
| 2. Storage & Performance | 4 | __ | __ |
| 3. Citation Accuracy | 4 | __ | __ |
| 4. Export | 4 | __ | __ |
| 5. Edge Cases | 6 | __ | __ |
| 6. Settings | 3 | __ | __ |
| 7. UI/UX | 4 | __ | __ |
| 8. Cross-Site | 4 | __ | __ |

### Overall Result
- **Total Tests:** 34
- **Total Passed:** __
- **Total Failed:** __

### Critical Issues Found
1. _________________________________
2. _________________________________
3. _________________________________

### Minor Issues Found
1. _________________________________
2. _________________________________
3. _________________________________

### Overall Assessment
**All tests passed:** ☐ YES ☐ NO

**Extension Ready for Release:** ☐ YES ☐ NO

---

## Notes & Observations

### What Worked Well
_________________________________
_________________________________
_________________________________

### Suggestions for Improvement
_________________________________
_________________________________
_________________________________

### Additional Test Scenarios to Consider
_________________________________
_________________________________
_________________________________

---

## Sign-Off

**Tester Name:** _______________________

**Date Completed:** _______________________

**Signature:** _______________________

---

## Appendix: Sample Test Quotes for Copy-Paste

### Quote 1 (Tech)
"The only way to do great work is to love what you do."
Source: Stanford Commencement Address
URL: https://example.com/steve-jobs

### Quote 2 (Academic)
"Climate change is the single biggest health threat facing humanity."
Source: World Health Organization
URL: https://example.com/who-climate

### Quote 3 (Literature)
"It was the best of times, it was the worst of times."
Source: A Tale of Two Cities by Charles Dickens
URL: https://example.com/dickens

### Quote 4 (Special Characters)
"Café naìve résumé—it's a test... © 2024"
Source: Character Test Page
URL: https://example.com/special-chars

### Quote 5 (Long Quote)
This is a very long quote that should be handled correctly by the extension. It contains multiple sentences and should demonstrate how the system handles longer blocks of text without any issues or problems occurring during the saving or display process. The entire quote should be preserved in all its glory without any truncation or loss of information whatsoever.
Source: Long Quote Test
URL: https://example.com/long-quote
