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
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

            {/* Modal */}
            <div className="relative w-full max-w-md mx-4 bg-[#161b22] border border-gray-700 rounded-xl shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/10">
                            <AlertTriangle size={16} className="text-amber-400" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-100">
                            Uncommitted Changes
                        </h3>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-200 transition-colors p-1 rounded-md hover:bg-gray-800"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 pb-4">
                    <p className="text-sm text-gray-400 mb-4">
                        You have uncommitted local changes that prevent {type === 'pull' ? 'pulling' : 'switching'}. Choose how to proceed:
                    </p>
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-400">Commit Message</label>
                        <input
                            type="text"
                            value={commitMessage}
                            onChange={(e) => setCommitMessage(e.target.value)}
                            placeholder="e.g. WIP: save current progress"
                            disabled={processing}
                            className="w-full px-3 py-2 text-sm rounded-lg
                                bg-gray-800/60 text-gray-200 placeholder-gray-500
                                border border-gray-700 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20
                                outline-none transition-all duration-150 box-border
                                disabled:opacity-50"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-800">
                    <button
                        onClick={handleClose}
                        disabled={processing}
                        className="px-3.5 py-1.5 text-sm font-medium rounded-lg
                            text-gray-400 hover:text-gray-200 hover:bg-gray-800
                            transition-all duration-150 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleStash}
                        disabled={processing}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium rounded-lg
                            bg-amber-500/15 text-amber-300 border border-amber-500/30
                            hover:bg-amber-500/25 hover:text-amber-200
                            transition-all duration-150 disabled:opacity-50"
                    >
                        {processing && <LoadingSpinner size={14} />}
                        Stash & {type === 'pull' ? 'Pull' : 'Switch'}
                    </button>
                    <button
                        onClick={handleCommit}
                        disabled={processing || !commitMessage.trim()}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium rounded-lg
                            bg-indigo-500/15 text-indigo-300 border border-indigo-500/30
                            hover:bg-indigo-500/25 hover:text-indigo-200
                            transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {processing && <LoadingSpinner size={14} />}
                        Commit & {type === 'pull' ? 'Pull' : 'Switch'}
                    </button>
                </div>
            </div>
        </div>
    );
}
