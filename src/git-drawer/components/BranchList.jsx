import React, { useMemo, useState, useCallback } from 'react';
import { GitBranch, GitCommitHorizontal, AlertCircle, Copy, Check } from 'lucide-react';
import { useDrawer } from '../context/DrawerContext';
import { useDebounce } from '../hooks/useDebounce';
import SearchInput from './SearchInput';
import LoadingSpinner from './LoadingSpinner';

// Branch name categories
const PROTECTED_MAIN = ['master', 'main', 'production'];
const PROTECTED_DEV  = ['develop', 'dev', 'staging'];
const PROTECTED_ALL  = [...PROTECTED_MAIN, ...PROTECTED_DEV];

// Section label component
function SectionLabel({ children }) {
    return (
        <div style={{
            padding: '10px 10px 4px',
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#484f58',
            userSelect: 'none',
        }}>
            {children}
        </div>
    );
}

// Highlight matched query text inside a branch name
function HighlightedName({ text, query }) {
    if (!query.trim()) return <>{text}</>;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return <>{text}</>;
    return (
        <>
            {text.slice(0, idx)}
            <mark style={{
                background: 'rgba(99,102,241,0.28)',
                color: '#c7d2fe',
                borderRadius: 2,
                padding: '0 1px',
            }}>
                {text.slice(idx, idx + query.length)}
            </mark>
            {text.slice(idx + query.length)}
        </>
    );
}

export default function BranchList() {
    const { state, doSwitchBranch } = useDrawer();
    const { selectedRepository, branches, currentBranch, hasChanges, loading, searchQuery } = state;

    const debouncedQuery = useDebounce(searchQuery, 300);
    const [hoveredBranch, setHoveredBranch] = useState(null);
    const [copiedBranch, setCopiedBranch]   = useState(null);

    const filteredBranches = useMemo(() => {
        if (!debouncedQuery.trim()) return branches;
        const q = debouncedQuery.toLowerCase();
        return branches.filter((b) => b.toLowerCase().includes(q));
    }, [branches, debouncedQuery]);

    // Group only when not searching
    const grouped = useMemo(() => {
        if (debouncedQuery.trim()) return null;
        const current   = filteredBranches.filter(b => b === currentBranch);
        const protected_ = filteredBranches.filter(b => b !== currentBranch && PROTECTED_ALL.includes(b));
        const rest       = filteredBranches.filter(b => b !== currentBranch && !PROTECTED_ALL.includes(b));
        return { current, protected: protected_, rest };
    }, [filteredBranches, currentBranch, debouncedQuery]);

    const handleSwitch = (branch) => {
        if (branch === currentBranch || loading.switching) return;
        doSwitchBranch(selectedRepository.slug, branch);
    };

    const handleCopy = useCallback((e, branch) => {
        e.stopPropagation();
        navigator.clipboard?.writeText(branch).then(() => {
            setCopiedBranch(branch);
            setTimeout(() => setCopiedBranch(null), 2000);
        });
    }, []);

    // ── Empty state: no repo selected ──────────────────────────────────────────
    if (!selectedRepository) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-2" style={{ textAlign: 'center', padding: '0 24px' }}>
                <GitBranch size={32} style={{ color: '#484f58' }} />
                <p style={{ fontSize: 13, color: '#8b949e', lineHeight: 1.5 }}>Select a repository to view branches</p>
            </div>
        );
    }

    // ── Branch row renderer ────────────────────────────────────────────────────
    const renderBranch = (branch) => {
        const isCurrent   = branch === currentBranch;
        const isSwitching = loading.switching === branch;
        const isMain      = PROTECTED_MAIN.includes(branch);
        const isDev       = PROTECTED_DEV.includes(branch);
        const isHovered   = hoveredBranch === branch;
        const isCopied    = copiedBranch  === branch;

        return (
            <button
                key={branch}
                onClick={() => handleSwitch(branch)}
                disabled={isCurrent || !!loading.switching}
                onMouseEnter={() => setHoveredBranch(branch)}
                onMouseLeave={() => setHoveredBranch(null)}
                style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '7px 10px',
                    borderRadius: 6,
                    marginBottom: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'background 120ms ease, opacity 120ms ease',
                    backgroundColor: isCurrent
                        ? 'rgba(99,102,241,0.08)'
                        : isHovered ? 'rgba(255,255,255,0.04)' : 'transparent',
                    // Left accent border: 2px for current, transparent otherwise
                    borderLeft: isCurrent
                        ? '2px solid #818cf8'
                        : isHovered ? '2px solid rgba(99,102,241,0.3)' : '2px solid transparent',
                    borderTop: '1px solid transparent',
                    borderRight: '1px solid transparent',
                    borderBottom: '1px solid transparent',
                    cursor: isCurrent ? 'default' : loading.switching ? 'wait' : 'pointer',
                    opacity: (loading.switching && !isSwitching) ? 0.4 : 1,
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
                        <GitBranch size={13} style={{
                            color: isMain ? '#f59e0b' : isDev ? '#34d399' : '#6e7681',
                        }} />
                    )}
                </div>

                {/* Branch name with search highlight */}
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
                    <HighlightedName text={branch} query={debouncedQuery} />
                </span>

                {/* Copy button — appears on hover */}
                {isHovered && !isSwitching && (
                    <button
                        onClick={(e) => handleCopy(e, branch)}
                        title="Copy branch name"
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '2px 4px',
                            borderRadius: 4,
                            color: isCopied ? '#34d399' : '#6e7681',
                            display: 'flex',
                            alignItems: 'center',
                            flexShrink: 0,
                            transition: 'color 150ms',
                            lineHeight: 1,
                        }}
                    >
                        {isCopied ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                )}

                {/* Badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                    {isSwitching && (
                        <span style={{ fontSize: 10, color: '#f59e0b', fontWeight: 500 }}>
                            switching…
                        </span>
                    )}

                    {/* Uncommitted changes on current branch */}
                    {isCurrent && hasChanges && (
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 3,
                            padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 500,
                            backgroundColor: 'rgba(245,158,11,0.12)',
                            color: '#fbbf24',
                            border: '1px solid rgba(245,158,11,0.22)',
                        }}>
                            <AlertCircle size={9} />
                            modified
                        </span>
                    )}

                    {/* CURRENT badge */}
                    {isCurrent && (
                        <span style={{
                            display: 'inline-flex', alignItems: 'center',
                            padding: '1px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                            textTransform: 'uppercase', letterSpacing: '0.04em',
                            backgroundColor: 'rgba(99,102,241,0.15)',
                            color: '#a5b4fc',
                            border: '1px solid rgba(99,102,241,0.28)',
                        }}>
                            current
                        </span>
                    )}

                    {/* MAIN / MASTER badge — fixed contrast */}
                    {isMain && !isCurrent && (
                        <span style={{
                            display: 'inline-flex', alignItems: 'center',
                            padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                            backgroundColor: 'rgba(245,158,11,0.18)',
                            color: '#fbbf24',
                            border: '1px solid rgba(245,158,11,0.3)',
                        }}>
                            main
                        </span>
                    )}
                </div>
            </button>
        );
    };

    // ── Main render ────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col h-full" style={{ minHeight: 0 }}>
            <SearchInput />

            {/* Branch count bar */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 16px 8px', boxSizing: 'border-box',
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
                    {grouped ? (
                        // Grouped view (no active search)
                        <>
                            {/* Current branch pinned at top */}
                            {grouped.current.map(renderBranch)}

                            {/* Protected branches */}
                            {grouped.protected.length > 0 && (
                                <>
                                    <SectionLabel>Protected</SectionLabel>
                                    {grouped.protected.map(renderBranch)}
                                </>
                            )}

                            {/* All other branches */}
                            {grouped.rest.length > 0 && (
                                <>
                                    <SectionLabel>All Branches · {grouped.rest.length}</SectionLabel>
                                    {grouped.rest.map(renderBranch)}
                                </>
                            )}
                        </>
                    ) : (
                        // Flat list when searching — highlight matches
                        filteredBranches.map(renderBranch)
                    )}
                </div>
            )}
        </div>
    );
}
