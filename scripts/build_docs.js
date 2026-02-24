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
    if (existsSync(`${join(folderName, "dist/changelog.json")}`)) copyFileSync(`${join(folderName, "dist/changelog.json")}`, "docs/changelog.json")
  }

  rmSync(folderName, { recursive: true, force: true });

  console.log("Loaded icons from " + folderName);
}

const importSources = [
  {
    id: "maki",
    repo: "https://github.com/mapbox/maki.git",
    iconsPath: "icons",
  },
  {
    id: "nps",
    repo: "https://github.com/nationalparkservice/symbol-library.git",
    iconsPath: "src/standalone"
  },
  {
    id: "opentrailmap",
    repo: "https://github.com/osmus/opentrailmap.git",
    iconsPath: "style/sprites/svg"
  },
  {
    id: "osmcarto",
    repo: "https://github.com/openstreetmap-carto/openstreetmap-carto.git",
    iconsPath: "symbols"
  },
  {
    id: "temaki",
    repo: "https://github.com/rapideditor/temaki.git",
    iconsPath: "icons"
  }
];

function ensureEmptyDir(dir) {
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
  }
  mkdirSync(dir, { recursive: true });
}

ensureEmptyDir('tmp');
ensureEmptyDir('docs/srcicons');

for (const importSource of importSources) {
  execSync(`git clone ${importSource.repo} "tmp/${importSource.id}"`)
  const srcDir = join(`tmp/${importSource.id}`, importSource.iconsPath);
  execSync(`cp -r "${srcDir}/." "docs/srcicons/${importSource.id}"`);
}

rmSync('tmp', { recursive: true, force: true });