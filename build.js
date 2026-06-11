// build.js
const browserify = require('browserify');
const fs = require('fs');
const path = require('path');
const { minify } = require('terser');
const entry = path.resolve(__dirname, 'src/index.js');

fs.mkdirSync('dist', { recursive: true });

browserify(entry, { standalone: 'UniteOncoGrid' })  // <-- changed
    .bundle(async (err, buf) => {
        if (err) { console.error(err); process.exit(1); }

        const debugSource = buf.toString();
        fs.writeFileSync('dist/oncogrid-debug.js', debugSource);
        console.log('Debug build complete.');

        const result = await minify(debugSource, {
            compress: {
                toplevel: false,
                passes: 1,
            },
            mangle: {
                toplevel: false,
                reserved: ['UniteOncoGrid'],
                keep_fnames: true,
            },
            format: {
                wrap_iife: false,
            },
        });

        if (result.error) { console.error(result.error); process.exit(1); }
        fs.writeFileSync('dist/oncogrid.min.js', result.code);
        console.log('Minified build complete.');

        if (!result.code.includes('UniteOncoGrid')) {  // <-- changed
            console.error('WARNING: UniteOncoGrid name not found in minified output!');
        } else {
            console.log('Sanity check passed: UniteOncoGrid present in minified output.');
        }
    });