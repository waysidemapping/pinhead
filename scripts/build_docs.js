import { execSync } from "child_process";
import { readFileSync, existsSync, renameSync, rmSync, copyFileSync, mkdirSync, globSync, writeFileSync } from "fs";
import { join } from "path";

const packageName = "@waysidemapping/pinhead";

const version = execSync(`npm view ${packageName} version`, { encoding: "utf8" }).trim();
console.log('Building docs for Pinhead v' + version);
const currentMajorVersion = parseInt(version.split('.')[0]);

for (let i = 1; i <= currentMajorVersion; i+=1) {
  downloadLegacyIcons(i);
}

function downloadLegacyIcons(majorVersion) {
  const spec = packageName + "@^" + majorVersion;
  const file = execSync(`npm pack "${spec}" --silent`, { encoding: "utf8" }).trim();
  const folderName = file.replace(/\.tgz$/, "");

  execSync(`tar -xzf "${file}"`, { stdio: "inherit" });

  if (!existsSync("package")) throw new Error("package/ folder not found after extraction.");

  renameSync("package", folderName);
  rmSync(file);

  const iconDir = join(folderName, "dist", "icons");
  if (!existsSync(iconDir)) throw new Error(`dist/icons not found in ${folderName}`);

  const targetDir = 'docs/v' + majorVersion;
  mkdirSync(targetDir, { recursive: true });
  execSync(`cp -r "${iconDir}/." "${targetDir}"`);

  if (majorVersion === currentMajorVersion) {
    copyFileSync(`${join(folderName, "package.json")}`, "docs/package.json");
    if (existsSync(`${join(folderName, "dist/changelog.json")}`)) copyFileSync(`${join(folderName, "dist/changelog.json")}`, "docs/changelog.json");
    if (existsSync(`${join(folderName, "dist/external_sources.json")}`)) copyFileSync(`${join(folderName, "dist/external_sources.json")}`, "docs/external_sources.json");
  }

  rmSync(folderName, { recursive: true, force: true });

  console.log("Loaded icons from " + folderName);
}

const importSources = JSON.parse(readFileSync('metadata/external_sources.json'));

function ensureEmptyDir(dir) {
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
  }
  mkdirSync(dir, { recursive: true });
}

ensureEmptyDir('tmp');
ensureEmptyDir('docs/srcicons');

const srciconsIndex = {};

for (const importSource of importSources) {
  execSync(`git clone --depth 1 ${importSource.repo} "tmp/${importSource.id}"`)
  const srcDir = join(`tmp/${importSource.id}`, importSource.iconDir);
  const targetDir = `docs/srcicons/${importSource.id}`;
  execSync(`cp -r "${srcDir}/." "${targetDir}"`);

  srciconsIndex[importSource.id] = {};

  const ignoreFilesRegex = importSource.ignoreFiles && new RegExp(importSource.ignoreFiles);
  globSync(`${targetDir}/**/*.svg`).forEach(file => {
    const id = file.slice(targetDir.length + 1, -4);
    if (importSource.filenameSuffix && !id.endsWith(importSource.filenameSuffix)) {
      return;
    }
    if (ignoreFilesRegex && ignoreFilesRegex.test(id)) {
      return;
    }
    srciconsIndex[importSource.id][id] = {};
  });
}

writeFileSync('docs/srcicons/index.json', JSON.stringify(srciconsIndex));

rmSync('tmp', { recursive: true, force: true });