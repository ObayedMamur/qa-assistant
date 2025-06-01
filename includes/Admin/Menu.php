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
        $settings = new Settings();

        wp_enqueue_style( 'qa-assistant-select2-style' );
        wp_enqueue_script( 'qa-assistant-select2-script' );
        wp_enqueue_style( 'qa-assistant-bootstrap-style' );
        wp_enqueue_script( 'qa-assistant-bootstrap-script' );
        wp_enqueue_script( 'qa-assistant-popper-js-script' );
        wp_enqueue_script( 'qa-assistant-jquery-slim-script' );

        $available_plugins = $settings->get_available_plugins();
		$selected_plugin_basename = filter_input( INPUT_GET, 'plugin', FILTER_SANITIZE_FULL_SPECIAL_CHARS );

		// Get currently selected plugins for the dropdown
		$current_settings = maybe_unserialize(get_option('qa_assistant_settings', array()));
		$selected_plugins = isset($current_settings['selected_plugins']) ? $current_settings['selected_plugins'] : array();

        // Save settings data
        if ( isset( $_POST['qa_assistant_settings_form_nonce'] ) && wp_verify_nonce( $_POST['qa_assistant_settings_form_nonce'], 'qa_assistant_settings_form_action' ) ) {
            // get posted data
            $selected_plugins = $_POST['qa_assistant_plugins'];

            if ( ! is_array( $selected_plugins ) ) {
                $selected_plugins = [];
            }

            // sanitize array
            $selected_plugins = array_map( 'sanitize_text_field', $selected_plugins );

            $settings->save_settings( $selected_plugins);
        }

		require QA_ASSISTANT_PLUGIN_DIR_PATH . 'templates/settings-page.php';
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
