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
}
