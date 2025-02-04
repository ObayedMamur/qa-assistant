<?php
/*
Plugin Name: QA Assistant
Plugin URI: https://obayedmamur.com/qa-assistant
Description: A Tool for all the SQA Engineers to help them with Software Quality Assurance.
Version: 1.0.0
Author: Obayed Mamur
Author URI: https://obayedmamur.com
License: GPLv3
*/

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

require_once __DIR__ . '/vendor/autoload.php';

/**
 * The main plugin class
 */
final class Qa_Assistant {

    /**
     * Plugin version
     *
     * @var string
     */
    const version = '1.0.0';
    protected $git;

    /**
     * Class construcotr
     */
    private function __construct() {
        $this->define_constants();

        $this->git = new CzProject\GitPhp\Git;

        register_activation_hook( __FILE__, [ $this, 'activate' ] );

        add_action( 'plugins_loaded', [ $this, 'init_plugin' ] );
        
        add_action('admin_bar_menu', [ $this, 'add_git_branch_to_admin_bar' ], 100);
    }

    /**
     * Initialize a singleton instance
     *
     * @return \Qa_Assistant
     */
    public static function init() {
        static $instance = false;

        if ( ! $instance ) {
            $instance = new self();
        }

        return $instance;
    }

    /**
     * Define the required plugin constants
     *
     * @return void
     */
    public function define_constants() {
        define( 'QA_ASSISTANT_VERSION', self::version );
        define( 'QA_ASSISTANT_FILE', __FILE__ );
        define( 'QA_ASSISTANT_PATH', __DIR__ );
        define( 'QA_ASSISTANT_PLUGIN_DIR_PATH', plugin_dir_path( QA_ASSISTANT_FILE ) );
        define( 'QA_ASSISTANT_URL', plugins_url( '', QA_ASSISTANT_FILE ) );
        define( 'QA_ASSISTANT_ASSETS', QA_ASSISTANT_URL . '/assets' );
    }

    /**
     * Initialize the plugin
     *
     * @return void
     */
    public function init_plugin() {

        new QaAssistant\Assets();

        if ( defined( 'DOING_AJAX' ) && DOING_AJAX ) {
            new QaAssistant\Ajax();
        }

        if ( is_admin() ) {
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
    public function activate() {
        $installer = new QaAssistant\Installer();
        $installer->run();
    }

    // Show Git branches of plugin directories in WP Admin Bar
    public function get_git_branch($path) {
        $git_head_file = $path . '/.git/HEAD';
        if (file_exists($git_head_file)) {
            // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
            $contents = file_get_contents($git_head_file);
            if (strpos($contents, 'ref:') === 0) {
                return trim(str_replace('ref: refs/heads/', '', $contents));
            }
        }
        return 'Unknown branch';
    }

    public function add_git_branch_to_admin_bar($wp_admin_bar) {
        // List of plugin directories with their aliases and custom colors
        $qa_assistant_settings = get_option( 'qa_assistant_settings' );

        $qa_assistant_settings = maybe_unserialize($qa_assistant_settings);

        if ( ! is_array( $qa_assistant_settings ) ) {
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
            $branch = $this->get_git_branch($path);

            // create repo object
            $repo = $this->git->open($path);
            // gets name of current branch
            $branches = $repo->getBranches();
            
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
                    'title' => $alias . ' (<span style="color: ' . $color . ';">' . $branch . '</span>)',
                    'href'  => '',
                    'parent' => 'git_branches',
                    'meta' => array('class' => 'qa_assistant_git-branch'),
                ));
                foreach ($branches as $branch) {
                    $wp_admin_bar->add_node(array(
                        'id'    => 'git_branch_' . sanitize_title($plugin_dir) . '_' . sanitize_title($branch),
                        'title' => $branch,
                        'href'  => '',
                        'parent' => 'git_branch_' . sanitize_title($plugin_dir),
                        'data-branch' => esc_attr($branch),
                        'meta' => array(
                            'class' => 'qa_assistant_git-branch-list-items',
                            // 'onclick' => 'alert("Branch: ' . $branch . '")',
                        ),
                    ));
                }
            } else {
                $wp_admin_bar->add_node(array(
                    'id'    => 'git_branch_' . sanitize_title($plugin_dir),
                    'title' => $alias . ' (<span style="color: ' . $color . ';">' . $branch . '</span>)',
                    'href'  => '',
                    'meta' => array('class' => 'qa_assistant_git-branch'),
                ));
                // $wp_admin_bar->add_node(array(
                //     'id'    => 'branches_1',
                //     'title' => 'Branch 1',
                //     'href'  => '',
                //     'parent' => 'git_branch_' . sanitize_title($plugin_dir),
                // ));
                foreach ($branches as $branch) {
                    $wp_admin_bar->add_node(array(
                        'id'    => 'git_branch_' . sanitize_title($plugin_dir) . '_' . sanitize_title($branch),
                        'title' => $branch,
                        'href'  => '',
                        'parent' => 'git_branch_' . sanitize_title($plugin_dir),
                        'meta' => array(
                            'class' => 'qa_assistant_git-branch-list-items', 
                            // 'onclick' => 'alert("Branch: ' . $branch . '")',
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
function qa_assistant() {
    return Qa_Assistant::init();
}

//call the plugin
qa_assistant();
