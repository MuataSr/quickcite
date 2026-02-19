# QuickCite - Chrome Web Store Pre-Submission Checklist

Complete this checklist before submitting to the Chrome Web Store.

---

## Required Assets

- [ ] **Extension icon** - 128x128 PNG (`icons/icon128.png`)
- [ ] **Store icon** - 128x128 PNG (same as above)
- [ ] **Screenshots** - At least 1, recommended 3-5
  - [ ] Screenshot 1: Empty state with instructions
  - [ ] Screenshot 2: Quote list view
  - [ ] Screenshot 3: Quote detail modal with citations
  - [ ] Screenshot 4: Settings/themes
  - Resolution: 1280x800 or 640x400
  - Format: PNG or JPEG
  - Theme: Typewriter (default)

- [ ] **Small promotional tile** - 440x280 PNG (optional but recommended)
- [ ] **Large promotional tile** - 1400x560 PNG (optional, for featured placement)

---

## Store Listing Content

- [ ] **Name** - "QuickCite" (or "QuickCite - Quote Saver & Citation Generator")
- [ ] **Tagline** - Under 132 characters (see `listing.md`)
- [ ] **Detailed description** - Copied from `listing.md`
- [ ] **Category** - Productivity or Education
- [ ] **Language** - English
- [ ] **Privacy policy URL** - Link to PRIVACY.md on GitHub
- [ ] **Support URL** - Link to GitHub issues
- [ ] **Homepage URL** - Link to GitHub repo

---

## Code Quality

- [ ] No console errors in service worker
- [ ] No console errors in popup
- [ ] All features tested per `TESTING.md`
- [ ] Special characters handled correctly
- [ ] Citations match academic standards (Purdue OWL)
- [ ] Storage persists across browser restarts

---

## Manifest Review

- [ ] Version number set (currently 1.0.0)
- [ ] All permissions justified and documented
- [ ] `host_permissions` reviewed
- [ ] Description accurate
- [ ] Minimum Chrome version appropriate (88+)

---

## Files to Exclude from Package

Do NOT include in the ZIP upload:

```
/.git/
/.claude/
/docs/
/store/
/quickcite-env/
/CLAUDE.md
/AGENTS.md
/README.md
/LICENSE
/PRIVACY.md
/.gitignore
```

Only include extension files:
```
/manifest.json
/background.js
/popup.html
/popup.js
/styles.css
/themes/
/icons/
/model/ (if used)
```

---

## Legal & Compliance

- [ ] LICENSE file exists (MIT)
- [ ] PRIVACY.md exists and is accurate
- [ ] No third-party code without attribution
- [ ] No API keys or secrets in code
- [ ] Privacy policy URL accessible

---

## Testing

- [ ] Load unpacked on fresh Chrome profile
- [ ] Test on Windows, Mac, or Linux
- [ ] Test quote capture from multiple sites
- [ ] Test citation copy functionality
- [ ] Test export feature
- [ ] Test delete/clear functionality
- [ ] Test theme switching
- [ ] Verify no errors in chrome://extensions/

---

## Pre-Upload Commands

Create clean package:

```bash
# Create package excluding non-essential files
zip -r quickcite-v1.0.0.zip \
  manifest.json \
  background.js \
  popup.html \
  popup.js \
  styles.css \
  themes/ \
  icons/ \
  -x "*.DS_Store" \
  -x "*__pycache__*"
```

---

## Post-Submission

- [ ] Review pending status in Developer Dashboard
- [ ] Respond to any Chrome Web Store feedback
- [ ] Test installed extension from store
- [ ] Monitor for user feedback/issues

---

## Version History

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | TBD | Initial release |

---

## Developer Dashboard Notes

- One-time $5 USD fee for Chrome Web Store developer account
- Review typically takes 24-48 hours
- Can publish as "Unlisted" for testing before public release
