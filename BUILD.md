# QA Assistant - Build Instructions

## Development vs Production

This plugin uses a proper development workflow with `.gitignore` and `.distignore` files:

- **`.gitignore`** - Excludes files from Git repository (development)
- **`.distignore`** - Excludes files from production builds (WordPress.org)

## Plugin Check Results

### Development Environment
When running `wp plugin check` in development, you'll see these expected warnings:

```
FILE: .gitignore
[{"line":0,"column":0,"type":"ERROR","code":"hidden_files","message":"Hidden files are not permitted.","docs":""}]

FILE: .distignore
[{"line":0,"column":0,"type":"ERROR","code":"hidden_files","message":"Hidden files are not permitted.","docs":""}]
```

**This is expected and correct!** These files should exist in development but be excluded from production.

### Text Domain False Positives
When testing production builds, Plugin Check may show text domain warnings:

```
ERROR | WordPress.WP.I18n.TextDomainMismatch | Mismatched text domain. Expected 'build' but got 'qa-assistant'.
```

**This is a false positive!** The text domain 'qa-assistant' is correct and matches the plugin slug. Plugin Check incorrectly expects the text domain to match the directory name when testing from build directories.

## Building for Production

### Method 1: Using wp-cli (Recommended)

```bash
# Install wp-cli dist-archive command
wp package install wp-cli/dist-archive-command

# Create production build (excludes files listed in .distignore)
wp dist-archive . qa-assistant.zip
```

### Method 2: Manual ZIP Creation

```bash
# Create production build manually
zip -r qa-assistant.zip qa-assistant/ -x \
  "qa-assistant/.git/*" \
  "qa-assistant/.gitignore" \
  "qa-assistant/.distignore" \
  "qa-assistant/.DS_Store" \
  "qa-assistant/tests/*" \
  "qa-assistant/BUILD.md" \
  "qa-assistant/node_modules/*"
```

### Method 3: Using rsync + zip

```bash
# Create clean copy excluding development files
rsync -av --exclude-from=qa-assistant/.distignore qa-assistant/ qa-assistant-clean/

# Create production zip
zip -r qa-assistant.zip qa-assistant-clean/

# Cleanup
rm -rf qa-assistant-clean/
```

## Verification

After building, you can verify the production build:

```bash
# Extract and check the production build
unzip qa-assistant.zip -d temp/
wp plugin check temp/qa-assistant/

# Should show: "Success: Checks complete. No errors found."
```

## Development Workflow

1. **Development**: Keep `.gitignore` and `.distignore` files
2. **Testing**: Run `wp plugin check` (expect hidden file warnings)
3. **Building**: Use one of the methods above to create production build
4. **Submission**: Upload the production ZIP to WordPress.org

## Files Excluded from Production

The `.distignore` file excludes:
- Git files (`.git/`, `.gitignore`)
- Development tools (`package.json`, `composer.json`)
- Test files (`tests/`)
- Documentation (`BUILD.md`, `README.md`)
- IDE files (`.vscode/`, `.idea/`)
- OS files (`.DS_Store`)
- Build artifacts (`node_modules/`, `vendor/`)

This ensures a clean, lightweight production plugin.
