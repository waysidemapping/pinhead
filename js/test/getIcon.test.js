import fs from "node:fs";
import { test } from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getIcon } from "../icon.js";
import { Resvg } from "@resvg/resvg-js";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

import { examples } from "./examples.js";

for (const example of examples) {
  test(`getIcon matches fixture for ${example.name}`, () => {
    const svg = getIcon(example.icon, example.properties);
    const resvg = new Resvg(svg, { fitTo: { mode: "zoom", value: 4 } });
    const rendered = resvg.render();
    // get pixels from writing & reading PNG for apples-to-apples comparison instead of using rendered.pixels
    const currentPixels = PNG.sync.read(rendered.asPng()).data;
    const { width, height } = rendered;

    const fixtureBuffer = readFileSync(
      join("test", "fixtures", `${example.name}.png`),
    );
    const fixturePng = PNG.sync.read(fixtureBuffer);

    assert.strictEqual(
      width,
      fixturePng.width,
      `Width mismatch for ${example.name}`,
    );
    assert.strictEqual(
      height,
      fixturePng.height,
      `Height mismatch for ${example.name}`,
    );

    const threshold = 0.1;

    const diff = new PNG({ height, width });
    const numDiffPixels = pixelmatch(
      currentPixels,
      fixturePng.data,
      diff.data,
      width,
      height,
      { threshold },
    );

    const totalPixels = width * height;
    const allowedDiff = Math.ceil(totalPixels * 0.0);

    if (numDiffPixels > allowedDiff) {
      fs.writeFileSync(
        join("test", "fixtures", `${example.name}-diff.png`),
        PNG.sync.write(diff),
      );
    }
    assert.ok(
      numDiffPixels <= allowedDiff,
      `Detected ${numDiffPixels} mismatched pixels for ${example.name} with threshold ${threshold}. Allowed: ${allowedDiff}`,
    );
  });
}
