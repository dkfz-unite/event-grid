// build.js
const browserify = require('browserify');
const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

const entry = path.resolve(__dirname, 'src/OncoGrid.js');

// Debug build
browserify(entry, { standalone: 'OncoGrid' })
    .bundle((err, buf) => {
        if (err) { console.error(err); process.exit(1); }
        fs.mkdirSync('dist', { recursive: true });
        fs.writeFileSync('dist/oncogrid-debug.js', buf);
        console.log('Debug build complete.');
    });

// Minified build
browserify(entry, { standalone: 'OncoGrid' })
    .bundle(async (err, buf) => {
        if (err) { console.error(err); process.exit(1); }
        const result = await minify(buf.toString());
        fs.mkdirSync('dist', { recursive: true });
        fs.writeFileSync('dist/oncogrid.min.js', result.code);
        console.log('Minified build complete.');
    });