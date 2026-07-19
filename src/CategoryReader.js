import { deconstructIconName } from "./IconNameDeconstructor.js";

const prefixes = "anime_|cartoon_|pixel_";
const suffixes =
  "_outline|_tall|_squat|_filled|_left|_right|_up|_down|_top_left|_top_right|_bottom_left|_bottom_right|_up_down|_left_right|_top|_narrow|_wide|_head";

function stringArray(value) {
  return typeof value === "string" ? [value] : [...value];
}

export class CategoryReader {
  constructor(categories, iconIds) {
    this.iconIds = iconIds;
    const explicitCategories = Object.assign({}, categories);
    this.partsByIconId = {};
    const categoryInfoByIconId = {};

    for (const iconId of iconIds) {
      const parts = deconstructIconName(iconId);
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
          `^(${prefixes})?${catId}(es|s)?(${suffixes})*$`,
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
    for (const categoryId of categoryIds) {
      for (const iconId of this.iconIds) {
        if (this.iconIdMatchesCategoryId(iconId, categoryId)) {
          outIconIds.push(iconId);
        }
      }
    }
    return outIconIds;
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
