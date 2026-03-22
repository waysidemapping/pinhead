import { writeFileSync, existsSync, rmSync, mkdirSync } from "fs";
import { downloadCategoryPages, downloadEntityStatements, fetchWikidataEntities } from "../src/CommonsConnection.js";

const pinheadTemplateRegex = /{{Pinhead\|(.+?)(?:\|v=(\d+?))}}/;

const pinheadIdByPageId = {};

const pages = await downloadCategoryPages("Category:Plain_black_Pinhead_SVG_icons")
  .catch(console.error);

for (const page of pages) {
  const content = page.revisions?.[0]?.slots?.main?.content;
  const results = content && pinheadTemplateRegex.exec(content);

  if (results && results.length >= 3) {
    const pinheadIconId = results[1];
    pinheadIdByPageId[page.pageid] = pinheadIconId;
  }
}

const entities = await downloadEntityStatements(Object.keys(pinheadIdByPageId))
  .catch(console.error);

const dataByPinheadId = {};

const properties = {
  depicts: [
    'P180'    // depicts
  ],
  represents: [
    'P1268',  // represents
    'P4878',  // symbolizes
    'P8058'   // symbol of
  ]
};

const allProps = Object.values(properties).flat();
const allUniqueEntities = Array.from(new Set(entities.map(entity => Object.keys(entity.statements).filter(key => allProps.includes(key)).map(key => entity.statements[key]))
  .flat(2)
  .map(statement => statement.mainsnak?.datavalue?.value?.id)
  .filter(Boolean)))
  .toSorted((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));

const wikidataData = await fetchWikidataEntities(allUniqueEntities, ['P13786', 'P1282']);

const translationsByLang = {};

for (const entity of entities) {
  const pinheadId = pinheadIdByPageId[entity.pageid];
  for (const attr in properties) {
    for (const prop of properties[attr]) {
      if (entity.statements[prop]) {
        for (const statement of entity.statements[prop]) {
          const qid = statement.mainsnak?.datavalue?.value?.id;
          if (qid) {
            if (!dataByPinheadId[pinheadId]) dataByPinheadId[pinheadId] = {};
            if (!dataByPinheadId[pinheadId][attr]) dataByPinheadId[pinheadId][attr] = [];
            if (!dataByPinheadId[pinheadId][attr].includes(qid)) dataByPinheadId[pinheadId][attr].push(qid);

            const info = wikidataData[qid];
            if (info) {
              const osmTags = (info.statements?.P13786 || []).concat(info.statements?.P1282 || []);
              if (osmTags.length) {
                if (!dataByPinheadId[pinheadId].osmTags) dataByPinheadId[pinheadId].osmTags = [];
                dataByPinheadId[pinheadId].osmTags = dataByPinheadId[pinheadId].osmTags.concat(osmTags);
              }

              if (info.labels) {
                for (const lang in info.labels) {
                  if (!translationsByLang[lang]) translationsByLang[lang] = { icons:{} };
                  if (!translationsByLang[lang].icons[pinheadId]) translationsByLang[lang].icons[pinheadId] = {}; 
                  if (!translationsByLang[lang].icons[pinheadId].labels) translationsByLang[lang].icons[pinheadId].labels = [];
                  translationsByLang[lang].icons[pinheadId].labels.push(info.labels[lang]);
                }
              }
              if (info.aliases) {
                for (const lang in info.aliases) {
                  if (!translationsByLang[lang]) translationsByLang[lang] = { icons:{} };
                  if (!translationsByLang[lang].icons[pinheadId]) translationsByLang[lang].icons[pinheadId] = {}; 
                  if (!translationsByLang[lang].icons[pinheadId].aliases) translationsByLang[lang].icons[pinheadId].aliases = [];
                  translationsByLang[lang].icons[pinheadId].aliases = translationsByLang[lang].icons[pinheadId].aliases.concat(info.aliases[lang]);
                }
              }
            }
          }
        }
      }
    }
  }
}

function ensureEmptyDir(dir) {
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
  }
  mkdirSync(dir, { recursive: true });
}
ensureEmptyDir('docs/translations');

writeFileSync('docs/commons_metadata.json', JSON.stringify({ date: new Date().toISOString(), iconStatements: dataByPinheadId }));
for (const lang in translationsByLang) {
  writeFileSync(`docs/translations/${lang}.json`, JSON.stringify(translationsByLang[lang]));
}
