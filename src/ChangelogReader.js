function loadChangelogData(changelogs) {
  const iconsById = {};

  for (const versionChangelog of changelogs) {
    const date = versionChangelog.date;
    const version = versionChangelog.majorVersion;
    // Make sure we process all deletions/changes before additions
    const sortedIconChanges = versionChangelog.iconChanges.toSorted((a, b) => {
      if (b.oldId && !a.oldId) return 1;
      if (!b.oldId && a.oldId) return -1;
      return 0;
    });
    for (const iconChange of sortedIconChanges) {
      iconChange.v = version;
      iconChange.date = date;
      // update commulative icon log
      if (iconChange.oldId) {
        if (iconChange.newId) {
          iconsById[iconChange.newId] = iconsById[iconChange.oldId];
          for (const key in iconChange) {
            if (!["newId", "oldId"].includes(key)) {
              const vals = stringArray(iconChange[key]);
              if (iconsById[iconChange.newId][key]) {
                iconsById[iconChange.newId][key] =
                  iconsById[iconChange.newId][key].concat(vals);
              } else {
                iconsById[iconChange.newId][key] = vals;
              }
            }
          }
        }
        if (iconChange.newId !== iconChange.oldId) {
          delete iconsById[iconChange.oldId];
        }
      } else {
        iconsById[iconChange.newId] = {
          changes: [],
        };
        for (const key in iconChange) {
          if (!["newId", "oldId"].includes(key)) {
            iconsById[iconChange.newId][key] = stringArray(iconChange[key]);
          }
        }
      }
      iconsById[iconChange.newId].changes.push(iconChange);
    }
  }

  for (const id in iconsById) {
    iconsById[id].id = id;
  }

  return iconsById;
}

function stringArray(value) {
  return typeof value === "string" ? [value] : [...value];
}

export class ChangelogReader {
  constructor(changelogs) {
    this.changelogs = changelogs.toSorted(
      (a, b) => parseInt(a.majorVersion) - parseInt(b.majorVersion),
    );
    this.iconsById = loadChangelogData(this.changelogs);
  }

  latestIconIdForVersionedIconId = function (versionedIconId, version) {
    let targetIconId = versionedIconId;
    for (const versionChangelog of this.changelogs) {
      if (parseInt(versionChangelog.majorVersion) >= parseInt(version)) {
        for (const iconChange of versionChangelog.iconChanges) {
          if (iconChange.oldId === targetIconId && iconChange.newId) {
            targetIconId = iconChange.newId;
          }
        }
      }
    }
    return targetIconId;
  };
}
