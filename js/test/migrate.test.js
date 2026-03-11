import { test } from "node:test";
import assert from "node:assert";
import { migrateName } from "../index.js";

test("migrateName pedestrian -> person_walking", () => {
  assert.strictEqual(migrateName("pedestrian"), "person_walking");
});

// Doesn't migrate names that are valid current names even if they previously meant something else
test("migrateName treasure_map -> treasure_map", () => {
  assert.strictEqual(migrateName("treasure_map"), "treasure_map");
});

test("migrateName pinhead@12:treasure_map -> treasure_map", () => {
  assert.strictEqual(
    migrateName("treasure_map", "pinhead@12"),
    "bifold_map_with_dotted_line_to_x",
  );
});

test("migrateName temaki:pedestrian -> person_walking", () => {
  assert.strictEqual(migrateName("pedestrian"), "person_walking");
});

test("migrateName osmcarto:shop/outdoor -> person_wearing_backpack_walking_with_hiking_pole", () => {
  assert.strictEqual(
    migrateName("shop/outdoor", "osmcarto"),
    "person_wearing_backpack_walking_with_hiking_pole",
  );
});
