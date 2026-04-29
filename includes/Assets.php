<?php

namespace QaAssistant;

// Prevent direct access
if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

/**
 * Assets handler class
 */
class Assets
{

    /**
     * Class constructor
     */
    function __construct()
    {
        add_action('wp_enqueue_scripts', [$this, 'register_assets']);
        add_action('admin_enqueue_scripts', [$this, 'register_assets']);
        // Enqueue dashboard assets specifically for the settings page
        add_action('admin_enqueue_scripts', [$this, 'register_dashboard_assets']);
        // Enqueue admin bar assets on frontend if admin bar is showing
        add_action('wp_enqueue_scripts', [$this, 'enqueue_admin_bar_assets']);
        // Enqueue Git Branches drawer React app (admin + frontend)
        add_action('admin_enqueue_scripts', [$this, 'register_drawer_assets']);
        add_action('wp_enqueue_scripts', [$this, 'register_drawer_assets']);
    }

    /**
     * Return a cache-busting version string for an asset file.
     * Uses the plugin version constant in production to avoid syscalls.
     * Falls back to filemtime() in WP_DEBUG mode for local development.
     *
     * @param string $file_path Absolute path to the asset file
     * @return string Version string
     */
    private function get_asset_version(string $file_path): string
    {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            return (string) @filemtime($file_path);
        }
        return QA_ASSISTANT_VERSION;
    }

    /**
     * All available scripts
     *
     * @return array
     */
    public function get_scripts()
    {
        return [
            'qa-assistant-script' => [
                'src'     => QA_ASSISTANT_ASSETS . '/js/frontend.js',
                'version' => $this->get_asset_version(QA_ASSISTANT_PATH . '/assets/js/frontend.js'),
                'deps'    => ['jquery']
            ],
            'qa-assistant-admin-script' => [
                'src'     => QA_ASSISTANT_ASSETS . '/js/admin.js',
                'version' => $this->get_asset_version(QA_ASSISTANT_PATH . '/assets/js/admin.js'),
                'deps'    => ['jquery', 'wp-util']
            ],
            'qa-assistant-select2-script' => [
                'src'     => QA_ASSISTANT_ASSETS . '/js/select2.min.js',
                'version' => $this->get_asset_version(QA_ASSISTANT_PATH . '/assets/js/select2.min.js'),
                'deps'    => ['jquery']
            ],
        ];
    }

    /**
     * All available styles
     *
     * @return array
     */
    public function get_styles()
    {
        return [
            'qa-assistant-style' => [
                'src'     => QA_ASSISTANT_ASSETS . '/css/frontend.css',
                'version' => $this->get_asset_version(QA_ASSISTANT_PATH . '/assets/css/frontend.css')
            ],
            'qa-assistant-admin-style' => [
                'src'     => QA_ASSISTANT_ASSETS . '/css/admin.css',
                'version' => $this->get_asset_version(QA_ASSISTANT_PATH . '/assets/css/admin.css')
            ],
            'qa-assistant-select2-style' => [
                'src'     => QA_ASSISTANT_ASSETS . '/css/select2.min.css',
                'version' => $this->get_asset_version(QA_ASSISTANT_PATH . '/assets/css/select2.min.css')
            ],
        ];
    }

    /**
     * Register scripts and styles
     *
     * @return void
     */
    public function register_assets()
    {
        $scripts = $this->get_scripts();
        $styles = $this->get_styles();

        // Load admin assets only in admin area
        if (is_admin()) {
            foreach ($scripts as $handle => $script) {
                if (strpos($handle, 'admin') !== false || strpos($handle, 'select2') !== false) {
                    $deps = isset($script['deps']) ? $script['deps'] : false;
                    wp_enqueue_script($handle, $script['src'], $deps, $script['version'], true);
                }
            }

            foreach ($styles as $handle => $style) {
                if (strpos($handle, 'admin') !== false || strpos($handle, 'select2') !== false) {
                    $deps = isset($style['deps']) ? $style['deps'] : false;
                    wp_enqueue_style($handle, $style['src'], $deps, $style['version']);
                }
            }

            wp_localize_script('qa-assistant-admin-script', 'qaAssistant', [
                'nonce' => wp_create_nonce('qa-assistant-admin-nonce'),
                'confirm' => __('Are you sure?', 'qa-assistant'),
                'error' => __('Something went wrong', 'qa-assistant'),
                'ajaxUrl' => admin_url('admin-ajax.php'),
            ]);
        }

        // Load frontend assets only if needed (adjust condition as necessary)
        if (!is_admin()) {
            foreach ($scripts as $handle => $script) {
                if (strpos($handle, 'frontend') !== false) {
                    $deps = isset($script['deps']) ? $script['deps'] : false;
                    wp_enqueue_script($handle, $script['src'], $deps, $script['version'], true);
                }
            }

            foreach ($styles as $handle => $style) {
                if (strpos($handle, 'frontend') !== false) {
                    $deps = isset($style['deps']) ? $style['deps'] : false;
                    wp_enqueue_style($handle, $style['src'], $deps, $style['version']);
                }
            }
        }
    }

    /**
     * Enqueue admin bar dropdown assets on frontend if admin bar is showing
     */
    public function enqueue_admin_bar_assets()
    {
        if (!is_admin() && is_admin_bar_showing()) {
            // Enqueue styles/scripts needed for the admin bar dropdown
            wp_enqueue_style('qa-assistant-admin-style', QA_ASSISTANT_ASSETS . '/css/admin.css', [], $this->get_asset_version(QA_ASSISTANT_PATH . '/assets/css/admin.css'));
            wp_enqueue_style('qa-assistant-select2-style', QA_ASSISTANT_ASSETS . '/css/select2.min.css', [], $this->get_asset_version(QA_ASSISTANT_PATH . '/assets/css/select2.min.css'));
            wp_enqueue_script('qa-assistant-select2-script', QA_ASSISTANT_ASSETS . '/js/select2.min.js', ['jquery'], $this->get_asset_version(QA_ASSISTANT_PATH . '/assets/js/select2.min.js'), true);
            wp_enqueue_script('qa-assistant-admin-script', QA_ASSISTANT_ASSETS . '/js/admin.js', ['jquery', 'wp-util'], $this->get_asset_version(QA_ASSISTANT_PATH . '/assets/js/admin.js'), true);
            // Localize script for AJAX and nonce
            wp_localize_script('qa-assistant-admin-script', 'qaAssistant', [
                'nonce'   => wp_create_nonce('qa-assistant-admin-nonce'),
                'confirm' => __('Are you sure?', 'qa-assistant'),
                'error'   => __('Something went wrong', 'qa-assistant'),
                'ajaxUrl' => admin_url('admin-ajax.php'),
            ]);
        }
    }

    /**
     * Register React Dashboard assets
     */
    /**
     * Register React Dashboard assets
     * 
     * @param string $hook Current admin page hook
     */
    public function register_dashboard_assets($hook)
    {
        // Only load on QA Assistant page.
        // WordPress generates 'admin_page_{slug}' for submenus added under tools.php,
        // not 'tools_page_{slug}'.
        if ($hook !== 'admin_page_qa-assistant') {
            return;
        }

        $build_dir = QA_ASSISTANT_PATH . '/build';
        $build_url = QA_ASSISTANT_URL . '/build';

        if (!file_exists($build_dir . '/index.asset.php')) {
            return;
        }

        $asset_file = include $build_dir . '/index.asset.php';

        wp_enqueue_script(
            'qa-assistant-dashboard',
            $build_url . '/index.js',
            $asset_file['dependencies'],
            $asset_file['version'],
            true
        );

        wp_enqueue_style(
            'qa-assistant-dashboard-style',
            $build_url . '/index.css',
            [],
            $asset_file['version']
        );

        // Localize script with server-side data
        wp_localize_script('qa-assistant-dashboard', 'qaAssistantData', [
            'nonce' => wp_create_nonce('qa-assistant-admin-nonce'),
            'clone_nonce' => wp_create_nonce('qa_assistant_clone_repo'),
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'pluginUrl' => QA_ASSISTANT_PLUGIN_URL,
        ]);
    }

    /**
     * Register Git Branches Drawer React assets.
     * Loads on both admin and frontend when admin bar is visible.
     */
    public function register_drawer_assets()
    {
        // Only load for logged-in users with proper capabilities
        if (!is_user_logged_in() || !current_user_can('manage_options')) {
            return;
        }

        // On frontend, only load if admin bar is showing
        if (!is_admin() && !is_admin_bar_showing()) {
            return;
        }

        $build_dir = QA_ASSISTANT_PATH . '/build/git-drawer';
        $build_url = QA_ASSISTANT_URL . '/build/git-drawer';

        if (!file_exists($build_dir . '/index.asset.php')) {
            return;
        }

        $asset_file = include $build_dir . '/index.asset.php';

        wp_enqueue_script(
            'qa-git-drawer',
            $build_url . '/index.js',
            $asset_file['dependencies'],
            $asset_file['version'],
            true
        );

        wp_enqueue_style(
            'qa-git-drawer-style',
            $build_url . '/index.css',
            [],
            $asset_file['version']
        );

        // Pass data to the drawer React app
        wp_localize_script('qa-git-drawer', 'qaGitDrawer', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('qa-assistant-admin-nonce'),
            'pluginUrl' => QA_ASSISTANT_PLUGIN_URL,
        ]);
    }
}
