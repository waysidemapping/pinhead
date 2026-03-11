import changelog from "@waysidemapping/pinhead/dist/changelog.json" with { type: "json" };
import externalSources from "@waysidemapping/pinhead/dist/external_sources.json" with { type: "json" };

changelog.sort((a, b) => parseInt(a) - parseInt(b));
const validExternalSources = new Set(externalSources.map(({ id }) => id));

export function migrateName(name, from = "pinhead") {
  let resolvedName = name;
  let pinheadVersion;
  let externalKey;
  if (from.startsWith("pinhead")) {
    if (from.startsWith("pinhead@")) {
      pinheadVersion = from.split("@", 2)[1];
      // TODO: validate pinheadVersion!
    } else if (from !== "pinhead") {
      throw new Error(`"${from}" is not a valid value to migrate from`);
    }
  } else if (validExternalSources.has(from)) {
    externalKey = from;
  } else {
    throw new Error(`"${from}" is not a valid value to migrate from`);
  }

  for (const version of changelog) {
    for (const change of version.iconChanges) {
      if (externalKey && change[externalKey] === resolvedName) {
        // migrate from an external key
        resolvedName = change.newId;
      } else if (!pinheadVersion && change.newId === name) {
        // undo any migrations if not targeting specific pinhead version and a name is re-used
        resolvedName = name;
      } else if (
        pinheadVersion &&
        parseInt(change.majorVersion) < pinheadVersion
      ) {
        // do nothing if migrating from a specific version newer than current
        continue;
      } else if (change.oldId === resolvedName) {
        // migrate!
        resolvedName = change.newId;
      }
    }
  }
  return resolvedName;
}
