# GitHub Actions Workflows

This directory contains automated workflows for the QA Assistant plugin development and deployment process.

## 🔄 Workflows Overview

### 1. **CI/CD Pipeline** (`ci.yml`)
**Triggers:** Push to `main`/`develop`, Pull Requests to `main`

**Jobs:**
- **Code Quality & Security**: Runs Plugin Check, validates code
- **Build**: Creates production-ready plugin ZIP
- **Test Matrix**: Tests on PHP 7.4, 8.0, 8.1, 8.2

**Artifacts:**
- Plugin Check results
- Production build ZIP
- Build directory

### 2. **Pull Request Checks** (`pr-check.yml`)
**Triggers:** PR opened/updated on `main`/`develop`

**Jobs:**
- **Quick Validation**: File structure, plugin header, version consistency
- **Security Check**: PHP syntax, basic security scan
- **Plugin Check**: WordPress Plugin Check validation
- **PR Comment**: Posts results summary to PR

### 3. **Release Creation** (`release.yml`)
**Triggers:** Git tags matching `v*` (e.g., `v1.0.0`)

**Jobs:**
- **Create GitHub Release**: Validates version, creates release with changelog
- **Upload Assets**: Attaches plugin ZIP and build archive

### 4. **WordPress.org Deployment** (`deploy.yml`)
**Triggers:** GitHub release published

**Jobs:**
- **Deploy**: Final validation, creates production build, deploys to WordPress.org
- **Upload Assets**: Adds release asset to GitHub

## 🚀 Usage Guide

### Development Workflow

1. **Feature Development**:
   ```bash
   git checkout -b feature/new-feature
   # Make changes
   git push origin feature/new-feature
   # Create PR → Triggers pr-check.yml
   ```

2. **Code Review**:
   - PR checks run automatically
   - Review results in PR comments
   - Fix any issues before merging

3. **Release Process**:
   ```bash
   # Update version in qa-assistant.php, readme.txt
   git tag v1.0.1
   git push origin v1.0.1
   # Triggers release.yml → Creates GitHub release
   # Then triggers deploy.yml → Deploys to WordPress.org
   ```

## 🔧 Setup Requirements

### Repository Secrets

Add these secrets in GitHub repository settings:

```
SVN_USERNAME=your-wordpress-org-username
SVN_PASSWORD=your-wordpress-org-password
```

### Branch Protection

Recommended branch protection rules for `main`:

- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Required status checks:
  - `Code Quality & Security`
  - `Quick Validation`
  - `WordPress Plugin Check`

## 📊 Workflow Status Badges

Add these to your main README.md:

```markdown
[![CI/CD Pipeline](https://github.com/username/qa-assistant/workflows/CI/CD%20Pipeline/badge.svg)](https://github.com/username/qa-assistant/actions)
[![Plugin Check](https://github.com/username/qa-assistant/workflows/Pull%20Request%20Checks/badge.svg)](https://github.com/username/qa-assistant/actions)
```

## 🛠️ Customization

### Modify PHP Versions
Edit `ci.yml` matrix strategy:
```yaml
strategy:
  matrix:
    php-version: ['7.4', '8.0', '8.1', '8.2', '8.3']
```

### Add Custom Checks
Add steps to `pr-check.yml`:
```yaml
- name: Custom Check
  run: |
    # Your custom validation
```

### Modify Deployment
Edit `deploy.yml` for custom deployment logic:
```yaml
- name: Custom Deploy Step
  run: |
    # Your deployment commands
```

## 🔍 Troubleshooting

### Common Issues

1. **Plugin Check Failures**:
   - Check for unescaped output
   - Verify input sanitization
   - Ensure proper nonce verification

2. **Version Mismatch**:
   - Ensure version consistency across:
     - `qa-assistant.php` header
     - `readme.txt` stable tag
     - Class constant

3. **Deployment Failures**:
   - Verify SVN credentials
   - Check WordPress.org plugin slug
   - Ensure clean production build

### Debug Workflows

Enable debug logging:
```yaml
env:
  ACTIONS_STEP_DEBUG: true
  ACTIONS_RUNNER_DEBUG: true
```

## 📝 Best Practices

1. **Version Management**:
   - Use semantic versioning (1.0.0)
   - Keep versions synchronized
   - Tag releases properly

2. **Security**:
   - Never commit credentials
   - Use repository secrets
   - Validate all inputs

3. **Testing**:
   - Test on multiple PHP versions
   - Validate before deployment
   - Use staging environments

4. **Documentation**:
   - Update changelog
   - Document breaking changes
   - Maintain clear commit messages
