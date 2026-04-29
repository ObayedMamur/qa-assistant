<?php

namespace QaAssistant;

// Prevent direct access
if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

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
    public function add_version()
    {
        $installed = get_option('qa_assistant_installed');

        if (!$installed) {
            update_option('qa_assistant_installed', time());
        }

        $stored_version = get_option('qa_assistant_version', '0.0.0');

        // Version-gated migration: convert legacy serialized settings string to plain array.
        // Only runs when upgrading from a version that used maybe_serialize().
        if (version_compare($stored_version, QA_ASSISTANT_VERSION, '<')) {
            $existing = get_option('qa_assistant_settings', []);
            if (is_string($existing)) {
                $decoded = maybe_unserialize($existing);
                if (is_array($decoded)) {
                    update_option('qa_assistant_settings', $decoded);
                }
            }
        }

        update_option('qa_assistant_version', QA_ASSISTANT_VERSION);
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
