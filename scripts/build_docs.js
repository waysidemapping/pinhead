import { execFileSync } from "child_process";
import { join } from "path";
import { writeFileSync, mkdirSync } from "fs";
import { downloadExternalSourceAssets } from "../src/ExternalSourceManager.js";
import { downloadLegacyAssets } from "../src/LegacyAssetManager.js";

console.log("Building docs");

const docsDir = "docs/";

execFileSync("cp", ["-r", `src/.`, join(docsDir, `src`)]);
downloadExternalSourceAssets(join(docsDir, "srcicons"));
downloadLegacyAssets(docsDir);

mkdirSync(join(docsDir, "modules"), { recursive: true });
execFileSync("cp", [
  "-r",
  `node_modules/pluralize/.`,
  join(docsDir, `modules/pluralize`),
]);

execFileSync("cp", [
  `metadata/categories.json`,
  join(docsDir, `categories.json`),
]);

const npmPublishDates = execFileSync(
  "npm",
  ["view", "@waysidemapping/pinhead", "time", "--json"],
  {
    encoding: "utf8",
  },
);
writeFileSync(join(docsDir, `npm_publish_dates.json`), npmPublishDates);

console.log("Done building docs");
