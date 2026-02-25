<?php

namespace QaAssistant\Admin;

use QaAssistant\GitManager;

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Handle Admin Bar — minimal Git Branches trigger + drawer mount point
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

        // Only show for users who can manage options
        if (!current_user_can('manage_options')) {
            return;
        }

        add_action('admin_bar_menu', [$this, 'add_git_trigger_to_admin_bar'], 100);

        // Inject React mount point outside admin bar
        add_action('admin_footer', [$this, 'inject_drawer_root']);
        add_action('wp_footer', [$this, 'inject_drawer_root']);
    }

    /**
     * Add a minimal "Git Branches" trigger to the admin bar.
     * No dropdown HTML, no complex layout — just an icon + label.
     *
     * @param \WP_Admin_Bar $wp_admin_bar
     */
    public function add_git_trigger_to_admin_bar($wp_admin_bar)
    {
        // Gather a summary badge (e.g. show active repo count)
        $qa_assistant_settings = get_option('qa_assistant_settings');
        $qa_assistant_settings = maybe_unserialize($qa_assistant_settings);

        if (!is_array($qa_assistant_settings) || !isset($qa_assistant_settings['selected_plugins'])) {
            return;
        }

        $plugin_dirs = $qa_assistant_settings['selected_plugins'];
        if (!is_array($plugin_dirs) || empty($plugin_dirs)) {
            return;
        }

        $wp_admin_bar->add_node(array(
            'id' => 'qa_git_drawer_trigger',
            'title' => '<span class="qa-git-drawer-trigger-inner">'
                . '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="3" x2="6" y2="15"></line><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path></svg>'
                . '<span class="qa-git-drawer-label"> Git Branches</span>'
                . '</span>',
            'href' => '#',
            'meta' => array(
                'class' => 'qa-git-drawer-trigger',
                'onclick' => 'return false;',
            ),
        ));
    }

    /**
     * Inject the React drawer mount point into the page footer.
     * This ensures it's outside #wpadminbar and renders properly.
     */
    public function inject_drawer_root()
    {
        // Only render once (if both admin_footer and wp_footer fire, deduplicate)
        static $rendered = false;
        if ($rendered) {
            return;
        }
        $rendered = true;

        echo '<div id="git-branches-root"></div>';
    }
}
