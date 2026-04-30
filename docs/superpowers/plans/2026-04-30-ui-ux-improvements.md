# QA Assistant UI/UX Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 10 UI/UX improvements to the QA Assistant plugin including branch metadata, bulk operations, keyboard shortcuts, a proper activity log tab, settings persistence, and UX polish.

**Architecture:** Pure React/PHP WordPress plugin. PHP changes go in `includes/Ajax.php` and `includes/GitManager.php`. Frontend changes go in `src/` (React + Tailwind). All changes compile to `build/` via `npm run build` run from the plugin root.

**Tech Stack:** React 18, Tailwind CSS 4, Framer Motion, Lucide React, czproject/git-php, WordPress AJAX

---

## File Map

**Modified files:**
- `includes/GitManager.php` — add `getBranchesWithMeta()`, `pullAllRepos()`, `fetchAllRepos()` methods
- `includes/Ajax.php` — update `get_branches_for_repo()`, add `pull_all_repos` and `fetch_all_repos` endpoints, add `save_performance_settings` endpoint
- `src/QAAssistantDashboard.jsx` — activity log tab, branch switcher on plugin cards, modified badge, settings save feedback, ConfirmModal for Clear Logs, collapse integrations, Cache TTL/log retention persistence
- `src/git-drawer/App.jsx` — global keyboard shortcut Ctrl+Shift+G
- `src/git-drawer/components/BranchList.jsx` — show branch age from metadata
- `src/git-drawer/components/RepositoryList.jsx` — Pull All / Fetch All buttons
- `src/git-drawer/context/DrawerContext.jsx` — branchMeta state, `doPullAll`, `doFetchAll`
- `src/git-drawer/utils/api.js` — `pullAllRepos`, `fetchAllRepos` functions

---

## Task 1: Branch metadata in PHP — `getBranchesWithMeta()`

**Files:**
- Modify: `includes/GitManager.php`

- [ ] **Step 1: Add `getBranchesWithMeta()` method to GitManager**

Open `includes/GitManager.php`. After the closing brace of `getBranches()` (around line 147), add this new method:

```php
/**
 * Get branches with last-commit metadata.
 * Returns array of ['name' => string, 'age' => int (unix timestamp of last commit)].
 *
 * @param string $path Repository path
 * @return array
 */
public function getBranchesWithMeta($path)
{
    if (!$this->isGitRepository($path)) {
        return [];
    }

    try {
        $repo = $this->git->open($path);
        // format: <branch-name>\t<unix-timestamp>
        $output = $repo->execute([
            'for-each-ref',
            '--sort=-committerdate',
            '--format=%(refname:short)\t%(committerdate:unix)',
            'refs/heads',
            'refs/remotes/origin',
        ]);

        $seen = [];
        $result = [];

        foreach ($output as $line) {
            $line = trim($line);
            if (empty($line)) continue;

            $parts = explode("\t", $line, 2);
            $name  = isset($parts[0]) ? trim($parts[0]) : '';
            $ts    = isset($parts[1]) ? (int) trim($parts[1]) : 0;

            // Strip "origin/" prefix from remote refs
            if (strpos($name, 'origin/') === 0) {
                $name = substr($name, strlen('origin/'));
            }
            if ($name === 'HEAD' || empty($name)) continue;

            // First occurrence wins (local branch before remote)
            if (!isset($seen[$name])) {
                $seen[$name] = true;
                $result[] = ['name' => sanitize_text_field($name), 'age' => $ts];
            }
        }

        return $result;
    } catch (GitException $e) {
        return [];
    }
}
```

- [ ] **Step 2: Verify PHP syntax**

```bash
cd /Users/obayed/Herd/ea/wp-content/plugins/qa-assistant && php -l includes/GitManager.php
```

Expected: `No syntax errors detected in includes/GitManager.php`

---

## Task 2: Expose branch metadata via AJAX

**Files:**
- Modify: `includes/Ajax.php`

- [ ] **Step 1: Update `get_branches_for_repo()` to return metadata**

In `includes/Ajax.php`, find the `get_branches_for_repo()` method (around line 759). Replace the entire method body's branch-fetching and response section. Currently the method calls `$this->gitManager->getBranches($path, false)`. Change it to also call `getBranchesWithMeta()` and merge:

Find this block (around line 781-799):
```php
        // Get branches without fetching from remote (fast, no blocking)
        $branches = $this->gitManager->getBranches($path, false);
        $currentBranch = $this->gitManager->getCurrentBranch($path) ?: '';

        // Check for uncommitted changes — use cached method, avoids git fetch
        $hasChanges = $this->gitManager->hasUncommittedChanges($path);

        // Get last pulled time
        $lastPulled = get_transient('qa_assistant_last_pulled_' . md5($path));

        // Sort branches: master/main → develop → current → others
        $branches = $this->sort_branches_for_drawer($branches, $currentBranch);

        wp_send_json_success([
            'branches' => array_map('sanitize_text_field', $branches),
            'currentBranch' => sanitize_text_field($currentBranch),
            'plugin_dir' => sanitize_text_field($plugin_dir),
            'hasChanges' => $hasChanges,
            'lastPulled' => $lastPulled ? intval($lastPulled) : null,
        ]);
```

Replace with:
```php
        // Get branches with metadata (name + last-commit age)
        $branchMeta = $this->gitManager->getBranchesWithMeta($path);
        $currentBranch = $this->gitManager->getCurrentBranch($path) ?: '';

        // Build plain name list for legacy sorting
        $branchNames = array_column($branchMeta, 'name');
        $branchNames = $this->sort_branches_for_drawer($branchNames, $currentBranch);

        // Re-index meta by name for O(1) lookup, preserving sorted order
        $metaByName = [];
        foreach ($branchMeta as $m) {
            $metaByName[$m['name']] = $m['age'];
        }

        // Build sorted meta array
        $sortedMeta = [];
        foreach ($branchNames as $bn) {
            $sortedMeta[] = [
                'name' => sanitize_text_field($bn),
                'age'  => isset($metaByName[$bn]) ? intval($metaByName[$bn]) : 0,
            ];
        }

        // If getBranchesWithMeta returned nothing, fall back to plain names
        if (empty($sortedMeta)) {
            $plain = $this->sort_branches_for_drawer(
                $this->gitManager->getBranches($path, false),
                $currentBranch
            );
            foreach ($plain as $bn) {
                $sortedMeta[] = ['name' => sanitize_text_field($bn), 'age' => 0];
            }
        }

        $hasChanges = $this->gitManager->hasUncommittedChanges($path);
        $lastPulled = get_transient('qa_assistant_last_pulled_' . md5($path));

        wp_send_json_success([
            'branches'      => $sortedMeta,
            'currentBranch' => sanitize_text_field($currentBranch),
            'plugin_dir'    => sanitize_text_field($plugin_dir),
            'hasChanges'    => $hasChanges,
            'lastPulled'    => $lastPulled ? intval($lastPulled) : null,
        ]);
```

- [ ] **Step 2: Add `pull_all_repos` and `fetch_all_repos` AJAX actions in the constructor**

In the `__construct()` method of `Ajax.php`, add after the last `add_action` call (around line 73):

```php
        // Bulk operations
        add_action('wp_ajax_qa_assistant_pull_all_repos',  [$this, 'pull_all_repos']);
        add_action('wp_ajax_qa_assistant_fetch_all_repos', [$this, 'fetch_all_repos']);

        // Performance settings
        add_action('wp_ajax_qa_assistant_save_performance_settings', [$this, 'save_performance_settings']);
```

- [ ] **Step 3: Add the three new handler methods to `Ajax.php`**

Add these three methods anywhere before the closing `}` of the class (e.g., after `clear_activity_logs()`):

```php
    /**
     * Pull latest changes for all monitored repositories.
     */
    public function pull_all_repos()
    {
        if (!wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['nonce'] ?? '')), 'qa-assistant-admin-nonce')) {
            wp_send_json_error(['message' => 'Security check failed.']);
        }
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Unauthorized.']);
        }

        $qa_settings = get_option('qa_assistant_settings', []);
        $qa_settings  = maybe_unserialize($qa_settings);
        $plugin_dirs  = (is_array($qa_settings) && isset($qa_settings['selected_plugins']))
            ? array_keys($qa_settings['selected_plugins']) : [];

        $results = [];
        foreach ($plugin_dirs as $slug) {
            $path = qa_assistant_get_plugin_path(sanitize_text_field($slug));
            if (!is_dir($path) || !$this->gitManager->isGitRepository($path)) {
                $results[] = ['slug' => $slug, 'success' => false, 'message' => 'Not a git repo'];
                continue;
            }
            $res = $this->gitManager->pullCurrentBranch($path);
            if ($res['success']) {
                set_transient('qa_assistant_last_pulled_' . md5($path), time(), DAY_IN_SECONDS);
                $this->log_activity('pull', $slug, $res['branch'], 'success', 'Pulled latest changes');
            }
            $results[] = [
                'slug'    => sanitize_text_field($slug),
                'success' => $res['success'],
                'branch'  => sanitize_text_field($res['branch'] ?? ''),
                'message' => sanitize_text_field($res['message'] ?? $res['error'] ?? ''),
            ];
        }

        wp_send_json_success(['results' => $results]);
    }

    /**
     * Fetch all branches for all monitored repositories.
     */
    public function fetch_all_repos()
    {
        if (!wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['nonce'] ?? '')), 'qa-assistant-admin-nonce')) {
            wp_send_json_error(['message' => 'Security check failed.']);
        }
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Unauthorized.']);
        }

        $qa_settings = get_option('qa_assistant_settings', []);
        $qa_settings  = maybe_unserialize($qa_settings);
        $plugin_dirs  = (is_array($qa_settings) && isset($qa_settings['selected_plugins']))
            ? array_keys($qa_settings['selected_plugins']) : [];

        $results = [];
        foreach ($plugin_dirs as $slug) {
            $path = qa_assistant_get_plugin_path(sanitize_text_field($slug));
            if (!is_dir($path) || !$this->gitManager->isGitRepository($path)) {
                $results[] = ['slug' => $slug, 'success' => false, 'message' => 'Not a git repo'];
                continue;
            }
            $res = $this->gitManager->refreshBranches($path);
            $results[] = [
                'slug'    => sanitize_text_field($slug),
                'success' => $res['success'],
                'count'   => count($res['branches'] ?? []),
                'message' => sanitize_text_field($res['message'] ?? $res['error'] ?? ''),
            ];
        }

        wp_send_json_success(['results' => $results]);
    }

    /**
     * Save performance settings (Branch Cache TTL, Log Retention).
     */
    public function save_performance_settings()
    {
        if (!wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['nonce'] ?? '')), 'qa-assistant-admin-nonce')) {
            wp_send_json_error(['message' => 'Security check failed.']);
        }
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Unauthorized.']);
        }

        $cache_ttl    = intval(wp_unslash($_POST['cache_ttl'] ?? 0));
        $log_retention = intval(wp_unslash($_POST['log_retention'] ?? 100));

        // Whitelist valid values
        $valid_ttl       = [0, 60, 300, 900];
        $valid_retention = [50, 100, 250, 500];
        if (!in_array($cache_ttl, $valid_ttl, true))     { $cache_ttl = 0; }
        if (!in_array($log_retention, $valid_retention, true)) { $log_retention = 100; }

        $settings = get_option('qa_assistant_settings', []);
        $settings  = maybe_unserialize($settings);
        if (!is_array($settings)) { $settings = []; }

        $settings['cache_ttl']     = $cache_ttl;
        $settings['log_retention'] = $log_retention;
        update_option('qa_assistant_settings', $settings);

        wp_send_json_success(['message' => 'Performance settings saved.']);
    }
```

- [ ] **Step 4: Verify PHP syntax**

```bash
cd /Users/obayed/Herd/ea/wp-content/plugins/qa-assistant && php -l includes/Ajax.php
```

Expected: `No syntax errors detected in includes/Ajax.php`

---

## Task 3: Update JS API layer and DrawerContext for new endpoints

**Files:**
- Modify: `src/git-drawer/utils/api.js`
- Modify: `src/git-drawer/context/DrawerContext.jsx`

- [ ] **Step 1: Add `pullAllRepos` and `fetchAllRepos` to `api.js`**

In `src/git-drawer/utils/api.js`, append two new exports after the last line:

```js
export const pullAllRepos  = () => post('qa_assistant_pull_all_repos');
export const fetchAllRepos = () => post('qa_assistant_fetch_all_repos');
```

- [ ] **Step 2: Update DrawerContext initial state to hold `branchMeta`**

In `src/git-drawer/context/DrawerContext.jsx`, find `initialState` (line 6). Add `branchMeta: []` to it:

```js
const initialState = {
    theme: localStorage.getItem('qa_assistant_git_drawer_theme') || 'dark',
    isOpen: false,
    repositories: [],
    selectedRepository: null,
    branches: [],
    branchMeta: [],        // ← add this line
    currentBranch: '',
    hasChanges: false,
    lastPulled: null,
    loading: {
        repos: false,
        branches: false,
        pull: false,
        fetch: false,
        pullAll: false,    // ← add this line
        fetchAll: false,   // ← add this line
        switching: null,
    },
    searchQuery: '',
    error: null,
    toasts: [],
    uncommittedModal: null,
};
```

- [ ] **Step 3: Update `SET_BRANCHES` reducer case to also set `branchMeta`**

Find the `SET_BRANCHES` case in the reducer (around line 51):

```js
        case 'SET_BRANCHES':
            return {
                ...state,
                branches: action.payload.branches,
                currentBranch: action.payload.currentBranch,
                hasChanges: action.payload.hasChanges ?? state.hasChanges,
                lastPulled: action.payload.lastPulled ?? state.lastPulled,
            };
```

Replace with:

```js
        case 'SET_BRANCHES':
            return {
                ...state,
                branchMeta: action.payload.branchMeta ?? state.branchMeta,
                branches: (action.payload.branchMeta ?? []).length > 0
                    ? action.payload.branchMeta.map(b => b.name)
                    : action.payload.branches ?? state.branches,
                currentBranch: action.payload.currentBranch,
                hasChanges: action.payload.hasChanges ?? state.hasChanges,
                lastPulled: action.payload.lastPulled ?? state.lastPulled,
            };
```

- [ ] **Step 4: Update `loadBranches` callback to pass `branchMeta` from response**

Find `loadBranches` callback (around line 131). The response shape from PHP is now `{ branches: [{name, age}], currentBranch, ... }`. Update the dispatch:

```js
    const loadBranches = useCallback(async (pluginDir) => {
        dispatch({ type: 'SET_LOADING', payload: { branches: true } });
        try {
            const res = await api.fetchBranches(pluginDir);
            if (res.success) {
                dispatch({
                    type: 'SET_BRANCHES',
                    payload: {
                        branchMeta: res.data.branches,       // [{name, age}]
                        currentBranch: res.data.currentBranch,
                        hasChanges: res.data.hasChanges,
                        lastPulled: res.data.lastPulled,
                    },
                });
            } else {
                addToast(res.data?.message || 'Failed to load branches', 'error');
            }
        } catch (err) {
            addToast('Network error loading branches', 'error');
        } finally {
            dispatch({ type: 'SET_LOADING', payload: { branches: false } });
        }
    }, [addToast]);
```

- [ ] **Step 5: Add `doPullAll` and `doFetchAll` to DrawerContext**

Add these two callbacks after `doFetch` (around line 225), before the `value` object:

```js
    const doPullAll = useCallback(async () => {
        dispatch({ type: 'SET_LOADING', payload: { pullAll: true } });
        try {
            const res = await api.pullAllRepos();
            if (res.success) {
                const succeeded = res.data.results.filter(r => r.success).length;
                const failed    = res.data.results.filter(r => !r.success).length;
                addToast(
                    failed === 0
                        ? `Pulled all ${succeeded} repos`
                        : `Pulled ${succeeded} repos, ${failed} failed`,
                    failed === 0 ? 'success' : 'warning'
                );
                // Refresh repo list to update lastPulled times
                await loadRepositories();
            } else {
                addToast(res.data?.message || 'Pull all failed', 'error');
            }
        } catch (err) {
            addToast('Network error during pull all', 'error');
        } finally {
            dispatch({ type: 'SET_LOADING', payload: { pullAll: false } });
        }
    }, [addToast, loadRepositories]);

    const doFetchAll = useCallback(async () => {
        dispatch({ type: 'SET_LOADING', payload: { fetchAll: true } });
        try {
            const res = await api.fetchAllRepos();
            if (res.success) {
                const succeeded = res.data.results.filter(r => r.success).length;
                addToast(`Fetched ${succeeded} repos`, 'success');
                await loadRepositories();
            } else {
                addToast(res.data?.message || 'Fetch all failed', 'error');
            }
        } catch (err) {
            addToast('Network error during fetch all', 'error');
        } finally {
            dispatch({ type: 'SET_LOADING', payload: { fetchAll: false } });
        }
    }, [addToast, loadRepositories]);
```

- [ ] **Step 6: Expose `doPullAll`, `doFetchAll`, `branchMeta` in the context value**

Find the `value` object (around line 259):

```js
    const value = {
        state,
        dispatch,
        addToast,
        loadRepositories,
        loadBranches,
        doSwitchBranch,
        doPull,
        doFetch,
        doStash,
        doCommit,
    };
```

Replace with:

```js
    const value = {
        state,
        dispatch,
        addToast,
        loadRepositories,
        loadBranches,
        doSwitchBranch,
        doPull,
        doFetch,
        doPullAll,
        doFetchAll,
        doStash,
        doCommit,
    };
```

---

## Task 4: Show branch age in BranchList drawer

**Files:**
- Modify: `src/git-drawer/components/BranchList.jsx`

- [ ] **Step 1: Import `branchMeta` from state and add age helper**

In `BranchList.jsx`, change the destructuring line at the top of `BranchList()` (line 53):

```js
    const { state, doSwitchBranch } = useDrawer();
    const { selectedRepository, branches, branchMeta, currentBranch, hasChanges, loading, searchQuery } = state;
```

Add a helper function before the `filteredBranches` useMemo (after line 55):

```js
    // Build a name→age lookup from branchMeta
    const ageByName = useMemo(() => {
        const map = {};
        (branchMeta || []).forEach(m => { map[m.name] = m.age; });
        return map;
    }, [branchMeta]);

    function formatAge(unixTs) {
        if (!unixTs) return '';
        const secs = Math.floor(Date.now() / 1000) - unixTs;
        if (secs < 3600)  return `${Math.floor(secs / 60)}m`;
        if (secs < 86400) return `${Math.floor(secs / 3600)}h`;
        if (secs < 86400 * 30) return `${Math.floor(secs / 86400)}d`;
        return `${Math.floor(secs / (86400 * 30))}mo`;
    }
```

- [ ] **Step 2: Render age badge inside `renderBranch`**

In the `renderBranch` function, in the "Badges" `<div>` (around line 190), add an age badge right before the copy button logic. Find the outer `{/* Badges */}` div and add inside it, after the closing `{isCurrent && hasChanges && ...}` block:

```jsx
                {/* Branch age */}
                {!isCurrent && ageByName[branch] ? (
                    <span style={{
                        fontSize: 9,
                        color: 'var(--text-faint)',
                        fontVariantNumeric: 'tabular-nums',
                        flexShrink: 0,
                    }}>
                        {formatAge(ageByName[branch])}
                    </span>
                ) : null}
```

Place this span inside the `<div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>` that already wraps the badges — add it as the first child of that div, before `{isSwitching && ...}`.

---

## Task 5: Pull All / Fetch All buttons in RepositoryList

**Files:**
- Modify: `src/git-drawer/components/RepositoryList.jsx`

- [ ] **Step 1: Add bulk action buttons**

In `RepositoryList.jsx`, update the import to add `doPullAll` and `doFetchAll` from context:

```js
    const { state, dispatch, loadRepositories, loadBranches, doPullAll, doFetchAll } = useDrawer();
    const { repositories, selectedRepository, loading } = state;
```

Then, in the main `return`, after the `<div style={{ padding: '8px 12px 6px' }}>` label section (around line 46), add a bulk-actions row:

```jsx
            {/* Bulk actions */}
            {repositories.length > 0 && (
                <div style={{
                    display: 'flex', gap: 6, padding: '0 8px 8px',
                    borderBottom: '1px solid var(--border-default)',
                    marginBottom: 4,
                }}>
                    <button
                        onClick={doPullAll}
                        disabled={loading.pullAll || loading.fetchAll}
                        title="Pull latest for all repos"
                        style={{
                            flex: 1, fontSize: 11, fontWeight: 500,
                            padding: '5px 8px', borderRadius: 6,
                            backgroundColor: 'var(--bg-surface-hover)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-muted)',
                            cursor: loading.pullAll ? 'wait' : 'pointer',
                            opacity: (loading.pullAll || loading.fetchAll) ? 0.5 : 1,
                            transition: 'opacity 120ms',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                        }}
                    >
                        {loading.pullAll ? '⟳ Pulling…' : '↓ Pull All'}
                    </button>
                    <button
                        onClick={doFetchAll}
                        disabled={loading.pullAll || loading.fetchAll}
                        title="Fetch all repos"
                        style={{
                            flex: 1, fontSize: 11, fontWeight: 500,
                            padding: '5px 8px', borderRadius: 6,
                            backgroundColor: 'var(--bg-surface-hover)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-muted)',
                            cursor: loading.fetchAll ? 'wait' : 'pointer',
                            opacity: (loading.pullAll || loading.fetchAll) ? 0.5 : 1,
                            transition: 'opacity 120ms',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                        }}
                    >
                        {loading.fetchAll ? '⟳ Fetching…' : '↻ Fetch All'}
                    </button>
                </div>
            )}
```

---

## Task 6: Global keyboard shortcut Ctrl+Shift+G to open drawer

**Files:**
- Modify: `src/git-drawer/App.jsx`

- [ ] **Step 1: Add Ctrl+Shift+G keyboard listener**

In `App.jsx`, in the `DrawerInner` function, there is already an ESC handler `useEffect` (around line 43). Add a new `useEffect` directly below it:

```js
    // Global keyboard shortcut: Ctrl+Shift+G (or Cmd+Shift+G on Mac)
    useEffect(() => {
        const onKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'G') {
                e.preventDefault();
                dispatch({ type: isOpen ? 'CLOSE_DRAWER' : 'OPEN_DRAWER' });
            }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [isOpen, dispatch]);
```

---

## Task 7: Dashboard — Activity Log as a proper tab

**Files:**
- Modify: `src/QAAssistantDashboard.jsx`

- [ ] **Step 1: Add `activity` tab to the tabs array**

In `QAAssistantDashboard.jsx`, find the `tabs` array (around line 792):

```js
    const tabs = [
        { id: 'general', label: 'General Settings', icon: Settings },
        { id: 'git', label: 'Git Settings', icon: GitBranch },
        { id: 'integrations', label: 'Integrations', icon: Zap },
        { id: 'advanced', label: 'Advanced', icon: Activity },
    ];
```

Replace with:

```js
    const tabs = [
        { id: 'general', label: 'General Settings', icon: Settings },
        { id: 'git', label: 'Git Settings', icon: GitBranch },
        { id: 'activity', label: 'Activity Log', icon: Terminal },
        { id: 'integrations', label: 'Integrations', icon: Zap },
        { id: 'advanced', label: 'Advanced', icon: Activity },
    ];
```

- [ ] **Step 2: Create `ActivityLogTab` component to replace the floating panel**

Replace the existing `ActivityLogPanel` component (starting at line 491, ending at line 599) with a full-page tab component `ActivityLogTab`:

```jsx
// --- Activity Log Tab (replaces overlay panel) ---
const ActivityLogTab = ({ addToast }) => {
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filterRepo, setFilterRepo] = useState('all');
    const [filterAction, setFilterAction] = useState('all');

    const fetchLogs = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await apiCall('qa_assistant_get_activity_logs');
            setLogs(data.logs || []);
        } catch (err) {
            addToast('Failed to fetch logs: ' + err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [addToast]);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    const repos    = ['all', ...Array.from(new Set(logs.map(l => l.repo)))];
    const actions  = ['all', ...Object.keys(ACTION_CONFIG)];

    const filtered = logs.filter(log => {
        if (filterRepo   !== 'all' && log.repo   !== filterRepo)   return false;
        if (filterAction !== 'all' && log.action !== filterAction)  return false;
        return true;
    });

    return (
        <Card>
            <CardHeader className="border-b border-slate-100">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Activity Log</CardTitle>
                        <CardDescription>All recorded git operations across monitored repositories.</CardDescription>
                    </div>
                    <button
                        onClick={fetchLogs}
                        className="p-1.5 rounded-md hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </CardHeader>
            <CardContent className="!pt-4 space-y-4">
                {/* Filters */}
                <div className="flex flex-wrap gap-3 items-center">
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-medium text-slate-500">Repo:</label>
                        <select
                            value={filterRepo}
                            onChange={e => setFilterRepo(e.target.value)}
                            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-400"
                        >
                            {repos.map(r => <option key={r} value={r}>{r === 'all' ? 'All repos' : r}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-medium text-slate-500">Action:</label>
                        <select
                            value={filterAction}
                            onChange={e => setFilterAction(e.target.value)}
                            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-400"
                        >
                            {actions.map(a => (
                                <option key={a} value={a}>
                                    {a === 'all' ? 'All actions' : ACTION_CONFIG[a]?.label || a}
                                </option>
                            ))}
                        </select>
                    </div>
                    <Badge variant="outline" className="!text-[10px] ml-auto">
                        {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
                    </Badge>
                </div>

                {/* Log list */}
                <div className="border border-slate-100 rounded-lg overflow-hidden">
                    {isLoading && logs.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-sm">Loading logs…</div>
                    ) : filtered.length === 0 ? (
                        <div className="p-8 text-center">
                            <Terminal className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm text-slate-400">
                                {logs.length === 0 ? 'No activity recorded yet.' : 'No entries match your filters.'}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                            {filtered.map((log, idx) => {
                                const config = ACTION_CONFIG[log.action] || ACTION_CONFIG.pull;
                                const ActionIcon = config.icon;
                                return (
                                    <div key={idx} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                                        <div className={`p-1.5 rounded-md ${config.bg} flex-shrink-0`}>
                                            <ActionIcon className={`w-3.5 h-3.5 ${config.color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-slate-900">{config.label}</span>
                                                <span className="text-xs text-slate-400">→</span>
                                                <span className="text-xs font-mono text-slate-600 truncate">{log.repo}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-xs text-slate-500">{log.message}</span>
                                                {log.branch && (
                                                    <Badge variant="outline" className="!text-[10px] !px-1.5 !py-0">
                                                        {log.branch}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                                            <span className="text-[10px] text-slate-400">{timeAgo(log.timestamp)}</span>
                                            {log.user && (
                                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                    <User className="w-2.5 h-2.5" /> {log.user}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
```

- [ ] **Step 3: Remove the old floating Activity button and ActivityLogPanel from the header/render**

In `QAAssistantDashboard`, find and remove:
1. The `showActivityLog` state: `const [showActivityLog, setShowActivityLog] = useState(false);` (line ~679)
2. The Activity `<Button>` in the header `<div className="flex gap-3">` block (around line 1037-1045)
3. The `<ActivityLogPanel isOpen=... onClose=...>` usage (around line 1051-1054)

Also remove the old `ActivityLogPanel` component definition (lines 491-599).

- [ ] **Step 4: Add `activity` case to `renderTabContent`**

Find `renderTabContent` (around line 984):

```js
    const renderTabContent = () => {
        switch (activeTab) {
            case 'general':
                return <GeneralSettingsTab addToast={addToast} />;
            case 'git':
                return renderGitSettings();
            case 'integrations':
                return <IntegrationSettingsTab />;
            case 'advanced':
                return <AdvancedSettingsTab addToast={addToast} />;
            default:
                return renderGitSettings();
        }
    };
```

Replace with:

```js
    const renderTabContent = () => {
        switch (activeTab) {
            case 'general':
                return <GeneralSettingsTab addToast={addToast} />;
            case 'git':
                return renderGitSettings();
            case 'activity':
                return <ActivityLogTab addToast={addToast} />;
            case 'integrations':
                return <IntegrationSettingsTab />;
            case 'advanced':
                return <AdvancedSettingsTab addToast={addToast} />;
            default:
                return renderGitSettings();
        }
    };
```

---

## Task 8: Branch switcher on plugin cards

**Files:**
- Modify: `src/QAAssistantDashboard.jsx`

- [ ] **Step 1: Add per-plugin branch switcher state**

In the `QAAssistantDashboard` component, add state for the branch switcher popover (after the existing state declarations around line 682):

```js
    const [branchSwitcher, setBranchSwitcher] = useState(null); // { slug, branches, loading }
    const [isSwitchingBranch, setIsSwitchingBranch] = useState(null); // slug being switched
```

- [ ] **Step 2: Add `openBranchSwitcher` and `handleSwitchBranch` handlers**

Add these two handlers after `handleUpdateDisplay` (around line 784):

```js
    const openBranchSwitcher = async (plugin) => {
        setBranchSwitcher({ slug: plugin.slug, branches: [], loading: true });
        try {
            const data = await apiCall('qa_assistant_get_branches', { plugin_dir: plugin.slug });
            // data.branches is now [{name, age}] — extract names
            const names = Array.isArray(data.branches)
                ? data.branches.map(b => (typeof b === 'string' ? b : b.name))
                : [];
            setBranchSwitcher({ slug: plugin.slug, branches: names, loading: false });
        } catch (err) {
            addToast('Failed to load branches: ' + err.message, 'error');
            setBranchSwitcher(null);
        }
    };

    const handleSwitchBranch = async (slug, branch) => {
        setIsSwitchingBranch(slug);
        setBranchSwitcher(null);
        try {
            await apiCall('qa_assistant_switch_branch', { plugin_dir: slug, branch, force: 0 });
            addToast(`Switched to ${branch}`, 'success');
            await fetchPlugins();
        } catch (err) {
            addToast(err.message, 'error');
        } finally {
            setIsSwitchingBranch(null);
        }
    };
```

- [ ] **Step 3: Add "Modified" badge and branch switcher button to plugin cards**

Find the plugin card in `renderGitSettings()` — specifically the right-side `<div className="flex items-center gap-4">` that has the status label and X button (around line 947). Replace the entire `<div className="hidden md:flex flex-col items-end">` block and the outer wrapping div with:

```jsx
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col items-end gap-1">
                                {/* Status badge */}
                                <span className={`text-xs font-semibold capitalize px-2 py-0.5 rounded-full ${
                                    plugin.status === 'modified'
                                        ? 'bg-amber-100 text-amber-700'
                                        : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                    {plugin.status === 'modified' ? 'Modified' : 'Stable'}
                                </span>
                                {/* Branch switcher button */}
                                <div className="relative">
                                    <button
                                        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-100 px-2 py-1 rounded-md transition-colors border border-slate-200"
                                        onClick={() => branchSwitcher?.slug === plugin.slug
                                            ? setBranchSwitcher(null)
                                            : openBranchSwitcher(plugin)
                                        }
                                        title="Switch branch"
                                        disabled={isSwitchingBranch === plugin.slug}
                                    >
                                        <GitBranch className="w-3 h-3" />
                                        {isSwitchingBranch === plugin.slug ? 'Switching…' : 'Switch…'}
                                    </button>
                                    {/* Branch dropdown */}
                                    {branchSwitcher?.slug === plugin.slug && (
                                        <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-lg w-56 max-h-64 overflow-y-auto">
                                            {branchSwitcher.loading ? (
                                                <div className="p-3 text-xs text-slate-400 text-center">Loading…</div>
                                            ) : branchSwitcher.branches.length === 0 ? (
                                                <div className="p-3 text-xs text-slate-400 text-center">No branches found</div>
                                            ) : branchSwitcher.branches.map(b => (
                                                <button
                                                    key={b}
                                                    onClick={() => handleSwitchBranch(plugin.slug, b)}
                                                    className={`w-full text-left px-3 py-2 text-xs font-mono hover:bg-slate-50 flex items-center gap-2 ${
                                                        b === plugin.currentBranch ? 'text-emerald-600 font-semibold' : 'text-slate-700'
                                                    }`}
                                                >
                                                    <GitBranch className="w-3 h-3 flex-shrink-0" />
                                                    <span className="truncate">{b}</span>
                                                    {b === plugin.currentBranch && (
                                                        <span className="ml-auto text-[9px] bg-emerald-100 text-emerald-700 px-1.5 rounded-full">current</span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button
                                className="h-10 w-10 inline-flex items-center justify-center rounded-md cursor-pointer text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors -mr-2"
                                onClick={() => handleToggleMonitor(plugin.slug, false)}
                                title={`Remove ${plugin.name} from monitoring`}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
```

Also close the branch switcher when clicking outside. In the main `return` of `QAAssistantDashboard`, wrap the outer `<div>` with an onClick handler or add a global click listener. The simplest approach: add a `useEffect` near the other effects:

```js
    // Close branch switcher when clicking outside
    useEffect(() => {
        if (!branchSwitcher) return;
        const handler = (e) => {
            if (!e.target.closest('[data-branch-switcher]')) {
                setBranchSwitcher(null);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [branchSwitcher]);
```

And add `data-branch-switcher` attribute to the `<div className="relative">` wrapping the branch switcher button and dropdown.

---

## Task 9: Settings save feedback for General Settings

**Files:**
- Modify: `src/QAAssistantDashboard.jsx`

- [ ] **Step 1: Wire up General Settings toggles to save to server and show feedback**

Replace the entire `GeneralSettingsTab` component with a version that saves on toggle and shows inline "Saved ✓" feedback:

```jsx
const GeneralSettingsTab = ({ addToast }) => {
    const [showInAdminBar, setShowInAdminBar] = useState(true);
    const [showBranchBadges, setShowBranchBadges] = useState(true);
    const [notifyOnPull, setNotifyOnPull] = useState(true);
    const [toastDuration, setToastDuration] = useState(4);
    const [savedKey, setSavedKey] = useState(null); // which key just saved

    const markSaved = (key) => {
        setSavedKey(key);
        setTimeout(() => setSavedKey(null), 2000);
    };

    const saveSetting = async (key, value) => {
        try {
            await apiCall('qa_assistant_save_general_settings', { key, value });
            markSaved(key);
        } catch (err) {
            addToast('Failed to save: ' + err.message, 'error');
        }
    };

    const SavedIndicator = ({ settingKey }) => savedKey === settingKey ? (
        <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Saved
        </span>
    ) : null;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="border-b border-slate-100">
                    <CardTitle>Display Preferences</CardTitle>
                    <CardDescription>
                        Customize how QA Assistant appears in your WordPress admin area.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5 !pt-6">
                    <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg">
                                <Monitor className="w-4 h-4 text-slate-600" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-900">Show in Admin Bar</label>
                                <p className="text-xs text-slate-500 mt-0.5">Display Git Branches button in the WordPress admin bar</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <SavedIndicator settingKey="show_in_admin_bar" />
                            <Switch checked={showInAdminBar} onCheckedChange={(v) => {
                                setShowInAdminBar(v);
                                saveSetting('show_in_admin_bar', v);
                            }} />
                        </div>
                    </div>
                    <div className="border-t border-slate-100" />
                    <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg">
                                <Eye className="w-4 h-4 text-slate-600" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-900">Branch Badges in Admin Bar</label>
                                <p className="text-xs text-slate-500 mt-0.5">Show colored branch badges next to plugin names</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <SavedIndicator settingKey="show_branch_badges" />
                            <Switch checked={showBranchBadges} onCheckedChange={(v) => {
                                setShowBranchBadges(v);
                                saveSetting('show_branch_badges', v);
                            }} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="border-b border-slate-100">
                    <CardTitle>Notifications</CardTitle>
                    <CardDescription>
                        Control when and how you receive notifications about git operations.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5 !pt-6">
                    <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg">
                                <Bell className="w-4 h-4 text-slate-600" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-900">Pull Notifications</label>
                                <p className="text-xs text-slate-500 mt-0.5">Show toast notifications after pull operations</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <SavedIndicator settingKey="notify_on_pull" />
                            <Switch checked={notifyOnPull} onCheckedChange={(v) => {
                                setNotifyOnPull(v);
                                saveSetting('notify_on_pull', v);
                            }} />
                        </div>
                    </div>
                    <div className="border-t border-slate-100" />
                    <div className="flex items-start justify-between py-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg">
                                <Clock className="w-4 h-4 text-slate-600" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-900">Toast Duration</label>
                                <p className="text-xs text-slate-500 mt-0.5">How long notifications stay visible (seconds)</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <SavedIndicator settingKey="toast_duration" />
                            <select
                                value={toastDuration}
                                onChange={(e) => {
                                    const v = Number(e.target.value);
                                    setToastDuration(v);
                                    saveSetting('toast_duration', v);
                                }}
                                className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                            >
                                <option value={2}>2s</option>
                                <option value={3}>3s</option>
                                <option value={4}>4s</option>
                                <option value={5}>5s</option>
                                <option value={8}>8s</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
```

- [ ] **Step 2: Add `save_general_settings` AJAX action in `Ajax.php`**

In `includes/Ajax.php` constructor, add:
```php
        add_action('wp_ajax_qa_assistant_save_general_settings', [$this, 'save_general_settings']);
```

Add method:
```php
    /**
     * Save a single general setting (toggle or select).
     */
    public function save_general_settings()
    {
        if (!wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['nonce'] ?? '')), 'qa-assistant-admin-nonce')) {
            wp_send_json_error(['message' => 'Security check failed.']);
        }
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Unauthorized.']);
        }

        $key   = sanitize_key(wp_unslash($_POST['key'] ?? ''));
        $value = sanitize_text_field(wp_unslash($_POST['value'] ?? ''));

        $allowed_keys = ['show_in_admin_bar', 'show_branch_badges', 'notify_on_pull', 'toast_duration'];
        if (!in_array($key, $allowed_keys, true)) {
            wp_send_json_error(['message' => 'Unknown setting key.']);
        }

        $settings = get_option('qa_assistant_settings', []);
        $settings  = maybe_unserialize($settings);
        if (!is_array($settings)) { $settings = []; }

        // Boolean keys
        if (in_array($key, ['show_in_admin_bar', 'show_branch_badges', 'notify_on_pull'], true)) {
            $settings[$key] = filter_var($value, FILTER_VALIDATE_BOOLEAN);
        } else {
            $settings[$key] = intval($value);
        }

        update_option('qa_assistant_settings', $settings);
        wp_send_json_success(['message' => 'Setting saved.']);
    }
```

- [ ] **Step 3: Check PHP syntax**

```bash
cd /Users/obayed/Herd/ea/wp-content/plugins/qa-assistant && php -l includes/Ajax.php
```

Expected: `No syntax errors detected in includes/Ajax.php`

---

## Task 10: Wire up Advanced settings persistence (Cache TTL + Log Retention)

**Files:**
- Modify: `src/QAAssistantDashboard.jsx`

- [ ] **Step 1: Replace `AdvancedSettingsTab` to save settings and use React ConfirmModal**

Replace the entire `AdvancedSettingsTab` component with:

```jsx
const AdvancedSettingsTab = ({ addToast }) => {
    const [cacheTtl, setCacheTtl]         = useState('0');
    const [logRetention, setLogRetention] = useState('100');
    const [isSaving, setIsSaving]         = useState(false);
    const [savedPerf, setSavedPerf]       = useState(false);
    const [isClearing, setIsClearing]     = useState(false);
    const [clearConfirm, setClearConfirm] = useState(false);

    const handleSavePerf = async () => {
        setIsSaving(true);
        try {
            await apiCall('qa_assistant_save_performance_settings', {
                cache_ttl: cacheTtl,
                log_retention: logRetention,
            });
            setSavedPerf(true);
            setTimeout(() => setSavedPerf(false), 2000);
        } catch (err) {
            addToast('Failed to save: ' + err.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleClearLogs = async () => {
        setClearConfirm(false);
        setIsClearing(true);
        try {
            await apiCall('qa_assistant_clear_activity_logs');
            addToast('Activity logs cleared', 'success');
        } catch (error) {
            addToast('Failed to clear logs: ' + error.message, 'error');
        } finally {
            setIsClearing(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={clearConfirm}
                title="Clear Activity Logs"
                message="Permanently delete all recorded git activity? This cannot be undone."
                onConfirm={handleClearLogs}
                onCancel={() => setClearConfirm(false)}
            />

            <Card>
                <CardHeader className="border-b border-slate-100">
                    <CardTitle>Performance</CardTitle>
                    <CardDescription>Fine-tune performance and caching behavior.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5 !pt-6">
                    <div className="flex items-start justify-between py-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg">
                                <HardDrive className="w-4 h-4 text-slate-600" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-900">Branch Cache TTL</label>
                                <p className="text-xs text-slate-500 mt-0.5">How long to cache branch list data</p>
                            </div>
                        </div>
                        <select
                            value={cacheTtl}
                            onChange={e => setCacheTtl(e.target.value)}
                            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                        >
                            <option value="0">Disabled</option>
                            <option value="60">1 minute</option>
                            <option value="300">5 minutes</option>
                            <option value="900">15 minutes</option>
                        </select>
                    </div>
                    <div className="border-t border-slate-100" />
                    <div className="flex items-start justify-between py-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg">
                                <Activity className="w-4 h-4 text-slate-600" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-900">Log Retention</label>
                                <p className="text-xs text-slate-500 mt-0.5">Maximum entries kept. Oldest entries are dropped when full.</p>
                            </div>
                        </div>
                        <select
                            value={logRetention}
                            onChange={e => setLogRetention(e.target.value)}
                            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                        >
                            <option value="50">50 entries</option>
                            <option value="100">100 entries</option>
                            <option value="250">250 entries</option>
                            <option value="500">500 entries</option>
                        </select>
                    </div>
                </CardContent>
                <CardFooter className="bg-slate-50 border-t border-slate-100 rounded-b-xl flex justify-end items-center gap-3">
                    {savedPerf && (
                        <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Saved
                        </span>
                    )}
                    <Button size="sm" onClick={handleSavePerf} disabled={isSaving}>
                        {isSaving ? 'Saving…' : 'Save Settings'}
                    </Button>
                </CardFooter>
            </Card>

            <Card className="border-red-200">
                <CardHeader className="border-b border-red-100">
                    <CardTitle className="!text-red-900 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-red-500" />
                        Danger Zone
                    </CardTitle>
                    <CardDescription>Destructive actions that cannot be undone.</CardDescription>
                </CardHeader>
                <CardContent className="!pt-6 space-y-4">
                    <div className="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-lg">
                        <div>
                            <h4 className="text-sm font-medium text-red-900">Clear Activity Logs</h4>
                            <p className="text-xs text-red-700 mt-0.5">Permanently delete all recorded git activity.</p>
                        </div>
                        <Button
                            variant="destructive"
                            size="sm"
                            icon={Trash2}
                            onClick={() => setClearConfirm(true)}
                            disabled={isClearing}
                        >
                            {isClearing ? 'Clearing...' : 'Clear Logs'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
```

Also update the `ConfirmModal` component's "Remove" button text to be configurable (it currently hardcodes "Remove"). Find line 163:
```jsx
                    <Button variant="destructive" size="sm" onClick={onConfirm}>Remove</Button>
```
Replace with:
```jsx
                    <Button variant="destructive" size="sm" onClick={onConfirm}>{confirmLabel || 'Remove'}</Button>
```
And update the `ConfirmModal` props signature to accept `confirmLabel`:
```jsx
const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmLabel }) => {
```

---

## Task 11: Collapse Integrations tab to a single banner

**Files:**
- Modify: `src/QAAssistantDashboard.jsx`

- [ ] **Step 1: Replace `IntegrationSettingsTab` with a minimal coming-soon banner**

Replace the entire `IntegrationSettingsTab` component with:

```jsx
const IntegrationSettingsTab = () => (
    <Card>
        <CardHeader className="border-b border-slate-100">
            <CardTitle>Integrations</CardTitle>
            <CardDescription>
                Connect QA Assistant with external services to enhance your workflow.
            </CardDescription>
        </CardHeader>
        <CardContent className="!pt-6">
            <div className="flex flex-col items-center text-center py-12 gap-4">
                <div className="p-4 bg-blue-50 rounded-2xl">
                    <Zap className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-base font-semibold text-slate-800">Integrations coming soon</h3>
                <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
                    GitHub Webhooks, Slack Notifications, Bitbucket, and GitLab integrations are under active development.
                </p>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                    {['GitHub Webhooks', 'Slack', 'Bitbucket', 'GitLab'].map(name => (
                        <span key={name} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                            {name}
                        </span>
                    ))}
                </div>
            </div>
        </CardContent>
    </Card>
);
```

---

## Task 12: Build and verify

- [ ] **Step 1: Run the build**

```bash
cd /Users/obayed/Herd/ea/wp-content/plugins/qa-assistant && npm run build 2>&1
```

Expected: Build completes without errors. Output shows files written to `build/`.

- [ ] **Step 2: Hard-reload and verify in browser**

Navigate to `https://ea.test/wp-admin/tools.php?page=qa-assistant` with a hard reload (Cmd+Shift+R).

Verify:
- ✅ Activity Log tab appears in sidebar navigation
- ✅ Activity Log tab shows logs with filter dropdowns for Repo and Action
- ✅ Git Settings plugin cards show "Modified" (amber) or "Stable" (green) badge
- ✅ Each plugin card has a "Switch…" button that opens a branch dropdown
- ✅ General Settings toggles show "Saved ✓" when clicked
- ✅ Advanced tab "Branch Cache TTL" shows "Disabled" option (not "No cache")
- ✅ Advanced tab "Save Settings" button exists and shows confirmation
- ✅ "Clear Logs" button shows a React confirmation modal (not `window.confirm`)
- ✅ Integrations tab shows a single banner, not 4 cards
- ✅ No JavaScript errors in console

- [ ] **Step 3: Verify Git drawer improvements**

Click "Git Branches" in the admin bar to open the drawer.

Verify:
- ✅ Pull All and Fetch All buttons appear above the repository list
- ✅ Branch rows show age (e.g., "3d", "2h") for non-current branches
- ✅ Press Ctrl+Shift+G (or Cmd+Shift+G on Mac) toggles the drawer

- [ ] **Step 4: Final PHP verification**

```bash
cd /Users/obayed/Herd/ea/wp-content/plugins/qa-assistant && php -l includes/Ajax.php && php -l includes/GitManager.php
```

Expected: `No syntax errors` for both files.
