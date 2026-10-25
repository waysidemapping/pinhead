const pluralize =
  typeof window === "undefined"
    ? (await import("pluralize")).default
    : window.pluralize;

export class CategoryReader {
  constructor(categoryInfo, iconIds) {
    const categories = categoryInfo.categories;
    this.iconIds = iconIds;
    const explicitCategories = Object.assign({}, categories);
    this.partsByIconId = {};

    const iconNamePartSeparators = categoryInfo.prepositions.concat(
      categoryInfo.relationalVerbs,
    );
    this.iconNamePartSeparator = new RegExp(
      iconNamePartSeparators.map((p) => "_" + p + "_").join("|"),
      "g",
    );

    for (const iconId of iconIds) {
      const parts = this.deconstructIconName(iconId).map((part) =>
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

    const prefixes = categoryInfo.amountPrefixes
      .concat(categoryInfo.stylePrefixes)
      .concat(categoryInfo.variantPrefixes);
    const prefixexPart = prefixes.map((p) => p + "_").join("|");
    const suffixesPart = categoryInfo.suffixes.map((p) => "_" + p).join("|");
    const stateSuffixesPart = categoryInfo.relationalVerbs
      .concat(categoryInfo.stateVerbs)
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

  deconstructIconName(name) {
    return name.split(this.iconNamePartSeparator);
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
    const outCategories = new Set();
    for (const categoryId in this.categories) {
      if (this.iconIdMatchesCategoryId(iconId, categoryId)) {
        outCategories.add(this.categories[categoryId]);
      }
    }
    return Array.from(outCategories);
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

  commonsCategoriesForCategory = function (cat) {
    if (cat.commons) {
      return stringArray(cat.commons);
    } else if (cat.super) {
      return stringArray(cat.super)
        .map((superCatId) => {
          const superCat = this.categories[superCatId];
          if (!superCat) {
            console.error("Missing Commons category info for: " + superCatId);
          }
          return this.commonsCategoriesForCategory(superCat);
        })
        .flat(1);
    }
    return [];
  };

  commonsCategoriesForIconId = function (iconId) {
    return Array.from(
      new Set(
        this.rootCategoriesForIconId(iconId)
          .map((rootCat) => this.commonsCategoriesForCategory(rootCat))
          .flat(1),
      ),
    );
  };
}

function stringArray(value) {
  return typeof value === "string" ? [value] : [...value];
}
