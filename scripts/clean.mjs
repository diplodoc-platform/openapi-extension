#!/usr/bin/env node

/**
 * Cross-platform cleanup for build artifacts.
 *
 * This package runs CI on Windows/macOS/Linux. Avoid using `rm -rf` in npm scripts.
 */

import fs from 'node:fs';
import path from 'node:path';

/**
 * @param {string} relativePath
 * @returns {void}
 */
function removeIfExists(relativePath) {
    const fullPath = path.resolve(import.meta.dirname, '..', relativePath);
    fs.rmSync(fullPath, {force: true, recursive: true});
}

// Legacy build output directories that may exist in some setups.
removeIfExists('plugin');
removeIfExists('includer');
removeIfExists('runtime');
