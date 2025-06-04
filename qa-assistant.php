<?php
/*
Plugin Name: QA Assistant
Plugin URI: https://obayedmamur.com/qa-assistant
Description: A comprehensive tool for SQA Engineers with GitHub Desktop-like Git branch switching functionality.
Version: 1.0.0
Author: Obayed Mamur
Author URI: https://obayedmamur.com
License: GPLv3
*/

if (! defined('ABSPATH')) {
    exit;
}

require_once __DIR__ . '/vendor/autoload.php';

/**
 * The main plugin class
 */
final class Qa_Assistant
{

    /**
     * Plugin version
     *
     * @var string
     */
    const version = '1.0.0';

    /**
     * Git manager instance
     *
     * @var QaAssistant\GitManager
     */
    protected $gitManager;

    /**
     * Class constructor
     */
    private function __construct()
    {
        $this->define_constants();

        $this->gitManager = new QaAssistant\GitManager();

        register_activation_hook(__FILE__, [$this, 'activate']);

        add_action('plugins_loaded', [$this, 'init_plugin']);

        add_action('admin_bar_menu', [$this, 'add_git_branch_to_admin_bar'], 100);

        // Include test file for development (only in admin and after WordPress is fully loaded)
        // Temporarily disabled to prevent critical errors
        // add_action('init', [$this, 'load_development_tools']);
    }

    /**
     * Initialize a singleton instance
     *
     * @return \Qa_Assistant
     */
    public static function init()
    {
        static $instance = false;

        if (! $instance) {
            $instance = new self();
        }

        return $instance;
    }

    /**
     * Define the required plugin constants
     *
     * @return void
     */
    public function define_constants()
    {
        define('QA_ASSISTANT_VERSION', self::version);
        define('QA_ASSISTANT_FILE', __FILE__);
        define('QA_ASSISTANT_PATH', __DIR__);
        define('QA_ASSISTANT_PLUGIN_DIR_PATH', plugin_dir_path(QA_ASSISTANT_FILE));
        define('QA_ASSISTANT_URL', plugins_url('', QA_ASSISTANT_FILE));
        define('QA_ASSISTANT_ASSETS', QA_ASSISTANT_URL . '/assets');
    }

    /**
     * Initialize the plugin
     *
     * @return void
     */
    public function init_plugin()
    {

        new QaAssistant\Assets();

        if (defined('DOING_AJAX') && DOING_AJAX) {
            new QaAssistant\Ajax();
        }

        if (is_admin()) {
            new QaAssistant\Admin();
        } else {
            new QaAssistant\Frontend();
        }

        new QaAssistant\API();
    }

    /**
     * Do stuff upon plugin activation
     *
     * @return void
     */
    public function activate()
    {
        $installer = new QaAssistant\Installer();
        $installer->run();
    }

    /**
     * Load development tools safely after WordPress is fully loaded
     *
     * @return void
     */
    public function load_development_tools()
    {
        if (is_admin() && defined('WP_DEBUG') && WP_DEBUG && current_user_can('manage_options')) {
            include_once QA_ASSISTANT_PATH . '/tests/test-git-manager.php';
        }
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

    public function add_git_branch_to_admin_bar($wp_admin_bar)
    {
        // List of plugin directories with their aliases and custom colors
        $qa_assistant_settings = get_option('qa_assistant_settings');

        $qa_assistant_settings = maybe_unserialize($qa_assistant_settings);

        if (! is_array($qa_assistant_settings)) {
            return;
        }

        $plugin_dirs = $qa_assistant_settings['selected_plugins'];
        // index same as value 
        $plugin_dirs = array_combine($plugin_dirs, $plugin_dirs);

        // $plugin_dirs = array(
        //     'essential-addons-for-elementor-lite' => array('alias' => 'EA-Lite', 'color' => '#33ff57'),
        //     'essential-addons-elementor' => array('alias' => 'EA-Pro', 'color' => '#33ff57'),
        //     // Add more plugins here with custom aliases and colors
        // );

        foreach ($plugin_dirs as $plugin_dir => $settings) {

            $path = WP_PLUGIN_DIR . '/' . $plugin_dir;
            $currentBranch = $this->get_git_branch($path);
            if (! $currentBranch) {
                continue;
            }

            // Get all branches using GitManager
            $branches = $this->gitManager->getBranches($path);

            // Use alias or plugin directory name if alias is not provided
            $alias = isset($settings['alias']) ? $settings['alias'] : $plugin_dir;

            // Use custom color or generate a random one if not provided
            $color = isset($settings['color']) ? $settings['color'] : '#00fffe';

            // Add node to the admin bar for each plugin directory as a Dropdown Sub Menu Item with the branch name and green color of the branch name under a parent menu item "Git Branches"
            // If the plugin directory is selected more than 2 times, then add a parent menu item "Git Branches" and add the plugin directory as a child menu item using if else condition
            if (count($plugin_dirs) > 2) {
                $wp_admin_bar->add_node(array(
                    'id'    => 'git_branches',
                    'title' => '<i class="ab-icon dashicons-share"></i> Git Branches',
                    'href'  => '',
                ));
                $wp_admin_bar->add_node(array(
                    'id'    => 'git_branch_' . sanitize_title($plugin_dir),
                    'title' => esc_html($alias) . ' (<span style="color: ' . esc_attr($color) . ';">' . esc_html($currentBranch) . '</span>)',
                    'href'  => '',
                    'parent' => 'git_branches',
                    'meta' => array('class' => 'qa_assistant_git-branch'),
                ));

                // Add pull button for current branch
                $pull_button_id = 'git_pull_' . sanitize_title($plugin_dir);
                $wp_admin_bar->add_node(array(
                    'id'    => $pull_button_id,
                    'title' => 'Pull Latest Changes <svg class="qa-icon qa-pull-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7,10 12,15 17,10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>',
                    'href'  => '#',
                    'parent' => 'git_branch_' . sanitize_title($plugin_dir),
                    'meta' => array(
                        'class' => 'qa-pull-button',
                        'onclick' => 'qaAssistantPull("' . esc_js($plugin_dir) . '"); return false;'
                    ),
                ));

                // Add refresh button to fetch latest branches
                $refresh_button_id = 'git_refresh_' . sanitize_title($plugin_dir);
                $wp_admin_bar->add_node(array(
                    'id'    => $refresh_button_id,
                    'title' => 'Refresh Branches <svg class="qa-icon qa-refresh-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M3 21v-5h5"></path></svg>',
                    'href'  => '#',
                    'parent' => 'git_branch_' . sanitize_title($plugin_dir),
                    'meta' => array(
                        'class' => 'qa-refresh-button',
                        'onclick' => 'qaAssistantRefresh("' . esc_js($plugin_dir) . '"); return false;'
                    ),
                ));

                // Add search hint for branches if there are many branches
                if (count($branches) > 3) {
                    $wp_admin_bar->add_node(array(
                        'id'    => 'git_branch_search_hint_' . sanitize_title($plugin_dir),
                        'title' => '🔍 Type to search branches...<span class="qa-search-cursor">|</span>',
                        'href'  => '#',
                        'parent' => 'git_branch_' . sanitize_title($plugin_dir),
                        'meta' => array('class' => 'qa-branch-search-hint'),
                    ));
                }
                foreach ($branches as $branchItem) {
                    $isCurrentBranch = ($branchItem === $currentBranch);
                    $branchClass = 'qa_assistant_git-branch-list-items';
                    if ($isCurrentBranch) {
                        $branchClass .= ' current-branch';
                    }

                    $wp_admin_bar->add_node(array(
                        'id'    => 'git_branch_' . sanitize_title($plugin_dir) . '_' . sanitize_title($branchItem),
                        'title' => esc_attr($branchItem),
                        'href'  => '#',
                        'parent' => 'git_branch_' . sanitize_title($plugin_dir),
                        'data-branch' => esc_attr($branchItem),
                        'meta' => array(
                            'class' => $branchClass,
                            'data-plugin-dir' => esc_attr($plugin_dir),
                            'data-branch-name' => esc_attr($branchItem),
                        ),
                    ));
                }
            } else {
                $wp_admin_bar->add_node(array(
                    'id'    => 'git_branch_' . sanitize_title($plugin_dir),
                    'title' => esc_html($alias) . ' (<span style="color: ' . esc_attr($color) . ';">' . esc_html($currentBranch) . '</span>)',
                    'href'  => '',
                    'meta' => array('class' => 'qa_assistant_git-branch'),
                ));

                // Add pull button for current branch
                $pull_button_id = 'git_pull_' . sanitize_title($plugin_dir);
                $wp_admin_bar->add_node(array(
                    'id'    => $pull_button_id,
                    'title' => 'Pull Latest Changes <svg class="qa-icon qa-pull-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7,10 12,15 17,10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>',
                    'href'  => '#',
                    'parent' => 'git_branch_' . sanitize_title($plugin_dir),
                    'meta' => array(
                        'class' => 'qa-pull-button',
                        'onclick' => 'qaAssistantPull("' . esc_js($plugin_dir) . '"); return false;'
                    ),
                ));

                // Add refresh button to fetch latest branches
                $refresh_button_id = 'git_refresh_' . sanitize_title($plugin_dir);
                $wp_admin_bar->add_node(array(
                    'id'    => $refresh_button_id,
                    'title' => 'Refresh Branches <svg class="qa-icon qa-refresh-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M3 21v-5h5"></path></svg>',
                    'href'  => '#',
                    'parent' => 'git_branch_' . sanitize_title($plugin_dir),
                    'meta' => array(
                        'class' => 'qa-refresh-button',
                        'onclick' => 'qaAssistantRefresh("' . esc_js($plugin_dir) . '"); return false;'
                    ),
                ));

                // Add search hint for branches if there are many branches
                if (count($branches) > 3) {
                    $wp_admin_bar->add_node(array(
                        'id'    => 'git_branch_search_hint_' . sanitize_title($plugin_dir),
                        'title' => '🔍 Type to search branches...<span class="qa-search-cursor">|</span>',
                        'href'  => '#',
                        'parent' => 'git_branch_' . sanitize_title($plugin_dir),
                        'meta' => array('class' => 'qa-branch-search-hint'),
                    ));
                }

                foreach ($branches as $branchItem) {
                    $isCurrentBranch = ($branchItem === $currentBranch);
                    $branchClass = 'qa_assistant_git-branch-list-items';
                    if ($isCurrentBranch) {
                        $branchClass .= ' current-branch';
                    }

                    $wp_admin_bar->add_node(array(
                        'id'    => 'git_branch_' . sanitize_title($plugin_dir) . '_' . sanitize_title($branchItem),
                        'title' => esc_attr($branchItem),
                        'href'  => '#',
                        'parent' => 'git_branch_' . sanitize_title($plugin_dir),
                        'data-branch' => esc_attr($branchItem),
                        'meta' => array(
                            'class' => $branchClass,
                            'data-plugin-dir' => esc_attr($plugin_dir),
                            'data-branch-name' => esc_attr($branchItem),
                        ),
                    ));
                }
            }

            // $wp_admin_bar->add_node(array(
            //     'id'    => 'git_branch_' . sanitize_title($plugin_dir),
            //     'title' => $alias . ' (Branch: <span style="color: ' . $color . ';">' . $branch . '</span>)',
            //     'href'  => '',
            // ));
        }
    }


    // End of Plugin Directory Git Branch Show
}

/**
 * Initializes the main plugin
 *
 * @return \Qa_Assistant
 */
function qa_assistant()
{
    return Qa_Assistant::init();
}

//call the plugin
qa_assistant();
