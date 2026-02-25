import React, { useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DrawerProvider, useDrawer } from './context/DrawerContext';
import Header from './components/Header';
import RepositoryList from './components/RepositoryList';
import BranchList from './components/BranchList';
import UncommittedModal from './components/UncommittedModal';
import ToastContainer from './components/ToastContainer';

function DrawerInner() {
    const { state, dispatch, loadRepositories, loadBranches } = useDrawer();
    const { isOpen, selectedRepository } = state;

    // Listen for the toggle event from entry point
    const handleToggle = useCallback(() => {
        if (isOpen) {
            dispatch({ type: 'CLOSE_DRAWER' });
        } else {
            dispatch({ type: 'OPEN_DRAWER' });
        }
    }, [isOpen, dispatch]);

    useEffect(() => {
        window.addEventListener('qa-git-drawer-toggle', handleToggle);
        return () => window.removeEventListener('qa-git-drawer-toggle', handleToggle);
    }, [handleToggle]);

    // Load repos when drawer opens
    useEffect(() => {
        if (isOpen) {
            loadRepositories();
        }
    }, [isOpen, loadRepositories]);

    // Load branches when repo is selected  
    useEffect(() => {
        if (isOpen && selectedRepository) {
            loadBranches(selectedRepository.slug);
        }
    }, [isOpen, selectedRepository?.slug]);

    // ESC key handler
    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                dispatch({ type: 'CLOSE_DRAWER' });
            }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [isOpen, dispatch]);

    // Lock body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Overlay */}
                        <motion.div
                            key="overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => dispatch({ type: 'CLOSE_DRAWER' })}
                            className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-[100000]"
                            style={{ position: 'fixed' }}
                        />

                        {/* Drawer Panel */}
                        <motion.div
                            key="drawer"
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="fixed top-0 right-0 h-screen w-[640px] max-w-[90vw] z-[100001]
                                bg-[#0d1117] border-l border-gray-800 shadow-2xl
                                flex flex-col box-border"
                            style={{ position: 'fixed' }}
                        >
                            {/* Header */}
                            <Header />

                            {/* Content — Repo sidebar + Branch panel */}
                            <div className="flex flex-1 min-h-0 overflow-hidden">
                                {/* Repository Sidebar (30%) */}
                                <div className="w-[30%] border-r border-gray-800 flex flex-col min-h-0 bg-[#0d1117]">
                                    <RepositoryList />
                                </div>

                                {/* Branch Panel (70%) */}
                                <div className="w-[70%] flex flex-col min-h-0 bg-[#0d1117]">
                                    <BranchList />
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Uncommitted Changes Modal */}
            <UncommittedModal />

            {/* Toast Notifications */}
            <ToastContainer />


        </>
    );
}

export default function App() {
    return (
        <DrawerProvider>
            <DrawerInner />
        </DrawerProvider>
    );
}
