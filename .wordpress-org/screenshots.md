# Screenshots for WordPress.org

This file describes the screenshots that should be captured and uploaded to the `.wordpress-org` directory.

## 📸 Required Screenshots

### Screenshot 1: Main Git Branch Interface
**Filename:** `screenshot-1.png`
**Description:** Git branch switching interface in WordPress admin bar
**What to capture:**
- WordPress admin bar with "Git Branches" menu open
- Current branch highlighted with checkmark
- List of available branches
- Pull button visible
- Search functionality (if 3+ branches)

### Screenshot 2: Plugin Settings Page
**Filename:** `screenshot-2.png`
**Description:** QA Assistant settings and plugin selection
**What to capture:**
- Tools → QA Assistant settings page
- Plugin selection interface
- Selected plugins displayed with Git status
- Save settings button
- Clean, professional interface

### Screenshot 3: Branch Switching in Action
**Filename:** `screenshot-3.png`
**Description:** Real-time branch switching with notifications
**What to capture:**
- Branch switching notification/toast
- Loading state or success message
- Before/after branch indicator
- Professional notification design

### Screenshot 4: Uncommitted Changes Warning
**Filename:** `screenshot-4.png`
**Description:** Safety features - uncommitted changes detection
**What to capture:**
- Warning dialog for uncommitted changes
- Force switch option
- Cancel/proceed buttons
- Clear warning message

## 📋 Screenshot Guidelines

### Technical Requirements
- **Minimum width:** 1200px
- **Format:** PNG (preferred) or JPG
- **Quality:** High resolution, crisp text
- **Browser:** Use clean browser without extensions

### Content Guidelines
- **Clean interface:** No personal data or test content
- **Professional appearance:** Well-organized, clear UI
- **Readable text:** Ensure all text is legible
- **Consistent branding:** Match plugin design theme

### Capture Process
1. **Setup clean WordPress install**
2. **Install QA Assistant plugin**
3. **Configure test Git repositories**
4. **Capture screenshots in sequence**
5. **Edit for clarity if needed**
6. **Save as PNG files**

## 🎯 Screenshot Descriptions for readme.txt

Add these to the `== Screenshots ==` section in readme.txt:

```
== Screenshots ==

1. Git branch switching interface in WordPress admin bar - easily switch between branches with one click
2. Plugin settings page showing selected plugins with Git status indicators
3. Real-time notifications during branch switching operations with professional toast messages
4. Safety warning when switching branches with uncommitted changes, including force switch option
```

## 📁 File Structure

After capturing, the structure should be:
```
.wordpress-org/
├── screenshot-1.png    # Main interface
├── screenshot-2.png    # Settings page
├── screenshot-3.png    # Branch switching
├── screenshot-4.png    # Uncommitted changes
├── banner-1544x500.png # High-res banner
├── banner-772x250.png  # Standard banner
├── icon-256x256.png    # High-res icon
├── icon-128x128.png    # Standard icon
└── icon.svg           # Vector icon
```

## 🔄 Deployment

Screenshots are automatically deployed via GitHub Actions:
- Uploaded to WordPress.org SVN `/assets/` directory
- Displayed on plugin page in order (1, 2, 3, 4)
- Updated when new screenshots are added

## ✅ Checklist

- [ ] Capture screenshot 1 (main interface)
- [ ] Capture screenshot 2 (settings page)
- [ ] Capture screenshot 3 (branch switching)
- [ ] Capture screenshot 4 (uncommitted changes)
- [ ] Optimize file sizes
- [ ] Test display on WordPress.org
- [ ] Update readme.txt descriptions
