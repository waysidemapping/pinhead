function loadChangelogData(c) {

  const changelogs = c.toSorted((a, b) => parseInt(a.majorVersion) - parseInt(b.majorVersion));

  const iconsById = {};
  for (const versionChangelog of changelogs) {
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
          iconsById[iconChange.newId] = iconsById[iconChange.oldId];
          iconsById[iconChange.newId].date = versionChangelog.date;
          iconsById[iconChange.newId].v = versionChangelog.majorVersion;
          if (iconChange.newId !== iconChange.oldId) {
            if (!iconsById[iconChange.newId].oldIds) iconsById[iconChange.newId].oldIds = [];
            iconsById[iconChange.newId].oldIds.push(iconChange.oldId);
            iconsById[iconChange.newId].renameDate = versionChangelog.date;
            iconsById[iconChange.newId].renameV = versionChangelog.majorVersion;
          }
          if (iconChange.by || iconChange.src) {
            iconsById[iconChange.newId].redesignDate = versionChangelog.date;
            iconsById[iconChange.newId].redesignV = versionChangelog.majorVersion;
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
          date: versionChangelog.date,
          v: versionChangelog.majorVersion,
          ogDate: versionChangelog.date,
          ogV: versionChangelog.majorVersion
        };
        
        for (const key in iconChange) {
          if (!['newId', 'oldId'].includes(key)) {
            iconsById[iconChange.newId][key] = stringArray(iconChange[key]);
          }
        }
      }
    }
  }

  return iconsById;
}

function stringArray(value) {
  return (typeof value === 'string' ? [value] : [...value]);
}

export class ChangelogReader {
  constructor(changelogs) {
    this.iconsById = loadChangelogData(changelogs);
  }
}