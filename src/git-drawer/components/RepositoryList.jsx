import React, { useEffect } from 'react';
import { GitBranch, Folder, AlertCircle, Clock } from 'lucide-react';
import { useDrawer } from '../context/DrawerContext';
import LoadingSpinner from './LoadingSpinner';

function timeAgo(timestamp) {
    if (!timestamp) return null;
    const seconds = Math.floor(Date.now() / 1000 - timestamp);
    if (seconds < 60) return 'now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
}

export default function RepositoryList() {
    const { state, dispatch, loadRepositories, loadBranches } = useDrawer();
    const { repositories, selectedRepository, loading } = state;

    useEffect(() => {
        if (state.isOpen && repositories.length === 0) {
            loadRepositories();
        }
    }, [state.isOpen]);

    const handleSelect = (repo) => {
        dispatch({ type: 'SELECT_REPOSITORY', payload: repo });
        loadBranches(repo.slug);
    };

    if (loading.repos) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-3 px-3">
                <LoadingSpinner size={20} />
                <span style={{ fontSize: 11, color: '#8b949e' }}>Loading repos…</span>
            </div>
        );
    }

    if (repositories.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-2 px-3" style={{ textAlign: 'center' }}>
                <Folder size={24} style={{ color: '#484f58' }} />
                <p style={{ fontSize: 11, color: '#8b949e', lineHeight: 1.5 }}>
                    No monitored repos.<br />
                    Add plugins in settings.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col py-1 overflow-y-auto h-full custom-scrollbar">
            <div style={{ padding: '8px 12px 6px' }}>
                <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8b949e' }}>
                    Repositories
                </span>
            </div>

            {repositories.map((repo) => {
                const isSelected = selectedRepository?.slug === repo.slug;
                const pulledText = timeAgo(repo.lastPulled);

                return (
                    <button
                        key={repo.slug}
                        onClick={() => handleSelect(repo)}
                        style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '8px 10px',
                            borderLeft: isSelected ? '2px solid #6366f1' : '2px solid transparent',
                            backgroundColor: isSelected ? 'rgba(99,102,241,0.07)' : 'transparent',
                            color: isSelected ? '#e6edf3' : '#c9d1d9',
                            transition: 'all 120ms ease',
                            cursor: 'pointer',
                            display: 'block',
                            boxSizing: 'border-box',
                        }}
                    >
                        <div className="flex items-center gap-2" style={{ minWidth: 0 }}>
                            <Folder size={13} style={{ flexShrink: 0, color: isSelected ? '#818cf8' : '#6e7681' }} />
                            <span style={{
                                fontSize: 13,
                                fontWeight: 500,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                color: 'inherit',
                                flex: 1,
                                letterSpacing: '-0.01em',
                            }}>
                                {repo.alias || repo.slug}
                            </span>
                            {/* Uncommitted changes dot */}
                            {repo.hasChanges && (
                                <AlertCircle size={10} style={{ flexShrink: 0, color: '#fbbf24' }} />
                            )}
                        </div>
                        <div className="flex items-center" style={{ marginTop: 3, marginLeft: 21, gap: 6 }}>
                            <div className="flex items-center" style={{ gap: 3 }}>
                                <GitBranch size={10} style={{ flexShrink: 0, color: '#6e7681' }} />
                                <span style={{
                                    fontSize: 11,
                                    color: '#6e7681',
                                    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}>
                                    {repo.currentBranch}
                                </span>
                            </div>
                            {pulledText && (
                                <span className="flex items-center" style={{ gap: 2, fontSize: 9, color: '#484f58' }}>
                                    <Clock size={8} />
                                    {pulledText}
                                </span>
                            )}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
