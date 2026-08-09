export class ChangelogDescriber {
  constructor(importSources, fileBase) {
    this.importSources = importSources;
    this.fileBase = fileBase || "";
  }

  getCategorizedChangesForChangelog(changelog) {
    const categorizedChanges = {
      addedIcons: [],
      deletedIcons: [],
      renamedIcons: [],
      mergedIcons: [],
      redesignedIcons: [],
      renamedAndRedesignedIcons: [],
    };
    changelog.iconChanges.forEach((iconChange) => {
      if (iconChange.oldId) {
        if (iconChange.newId) {
          if (iconChange.oldId === iconChange.newId) {
            categorizedChanges.redesignedIcons.push(iconChange);
          } else if (iconChange.by || iconChange.src) {
            categorizedChanges.renamedAndRedesignedIcons.push(iconChange);
          } else if (iconChange.edit === "merge") {
            categorizedChanges.mergedIcons.push(iconChange);
          } else {
            categorizedChanges.renamedIcons.push(iconChange);
          }
        } else {
          categorizedChanges.deletedIcons.push(iconChange);
        }
      } else {
        categorizedChanges.addedIcons.push(iconChange);
      }
    });
    return categorizedChanges;
  }

  getChangelogBodyHtml(changelog) {
    let html = "";
    const importSources = this.importSources;
    const changes = this.getCategorizedChangesForChangelog(changelog);
    const newV = changelog.majorVersion;
    const oldV = parseInt(newV) - 1;

    if (changes.deletedIcons.length) {
      html += `<h3>Deleted icons (${changes.deletedIcons.length})</h3>`;
      html += "<ul>";
      changes.deletedIcons.forEach((iconChange) => {
        html +=
          `<li><img src="${this.fileBase}/v${oldV}/${iconChange.oldId}.svg" width="15px"/> Remove <b>${iconChange.oldId}</b>` +
          issueLinks(iconChange) +
          `</li>`;
      });
      html += "</ul>";
    }
    if (changes.renamedAndRedesignedIcons.length) {
      html += `<h3>Renamed and redesigned icons (${changes.renamedAndRedesignedIcons.length})</h3>`;
      html += "<ul>";
      changes.renamedAndRedesignedIcons.forEach((iconChange) => {
        html +=
          `<li><img src="${this.fileBase}/v${oldV}/${iconChange.oldId}.svg" width="15px"/> <b>${iconChange.oldId}</b> -> <img src="${this.fileBase}/v${newV}/${iconChange.newId}.svg" width="15px"/> <b>${iconChange.newId}</b>` +
          fromInfo(iconChange) +
          issueLinks(iconChange) +
          `</li>`;
      });
      html += "</ul>";
    }
    if (changes.renamedIcons.length) {
      html += `<h3>Renamed icons (${changes.renamedIcons.length})</h3>`;
      html += "<ul>";
      changes.renamedIcons.forEach((iconChange) => {
        html +=
          `<li><img src="${this.fileBase}/v${newV}/${iconChange.newId}.svg" width="15px"/> <b>${iconChange.oldId}</b> -> <b>${iconChange.newId}</b>` +
          issueLinks(iconChange) +
          `</li>`;
      });
      html += "</ul>";
    }
    if (changes.mergedIcons.length) {
      html += `<h3>Merged icons (${changes.mergedIcons.length})</h3>`;
      html += "<ul>";
      changes.mergedIcons.forEach((iconChange) => {
        html +=
          `<li><img src="${this.fileBase}/v${oldV}/${iconChange.oldId}.svg" width="15px"/> <b>${iconChange.oldId}</b> -> <img src="${this.fileBase}/v${newV}/${iconChange.newId}.svg" width="15px"/> <b>${iconChange.newId}</b>` +
          issueLinks(iconChange) +
          `</li>`;
      });
      html += "</ul>";
    }
    if (changes.redesignedIcons.length) {
      html += `<h3>Redesigned icons (${changes.redesignedIcons.length})</h3>`;
      html += "<ul>";
      changes.redesignedIcons.forEach((iconChange) => {
        html +=
          `<li><img src="${this.fileBase}/v${oldV}/${iconChange.oldId}.svg" width="15px"/> -> <img src="${this.fileBase}/v${newV}/${iconChange.newId}.svg" width="15px"/> <b>${iconChange.newId}</b>` +
          fromInfo(iconChange) +
          issueLinks(iconChange) +
          `</li>`;
      });
      html += "</ul>";
    }
    if (changes.addedIcons.length) {
      html += `<h3>Added icons (${changes.addedIcons.length})</h3>`;
      html += "<ul>";
      changes.addedIcons.forEach((iconChange) => {
        html +=
          `<li><img src="${this.fileBase}/v${newV}/${iconChange.newId}.svg" width="15px"/> Add <b>${iconChange.newId}</b>` +
          fromInfo(iconChange) +
          issueLinks(iconChange) +
          `</li>`;
      });
      html += "</ul>";
    }

    return html;

    function fromInfo(iconChange) {
      let str = "";
      if (iconChange.srcBy) {
        str +=
          " by " +
          stringArray(iconChange.srcBy)
            .map(
              (by) => `<a href="https://github.com/${by.slice(1)}">${by}</a>`,
            )
            .join(", ");
      }
      if (iconChange.src && iconChange.importBy) {
        const srcs = stringArray(iconChange.src);
        str +=
          " from " +
          srcs
            .map((src) => {
              const importSource = importSources.find(
                (source) => source.id === src,
              );
              if (importSource) {
                return `<a href="${importSource.repo.slice(0, -4)}">${importSource.name}</a>`;
              }
              return `<a href="${src}">source</a>`;
            })
            .join(", ");
        const importBys = stringArray(iconChange.importBy);
        str +=
          " imported by " +
          importBys
            .map(
              (by) => `<a href="https://github.com/${by.slice(1)}">${by}</a>`,
            )
            .join(", ");
        if (iconChange.by) {
          if (iconChange.by.toString() === iconChange.importBy.toString()) {
            str += " with edits";
          } else {
            str +=
              " with edits by " +
              stringArray(iconChange.by)
                .map(
                  (by) =>
                    `<a href="https://github.com/${by.slice(1)}">${by}</a>`,
                )
                .join(", ");
          }
        }
      } else if (iconChange.by) {
        str +=
          " by " +
          stringArray(iconChange.by)
            .map(
              (by) => `<a href="https://github.com/${by.slice(1)}">${by}</a>`,
            )
            .join(", ");
      }
      return str;
    }

    function issueLinks(iconChange) {
      if (iconChange.issue || iconChange.pr) {
        const issues = (iconChange.pr ? stringArray(iconChange.pr) : []).concat(
          iconChange.issue ? stringArray(iconChange.issue) : [],
        );
        return (
          " (" +
          issues
            .map(
              (issue) =>
                `<a href="https://github.com/waysidemapping/pinhead/issues/${issue}">#${issue}</a>`,
            )
            .join(", ") +
          ")"
        );
      }
      return "";
    }

    function stringArray(value) {
      return typeof value === "string" ? [value] : [...value];
    }
  }
}
