<?php

namespace QaAssistant;

/**
 * Assets handler class
 */
class Assets {

    /**
     * Class constructor
     */
    function __construct() {
        add_action( 'wp_enqueue_scripts', [ $this, 'register_assets' ] );
        add_action( 'admin_enqueue_scripts', [ $this, 'register_assets' ] );
    }

    /**
     * All available scripts
     *
     * @return array
     */
    public function get_scripts() {
        return [
            'qa-assistant-script' => [
                'src'     => QA_ASSISTANT_ASSETS . '/js/frontend.js',
                'version' => filemtime( QA_ASSISTANT_PATH . '/assets/js/frontend.js' ),
                'deps'    => [ 'jquery' ]
            ],
            'qa-assistant-admin-script' => [
                'src'     => QA_ASSISTANT_ASSETS . '/js/admin.js',
                'version' => filemtime( QA_ASSISTANT_PATH . '/assets/js/admin.js' ),
                'deps'    => [ 'jquery', 'wp-util' ]
            ],
            'qa-assistant-select2-script' => [
                'src'     => QA_ASSISTANT_ASSETS . '/js/select2.min.js',
                'version' => filemtime( QA_ASSISTANT_PATH . '/assets/js/select2.min.js' ),
                'deps'    => [ 'jquery' ]
            ],
            // 'qa-assistant-bootstrap-script' => [
            //     'src'     => QA_ASSISTANT_ASSETS . '/js/bootstrap.min.js',
            //     'version' => filemtime( QA_ASSISTANT_PATH . '/assets/js/bootstrap.min.js' ),
            //     'deps'    => [ 'jquery']
            // ],
            // 'qa-assistant-jquery-slim-script' => [
            //     'src'     => QA_ASSISTANT_ASSETS . '/js/jquery-3.7.1.slim.min.js',
            //     'version' => filemtime( QA_ASSISTANT_PATH . '/assets/js/jquery-3.7.1.slim.min.js' ),
            //     'deps'    => [ 'jquery']
            // ],
            // 'qa-assistant-popper-js-script' => [
            //     'src'     => QA_ASSISTANT_ASSETS . '/js/popper.min.js',
            //     'version' => filemtime( QA_ASSISTANT_PATH . '/assets/js/popper.min.js' ),
            //     'deps'    => [ 'jquery']
            // ],
        ];
    }

    /**
     * All available styles
     *
     * @return array
     */
    public function get_styles() {
        return [
            'qa-assistant-style' => [
                'src'     => QA_ASSISTANT_ASSETS . '/css/frontend.css',
                'version' => filemtime( QA_ASSISTANT_PATH . '/assets/css/frontend.css' )
            ],
            'qa-assistant-admin-style' => [
                'src'     => QA_ASSISTANT_ASSETS . '/css/admin.css',
                'version' => filemtime( QA_ASSISTANT_PATH . '/assets/css/admin.css' )
            ],
            'qa-assistant-select2-style' => [
                'src'     => QA_ASSISTANT_ASSETS . '/css/select2.min.css',
                'version' => filemtime( QA_ASSISTANT_PATH . '/assets/css/select2.min.css' )
            ],
            // 'qa-assistant-bootstrap-style' => [
            //     'src'     => QA_ASSISTANT_ASSETS . '/css/bootstrap.min.css',
            //     'version' => filemtime( QA_ASSISTANT_PATH . '/assets/css/bootstrap.min.css' )
            // ],
        ];
    }

    /**
     * Register scripts and styles
     *
     * @return void
     */
    public function register_assets() {
        $scripts = $this->get_scripts();
        $styles  = $this->get_styles();

        foreach ( $scripts as $handle => $script ) {
            $deps = isset( $script['deps'] ) ? $script['deps'] : false;

            wp_enqueue_script( $handle, $script['src'], $deps, $script['version'], true );
        }

        foreach ( $styles as $handle => $style ) {
            $deps = isset( $style['deps'] ) ? $style['deps'] : false;

            wp_enqueue_style( $handle, $style['src'], $deps, $style['version'] );
        }

        wp_localize_script( 'qa-assistant-admin-script', 'qaAssistant', [
            'nonce' => wp_create_nonce( 'qa-assistant-admin-nonce' ),
            'confirm' => __( 'Are you sure?', 'qa-assistant' ),
            'error' => __( 'Something went wrong', 'qa-assistant' ),
            'ajaxUrl' => admin_url('admin-ajax.php'),
        ] );
    }
}
