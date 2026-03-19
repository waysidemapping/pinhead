function loadChangelogData(c) {

  const changelogs = c.toSorted((a, b) => parseInt(a.majorVersion) - parseInt(b.majorVersion));

  const iconsById = {};
  const iconsByVersionedIconId = {};

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
      // update commulative icon log
      if (iconChange.oldId) {
        if (iconChange.newId) {
          for (const id in iconsByVersionedIconId) {
            if (iconChange.oldId === iconsByVersionedIconId[id]) {
              iconsByVersionedIconId[id] = iconChange.newId;
            }
          }
          iconsById[iconChange.newId] = iconsById[iconChange.oldId];
          iconsById[iconChange.newId].date = date;
          iconsById[iconChange.newId].v = version;
          if (iconChange.newId !== iconChange.oldId) {
            if (!iconsById[iconChange.newId].oldIds) iconsById[iconChange.newId].oldIds = [];
            iconsById[iconChange.newId].oldIds.push(iconChange.oldId);
            iconsById[iconChange.newId].renameDate = date;
            iconsById[iconChange.newId].renameV = version;
          }
          if (iconChange.by || iconChange.src) {
            iconsById[iconChange.newId].redesignDate = date;
            iconsById[iconChange.newId].redesignV = version;
          }
          for (const key in iconChange) {
            if (!['newId', 'oldId'].includes(key)) {
              const vals = stringArray(iconChange[key]);
              if (iconsById[iconChange.newId][key]) {
                iconsById[iconChange.newId][key] = iconsById[iconChange.newId][key].concat(vals);
              } else {
                iconsById[iconChange.newId][key] = vals;
              }
            }
          }
        }
        if (iconChange.newId !== iconChange.oldId) {
          delete iconsById[iconChange.oldId];
        }
      } else if (iconChange.newId) {
        iconsById[iconChange.newId] = {
          date: date,
          v: version,
          ogDate: date,
          ogV: version
        };
        for (const key in iconChange) {
          if (!['newId', 'oldId'].includes(key)) {
            iconsById[iconChange.newId][key] = stringArray(iconChange[key]);
          }
        }
      }
    }

    for (const id in iconsById) {
      const versionedIconId = `v${version}/${id}`;
      iconsByVersionedIconId[versionedIconId] = id;
    }
  }

  return { iconsById, iconsByVersionedIconId };
}

function stringArray(value) {
  return (typeof value === 'string' ? [value] : [...value]);
}

export class ChangelogReader {
  constructor(changelogs) {
    const data = loadChangelogData(changelogs);
    this.iconsById = data.iconsById;
    this.iconsByVersionedIconId = data.iconsByVersionedIconId;
  }
}