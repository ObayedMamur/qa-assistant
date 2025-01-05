<?php

namespace QaAssistant\Admin;

/**
 * The Menu handler class
 */
class Menu {

    /**
     * Initialize the class
     */
    function __construct( ) {
        add_action( 'admin_menu', [ $this, 'admin_menu' ] );
    }

    /**
     * Register admin menu
     *
     * @return void
     */
    public function admin_menu() {
        $parent_slug = 'qa-assistant';
        $capability = apply_filters('qa-assistant/menu/capability', 'manage_options');

        // $hook = add_menu_page(__('Options Table', 'nhrrob-options-table-manager'), __('Options Table', 'nhrrob-options-table-manager'), $capability, $parent_slug, [$this, 'settings_page'], 'dashicons-admin-post');
        // add_submenu_page( $parent_slug, __( 'Settings', 'nhrrob-options-table-manager' ), __( 'Settings', 'nhrrob-options-table-manager' ), $capability, 'nhrotm-options-table-manager-settings', [ $this, 'settings_page' ] );
        $hook = add_submenu_page( 'tools.php', __( 'QA Assistant', 'qa-assistant' ), __( 'QA Assistant', 'qa-assistant' ), $capability, $parent_slug, [ $this, 'settings_page' ] );

        add_action('admin_head-' . $hook, [$this, 'enqueue_assets']);
    }

    /**
     * Handles the settings page
     *
     * @return void
     */
    public function settings_page() {
        _e('Settings Page Content', 'wp-plugin_template');
    }

    /**
     * Enqueue scripts and styles
     *
     * @return void
     */
    public function enqueue_assets() {
        wp_enqueue_style( 'qa-assistant-admin-style' );
        wp_enqueue_script( 'qa-assistant-admin-script' );
    }
}
