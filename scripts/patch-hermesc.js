// Postinstall: copy hermesc binaries from hermes-compiler npm package
// to react-native SDK directory. Fixes ES private class field support.
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'node_modules', 'hermes-compiler', 'hermesc');
const dstDir = path.join(__dirname, '..', 'node_modules', 'react-native', 'sdks', 'hermesc');

if (!fs.existsSync(srcDir)) {
  console.log('[patch-hermesc] source not found (skipping):', srcDir);
  process.exit(0);
}

if (!fs.existsSync(dstDir)) {
  console.log('[patch-hermesc] destination not found (skipping):', dstDir);
  process.exit(0);
}

function copyRecursive(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

copyRecursive(srcDir, dstDir);
console.log('[patch-hermesc] hermesc binaries patched from', srcDir, '->', dstDir);
