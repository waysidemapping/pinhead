import { execSync, execFileSync } from "child_process";
import { join } from "path";
import { readFileSync, existsSync, rmSync, copyFileSync, mkdirSync } from "fs";

const version = JSON.parse(readFileSync("package.json")).version;
console.log("Building docs for Pinhead v" + version);
const majorVersion = parseInt(version.split(".")[1]);

copyFileSync("package.json", "docs/package.json");
copyFileSync("dist/changelog.json", "docs/changelog.json");
copyFileSync("dist/id_upgrades.json", "docs/id_upgrades.json");
copyFileSync("dist/external_sources.json", "docs/external_sources.json");
copyFileSync("dist/categories.json", "docs/categories.json");

ensureEmptyDir(`docs/v${majorVersion}`);
execSync(`cp -r "dist/icons/" 'docs/v${majorVersion}'`);

const latestDir = "docs/latest";
execFileSync("cp", ["-r", `dist/icons/.`, latestDir]);
const idUpgradePaths = JSON.parse(readFileSync("docs/id_upgrades.json"));
for (const historicalId in idUpgradePaths) {
  const latestId = idUpgradePaths[historicalId];
  copyFileSync(
    join(latestDir, `${latestId}.svg`),
    join(latestDir, `${historicalId}.svg`),
  );
}

function ensureEmptyDir(dir) {
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
  }
  mkdirSync(dir, { recursive: true });
}
