<div class="wrap">

    <h1><?php esc_html_e('QA Assistant Settings', 'qa-assistant'); ?></h1>
    
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
                            <?php esc_html_e('Select Your Plugins:', 'qa-assistant'); ?>
                        </p>

                        <select class="qa-assistant-select2" id="qa-assistant__plugins-dropdown" name="qa_assistant_plugins[]" aria-describedby="qa-assistant__description" multiple="multiple">
                            <?php if (1 !== count($available_plugins)) { ?>
                                <option value="" disabled><?php esc_html_e('Select Plugin', 'qa-assistant'); ?></option>
                            <?php } ?>
                            <?php foreach ($available_plugins as $plugin_basename => $available_plugin) { ?>
                                <?php $plugin_basename = explode('/', $plugin_basename)[0]; ?>
                                <option value="<?php echo esc_attr($plugin_basename); ?>" <?php selected($selected_plugin_basename, $plugin_basename); ?>>
                                    <?php echo esc_html($available_plugin['Name']); ?>
                                </option>
                            <?php } ?>
                        </select>

                        <input type="submit" value="<?php esc_attr_e('Save', 'qa-assistant'); ?>" id="qa-assistant__submit" class="qa-assistant-settings-save button button-primary" />
                        <span id="qa-assistant__spinner" class="spinner" style="float: none;"></span>
                    </form>

                <?php } else { ?>

                    <h2><?php esc_html_e('No plugins available.', 'qa-assistant'); ?></h2>

                <?php } ?>
            </div>
        </div>

    </div>

</div>