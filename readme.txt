=== QA Assistant ===
Contributors: obayedmamur, nhrrob
Tags: qa assistant, quality assurance, help, sqa helper tool
Requires at least: 5.0
Tested up to: 6.9
Requires PHP: 8.0
Stable tag: 2.0.0
License: GPLv3
License URI: https://opensource.org/licenses/GPL-3.0

A comprehensive tool for Software Quality Assurance Engineers with advanced Git branch management capabilities.

== Description ==

QA Assistant is a powerful WordPress plugin designed specifically for Software Quality Assurance Engineers. It provides advanced Git branch management directly from the WordPress admin bar, making it easier to test different plugin versions and manage development workflows.

**Key Features:**

🔄 **GitHub Desktop-like Branch Switching** - Switch between Git branches with a single click directly from the WordPress admin bar

✅ **Current Branch Indicator** - Visual indicators show which branch you're currently on with color-coded status

⚠️ **Uncommitted Changes Detection** - Get warnings before switching branches when you have unsaved changes

🔒 **Force Switch Option** - Option to discard local changes and force switch to another branch

📢 **Real-time Notifications** - Instant feedback on all Git operations with success/error messages

🎨 **Enhanced User Interface** - Modern, intuitive interface with loading states and visual feedback

🛡️ **Security Enhanced** - Proper nonce verification and input sanitization for all AJAX operations

🔧 **Error Handling** - Comprehensive error handling with user-friendly error messages

**Perfect for:**
- Plugin developers testing different branches
- QA engineers managing multiple plugin versions
- Development teams working with Git workflows
- Anyone who needs quick branch switching in WordPress admin

== Services ==

1. Git PHP: https://github.com/czproject/git-php
Library for working with Git repositories in PHP.
Library requires PHP 5.6 or later and `git` client (path to Git must be in system variable `PATH`).

Git installers:

* for Linux - https://git-scm.com/download/linux
* for Windows - https://git-scm.com/download/win
* for others - https://git-scm.com/downloads


== Installation ==

Note : This plugin works with any wordpress sites. Make sure you have updated WordPress Site.


1. Upload the plugin folder to the `/wp-content/plugins/` directory, or install the plugin through the WordPress plugins screen directly.
2. Activate the plugin through the 'Plugins' screen in WordPress

== Frequently Asked Questions ==

= Can I use the plugin for FREE? =

Absolutely! You can use it to help you test WordPress Plugins/Themes.

== External services ==

This plugin does NOT connect to any external services or APIs. All Git operations are performed locally on your server.

**Local Git Repository Access:**
- The plugin reads local Git repository information from `.git/HEAD` files within your WordPress plugin directories
- This is used to display current branch information and enable branch switching functionality
- No data is transmitted to external servers
- All Git operations (branch switching, pulling changes) are performed locally using your server's Git installation

**Data Handling:**
- Only local Git repository metadata is accessed (branch names, commit information)
- No personal data or sensitive information is transmitted externally
- All operations remain within your WordPress installation and local Git repositories

== Screenshots ==

1. Git branch switching interface in WordPress admin bar - easily switch between branches with one click
2. Plugin settings page showing selected plugins with Git status indicators
3. Real-time notifications during branch switching operations with professional toast messages
4. Safety warning when switching branches with uncommitted changes, including force switch option


== Changelog ==

= 2.0.0 - 25/02/2026 =

**� Major Features & Enhancements:**
- Added: Git Branches Drawer feature with new React components and admin bar integration
- Added: Modal and backend logic to handle uncommitted changes during Git pull operations (commit or stash)
- Added: Custom confirmation modal for plugin removal from the dashboard
- Added: Plugin settings link added to the plugin list for easier access

**🎨 UI/UX Improvements:**
- Enhanced: Major UI revamp including a new notification system and animated skeleton loaders
- Enhanced: Robust CSS isolation using PostCSS prefixing and inline Tailwind theme
- Enhanced: Success button variant and improved Git branch item visuals

**�🔒 Security & Code Quality:**
- Added: PHPCS ignore annotations for correctly-prefixed global functions and classes
- Refactored: Refined AJAX URL parsing and plugin data handling

**⚙️ Compatibility:**
- Updated: Minimum PHP requirement from 7.4 to 8.0 to match Composer dependency requirements
- Updated: "Tested up to" WordPress version from 6.8 to 6.9
- Added: Explicit PHP >= 8.0 constraint in `composer.json` for early validation

= 1.0.3 - Initial Release =

= 1.0.2 - User Experience Improvements =

**🎯 User-Requested Features:**
- Added: Branch search functionality for easy branch filtering
- Added: Selected plugins display with Git status indicators
- Enhanced: Professional SVG loading spinner replacing squared icon
- Enhanced: Modern toast notification system with progress bars and smooth animations

**🎨 UI/UX Enhancements:**
- Added: Smart search input for Git branches (appears when 3+ branches)
- Added: Beautiful plugin cards showing current selections and Git status
- Enhanced: Modern notification design with SVG icons and titles
- Enhanced: Responsive grid layout for plugin cards
- Enhanced: Smooth animations and transitions throughout

**🔧 Technical Improvements:**
- Enhanced: Better event handling and DOM manipulation
- Enhanced: Improved CSS organization and maintainability
- Enhanced: Modern JavaScript with better structure
- Enhanced: Performance optimizations for animations

= 1.0.1 - Enhanced Version =

**🚀 Major Enhancements:**
- Added: GitHub Desktop-like branch switching functionality
- Added: One-click branch switching from admin bar
- Added: Current branch visual indicators with checkmarks
- Added: Uncommitted changes detection and warnings
- Added: Force switch option for discarding local changes
- Added: Real-time notification system with success/error messages
- Added: Enhanced loading states and visual feedback
- Added: Comprehensive error handling and user-friendly messages

**🛡️ Security & Code Quality:**
- Fixed: Added proper nonce verification for all AJAX requests
- Fixed: Enhanced input validation and sanitization
- Fixed: Improved error handling with try-catch blocks
- Fixed: Typo in constructor comment
- Added: New GitManager class for better code organization
- Added: Comprehensive documentation and code comments

**🎨 UI/UX Improvements:**
- Enhanced: Modern notification system with animations
- Enhanced: Color-coded branch status indicators
- Enhanced: Improved admin bar styling and hover effects
- Enhanced: Better responsive design for notifications
- Enhanced: Loading animations and visual feedback

**🔧 Technical Improvements:**
- Refactored: Separated Git operations into dedicated GitManager class
- Improved: Better separation of concerns and code organization
- Enhanced: More robust Git operations with proper validation
- Added: Comprehensive error logging for debugging

= 1.0.0 - 26/12/2024 =

- Added: Git Branch display in WP Admin Bar



== Upgrade Notice ==

