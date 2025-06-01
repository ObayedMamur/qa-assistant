<div class="wrap">

    <h1><?php esc_html_e('QA Assistant', 'qa-assistant'); ?></h1>
    
    <div class="qa-assistant-content">

        <h1>Settings</h1>
        <div class="qa-assistant-tabs" id="settingsTab" role="tablist">
            <div class="qa-assistant-tab-item">
                <a class="qa-assistant-tab-link active" id="git-settings-tab" data-tab="git-settings-tab" href="#git-settings-tab" role="tab" aria-controls="git-settings-tab" aria-selected="true">Git Settings</a>
            </div>
        </div>

        <div class="qa-assistant-tab-content" id="settingsTabContent">
            <div class="qa-assistant-tab-pane active" id="git-settings-tab" role="tabpanel" aria-labelledby="git-settings-tab">
                <?php if (! empty($available_plugins)) { ?>

                    <form method="post" action="<?php echo esc_url('#'); ?>" class="qa-assistant-form">
                        <?php wp_nonce_field('qa_assistant_settings_form_action', 'qa_assistant_settings_form_nonce'); ?>

                        <h2>
                            <label class="title" for="qa-assistant__plugins-dropdown">
                                <?php esc_html_e('Git Branch Display', 'qa-assistant'); ?>
                            </label>
                        </h2>

                        <p id="qa-assistant__description">
                            <?php esc_html_e('Select plugins to display Git branch information in the admin bar. You can switch between branches directly from the admin bar with GitHub Desktop-like functionality.', 'qa-assistant'); ?>
                        </p>

                        <div class="qa-assistant-feature-info">
                            <h3>✨ Enhanced Features:</h3>
                            <ul>
                                <li>🔄 <strong>One-click branch switching</strong> - Switch branches directly from the admin bar</li>
                                <li>✅ <strong>Current branch indicator</strong> - See which branch you're currently on</li>
                                <li>⚠️ <strong>Uncommitted changes detection</strong> - Get warnings before switching with unsaved changes</li>
                                <li>🔒 <strong>Force switch option</strong> - Option to discard local changes when switching</li>
                                <li>📢 <strong>Real-time notifications</strong> - Get instant feedback on Git operations</li>
                                <li>🎨 <strong>Visual status indicators</strong> - Color-coded branch status in the admin bar</li>
                            </ul>
                        </div>

                        <select class="qa-assistant-select2" id="qa-assistant__plugins-dropdown" name="qa_assistant_plugins[]" aria-describedby="qa-assistant__description" multiple="multiple">
                            <?php if (1 !== count($available_plugins)) { ?>
                                <option value="" disabled><?php esc_html_e('Select Plugin', 'qa-assistant'); ?></option>
                            <?php } ?>
                            <?php foreach ($available_plugins as $plugin_basename => $available_plugin) { ?>
                                <?php $plugin_dir = explode('/', $plugin_basename)[0]; ?>
                                <option value="<?php echo esc_attr($plugin_dir); ?>" <?php echo in_array($plugin_dir, $selected_plugins) ? 'selected' : ''; ?>>
                                    <?php echo esc_html($available_plugin['Name']); ?>
                                </option>
                            <?php } ?>
                        </select>

                        <input type="submit" value="<?php esc_attr_e('Save', 'qa-assistant'); ?>" id="qa-assistant__submit" class="qa-assistant-settings-save button button-primary" />
                        <span id="qa-assistant__spinner" class="spinner" style="float: none;"></span>
                    </form>

                    <?php
                    // Show currently selected plugins
                    $current_settings = maybe_unserialize(get_option('qa_assistant_settings', array()));
                    if (!empty($current_settings['selected_plugins'])) {
                        ?>
                        <div class="qa-assistant-selected-plugins">
                            <h3><?php esc_html_e('Currently Selected Plugins', 'qa-assistant'); ?></h3>
                            <div class="qa-selected-plugins-grid">
                                <?php
                                foreach ($current_settings['selected_plugins'] as $plugin_dir) {
                                    // Find the plugin name from available plugins
                                    $plugin_name = $plugin_dir;
                                    foreach ($available_plugins as $plugin_basename => $plugin_data) {
                                        if (strpos($plugin_basename, $plugin_dir . '/') === 0) {
                                            $plugin_name = $plugin_data['Name'];
                                            break;
                                        }
                                    }

                                    // Check Git status
                                    $plugin_path = WP_PLUGIN_DIR . '/' . $plugin_dir;
                                    $is_git_repo = is_dir($plugin_path . '/.git');
                                    $current_branch = '';
                                    $git_status = 'Not a Git repository';
                                    $status_class = 'no-git';

                                    if ($is_git_repo) {
                                        $git_head_file = $plugin_path . '/.git/HEAD';
                                        if (file_exists($git_head_file)) {
                                            $contents = file_get_contents($git_head_file);
                                            if (strpos($contents, 'ref:') === 0) {
                                                $current_branch = trim(str_replace('ref: refs/heads/', '', $contents));
                                                $git_status = 'Branch: ' . $current_branch;
                                                $status_class = 'has-git';
                                            }
                                        }
                                    }
                                    ?>
                                    <div class="qa-plugin-card <?php echo esc_attr($status_class); ?>">
                                        <div class="qa-plugin-header">
                                            <h4><?php echo esc_html($plugin_name); ?></h4>
                                            <span class="qa-plugin-dir"><?php echo esc_html($plugin_dir); ?></span>
                                        </div>
                                        <div class="qa-plugin-status">
                                            <span class="qa-git-status <?php echo esc_attr($status_class); ?>">
                                                <?php if ($is_git_repo): ?>
                                                    <span class="dashicons dashicons-admin-tools"></span>
                                                <?php else: ?>
                                                    <span class="dashicons dashicons-warning"></span>
                                                <?php endif; ?>
                                                <?php echo esc_html($git_status); ?>
                                            </span>
                                        </div>
                                    </div>
                                    <?php
                                }
                                ?>
                            </div>
                        </div>
                        <?php
                    }
                    ?>

                <?php } else { ?>

                    <h2><?php esc_html_e('No plugins available.', 'qa-assistant'); ?></h2>

                <?php } ?>
            </div>
        </div>

    </div>

</div>