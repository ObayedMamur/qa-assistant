#!/bin/bash

# QA Assistant - Production Build Script
# This script creates a production-ready ZIP file excluding development files

set -e

PLUGIN_NAME="qa-assistant"
BUILD_DIR="dist"
PLUGIN_VERSION=$(grep "Version:" qa-assistant.php | sed 's/.*Version: *//' | sed 's/ .*//')

# Install production dependencies
if [ -f composer.json ]; then
    echo "📦 Installing Composer production dependencies..."
    composer install --no-dev --optimize-autoloader
fi

echo "🚀 Building QA Assistant v${PLUGIN_VERSION} for production..."

# Clean previous builds
if [ -d "$BUILD_DIR" ]; then
    echo "🧹 Cleaning previous build..."
    rm -rf "$BUILD_DIR"
fi

# Create build directory
mkdir -p "$BUILD_DIR"

echo "📦 Copying plugin files..."

# Copy all files except those in .distignore
rsync -av --exclude-from=.distignore . "$BUILD_DIR/$PLUGIN_NAME/"

# Create ZIP file
echo "🗜️  Creating ZIP archive..."
cd "$BUILD_DIR"
zip -r "../${PLUGIN_NAME}-v${PLUGIN_VERSION}.zip" "$PLUGIN_NAME/"
cd ..

# Note about verification
echo "ℹ️  Production build ready!"
echo "📝 Note: Plugin Check may show text domain warnings when testing from build directory."
echo "   This is a false positive - the text domain 'qa-assistant' is correct."
echo "   To verify properly, install the ZIP file in a WordPress site and test there."

echo "🎉 Build complete!"
echo "📁 Production ZIP: ${PLUGIN_NAME}-v${PLUGIN_VERSION}.zip"
echo "📁 Build directory: $BUILD_DIR/$PLUGIN_NAME/"

# Show file count comparison
ORIGINAL_COUNT=$(find . -type f | wc -l)
BUILD_COUNT=$(find "$BUILD_DIR/$PLUGIN_NAME/" -type f | wc -l)
EXCLUDED_COUNT=$((ORIGINAL_COUNT - BUILD_COUNT))

echo ""
echo "📊 Build Statistics:"
echo "   Original files: $ORIGINAL_COUNT"
echo "   Production files: $BUILD_COUNT"
echo "   Excluded files: $EXCLUDED_COUNT"
