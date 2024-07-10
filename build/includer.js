const glob = require('glob');
const path = require('node:path');
const esbuild = require('esbuild');

const IN_PATH = path.resolve('src', 'includer').replace(/\\/g, '/');
const OUT_PATH = 'includer';
const FORMATS = ['cjs', 'esm'];

const tsFiles = glob.sync(`${IN_PATH}/**/*.ts`);

const build = (files, format) => Promise.all(files.map((name) => {
    const newFilePath = path.resolve(OUT_PATH, format, name.substring(IN_PATH.length + 1));
    const jsFile = newFilePath.replace('.ts', '.js');

    return esbuild.build({
        format,
        target: 'es2016',
        entryPoints: [name],
        outfile: jsFile,
        packages: 'external',
    });
}));

Promise.all(FORMATS.map((format) => build(tsFiles, format)));
