const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const path = require('path');

module.exports = {
    ...defaultConfig,
    entry: {
        index: path.resolve(process.cwd(), 'src', 'index.js'),
        'git-drawer/index': path.resolve(process.cwd(), 'src', 'git-drawer', 'index.js'),
    },
};
