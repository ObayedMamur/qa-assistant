import React, { useEffect, useMemo } from 'react';
import { GitBranch, GitCommitHorizontal, AlertCircle } from 'lucide-react';
import { useDrawer } from '../context/DrawerContext';
import { useDebounce } from '../hooks/useDebounce';
import SearchInput from './SearchInput';
import LoadingSpinner from './LoadingSpinner';

export default function BranchList() {
    const { state, loadBranches, doSwitchBranch } = useDrawer();
    const { selectedRepository, branches, currentBranch, hasChanges, loading, searchQuery } = state;

    const debouncedQuery = useDebounce(searchQuery, 300);

    useEffect(() => {
        if (selectedRepository && branches.length === 0 && !loading.branches) {
            loadBranches(selectedRepository.slug);
        }
    }, [selectedRepository?.slug]);

    const filteredBranches = useMemo(() => {
        if (!debouncedQuery.trim()) return branches;
        const q = debouncedQuery.toLowerCase();
        return branches.filter((b) => b.toLowerCase().includes(q));
    }, [branches, debouncedQuery]);

    const handleSwitch = (branch) => {
        if (branch === currentBranch || loading.switching) return;
        doSwitchBranch(selectedRepository.slug, branch);
    };

    if (!selectedRepository) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-2" style={{ textAlign: 'center', padding: '0 24px' }}>
                <GitBranch size={32} style={{ color: '#484f58' }} />
                <p style={{ fontSize: 13, color: '#8b949e', lineHeight: 1.5 }}>Select a repository to view branches</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full" style={{ minHeight: 0 }}>
            <SearchInput />

            {/* Branch count + status bar */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 16px 8px',
                boxSizing: 'border-box',
            }}>
                <span style={{ fontSize: 11, color: '#8b949e', fontWeight: 500 }}>
                    {filteredBranches.length} branch{filteredBranches.length !== 1 ? 'es' : ''}
                    {searchQuery && ` matching "${debouncedQuery}"`}
                </span>
            </div>

            {loading.branches ? (
                <div className="flex flex-col items-center justify-center flex-1 gap-3">
                    <LoadingSpinner size={22} />
                    <span style={{ fontSize: 12, color: '#8b949e' }}>Loading branches…</span>
                </div>
            ) : filteredBranches.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 gap-2" style={{ textAlign: 'center', padding: '0 24px' }}>
                    <GitBranch size={24} style={{ color: '#484f58' }} />
                    <p style={{ fontSize: 13, color: '#8b949e' }}>
                        {searchQuery ? 'No branches match your search' : 'No branches found'}
                    </p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ padding: '0 8px 8px' }}>
                    {filteredBranches.map((branch) => {
                        const isCurrent = branch === currentBranch;
                        const isSwitching = loading.switching === branch;
                        const isMain = ['master', 'main', 'production'].includes(branch);
                        const isDev = ['develop', 'dev'].includes(branch);

                        return (
                            <button
                                key={branch}
                                onClick={() => handleSwitch(branch)}
                                disabled={isCurrent || !!loading.switching}
                                style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '7px 10px',
                                    borderRadius: 6,
                                    marginBottom: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    transition: 'all 120ms ease',
                                    backgroundColor: isCurrent ? 'rgba(99,102,241,0.08)' : 'transparent',
                                    border: isCurrent ? '1px solid rgba(99,102,241,0.15)' : '1px solid transparent',
                                    cursor: isCurrent ? 'default' : (loading.switching ? 'wait' : 'pointer'),
                                    opacity: (loading.switching && !isSwitching) ? 0.5 : 1,
                                    boxSizing: 'border-box',
                                }}
                            >
                                {/* Branch icon */}
                                <div style={{ flexShrink: 0, width: 16, display: 'flex', justifyContent: 'center' }}>
                                    {isSwitching ? (
                                        <LoadingSpinner size={13} />
                                    ) : isCurrent ? (
                                        <GitCommitHorizontal size={13} style={{ color: '#818cf8' }} />
                                    ) : (
                                        <GitBranch
                                            size={13}
                                            style={{
                                                color: isMain ? '#f59e0b' : isDev ? '#34d399' : '#6e7681',
                                            }}
                                        />
                                    )}
                                </div>

                                {/* Branch name */}
                                <span style={{
                                    fontSize: 13,
                                    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    flex: 1,
                                    color: isCurrent ? '#a5b4fc' : '#e6edf3',
                                    fontWeight: isCurrent ? 500 : 400,
                                    letterSpacing: '-0.01em',
                                }}>
                                    {branch}
                                </span>

                                {/* Badges */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                                    {isSwitching && (
                                        <span style={{ fontSize: 10, color: '#f59e0b', fontWeight: 500 }}>
                                            switching…
                                        </span>
                                    )}

                                    {/* Uncommitted changes badge on current branch */}
                                    {isCurrent && hasChanges && (
                                        <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 3,
                                            padding: '1px 6px',
                                            borderRadius: 4,
                                            fontSize: 10,
                                            fontWeight: 500,
                                            backgroundColor: 'rgba(245,158,11,0.1)',
                                            color: '#fbbf24',
                                            border: '1px solid rgba(245,158,11,0.15)',
                                        }}>
                                            <AlertCircle size={9} />
                                            modified
                                        </span>
                                    )}

                                    {isCurrent && (
                                        <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            padding: '1px 7px',
                                            borderRadius: 4,
                                            fontSize: 10,
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.04em',
                                            backgroundColor: 'rgba(99,102,241,0.12)',
                                            color: '#a5b4fc',
                                            border: '1px solid rgba(99,102,241,0.2)',
                                        }}>
                                            current
                                        </span>
                                    )}
                                    {isMain && !isCurrent && (
                                        <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            padding: '1px 6px',
                                            borderRadius: 4,
                                            fontSize: 10,
                                            fontWeight: 500,
                                            backgroundColor: 'rgba(245,158,11,0.06)',
                                            color: '#d4a017',
                                            border: '1px solid rgba(245,158,11,0.12)',
                                        }}>
                                            main
                                        </span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
