import { existsSync, readFileSync, writeFileSync } from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";

const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "workspace-"));

const icons = {};

const importSources = {
  maki: {
    repo: "https://github.com/mapbox/maki.git",
    iconsPath: "icons",
    seenIcons: {}
  },
  nps: {
    repo: "https://github.com/nationalparkservice/symbol-library.git",
    iconsPath: "src/standalone",
    seenIcons: {}
  },
  opentrailmap: {
    repo: "https://github.com/osmus/opentrailmap.git",
    iconsPath: "style/sprites/svg",
    seenIcons: {}
  },
  osmcarto: {
    repo: "https://github.com/openstreetmap-carto/openstreetmap-carto.git",
    iconsPath: "symbols",
    seenIcons: {}
  },
  temaki: {
    repo: "https://github.com/rapideditor/temaki.git",
    iconsPath: "icons",
    seenIcons: {}
  }
};

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

function validateChangelog() {

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
      if (iconChange.oldId) {
        if (!icons[iconChange.oldId]) {
          console.error(`Can't find old icon ${iconChange.oldId} for "${iconChange.newId}" in version ${v}`)
          return;
        }
        delete icons[iconChange.oldId];
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
          const inspos = (typeof iconChange.inspo === 'string' ? [iconChange.inspo] : iconChange.inspo);
          for (const inspo of inspos) {
            if (!inspo.includes('://') &&
              !icons[inspo] &&
              !versionChangelog.iconChanges.find(foreignIconChange => foreignIconChange.newId === inspo)) {
              console.error(`Unknown icon referenced via "inspo": "${inspo}" for "${iconChange.newId}" in version ${v}`)
              return;
            }
          }
        }
        icons[iconChange.newId] = true;
      }

      for (const importSourceId in importSources) {
        if (iconChange[importSourceId]) {
          const ids = (typeof iconChange[importSourceId] === 'string' ? [iconChange[importSourceId]] : iconChange[importSourceId]);
          for (const id of ids) {
            if (importSources[importSourceId].seenIcons[id]) {
              console.error(`"${iconChange.newId}" and "${importSources[importSourceId].seenIcons[id]}" both reference the same "${importSourceId}" icon: "${id}"`);
              return;
            }
            let filename = `${id}.svg`;
            if (importSourceId === 'nps') {
              filename = `${id}-black-22.svg`
            }
            const iconFile = path.join(repoPath(importSources[importSourceId].repo), importSources[importSourceId].iconsPath, filename);
            
            if (!existsSync(iconFile)) {
              console.error(`No such icon "${iconFile}" referenced by "${iconChange.newId}" in version ${v}`);
              return;
            }
            importSources[importSourceId].seenIcons[id] = iconChange.newId;
          }
        }
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

function repoPath(repoUrl) {
  const repoName = repoUrl.split("/").pop().replace(".git", "");
  return path.join(workspace, repoName);
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