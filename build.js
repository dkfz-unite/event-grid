// build.js
const browserify = require('browserify');
const fs = require('fs');
const path = require('path');

// Debug build
browserify('src/OncoGrid.js', { standalone: 'OncoGrid' })
    .bundle((err, buf) => {
        if (err) { console.error(err); process.exit(1); }
        fs.writeFileSync('dist/oncogrid-debug.js', buf);
        console.log('Debug build complete.');
    });

// Minified build
const { minify } = require('terser');
browserify('src/OncoGrid.js', { standalone: 'OncoGrid' })
    .bundle(async (err, buf) => {
        if (err) { console.error(err); process.exit(1); }
        const result = await minify(buf.toString());
        fs.writeFileSync('dist/oncogrid.min.js', result.code);
        console.log('Minified build complete.');
    });