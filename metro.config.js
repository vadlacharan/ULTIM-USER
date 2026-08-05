const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

// Optimize file watching for macOS to avoid EMFILE errors
config.watcher = {
  healthCheck: {
    enabled: true,
  },
};

module.exports = config;
