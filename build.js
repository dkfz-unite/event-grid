// build.js
const browserify = require('browserify');
const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

const entry = path.resolve(__dirname, 'src/OncoGrid.js');

// Clean dist first to prevent browserify picking up old build artifacts
fs.mkdirSync('dist', { recursive: true });
['dist/oncogrid.min.js', 'dist/oncogrid-debug.js'].forEach(f => {
    if (fs.existsSync(f)) fs.unlinkSync(f);
});

browserify(entry, { standalone: 'OncoGrid' })
    .bundle(async (err, buf) => {
        if (err) { console.error(err); process.exit(1); }

        fs.writeFileSync('dist/oncogrid-debug.js', buf);
        console.log('Debug build complete.');

        const result = await minify(buf.toString());
        if (result.error) { console.error(result.error); process.exit(1); }
        fs.writeFileSync('dist/oncogrid.min.js', result.code);
        console.log('Minified build complete.');
    });