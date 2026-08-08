import { execFileSync } from "child_process";
import { join } from "path";
import { downloadExternalSourceAssets } from "../src/ExternalSourceManager.js";
import { downloadLegacyAssets } from "../src/LegacyAssetManager.js";

console.log("Building docs");

const docsDir = "docs/";

execFileSync("cp", ["-r", `src/.`, join(docsDir, `src`)]);
downloadExternalSourceAssets(join(docsDir, "srcicons"));
downloadLegacyAssets(docsDir);
