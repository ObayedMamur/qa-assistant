# QA Assistant - WordPress.org Assets

This directory contains all assets for the WordPress.org plugin directory page, following the same structure as [nhrrob-core-contributions](https://github.com/nhrrob/nhrrob-core-contributions/tree/master/.wordpress-org).

## 📁 Asset Structure

```
.wordpress-org/
├── README.md              # This documentation
├── ASSETS.md              # Asset guidelines
├── screenshots.md         # Screenshot requirements
├── generate-assets.sh     # Asset generation script
├── icon.svg              # Vector icon template
├── banner.svg            # Vector banner template
├── icon-256x256.png      # High-res icon (generated)
├── icon-128x128.png      # Standard icon (generated)
├── banner-1544x500.png   # High-res banner (generated)
├── banner-772x250.png    # Standard banner (generated)
├── screenshot-1.png      # Main interface
├── screenshot-2.png      # Settings page
├── screenshot-3.png      # Branch switching
└── screenshot-4.png      # Uncommitted changes
```

## 🎨 Design System

### Color Palette
- **Primary Blue**: `#2271b1` (WordPress admin blue)
- **Dark Blue**: `#135e96` (Darker shade)
- **Success Green**: `#00a32a` (WordPress success)
- **Warning Red**: `#d63638` (WordPress warning)
- **White**: `#ffffff` (Text/backgrounds)

### Typography
- **Primary Font**: Arial, sans-serif
- **Headings**: Bold weights (600-700)
- **Body Text**: Regular weight (400)
- **Sizes**: Responsive based on asset dimensions

### Visual Elements
- **Git Branch Icons**: Circular nodes with connecting lines
- **QA Badge**: Rounded rectangle with "QA" text
- **WordPress Integration**: Admin bar mockups
- **Professional Gradients**: Subtle blue gradients

## 🖼️ Asset Specifications

### Banner Images
- **High Resolution**: 1544×500px
- **Standard Resolution**: 772×250px
- **Format**: PNG (from SVG template)
- **Content**: Plugin name, key features, visual demo
- **Style**: Professional gradient background with mockup

### Plugin Icons
- **High Resolution**: 256×256px
- **Standard Resolution**: 128×128px
- **Vector**: SVG format (scalable)
- **Design**: Git branch symbol with QA badge
- **Background**: Circular blue background

### Screenshots
- **Dimensions**: Minimum 1200px wide
- **Format**: PNG (high quality)
- **Content**: Actual plugin interface
- **Descriptions**: Clear, benefit-focused

## 🔧 Generation Process

### 1. SVG Templates
Created professional SVG templates with:
- Scalable vector graphics
- WordPress color scheme
- Git/QA themed iconography
- Responsive text elements

### 2. Automated Generation
Use the generation script:
```bash
cd .wordpress-org
chmod +x generate-assets.sh
./generate-assets.sh
```

### 3. Manual Screenshots
Capture actual plugin interface:
- Clean WordPress installation
- Professional appearance
- Clear, readable interface
- Consistent branding

## 🚀 Deployment Integration

### GitHub Actions
Assets are automatically deployed via workflow:
- **Trigger**: Release published
- **Process**: Upload to WordPress.org SVN `/assets/`
- **Files**: All PNG files in `.wordpress-org/`

### WordPress.org Display
- **Banner**: Shown on plugin page header
- **Icon**: Used in plugin directory listings
- **Screenshots**: Displayed in gallery with descriptions

## 📋 Quality Checklist

### Design Quality
- [ ] Professional appearance
- [ ] Consistent branding
- [ ] Clear, readable text
- [ ] Appropriate color contrast
- [ ] WordPress design guidelines compliance

### Technical Quality
- [ ] Correct dimensions
- [ ] Optimized file sizes
- [ ] High resolution/crisp graphics
- [ ] PNG format for raster images
- [ ] SVG for vector graphics

### Content Quality
- [ ] Accurate plugin representation
- [ ] Clear feature demonstration
- [ ] Professional interface screenshots
- [ ] Benefit-focused descriptions

## 🎯 WordPress.org Guidelines

### Asset Requirements
- **Banner**: Optional but recommended
- **Icon**: Required for plugin directory
- **Screenshots**: Recommended (1-10 images)
- **File Size**: Reasonable (under 1MB each)

### Content Guidelines
- **Accurate**: Must represent actual plugin
- **Professional**: High-quality, polished appearance
- **Clear**: Easy to understand at a glance
- **Compliant**: Follow WordPress.org guidelines

## 🔄 Maintenance

### Regular Updates
- Update screenshots when UI changes
- Refresh banners for major releases
- Maintain consistent branding
- Optimize for performance

### Version Control
- Track asset changes in Git
- Use semantic versioning for major updates
- Document design decisions
- Maintain asset source files

## 📊 Performance

### File Size Optimization
- Use PNG optimization tools
- Balance quality vs. file size
- Consider WebP for future compatibility
- Monitor loading performance

### Current Asset Sizes
Generated assets are optimized for:
- Fast loading on WordPress.org
- High quality display
- Reasonable bandwidth usage
- Cross-device compatibility

## 🎉 Benefits

### Professional Appearance
- Increases plugin credibility
- Improves download rates
- Enhances user trust
- Showcases plugin quality

### WordPress.org Integration
- Better search visibility
- Featured plugin eligibility
- Professional directory presence
- Improved user experience

This asset system ensures QA Assistant has a professional, consistent presence on WordPress.org that accurately represents the plugin's quality and functionality.
