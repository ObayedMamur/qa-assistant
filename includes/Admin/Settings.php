<?php

namespace QaAssistant\Admin;

/**
 * The settings class
 */
class Settings {

    /**
     * Initialize the class
     */
    function __construct() {
        
    }
    
    public function get_available_plugins() {
        $available_plugins = get_plugins();

        if ( empty( $available_plugins ) ) {
            return array();
        }

        return $available_plugins;
    }

    public function save_settings( $selected_plugins ) {
        $settings = maybe_unserialize( get_option( 'qa_assistant_settings', array() ) );

        if ( is_array( $selected_plugins ) && count( $selected_plugins ) ) {
            $selected_plugins = array_map( 'sanitize_text_field', $selected_plugins ); // already did this in the settings_page method
        } else {
            $selected_plugins = array();
        }

        $settings['selected_plugins'] = $selected_plugins;

        update_option( 'qa_assistant_settings', maybe_serialize( $settings ) );
        // Reload the page after saving
        if (isset($_SERVER['REQUEST_URI'])) {
            wp_safe_redirect( esc_url_raw(wp_unslash($_SERVER['REQUEST_URI'])) );
            exit;
        }
    }
}
