#!/bin/bash

# QA Assistant - WordPress.org Asset Generator
# This script generates PNG assets from SVG templates

set -e

echo "🎨 Generating WordPress.org assets..."

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick not found. Please install it first:"
    echo "   macOS: brew install imagemagick"
    echo "   Ubuntu: sudo apt-get install imagemagick"
    echo "   Windows: Download from https://imagemagick.org/script/download.php"
    exit 1
fi

# Generate icon assets from SVG
if [ -f "icon.svg" ]; then
    echo "📱 Generating icon assets..."
    
    # High resolution icon (256x256)
    convert icon.svg -resize 256x256 icon-256x256.png
    echo "   ✅ icon-256x256.png"
    
    # Standard resolution icon (128x128)
    convert icon.svg -resize 128x128 icon-128x128.png
    echo "   ✅ icon-128x128.png"
    
    # Additional sizes for flexibility
    convert icon.svg -resize 64x64 icon-64x64.png
    echo "   ✅ icon-64x64.png"
    
else
    echo "⚠️  icon.svg not found, skipping icon generation"
fi

# Generate banner assets from SVG
if [ -f "banner.svg" ]; then
    echo "🖼️  Generating banner assets..."
    
    # High resolution banner (1544x500)
    convert banner.svg -resize 1544x500 banner-1544x500.png
    echo "   ✅ banner-1544x500.png"
    
    # Standard resolution banner (772x250)
    convert banner.svg -resize 772x250 banner-772x250.png
    echo "   ✅ banner-772x250.png"
    
else
    echo "⚠️  banner.svg not found, skipping banner generation"
fi

# Optimize PNG files if optipng is available
if command -v optipng &> /dev/null; then
    echo "🗜️  Optimizing PNG files..."
    for file in *.png; do
        if [ -f "$file" ]; then
            optipng -quiet "$file"
            echo "   ✅ Optimized $file"
        fi
    done
else
    echo "💡 Install optipng for PNG optimization: brew install optipng"
fi

# Display file sizes
echo ""
echo "📊 Generated assets:"
for file in icon-*.png banner-*.png; do
    if [ -f "$file" ]; then
        size=$(du -h "$file" | cut -f1)
        dimensions=$(identify "$file" | cut -d' ' -f3)
        echo "   $file - $size ($dimensions)"
    fi
done

echo ""
echo "🎉 Asset generation complete!"
echo ""
echo "📋 Next steps:"
echo "1. Review generated PNG files"
echo "2. Capture screenshots (see screenshots.md)"
echo "3. Test assets locally"
echo "4. Commit and deploy via GitHub Actions"
echo ""
echo "📁 Files ready for WordPress.org:"
ls -la *.png 2>/dev/null || echo "   No PNG files found"
