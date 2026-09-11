import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { getIcon } from "../index.js";

import { examples } from "../test/examples.js";

for (const example of examples) {
  console.log(`Generating fixture for ${example.name}...`);
  const svg = getIcon(example.icon, example.properties);
  writeFileSync(join("examples", `${example.name}.svg`), Buffer.from(svg));
}
