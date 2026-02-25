/**
 * AJAX API wrapper for Git Branches Drawer.
 * Uses native fetch() — no jQuery dependency.
 * All requests include nonce from wp_localize_script.
 */

const getConfig = () => {
    const cfg = window.qaGitDrawer || {};
    return {
        ajaxUrl: cfg.ajaxUrl || '/wp-admin/admin-ajax.php',
        nonce: cfg.nonce || '',
    };
};

const post = async (action, data = {}) => {
    const { ajaxUrl, nonce } = getConfig();
    const body = new FormData();
    body.append('action', action);
    body.append('nonce', nonce);

    Object.entries(data).forEach(([key, value]) => {
        body.append(key, value);
    });

    const response = await fetch(ajaxUrl, { method: 'POST', body });
    const json = await response.json();
    return json;
};

export const fetchRepositories = () => post('qa_assistant_get_repositories');
export const fetchBranches = (pluginDir) => post('qa_assistant_get_branches', { plugin_dir: pluginDir });
export const switchBranch = (pluginDir, branch, force = false) =>
    post('qa_assistant_switch_branch', { plugin_dir: pluginDir, branch, force: force ? '1' : '0' });
export const pullRepo = (pluginDir) => post('qa_assistant_pull_branch', { plugin_dir: pluginDir });
export const fetchRepo = (pluginDir) => post('qa_assistant_refresh_branches', { plugin_dir: pluginDir });
export const stashChanges = (pluginDir) => post('qa_assistant_stash_changes', { plugin_dir: pluginDir });
export const commitChanges = (pluginDir, message) =>
    post('qa_assistant_commit_changes', { plugin_dir: pluginDir, commit_message: message });
