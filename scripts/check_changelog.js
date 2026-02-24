import { existsSync, readFileSync, writeFileSync } from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import { join } from "path";
import os from "os";

const workspace = await fs.mkdtemp(join(os.tmpdir(), "workspace-"));

const importSources = {
  maki: {
    name: "Maki",
    repo: "https://github.com/mapbox/maki.git",
    iconsPath: "icons",
    seenIcons: {}
  },
  nps: {
    name: "NPS",
    repo: "https://github.com/nationalparkservice/symbol-library.git",
    iconsPath: "src/standalone",
    filenameGetter: (id) => `${id}-black-22.svg`,
    seenIcons: {}
  },
  opentrailmap: {
    name: "OpenTrailMap",
    repo: "https://github.com/osmus/opentrailmap.git",
    iconsPath: "style/sprites/svg",
    seenIcons: {}
  },
  osmcarto: {
    name: "OSM Carto",
    repo: "https://github.com/openstreetmap-carto/openstreetmap-carto.git",
    iconsPath: "symbols",
    seenIcons: {}
  },
  temaki: {
    name: "Temaki",
    repo: "https://github.com/rapideditor/temaki.git",
    iconsPath: "icons",
    seenIcons: {}
  }
};

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
  ].concat(Object.keys(importSources));

  const changelogPath = 'changelog.json';

  const changelogs = JSON.parse(readFileSync(changelogPath));
  // sort oldest to newest
  changelogs.sort((a, b) => parseInt(a.majorVersion) - parseInt(b.majorVersion));

  for (const versionChangelog of changelogs) {

    const v = versionChangelog.majorVersion;

    for (const iconChange of versionChangelog.iconChanges) {
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
            if (!importSources[iconChange.src]) {
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

      for (const importSourceId in importSources) {
        const importSource = importSources[importSourceId];
        if (iconChange[importSourceId]) {
          const ids = stringArray(iconChange[importSourceId]);
          for (const id of ids) {
            if (importSource.seenIcons[id]) {
              console.error(`"${iconChange.newId}" and "${importSource.seenIcons[id]}" both reference the same "${importSourceId}" icon: "${id}"`);
              return;
            }
            let filename = importSource.filenameGetter ? importSource.filenameGetter(id) : `${id}.svg`;
         
            const iconFile = join(repoPath(importSource.repo), importSource.iconsPath, filename);
            
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

const repoUrls = Object.values(importSources).map(obj => obj.repo);
cloneTempRepos(repoUrls, validateChangelog);