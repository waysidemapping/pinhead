import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { getSprite } from "../index.js";
import { Resvg } from "@resvg/resvg-js";

import { examples } from "./examples.js";

for (const example of examples) {
  console.log(`Generating fixture for ${example.name}...`);
  const svg = getSprite(example.icon, example.properties);
  const resvg = new Resvg(svg, { fitTo: { mode: "zoom", value: 4 } });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  writeFileSync(join("test", "fixtures", `${example.name}.png`), pngBuffer);
}
