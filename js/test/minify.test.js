import { test } from "node:test";
import assert from "node:assert";
import { minify } from "../util.js";

test("minify strips repeated spaces", () => {
  assert.strictEqual(minify`foo    bar`, "foo bar");
});

test("minify around start of xml tag", () => {
  assert.strictEqual(minify`foo < bar`, "foo<bar");
});

test("minify around end of open xml tag", () => {
  assert.strictEqual(minify`foo > bar`, "foo>bar");
});

test("minify around end of closed xml tag", () => {
  assert.strictEqual(minify`foo /> bar`, "foo/>bar");
});

test("minify interpolates values", () => {
  assert.strictEqual(minify`a ${1} b ${2} c ${"sdf"}`, "a 1 b 2 c sdf");
});

test("minify cleans up a sloppy svg", () => {
  assert.strictEqual(
    minify`
<svg xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 15 15"
      width="15" height="15"
      ><path
            
            
            d="M4.5 7.5a3 3 0 1 0 6 0a3 3 0 1 0 -6 0z"
            /></svg>
  `,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15" width="15" height="15"><path d="M4.5 7.5a3 3 0 1 0 6 0a3 3 0 1 0 -6 0z"/></svg>`,
  );
});
