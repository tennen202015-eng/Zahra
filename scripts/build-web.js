// Copies the app page plus everything it needs offline (Capacitor core, jsPDF, fonts) into www/.
const fs = require('fs'), path = require('path');
const out = 'www', nm = p => path.join('node_modules', p);
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'fonts', 'files'), { recursive: true });
fs.mkdirSync(path.join(out, 'lib'), { recursive: true });
fs.copyFileSync('src/app.html', path.join(out, 'index.html'));

const need = f => { if (!fs.existsSync(f)) { console.error('Missing file: ' + f + ' — run "npm install" first.'); process.exit(1); } return f; };
fs.copyFileSync(need(nm('@capacitor/core/dist/capacitor.js')), path.join(out, 'capacitor.js'));
fs.copyFileSync(need(nm('jspdf/dist/jspdf.umd.min.js')), path.join(out, 'lib', 'jspdf.umd.min.js'));

let css = '';
for (const [pkg, weights] of [['@fontsource/ibm-plex-sans-arabic', [400, 500, 600]], ['@fontsource/reem-kufi', [500, 700]]]) {
  for (const w of weights) { const f = nm(`${pkg}/${w}.css`); if (fs.existsSync(f)) css += fs.readFileSync(f, 'utf8') + '\n'; }
  for (const f of fs.readdirSync(need(nm(pkg + '/files')))) if (f.endsWith('.woff2')) fs.copyFileSync(nm(`${pkg}/files/${f}`), path.join(out, 'fonts', 'files', f));
}
css = css.replace(/url\((['"]?)(\.\/)?files\//g, 'url($1./files/').replace(/,\s*url\([^)]*\.woff['"]?\)\s*format\(['"]woff['"]\)/g, '');
fs.writeFileSync(path.join(out, 'fonts', 'fonts.css'), css);
console.log('www ready');
