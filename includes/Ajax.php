<?php

namespace QaAssistant;

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

        // Legacy support
        add_action('wp_ajax_qa_assistant_get_branch_data', [$this, 'get_branch_data']);

        $this->gitManager = new GitManager();
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

        $path = WP_PLUGIN_DIR . '/' . $plugin_dir;

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

        $path = WP_PLUGIN_DIR . '/' . $plugin_dir;
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

        $path = WP_PLUGIN_DIR . '/' . $plugin_dir;

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

        $path = WP_PLUGIN_DIR . '/' . $plugin_dir;
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

        $path = WP_PLUGIN_DIR . '/' . $plugin_dir;
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
}
