// build.js
const browserify = require('browserify');
const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

const entry = path.resolve(__dirname, 'src/OncoGrid.js');

fs.mkdirSync('dist', { recursive: true });

browserify(entry, { standalone: 'OncoGrid' })
    .bundle(async (err, buf) => {
            if (err) { console.error(err); process.exit(1); }

            const debugSource = buf.toString();
            fs.writeFileSync('dist/oncogrid-debug.js', debugSource);
            console.log('Debug build complete.');

            const result = await minify(debugSource, {
                    compress: {
                            // prevent terser from removing the global assignment
                            // in the UMD wrapper
                            toplevel: false,
                            passes: 1,
                    },
                    mangle: {
                            // do not mangle top-level names — the UMD wrapper
                            // uses 'OncoGrid' as a string key so it's safe,
                            // but reserved list is a safety net
                            toplevel: false,
                            reserved: ['OncoGrid'],
                    },
                    format: {
                            // helps preserve the wrapping structure
                            wrap_iife: true,
                    },
            });

            if (result.error) { console.error(result.error); process.exit(1); }
            fs.writeFileSync('dist/oncogrid.min.js', result.code);
            console.log('Minified build complete.');

            // quick sanity check
            if (!result.code.includes('OncoGrid')) {
                    console.error('WARNING: OncoGrid name not found in minified output!');
            } else {
                    console.log('Sanity check passed: OncoGrid present in minified output.');
            }
    });