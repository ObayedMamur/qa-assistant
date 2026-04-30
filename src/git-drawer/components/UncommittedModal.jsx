import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useDrawer } from '../context/DrawerContext';
import LoadingSpinner from './LoadingSpinner';

export default function UncommittedModal() {
    const { state, dispatch, doStash, doCommit, doPull, doSwitchBranch } = useDrawer();
    const { uncommittedModal } = state;
    const [commitMessage, setCommitMessage] = useState('');
    const [processing, setProcessing] = useState(false);

    if (!uncommittedModal) return null;

    const { type, pluginDir, branch } = uncommittedModal;

    const handleClose = () => {
        dispatch({ type: 'SET_UNCOMMITTED_MODAL', payload: null });
    };

    const handleStash = async () => {
        setProcessing(true);
        const ok = await doStash(pluginDir);
        if (ok) {
            handleClose();
            if (type === 'pull') {
                await doPull(pluginDir);
            } else if (type === 'switch' && branch) {
                await doSwitchBranch(pluginDir, branch, true);
            }
        }
        setProcessing(false);
    };

    const handleCommit = async () => {
        if (!commitMessage.trim()) return;
        setProcessing(true);
        const ok = await doCommit(pluginDir, commitMessage.trim());
        if (ok) {
            handleClose();
            if (type === 'pull') {
                await doPull(pluginDir);
            } else if (type === 'switch' && branch) {
                await doSwitchBranch(pluginDir, branch);
            }
        }
        setProcessing(false);
    };

    return (
        <div className="fixed inset-0 z-[100010] flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 backdrop-blur-sm" style={{ backgroundColor: 'var(--overlay-bg)' }} onClick={handleClose} />

            {/* Modal */}
            <div className="relative w-full max-w-md mx-4 rounded-xl shadow-2xl" style={{ backgroundColor: 'var(--modal-bg)', border: '1px solid var(--modal-border)' }}>
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ backgroundColor: 'var(--warn-bg-muted)' }}>
                            <AlertTriangle size={16} style={{ color: 'var(--warn-text)' }} />
                        </div>
                        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                            Uncommitted Changes
                        </h3>
                    </div>
                    <button
                        onClick={handleClose}
                        className="transition-colors p-1 rounded-md"
                        style={{ color: 'var(--icon-default)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--icon-default)'; }}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 pb-4">
                    <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                        You have uncommitted local changes that prevent {type === 'pull' ? 'pulling' : 'switching'}. Choose how to proceed:
                    </p>
                    <div className="space-y-2">
                        <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Commit Message</label>
                        <input
                            type="text"
                            value={commitMessage}
                            onChange={(e) => setCommitMessage(e.target.value)}
                            placeholder="e.g. WIP: save current progress"
                            disabled={processing}
                            className="w-full px-3 py-2 text-sm rounded-lg outline-none transition-all duration-150 box-border disabled:opacity-50"
                            style={{
                                backgroundColor: 'var(--bg-input)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-default)',
                            }}
                            onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                            onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-default)'}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 px-5 py-4" style={{ borderTop: '1px solid var(--border-default)' }}>
                    <button
                        onClick={handleClose}
                        disabled={processing}
                        className="px-3.5 py-1.5 text-sm font-medium rounded-lg transition-all duration-150 disabled:opacity-50"
                        style={{ color: 'var(--text-secondary)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleStash}
                        disabled={processing}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium rounded-lg transition-all duration-150 disabled:opacity-50"
                        style={{ backgroundColor: 'var(--warn-bg-muted)', color: 'var(--warn-text)', border: '1px solid var(--warn-border)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--warn-bg-active)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--warn-bg-muted)'; }}
                    >
                        {processing && <LoadingSpinner size={14} />}
                        Stash & {type === 'pull' ? 'Pull' : 'Switch'}
                    </button>
                    <button
                        onClick={handleCommit}
                        disabled={processing || !commitMessage.trim()}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: 'var(--accent-bg-muted)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)' }}
                        onMouseEnter={(e) => { if (!processing && commitMessage.trim()) e.currentTarget.style.backgroundColor = 'var(--accent-bg-active)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent-bg-muted)'; }}
                    >
                        {processing && <LoadingSpinner size={14} />}
                        Commit & {type === 'pull' ? 'Pull' : 'Switch'}
                    </button>
                </div>
            </div>
        </div>
    );
}
