import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './main.css';

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('git-branches-root');
    if (!container) return;

    const root = createRoot(container);
    root.render(<App />);

    // Listen for admin bar trigger click
    document.addEventListener('click', (e) => {
        const trigger = e.target.closest('.qa-git-drawer-trigger');
        if (trigger) {
            e.preventDefault();
            e.stopPropagation();
            // Dispatch custom event that App listens for
            window.dispatchEvent(new CustomEvent('qa-git-drawer-toggle'));
        }
    });
});
