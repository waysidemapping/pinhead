import { existsSync, readFileSync, writeFileSync, globSync } from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import { join, parse } from "path";
import os from "os";

const workspace = await fs.mkdtemp(join(os.tmpdir(), "workspace-"));

const importSources = JSON.parse(readFileSync('metadata/external_sources.json'));

const iconFilesById = {};

globSync(`./icons/**/*.svg`).forEach(file => {
  const id = parse(file).name;
  iconFilesById[id] = true;
});

for (const importSource of importSources) {
  importSource.seenIcons = {};
}

function validateChangelog() {

  const iconsById = {};

  const iconChangeProps = [
    "oldId",
    "newId",
    "by",
    "inspo",
    "inspoBy",
    "src",
    "srcBy",
    "importBy"
  ].concat(importSources.map(source => source.id));

  const changelogPath = 'metadata/changelog.json';

  const changelogs = JSON.parse(readFileSync(changelogPath));
  // sort oldest to newest
  changelogs.sort((a, b) => parseInt(a.majorVersion) - parseInt(b.majorVersion));

  for (const versionChangelog of changelogs) {

    const v = versionChangelog.majorVersion;

    // Make sure we process all deletions/changes before additions
    const sortedIconChanges = versionChangelog.iconChanges.toSorted((a, b) => {
      if (b.oldId && !a.oldId) return 1;
      if (!b.oldId && a.oldId) return -1;
      return 0;
    });

    for (const iconChange of sortedIconChanges) {
      for (const key in iconChange) {
        if (!iconChangeProps.includes(key)) {
          console.error(`Unexpected property "${key}" for "${iconChange.newId}" in version ${v}`);
          return;
        }
        if (!iconChange[key]) {
          console.error(`Unexpected empty property "${key}" for "${iconChange.newId}" in version ${v}`);
          return;
        }
      }
      if (!iconChange.oldId && !iconChange.newId) {
        console.error(`Missing both "newId" and "oldId" in version ${v}`)
        return;
      }
      if (iconChange.newId) {
        if (!iconChange.oldId && !iconChange.by && !iconChange.src) {
          console.error(`Missing provenance for "${iconChange.newId}" in version ${v}`)
          return;
        }
        if (iconChange.oldId && iconChange.src) {
          console.error(`Unexpected both "src": "${iconChange.src}" and "oldId": "${iconChange.oldId}" for "${iconChange.newId}" in version ${v}`)
          return;
        }
        if (iconChange.by && iconChange.src) {
          console.error(`Unexpected both "src": "${iconChange.src}" and "by": "${iconChange.by}" for "${iconChange.newId}" in version ${v}`)
          return;
        }
        if (iconChange.importBy && !iconChange.src) {
          console.error(`Unexpected "importBy": "${iconChange.importBy}" without "src": "…" for "${iconChange.newId}" in version ${v}`)
          return;
        }
        if (iconChange.src) {
          if (!iconChange.importBy) {
            console.error(`Missing "importBy" for "${iconChange.newId}" in version ${v}`)
            return;
          }
          if (!iconChange.src.includes('://')) {
            if (!importSources.find(source => source.id === iconChange.src)) {
              console.error(`Unknown "src": "${iconChange.src}" for "${iconChange.newId}" in version ${v}`)
              return;
            }
            if (!iconChange[iconChange.src]) {
              console.error(`Missing "${iconChange.src}": "…" property for "${iconChange.newId}" in version ${v}`)
              return;
            }
          }
        }
        if (iconChange.inspo) {
          const inspos = stringArray(iconChange.inspo);
          for (const inspo of inspos) {
            if (!inspo.includes('://') &&
              !iconsById[inspo] &&
              !versionChangelog.iconChanges.find(foreignIconChange => foreignIconChange.newId === inspo)) {
              console.error(`Unknown icon referenced via "inspo": "${inspo}" for "${iconChange.newId}" in version ${v}`)
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
              console.error(`"${iconChange.newId}" and "${importSource.seenIcons[id]}" both reference the same "${importSource.id}" icon: "${id}"`);
              return;
            }
            const filename = id + (importSource.filenameSuffix || '') + '.svg';
            const iconFile = join(repoPath(importSource.repo), importSource.iconDir, filename);
            
            if (!existsSync(iconFile)) {
              console.error(`No such icon "${iconFile}" referenced by "${iconChange.newId}" in version ${v}`);
              return;
            }
            importSource.seenIcons[id] = iconChange.newId;
          }
        }
      }

      // update commulative icon log
      if (iconChange.oldId) {
        if (!iconsById[iconChange.oldId]) {
          console.error(`Can't find old icon ${iconChange.oldId} for "${iconChange.newId}" in version ${v}`)
          return;
        }
        if (iconChange.newId !== iconChange.oldId) {
          delete iconsById[iconChange.oldId];
        }
      }
      if (iconChange.newId) {
        iconsById[iconChange.newId] = true;
      }
    }

    // sort properties into a consistent order
    versionChangelog.iconChanges = versionChangelog.iconChanges.map(iconChange => {
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
  }

  for (const idInChangelog in iconsById) {
    if (!iconFilesById[idInChangelog]) {
      console.error(`Missing SVG file for icon "${idInChangelog}" referenced in changelog.json`);
      return;
    }
  }
  for (const idInFiles in iconFilesById) {
    if (!iconsById[idInFiles]) {
      console.error(`Missing changelog entry for "${idInFiles}.svg" present in files`);
      return;
    }
  }

  console.log("changelog.json is valid");

  writeFileSync(changelogPath, JSON.stringify(changelogs, null, 2));
}

function stringArray(value) {
  return (typeof value === 'string' ? [value] : [...value]);
}

function repoPath(repoUrl) {
  const repoName = repoUrl.split("/").pop().replace(".git", "");
  return join(workspace, repoName);
}

async function cloneTempRepos(repos, workFunction) {
  try {
    const execAsync = promisify(exec);
    console.log("Cloning repos...")
    await Promise.all(
      repos.map(repoUrl => execAsync(`git clone ${repoUrl} "${repoPath(repoUrl)}"`))
    );
    console.log("All repos cloned");

    workFunction();

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
}

const repoUrls = importSources.map(obj => obj.repo);
cloneTempRepos(repoUrls, validateChangelog);