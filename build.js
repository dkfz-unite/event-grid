const esbuild = require('esbuild');

Promise.all([
    esbuild.build({
        entryPoints: ['src/OncoGrid.js'],
        bundle: true,
        minify: true,
        outfile: 'dist/oncogrid.min.js',
        format: 'iife',
        globalName: 'OncoGrid',
        platform: 'browser',
    }),
    esbuild.build({
        entryPoints: ['src/OncoGrid.js'],
        bundle: true,
        minify: false,
        outfile: 'dist/oncogrid-debug.js',
        format: 'iife',
        globalName: 'OncoGrid',
        platform: 'browser',
    }),
]).then(() => {
    console.log('Build complete.');
}).catch(() => process.exit(1));