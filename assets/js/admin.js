;(function($) {

    $(document).ready(function() {
        $('.qa-assistant-select2').select2();

        // Add Git repository validation for plugin selection
        initializeGitValidation();

        // Keyboard-based branch search functionality
        let searchBuffer = '';

        // Handle keypress events on branch dropdowns
        $(document).on('keydown', function(e) {
            // Only activate when a branch dropdown is open
            let openDropdown = $('.qa_assistant_git-branch .ab-sub-wrapper:visible');
            if (openDropdown.length === 0) return;

            // Handle alphanumeric keys for search
            if (e.key.length === 1 && e.key.match(/[a-zA-Z0-9\-_]/)) {
                e.preventDefault();

                // Add character to search buffer
                searchBuffer += e.key.toLowerCase();

                // Perform search
                performBranchSearch(openDropdown, searchBuffer);
            }

            // Handle Escape to clear search
            if (e.key === 'Escape') {
                searchBuffer = '';
                clearBranchSearch(openDropdown);
            }

            // Handle Backspace to remove last character
            if (e.key === 'Backspace' && searchBuffer.length > 0) {
                e.preventDefault();
                searchBuffer = searchBuffer.slice(0, -1);
                if (searchBuffer.length > 0) {
                    performBranchSearch(openDropdown, searchBuffer);
                } else {
                    clearBranchSearch(openDropdown);
                }
            }
        });

        function performBranchSearch(dropdown, searchTerm) {
            let branchContainer = dropdown.closest('.qa_assistant_git-branch');
            let searchHint = branchContainer.find('.qa-branch-search-hint');
            let hasMatches = false;

            // Update search hint with blinking cursor
            if (searchHint.length > 0) {
                searchHint.find('.ab-item').html(`🔍 Searching: "${searchTerm}<span class="qa-search-cursor">|</span>"`);
                branchContainer.addClass('qa-branch-search-active');
            }

            // Filter and highlight branches
            branchContainer.find('.qa_assistant_git-branch-list-items').each(function() {
                let $item = $(this);
                let branchName = $item.find('.ab-item').text().toLowerCase();

                if (branchName.includes(searchTerm)) {
                    $item.removeClass('qa-branch-hidden').show();

                    // Highlight matching text
                    let originalText = $item.find('.ab-item').text();
                    let highlightedText = highlightSearchTerm(originalText, searchTerm);
                    $item.find('.ab-item').html(highlightedText);

                    hasMatches = true;
                } else {
                    $item.addClass('qa-branch-hidden').hide();
                }
            });

            // Show "no matches" if needed
            if (!hasMatches && searchHint.length > 0) {
                searchHint.find('.ab-item').html(`🔍 No matches for "${searchTerm}<span class="qa-search-cursor">|</span>"`);
            }
        }

        function clearBranchSearch(dropdown) {
            let branchContainer = dropdown.closest('.qa_assistant_git-branch');
            let searchHint = branchContainer.find('.qa-branch-search-hint');

            // Reset search hint
            if (searchHint.length > 0) {
                searchHint.find('.ab-item').html('🔍 Type to search branches...<span class="qa-search-cursor">|</span>');
                branchContainer.removeClass('qa-branch-search-active');
            }

            // Show all branches and remove highlighting
            branchContainer.find('.qa_assistant_git-branch-list-items').each(function() {
                let $item = $(this);
                $item.removeClass('qa-branch-hidden').show();

                // Remove highlighting
                let originalText = $item.find('.ab-item').text();
                $item.find('.ab-item').text(originalText);
            });
        }

        function highlightSearchTerm(text, searchTerm) {
            if (!searchTerm) return text;

            let regex = new RegExp(`(${searchTerm})`, 'gi');
            return text.replace(regex, '<span class="qa-branch-highlight">$1</span>');
        }

        // Clear search when dropdown closes
        $(document).on('click', function(e) {
            if (!$(e.target).closest('.qa_assistant_git-branch').length) {
                searchBuffer = '';
                $('.qa_assistant_git-branch').each(function() {
                    clearBranchSearch($(this).find('.ab-sub-wrapper'));
                });
            }
        });

        // Enhanced branch switching with immediate feedback
        $(document).on('click', '.qa_assistant_git-branch-list-items', function(e) {
            e.preventDefault();

            let elementId = $(this).attr('id');
            let pluginDir = getPluginSlug(elementId);
            // Get branch name from the displayed text (most reliable method)
            let branchName = $(this).find('.ab-item').text().trim();
            let $this = $(this);
            let currentBranchElement = $this.closest('.qa_assistant_git-branch').find('.ab-item');

            // Validate branch name
            if (!branchName) {
                console.error('Branch name not found for element:', elementId);
                showNotification('Error: Branch name not found', 'error');
                return;
            }

            // Don't switch if it's already the current branch
            if ($this.hasClass('current-branch')) {
                showNotification('You are already on this branch', 'info');
                return;
            }

            // IMMEDIATE FEEDBACK - Show notification right away
            showNotification(`Switching to branch: ${branchName}...`, 'info');

            // Remove any existing loaders first
            $this.find('.qa-loader').remove();

            // Add enhanced loader with better styling
            let loader = $('<span class="qa-loader qa-branch-loader"><svg class="qa-spinner" viewBox="0 0 24 24"><circle class="qa-spinner-path" cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="32" stroke-dashoffset="32"></circle></svg></span>');
            $this.children().first().append(loader);

            // Disable the item during operation and show visual feedback
            $this.addClass('switching-branch');

            // Update the branch text to show switching state
            let originalText = $this.find('.ab-item').text();
            $this.find('.ab-item').html(`${originalText} <span style="color: #ffc107;">(switching...)</span>`);

            switchBranch(pluginDir, branchName, false)
                .done(function(response) {
                    if (response.success) {
                        showNotification(`Successfully switched to branch: ${response.data.current_branch}`, 'success');

                        // Update UI to reflect current branch
                        updateBranchUI(pluginDir, response.data.current_branch);

                        // Reload page after short delay to show updated state
                        setTimeout(() => {
                            location.reload();
                        }, 1500);
                    } else {
                        handleBranchSwitchError(response.data, pluginDir, branchName);
                    }
                })
                .fail(function(xhr, status, error) {
                    showNotification('Network error occurred. Please try again.', 'error');
                    console.error('Branch switch failed:', error);
                })
                .always(function() {
                    // Remove loader and re-enable item
                    loader.remove();
                    $this.removeClass('switching-branch');
                    // Restore original text
                    $this.find('.ab-item').text(originalText);
                });
        });

        // Handle branch switch errors with user-friendly options
        function handleBranchSwitchError(errorData, pluginDir, branchName) {
            if (errorData.has_changes) {
                // Show confirmation dialog for uncommitted changes
                if (confirm(`You have uncommitted changes. Do you want to discard them and switch to ${branchName}?`)) {
                    switchBranch(pluginDir, branchName, true)
                        .done(function(response) {
                            if (response.success) {
                                showNotification(`Force switched to branch: ${response.data.current_branch}`, 'success');
                                setTimeout(() => location.reload(), 1500);
                            } else {
                                showNotification(response.data.message, 'error');
                            }
                        });
                }
            } else {
                showNotification(errorData.message || 'Failed to switch branch', 'error');
            }
        }

        // Enhanced branch switching function
        function switchBranch(pluginDir, branchName, force = false) {
            return $.ajax({
                url: qaAssistant.ajaxUrl,
                method: "POST",
                data: {
                    action: "qa_assistant_switch_branch",
                    nonce: qaAssistant.nonce,
                    branch: branchName,
                    plugin_dir: pluginDir,
                    force: force
                }
            });
        }

        // Update UI to show current branch
        function updateBranchUI(pluginDir, currentBranch) {
            let branchContainer = $(`#git_branch_${pluginDir.replace(/[^a-zA-Z0-9]/g, '')}`);

            // Remove current-branch class from all items
            branchContainer.find('.qa_assistant_git-branch-list-items').removeClass('current-branch');

            // Add current-branch class to the new current branch
            branchContainer.find(`[id$="_${currentBranch.replace(/[^a-zA-Z0-9]/g, '')}"]`).addClass('current-branch');
        }

        // Enhanced modern notification system
        function showNotification(message, type = 'info') {
            // Remove existing notifications
            $('.qa-notification').remove();

            let icons = {
                'success': '<svg class="qa-notification-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4"></path><circle cx="12" cy="12" r="10"></circle></svg>',
                'error': '<svg class="qa-notification-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
                'info': '<svg class="qa-notification-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
                'warning': '<svg class="qa-notification-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>'
            };

            let notificationClass = `qa-notification qa-notification-${type}`;
            let icon = icons[type] || icons['info'];

            let notification = $(`
                <div class="${notificationClass}">
                    <div class="qa-notification-content">
                        <div class="qa-notification-icon">${icon}</div>
                        <div class="qa-notification-text">
                            <div class="qa-notification-title">${getNotificationTitle(type)}</div>
                            <div class="qa-notification-message">${message}</div>
                        </div>
                        <button class="qa-notification-close" aria-label="Close notification">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div class="qa-notification-progress"></div>
                </div>
            `);

            // Add to body for better positioning
            $('body').append(notification);

            // Trigger entrance animation
            setTimeout(() => {
                notification.addClass('qa-notification-show');
            }, 10);

            // Start progress bar animation
            setTimeout(() => {
                notification.find('.qa-notification-progress').addClass('qa-notification-progress-animate');
            }, 100);

            // Auto-hide after 5 seconds
            setTimeout(() => {
                hideNotification(notification);
            }, 5000);

            // Manual close
            notification.find('.qa-notification-close').on('click', function() {
                hideNotification(notification);
            });
        }

        function getNotificationTitle(type) {
            const titles = {
                'success': 'Success!',
                'error': 'Error',
                'info': 'Information',
                'warning': 'Warning'
            };
            return titles[type] || 'Notification';
        }

        function hideNotification(notification) {
            notification.removeClass('qa-notification-show').addClass('qa-notification-hide');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }

        // Global function for pull operations (called via onclick)
        window.qaAssistantPull = function(pluginDir) {
            // Show immediate feedback
            showNotification('Pulling latest changes...', 'info');

            // Find the button that was clicked and add loading state
            let $button = $('.qa-pull-button').filter(function() {
                return $(this).attr('onclick') && $(this).attr('onclick').includes(pluginDir);
            });

            if ($button.length > 0) {
                let originalText = $button.find('.ab-item').text() || $button.text();
                $button.find('.ab-item').html('<span class="qa-pull-loader">⟳</span> Pulling...');
                $button.addClass('qa-pull-loading');

                pullBranch(pluginDir)
                    .done(function(response) {
                        if (response.success) {
                            showNotification(`Successfully pulled changes for branch: ${response.data.branch}`, 'success');
                            // Reload page to show updated state
                            setTimeout(() => location.reload(), 1500);
                        } else {
                            if (response.data.has_changes) {
                                showNotification('You have uncommitted changes. Please commit or stash them before pulling.', 'warning');
                            } else {
                                showNotification(response.data.message || 'Failed to pull changes', 'error');
                            }
                        }
                    })
                    .fail(function(xhr, status, error) {
                        showNotification('Network error occurred during pull. Please try again.', 'error');
                        console.error('Pull failed:', error);
                    })
                    .always(function() {
                        // Restore button
                        $button.find('.ab-item').html(originalText);
                        $button.removeClass('qa-pull-loading');
                    });
            } else {
                // Fallback if button not found
                pullBranch(pluginDir)
                    .done(function(response) {
                        if (response.success) {
                            showNotification(`Successfully pulled changes for branch: ${response.data.branch}`, 'success');
                            setTimeout(() => location.reload(), 1500);
                        } else {
                            showNotification(response.data.message || 'Failed to pull changes', 'error');
                        }
                    })
                    .fail(function(xhr, status, error) {
                        showNotification('Network error occurred during pull. Please try again.', 'error');
                        console.error('Pull failed:', error);
                    });
            }
        };

        // Pull branch function
        function pullBranch(pluginDir) {
            return $.ajax({
                url: qaAssistant.ajaxUrl,
                method: "POST",
                data: {
                    action: "qa_assistant_pull_branch",
                    nonce: qaAssistant.nonce,
                    plugin_dir: pluginDir
                }
            });
        }

        // Check pull status function
        function checkPullStatus(pluginDir, branch) {
            return $.ajax({
                url: qaAssistant.ajaxUrl,
                method: "POST",
                data: {
                    action: "qa_assistant_check_pull_status",
                    nonce: qaAssistant.nonce,
                    plugin_dir: pluginDir,
                    branch: branch
                }
            });
        }

        // Global function for refreshing branches (called via onclick)
        window.qaAssistantRefresh = function(pluginDir) {
            // Show immediate feedback
            showNotification('Fetching latest branches from remote...', 'info');

            // Find the button that was clicked and add loading state
            let $button = $('.qa-refresh-button').filter(function() {
                return $(this).attr('onclick') && $(this).attr('onclick').includes(pluginDir);
            });

            if ($button.length > 0) {
                let originalText = $button.find('.ab-item').text() || $button.text();
                $button.find('.ab-item').html('<span class="qa-refresh-loader">⟳</span> Refreshing...');
                $button.addClass('qa-refresh-loading');

                refreshBranches(pluginDir)
                    .done(function(response) {
                        if (response.success) {
                            let message = response.data.fetch_success
                                ? `Successfully fetched latest branches. Found ${response.data.branches.length} branches.`
                                : `Refreshed local branches. Found ${response.data.branches.length} branches.`;

                            showNotification(message, 'success');

                            // Reload page to show updated branches
                            setTimeout(() => location.reload(), 1500);
                        } else {
                            showNotification(response.data.message || 'Failed to refresh branches', 'error');
                        }
                    })
                    .fail(function(xhr, status, error) {
                        showNotification('Network error occurred during refresh. Please try again.', 'error');
                        console.error('Refresh failed:', error);
                    })
                    .always(function() {
                        // Restore button
                        $button.find('.ab-item').html(originalText);
                        $button.removeClass('qa-refresh-loading');
                    });
            } else {
                // Fallback if button not found
                refreshBranches(pluginDir)
                    .done(function(response) {
                        if (response.success) {
                            let message = response.data.fetch_success
                                ? `Successfully fetched latest branches. Found ${response.data.branches.length} branches.`
                                : `Refreshed local branches. Found ${response.data.branches.length} branches.`;
                            showNotification(message, 'success');
                            setTimeout(() => location.reload(), 1500);
                        } else {
                            showNotification(response.data.message || 'Failed to refresh branches', 'error');
                        }
                    })
                    .fail(function(xhr, status, error) {
                        showNotification('Network error occurred during refresh. Please try again.', 'error');
                        console.error('Refresh failed:', error);
                    });
            }
        };

        // Refresh branches function
        function refreshBranches(pluginDir) {
            return $.ajax({
                url: qaAssistant.ajaxUrl,
                method: "POST",
                data: {
                    action: "qa_assistant_refresh_branches",
                    nonce: qaAssistant.nonce,
                    plugin_dir: pluginDir
                }
            });
        }

        function getPluginSlug(elementId) {
            let parts = elementId.split("_");
            return parts[2]; // Extract the plugin slug
        }

    });

    /**
     * Initialize Git repository validation for plugin selection
     */
    function initializeGitValidation() {
        // Add change event listener to plugin selection dropdown
        $('.qa-assistant-select2').on('change', function() {
            validateSelectedPlugins();
        });

        // Add form submission validation
        $('.qa-assistant-form').on('submit', function(e) {
            if (!validateSelectedPlugins()) {
                e.preventDefault();
                return false;
            }
        });
    }

    /**
     * Validate selected plugins are Git repositories
     */
    function validateSelectedPlugins() {
        let selectedValues = $('.qa-assistant-select2').val() || [];
        let nonGitPlugins = [];

        // Check each selected plugin
        selectedValues.forEach(function(pluginDir) {
            let pluginCard = $(`.qa-plugin-card[data-plugin-dir="${pluginDir}"]`);
            if (pluginCard.length > 0) {
                let gitStatus = pluginCard.find('.qa-git-status');
                if (gitStatus.hasClass('no-git')) {
                    let pluginName = pluginCard.find('h4').text();
                    nonGitPlugins.push(pluginName);
                }
            }
        });

        // Show warning if non-Git repositories are selected
        if (nonGitPlugins.length > 0) {
            let message = nonGitPlugins.length === 1
                ? `Warning: "${nonGitPlugins[0]}" is not a Git repository. Please select plugins that are Git repositories to enable branch switching functionality.`
                : `Warning: The following plugins are not Git repositories: ${nonGitPlugins.join(', ')}. Please select plugins that are Git repositories to enable branch switching functionality.`;

            showToast('warning', 'Git Repository Required', message);
            return false;
        }

        return true;
    }

})(jQuery);
