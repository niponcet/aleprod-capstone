const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// 1. Ensure Metro treats .wasm files as assets for expo-sqlite web worker
if (!config.resolver.assetExts.includes('wasm')) {
  config.resolver.assetExts.push('wasm');
}

// 2. Keep package exports enabled so Metro resolves conditional exports correctly
config.resolver.unstable_enablePackageExports = true;

// 3. Add cross-origin headers to support SharedArrayBuffer / OPFS operations used by wa-sqlite
config.server = config.server || {};
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    middleware(req, res, next);
  };
};

module.exports = config;
