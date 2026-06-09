const esbuild = require('esbuild');

Promise.all([
    // Debug build
    esbuild.build({
        entryPoints: ['src/OncoGrid.js'],
        bundle: true,
        minify: false,
        outfile: 'dist/oncogrid-debug.js',
        format: 'iife',
        globalName: 'OncoGrid',
        platform: 'browser',
        define: { 'this': 'window' },   // ← fix: replace this with window
    }),
    // Minified build
    esbuild.build({
        entryPoints: ['src/OncoGrid.js'],
        bundle: true,
        minify: true,
        outfile: 'dist/oncogrid.min.js',
        format: 'iife',
        globalName: 'OncoGrid',
        platform: 'browser',
        define: { 'this': 'window' },   // ← fix
    }),
]).then(() => {
    console.log('Build complete.');
}).catch(() => process.exit(1));