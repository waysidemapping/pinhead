import { existsSync, readFileSync, writeFileSync, globSync } from "fs";
import { readFile } from "fs/promises";
import { join, parse } from "path";
import { ChangelogDescriber } from "../src/ChangelogDescriber.js";
import { downloadExternalSourceAssets } from "../src/ExternalSourceManager.js";
import { downloadLegacyAssets } from "../src/LegacyAssetManager.js";
import TurndownService from "turndown";
import sharp from "sharp";

const version = JSON.parse(readFileSync("package.json")).version;
const currentMajorVersion = version.split(".")[1];

const importSources = JSON.parse(
  readFileSync("metadata/external_sources.json"),
);
const describer = new ChangelogDescriber(importSources, "https://pinhead.ink");
const turndownService = new TurndownService();
turndownService.addRule("keepImagesAsHtml", {
  filter: "img",
  replacement: (_content, node) => {
    return node.outerHTML;
  },
});

const iconFilesById = {};

globSync(`./icons/**/*.svg`).forEach((file) => {
  const id = parse(file).name;
  iconFilesById[id] = true;
});

for (const importSource of importSources) {
  importSource.seenIcons = {};
}

const svgPromisesByPath = new Map();
const rasterBufferPromisesBySvgPath = new Map();

const iconChangeProps = [
  "oldId",
  "newId",
  "edit",
  "by",
  "inspo",
  "inspoBy",
  "src",
  "srcBy",
  "importBy",
  "issue",
  "pr",
  "char",
  "sensitive",
].concat(importSources.map((source) => source.id));

const externalSourceIconsDir = "docs/srcicons";

downloadLegacyAssets("docs");
downloadExternalSourceAssets(externalSourceIconsDir);

const changelogPath = "metadata/changelog.json";

const changelogs = JSON.parse(readFileSync(changelogPath));

const startTime = Date.now();

if (await validateChangelogs(changelogs)) {
  const currentChangelog = changelogs.find(
    (c) => c.majorVersion === currentMajorVersion,
  );
  printTextForChangelog(currentChangelog);

  console.log(
    "changelog.json is valid, done in " + (Date.now() - startTime) + " ms",
  );
} else {
  console.log("changelog.json is not valid, exiting…");
  process.exit(1);
}

const formattedChangelogs = formatChangelogs(changelogs);
writeFileSync(changelogPath, JSON.stringify(formattedChangelogs, null, 2));

function formatChangelogs(changelogs) {
  const formattedChangelogs = changelogs.toSorted(
    (a, b) => parseInt(a.majorVersion) - parseInt(b.majorVersion),
  );
  // sort properties into a consistent order
  formattedChangelogs.map((changelog) => {
    changelog.iconChanges = changelog.iconChanges.map((iconChange) => {
      const returner = {};
      for (const prop of iconChangeProps) {
        if (prop in iconChange) {
          returner[prop] = iconChange[prop];
        }
        // collapse single string arrays down to string
        if (Array.isArray(returner[prop]) && returner[prop].length === 1) {
          returner[prop] = returner[prop][0];
        }
      }
      return returner;
    });
  });
  return formattedChangelogs;
}

async function validateChangelogs(changelogs) {
  // sort oldest to newest
  const sortedChangelogs = changelogs.toSorted(
    (a, b) => parseInt(a.majorVersion) - parseInt(b.majorVersion),
  );

  const iconsById = {};

  for (const versionChangelog of sortedChangelogs) {
    if (!(await validateChangelog(versionChangelog, iconsById))) {
      return;
    }
  }

  for (const idInChangelog in iconsById) {
    if (!iconFilesById[idInChangelog]) {
      console.error(
        `Missing SVG file for icon "${idInChangelog}" referenced in changelog.json`,
      );
      return;
    }
  }
  for (const idInFiles in iconFilesById) {
    if (!iconsById[idInFiles]) {
      console.error(
        `Missing changelog entry for "${idInFiles}.svg" present in files`,
      );
      return;
    }
  }
  return true;
}

async function validateChangelog(versionChangelog, iconsById) {
  // Make sure we process all deletions/changes before additions
  const sortedIconChanges = versionChangelog.iconChanges.toSorted((a, b) => {
    if (b.oldId && !a.oldId) return 1;
    if (!b.oldId && a.oldId) return -1;
    return 0;
  });

  const hasIconChangeForIconId = {};

  for (const iconChange of sortedIconChanges) {
    if (iconChange.newId) {
      hasIconChangeForIconId[iconChange.newId] = true;
    }
    if (!(await validateIconChange(iconChange, versionChangelog, iconsById))) {
      return;
    }
  }

  const v = parseInt(versionChangelog.majorVersion);

  if (v > 1) {
    // ensure that a changelog entry exists if the icon SVG has changed
    const iconsDir =
      v === parseInt(currentMajorVersion) ? "./icons" : `./docs/v${v}`;
    const iconFiles = globSync(`${iconsDir}/**/*.svg`);
    const promises = iconFiles.map(async (file) => {
      const id = parse(file).name;
      if (!hasIconChangeForIconId[id]) {
        if (
          !(await svgsAreVisuallyEquivalent(
            `./docs/v${v - 1}/${id}.svg`,
            file,
            v > 4,
          ))
        ) {
          throw new Error(
            `Missing changelog entry for changed file "${id}.svg" in version ${v}`,
          );
        }
      }
    });
    try {
      await Promise.all(promises);
    } catch (error) {
      console.error(error);
      return;
    }
  }
  return true;
}

async function validateIconChange(iconChange, versionChangelog, iconsById) {
  const v = parseInt(versionChangelog.majorVersion);
  for (const key in iconChange) {
    if (!iconChangeProps.includes(key)) {
      console.error(
        `Unexpected property "${key}" for "${iconChange.newId}" in version ${v}`,
      );
      return;
    }
    if (!iconChange[key]) {
      console.error(
        `Unexpected empty property "${key}" for "${iconChange.newId}" in version ${v}`,
      );
      return;
    }
  }
  if (!iconChange.oldId && !iconChange.newId) {
    console.error(`Missing both "newId" and "oldId" in version ${v}`);
    return;
  }
  if (iconChange.newId) {
    if (!iconChange.oldId && !iconChange.by && !iconChange.src) {
      console.error(
        `Missing provenance for "${iconChange.newId}" in version ${v}`,
      );
      return;
    }
    if (iconChange.importBy && !iconChange.src) {
      console.error(
        `Unexpected "importBy": "${iconChange.importBy}" without "src": "…" for "${iconChange.newId}" in version ${v}`,
      );
      return;
    }
    if (iconChange.src) {
      if (!iconChange.importBy) {
        console.error(
          `Missing "importBy" for "${iconChange.newId}" in version ${v}`,
        );
        return;
      }
      if (!iconChange.src.includes("://")) {
        if (!importSources.find((source) => source.id === iconChange.src)) {
          console.error(
            `Unknown "src": "${iconChange.src}" for "${iconChange.newId}" in version ${v}`,
          );
          return;
        }
        if (!iconChange[iconChange.src]) {
          console.error(
            `Missing "${iconChange.src}": "…" property for "${iconChange.newId}" in version ${v}`,
          );
          return;
        }
      }
    }
    if (iconChange.inspo) {
      const inspos = stringArray(iconChange.inspo);
      for (const inspo of inspos) {
        if (
          !inspo.includes("://") &&
          !iconsById[inspo] &&
          !versionChangelog.iconChanges.find(
            (foreignIconChange) => foreignIconChange.newId === inspo,
          )
        ) {
          console.error(
            `Unknown icon referenced via "inspo": "${inspo}" for "${iconChange.newId}" in version ${v}`,
          );
          return;
        }
      }
    }
  }

  for (const importSource of importSources) {
    if (iconChange[importSource.id]) {
      const ids = stringArray(iconChange[importSource.id]);
      for (const id of ids) {
        if (importSource.seenIcons[id]) {
          console.error(
            `"${iconChange.newId}" and "${importSource.seenIcons[id]}" both reference the same "${importSource.id}" icon: "${id}"`,
          );
          return;
        }
        const filename = id + (importSource.filenameSuffix || "") + ".svg";
        const iconFile = join(
          externalSourceIconsDir,
          importSource.id,
          filename,
        );

        if (!existsSync(iconFile)) {
          console.error(
            `No such icon "${iconFile}" referenced by "${iconChange.newId}" in version ${v}`,
          );
          return;
        }
        importSource.seenIcons[id] = iconChange.newId;
      }
    }
  }

  // update commulative icon log
  if (iconChange.oldId) {
    if (!iconsById[iconChange.oldId]) {
      console.error(
        `Can't find old icon "${iconChange.oldId}" for "${iconChange.newId}" in version ${v}`,
      );
      return;
    }
    if (v > 1) {
      // expect SVGs to be different
      const newfileRoot =
        parseInt(currentMajorVersion) === v ? "./icons" : `./docs/v${v}`;
      const sameSvg = await svgsAreVisuallyEquivalent(
        `./docs/v${v - 1}/${iconChange.oldId}.svg`,
        `${newfileRoot}/${iconChange.newId}.svg`,
        v > 4,
      );
      if (iconChange.by || iconChange.src) {
        if (sameSvg) {
          console.error(
            `No difference between SVGs of old icon "v${v - 1}/${iconChange.oldId}" and new icon "v${v}/${iconChange.newId}"`,
          );
          return;
        }
      } else {
        if (!sameSvg) {
          console.error(
            `Unexpected difference between SVGs of old icon "v${v - 1}/${iconChange.oldId}" and new icon "v${v}/${iconChange.newId}"`,
          );
          return;
        }
      }
    }
    if (iconChange.newId !== iconChange.oldId) {
      delete iconsById[iconChange.oldId];
    }
  }
  if (iconChange.newId && iconChange.newId !== iconChange.oldId) {
    if (iconsById[iconChange.newId] && iconChange.edit !== "merge") {
      console.error(
        `Duplicate changelog entry for icon "${iconChange.newId}" in version ${v}`,
      );
      return;
    }
    iconsById[iconChange.newId] = true;
  }
  return true;
}

function printTextForChangelog(changelog) {
  const newV = changelog.majorVersion;
  console.log(`## [${version}] - ${changelog.date}`);
  console.log("");
  const changelogHtml = describer.getChangelogBodyHtml(changelog);
  const changelogMarkdown = turndownService.turndown(changelogHtml);
  console.log(changelogMarkdown);
}

function getSvg(svgPath) {
  if (!svgPromisesByPath.has(svgPath)) {
    svgPromisesByPath.set(svgPath, readFile(svgPath, "utf8"));
  }

  return svgPromisesByPath.get(svgPath);
}

function getRasterBuffer(svgPath, svg) {
  if (!rasterBufferPromisesBySvgPath.has(svgPath)) {
    rasterBufferPromisesBySvgPath.set(
      svgPath,
      sharp(Buffer.from(svg)).resize(60, 60).ensureAlpha().raw().toBuffer(),
    );
  }

  return rasterBufferPromisesBySvgPath.get(svgPath);
}

async function svgsAreVisuallyEquivalent(svgPath1, svgPath2, strict) {
  const [svg1, svg2] = await Promise.all([getSvg(svgPath1), getSvg(svgPath2)]);
  if (svg1 === svg2) return true;

  const [a, b] = await Promise.all([
    getRasterBuffer(svgPath1, svg1),
    getRasterBuffer(svgPath2, svg2),
  ]);

  if (strict) return a.equals(b);

  if (a.length !== b.length) return false;

  // amount within which different channel values will be treated as the same value
  const channelTolerance = 8;
  // percent of pixels allowed to differ
  const pixelTolerance = 0.01;

  let differentPixels = 0;
  const totalPixels = a.length / 4;

  for (let i = 0; i < a.length; i += 4) {
    const different =
      Math.abs(a[i] - b[i]) > channelTolerance ||
      Math.abs(a[i + 1] - b[i + 1]) > channelTolerance ||
      Math.abs(a[i + 2] - b[i + 2]) > channelTolerance ||
      Math.abs(a[i + 3] - b[i + 3]) > channelTolerance;

    if (different) {
      differentPixels++;

      if (differentPixels / totalPixels > pixelTolerance) {
        return false;
      }
    }
  }

  return true;
}

function stringArray(value) {
  return typeof value === "string" ? [value] : [...value];
}
