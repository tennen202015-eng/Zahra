// Runs once after "npx cap add android": app icons, splash, and a permission list limited to notifications.
const fs = require('fs'), path = require('path');
const res = 'android/app/src/main/res', man = 'android/app/src/main/AndroidManifest.xml';
if (!fs.existsSync(man)) { console.error('Run "npx cap add android" first.'); process.exit(1); }

for (const d of fs.readdirSync(res)) { const f = path.join(res, d, 'splash.png'); if (fs.existsSync(f)) fs.unlinkSync(f); }
const copy = (s, d) => { for (const f of fs.readdirSync(s)) { const a = path.join(s, f), b = path.join(d, f);
  if (fs.statSync(a).isDirectory()) { fs.mkdirSync(b, { recursive: true }); copy(a, b); } else fs.copyFileSync(a, b); } };
copy('android-res', res);

let m = fs.readFileSync(man, 'utf8');
if (!m.includes('xmlns:tools')) m = m.replace('<manifest xmlns:android="http://schemas.android.com/apk/res/android"', '<manifest xmlns:android="http://schemas.android.com/apk/res/android" xmlns:tools="http://schemas.android.com/tools"');
const block = [
  '    <!-- The only permission the user is asked for -->',
  '    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />',
  '    <!-- Make sure nothing else is ever requested -->',
  ...['CAMERA', 'RECORD_AUDIO', 'ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION', 'READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE',
      'READ_MEDIA_IMAGES', 'READ_MEDIA_VIDEO', 'READ_MEDIA_AUDIO', 'READ_CONTACTS', 'READ_PHONE_STATE']
    .map(p => `    <uses-permission android:name="android.permission.${p}" tools:node="remove" />`)
].join('\n');
if (!m.includes('POST_NOTIFICATIONS')) m = m.replace('</manifest>', block + '\n</manifest>');
fs.writeFileSync(man, m);
console.log('android patched');
