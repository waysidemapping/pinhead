import pluralize from "pluralize";

const prefixes = "anime_|cartoon_|pixel_";
const suffixes =
  "_outline|_tall|_squat|_filled|_left|_right|_up|_down|_top_left|_top_right|_bottom_left|_bottom_right|_up_down|_left_right|_top|_narrow|_wide|_head";
const iconNamePartSeparator =
  /_with_|_on_|_in_|_onto_|_into_|_and_|_under_|_over_|_above_|_beside_|_between_|_atop_|_within_|_from_|_to_|_toward_|_wearing_|_holding_|_carrying_|_crossing_|_dragging_|_aiming_|_boarding_|_riding_|_paddling_|_driving_|_jockeying_|_using_/;

function stringArray(value) {
  return typeof value === "string" ? [value] : [...value];
}

export function deconstructIconName(name) {
  return name.split(iconNamePartSeparator);
}

export class CategoryReader {
  constructor(categories, iconIds) {
    this.iconIds = iconIds;
    const explicitCategories = Object.assign({}, categories);
    this.partsByIconId = {};
    const categoryInfoByIconId = {};

    for (const iconId of iconIds) {
      const parts = deconstructIconName(iconId).map((part) =>
        pluralize.singular(part),
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

    for (const catId in categories) {
      categories[catId].id = catId;
      if (categories[catId].match) {
        categories[catId].regex = new RegExp(categories[catId].match, "g");
      } else {
        categories[catId].regex = new RegExp(
          `^(${prefixes})?(${pluralize.singular(catId)}|${pluralize.plural(catId)})(${suffixes})*$`,
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
    for (const catId in this.categories) {
      for (const iconId of this.iconIds) {
        if (this.iconIdMatchesCategoryId(iconId, catId)) {
          const allCatIds = this.allCategoriesForCategoryId(catId);
          for (const catId of allCatIds) {
            if (!iconIdsByCategoryId[catId]) iconIdsByCategoryId[catId] = [];
            if (!iconIdsByCategoryId[catId].includes(iconId))
              iconIdsByCategoryId[catId].push(iconId);
          }
        }
      }
    }
    return iconIdsByCategoryId;
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
