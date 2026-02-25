const prefixSelector = require('postcss-prefix-selector');

module.exports = {
    plugins: {
        '@tailwindcss/postcss': {},
        autoprefixer: {},
        'postcss-prefix-selector': {
            prefix: '#git-branches-root',

            /**
             * Transform callback — dynamically determine prefix based on the source file.
             * This ensures:
             *   - git-drawer CSS → selectors scoped to #git-branches-root
             *   - dashboard CSS  → selectors scoped to #qa-assistant-dashboard
             *   - Already-scoped selectors (containing the root ID) are NOT double-prefixed
             *   - Admin bar selectors (#wpadminbar) are left global
             *   - @keyframes, @property, etc. are left untouched
             */
            transform(prefix, selector, prefixedSelector, filePath) {
                // Determine the correct prefix based on the file being processed
                const actualPrefix = (filePath && filePath.includes('git-drawer'))
                    ? '#git-branches-root'
                    : '#qa-assistant-dashboard';

                // Skip selectors that are already scoped to the root container
                if (selector.includes('#git-branches-root') || selector.includes('#qa-assistant-dashboard')) {
                    return selector;
                }

                // Skip admin bar selectors — these must remain global
                if (selector.includes('#wpadminbar')) {
                    return selector;
                }

                // Skip body/html/root selectors — replace them with the container
                if (selector === 'body' || selector === 'html' || selector === ':root') {
                    return actualPrefix;
                }

                // For :where(), :is() and similar pseudo-selectors on *, ::before, ::after
                // that are part of Tailwind's property fallbacks — skip these entirely
                // as they set up CSS custom property fallbacks and should remain global-ish
                // Actually, prefix them too so they only affect the scoped area
                if (selector.startsWith('*') || selector === '::backdrop' ||
                    selector === ':before' || selector === ':after' ||
                    selector === '::before' || selector === '::after') {
                    return `${actualPrefix} ${selector}`;
                }

                // Default: prefix the selector with the correct container
                return `${actualPrefix} ${selector}`;
            },

            // Don't prefix @keyframes and other at-rules
            exclude: [
                /^@keyframes/,
                /^@font-face/,
            ],
        },
    },
};
