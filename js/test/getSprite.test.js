import fs from "node:fs";
import { test } from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getSprite } from "../index.js";
import { Resvg } from "@resvg/resvg-js";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

export const examples = [
  {
    name: "jeep-map_pin-stroke-1",
    icon: "jeep",
    properties: { shape: "map_pin", strokeWidth: 1 },
  },
  {
    name: "cargobike-square-blue",
    icon: "cargobike",
    properties: { shape: "square", shapeFill: "#6486f5" },
  },
  {
    name: "bike-circle-green",
    icon: "bicycle",
    properties: {
      shape: "circle",
      strokeWidth: 1,
      stroke: "#6dad6f",
      fill: "#6dad6f",
      shapeFill: "white",
    },
  },
  {
    name: "burger-marker",
    icon: "burger",
    properties: { shape: "marker", shapeFill: "#3FB1CE" },
  },
  {
    name: "cafe-black-stroke",
    icon: "cup_and_saucer",
    properties: { strokeWidth: 1 },
  },
  { name: "cargobike", icon: "cargobike", properties: {} },
  { name: "dot", icon: "dot", properties: {} },
  {
    name: "sun-square-yellow",
    icon: "sun",
    properties: {
      shape: "square",
      cornerRadius: 7,
      shapeFill: "yellow",
      strokeWidth: 1,
    },
  },
  {
    name: "plane-square-navy",
    icon: "plane",
    properties: { shape: "square", cornerRadius: 0, shapeFill: "navy" },
  },
  {
    name: "ice_cream-circle-pink",
    icon: "ice_cream_on_cone",
    properties: { shape: "circle", shapeFill: "pink" },
  },
  {
    name: "beer-marker-amber",
    icon: "beer_mug_with_foam",
    properties: { shape: "marker", shapeFill: "#FFBF00" },
  },
  {
    name: "rocket-map_pin-purple",
    icon: "rocketship",
    properties: { shape: "map_pin", shapeFill: "purple" },
  },
  {
    name: "pizza-square-red",
    icon: "pizza_slice",
    properties: { shape: "square", shapeFill: "red" },
  },
  {
    name: "bus-circle-blue",
    icon: "bus",
    properties: { shape: "circle", shapeFill: "blue" },
  },
  {
    name: "camera-marker-darkgrey",
    icon: "camera",
    properties: { shape: "marker", shapeFill: "#333" },
  },
  {
    name: "tree-map_pin-green",
    icon: "conifer_tree",
    properties: { shape: "map_pin", shapeFill: "darkgreen" },
  },
  {
    name: "tent-square-brown",
    icon: "a_frame_tent",
    properties: { shape: "square", shapeFill: "brown" },
  },
];

for (const example of examples) {
  test(`getSprite matches fixture for ${example.name}`, () => {
    const svg = getSprite(example.icon, example.properties);
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
