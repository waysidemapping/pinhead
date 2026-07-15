import { parse } from 'path';
import { globSync, writeFileSync, readFileSync } from 'fs';
import { loadCategories } from '../src/CategoryLoader.js';
import { deconstructIconName } from '../src/IconNameDeconstructor.js';

reformatCategories();
checkIcons();

function reformatCategories() {
  const categoriesPath = 'metadata/categories.json';
  const categoriesIn = JSON.parse(readFileSync(categoriesPath));
  const categoriesOut = {};
  for (const key of Object.keys(categoriesIn).toSorted()) {
    const valOut = {};
    for (const key2 of Object.keys(categoriesIn[key]).toSorted()) {
      valOut[key2] = categoriesIn[key][key2];
    }
    categoriesOut[key] = valOut;
  }
  writeFileSync(categoriesPath, JSON.stringify(categoriesOut, null, "  "));
}

function checkIcons() {

  const iconIds = {};
  const iconIdPartsObj = {};

  globSync(`./icons/**/*.svg`)
    .forEach(function checkFilename(file) {
      const iconId = parse(file).name;
      const parts = deconstructIconName(iconId);
      iconIds[iconId] = true;
      if (parts[0] !== iconId) {
        parts.forEach(part => iconIdPartsObj[part] = true);
      }
    });

  const iconIdParts = Object.keys(iconIdPartsObj).sort();
  iconIdParts
    .filter(part => !iconIds[part])
    .forEach(part => console.log(`Missing standalone icon: "${part}"`));
  console.log(`Missing base icons for ${iconIdParts.filter(part => !iconIds[part]).length} parts of ${iconIdParts.length} parts total`);

  const categoryInfo = loadCategories(Object.keys(iconIds));

  // for (const iconId in iconIds) {
  //   if ((categoryInfo.byIconId[iconId]?.allCategories?.length || 0) === 0) {
  //     console.log(`No category for icon: ${iconId}`);
  //   }
  // }

  // Object.values(categoryInfo.byCategoryId).sort((c1, c2) => c1.icons.length - c2.icons.length)
  //   .forEach(cat => console.log(`${cat.id}: ${cat.icons.length} icons`));
}
