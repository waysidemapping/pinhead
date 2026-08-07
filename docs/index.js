import { ChangelogReader } from "/src/ChangelogReader.js";
import { CategoryReader } from "/src/CategoryReader.js";

let packageJson;

let version;
let majorVersion;

window.addEventListener("load", (_) => {
  fetch("package.json")
    .then((result) => result.json())
    .then((obj) => {
      packageJson = obj;
      version = packageJson.version;
      majorVersion = version.split(".")[1];
      fetch(`v${majorVersion}/index.complete.json`)
        .then((result) => result.json())
        .then(function (data) {
          setupPage(data);
        });
    });
});

const translations = {};

async function loadLanguage(code) {
  if (translations[code]) return;
  const file = code.toLowerCase();
  try {
    const data = await fetch(`translations/${file}.json`).then((result) =>
      result.json(),
    );
    if (data) translations[file] = data;
  } catch {
    console.log(`Could not get translations file: ${file}.json`);
  }
}

async function setupPage(pageData) {
  const publishDates = await fetch("npm_publish_dates.json").then((result) =>
    result.json(),
  );
  const changelogs = await fetch("changelog.json").then((result) =>
    result.json(),
  );
  const categories = await fetch("categories.json").then((result) =>
    result.json(),
  );
  const changelogReader = new ChangelogReader(changelogs);

  let userLangs = navigator.languages
    ? navigator.languages
    : navigator.language
      ? [navigator.language]
      : [];
  userLangs = Array.from(
    new Set(userLangs.map((lang) => [lang].concat(lang.split("-")[0])).flat()),
  );
  for (const lang of userLangs) {
    await loadLanguage(lang);
  }

  const currentChangelog = changelogs.find(
    (item) => item.majorVersion === majorVersion,
  );
  const newIconIds = currentChangelog.iconChanges
    .filter(
      (iconChange) =>
        iconChange.newId &&
        (!iconChange.oldId ||
          ((iconChange.by || iconChange.src) &&
            !["flip", "resize", "minor", "merge"].includes(iconChange.edit))),
    )
    .map((iconChange) => iconChange.newId);

  const parser = new DOMParser();
  const iconsById = pageData.icons;
  for (const id in iconsById) {
    iconsById[id].id = id;
  }
  const categoryReader = new CategoryReader(categories, Object.keys(iconsById));

  const v1Changelog = changelogs.find((item) => item.majorVersion === "1");
  const iconsAddedSinceLaunch =
    Object.keys(iconsById).length - v1Changelog.iconChanges.length;
  const daysSinceLaunch =
    Date.now() / 1000 / 60 / 60 / 24 -
    new Date(v1Changelog.date).getTime() / 1000 / 60 / 60 / 24;
  const iconsAddedPerDaySinceLaunch = iconsAddedSinceLaunch / daysSinceLaunch;

  const releaseDate = publishDates[version] || currentChangelog.date;

  document
    .getElementById("icon-count")
    .replaceChildren(
      new Intl.NumberFormat().format(Object.keys(iconsById).length),
    );

  document
    .getElementById("per-day-icon-count")
    .replaceChildren(
      new Intl.NumberFormat().format(Math.round(iconsAddedPerDaySinceLaunch)),
    );

  document
    .getElementById("main-menu")
    .insertAdjacentHTML(
      "afterbegin",
      [
        new Chainable("li").append(
          new Chainable("a")
            .setAttribute(
              "href",
              `https://github.com/waysidemapping/pinhead/releases/download/v${version}/waysidemapping-pinhead-${version}.tgz`,
            )
            .append(
              new Chainable("img")
                .setAttribute("class", "inline-icon")
                .setAttribute("src", `/latest/arrow_down_to_down_bracket.svg`),
              new Chainable("span").append("download"),
            ),
        ),
        new Chainable("li").append(
          new Chainable("a")
            .setAttribute("href", `https://github.com/waysidemapping/pinhead`)
            .setAttribute("target", "_blank")
            .append(
              new Chainable("img")
                .setAttribute("class", "inline-icon")
                .setAttribute(
                  "src",
                  `/latest/arrow_top_right_from_square_outline.svg`,
                ),
              new Chainable("span").append("github"),
            ),
        ),
        new Chainable("li").append(
          new Chainable("a")
            .setAttribute(
              "href",
              `https://www.npmjs.com/package/@waysidemapping/pinhead`,
            )
            .setAttribute("target", "_blank")
            .append(
              new Chainable("img")
                .setAttribute("class", "inline-icon")
                .setAttribute(
                  "src",
                  `/latest/arrow_top_right_from_square_outline.svg`,
                ),
              new Chainable("span").append("npm"),
            ),
        ),
        new Chainable("li").append(
          new Chainable("a")
            .setAttribute(
              "href",
              `https://github.com/waysidemapping/pinhead-qgis-resources`,
            )
            .setAttribute("target", "_blank")
            .append(
              new Chainable("img")
                .setAttribute("class", "inline-icon")
                .setAttribute(
                  "src",
                  `/latest/arrow_top_right_from_square_outline.svg`,
                ),
              new Chainable("span").append("qgis"),
            ),
        ),
        new Chainable("li").append(
          new Chainable("a")
            .setAttribute("href", `/changelog`)
            .append(
              new Chainable("img")
                .setAttribute("class", "inline-icon")
                .setAttribute(
                  "src",
                  `/latest/arrow_right_from_left_bracket.svg`,
                ),
              new Chainable("span").append("changelog"),
            ),
        ),
        new Chainable("li").append(
          new Chainable("a")
            .setAttribute("href", `/coverage`)
            .append(
              new Chainable("img")
                .setAttribute("class", "inline-icon")
                .setAttribute(
                  "src",
                  `/latest/arrow_right_from_left_bracket.svg`,
                ),
              new Chainable("span").append("coverage"),
            ),
        ),
        new Chainable("li").append(
          new Chainable("a")
            .setAttribute(
              "href",
              `https://github.com/waysidemapping/pinhead/releases.atom`,
            )
            .append(
              new Chainable("img")
                .setAttribute("class", "inline-icon")
                .setAttribute("src", `/latest/rss.svg`),
              new Chainable("span").append("feed"),
            ),
        ),
      ].join(""),
    );

  function updateBodyScrollClass() {
    if (window.scrollY > 250) {
      if (!document.body.classList.contains("scrolled"))
        document.body.classList.add("scrolled");
    } else {
      if (document.body.classList.contains("scrolled"))
        document.body.classList.remove("scrolled");
    }
  }

  window.addEventListener("scroll", updateBodyScrollClass);

  updateBodyScrollClass();

  updateIconList();

  const sortButtons = document
    .getElementById("sort-controls")
    .querySelectorAll("button");
  sortButtons.forEach((element) => {
    element.addEventListener("click", (e) => {
      const targetClassName = `sort-${e.target.value}`;
      for (const button of sortButtons) {
        const className = `sort-${button.value}`;
        if (
          targetClassName === className &&
          !document.body.classList.contains(className)
        ) {
          if (!button.classList.contains("selected")) {
            button.classList.add("selected");
          }
          document.body.classList.add(className);
        } else if (document.body.classList.contains(className)) {
          document.body.classList.remove(className);
          if (button.classList.contains("selected")) {
            button.classList.remove("selected");
          }
        }
      }
      updateIconList();
    });
  });
  // document.getElementById('header-sidebar')
  //   .insertAdjacentHTML("afterbegin", [
  //     new Chainable('div')
  //       .setAttribute('class', 'sidebar-header')
  //       .append(
  //         new Chainable('h2')
  //           .setAttribute('class', 'version-title')
  //           .append(
  //             new Chainable('a')
  //               .setAttribute('href', `https://github.com/waysidemapping/pinhead/releases/tag/v${version}`)
  //               .setAttribute('target', '_blank')
  //               .append('v' + majorVersion)
  //           ),
  //         new Chainable('p')
  //           .setAttribute('class', 'date-line')
  //           .setAttribute('title', releaseDate)
  //           .append(new Date(releaseDate).toLocaleDateString(undefined, {
  //             dateStyle: "short"
  //           //  day: "numeric", month: "short", year: "numeric"
  //           }))
  //       ),
  //     // new Chainable('div')
  //     //   .setAttribute('class', 'icon-grid')
  //     //   .insertAdjacentHTML("afterbegin",
  //     //     newIconIds.map(iconId => {
  //     //       const icon = iconsById[iconId];
  //     //       return new Chainable('a')
  //     //         .setAttribute('href', '#' + iconId)
  //     //         .setAttribute('title', iconId)
  //     //         .insertAdjacentHTML("afterbegin", icon.svg)
  //     //       }
  //     //     ).join('')
  //     //   ),

  //   ].join(''));

  function updateForHash() {
    //document.getElementById('icon-search').value = '';
    //updateIconList();
    const hash = window.location.hash;
    if (hash && hash.length > 1) {
      reloadInspector(hash.slice(1));
      const target = document.querySelector(hash);
      if (target) {
        // const offset = document.getElementById('sticky-topbar')
        //   .getBoundingClientRect().height;
        // window.scrollTo({
        //   top: target.getBoundingClientRect().top -
        //     document.body.getBoundingClientRect().top -
        //     offset
        // });
      }
    } else {
      reloadInspector();
    }
  }

  function reloadInspector(iconId) {
    const inspector = document.getElementById("inspector");
    const icon = iconId && iconsById[iconId];
    if (!icon) {
      document.body.classList.remove("inspector-open");
      inspector.innerHTML = "";
      return;
    }
    const categoriesForIcon = categoryReader.rootCategoriesForIconId(iconId);
    const relatedIcons = categoryReader
      .iconIdsForRootCategoryIds(categoriesForIcon.map((cat) => cat.id))
      .filter((iconId2) => iconId2 !== iconId);

    document.body.classList.add("inspector-open");
    inspector.innerHTML = [
      new Chainable("div")
        .setAttribute("id", "inspector-header")
        .append(
          new Chainable("div")
            .setAttribute("class", "icon-label")
            .append(
              icon.svg,
              new Chainable("span")
                .setAttribute("class", "icon-name")
                .setAttribute("title", iconId)
                .append(iconId),
            ),
          new Chainable("a")
            .setAttribute("href", "#")
            .setAttribute("class", "close")
            .append(
              new Chainable("img")
                .setAttribute("class", "inline-icon")
                .setAttribute("src", `/latest/x_cross.svg`),
            ),
        ),
      new Chainable("div").setAttribute("id", "inspector-body").append(
        new Chainable("div").setAttribute("id", "inspector-top").append(
          new Chainable("div")
            .setAttribute("class", "pixel-grid")
            .insertAdjacentHTML("afterbegin", icon.svg),
          new Chainable("div").setAttribute("class", "links").append(
            new Chainable("a")
              .setAttribute("href", `v${majorVersion}/${iconId}.svg`)
              .append(
                new Chainable("img")
                  .setAttribute("class", "inline-icon")
                  .setAttribute(
                    "src",
                    `/latest/arrow_right_from_left_bracket.svg`,
                  ),
                new Chainable("span").append("open"),
              ),
            new Chainable("a")
              .setAttribute("href", `v${majorVersion}/${iconId}.svg`)
              .setAttribute("download", `${iconId}.svg`)
              .append(
                new Chainable("img")
                  .setAttribute("class", "inline-icon")
                  .setAttribute(
                    "src",
                    `/latest/arrow_down_to_down_bracket.svg`,
                  ),
                new Chainable("span").append("download"),
              ),
            new Chainable("a")
              .setAttribute("target", `_blank`)
              .setAttribute(
                "href",
                `https://github.com/waysidemapping/pinhead/blob/v${version}/icons/${(icon.srcdir ? icon.srcdir + "/" : "") + iconId}.svg`,
              )
              .append(
                new Chainable("img")
                  .setAttribute("class", "inline-icon")
                  .setAttribute(
                    "src",
                    `/latest/arrow_top_right_from_square_outline.svg`,
                  ),
                new Chainable("span").append("github"),
              ),
            new Chainable("a")
              .setAttribute("target", `_blank`)
              .setAttribute(
                "href",
                `https://commons.wikimedia.org/wiki/File:${iconId.slice(0, 1).toUpperCase()}${iconId.slice(1)}_Pinhead_icon.svg`,
              )
              .append(
                new Chainable("img")
                  .setAttribute("class", "inline-icon")
                  .setAttribute(
                    "src",
                    `/latest/arrow_top_right_from_square_outline.svg`,
                  ),
                new Chainable("span").append("commons"),
              ),
          ),
        ),
        //  ,
        // new Chainable('div')
        //   .setAttribute("class", "map-preview")
        //   .append(
        //     new Chainable('div')
        //       .setAttribute("class", "map-preview-background"),
        //     new Chainable('div')
        //       .setAttribute('class', 'map-preview-pin-icon')
        //       .insertAdjacentHTML("afterbegin", icon.svg)
        //   )
        new Chainable("h3").append("raster preview"),
        new Chainable("div")
          .setAttribute("class", "res-previews")
          .append(
            new Chainable("div")
              .setAttribute("class", "res-preview-wrap")
              .setAttribute("title", "15x15 render displayed at 15x15")
              .append(
                new Chainable("canvas")
                  .setAttribute("class", "res-preview icon")
                  .setAttribute("icon", iconId)
                  .setAttribute("scale", 1)
                  .setAttribute("width", 15)
                  .setAttribute("height", 15),
                new Chainable("p").append("1x"),
              ),
            new Chainable("div")
              .setAttribute("class", "res-preview-wrap")
              .setAttribute("title", "30x30 render displayed at 15x15")
              .append(
                new Chainable("canvas")
                  .setAttribute("class", "res-preview icon")
                  .setAttribute("icon", iconId)
                  .setAttribute("scale", 2)
                  .setAttribute("width", 30)
                  .setAttribute("height", 30),
                new Chainable("p").append("2x"),
              ),
            new Chainable("div")
              .setAttribute("class", "res-preview-wrap")
              .setAttribute("title", "45x45 render displayed at 15x15")
              .append(
                new Chainable("canvas")
                  .setAttribute("class", "res-preview icon")
                  .setAttribute("icon", iconId)
                  .setAttribute("scale", 3)
                  .setAttribute("width", 45)
                  .setAttribute("height", 45),
                new Chainable("p").append("3x"),
              ),
            new Chainable("div")
              .setAttribute("class", "res-preview-wrap")
              .setAttribute("title", "60x60 render displayed at 15x15")
              .append(
                new Chainable("canvas")
                  .setAttribute("class", "res-preview icon")
                  .setAttribute("icon", iconId)
                  .setAttribute("scale", 4)
                  .setAttribute("width", 60)
                  .setAttribute("height", 60),
                new Chainable("p").append("4x"),
              ),
          ),
        new Chainable("h3").append("SVG code"),
        new Chainable("textarea")
          .setAttribute("readonly", true)
          .setAttribute("class", "svg-code")
          .append(icon.svg),
        new Chainable("h3").append("HTML element"),
        new Chainable("textarea")
          .setAttribute("readonly", true)
          .setAttribute("class", "img-code")
          .append(
            `<img src="https://pinhead.ink/v${majorVersion}/${iconId}.svg" width="15px" height="15px"/>`,
          ),
        relatedIcons.length
          ? [
              new Chainable("h3").append("related pinheads"),
              new Chainable("div").setAttribute("class", "icon-grid").append(
                relatedIcons
                  .map((iconId) => {
                    return new Chainable("a")
                      .setAttribute("href", `#${iconId}`)
                      .append(iconsById[iconId].svg);
                  })
                  .join(""),
              ),
            ].join("")
          : "",
      ),
    ].join("");

    inspector.querySelectorAll("a.close").forEach((el) =>
      el.addEventListener("click", (e) => {
        e.preventDefault();
        history.replaceState(null, "", "#");
        updateForHash();
      }),
    );

    inspector
      .querySelectorAll("textarea")
      .forEach((el) =>
        inspector.addEventListener("focus", (e) => e.target.select()),
      );

    inspector.querySelectorAll("canvas.icon").forEach((canvas) => {
      const scale = parseInt(canvas.getAttribute("scale"));
      const context = canvas.getContext("2d");
      if (scale !== 1) context.scale(scale, scale);
      const paths = parser
        .parseFromString(
          iconsById[canvas.getAttribute("icon")].svg,
          "image/svg+xml",
        )
        .querySelectorAll("path")
        .values()
        .map((pathEl) => new Path2D(pathEl.getAttribute("d")));
      paths.forEach((path) => context.fill(path));
    });
  }

  // we have to manually scroll to any anchor since we added the list items after we loaded the page
  updateForHash();
  window.addEventListener("hashchange", function (e) {
    e.preventDefault();
    updateForHash();
  });

  const searchElement = document.getElementById("icon-search");
  searchElement.addEventListener("input", function () {
    updateIconList();
    const offset = document
      .getElementById("sticky-topbar")
      .getBoundingClientRect().height;
    window.scrollTo({
      top:
        document.getElementById("icon-list").getBoundingClientRect().top -
        document.body.getBoundingClientRect().top -
        offset,
    });
  });

  function updateIconList() {
    let listContent;

    const sortMethod = Array.from(document.body.classList)
      .find((item) => item.startsWith("sort-"))
      ?.slice(5);

    const query = (document.getElementById("icon-search")?.value || "")
      .toLowerCase()
      .trim()
      .replaceAll(/[\s_]+/gi, "");

    let filteredIcons;

    if (query.length) {
      const ts = Object.values(translations);

      filteredIcons = Object.values(iconsById).filter((icon) => {
        if (icon.sensitive) return false;

        if (icon.id.replaceAll("_", "").includes(query)) return true;

        return ts.some((t) => {
          const iconTranslation = t.icons[icon.id];
          return (
            iconTranslation?.labels?.some((label) =>
              label.toLowerCase().replaceAll(" ", "").includes(query),
            ) ||
            iconTranslation?.aliases?.some((alias) =>
              alias.toLowerCase().replaceAll(" ", "").includes(query),
            )
          );
        });
      });
      listContent = iconListSection(null, null, filteredIcons);
    } else {
      if (sortMethod === "chronological") {
        listContent = changelogs
          .toReversed()
          .map((changelog) => {
            return iconListSection(
              `v${changelog.majorVersion}`,
              `v${changelog.majorVersion}`,
              Object.values(changelogReader.iconsById)
                .filter(
                  (icon) =>
                    icon.ogV === changelog.majorVersion && !icon.sensitive,
                )
                .map((icon) => iconsById[icon.id]),
            );
          })
          .join("");
      } else if (sortMethod === "alphabetical") {
        listContent = Array.from({ length: 26 }, (_, i) =>
          String.fromCharCode(97 + i),
        )
          .map((char) => {
            return iconListSection(
              char,
              char,
              Object.values(iconsById).filter(
                (icon) => !icon.sensitive && icon.id.startsWith(char),
              ),
            );
          })
          .join("");
      } else if (sortMethod === "categorical") {
        const iconIdsByCategoryIds = categoryReader.iconIdsByCategoryIds();
        listContent = Object.entries(iconIdsByCategoryIds)
          .filter(
            ([catId, iconIds]) =>
              iconIds.filter((iconId) => !iconsById[iconId].sensitive).length >
              1,
          )
          .toSorted(([catId1], [catId2]) => {
            if (catId1 < catId2) return -1;
            if (catId1 > catId2) return 1;
            return 0;
          })
          .map(([catId, iconIds]) => {
            return iconListSection(
              "",
              catId,
              iconIds
                .map((iconId) => iconsById[iconId])
                .filter((icon) => !icon.sensitive),
            );
          })
          .join("");
      } else {
        listContent = [
          iconListSection(
            `v${majorVersion}`,
            `new!`,
            Object.values(changelogReader.iconsById)
              .filter((icon) => icon.ogV === majorVersion && !icon.sensitive)
              .map((icon) => iconsById[icon.id]),
          ),
          iconListSection(
            `a–z`,
            `a–z`,
            Object.values(iconsById).filter((icon) => !icon.sensitive),
          ),
        ].join("");
      }
    }

    document.getElementById("icon-list").innerHTML = listContent;
  }
}

function iconListSection(id, title, icons) {
  return new Chainable("div").setAttribute("id", id).append(
    [
      title ? new Chainable("h2").append(title) : "",
      icons?.length
        ? new Chainable("div").setAttribute("class", "icon-grid").append(
            icons
              .map((icon) => {
                return new Chainable("a")
                  .setAttribute("href", "#" + icon.id)
                  .setAttribute("title", icon.id)
                  .setAttribute("iconid", icon.id)
                  .setAttribute("class", "icon-item")
                  .append(icon.svg);
              })
              .join(""),
          )
        : "",
    ].join(""),
  );
}

class Chainable {
  constructor(tag) {
    this.tag = tag;
    this.attrs = "";
    this.children = "";
  }
  setAttribute(k, v) {
    this.attrs += ` ${k}="${v}"`;
    return this;
  }
  insertAdjacentHTML(_, html) {
    this.children += html;
    return this;
  }
  append(...args) {
    this.children += Array.from(args)
      .map((arg) => arg.toString())
      .join("");
    return this;
  }
  toString() {
    return `<${this.tag}${this.attrs}>${this.children}</${this.tag}>`;
  }
}
