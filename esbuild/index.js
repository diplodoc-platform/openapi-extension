const esbuild = require('esbuild');
const {sassPlugin} = require('esbuild-sass-plugin');
const external = Object.keys(require('../package.json').peerDependencies || {});

[
    {minify: false, outfile: 'plugin/index.js'},
    {minify: true, outfile: 'plugin/index.min.js'},
].forEach((options) => esbuild.build({
    tsconfig: './tsconfig.json',
    platform: 'neutral',
    mainFields: ['module', 'main'],
    target: 'es6',
    bundle: true,
    sourcemap: true,
    entryPoints: ['src/plugin/index.ts'],
    ...options
}));

[
    {minify: false, outfile: 'runtime/index.js'},
    {minify: true, outfile: 'runtime/index.min.js'},
].forEach((options) => esbuild.build({
    tsconfig: './tsconfig.json',
    platform: 'neutral',
    mainFields: ['module', 'main'],
    target: 'es6',
    bundle: true,
    sourcemap: true,
    entryPoints: ['src/runtime/index.tsx'],
    external: external,
    plugins: [sassPlugin()],
    ...options
}));

esbuild.build({
    tsconfig: './tsconfig.json',
    platform: 'node',
    sourcemap: true,
    entryPoints: ['src/includer/index.ts'],
    outfile: 'includer/index.js',
});
