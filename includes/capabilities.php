<?php

namespace QaAssistant;

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Manage custom capabilities for QA Assistant
 */
class Capabilities
{
    /**
     * Add custom capabilities to the administrator role.
     * Called on plugin activation.
     */
    public static function add_capabilities()
    {
        $role = get_role('administrator');
        if ($role) {
            $role->add_cap('switch_git_branch');
        }
    }

    /**
     * Remove custom capabilities from the administrator role.
     * Called on plugin deactivation.
     */
    public static function remove_capabilities()
    {
        $role = get_role('administrator');
        if ($role) {
            $role->remove_cap('switch_git_branch');
        }
    }
}
