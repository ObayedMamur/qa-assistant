import React, { useEffect } from 'react';
import { GitBranch, Folder, AlertCircle, Clock } from 'lucide-react';
import { useDrawer } from '../context/DrawerContext';
import LoadingSpinner from './LoadingSpinner';
import { timeAgo } from '../utils/time';

export default function RepositoryList() {
    const { state, dispatch, loadRepositories, loadBranches, doPullAll, doFetchAll } = useDrawer();
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
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Loading repos…</span>
            </div>
        );
    }

    if (repositories.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-2 px-3" style={{ textAlign: 'center' }}>
                <Folder size={24} style={{ color: 'var(--icon-muted)' }} />
                <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    No monitored repos.<br />
                    Add plugins in settings.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col py-1 overflow-y-auto h-full custom-scrollbar">
            <div style={{ padding: '8px 12px 6px' }}>
                <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                    Repositories
                </span>
            </div>

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
                            borderLeft: isSelected ? '2px solid var(--accent-primary)' : '2px solid transparent',
                            backgroundColor: isSelected ? 'var(--accent-bg-subtle)' : 'transparent',
                            color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                            transition: 'all 120ms ease',
                            cursor: 'pointer',
                            display: 'block',
                            boxSizing: 'border-box',
                        }}
                    >
                        <div className="flex items-center gap-2" style={{ minWidth: 0 }}>
                            <Folder size={13} style={{ flexShrink: 0, color: isSelected ? 'var(--accent-text)' : 'var(--text-faint)' }} />
                            <span
                                title={repo.alias || repo.slug}
                                style={{
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
                                <AlertCircle size={10} style={{ flexShrink: 0, color: 'var(--warn-primary)' }} />
                            )}
                        </div>
                        <div className="flex items-center" style={{ marginTop: 3, marginLeft: 21, gap: 6 }}>
                            <div className="flex items-center" style={{ gap: 3 }}>
                                <GitBranch size={10} style={{ flexShrink: 0, color: 'var(--text-faint)' }} />
                                <span style={{
                                    fontSize: 11,
                                    color: 'var(--text-faint)',
                                    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}>
                                    {repo.currentBranch}
                                </span>
                            </div>
                            {pulledText && (
                                <span className="flex items-center" style={{ gap: 2, fontSize: 9, color: 'var(--icon-muted)' }}>
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
