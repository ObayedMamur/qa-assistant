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
    success: { bg: 'var(--success-bg-muted)', border: 'var(--success-border)', text: 'var(--success-text)', icon: 'var(--success-primary)' },
    error: { bg: 'var(--error-bg-muted)', border: 'var(--error-border)', text: 'var(--error-text)', icon: 'var(--error-primary)' },
    info: { bg: 'var(--info-bg-muted)', border: 'var(--info-border)', text: 'var(--info-text)', icon: 'var(--info-primary)' },
    warning: { bg: 'var(--warn-bg-muted)', border: 'var(--warn-border)', text: 'var(--warn-text)', icon: 'var(--warn-primary)' },
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
                            boxShadow: '0 8px 24px var(--overlay-bg)',
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
