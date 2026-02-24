import { existsSync, readFileSync } from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";

const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "workspace-"));

const changelogs = JSON.parse(readFileSync('changelog.json'));
// sort oldest to newest
changelogs.sort((a, b) => parseInt(a.majorVersion) - parseInt(b.majorVersion));

const icons = {};

const seenExternalIcons = {
  maki: {},
  temaki: {},
  nps: {},
  osmcarto: {},
  opentrailmap: {}
};

const importSources = {
  maki: {
    repo: "https://github.com/mapbox/maki.git",
    iconsPath: "icons"
  },
  temaki: {
    repo: "https://github.com/rapideditor/temaki.git",
    iconsPath: "icons"
  },
  nps: {
    repo: "https://github.com/nationalparkservice/symbol-library.git",
    iconsPath: "src/standalone"
  },
  opentrailmap: {
    repo: "https://github.com/osmus/opentrailmap.git",
    iconsPath: "style/sprites/svg"
  },
  osmcarto: {
    repo: "https://github.com/openstreetmap-carto/openstreetmap-carto.git",
    iconsPath: "symbols"
  }
};

function validateChangelog() {

  for (const versionChangelog of changelogs) {

    const v = versionChangelog.majorVersion;

    for (const iconChange of versionChangelog.iconChanges) {
      if (!iconChange.oldId && !iconChange.newId) {
        console.error(`Missing both "newId" and "oldId" in version ${v}`)
        return;
      }
      if (iconChange.oldId) {
        if (!icons[iconChange.oldId]) {
          console.error(`Can't find old icon ${iconChange.oldId} for "${iconChange.newId}" in version ${v}`)
          return;
        }
        delete icons[iconChange.oldId]
      }
      if (iconChange.newId) {
        if (iconChange.oldId && iconChange.via) {
          console.error(`Unexpected both "via": "${iconChange.via}" and "oldId": "${iconChange.oldId}" for "${iconChange.newId}" in version ${v}`)
          return;
        }
        if (iconChange.via) {
          if (!iconChange.importer) {
            console.error(`Missing "importer" for "${iconChange.newId}" in version ${v}`)
            return;
          }
          if (!importSources[iconChange.via]) {
            console.error(`Unknown "via": "${iconChange.via}" for "${iconChange.newId}" in version ${v}`)
            return;
          }
          if (!iconChange[iconChange.via]) {
            console.error(`Missing "${iconChange.via}": "…" property for "${iconChange.newId}" in version ${v}`)
            return;
          }
        }
        icons[iconChange.newId] = true;
      }

      for (const importSourceId in importSources) {
        if (iconChange[importSourceId]) {
          const ids = (typeof iconChange[importSourceId] === 'string' ? [iconChange[importSourceId]] : iconChange[importSourceId]);
          for (const id of ids) {
            // if (seenExternalIcons[importSourceId][id]) {
            //   console.error(`"${iconChange.newId}" and "${seenExternalIcons[importSourceId][id]}" both reference the same "${importSourceId}" icon: "${id}"`);
            //   return;
            // }
            let filename = `${id}.svg`;
            if (importSourceId === 'nps') {
              filename = `${id}-black-22.svg`
            }
            const iconFile = path.join(repoPath(importSources[importSourceId].repo), importSources[importSourceId].iconsPath, filename);
            
            if (!existsSync(iconFile)) {
              console.error(`No such icon "${iconFile}" referenced by "${iconChange.newId}" in version ${v}`);
              return;
            }
            seenExternalIcons[importSourceId][id] = iconChange.newId;
          }
        }
      }
    }
  }

  console.log("changelog.json is valid")
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