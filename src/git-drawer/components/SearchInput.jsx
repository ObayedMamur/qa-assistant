import React from 'react';
import { Search } from 'lucide-react';
import { useDrawer } from '../context/DrawerContext';

export default function SearchInput() {
    const { state, dispatch } = useDrawer();

    return (
        <div style={{ padding: '12px 16px 8px', flexShrink: 0, boxSizing: 'border-box' }}>
            <div style={{ position: 'relative' }}>
                <div style={{
                    position: 'absolute',
                    left: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#8b949e',
                }}>
                    <Search size={14} />
                </div>
                <input
                    type="text"
                    value={state.searchQuery}
                    onChange={(e) => dispatch({ type: 'SET_SEARCH_QUERY', payload: e.target.value })}
                    placeholder="Filter branches…"
                    style={{
                        width: '100%',
                        paddingLeft: 32,
                        paddingRight: 12,
                        paddingTop: 8,
                        paddingBottom: 8,
                        fontSize: 13,
                        borderRadius: 8,
                        backgroundColor: 'rgba(22,27,34,0.8)',
                        color: '#e6edf3',
                        border: '1px solid #30363d',
                        outline: 'none',
                        boxSizing: 'border-box',
                        fontFamily: 'inherit',
                    }}
                />
            </div>
        </div>
    );
}
