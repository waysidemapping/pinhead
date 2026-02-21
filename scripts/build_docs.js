import { execSync } from "child_process";
import { existsSync, renameSync, rmSync, copyFileSync, mkdirSync } from "fs";
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

  const iconsPath = join(folderName, "dist", "icons");
  if (!existsSync(iconsPath)) throw new Error(`dist/icons not found in ${folderName}`);

  const targetDir = 'docs/v' + majorVersion;
  mkdirSync(targetDir, { recursive: true });
  execSync(`cp -r "${iconsPath}/." "${targetDir}"`);

  if (majorVersion === currentMajorVersion) {
    copyFileSync(`${join(folderName, "package.json")}`, "docs/package.json")
    copyFileSync(`${join(folderName, "dist/migrations.json")}`, "docs/migrations.json")
  }

  rmSync(folderName, { recursive: true, force: true });

  console.log("Loaded icons from " + folderName);
}