import { execFileSync } from "child_process";
import { existsSync, renameSync, rmSync, copyFileSync, mkdirSync } from "fs";
import { join } from "path";
import { downloadExternalSourceAssets } from "../src/ExternalSourceManager.js";

const packageName = "@waysidemapping/pinhead";

const docsDir = 'docs/';

const version = execFileSync("npm", ["view", packageName, "version"], { encoding: "utf8" }).trim();
console.log('Building docs for Pinhead v' + version);
const currentMajorVersion = parseInt(version.split('.')[1]);

for (let i = 1; i <= currentMajorVersion; i+=1) {
  const targetDir = join(docsDir, `v${i}`);
  if (!existsSync(targetDir)) {
    ensureEmptyDir(targetDir);
    downloadLegacyIcons(i, targetDir);
    downloadLegacyFont(i, targetDir);
  }
}

downloadExternalSourceAssets(join(docsDir, 'srcicons'));

function downloadPackage(spec) {
  const file = execFileSync("npm", ["pack", spec, "--silent"], { encoding: "utf8" }).trim();
  const folderNameDownloaded = file.replace(/\.tgz$/, "");

  execFileSync("tar", ["-xzf", file], { stdio: "inherit" });

  if (!existsSync("package")) throw new Error("package/ folder not found after extraction.");

  renameSync("package", folderNameDownloaded);
  rmSync(file);

  return folderNameDownloaded;
}

function downloadLegacyIcons(majorVersion, targetDir) {
  const spec = parseInt(majorVersion) >= 15 ? packageName + "@~15." + majorVersion : packageName + "@^" + majorVersion;
  const folderName = downloadPackage(spec);

  const iconDir = join(folderName, "dist", "icons");
  if (!existsSync(iconDir)) throw new Error(`dist/icons not found in ${folderName}`);

  execFileSync("cp", ["-r", `${iconDir}/.`, targetDir]);
  execFileSync("cp", ["-r", `${iconDir}/.`, join(docsDir, 'latest')]);

  if (majorVersion === currentMajorVersion) {
    copyFileSync(join(folderName, "package.json"), join(docsDir, 'package.json'));
    if (existsSync(join(folderName, "dist/changelog.json"))) copyFileSync(join(folderName, "dist/changelog.json"), join(docsDir, 'changelog.json'));
    if (existsSync(join(folderName, "dist/external_sources.json"))) copyFileSync(join(folderName, "dist/external_sources.json"), join(docsDir, 'external_sources.json'));
    if (existsSync(join(folderName, "dist/categories.json"))) copyFileSync(join(folderName, "dist/categories.json"), join(docsDir, 'categories.json'));
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

function ensureEmptyDir(dir) {
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
  }
  mkdirSync(dir, { recursive: true });
}