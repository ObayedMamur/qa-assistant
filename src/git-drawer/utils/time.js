/**
 * Shared time utility for the Git Branches Drawer.
 * Provides a human-readable relative time string from a Unix timestamp.
 */

/**
 * Convert a Unix timestamp (seconds) to a relative time string.
 *
 * @param {number|null} timestamp - Unix timestamp in seconds
 * @returns {string|null} Human-readable relative time, or null if no timestamp
 */
export function timeAgo(timestamp) {
    if (!timestamp) return null;
    const seconds = Math.floor(Date.now() / 1000 - timestamp);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}
