import { existsSync, rmSync, mkdirSync, readdirSync, writeFileSync, readFileSync, createWriteStream, copyFileSync } from 'fs';
import { join, basename, extname } from 'path';
import archiver from 'archiver';

const sourceDir = 'icons';
const distIconsDir = 'qgis_plugin/icons/Pinhead Map Icons by Wayside Mapping';

const version = JSON.parse(readFileSync('package.json')).version;

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

function copySvgs() {
  ensureEmptyDir(distIconsDir);

  const files = collectFiles(sourceDir);
  const seenNames = new Set();

  for (const file of files) {
    const filename = basename(file, extname(file));
    if (seenNames.has(filename)) {
      throw new Error(`Filename collision detected: ${filename}`);
    }
    seenNames.add(filename);

    let svgString = readFileSync(file, {encoding: "utf8"});
    // Add SVG params needed for QGIS to know how to style the vector
    svgString = svgString.replaceAll(
      '<path ',
      '<path fill="param(fill) #888" stroke="param(outline) #000" stroke-width="param(outline-width) 0" fill-opacity="param(fill-opacity) 1" stroke-opacity="param(outline-opacity) 1" '
    );

    writeFileSync(join(distIconsDir, filename) + '.svg', svgString);
  }
  console.log(`Built ${files.length} icons`);
}

function copyTemplateFiles() {

  const placeholderMap = {
    '{{VERSION}}': version
  };
  const dir = 'qgis_plugin_template';

  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isFile()) {
      if (['.py', '.txt'].includes(extname(fullPath).toLowerCase())) {
        let string = readFileSync(fullPath, {encoding: "utf8"});
        for (const placeholder in placeholderMap) {
          string = string.replaceAll(placeholder, placeholderMap[placeholder]);
        }
        writeFileSync(join('qgis_plugin', entry.name), string);
      } else {
        copyFileSync(fullPath, join('qgis_plugin', entry.name));
      }
    }
  }
}

try {

  const destDir = "qgis_plugin/";
  copySvgs();
  copyTemplateFiles();

  const output = createWriteStream(`waysidemapping-pinhead-qgis-plugin-${version}.zip`);
  const archive = archiver("zip", { zlib: { level: 9 } });

  archive.pipe(output);
  archive.directory(destDir, "pinhead");
  await archive.finalize();

  rmSync(destDir, { recursive: true, force: true });

} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}
