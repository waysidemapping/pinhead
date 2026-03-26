import { readFileSync } from "fs";

import { downloadCategoryPages, uploadFile, uploadNewFileDescription, downloadEntityStatements, uploadClaims } from "../src/CommonsConnection.js";
import { ChangelogReader } from '../src/ChangelogReader.js';

const changelogs = JSON.parse(readFileSync('dist/changelog.json'));
const changelogReader = new ChangelogReader(changelogs);
const localIconsById = changelogReader.iconsById;
const localIconsByVersionedIconId = changelogReader.iconsByVersionedIconId;

const currentVersion = JSON.parse(readFileSync('package.json')).version;
const versionParts = currentVersion.split('.');
const currentMajorVersion = versionParts[1];

const pinheadTemplateRegex = /{{Pinhead\|(.+?)(?:\|v=(\d+?))}}/;

if (versionParts[2] !== '0' ||
  currentVersion.includes('dev') ||
  Object.values(localIconsById).some(icon => parseInt(icon.v) > parseInt(currentMajorVersion))) {
  console.log('Skipping commons upload for non-release, non-major version of Pinhead');
  process.exit(0);
}

const externalSources = JSON.parse(readFileSync('dist/external_sources.json'));
const completeIconsById =  JSON.parse(readFileSync('dist/icons/index.complete.json')).icons;
const iconsToUploadById = Object.assign({}, completeIconsById);
const pagesNeedingUpdateByIconId = {};

const validRemotePages = {};

const pages = await downloadCategoryPages("Category:Plain_black_Pinhead_SVG_icons")
  .catch(console.error);

for (const page of pages) {
  processCategoryPage(page);
}

await uploadNewIconVersions()
  .catch(console.error);

await uploadMissingIcons()
  .catch(console.error);

const entities = await downloadEntityStatements(Object.keys(validRemotePages))
  .catch(console.error);

for (const item of entities) {
  const pageid = item.id.slice(1);
  const page = validRemotePages[pageid];
  if (page) {
    // statements will be undefined if none have been added yet
    page.statements = item.statements || [];
  } else {
    console.error('Cannot find page for: ' + pageid);
    console.log(item);
    console.error('Continuing anyway...');
  }
}

await uploadEntityStatements()
  .catch(console.error);

function processCategoryPage(page) {
  const title = page.title;
  const content = page.revisions?.[0]?.slots?.main?.content;
  const results = content && pinheadTemplateRegex.exec(content);

  if (results && results.length >= 3) {
    const pinheadIconId = results[1];
    const commonsIconV = parseInt(results[2]);
    const versionedIconId = `v${commonsIconV}/${pinheadIconId}`;
    const targetId = localIconsByVersionedIconId[versionedIconId];
    if (targetId === pinheadIconId) {
      const iconInfo = localIconsById[pinheadIconId];
      if (iconInfo) {
        const latestV = parseInt(localIconsById[pinheadIconId].v);
        if (commonsIconV < latestV) {
          pagesNeedingUpdateByIconId[pinheadIconId] = page;
        } else {
          validRemotePages[page.pageid] = {
            pinheadIconId: pinheadIconId,
            filename: page.title.slice(5)
          };
        }
        if (iconsToUploadById[pinheadIconId]) {
          delete iconsToUploadById[pinheadIconId];
        }
      } else {
        console.error(`Cannot find local icon info for Commmons page ${title} with icon id ${pinheadIconId} from version ${commonsIconV}`);
      }
    } else {
      console.log(`Icon renamed and needs to be manually moved on Commons: ${pinheadIconId} -> ${targetId}`);
      if (iconsToUploadById[pinheadIconId]) {
        delete iconsToUploadById[pinheadIconId];
      }
      if (iconsToUploadById[targetId]) {
        delete iconsToUploadById[targetId];
      }
    }
  } else {
    console.error(`Cannot find valid {{Pinhead|}} template for ${title}`);
  }
}

function commonsPageAuthorValue(pinheadIconId) {
  const icon = localIconsById[pinheadIconId];
  let bys = (icon.by || []).concat(icon.srcBy || []);
  let bylines = bys
    .map(by => {
      if (by === '@quincylvania') return `[[User:Quincylvania|Quincy Morgan]]`;
      return `GitHub user [https://github.com/${by.slice(1)} ${by}]`;
    });
  bylines = bylines.concat((icon.src || [])
    .filter(src => !src.includes('://'))
    .map(srcId => {
      const source = externalSources.find(source => source.id === srcId);
      return `[${source.repo.slice(0, -4)} ${source.name}] contributors`;
    })
  );
  return [...new Set(bylines)].join(', ');
}

function commonsPageSourceValue(pinheadIconId) {
  const srcdir = completeIconsById[pinheadIconId].srcdir;
  return `https://github.com/waysidemapping/pinhead/blob/v${currentVersion}/icons/${(srcdir ? srcdir + '/' : '') + pinheadIconId}.svg`;
}

function commonsPageCategoriesText(pinheadIconId) {
  const icon = localIconsById[pinheadIconId];
  let bys = (icon.by || []).concat(icon.srcBy || []);

  let categories = [];
  if (bys.includes('@quincylvania')) {
    categories.push('Pinhead icons by Quincy Morgan');
  }
  const catsForDir = {
    'abstract_symbols/arrows': ['Black SVG arrow icons'],
    'abstract_symbols/currency_symbols': ['Currency icons'],
    'abstract_symbols/electrical_diagram_symbols': ['SVG electrical symbols'],
    'abstract_symbols/hearts': ['Plain black SVG heart icons'],
    'abstract_symbols/japanese_map_symbols': ['SVG map symbols of Japan'],
    animals: ['Plain black SVG animal icons'],
    benches: ['Plain black SVG bench icons'],
    body_parts: ['Plain black SVG medical icons'],
    'boundaries/us': ['Plain black SVG icon maps of the United States'],
    boundaries: ['Plain black SVG icon maps'],
    briefcases: ['Plain black SVG briefcase icons'],
    'abstract_symbols/campsite_symbols': ['Plain black SVG tent icons'],
    'buildings/castles': ['Plain black SVG castle icons'],
    'buildings/tents': ['Plain black SVG tent icons'],
    buildings: ['Plain black SVG building icons'],
    food_and_drink: ['Plain black SVG food and drink icons'],
    hand_tools: ['Plain black SVG tool icons'],
    landforms: ['SVG nature icons'],
    manhole_covers: ['Plain black SVG manhole cover icons'],
    medical_devices_and_medicine: ['Plain black SVG medical icons'],
    microbiology: ['Plain black SVG medical icons'],
    mobile_phones: ['Plain black SVG telephone icons'],
    passports: ['Plain black SVG passport icons'],
    people: ['Plain black SVG people icons'],
    phones: ['Plain black SVG telephone icons'],
    'pixel_style/buildings': ['One-color SVG pixel art (black)', 'Plain black SVG building icons'],
    'pixel_style/currency_symbols': ['One-color SVG pixel art (black)', 'Currency icons'],
    'pixel_style/food': ['One-color SVG pixel art (black)', 'Plain black SVG food and drink icons'],
    'pixel_style/vehicles': ['One-color SVG pixel art (black)', 'Plain black SVG vehicle icons'],
    pixel_style: ['One-color SVG pixel art (black)'],
    plants: ['Plain black SVG plant icons'],
    religious: ['Plain black SVG religious computer icons'],
    shopping_bags: ['Plain black SVG shopping bag icons'],
    tags: ['Plain black SVG tag icons'],
    towers_poles_masts: ['Tower icons'],
    'vehicles/aircraft': ['Plain black SVG aircraft icons'],
    'vehicles/bicycles': ['Plain black SVG bicycle icons'],
    'vehicles/buses': ['Plain black SVG bus icons'],
    'vehicles/cars': ['Plain black SVG automobile icons'],
    'vehicles/motorcycles': ['Plain black SVG motorcycle icons'],
    'vehicles/trains': ['Plain black SVG train icons'],
    'vehicles/trucks': ['Plain black SVG truck icons'],
    'vehicles/watercraft': ['Plain black SVG watercraft icons'],
    water_pipes: ['Plumbing icons'],
  };

  const srcdir = completeIconsById[pinheadIconId].srcdir;
  if (srcdir) {
    for (const dirPrefix in catsForDir) {
      if (srcdir.startsWith(dirPrefix)) {
        categories = categories.concat(catsForDir[dirPrefix]);
        break;
      }
    }
  }
  return categories.map(cat => `[[Category:${cat}]]\n`).join('');
}

function textForNewFile(pinheadIconId) {
  const icon = localIconsById[pinheadIconId];  
  return `=={{int:filedesc}}==
{{Information
|description    = {{en|1=Plain black vector icon depicting "${pinheadIconId.replaceAll('_', ' ')}". Intended for display at 15x15 pixels or greater. Part of the [https://pinhead.ink Pinhead] map icon library.}}
|date           = ${icon.ogDate}
|source         = ${commonsPageSourceValue(pinheadIconId)}
|author         = ${commonsPageAuthorValue(pinheadIconId)}
|permission     = 
|other versions = 
}}

=={{int:license-header}}==
{{Pinhead|${pinheadIconId}|v=${icon.v}}}
{{Cc-zero}}

${commonsPageCategoriesText(pinheadIconId)}`;
}

async function uploadMissingIcons() {
  console.log('Uploading icons...');
  if (Object.keys(iconsToUploadById).length) {
    console.log(`Uploading ${Object.keys(iconsToUploadById).length} icons to Wikimedia Commons`);
    for (const pinheadIconId in iconsToUploadById) {
      const filename = `${pinheadIconId} Pinhead icon.svg`;
      const text = textForNewFile(pinheadIconId);
      console.log('Uploading file for: ' + pinheadIconId);
      const json = await uploadFile(filename, iconsToUploadById[pinheadIconId].svg, text);
      if (json.upload?.result === 'Success' && json.upload.pageid && json.upload.filename) {
        validRemotePages[json.upload.pageid] = {
          pinheadIconId: pinheadIconId,
          filename: json.upload.filename
        };
      }
      console.log(json.upload?.result + ': ' + json.upload?.imageinfo?.descriptionurl);
    }
    console.log("Upload complete");
  } else {
    console.log("No icons to upload");
  }
  console.log("Done uploading");
}

function updatedFileText(text, pinheadIconId) {

  const sourceRegex = /^((?:\r|\n|.)*\| *?source *?=\s*)((?:\r|\n|.)*?)((?:\n\||}})(?:\r|\n|.)*)$/;
  const authorRegex = /^((?:\r|\n|.)*\| *?author *?=\s*)((?:\r|\n|.)*?)((?:\n\||}})(?:\r|\n|.)*)$/;
  const versionRegex = /^((?:\r|\n|.)*{{Pinhead\|.*?\|v=\s*)((?:\r|\n|.)*?)((?:\||}})(?:\r|\n|.)*)$/;

  const sourceText = commonsPageSourceValue(pinheadIconId);
  const authorText = commonsPageAuthorValue(pinheadIconId);
  if (sourceRegex.test(text)) {
    text = text.replace(sourceRegex, `$1${sourceText}$3`);
  } else {
    return false;
  }
  if (authorRegex.test(text)) {
    text = text.replace(authorRegex, `$1${authorText}$3`);
  } else {
    return false;
  }
  if (versionRegex.test(text)) {
    text = text.replace(versionRegex, `$1${localIconsById[pinheadIconId].v}$3`);
  } else {
    return false;
  }
  return text;
}

async function uploadNewIconVersions() {
  console.log('Uploading updated icons...');
  for (const pinheadIconId in pagesNeedingUpdateByIconId) {
    const page = pagesNeedingUpdateByIconId[pinheadIconId];
    let content = page.revisions?.[0]?.slots?.main?.content;
    content = updatedFileText(content, pinheadIconId);
    if (content) {
      const filename = page.title.slice(5);
      const svg = completeIconsById[pinheadIconId].svg;
      console.log(`Uploading updated version of file: ${filename}`);
      const result = await uploadFile(filename, svg);
      if (result.upload?.result === 'Success' || result.error?.code === 'fileexists-no-change') {
        if (result.upload?.result === 'Success') {
          console.log('Success');
        } else {
          console.log('File already up to date');
        }      
        validRemotePages[page.pageid] = {
          pinheadIconId: pinheadIconId,
          filename: filename
        };
        await uploadNewFileDescription(page.title, content);
      } else {
        console.error(result);
      }
    } else {
      console.error('Could not automatically update text description for: ' + pinheadIconId);
    }
  }
  console.log('Done uploading')
}

async function uploadEntityStatements() {
  console.log('Uploading entity statements...');

  const yearRegex = /^\d{4}-\d{2}-\d{2}$/;
  
  for (const pageid in validRemotePages) {
    const remotePage = validRemotePages[pageid];
    if (!remotePage.statements) {
      console.error('Missing statements for ' + remotePage.filename);
      return;
    }

    const propsToUpload = getPropsToUpload(remotePage);

    if (propsToUpload && Object.keys(propsToUpload).length) {
      const claims = claimsForProps(propsToUpload);
      console.log('Uploading props for ' + remotePage.filename + ': ' + claims.map(claim => claim.mainsnak.property));
      const data = await uploadClaims(pageid, claims);
      if (data.success !== 1) {
        console.log(data);
      } else {
        console.log('success: ' + data.success);
      }
    }
  }
  console.log('Done uploading');

  function getPropsToUpload(remotePage) {

    const defaultProps = {
      P31: 'Q52827',          // instance of        = pictogram
      P7482: 'Q138577495',    // source of file     = Pinhead
      P1163: 'image/svg+xml', // media type
      P2061: 'Q20970430',     // aspect ratio (W:H) = 1:1
      P275: 'Q6938433',       // copyright license  = Creative Commons CC0 License
      P6216: 'Q88088423',     // copyright status   = copyrighted, dedicated to the public domain by copyright holder
      P462: 'Q23445',         // color              = black
    };
    const dependentPropsBySupportingProp = {
      // only add copyright license if we're also adding copyright status
      P6216: 'P275'
    };
    const propsForDir = {
      pixel_style: {
        P136: 'Q811179'        // genre = pixel art
      }
    };
       
    const pinheadIconInfo = localIconsById[remotePage.pinheadIconId];
    if (!pinheadIconInfo) {
      console.error('Missing Pinhead icon info for ' + remotePage.filename);
      return;
    }
    const propsToUpload = Object.assign({}, defaultProps);
    const srcdir = completeIconsById[remotePage.pinheadIconId].srcdir;
    if (srcdir) {
      for (const dirPrefix in propsForDir) {
        if (srcdir.startsWith(dirPrefix)) {
          Object.assign(propsToUpload, propsForDir[dirPrefix])
          break;
        }
      }
    }

    // inception = date
    propsToUpload.P571 = pinheadIconInfo.ogDate;

    // This is commented out since the unicode character property is not yet recommended for Commons files
    // if (pinheadIconInfo.char) {
    //   propsToUpload.P487 = pinheadIconInfo.char;
    // }
    for (const prop in remotePage.statements) {
      if (propsToUpload[prop]) {
        delete propsToUpload[prop];
        if (dependentPropsBySupportingProp[prop] && propsToUpload[dependentPropsBySupportingProp[prop]]) {
          delete propsToUpload[dependentPropsBySupportingProp[prop]];
        }
      }
    }
    return propsToUpload;
  }

  function claimsForProps(props) {
    const claims = [];
    for (const prop in props) {
      const vals = Array.isArray(props[prop]) ? props[prop] : [props[prop]];
      for (const val of vals) {
        const claim = {
          mainsnak: {
            snaktype: "value",
            property: prop,
            datavalue: {}
          },
          type: "statement",
          rank: "normal"
        }
        
        if (yearRegex.test(val)) {
          claim.mainsnak.datavalue = {
            value: {
              "time": `+${val}T00:00:00Z`,
              "timezone": 0,
              "before": 0,
              "after": 0,
              "precision": 11,
              "calendarmodel": "http://www.wikidata.org/entity/Q1985727"
            },
            type: "time"
          };
        } else if (val.slice(0, 1) === 'Q') {
          claim.mainsnak.datavalue = {
            value: {
              "entity-type": "item",
              "numeric-id": parseInt(val.slice(1))
            },
            type: "wikibase-entityid"
          };
        } else {
          claim.mainsnak.datavalue = {
            value: val,
            type: "string"
          };
        }
        claims.push(claim);
      } 
    }
    return claims;
  }
}
