<?php

namespace QaAssistant;

/**
 * Installer class
 */
class Installer {

    /**
     * Run the installer
     *
     * @return void
     */
    public function run() {
        $this->add_version();
        $this->create_tables();
    }

    /**
     * Add time and version on DB
     */
    public function add_version() {
        $installed = get_option( 'qa_assistant_installed' );

        if ( ! $installed ) {
            update_option( 'qa_assistant_installed', time() );
        }

        update_option( 'qa_assistant_version', QA_ASSISTANT_VERSION );
    }

    /**
     * Create necessary database tables
     *
     * @return void
     */
    public function create_tables() {
        //
    }
}
