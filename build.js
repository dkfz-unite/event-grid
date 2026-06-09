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

        // Debug build
        fs.writeFileSync('dist/oncogrid-debug.js', buf);
        console.log('Debug build complete.');

        // Minified build — only after debug is done
        const result = await minify(buf.toString());
        if (result.error) { console.error(result.error); process.exit(1); }
        fs.writeFileSync('dist/oncogrid.min.js', result.code);
        console.log('Minified build complete.');
    });