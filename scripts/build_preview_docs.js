import { execSync } from "child_process";
import { readFileSync, existsSync, rmSync, copyFileSync, mkdirSync } from "fs";

const version = JSON.parse(readFileSync('package.json')).version;
console.log('Building docs for Pinhead v' + version);
const majorVersion = parseInt(version.split('.')[1]);

copyFileSync('package.json', "docs/package.json");
copyFileSync('metadata/changelog.json', "docs/changelog.json");
copyFileSync('metadata/external_sources.json', "docs/external_sources.json");

ensureEmptyDir(`docs/v${majorVersion}`);
execSync(`cp -r "dist/icons/" 'docs/v${majorVersion}'`);

function ensureEmptyDir(dir) {
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
  }
  mkdirSync(dir, { recursive: true });
}