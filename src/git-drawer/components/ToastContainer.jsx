import React from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useDrawer } from '../context/DrawerContext';

const iconMap = {
    success: CheckCircle,
    error: XCircle,
    info: Info,
    warning: AlertTriangle,
};

const colorMap = {
    success: { bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.2)', text: '#6ee7b7', icon: '#34d399' },
    error: { bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.2)', text: '#fca5a5', icon: '#f87171' },
    info: { bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.2)', text: '#93c5fd', icon: '#60a5fa' },
    warning: { bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.2)', text: '#fde68a', icon: '#fbbf24' },
};

export default function ToastContainer() {
    const { state, dispatch } = useDrawer();

    if (state.toasts.length === 0) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 100020,
            display: 'flex',
            flexDirection: 'column-reverse',
            gap: 8,
            maxWidth: 360,
        }}>
            {state.toasts.map((toast) => {
                const Icon = iconMap[toast.type] || Info;
                const colors = colorMap[toast.type] || colorMap.info;

                return (
                    <div
                        key={toast.id}
                        style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 10,
                            padding: '12px 14px',
                            borderRadius: 10,
                            border: `1px solid ${colors.border}`,
                            backgroundColor: colors.bg,
                            backdropFilter: 'blur(8px)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                            animation: 'slideInRight 0.25s ease-out',
                        }}
                    >
                        <Icon size={16} style={{ flexShrink: 0, marginTop: 1, color: colors.icon }} />
                        <p style={{
                            fontSize: 13,
                            lineHeight: 1.45,
                            flex: 1,
                            color: colors.text,
                            margin: 0,
                            fontWeight: 400,
                            letterSpacing: '-0.005em',
                        }}>
                            {toast.message}
                        </p>
                        <button
                            onClick={() => dispatch({ type: 'REMOVE_TOAST', payload: toast.id })}
                            style={{
                                flexShrink: 0,
                                color: colors.text,
                                opacity: 0.5,
                                padding: 2,
                                transition: 'opacity 150ms ease',
                                cursor: 'pointer',
                            }}
                        >
                            <X size={13} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
