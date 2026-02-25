<?php
/*
Plugin Name: QA Assistant
Plugin URI: https://obayedmamur.com/qa-assistant
Description: A comprehensive tool for SQA Engineers with GitHub Desktop-like Git branch switching functionality.
Version: 2.0.0
Author: Obayed Mamur
Author URI: https://obayedmamur.com
License: GPLv3
*/

if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('QA_ASSISTANT_VERSION', '2.0.0');
define('QA_ASSISTANT_PLUGIN_FILE', __FILE__);
define('QA_ASSISTANT_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('QA_ASSISTANT_PLUGIN_URL', plugin_dir_url(__FILE__));
define('QA_ASSISTANT_PLUGIN_BASENAME', plugin_basename(__FILE__));

/**
 * Get the absolute path to a plugin directory using WordPress best practices
 *
 * @param string $plugin_dir The plugin directory name
 * @return string The absolute path to the plugin directory
 */
// phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedFunctionFound -- Uses 'qa_assistant' prefix matching the plugin slug.
function qa_assistant_get_plugin_path($plugin_dir)
{
    // Use WordPress function to get plugins directory
    $plugins_dir = dirname(plugin_dir_path(__FILE__));
    return trailingslashit($plugins_dir) . $plugin_dir;
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

        // Add "Settings" link to plugin action links on the Plugins page
        add_filter('plugin_action_links_' . QA_ASSISTANT_PLUGIN_BASENAME, [$this, 'plugin_action_links']);


    }

    /**
     * Initialize a singleton instance
     *
     * @return \Qa_Assistant
     */
    public static function init()
    {
        static $instance = false;

        if (!$instance) {
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
        // QA_ASSISTANT_VERSION is already defined at the top of the file
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

        // Initialize Admin Bar
        if (is_user_logged_in()) {
            new QaAssistant\Admin\AdminBar();
        }

        new QaAssistant\API();
    }

    /**
     * Add "Settings" link to plugin action links
     *
     * @param array $links Existing plugin action links
     * @return array Modified plugin action links
     */
    public function plugin_action_links($links)
    {
        $settings_link = '<a href="' . admin_url('tools.php?page=qa-assistant') . '">Settings</a>';
        array_unshift($links, $settings_link);
        return $links;
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
     * Get current Git branch for a given path
     *
     * @param string $path Repository path
     * @param bool $force_refresh Whether to bypass cache and fetch fresh data
     * @return string|false Current branch name or false on failure
     */
    public function get_git_branch($path, $force_refresh = false)
    {
        return $this->gitManager->getCurrentBranch($path, $force_refresh);
    }
}

/**
 * Initializes the main plugin
 *
 * @return \Qa_Assistant
 */
// phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedFunctionFound -- Uses 'qa_assistant' prefix matching the plugin slug.
function qa_assistant()
{
    return Qa_Assistant::init();
}

// Call the plugin
qa_assistant();

// Test uncommitted change for git pull modal
