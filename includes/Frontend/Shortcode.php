<?php

namespace QaAssistant\Frontend;

// Prevent direct access
if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

/**
 * Shortcode handler class
 */
class Shortcode {

    /**
     * Initialize the class
     */
    function __construct() {
        add_shortcode( 'qa-assistant', [ $this, 'render_shortcode' ] );
    }

    /**
     * Shortcode handler class
     *
     * @param  array $atts
     * @param  string $content
     *
     * @return string
     */
    public function render_shortcode( $atts, $content = '' ) {
        wp_enqueue_script( 'qa-assistant-script' );
        wp_enqueue_style( 'qa-assistant-style' );

        return '<div class="qa-assistant-shortcode">Hello from Shortcode</div>';
    }
}
