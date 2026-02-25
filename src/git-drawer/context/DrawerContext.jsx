import React, { createContext, useContext, useReducer, useCallback } from 'react';
import * as api from '../utils/api';

const DrawerContext = createContext(null);

const initialState = {
    isOpen: false,
    repositories: [],
    selectedRepository: null,
    branches: [],
    currentBranch: '',
    hasChanges: false,
    lastPulled: null,
    loading: {
        repos: false,
        branches: false,
        pull: false,
        fetch: false,
        switching: null, // branch name being switched to
    },
    searchQuery: '',
    error: null,
    toasts: [],
    uncommittedModal: null, // { type: 'pull' | 'switch', pluginDir, branch? }
};

function reducer(state, action) {
    switch (action.type) {
        case 'OPEN_DRAWER':
            return { ...state, isOpen: true };
        case 'CLOSE_DRAWER':
            return { ...initialState, repositories: state.repositories };
        case 'SET_REPOSITORIES':
            return { ...state, repositories: action.payload };
        case 'SELECT_REPOSITORY': {
            const repo = action.payload;
            return {
                ...state,
                selectedRepository: repo,
                branches: [],
                currentBranch: repo?.currentBranch || '',
                searchQuery: '',
            };
        }
        case 'SET_BRANCHES':
            return {
                ...state,
                branches: action.payload.branches,
                currentBranch: action.payload.currentBranch,
                hasChanges: action.payload.hasChanges ?? state.hasChanges,
                lastPulled: action.payload.lastPulled ?? state.lastPulled,
            };
        case 'SET_CURRENT_BRANCH':
            return {
                ...state,
                currentBranch: action.payload,
                repositories: state.repositories.map((r) =>
                    r.slug === state.selectedRepository?.slug ? { ...r, currentBranch: action.payload } : r
                ),
            };
        case 'SET_LAST_PULLED':
            return {
                ...state,
                lastPulled: action.payload,
                repositories: state.repositories.map((r) =>
                    r.slug === state.selectedRepository?.slug ? { ...r, lastPulled: action.payload } : r
                ),
            };
        case 'SET_HAS_CHANGES':
            return { ...state, hasChanges: action.payload };
        case 'SET_LOADING':
            return { ...state, loading: { ...state.loading, ...action.payload } };
        case 'SET_SEARCH_QUERY':
            return { ...state, searchQuery: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        case 'ADD_TOAST':
            return { ...state, toasts: [...state.toasts, { ...action.payload, id: Date.now() }] };
        case 'REMOVE_TOAST':
            return { ...state, toasts: state.toasts.filter((t) => t.id !== action.payload) };
        case 'SET_UNCOMMITTED_MODAL':
            return { ...state, uncommittedModal: action.payload };
        default:
            return state;
    }
}

export function DrawerProvider({ children }) {
    const [state, dispatch] = useReducer(reducer, initialState);

    const addToast = useCallback((message, type = 'info') => {
        const id = Date.now();
        dispatch({ type: 'ADD_TOAST', payload: { message, type } });
        setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: id }), 4000);
    }, []);

    const loadRepositories = useCallback(async () => {
        dispatch({ type: 'SET_LOADING', payload: { repos: true } });
        try {
            const res = await api.fetchRepositories();
            if (res.success) {
                dispatch({ type: 'SET_REPOSITORIES', payload: res.data.repositories });
                // Auto-select first repo if available
                if (res.data.repositories.length > 0) {
                    dispatch({ type: 'SELECT_REPOSITORY', payload: res.data.repositories[0] });
                }
            } else {
                dispatch({ type: 'SET_ERROR', payload: res.data?.message || 'Failed to load repositories' });
            }
        } catch (err) {
            dispatch({ type: 'SET_ERROR', payload: 'Network error loading repositories' });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: { repos: false } });
        }
    }, []);

    const loadBranches = useCallback(async (pluginDir) => {
        dispatch({ type: 'SET_LOADING', payload: { branches: true } });
        try {
            const res = await api.fetchBranches(pluginDir);
            if (res.success) {
                dispatch({
                    type: 'SET_BRANCHES',
                    payload: {
                        branches: res.data.branches,
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

    const doSwitchBranch = useCallback(async (pluginDir, branch, force = false) => {
        dispatch({ type: 'SET_LOADING', payload: { switching: branch } });
        try {
            const res = await api.switchBranch(pluginDir, branch, force);
            if (res.success) {
                dispatch({ type: 'SET_CURRENT_BRANCH', payload: res.data.current_branch });
                addToast(`Switched to ${res.data.current_branch}`, 'success');
            } else {
                if (res.data?.has_changes) {
                    dispatch({
                        type: 'SET_UNCOMMITTED_MODAL',
                        payload: { type: 'switch', pluginDir, branch },
                    });
                } else {
                    addToast(res.data?.message || 'Failed to switch branch', 'error');
                }
            }
        } catch (err) {
            addToast('Network error switching branch', 'error');
        } finally {
            dispatch({ type: 'SET_LOADING', payload: { switching: null } });
        }
    }, [addToast]);

    const doPull = useCallback(async (pluginDir) => {
        dispatch({ type: 'SET_LOADING', payload: { pull: true } });
        try {
            const res = await api.pullRepo(pluginDir);
            if (res.success) {
                addToast(`Pulled latest for ${res.data.branch}`, 'success');
                if (res.data.lastPulled) {
                    dispatch({ type: 'SET_LAST_PULLED', payload: res.data.lastPulled });
                }
                // Refresh branches after pull
                await loadBranches(pluginDir);
            } else {
                if (res.data?.has_changes) {
                    dispatch({
                        type: 'SET_UNCOMMITTED_MODAL',
                        payload: { type: 'pull', pluginDir },
                    });
                } else {
                    addToast(res.data?.message || 'Pull failed', 'error');
                }
            }
        } catch (err) {
            addToast('Network error during pull', 'error');
        } finally {
            dispatch({ type: 'SET_LOADING', payload: { pull: false } });
        }
    }, [addToast, loadBranches]);

    const doFetch = useCallback(async (pluginDir) => {
        dispatch({ type: 'SET_LOADING', payload: { fetch: true } });
        try {
            const res = await api.fetchRepo(pluginDir);
            if (res.success) {
                addToast(`Fetched ${res.data.branches.length} branches`, 'success');
                dispatch({
                    type: 'SET_BRANCHES',
                    payload: { branches: res.data.branches, currentBranch: res.data.current_branch },
                });
            } else {
                addToast(res.data?.message || 'Fetch failed', 'error');
            }
        } catch (err) {
            addToast('Network error during fetch', 'error');
        } finally {
            dispatch({ type: 'SET_LOADING', payload: { fetch: false } });
        }
    }, [addToast]);

    const doStash = useCallback(async (pluginDir) => {
        try {
            const res = await api.stashChanges(pluginDir);
            if (res.success) {
                addToast('Changes stashed', 'success');
                return true;
            } else {
                addToast(res.data?.message || 'Stash failed', 'error');
                return false;
            }
        } catch {
            addToast('Network error during stash', 'error');
            return false;
        }
    }, [addToast]);

    const doCommit = useCallback(async (pluginDir, message) => {
        try {
            const res = await api.commitChanges(pluginDir, message);
            if (res.success) {
                addToast('Changes committed', 'success');
                return true;
            } else {
                addToast(res.data?.message || 'Commit failed', 'error');
                return false;
            }
        } catch {
            addToast('Network error during commit', 'error');
            return false;
        }
    }, [addToast]);

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

    return <DrawerContext.Provider value={value}>{children}</DrawerContext.Provider>;
}

export function useDrawer() {
    const ctx = useContext(DrawerContext);
    if (!ctx) throw new Error('useDrawer must be used within DrawerProvider');
    return ctx;
}
