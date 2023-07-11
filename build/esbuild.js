const esbuild = require('esbuild');
const {sassPlugin} = require('esbuild-sass-plugin');
const external = Object.keys(require('../package.json').peerDependencies || {});

[
    {minify: false, outfile: 'plugin/index.js'},
    {minify: true, outfile: 'plugin/index.min.js'},
    {minify: true, format: 'cjs', outfile: 'plugin/cjs/index.min.js'},
].forEach((options) => esbuild.build({
    tsconfig: './tsconfig.json',
    packages: 'external',
    platform: 'node',
    format: 'esm',
    mainFields: ['module', 'main'],
    target: 'es2016',
    bundle: true,
    sourcemap: true,
    entryPoints: ['src/plugin/index.ts'],
    ...options,
}));

[
    {minify: false, outfile: 'runtime/index.js'},
    {minify: true, outfile: 'runtime/index.min.js'},
    {minify: true, format: 'cjs', outfile: 'runtime/cjs/index.min.js'},
].forEach((options) => esbuild.build({
    tsconfig: './tsconfig.json',
    platform: 'neutral',
    mainFields: ['module', 'main'],
    target: 'es2016',
    format: 'esm',
    bundle: true,
    sourcemap: true,
    entryPoints: ['src/runtime/index.tsx'],
    external,
    plugins: [sassPlugin()],
    ...options,
}));
