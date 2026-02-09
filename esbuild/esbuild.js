const esbuild = require('@diplodoc/lint/esbuild');
const {sassPlugin} = require('esbuild-sass-plugin');
const external = Object.keys(require('../package.json').peerDependencies || {});

[
    {minify: false, outfile: 'build/plugin/index.js'},
    {minify: true, outfile: 'build/plugin/index.min.js'},
    {minify: true, format: 'cjs', outfile: 'build/plugin/cjs/index.min.js'},
].forEach((options) =>
    esbuild.build({
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
    }),
);

[
    {minify: false, outfile: 'build/runtime/index.js'},
    {minify: true, outfile: 'build/runtime/index.min.js'},
    {minify: true, format: 'cjs', outfile: 'build/runtime/cjs/index.min.js'},
].forEach((options) =>
    esbuild.build({
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
    }),
);
