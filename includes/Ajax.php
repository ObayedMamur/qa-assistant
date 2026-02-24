<?php

namespace QaAssistant;

// Prevent direct access
if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

use CzProject\GitPhp\Git;
use CzProject\GitPhp\GitException;

/**
 * Ajax handler class
 * Handles all AJAX requests with proper security and error handling
 */
class Ajax
{
    /**
     * Git manager instance
     *
     * @var GitManager
     */
    protected $gitManager;

    /**
     * Class constructor
     */
    function __construct()
    {
        // Branch switching
        add_action('wp_ajax_qa_assistant_switch_branch', [$this, 'switch_branch']);

        // Get repository status
        add_action('wp_ajax_qa_assistant_get_repo_status', [$this, 'get_repository_status']);

        // Pull operations
        add_action('wp_ajax_qa_assistant_pull_branch', [$this, 'pull_branch']);
        add_action('wp_ajax_qa_assistant_check_pull_status', [$this, 'check_pull_status']);

        // Branch refresh
        add_action('wp_ajax_qa_assistant_refresh_branches', [$this, 'refresh_branches']);

        // Stash and commit
        add_action('wp_ajax_qa_assistant_stash_changes', [$this, 'stash_changes']);
        add_action('wp_ajax_qa_assistant_commit_changes', [$this, 'commit_changes']);

        // Legacy support
        add_action('wp_ajax_qa_assistant_get_branch_data', [$this, 'get_branch_data']);

        // Clone repository
        add_action('wp_ajax_qa_assistant_clone_repo', [$this, 'clone_repository']);

        // Toggle monitor status
        add_action('wp_ajax_qa_assistant_toggle_monitor', [$this, 'toggle_monitor_plugin']);

        // Get installed git plugins
        add_action('wp_ajax_qa_assistant_get_plugins', [$this, 'get_git_plugins']);

        // Save display settings (aliases and monitoring)
        add_action('wp_ajax_qa_assistant_save_display_settings', [$this, 'save_display_settings']);

        $this->gitManager = new GitManager();
    }

    /**
     * Get list of plugins that are git repositories
     */
    public function get_git_plugins()
    {
        // Verify nonce usually, but for initial fetch we might just check permissions
        // or use the common admin nonce
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Unauthorized']);
        }

        $plugins = [];
        $plugin_dirs = array_filter(glob(WP_PLUGIN_DIR . '/*'), 'is_dir');
        $monitored_plugins = get_option('qa_assistant_monitored_plugins', []);

        // Retrieve settings for aliases
        $settings_option = get_option('qa_assistant_settings', []);
        $settings_option = maybe_unserialize($settings_option);
        $selected_plugins_settings = isset($settings_option['selected_plugins']) ? $settings_option['selected_plugins'] : [];

        foreach ($plugin_dirs as $dir) {
            $slug = basename($dir);
            // Check if it's a git repo
            if ($this->gitManager->isGitRepository($dir)) {
                $status = $this->gitManager->getRepositoryStatus($dir);
                $branch = $this->gitManager->getCurrentBranch($dir);

                // Get Plugin Name from main file if possible
                $name = $slug;
                $main_file = $dir . '/' . $slug . '.php';
                if (file_exists($main_file)) {
                    $plugin_data = get_plugin_data($main_file, false, false);
                    if (!empty($plugin_data['Name'])) {
                        $name = $plugin_data['Name'];
                    }
                }

                // Determine Alias
                $alias = '';
                // Check new associated array format
                if (isset($selected_plugins_settings[$slug]) && is_array($selected_plugins_settings[$slug])) {
                    $alias = isset($selected_plugins_settings[$slug]['alias']) ? $selected_plugins_settings[$slug]['alias'] : '';
                } elseif (isset($selected_plugins_settings[$slug]) && !is_array($selected_plugins_settings[$slug])) {
                    // Check legacy simple key-value (if any, though legacy was simple array of values)
                    // If it was simple array [0 => 'slug'], keys are integers.
                    // If it was assoc [slug => slug], value is string.
                    // We assume new format mostly, but 'alias' defaults to empty string.
                }

                $plugins[] = [
                    'id' => $slug, // Use slug as ID
                    'name' => $name,
                    'slug' => $slug,
                    'currentBranch' => $branch,
                    'status' => $status['has_changes'] ? 'modified' : 'stable',
                    'path' => $dir,
                    'is_monitored' => in_array($slug, $monitored_plugins),
                    'alias' => $alias
                ];
            }
        }

        wp_send_json_success(['plugins' => $plugins]);
    }

    /**
     * Toggle monitor status for a plugin
     */
    public function toggle_monitor_plugin()
    {
        // Verify nonce
        if (!wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['nonce'] ?? '')), 'qa-assistant-admin-nonce')) {
            wp_send_json_error(['message' => 'Security check failed.']);
        }

        $slug = sanitize_text_field(wp_unslash($_POST['slug'] ?? ''));
        $monitor = filter_var(wp_unslash($_POST['monitor'] ?? false), FILTER_VALIDATE_BOOLEAN);

        if (empty($slug)) {
            wp_send_json_error(['message' => 'Plugin slug is required.']);
        }

        $monitored = get_option('qa_assistant_monitored_plugins', []);

        if ($monitor) {
            if (!in_array($slug, $monitored)) {
                $monitored[] = $slug;
            }
        } else {
            $monitored = array_diff($monitored, [$slug]);
        }

        update_option('qa_assistant_monitored_plugins', array_values($monitored));

        wp_send_json_success([
            'message' => $monitor ? 'Plugin added to monitoring.' : 'Plugin removed from monitoring.',
            'slug' => $slug,
            'is_monitored' => $monitor
        ]);
    }

    /**
     * Enhanced branch switching with proper error handling
     */
    public function switch_branch()
    {
        // Verify nonce for security
        if (!wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['nonce'] ?? '')), 'qa-assistant-admin-nonce')) {
            wp_send_json_error([
                'message' => 'Security check failed. Please refresh the page and try again.'
            ]);
        }

        // Validate and sanitize input
        $plugin_dir = sanitize_text_field(wp_unslash($_POST['plugin_dir'] ?? ''));
        $branch = sanitize_text_field(wp_unslash($_POST['branch'] ?? ''));
        $force = filter_var(wp_unslash($_POST['force'] ?? false), FILTER_VALIDATE_BOOLEAN);

        if (empty($plugin_dir) || empty($branch)) {
            wp_send_json_error([
                'message' => 'Plugin directory and branch name are required.'
            ]);
        }

        $path = qa_assistant_get_plugin_path($plugin_dir);

        // Validate plugin directory exists
        if (!is_dir($path)) {
            wp_send_json_error([
                'message' => 'Plugin directory does not exist.'
            ]);
        }

        // Perform branch switch
        $result = $this->gitManager->switchBranch($path, $branch, $force);

        if ($result['success']) {
            wp_send_json_success([
                'message' => $result['message'],
                'current_branch' => $result['current_branch'],
                'plugin_dir' => $plugin_dir
            ]);
        } else {
            wp_send_json_error([
                'message' => $result['error'],
                'has_changes' => $result['has_changes'] ?? false
            ]);
        }
    }

    /**
     * Get repository status information
     */
    public function get_repository_status()
    {
        // Verify nonce for security
        if (!wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['nonce'] ?? '')), 'qa-assistant-admin-nonce')) {
            wp_send_json_error([
                'message' => 'Security check failed.'
            ]);
        }

        $plugin_dir = sanitize_text_field(wp_unslash($_POST['plugin_dir'] ?? ''));

        if (empty($plugin_dir)) {
            wp_send_json_error([
                'message' => 'Plugin directory is required.'
            ]);
        }

        $path = qa_assistant_get_plugin_path($plugin_dir);
        $status = $this->gitManager->getRepositoryStatus($path);

        if ($status['valid']) {
            wp_send_json_success($status);
        } else {
            wp_send_json_error([
                'message' => $status['error']
            ]);
        }
    }

    /**
     * Pull latest changes for current branch
     */
    public function pull_branch()
    {
        // Verify nonce for security
        if (!wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['nonce'] ?? '')), 'qa-assistant-admin-nonce')) {
            wp_send_json_error([
                'message' => 'Security check failed.'
            ]);
        }

        $plugin_dir = sanitize_text_field(wp_unslash($_POST['plugin_dir'] ?? ''));

        if (empty($plugin_dir)) {
            wp_send_json_error([
                'message' => 'Plugin directory is required.'
            ]);
        }

        $path = qa_assistant_get_plugin_path($plugin_dir);

        // Validate plugin directory exists
        if (!is_dir($path)) {
            wp_send_json_error([
                'message' => 'Plugin directory does not exist.'
            ]);
        }

        // Perform pull operation
        $result = $this->gitManager->pullCurrentBranch($path);

        if ($result['success']) {
            wp_send_json_success([
                'message' => $result['message'],
                'branch' => $result['branch'],
                'output' => $result['output'] ?? '',
                'plugin_dir' => $plugin_dir
            ]);
        } else {
            wp_send_json_error([
                'message' => $result['error'],
                'has_changes' => $result['has_changes'] ?? false
            ]);
        }
    }

    /**
     * Check pull status for a branch
     */
    public function check_pull_status()
    {
        // Verify nonce for security
        if (!wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['nonce'] ?? '')), 'qa-assistant-admin-nonce')) {
            wp_send_json_error([
                'message' => 'Security check failed.'
            ]);
        }

        $plugin_dir = sanitize_text_field(wp_unslash($_POST['plugin_dir'] ?? ''));
        $branch = sanitize_text_field(wp_unslash($_POST['branch'] ?? ''));

        if (empty($plugin_dir) || empty($branch)) {
            wp_send_json_error([
                'message' => 'Plugin directory and branch name are required.'
            ]);
        }

        $path = qa_assistant_get_plugin_path($plugin_dir);
        $comparison = $this->gitManager->getBranchComparison($path, $branch);

        if (isset($comparison['error'])) {
            wp_send_json_error([
                'message' => $comparison['error']
            ]);
        } else {
            wp_send_json_success($comparison);
        }
    }

    /**
     * Refresh branches by fetching from remote
     */
    public function refresh_branches()
    {
        // Verify nonce for security
        if (!wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['nonce'] ?? '')), 'qa-assistant-admin-nonce')) {
            wp_send_json_error([
                'message' => 'Security check failed.'
            ]);
        }

        $plugin_dir = sanitize_text_field(wp_unslash($_POST['plugin_dir'] ?? ''));

        if (empty($plugin_dir)) {
            wp_send_json_error([
                'message' => 'Plugin directory is required.'
            ]);
        }

        $path = qa_assistant_get_plugin_path($plugin_dir);

        // Validate plugin directory exists
        if (!is_dir($path)) {
            wp_send_json_error([
                'message' => 'Plugin directory does not exist.'
            ]);
        }

        // Refresh branches
        $result = $this->gitManager->refreshBranches($path);

        if ($result['success']) {
            wp_send_json_success([
                'message' => $result['message'],
                'branches' => $result['branches'],
                'current_branch' => $result['current_branch'],
                'plugin_dir' => $plugin_dir,
                'fetch_success' => $result['fetch_result']['success'] ?? false
            ]);
        } else {
            wp_send_json_error([
                'message' => $result['error']
            ]);
        }
    }

    /**
     * Legacy method for backward compatibility
     * @deprecated Use switch_branch() instead
     */
    public function get_branch_data()
    {
        // Verify nonce for security
        if (!wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['nonce'] ?? '')), 'qa-assistant-admin-nonce')) {
            wp_send_json_error([
                'message' => 'Security check failed.'
            ]);
        }

        $plugin_dir = sanitize_text_field(wp_unslash($_POST['plugin_dir'] ?? ''));
        $branch = sanitize_text_field(wp_unslash($_POST['branch'] ?? ''));

        if (empty($plugin_dir) || empty($branch)) {
            wp_send_json_error([
                'message' => 'Plugin directory and branch name are required.'
            ]);
        }

        $path = qa_assistant_get_plugin_path($plugin_dir);
        $result = $this->gitManager->switchBranch($path, $branch);

        if ($result['success']) {
            wp_send_json_success([
                'plugin_dir' => $plugin_dir,
                'branch' => $branch,
                'message' => $result['message']
            ]);
        } else {
            wp_send_json_error([
                'message' => $result['error']
            ]);
        }
    }

    /**
     * Stash changes for a repository
     */
    public function stash_changes()
    {
        // Verify nonce for security
        if (!wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['nonce'] ?? '')), 'qa-assistant-admin-nonce')) {
            wp_send_json_error([
                'message' => 'Security check failed.'
            ]);
        }

        $plugin_dir = sanitize_text_field(wp_unslash($_POST['plugin_dir'] ?? ''));

        if (empty($plugin_dir)) {
            wp_send_json_error([
                'message' => 'Plugin directory is required.'
            ]);
        }

        $path = qa_assistant_get_plugin_path($plugin_dir);

        // Validate plugin directory exists
        if (!is_dir($path)) {
            wp_send_json_error([
                'message' => 'Plugin directory does not exist.'
            ]);
        }

        $result = $this->gitManager->stashChanges($path);

        if ($result['success']) {
            wp_send_json_success([
                'message' => $result['message'],
                'plugin_dir' => $plugin_dir
            ]);
        } else {
            wp_send_json_error([
                'message' => $result['error']
            ]);
        }
    }

    /**
     * Commit changes for a repository
     */
    public function commit_changes()
    {
        // Verify nonce for security
        if (!wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['nonce'] ?? '')), 'qa-assistant-admin-nonce')) {
            wp_send_json_error([
                'message' => 'Security check failed.'
            ]);
        }

        $plugin_dir = sanitize_text_field(wp_unslash($_POST['plugin_dir'] ?? ''));
        $message = sanitize_text_field(wp_unslash($_POST['commit_message'] ?? ''));

        if (empty($plugin_dir)) {
            wp_send_json_error([
                'message' => 'Plugin directory is required.'
            ]);
        }

        if (empty(trim($message))) {
            wp_send_json_error([
                'message' => 'Commit message is required.'
            ]);
        }

        $path = qa_assistant_get_plugin_path($plugin_dir);

        // Validate plugin directory exists
        if (!is_dir($path)) {
            wp_send_json_error([
                'message' => 'Plugin directory does not exist.'
            ]);
        }

        $result = $this->gitManager->commitChanges($path, $message);

        if ($result['success']) {
            wp_send_json_success([
                'message' => $result['message'],
                'plugin_dir' => $plugin_dir
            ]);
        } else {
            wp_send_json_error([
                'message' => $result['error']
            ]);
        }
    }

    /**
     * Clone a GitHub user repository
     */
    public function clone_repository()
    {
        // Verify nonce for security
        // Note: We use a specific nonce for settings page actions if available, or fall back to the admin nonce
        $nonce = sanitize_text_field(wp_unslash($_POST['nonce'] ?? ''));
        if (!wp_verify_nonce($nonce, 'qa_assistant_clone_repo')) {
            wp_send_json_error([
                'message' => 'Security check failed. Please refresh the page and try again.'
            ]);
        }

        // Check permissions
        if (!current_user_can('manage_options')) {
            wp_send_json_error([
                'message' => 'You do not have permission to perform this action.'
            ]);
        }

        $repo_url = sanitize_text_field(wp_unslash($_POST['repo_url'] ?? ''));

        if (empty($repo_url)) {
            wp_send_json_error([
                'message' => 'Repository URL is required.'
            ]);
        }

        // Validate URL format (allow HTTP/HTTPS and SSH)
        if (!filter_var($repo_url, FILTER_VALIDATE_URL) && !preg_match('/^git@[\w\.-]+:[\w\.-]+\/[\w\.-]+\.git$/', $repo_url)) {
            // Fallback Regex for more loose git url validation if strict check fails
            if (!preg_match('/^(https?:\/\/|git@).+\.git$/', $repo_url)) {
                wp_send_json_error([
                    'message' => 'Invalid formatted Git URL. Please use HTTPS or SSH format ending in .git'
                ]);
            }
        }

        // Extract repository name to better determine target directory
        $repo_name = '';

        // Try parsing as URL first
        $path = parse_url($repo_url, PHP_URL_PATH);
        if ($path) {
            $path_parts = pathinfo($path);
            $repo_name = $path_parts['filename'];
        }

        // If parse_url failed (common with SCP-like SSH syntax), try regex extraction
        if (empty($repo_name)) {
            if (preg_match('/\/([^\/]+)\.git$/', $repo_url, $matches)) {
                $repo_name = $matches[1];
            }
        }

        if (empty($repo_name)) {
            wp_send_json_error([
                'message' => 'Could not determine repository name from URL.'
            ]);
        }

        $target_path = WP_PLUGIN_DIR . '/' . $repo_name;

        // Check if directory already exists before even trying git
        if (file_exists($target_path)) {
            wp_send_json_error([
                'message' => "Directory '{$repo_name}' already exists in plugins folder. Please remove or rename it first.",
                'target_exists' => true
            ]);
        }

        $result = $this->gitManager->cloneRepository($repo_url, $target_path);

        if ($result['success']) {
            // Auto-monitor this plugin
            $monitored = get_option('qa_assistant_monitored_plugins', []);
            if (!in_array($repo_name, $monitored)) {
                $monitored[] = $repo_name;
                update_option('qa_assistant_monitored_plugins', $monitored);
            }

            wp_send_json_success([
                'message' => "Successfully cloned '{$repo_name}' into plugins directory.",
                'repo_name' => $repo_name,
                'path' => $target_path
            ]);
        } else {
            wp_send_json_error([
                'message' => $result['error']
            ]);
        }
    }

    /**
     * Save display settings (Aliases and Monitoring status)
     */
    public function save_display_settings()
    {
        // Verify nonce
        if (!wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['nonce'] ?? '')), 'qa-assistant-admin-nonce')) {
            wp_send_json_error(['message' => 'Security check failed.']);
        }

        // Retrieve plugins data
        // Expecting $_POST['plugins'] to be an array of objects: { slug: '...', alias: '...', is_monitored: true/false }
        // Or a JSON string
        $plugins_input = isset($_POST['plugins']) ? $_POST['plugins'] : [];

        if (is_string($plugins_input)) {
            $plugins = json_decode(wp_unslash($plugins_input), true);
        } else {
            $plugins = $plugins_input;
        }

        if (!is_array($plugins)) {
            wp_send_json_error(['message' => 'Invalid data format.']);
        }

        $monitored_slugs = [];
        $settings_entries = [];

        foreach ($plugins as $plugin) {
            // sanitize
            $slug = sanitize_text_field($plugin['slug']);
            $is_monitored = filter_var($plugin['is_monitored'], FILTER_VALIDATE_BOOLEAN) || $plugin['is_monitored'] === 'true';
            $alias = sanitize_text_field($plugin['alias']);

            if ($is_monitored) {
                $monitored_slugs[] = $slug;
                // Add to settings entries with alias
                $settings_entries[$slug] = [
                    'alias' => $alias
                ];
            }
        }

        // Update monitored plugins option (Simple list of slugs)
        update_option('qa_assistant_monitored_plugins', $monitored_slugs);

        // Update settings option (Associative array with aliases)
        $current_settings = get_option('qa_assistant_settings', []);
        $current_settings = maybe_unserialize($current_settings);
        if (!is_array($current_settings)) {
            $current_settings = [];
        }

        $current_settings['selected_plugins'] = $settings_entries;
        update_option('qa_assistant_settings', $current_settings);

        wp_send_json_success([
            'message' => 'Display settings saved successfully.',
            'monitored_count' => count($monitored_slugs)
        ]);
    }
}
