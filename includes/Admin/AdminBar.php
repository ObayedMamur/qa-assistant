<?php

namespace QaAssistant\Admin;

use QaAssistant\GitManager;

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Handle Admin Bar enhancements
 */
class AdminBar
{
    /**
     * Git manager instance
     *
     * @var GitManager
     */
    protected $gitManager;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->gitManager = new GitManager();
        add_action('admin_bar_menu', [$this, 'add_git_branch_to_admin_bar'], 100);
    }

    /**
     * get the absolute path to a plugin directory
     * 
     * @param string $plugin_dir
     * @return string
     */
    private function get_plugin_path($plugin_dir)
    {
        // We need to access the helper from the main plugin or redefine it. 
        // Providing a safe fallback if the global function isn't available, though it should be.
        if (function_exists('qa_assistant_get_plugin_path')) {
            return qa_assistant_get_plugin_path($plugin_dir);
        }

        $plugins_dir = dirname(QA_ASSISTANT_PLUGIN_DIR);
        return trailingslashit($plugins_dir) . $plugin_dir;
    }

    /**
     * Get current Git branch for a given path
     *
     * @param string $path Repository path
     * @return string|false Current branch name or false on failure
     */
    public function get_git_branch($path)
    {
        return $this->gitManager->getCurrentBranch($path);
    }

    /**
     * Add Git Branch details to Admin Bar
     * 
     * @param \WP_Admin_Bar $wp_admin_bar
     */
    public function add_git_branch_to_admin_bar($wp_admin_bar)
    {
        // List of plugin directories with their aliases
        $qa_assistant_settings = get_option('qa_assistant_settings');
        $qa_assistant_settings = maybe_unserialize($qa_assistant_settings);

        if (!is_array($qa_assistant_settings) || !isset($qa_assistant_settings['selected_plugins'])) {
            return;
        }

        $plugin_dirs = $qa_assistant_settings['selected_plugins'];
        // Ensure array format
        if (!is_array($plugin_dirs)) {
            return;
        }

        // If simple array of strings, convert to assoc array for compatibility with loop
        if (isset($plugin_dirs[0])) {
            $plugin_dirs = array_combine($plugin_dirs, $plugin_dirs);
        }

        foreach ($plugin_dirs as $plugin_dir => $settings) {
            // Handle case where settings might just be the name (if array_combine was used on simple list)
            if (!is_array($settings)) {
                $settings = ['alias' => $settings];
            }

            $path = $this->get_plugin_path($plugin_dir);
            $currentBranch = $this->get_git_branch($path);

            if (!$currentBranch) {
                continue;
            }

            // Get all branches using GitManager with caching
            $branches = $this->gitManager->getBranches($path, false);

            // Sort branches: master/main -> develop -> current -> others
            $branches = $this->sort_branches($branches, $currentBranch);

            // Use alias or plugin directory name if alias is not provided
            $alias = isset($settings['alias']) ? $settings['alias'] : $plugin_dir;

            $node_id_base = 'git_branch_' . sanitize_title($plugin_dir);

            $parent_id = $node_id_base;

            if (count($plugin_dirs) > 2) {
                $root_id = 'qa_git_branches';

                // Add the root node only once
                if (!$wp_admin_bar->get_node($root_id)) {
                    $wp_admin_bar->add_node(array(
                        'id' => $root_id,
                        'title' => '<span class="qa-admin-bar-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="3" x2="6" y2="15"></line><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path></svg></span> <span class="qa-admin-bar-label">Git Branches</span>',
                        'href' => '#',
                        'meta' => array('class' => 'qa-admin-bar-root')
                    ));
                }

                // Add plugin node under root
                $wp_admin_bar->add_node(array(
                    'id' => $node_id_base,
                    'title' => sprintf(
                        '<span class="qa-repo-name">%s</span> <span class="qa-branch-badge">%s</span>',
                        esc_html($alias),
                        esc_html($currentBranch)
                    ),
                    'href' => '#',
                    'parent' => $root_id,
                    'meta' => array('class' => 'qa_assistant_git-branch'),
                ));
            } else {
                // Add individual node to top bar
                $wp_admin_bar->add_node(array(
                    'id' => $node_id_base,
                    'title' => sprintf(
                        '<span class="qa-repo-name">%s</span> <span class="qa-branch-badge">%s</span>',
                        esc_html($alias),
                        esc_html($currentBranch)
                    ),
                    'href' => '#',
                    'meta' => array('class' => 'qa_assistant_git-branch'),
                ));
            }

            // --- TOOLBAR (Pull & Refresh) ---
            $wp_admin_bar->add_node(array(
                'id' => 'git_toolbar_' . sanitize_title($plugin_dir),
                'title' => sprintf(
                    '<div class="qa-branch-toolbar">
                        <button class="qa-toolbar-btn qa-pull-button" onclick="qaAssistantPull(\'%s\'); return false;" title="Pull Changes">
                            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            <span>Pull</span>
                        </button>
                        <div class="qa-toolbar-divider"></div>
                        <button class="qa-toolbar-btn qa-refresh-button" onclick="qaAssistantRefresh(\'%s\'); return false;" title="Refresh Branches">
                            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg>
                            <span>Fetch</span>
                        </button>
                    </div>',
                    esc_js($plugin_dir),
                    esc_js($plugin_dir)
                ),
                'parent' => $node_id_base,
                'meta' => array('class' => 'qa-toolbar-container')
            ));

            // --- SEARCH INPUT ---
            if (count($branches) > 5) {
                $wp_admin_bar->add_node(array(
                    'id' => 'git_branch_search_' . sanitize_title($plugin_dir),
                    'title' => '<div class="qa-search-container">
                        <svg class="qa-search-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <input type="text" class="qa-branch-search-input" placeholder="Search branches..." data-plugin-dir="' . esc_attr($plugin_dir) . '">
                    </div>',
                    'parent' => $node_id_base,
                    'meta' => array('class' => 'qa-search-node')
                ));
            }

            // --- BRANCH LIST CONTAINER START ---
            // We use a group node to enforce the max-height scrollable area via CSS
            $list_group_id = 'git_branch_list_' . sanitize_title($plugin_dir);
            $wp_admin_bar->add_group(array(
                'id' => $list_group_id,
                'parent' => $node_id_base,
                'meta' => array('class' => 'qa-branch-list-scrollable')
            ));

            if (empty($branches)) {
                $wp_admin_bar->add_node(array(
                    'id' => 'git_no_branches_' . sanitize_title($plugin_dir),
                    'title' => 'No branches found',
                    'parent' => $list_group_id,
                    'meta' => array('class' => 'qa-no-branches'),
                ));
            }

            // List Branches
            foreach ($branches as $branchItem) {
                $isCurrentBranch = ($branchItem === $currentBranch);
                $isMain = in_array($branchItem, ['master', 'main', 'production']);

                $branchClass = 'qa_assistant_git-branch-item';
                if ($isCurrentBranch) {
                    $branchClass .= ' current';
                }
                if ($isMain) {
                    $branchClass .= ' main-branch';
                }

                $wp_admin_bar->add_node(array(
                    'id' => 'git_branch_' . sanitize_title($plugin_dir) . '_' . sanitize_title($branchItem),
                    'title' => sprintf(
                        '<div class="qa-branch-row">
                            <span class="qa-branch-name">%s</span>
                            %s
                        </div>',
                        esc_html($branchItem),
                        $isCurrentBranch ? '<span class="qa-current-indicator">Current</span>' : ''
                    ),
                    'href' => '#',
                    'parent' => $list_group_id,
                    'meta' => array(
                        'class' => $branchClass,
                        'data-plugin-dir' => esc_attr($plugin_dir),
                        'data-branch-name' => esc_attr($branchItem),
                    ),
                ));
            }
        }
    }

    /**
     * Sort branches by priority: master/main -> develop -> current -> others
     */
    private function sort_branches($branches, $currentBranch)
    {
        if (empty($branches))
            return [];

        $top = [];
        $develop = [];
        $current = [];
        $others = [];

        foreach ($branches as $branch) {
            if ($branch === 'master' || $branch === 'main') {
                $top[] = $branch;
            } elseif ($branch === 'develop' || $branch === 'dev') {
                $develop[] = $branch;
            } elseif ($branch === $currentBranch) {
                $current[] = $branch;
            } else {
                $others[] = $branch;
            }
        }

        // Sort sub-arrays
        sort($others);

        // Merge: Top -> Develop -> Current -> Others
        // Note: If current is master/develop, it's already in those arrays, so we don't duplicate.
        // We need to be careful not to duplicate if current is master/dev.

        $final = array_unique(array_merge($top, $develop, $current, $others));
        return $final;
    }
}
