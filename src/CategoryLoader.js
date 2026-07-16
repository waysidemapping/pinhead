import { readFileSync } from 'fs';
import { deconstructIconName } from './IconNameDeconstructor.js';

const prefixes = "anime_|cartoon_|pixel_";
const suffixes = "_outline|_tall|_squat|_filled|_left|_right|_up|_down|_top_left|_top_right|_bottom_left|_bottom_right|_up_down|_left_right|_top|_narrow|_wide|_head";

// pass in the array of icon IDs you want to categorize
export function loadCategories(iconIds) {
  const categoriesPath = 'metadata/categories.json';
  const categories = JSON.parse(readFileSync(categoriesPath));

  const explicitCategories = Object.assign({}, categories);
  const partsByIconId = {};
  const categoryInfoByIconId = {};

  iconIds.forEach(iconId => {
    const parts = deconstructIconName(iconId);
    partsByIconId[iconId] = parts;
    parts.forEach(part => {
      if (explicitCategories[part] && Object.keys(explicitCategories[part]).length === 0) {
        console.error(`⚠️ Unneeded explicit category: ${part}`);
        process.exit(1);
      }
      if (!categories[part]) {
        // automatically create categories based on icon name parts
        categories[part] = {};
      }
    });
  });

  for (const catId in categories) {
    categories[catId].id = catId;
    if (categories[catId].match) {
      categories[catId].regex = new RegExp(categories[catId].match, "g");
    } else {
      categories[catId].regex = new RegExp(`^(${prefixes})?${catId}(es|s)?(${suffixes})*$`, "g");
    }
  }

  for (const iconId in partsByIconId) {
    for (const catId in categories) {
      for (const part of partsByIconId[iconId]) {
        if (part.match(categories[catId].regex)) {
          if (!categoryInfoByIconId[iconId]) categoryInfoByIconId[iconId] = {
            rootCategories: [],
            allCategories: []
          };
          if (!categoryInfoByIconId[iconId].rootCategories.includes(catId)) categoryInfoByIconId[iconId].rootCategories.push(catId);

          let catsToPopulate = [catId];
          while (catsToPopulate.length) {
            const catId = catsToPopulate.shift();
            if (!categories[catId]) {
              console.error("⚠️ Missing category data: " + catId);
              process.exit(1);
            }
            if (!categories[catId].icons) categories[catId].icons = [];
            categories[catId].icons.push(iconId);
            if (categories[catId].super) {
              catsToPopulate = catsToPopulate.concat(stringArray(categories[catId].super));
            }
            if (!categoryInfoByIconId[iconId].allCategories.includes(catId)) categoryInfoByIconId[iconId].allCategories.push(catId);
          }
          break;
        }
      }
    }
  }
  
  for (const cat in categories) {
    if ((categories[cat].icons?.length || 0) === 0) {
      console.error(`⚠️ Unexpected empty category: ${cat}`);
      process.exit(1);
    }
    if (categories[cat].icons?.length === 1) {
      // "categories" with only one item aren't really categories so delete them
      delete categories[cat];

      // also delete from the other data structure
      for (const iconId in categoryInfoByIconId) {
        const rootIndex = categoryInfoByIconId[iconId].rootCategories.indexOf(cat);
        if (rootIndex >= 0) categoryInfoByIconId[iconId].rootCategories.splice(rootIndex, 1);

        const allIndex = categoryInfoByIconId[iconId].allCategories.indexOf(cat);
        if (allIndex >= 0) categoryInfoByIconId[iconId].allCategories.splice(allIndex, 1);
      }
    }
  }

  // load best commons category values
  for (const iconId in categoryInfoByIconId) {
    categoryInfoByIconId[iconId].commons = categoryInfoByIconId[iconId].rootCategories.map(rootCatId => {
      let catIdsToCheck = [rootCatId];
      while (catIdsToCheck.length > 0) {
        const catId = catIdsToCheck.shift();
        const cat = categories[catId];
        if (cat.commons) return stringArray(cat.commons);
        if (cat.super) catIdsToCheck = catIdsToCheck.concat(cat.super);
      }
    }).filter(Boolean).flat(1);
  }

  return {byCategoryId: categories, byIconId: categoryInfoByIconId};
}

function stringArray(value) {
  return (typeof value === 'string' ? [value] : [...value]);
}
