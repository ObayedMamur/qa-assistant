# WordPress.org Assets

This directory contains assets for the WordPress.org plugin directory page.

## 📁 Asset Requirements

### Banner Images
- **banner-1544x500.jpg/png** - High resolution banner (1544×500px)
- **banner-772x250.jpg/png** - Standard resolution banner (772×250px)

### Plugin Icons
- **icon-256x256.jpg/png** - High resolution icon (256×256px)
- **icon-128x128.jpg/png** - Standard resolution icon (128×128px)
- **icon.svg** - Vector icon (optional, recommended)

### Screenshots
- **screenshot-1.jpg/png** - Main plugin interface
- **screenshot-2.jpg/png** - Settings page
- **screenshot-3.jpg/png** - Git branch switching in action
- **screenshot-4.jpg/png** - Additional features

## 🎨 Design Guidelines

### Banner Design
- **Dimensions**: 1544×500px (high-res), 772×250px (standard)
- **Format**: JPG or PNG
- **Content**: Plugin name, key features, visual elements
- **Style**: Professional, clean, matches plugin branding

### Icon Design
- **Dimensions**: 256×256px (high-res), 128×128px (standard)
- **Format**: JPG, PNG, or SVG
- **Content**: Simple, recognizable symbol
- **Style**: Clear at small sizes, consistent with banner

### Screenshots
- **Dimensions**: Minimum 1200px wide
- **Format**: JPG or PNG
- **Content**: Actual plugin interface, clear and readable
- **Captions**: Described in readme.txt

## 📝 Usage

These assets are automatically used by WordPress.org when:
1. Plugin is submitted to WordPress.org
2. Assets are uploaded to SVN `/assets/` directory
3. Plugin page is updated

## 🔄 Deployment

Assets are deployed via GitHub Actions workflow:
- Automatically uploaded during WordPress.org deployment
- Synced with SVN repository
- Updated when assets change

## 📋 Current Status

- [ ] Banner images (1544×500, 772×250)
- [ ] Plugin icons (256×256, 128×128)
- [ ] Screenshots (1-4)
- [ ] SVG icon (optional)

## 🎯 Next Steps

1. Create banner design with QA Assistant branding
2. Design plugin icon with Git/QA theme
3. Capture screenshots of plugin interface
4. Upload assets to this directory
5. Deploy via GitHub Actions
