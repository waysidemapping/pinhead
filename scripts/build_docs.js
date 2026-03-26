import { execSync } from "child_process";
import { readFileSync, existsSync, renameSync, rmSync, copyFileSync, mkdirSync, globSync, writeFileSync } from "fs";
import { join } from "path";

const packageName = "@waysidemapping/pinhead";

const version = execSync(`npm view ${packageName} version`, { encoding: "utf8" }).trim();
console.log('Building docs for Pinhead v' + version);
const currentMajorVersion = parseInt(version.split('.')[1]);

for (let i = 1; i <= currentMajorVersion; i+=1) {
  const targetDir = 'docs/v' + i;
  if (!existsSync(targetDir)) {
    ensureEmptyDir(targetDir);
    downloadLegacyIcons(i, targetDir);
    downloadLegacyFont(i, targetDir);
  }
}

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

  execSync(`cp -r "${iconDir}/." "${targetDir}"`);

  if (majorVersion === currentMajorVersion) {
    copyFileSync(`${join(folderName, "package.json")}`, "docs/package.json");
    if (existsSync(`${join(folderName, "dist/changelog.json")}`)) copyFileSync(`${join(folderName, "dist/changelog.json")}`, "docs/changelog.json");
    if (existsSync(`${join(folderName, "dist/external_sources.json")}`)) copyFileSync(`${join(folderName, "dist/external_sources.json")}`, "docs/external_sources.json");
  }

  rmSync(folderName, { recursive: true, force: true });

  console.log("Downloaded icons from " + folderName);
}

function downloadLegacyFont(majorVersion, targetDir) {
  if (parseInt(majorVersion) < 19) return;

  const spec = `${packageName}-font@~1.${majorVersion}`;
  const folderName = downloadPackage(spec);

  copyFileSync(join(folderName, "pinhead.css"), join(targetDir, "pinhead.css"));
  copyFileSync(join(folderName, "pinhead.ttf"), join(targetDir, "pinhead.ttf"));
  copyFileSync(join(folderName, "preview.html"), join(targetDir, "font_preview.html"));

  rmSync(folderName, { recursive: true, force: true });

  console.log("Downloaded font from " + folderName);
}

const importSources = JSON.parse(readFileSync('metadata/external_sources.json'));

function ensureEmptyDir(dir) {
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
  }
  mkdirSync(dir, { recursive: true });
}

ensureEmptyDir('tmp');

for (const importSource of importSources) {
  const targetDir = `docs/srcicons/${importSource.id}`;
  if (!existsSync(targetDir)) {
    downloadExternalSourceIcons(importSource, targetDir);
  }
}

function downloadExternalSourceIcons(importSource, targetDir) {
  ensureEmptyDir(targetDir);

  execSync(`git clone --depth 1 ${importSource.repo} "tmp/${importSource.id}"`)
  const srcDir = join(`tmp/${importSource.id}`, importSource.iconDir || "");
  execSync(`cp -r "${srcDir}/." "${targetDir}"`);

  const srciconsIndex = {};

  const ignoreFilesRegex = importSource.ignoreFiles && new RegExp(importSource.ignoreFiles);
  globSync(`${targetDir}/**/*.svg`).forEach(file => {
    const id = file.slice(targetDir.length + 1, -4);
    if (importSource.filenameSuffix && !id.endsWith(importSource.filenameSuffix)) {
      return;
    }
    if (ignoreFilesRegex && ignoreFilesRegex.test(id)) {
      return;
    }
    srciconsIndex[id] = {};
  });
  writeFileSync(targetDir + '/index.json', JSON.stringify(srciconsIndex));
  console.log("Downloaded icons from source: " + importSource.id);
}

rmSync('tmp', { recursive: true, force: true });