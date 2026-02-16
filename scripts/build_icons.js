import { existsSync, rmSync, mkdirSync, readdirSync, copyFileSync, writeFileSync } from 'fs';
import { join, basename, extname } from 'path';

const sourceDir = 'icons';
const targetDir = 'dist/i';

function ensureEmptyDir(dir) {
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
  }
  mkdirSync(dir, { recursive: true });
}

function collectFiles(dir) {
  let results = [];
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(collectFiles(fullPath));
    } else if (entry.isFile() &&
      extname(entry.name).toLowerCase() === '.svg') {
      results.push(fullPath);
    }
  }

  return results;
}

function flatCopy() {
  ensureEmptyDir(targetDir);

  const files = collectFiles(sourceDir);
  const seenNames = new Set();

  const manifest = {
    icons: {}
  };

  for (const file of files) {
    const filename = basename(file, extname(file))
    manifest.icons[filename] = {};

    const subdir = file.slice(sourceDir.length + 1, file.length - basename(file).length - 1);
    if (subdir) {
      manifest.icons[filename].srcdir = subdir;
    }

    if (seenNames.has(filename)) {
      throw new Error(`Filename collision detected: ${filename}`);
    }

    seenNames.add(filename);
    const destPath = join(targetDir, filename) + '.svg';
    copyFileSync(file, destPath);
  }
  // sort icons by ID
  manifest.icons = Object.fromEntries(
    Object.entries(manifest.icons).sort(([keyA], [keyB]) =>
      keyA.localeCompare(keyB)
    )
  );

  writeFileSync('dist/index.json', JSON.stringify(manifest, null, 2));
  console.log(`${files.length} icons`);
}

try {
  flatCopy();
  console.log('Flat copy completed successfully.');
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}
