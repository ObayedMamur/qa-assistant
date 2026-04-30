import React, { useEffect } from 'react';
import { X, ArrowDownToLine, RefreshCw, GitBranch, AlertCircle, Clock, Sun, Moon } from 'lucide-react';
import { useDrawer } from '../context/DrawerContext';
import LoadingSpinner from './LoadingSpinner';
import { timeAgo } from '../utils/time';

export default function Header() {
    const { state, dispatch, doPull, doFetch } = useDrawer();
    const { selectedRepository, loading, hasChanges, lastPulled, theme } = state;

    const handleClose = () => dispatch({ type: 'CLOSE_DRAWER' });
    const handleThemeToggle = () => dispatch({ type: 'TOGGLE_THEME' });

    const handlePull = () => {
        if (selectedRepository && !loading.pull) {
            doPull(selectedRepository.slug);
        }
    };

    const handleFetch = () => {
        if (selectedRepository && !loading.fetch) {
            doFetch(selectedRepository.slug);
        }
    };

    // Escape key closes the drawer
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') handleClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, []);

    const lastPulledText = timeAgo(lastPulled || selectedRepository?.lastPulled);
    const repoLabel = selectedRepository
        ? (selectedRepository.alias || selectedRepository.slug)
        : null;

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)',
            flexShrink: 0,
            boxSizing: 'border-box',
            gap: 12,
        }}>
            {/* Left: Title + repo badge + meta */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                <GitBranch size={18} style={{ color: 'var(--accent-text)', flexShrink: 0 }} />
                <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', margin: 0, letterSpacing: '-0.01em' }}>
                    Git Branches
                </h2>
                {repoLabel && (
                    <span
                        title={repoLabel}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '2px 10px',
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 500,
                            backgroundColor: 'var(--accent-bg-muted)',
                            color: 'var(--accent-text-light)',
                            border: '1px solid var(--accent-border)',
                            maxWidth: 160,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            cursor: 'default',
                        }}
                    >
                        {repoLabel}
                    </span>
                )}

                {/* Uncommitted changes indicator */}
                {hasChanges && (
                    <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontSize: 10,
                        fontWeight: 600,
                        backgroundColor: 'var(--warn-bg-muted)',
                        color: 'var(--warn-primary)',
                        border: '1px solid var(--warn-border)',
                        whiteSpace: 'nowrap',
                    }}>
                        <AlertCircle size={10} />
                        Modified
                    </span>
                )}

                {/* Last pulled time */}
                {lastPulledText && (
                    <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        fontSize: 10,
                        color: 'var(--text-faint)',
                        whiteSpace: 'nowrap',
                        marginLeft: 'auto',
                    }}>
                        <Clock size={10} />
                        {lastPulledText}
                    </span>
                )}
            </div>

            {/* Right: Pull + Fetch button group, Theme Toggle, Close */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                {/* Unified Pull / Fetch button group */}
                <div style={{ display: 'inline-flex', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border-default)' }}>
                    <button
                        onClick={handlePull}
                        disabled={!selectedRepository || loading.pull}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '5px 11px',
                            fontSize: 12,
                            fontWeight: 500,
                            backgroundColor: (!selectedRepository || loading.pull) ? 'var(--btn-secondary-bg-disabled)' : 'var(--btn-secondary-bg)',
                            color: 'var(--text-secondary)',
                            border: 'none',
                            borderRight: '1px solid var(--border-default)',
                            opacity: (!selectedRepository || loading.pull) ? 0.45 : 1,
                            cursor: (!selectedRepository || loading.pull) ? 'not-allowed' : 'pointer',
                            transition: 'background 150ms ease, opacity 150ms ease',
                            letterSpacing: '0.01em',
                        }}
                        title="Pull latest changes from remote (git pull)"
                    >
                        {loading.pull ? <LoadingSpinner size={12} /> : <ArrowDownToLine size={12} />}
                        <span>Pull</span>
                    </button>
                    <button
                        onClick={handleFetch}
                        disabled={!selectedRepository || loading.fetch}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '5px 11px',
                            fontSize: 12,
                            fontWeight: 500,
                            backgroundColor: (!selectedRepository || loading.fetch) ? 'var(--btn-secondary-bg-disabled)' : 'var(--btn-secondary-bg)',
                            color: 'var(--text-secondary)',
                            border: 'none',
                            opacity: (!selectedRepository || loading.fetch) ? 0.45 : 1,
                            cursor: (!selectedRepository || loading.fetch) ? 'not-allowed' : 'pointer',
                            transition: 'background 150ms ease, opacity 150ms ease',
                            letterSpacing: '0.01em',
                        }}
                        title="Fetch remote branches (git fetch)"
                    >
                        {loading.fetch ? <LoadingSpinner size={12} /> : <RefreshCw size={12} />}
                        <span>Fetch</span>
                    </button>
                </div>

                <div style={{ width: 1, height: 18, backgroundColor: 'var(--border-default)', margin: '0 2px' }} />
                
                <button
                    onClick={handleThemeToggle}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        color: 'var(--icon-default)',
                        transition: 'all 150ms ease',
                        cursor: 'pointer',
                    }}
                    title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
                >
                    {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
                </button>

                <button
                    onClick={handleClose}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        color: 'var(--icon-default)',
                        transition: 'all 150ms ease',
                        cursor: 'pointer',
                    }}
                    title="Close drawer"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}
