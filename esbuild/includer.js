const glob = require('glob');
const path = require('node:path');
const esbuild = require('@diplodoc/lint/esbuild');

const IN_PATH = path.resolve('src', 'includer').replace(/\\/g, '/');
const OUT_PATH = 'build/includer';
const FORMATS = ['cjs', 'esm'];

const tsFiles = glob.sync(`${IN_PATH}/**/*.ts`).filter((filePath) => {
    const normalized = filePath.replace(/\\/g, '/');

    // Do not build tests into published artifacts (and avoid Vitest picking them up from build/).
    if (normalized.includes('/__tests__/')) {
        return false;
    }
    if (normalized.endsWith('.test.ts') || normalized.endsWith('.spec.ts')) {
        return false;
    }

    return true;
});

const build = (files, format) =>
    Promise.all(
        files.map((name) => {
            const newFilePath = path.resolve(OUT_PATH, format, name.substring(IN_PATH.length + 1));
            const jsFile = newFilePath.replace('.ts', '.js');

            return esbuild.build({
                format,
                target: 'es2016',
                entryPoints: [name],
                outfile: jsFile,
                packages: 'external',
            });
        }),
    );

Promise.all(FORMATS.map((format) => build(tsFiles, format)));
