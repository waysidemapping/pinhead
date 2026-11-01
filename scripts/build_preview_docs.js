import { execSync, execFileSync } from "child_process";
import { join } from "path";
import {
  readFileSync,
  existsSync,
  rmSync,
  copyFileSync,
  mkdirSync,
  writeFileSync,
} from "fs";
import { downloadExternalSourceAssets } from "../src/ExternalSourceManager.js";
import { downloadLegacyAssets } from "../src/LegacyAssetManager.js";

const docsDir = "docs/";

execFileSync("cp", ["-r", `src/.`, join(docsDir, `src`)]);

downloadLegacyAssets(docsDir);

const importSources = JSON.parse(readFileSync("dist/external_sources.json"));
downloadExternalSourceAssets(importSources, join(docsDir, "srcicons"));

mkdirSync(join(docsDir, "modules"), { recursive: true });
execFileSync("cp", [
  "-r",
  `node_modules/pluralize/.`,
  join(docsDir, `modules/pluralize`),
]);

const npmPublishDates = execFileSync(
  "npm",
  ["view", "@waysidemapping/pinhead", "time", "--json"],
  {
    encoding: "utf8",
  },
);
writeFileSync(join(docsDir, `npm_publish_dates.json`), npmPublishDates);

const version = JSON.parse(readFileSync("package.json")).version;
console.log("Building docs for Pinhead v" + version);
const majorVersion = parseInt(version.split(".")[1]);

copyFileSync("package.json", join(docsDir, "package.json"));
copyFileSync("dist/changelog.json", join(docsDir, "changelog.json"));
copyFileSync("dist/id_upgrades.json", join(docsDir, "id_upgrades.json"));
copyFileSync(
  "dist/external_sources.json",
  join(docsDir, "external_sources.json"),
);
copyFileSync("dist/id_metadata.json", join(docsDir, "id_metadata.json"));

const devIconsDir = join(docsDir, `v${majorVersion}`);
ensureEmptyDir(devIconsDir);
execSync(`cp -r "dist/icons/" '${devIconsDir}'`);

const latestDir = join(docsDir, "latest");
execFileSync("cp", ["-r", `dist/icons/.`, latestDir]);
const idUpgradePaths = JSON.parse(
  readFileSync(join(docsDir, "id_upgrades.json")),
);
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
