<?php
define('WP_USE_THEMES', false);
require_once('../../../wp-load.php');
require_once('../../../wp-admin/includes/admin.php');

$admins = get_users(['role' => 'administrator']);
wp_set_current_user($admins[0]->ID);

ob_start();
// Output an error catcher script first
echo "<script>window.onerror = function(msg, url, lineNo, columnNo, error) { document.body.innerHTML += '<div style=\"color:red;font-size:20px;z-index:999999;position:fixed;top:0;left:0;background:white;padding:20px\">ERROR: ' + msg + ' at ' + lineNo + ':' + columnNo + '</div>'; };</script>";

do_action('admin_enqueue_scripts', 'tools_page_qa-assistant');
wp_print_scripts();

$menu = new \QaAssistant\Admin\Menu();
$menu->settings_page();

$html = ob_get_clean();
file_put_contents('test_settings_page.html', $html);
echo "HTML saved to test_settings_page.html. Length: " . strlen($html) . "\n";
