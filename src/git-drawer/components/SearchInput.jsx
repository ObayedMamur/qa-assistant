import React, { useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useDrawer } from '../context/DrawerContext';

export default function SearchInput() {
    const { state, dispatch } = useDrawer();
    const inputRef = useRef(null);

    // '/' to focus, Escape to clear + blur
    useEffect(() => {
        const handler = (e) => {
            const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
            if (e.key === '/' && !isInput) {
                e.preventDefault();
                inputRef.current?.focus();
            }
            if (e.key === 'Escape' && document.activeElement === inputRef.current) {
                dispatch({ type: 'SET_SEARCH_QUERY', payload: '' });
                inputRef.current?.blur();
            }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [dispatch]);

    const handleClear = () => {
        dispatch({ type: 'SET_SEARCH_QUERY', payload: '' });
        inputRef.current?.focus();
    };

    return (
        <div style={{ padding: '12px 16px 8px', flexShrink: 0, boxSizing: 'border-box' }}>
            <div style={{ position: 'relative' }}>
                {/* Search icon */}
                <div style={{
                    position: 'absolute',
                    left: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    color: 'var(--icon-muted)',
                }}>
                    <Search size={14} />
                </div>

                <input
                    ref={inputRef}
                    type="text"
                    value={state.searchQuery}
                    onChange={(e) => dispatch({ type: 'SET_SEARCH_QUERY', payload: e.target.value })}
                    placeholder="Filter branches… (/)"
                    style={{
                        width: '100%',
                        paddingLeft: 32,
                        paddingRight: state.searchQuery ? 32 : 12,
                        paddingTop: 8,
                        paddingBottom: 8,
                        fontSize: 13,
                        borderRadius: 8,
                        backgroundColor: 'var(--bg-input)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-default)',
                        outline: 'none',
                        boxSizing: 'border-box',
                        fontFamily: 'inherit',
                        transition: 'border-color 150ms ease',
                    }}
                />

                {/* Clear button */}
                {state.searchQuery && (
                    <button
                        onClick={handleClear}
                        title="Clear search (Esc)"
                        style={{
                            position: 'absolute',
                            right: 8,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--icon-muted)',
                            padding: 2,
                            borderRadius: 4,
                            lineHeight: 1,
                        }}
                    >
                        <X size={13} />
                    </button>
                )}
            </div>
        </div>
    );
}
