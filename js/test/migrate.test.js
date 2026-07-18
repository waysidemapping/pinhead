import { test } from "node:test";
import assert from "node:assert";
import { nameExistsInVersion, migrateName } from "../migrate.js";

// Handle rename
test("nameExistsInVersion pedestrian v10 -> false", () => {
  assert.strictEqual(nameExistsInVersion("pedestrian", 10), false);
});
test("nameExistsInVersion pedestrian v1 -> true", () => {
  assert.strictEqual(nameExistsInVersion("pedestrian", 1), true);
});

// Handle rename to make room for replacement
test("nameExistsInVersion treasure_map v12 -> true", () => {
  assert.strictEqual(nameExistsInVersion("treasure_map", 10), true);
});
test("nameExistsInVersion treasure_map v13 -> true", () => {
  assert.strictEqual(nameExistsInVersion("treasure_map", 1), true);
});

// Don't find old names that aren't valid in requested version
test("nameExistsInVersion bifold_map_with_dotted_line_to_x v12 -> false", () => {
  assert.strictEqual(
    nameExistsInVersion("bifold_map_with_dotted_line_to_x", 12),
    false,
  );
});
test("nameExistsInVersion person_swinging_golf_club_beside_golf_pin v5 -> false", () => {
  assert.strictEqual(
    nameExistsInVersion("person_swinging_golf_club_beside_golf_pin", 5),
    false,
  );
});
test("nameExistsInVersion person_swinging_golf_club_beside_golf_pin v6 -> true", () => {
  assert.strictEqual(
    nameExistsInVersion("person_swinging_golf_club_beside_golf_pin", 6),
    true,
  );
});
test("nameExistsInVersion person_swinging_golf_club_beside_golf_pin v9 -> true", () => {
  assert.strictEqual(
    nameExistsInVersion("person_swinging_golf_club_beside_golf_pin", 9),
    true,
  );
});
test("nameExistsInVersion person_swinging_golf_club_beside_golf_pin v10 -> false", () => {
  assert.strictEqual(
    nameExistsInVersion("person_swinging_golf_club_beside_golf_pin", 10),
    false,
  );
});

test("migrateName pedestrian -> person_walking", () => {
  assert.strictEqual(migrateName("pedestrian"), "person_walking");
});

// Doesn't migrate names that are valid current names even if they previously meant something else
test("migrateName treasure_map -> treasure_map", () => {
  assert.strictEqual(migrateName("treasure_map"), "treasure_map");
});

test("migrateName pinhead@12:treasure_map -> bifold_map_with_dotted_line_to_x", () => {
  assert.strictEqual(
    migrateName("treasure_map", "pinhead@12"),
    "bifold_map_with_dotted_line_to_x",
  );
});

test("migrateName nps:maps -> bifold_map_with_dotted_line_to_x", () => {
  assert.strictEqual(
    migrateName("maps", "nps"),
    "bifold_map_with_dotted_line_to_x",
  );
});

test("migrateName pinhead@13:treasure_map -> treasure_map", () => {
  assert.strictEqual(migrateName("treasure_map", "pinhead@13"), "treasure_map");
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

test("migrateName throws an error on unknown name", () => {
  assert.throws(() => migrateName("fadasfadsfadsfasf"), {
    message: /not a name known/,
  });
});

test("migrateName pinhead@10:pedestrian throws an error", () => {
  assert.throws(() => migrateName("pedestrian", "pinhead@10"), {
    message: /not a name known/,
  });
});

test("migrateName golfer_and_golf_pin -> person_swinging_golf_club_beside_flagstick_with_pennant", () => {
  assert.strictEqual(
    migrateName("golfer_and_golf_pin"),
    "person_swinging_golf_club_beside_flagstick_with_pennant",
  );
});

test("migrateName person_swinging_golf_club_beside_golf_pin -> person_swinging_golf_club_beside_flagstick_with_pennant", () => {
  assert.strictEqual(
    migrateName("person_swinging_golf_club_beside_golf_pin"),
    "person_swinging_golf_club_beside_flagstick_with_pennant",
  );
});

test("migrateName pinhead@5:golfer_and_golf_pin -> person_swinging_golf_club_beside_flagstick_with_pennant", () => {
  assert.strictEqual(
    migrateName("golfer_and_golf_pin", "pinhead@5"),
    "person_swinging_golf_club_beside_flagstick_with_pennant",
  );
});

test("migrateName pinhead@5:person_swinging_golf_club_beside_golf_pin throws an error on unknown name", () => {
  assert.throws(
    () => migrateName("person_swinging_golf_club_beside_golf_pin", "pinhead@5"),
    { message: /not a name known/ },
  );
});

test("migrateName pinhead@6:person_swinging_golf_club_beside_golf_pin -> person_swinging_golf_club_beside_flagstick_with_pennant", () => {
  assert.strictEqual(
    migrateName("person_swinging_golf_club_beside_golf_pin", "pinhead@6"),
    "person_swinging_golf_club_beside_flagstick_with_pennant",
  );
});

test("migrateName pinhead@6:person_swinging_golf_club_beside_golf_pin throws an error on unknown name", () => {
  assert.throws(() => migrateName("golfer_and_golf_pin", "pinhead@6"), {
    message: /not a name known/,
  });
});

test("migrateName pinhead@7:person_swinging_golf_club_beside_golf_pin -> person_swinging_golf_club_beside_flagstick_with_pennant", () => {
  assert.strictEqual(
    migrateName("person_swinging_golf_club_beside_golf_pin", "pinhead@7"),
    "person_swinging_golf_club_beside_flagstick_with_pennant",
  );
});

test("migrateName pinhead@9:person_swinging_golf_club_beside_golf_pin -> person_swinging_golf_club_beside_flagstick_with_pennant", () => {
  assert.strictEqual(
    migrateName("person_swinging_golf_club_beside_golf_pin", "pinhead@9"),
    "person_swinging_golf_club_beside_flagstick_with_pennant",
  );
});

test("migrateName pinhead@10:person_swinging_golf_club_beside_golf_pin throws an error on unknown name", () => {
  assert.throws(
    () =>
      migrateName("person_swinging_golf_club_beside_golf_pin", "pinhead@10"),
    { message: /not a name known/ },
  );
});

test("migrateName car_profile -> sedan", () => {
  assert.strictEqual(migrateName("car_profile"), "sedan");
});

test("migrateName pinhead@3:car_profile -> sedan", () => {
  assert.strictEqual(migrateName("car_profile", "pinhead@3"), "sedan");
});

test("migrateName pinhead@2:car_profile throws an error", () => {
  assert.throws(() => migrateName("car_profile", "pinhead@2"), {
    message: /not a name known/,
  });
});
