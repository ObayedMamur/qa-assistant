import React from 'react';
import { X, ArrowDownToLine, RefreshCw, GitBranch, AlertCircle, Clock } from 'lucide-react';
import { useDrawer } from '../context/DrawerContext';
import LoadingSpinner from './LoadingSpinner';

function timeAgo(timestamp) {
    if (!timestamp) return null;
    const seconds = Math.floor(Date.now() / 1000 - timestamp);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

export default function Header() {
    const { state, dispatch, doPull, doFetch } = useDrawer();
    const { selectedRepository, loading, hasChanges, lastPulled } = state;

    const handleClose = () => dispatch({ type: 'CLOSE_DRAWER' });

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

    const lastPulledText = timeAgo(lastPulled || selectedRepository?.lastPulled);

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: '1px solid #21262d',
            backgroundColor: '#161b22',
            flexShrink: 0,
            boxSizing: 'border-box',
            gap: 12,
        }}>
            {/* Left: Title + repo badge + meta */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                <GitBranch size={18} style={{ color: '#818cf8', flexShrink: 0 }} />
                <h2 style={{ fontSize: 15, fontWeight: 600, color: '#e6edf3', whiteSpace: 'nowrap', margin: 0, letterSpacing: '-0.01em' }}>
                    Git Branches
                </h2>
                {selectedRepository && (
                    <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '2px 10px',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 500,
                        backgroundColor: 'rgba(99,102,241,0.12)',
                        color: '#a5b4fc',
                        border: '1px solid rgba(99,102,241,0.2)',
                        maxWidth: 150,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}>
                        {selectedRepository.alias || selectedRepository.slug}
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
                        backgroundColor: 'rgba(245,158,11,0.1)',
                        color: '#fbbf24',
                        border: '1px solid rgba(245,158,11,0.2)',
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
                        color: '#6e7681',
                        whiteSpace: 'nowrap',
                        marginLeft: 'auto',
                    }}>
                        <Clock size={10} />
                        {lastPulledText}
                    </span>
                )}
            </div>

            {/* Right: Pull, Fetch, Close */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <button
                    onClick={handlePull}
                    disabled={!selectedRepository || loading.pull}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '5px 10px',
                        fontSize: 12,
                        fontWeight: 500,
                        borderRadius: 6,
                        backgroundColor: '#238636',
                        color: '#ffffff',
                        border: '1px solid rgba(35,134,54,0.4)',
                        opacity: (!selectedRepository || loading.pull) ? 0.4 : 1,
                        cursor: (!selectedRepository || loading.pull) ? 'not-allowed' : 'pointer',
                        transition: 'all 150ms ease',
                        letterSpacing: '0.01em',
                    }}
                    title="Pull changes from remote"
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
                        padding: '5px 10px',
                        fontSize: 12,
                        fontWeight: 500,
                        borderRadius: 6,
                        backgroundColor: '#21262d',
                        color: '#c9d1d9',
                        border: '1px solid #30363d',
                        opacity: (!selectedRepository || loading.fetch) ? 0.4 : 1,
                        cursor: (!selectedRepository || loading.fetch) ? 'not-allowed' : 'pointer',
                        transition: 'all 150ms ease',
                        letterSpacing: '0.01em',
                    }}
                    title="Fetch remote branches"
                >
                    {loading.fetch ? <LoadingSpinner size={12} /> : <RefreshCw size={12} />}
                    <span>Fetch</span>
                </button>
                <div style={{ width: 1, height: 18, backgroundColor: '#30363d', margin: '0 2px' }} />
                <button
                    onClick={handleClose}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        color: '#8b949e',
                        transition: 'all 150ms ease',
                    }}
                    title="Close drawer"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}
