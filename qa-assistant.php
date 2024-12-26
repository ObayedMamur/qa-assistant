<?php
/*
Plugin Name: QA Assistant - A Tool for all the SQA Engineers to help them with Software Quality Assurance
Plugin URI: https://obayedmamur.com/qa-assistant
Description: A plugin to assist with QA tasks.
Version: 1.0.0
Author: Obayed Mamur
Author URI: https://obayedmamur.com
License: GPLv3
*/

// Prevent direct access to the file
if (!defined('ABSPATH')) {
    exit;
}

// Plugin activation hook
function qa_assistant_activate() {
    // Code to execute on plugin activation
}
register_activation_hook(__FILE__, 'qa_assistant_activate');

// Plugin deactivation hook
function qa_assistant_deactivate() {
    // Code to execute on plugin deactivation
}
register_deactivation_hook(__FILE__, 'qa_assistant_deactivate');

// Main plugin function
function qa_assistant_init() {
    // Code to initialize the plugin
}
add_action('init', 'qa_assistant_init');

// Show Git branches of plugin directories in WP Admin Bar
function get_git_branch($path) {
    $git_head_file = $path . '/.git/HEAD';
    if (file_exists($git_head_file)) {
        // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
        $contents = file_get_contents($git_head_file);
        if (strpos($contents, 'ref:') === 0) {
            return trim(str_replace('ref: refs/heads/', '', $contents));
        }
    }
    return 'Unknown branch';
}

function add_git_branch_to_admin_bar($wp_admin_bar) {
    // List of plugin directories with their aliases and custom colors
    $plugin_dirs = array(
        'essential-addons-for-elementor-lite' => array('alias' => 'EA-Lite', 'color' => '#33ff57'),
        'essential-addons-elementor' => array('alias' => 'EA-Pro', 'color' => '#33ff57'),
        // Add more plugins here with custom aliases and colors
    );

    foreach ($plugin_dirs as $plugin_dir => $settings) {
        $path = WP_PLUGIN_DIR . '/' . $plugin_dir;
        $branch = get_git_branch($path);
        
        // Use alias or plugin directory name if alias is not provided
        $alias = isset($settings['alias']) ? $settings['alias'] : $plugin_dir;
        
        // Use custom color or generate a random one if not provided
        $color = isset($settings['color']) ? $settings['color'] : '#' . dechex(wp_rand(0x000000, 0xFFFFFF));

        // Add node to the admin bar
        $wp_admin_bar->add_node(array(
            'id'    => 'git_branch_' . sanitize_title($plugin_dir),
            'title' => $alias . ' (Branch: <span style="color: ' . $color . ';">' . $branch . '</span>)',
            'href'  => '',
        ));
    }
}

add_action('admin_bar_menu', 'add_git_branch_to_admin_bar', 100);

// End of Plugin Directory Git Branch Show