const pluralize =
  typeof window === "undefined"
    ? (await import("pluralize")).default
    : window.pluralize;

const stylePrefixes = ["anime", "cartoon", "pixel"];

const variantPrefixes = [
  "heavy",
  "horizontal",
  "narrow",
  "rounded",
  "tall",
  "vertical",
  "wide",
];

const amountPrefixes = [
  "crossed",
  "stacked",
  "double",
  "triple",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
];

const prefixes = amountPrefixes.concat(stylePrefixes).concat(variantPrefixes);

const suffixes = [
  "bottom_left",
  "bottom_right",
  "down",
  "downhill",
  "filled",
  "front",
  "head",
  "left_right",
  "left",
  "narrow",
  "outline",
  "outward",
  "profile",
  "right",
  "top_left",
  "top_right",
  "top",
  "up_down",
  "up",
  "uphill",
  "wide",
];
const prepositions = [
  "above",
  "and",
  "at",
  "atop",
  "behind",
  "beside",
  "between",
  "from",
  "in",
  "into",
  "on",
  "onto",
  "over",
  "to",
  "under",
  "with",
  "within",
];
const relationalVerbs = [
  "aiming",
  "boarding",
  "carrying",
  "crossing",
  "dragging",
  "driving",
  "dropping",
  "holding",
  "jockeying",
  "kicking",
  "massaging",
  "meeting",
  "paddling",
  "piloting",
  "racing",
  "riding",
  "shoveling",
  "spiking",
  "swinging",
  "using",
  "wearing",
];
// These are words that modify the state of a base icon, e.g. "person_standing", "plane_taxiing", or "volcano_erupting"
const stateVerbs = [
  "ascending",
  "balancing",
  "climbing",
  "crawling",
  "cross_country_skiing",
  "crouching",
  "cruising",
  "dancing",
  "descending",
  "diving",
  "erupting",
  "falling",
  "fighting",
  "flying",
  "front_kicking",
  "hanging",
  "high_stepping",
  "ice_skating",
  "inline_skating",
  "jumping",
  "kneeling",
  "leaping",
  "lounging",
  "open_armed",
  "pointing",
  "praying",
  "reaching",
  "rearing",
  "running",
  "shushing",
  "sitting",
  "ski_jumping",
  "skiing",
  "sledding",
  "sleeping",
  "sliding",
  "slipping",
  "snowboarding",
  "snowshoeing",
  "speaking",
  "squatting",
  "standing",
  "swimming",
  "taxiing",
  "tow_skiing",
  "vomiting",
  "walking",
  "wind_surfing",
];

const iconNamePartSeparators = prepositions.concat(relationalVerbs);
const iconNamePartSeparator = new RegExp(
  iconNamePartSeparators.map((p) => "_" + p + "_").join("|"),
  "g",
);

export function deconstructIconName(name) {
  return name.split(iconNamePartSeparator);
}

function stringArray(value) {
  return typeof value === "string" ? [value] : [...value];
}

export class CategoryReader {
  constructor(categories, iconIds) {
    this.iconIds = iconIds;
    const explicitCategories = Object.assign({}, categories);
    this.partsByIconId = {};

    for (const iconId of iconIds) {
      const parts = deconstructIconName(iconId).map((part) =>
        part.length === 1 ? part : pluralize.singular(part),
      );
      this.partsByIconId[iconId] = parts;
      for (const part of parts) {
        if (
          explicitCategories[part] &&
          Object.keys(explicitCategories[part]).length === 0
        ) {
          console.error(`⚠️ Unneeded explicit category: ${part}`);
        }
        if (!categories[part]) {
          // automatically create categories based on icon name parts
          categories[part] = {};
        }
      }
    }

    const prefixexPart = prefixes.map((p) => p + "_").join("|");
    const suffixesPart = suffixes.map((p) => "_" + p).join("|");
    const stateSuffixesPart = relationalVerbs
      .concat(stateVerbs)
      .map((p) => "_" + p)
      .join("|");

    for (const catId in categories) {
      categories[catId].id = catId;
      if (categories[catId].match) {
        categories[catId].regex = new RegExp(categories[catId].match, "g");
      } else {
        const mainPart =
          catId.length === 1
            ? catId
            : `${pluralize.singular(catId)}|${pluralize.plural(catId)}`;
        categories[catId].regex = new RegExp(
          `^(${prefixexPart})*(${mainPart})(${stateSuffixesPart})*(${suffixesPart})*$`,
          "g",
        );
      }
    }
    this.categories = categories;
  }

  iconIdMatchesCategoryId(iconId, categoryId) {
    for (const part of this.partsByIconId[iconId]) {
      if (part.match(this.categories[categoryId].regex)) {
        return true;
      }
    }
    return false;
  }

  iconIdsByCategoryIds() {
    const iconIdsByCategoryId = {};
    const categoryIdsByIconId = {};
    for (const catId in this.categories) {
      for (const iconId of this.iconIds) {
        if (this.iconIdMatchesCategoryId(iconId, catId)) {
          const allCatIds = this.allCategoriesForCategoryId(catId);
          for (const catId of allCatIds) {
            if (!iconIdsByCategoryId[catId]) iconIdsByCategoryId[catId] = [];
            if (!categoryIdsByIconId[iconId])
              categoryIdsByIconId[iconId] = new Set();
            if (!iconIdsByCategoryId[catId].includes(iconId)) {
              iconIdsByCategoryId[catId].push(iconId);
              categoryIdsByIconId[iconId].add(catId);
            }
          }
        }
      }
    }

    const uncategorizedIconIds = new Set();
    for (const catId in iconIdsByCategoryId) {
      if (iconIdsByCategoryId[catId].length === 1) {
        const loneIconId = iconIdsByCategoryId[catId][0];
        categoryIdsByIconId[loneIconId].delete(catId);
        if (!categoryIdsByIconId[loneIconId].size) {
          uncategorizedIconIds.add(loneIconId);
          delete categoryIdsByIconId[loneIconId];
        }
        delete iconIdsByCategoryId[catId];
      }
    }
    return {
      categorized: iconIdsByCategoryId,
      uncategorized: Array.from(uncategorizedIconIds),
    };
  }

  allCategoriesForCategoryId(categoryId) {
    let categoriesToCheck = [categoryId];
    const outCategories = [];
    while (categoriesToCheck.length) {
      const categoryId = categoriesToCheck.shift();
      if (!outCategories.includes(categoryId)) {
        outCategories.push(categoryId);
        const superCategoryIds = this.categories[categoryId]?.super;
        if (superCategoryIds)
          categoriesToCheck = categoriesToCheck.concat(superCategoryIds);
      }
    }
    return outCategories;
  }

  rootCategoriesForIconId(iconId) {
    const outCategories = [];
    for (const categoryId in this.categories) {
      if (this.iconIdMatchesCategoryId(iconId, categoryId)) {
        outCategories.push(this.categories[categoryId]);
      }
    }
    return outCategories;
  }

  iconIdsForRootCategoryIds(categoryIds) {
    const outIconIds = [];
    const iconCountPerCategoryId = {};
    for (const categoryId of categoryIds) {
      iconCountPerCategoryId[categoryId] = 0;
    }
    for (const iconId of this.iconIds) {
      const matchingCategoryIds = [];
      for (const categoryId of categoryIds) {
        if (this.iconIdMatchesCategoryId(iconId, categoryId)) {
          matchingCategoryIds.push(categoryId);
          iconCountPerCategoryId[categoryId] += 1;
        }
      }
      if (matchingCategoryIds.length) {
        outIconIds.push({ iconId, matchingCategoryIds });
      }
    }
    outIconIds.sort((info1, info2) => {
      const numPartsDiff =
        this.partsByIconId[info1.iconId].length -
        this.partsByIconId[info2.iconId].length;
      // show base component icons first, if any
      if (
        (numPartsDiff !== 0 && this.partsByIconId[info1.iconId].length === 1) ||
        this.partsByIconId[info2.iconId].length === 1
      )
        return numPartsDiff;

      const numMatchingCatsDiff =
        info2.matchingCategoryIds.length - info1.matchingCategoryIds.length;
      // prefer closer matches
      if (numMatchingCatsDiff !== 0) return numMatchingCatsDiff;

      // prefer icons with less common components
      return (
        Math.min(
          ...info1.matchingCategoryIds
            .map((id) => iconCountPerCategoryId[id])
            .filter((count) => count > 0),
        ) -
        Math.min(
          ...info2.matchingCategoryIds
            .map((id) => iconCountPerCategoryId[id])
            .filter((count) => count > 0),
        )
      );
    });
    return outIconIds.map((info) => info.iconId);
  }

  commonsCategoriesForIconId = function (iconId) {
    return this.byIconId[iconId].rootCategories
      .map((rootCatId) => {
        let catIdsToCheck = [rootCatId];
        while (catIdsToCheck.length > 0) {
          const catId = catIdsToCheck.shift();
          const cat = this.byCategoryId[catId];
          if (cat.commons) return stringArray(cat.commons);
          if (cat.super) catIdsToCheck = catIdsToCheck.concat(cat.super);
        }
      })
      .filter(Boolean)
      .flat(1);
  };
}
