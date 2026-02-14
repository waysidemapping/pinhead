
import { existsSync, rmSync, mkdirSync, readdirSync, copyFileSync } from 'fs';
import { join, basename, extname } from 'path';

const sourceDir = './svg';
const targetDir = './dist/svg';

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

function flatCopy(source, target) {
  ensureEmptyDir(target);

  const files = collectFiles(source);
  const seenNames = new Set();

  for (const file of files) {
    const baseName = basename(file);

    if (seenNames.has(baseName)) {
      throw new Error(`Filename collision detected: ${baseName}`);
    }

    seenNames.add(baseName);
    const destPath = join(target, baseName);
    copyFileSync(file, destPath);
  }
  console.log(`${files.length} icons`);
}

try {
  flatCopy(sourceDir, targetDir);
  console.log('Flat copy completed successfully.');
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}
