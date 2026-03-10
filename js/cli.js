#!/usr/bin/env node

import fs from "fs";
import { parseArgs } from "util";
import { getSprite } from "./index.js";

const commands = {
  "get-sprite": {
    config: {
      options: {
        fill: { type: "string" },
        shape: { type: "string" },
        shapeFill: { type: "string" },
        stroke: { type: "string" },
        strokeWidth: { type: "string" },
        padding: { type: "string" },
        cornerRadius: { type: "string" },
        scale: { type: "string" },
      },
      allowPositionals: true,
    },
    run: ({ values, positionals }) => {
      if (values.strokeWidth)
        values.strokeWidth = parseFloat(values.strokeWidth);
      if (values.padding) values.padding = parseFloat(values.padding);
      if (values.cornerRadius)
        values.cornerRadius = parseFloat(values.cornerRadius);
      if (values.scale) values.scale = parseFloat(values.scale);
      // validate arg
      switch (positionals.length) {
        case 0:
          console.error("No icon name specified!");
          return 1;
        case 1:
          break;
        default:
          console.error("More than one icon name specified!");
          return 1;
      }
      console.log(getSprite(positionals[0], values));
      return 0;
    },
  },
  "build-sprites": {
    config: {
      options: {
        config: { type: "string", default: "pinhead.json" },
        outdir: { type: "string", default: "./svgs" },
      },
    },
    run: ({ values }) => {
      const config = JSON.parse(fs.readFileSync(values.config));
      fs.mkdirSync(values.outdir, { recursive: true });
      for (const { icons, options } of config.groups) {
        for (const [icon, name] of Object.entries(icons)) {
          fs.writeFileSync(
            `${values.outdir}/${name}.svg`,
            getSprite(icon, options),
          );
        }
      }
      return 0;
    },
  },
};

if (process.argv.length < 3) {
  console.log(`Supported subcommands: ${Object.keys(commands).join(", ")}`);
  process.exit(0);
}
const subcommand = process.argv[2];
const args = process.argv.slice(3);
const command = commands[subcommand];
if (!command) {
  if (subcommand.startsWith("-")) {
    console.error(`No subcommand specified`);
  } else {
    console.error(`Unknown subcommand: ${subcommand}`);
  }
  process.exit(1);
}
process.exit(command.run(parseArgs({ ...command.config, args })));
