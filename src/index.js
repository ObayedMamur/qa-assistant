import React from 'react';
import { createRoot } from 'react-dom/client';
import QAAssistantDashboard from './QAAssistantDashboard';
import './main.css';

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('qa-assistant-dashboard');
    if (container) {
        const root = createRoot(container);
        root.render(<QAAssistantDashboard />);
    }
});
