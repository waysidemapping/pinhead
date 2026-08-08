import changelog from "@waysidemapping/pinhead/dist/changelog.json" with { type: "json" };
import externalSources from "@waysidemapping/pinhead/dist/external_sources.json" with { type: "json" };

changelog.sort((a, b) => parseInt(a) - parseInt(b));
const validExternalSources = new Set(externalSources.map(({ id }) => id));

export function nameExistsInVersion(name, version) {
  let found = false;
  for (const change of changelog) {
    const v = parseInt(change.majorVersion);
    if (v > version) return found;
    for (const icon of change.iconChanges) {
      if (icon.oldId === name) {
        found = false;
      }
    }
    for (const icon of change.iconChanges) {
      if (icon.newId === name) {
        found = true;
      }
    }
  }
  return found;
}

function migrateNameFromVersion(name, version) {
  if (!nameExistsInVersion(name, version)) {
    throw new Error(`"${name}" is not a name known to pinhead ${version}`);
  }
  let resolvedName = name;
  for (const change of changelog.filter(
    ({ majorVersion }) => parseInt(majorVersion) > version,
  )) {
    for (const icon of change.iconChanges) {
      if (icon.oldId === resolvedName) {
        resolvedName = icon.newId;
      }
    }
  }
  return resolvedName;
}

function migrateNameFromExternal(name, from) {
  for (const change of changelog) {
    for (const icon of change.iconChanges) {
      if (icon[from] === name) {
        return migrateNameFromVersion(
          icon.newId,
          parseInt(change.majorVersion),
        );
      }
    }
  }
  throw new Error(`"${name}" is not a ${from} name known to pinhead`);
}

function migratePinheadName(name) {
  let resolvedName;
  for (const change of changelog) {
    for (const icon of change.iconChanges) {
      if (icon.newId === name) {
        // undo any migrations if not targeting specific pinhead version and a name is re-used
        resolvedName = name;
      } else if (icon.oldId === (resolvedName || name)) {
        // migrate!
        resolvedName = icon.newId;
      }
    }
  }
  if (!resolvedName)
    throw new Error(`"${name}" is not a name known to pinhead`);
  return resolvedName;
}

export function migrateName(name, from = "pinhead") {
  let resolvedName;
  let pinheadVersion;
  let externalKey;
  if (from.startsWith("pinhead@")) {
    return migrateNameFromVersion(name, parseInt(from.split("@", 2)[1]));
  } else if (validExternalSources.has(from)) {
    return migrateNameFromExternal(name, from);
  } else if (from === "pinhead") {
    return migratePinheadName(name);
  }
  throw new Error(`"${from}" is not a valid value to migrate from`);
}
