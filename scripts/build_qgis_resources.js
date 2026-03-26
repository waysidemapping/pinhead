import { execSync } from "child_process";
import { readFileSync, existsSync, readdirSync, renameSync, rmSync, copyFileSync, mkdirSync, globSync, writeFileSync } from "fs";
import { basename, extname, join } from "path";

const changelogs = JSON.parse(readFileSync('metadata/changelog.json'));

const packageName = "@waysidemapping/pinhead";

const version = execSync(`npm view ${packageName} version`, { encoding: "utf8" }).trim();
console.log('Building QGIS resources for Pinhead v' + version);
const currentMajorVersion = parseInt(version.split('.')[1]);

const outputDir = 'qgis_resources_repo';
const collectionDir = outputDir + '/collections/pinhead';

const targetDir = collectionDir + '/svg';
ensureEmptyDir(targetDir);

for (let i = 1; i <= currentMajorVersion; i+=1) {  
  downloadLegacyIcons(i, targetDir);
}

copyFileSync('LICENSE', join(outputDir, `LICENSE`));
copyFileSync('LICENSE', join(collectionDir, `LICENSE`));
copyTemplateFiles('qgis_resources_repo_template', outputDir);

function downloadPackage(spec) {
  const file = execSync(`npm pack "${spec}" --silent`, { encoding: "utf8" }).trim();
  const folderName = file.replace(/\.tgz$/, "");

  execSync(`tar -xzf "${file}"`, { stdio: "inherit" });

  if (!existsSync("package")) throw new Error("package/ folder not found after extraction.");

  renameSync("package", folderName);
  rmSync(file);

  return folderName;
}

function downloadLegacyIcons(majorVersion, targetDir) {
  const spec = parseInt(majorVersion) >= 15 ? packageName + "@~15." + majorVersion : packageName + "@^" + majorVersion;
  const folderName = downloadPackage(spec);

  const iconDir = join(folderName, "dist", "icons");
  if (!existsSync(iconDir)) throw new Error(`dist/icons not found in ${folderName}`);

  copySvgs(iconDir, targetDir, majorVersion);

  rmSync(folderName, { recursive: true, force: true });

  console.log("Downloaded icons from " + folderName);
}

function copySvgs(sourceDir, destDir, majorVersion) {
  const changelog = changelogs.find(log => parseInt(log.majorVersion) === majorVersion);
  if (!changelog) throw new Error(`cannot find changelog for version ${majorVersion}`);
  const iconIds = new Set(changelog.iconChanges.map(change => change.newId).filter(Boolean));

  const files = Array.from(globSync(`${sourceDir}/**/*.svg`));
  for (const file of files) {
    const filename = basename(file, extname(file));
    if (iconIds.has(filename)) {
      let svgString = readFileSync(file, {encoding: "utf8"});
      // Add SVG params needed for QGIS to know how to style the vector
      svgString = svgString.replaceAll(
        '<path ',
        '<path fill="param(fill) #888" stroke="param(outline) #000" stroke-width="param(outline-width) 0" fill-opacity="param(fill-opacity) 1" stroke-opacity="param(outline-opacity) 1" '
      );
      writeFileSync(join(destDir, filename) + `.v${majorVersion}.svg`, svgString);
    }
  }
  console.log(`Built ${files.length} icons`);
}

function copyTemplateFiles(sourceDir, destDir) {
  const placeholderMap = {
    '{{VERSION}}': currentMajorVersion + '.0'
  };
  const entries = readdirSync(sourceDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(sourceDir, entry.name);
    if (entry.isFile()) {
      if (['.py', '.txt', '.md', '.ini'].includes(extname(fullPath).toLowerCase())) {
        let string = readFileSync(fullPath, {encoding: "utf8"});
        for (const placeholder in placeholderMap) {
          string = string.replaceAll(placeholder, placeholderMap[placeholder]);
        }
        writeFileSync(join(destDir, entry.name), string);
      } else {
        copyFileSync(fullPath, join(destDir, entry.name));
      }
    }
  }
}

function ensureEmptyDir(dir) {
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
  }
  mkdirSync(dir, { recursive: true });
}
