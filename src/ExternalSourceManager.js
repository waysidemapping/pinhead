import { execSync } from "child_process";
import {
  readFileSync,
  existsSync,
  rmSync,
  mkdirSync,
  globSync,
  writeFileSync,
} from "fs";
import { join } from "path";

export function downloadExternalSourceAssets(toDir, overwrite) {
  const importSources = JSON.parse(
    readFileSync("metadata/external_sources.json"),
  );
  ensureEmptyDir("tmp");

  for (const importSource of importSources) {
    const targetDir = `${toDir}/${importSource.id}`;
    if (!existsSync(targetDir) || overwrite) {
      downloadExternalSourceIcons(importSource, targetDir);
    }
  }

  rmSync("tmp", { recursive: true, force: true });
}

function ensureEmptyDir(dir) {
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
  }
  mkdirSync(dir, { recursive: true });
}

function downloadExternalSourceIcons(importSource, targetDir) {
  ensureEmptyDir(targetDir);

  execSync(`git clone --depth 1 ${importSource.repo} "tmp/${importSource.id}"`);
  const srcDir = join(`tmp/${importSource.id}`, importSource.iconDir || "");
  execSync(`cp -r "${srcDir}/." "${targetDir}"`);

  const srciconsIndex = {};

  const ignoreFilesRegex =
    importSource.ignoreFiles && new RegExp(importSource.ignoreFiles);
  globSync(`${targetDir}/**/*.svg`).forEach((file) => {
    const id = file.slice(targetDir.length + 1, -4);
    if (
      importSource.filenameSuffix &&
      !id.endsWith(importSource.filenameSuffix)
    ) {
      return;
    }
    if (ignoreFilesRegex && ignoreFilesRegex.test(id)) {
      return;
    }
    srciconsIndex[id] = {};
  });
  writeFileSync(targetDir + "/index.json", JSON.stringify(srciconsIndex));
  console.log("Downloaded icons from source: " + importSource.id);
}
