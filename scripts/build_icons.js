import { existsSync, rmSync, mkdirSync, readdirSync, copyFileSync, writeFileSync, readFileSync, write } from 'fs';
import { join, basename, extname } from 'path';
import sharp from 'sharp';

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

async function flatCopy() {
  ensureEmptyDir(targetDir);

  const files = collectFiles(sourceDir);
  const seenNames = new Set();

  const manifest = {
    icons: {}
  };
  const complete = {
    icons: {}
  };

  for (const file of files) {
    const filename = basename(file, extname(file))
    manifest.icons[filename] = {};

    const subdir = file.slice(sourceDir.length + 1, file.length - basename(file).length - 1);
    if (subdir) {
      manifest.icons[filename].srcdir = subdir;
    }
    complete.icons[filename] = Object.assign({}, manifest.icons[filename]);
    complete.icons[filename].svg = readFileSync(file, {encoding: 'utf8'});

    if (seenNames.has(filename)) {
      throw new Error(`Filename collision detected: ${filename}`);
    }

    seenNames.add(filename);
    const baseDestPath = join(targetDir, filename);
    copyFileSync(file, baseDestPath + '.svg');
    writeFileSync(baseDestPath + '.15.png', await svgToPngData(file, 15));
    writeFileSync(baseDestPath + '.30.png', await svgToPngData(file, 30));
  }
  // sort icons by ID
  manifest.icons = Object.fromEntries(
    Object.entries(manifest.icons).sort(([keyA], [keyB]) =>
      keyA.localeCompare(keyB)
    )
  );
  complete.icons = Object.fromEntries(
    Object.entries(complete.icons).sort(([keyA], [keyB]) =>
      keyA.localeCompare(keyB)
    )
  );

  writeFileSync('dist/index.json', JSON.stringify(manifest));
  writeFileSync('dist/complete.json', JSON.stringify(complete));
  console.log(`Built ${files.length} icons`);
}

try {
  flatCopy();
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}


async function svgToPngData(svgPath, dim) {
  return await sharp(svgPath)
    .resize(dim, dim)
    .png()
    .toBuffer();
}