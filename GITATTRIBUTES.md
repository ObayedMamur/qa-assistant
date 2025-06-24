# QA Assistant - Git Attributes Configuration

## 📋 Overview

The `.gitattributes` file defines how Git handles different file types in the QA Assistant plugin repository. This ensures consistent behavior across different operating systems and development environments.

## 🔧 Key Features

### Line Ending Normalization
- **Auto-detection**: `* text=auto` automatically detects text files
- **LF for Unix/Linux**: Most text files use LF line endings
- **CRLF for Windows**: Batch files use CRLF line endings
- **Cross-platform consistency**: Prevents line ending issues

### File Type Handling

#### Text Files (LF line endings)
```
*.php text eol=lf      # PHP source files
*.js text eol=lf       # JavaScript files
*.css text eol=lf      # CSS stylesheets
*.json text eol=lf     # JSON configuration
*.md text eol=lf       # Markdown documentation
*.txt text eol=lf      # Text files
*.sql text eol=lf      # SQL scripts
*.sh text eol=lf       # Shell scripts
```

#### Binary Files
```
*.png binary           # Images
*.jpg binary           # Images
*.zip binary           # Archives
*.pdf binary           # Documents
*.woff binary          # Fonts
```

### Export Control
Files excluded from `git archive` (production builds):
- Development files (`.github/`, `tests/`)
- Build tools (`build.sh`, `composer.json`)
- Documentation (`*.md` files)
- IDE configurations

### Language-Specific Diff
- **PHP**: `*.php diff=php` - Better PHP diffs
- **JavaScript**: `*.js diff=javascript` - Better JS diffs
- **CSS**: `*.css diff=css` - Better CSS diffs

### Merge Strategies
- **readme.txt**: `merge=ours` - Always keep current version
- **CHANGELOG.md**: `merge=ours` - Prevent merge conflicts

## 🎯 Benefits

### Development Consistency
- ✅ **Cross-platform compatibility**: Works on Windows, macOS, Linux
- ✅ **Team collaboration**: Consistent file handling for all developers
- ✅ **CI/CD reliability**: Predictable behavior in automated systems

### File Management
- ✅ **Proper line endings**: Prevents mixed line ending issues
- ✅ **Binary file handling**: Prevents corruption of images/archives
- ✅ **Clean diffs**: Better diff output for code reviews

### Production Builds
- ✅ **Clean archives**: Development files excluded from exports
- ✅ **Smaller packages**: Only production files in releases
- ✅ **Professional deployment**: Clean, optimized builds

## 🔄 WordPress Plugin Specific

### WordPress Files
```
*.php text eol=lf      # WordPress PHP files
readme.txt text eol=lf # WordPress.org readme
.htaccess text eol=lf  # Apache configuration
wp-config.php text eol=lf # WordPress config
```

### Plugin Assets
```
*.pot text eol=lf      # Translation templates
*.po text eol=lf       # Translation files
*.mo binary            # Compiled translations
```

### Build Exclusions
Development files excluded from production:
- `.github/` - GitHub Actions workflows
- `tests/` - Unit tests and test files
- `build.sh` - Build scripts
- `*.md` - Documentation files
- `.wordpress-org/` - WordPress.org assets

## 🛠️ Usage

### Automatic Handling
Git automatically applies these rules:
- When cloning the repository
- During file commits
- When creating archives
- During merge operations

### Manual Commands
```bash
# Re-normalize all files (if needed)
git add --renormalize .

# Check file attributes
git check-attr -a filename.php

# Create archive (respects export-ignore)
git archive --format=zip HEAD > plugin.zip
```

## 🔍 Troubleshooting

### Line Ending Issues
If you encounter line ending problems:
```bash
# Re-normalize repository
git add --renormalize .
git commit -m "Normalize line endings"
```

### Binary File Corruption
If binary files are corrupted:
```bash
# Check if file is marked as binary
git check-attr -a image.png

# If not binary, add to .gitattributes
echo "*.png binary" >> .gitattributes
```

### Export Issues
If unwanted files appear in archives:
```bash
# Add to .gitattributes
echo "unwanted-file.txt export-ignore" >> .gitattributes
```

## 📊 File Statistics

Current configuration handles:
- **Text files**: 20+ file extensions
- **Binary files**: 15+ file extensions  
- **Export exclusions**: 10+ patterns
- **Special handling**: PHP, JS, CSS diff drivers

## 🎉 Best Practices

### For Developers
1. **Commit .gitattributes first**: Before adding other files
2. **Test on multiple platforms**: Verify line endings work correctly
3. **Review diffs carefully**: Ensure binary files aren't corrupted
4. **Use consistent tools**: Same editor settings across team

### For Releases
1. **Verify exports**: Check `git archive` output
2. **Test line endings**: Ensure files work on target platforms
3. **Validate binary files**: Confirm images/archives aren't corrupted
4. **Review file sizes**: Ensure efficient packaging

## 🔗 Integration

### GitHub Actions
Workflows respect `.gitattributes`:
- Line endings normalized in CI
- Export rules applied to releases
- Binary files handled correctly

### WordPress.org
Production builds exclude development files:
- Clean plugin ZIP files
- Only necessary files included
- Professional package structure

The `.gitattributes` configuration ensures the QA Assistant plugin maintains professional standards for file handling, cross-platform compatibility, and clean production builds! 🚀
