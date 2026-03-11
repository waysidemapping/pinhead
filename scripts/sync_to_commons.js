import { readFileSync, existsSync } from "fs";

import dotenv from "dotenv";
if (existsSync(".env")) {
  dotenv.config({quiet: true});
}

import { ChangelogReader } from '../src/ChangelogReader.js';

const changelogs = JSON.parse(readFileSync('dist/changelog.json'));
const localIconsById = new ChangelogReader(changelogs).iconsById;

const currentVersion = JSON.parse(readFileSync('package.json')).version;
const versionParts = currentVersion.split('.');
const currentMajorVersion = versionParts[1];

const userAgent ="PinheadBot/1.0 (quincy@waysidemapping.org)";

if (versionParts[2] !== '0' ||
  currentVersion.includes('dev') ||
  Object.values(localIconsById).some(icon => parseInt(icon.v) > parseInt(currentMajorVersion))) {
  console.log('Skipping commons upload for non-release, non-major version of Pinhead');
  process.exit(0);
}

const commonsApiBase = "https://commons.wikimedia.org/w/api.php";
const commonsCategory = "Category:Plain_black_Pinhead_SVG_icons";

const externalSources = JSON.parse(readFileSync('dist/external_sources.json'));
const completeIconsById =  JSON.parse(readFileSync('dist/icons/index.complete.json')).icons;
const iconsToUploadById = Object.assign({}, completeIconsById);

const unmatchedPages = [];
const pagesNeedingUpdateByIconId = {};

const validRemotePages = {};

const loginInfo = await login();

await downloadCategoryPages()
  .catch(console.error);

await uploadNewIconVersions()
  .catch(console.error);

// don't upload new icons if one if them might be a duplicate
if (!unmatchedPages.length) {
  await uploadMissingIcons()
    .catch(console.error);
}

await downloadEntityStatements()
  .catch(console.error);

await uploadEntityStatements()
  .catch(console.error);

async function login() {
  const tokenRes = await fetch(`${commonsApiBase}?action=query&meta=tokens&type=login&format=json`, {
      headers: {
        "User-Agent": userAgent
      }
    }
  );

  const tokenData = await tokenRes.json();
  const loginToken = tokenData.query.tokens.logintoken;

  let cookie = tokenRes.headers.get("set-cookie");

  const loginParams = new URLSearchParams({
    action: "login",
    lgname: process.env.COMMONS_BOT_USERNAME,
    lgpassword: process.env.COMMONS_BOT_PASSWORD,
    lgtoken: loginToken,
    format: "json"
  });

  const loginRes = await fetch(commonsApiBase, {
    method: "POST",
    body: loginParams,
    headers: {
      "Cookie": cookie, 
      "User-Agent": userAgent
    }
  });

  const loginData = await loginRes.json();
  console.log("login:", loginData);

  cookie = loginRes.headers.get("set-cookie") || cookie;

  const csrfRes = await fetch(`${commonsApiBase}?action=query&meta=tokens&type=csrf&format=json`, {
      headers: {
        Cookie: cookie,
        "User-Agent": userAgent
      }
    }
  );
  const csrfData = await csrfRes.json();
  const token = csrfData.query.tokens.csrftoken;

  return { cookie, token };
}

async function downloadCategoryPages() {
  console.log('Downloading category pages...');
  let cont = null;
  do {
    const params = new URLSearchParams({
      action: "query",
      generator: "categorymembers",
      gcmtitle: commonsCategory,
      gcmtype: "file",
      // revisions will not be returned if we go higher than this
      gcmlimit: "50",
      prop: "revisions|imageinfo",
      iiprop: "url",
      rvslots: "main",
      rvprop: "content",
      format: "json",
      formatversion: "2"
    });

    if (cont) params.set("gcmcontinue", cont);

    const res = await fetch(`${commonsApiBase}?${params}`, {
      headers: {
        "User-Agent": userAgent
      }
    });
    const data = await res.json();
    const pages = Object.values(data.query?.pages || {});
    for (const page of pages) {
      const title = page.title;
      const content = page.revisions?.[0]?.slots?.main?.content;
      const results = content && /{{Pinhead\|(.+?)(?:\|v=(\d+?))}}/.exec(content);

      if (results && results.length >= 3) {
        const pinheadIconId = results[1];
        const commonsIconV = parseInt(results[2]);

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
          unmatchedPages.push(page);
          console.error(`Cannot find local icon info for ${title}`);
        }
      } else {
        console.error(`Cannot find valid {{Pinhead|}} template for ${title}`);
      }
    }

    cont = data.continue?.gcmcontinue;

  } while (cont);
  console.log('Done downloading');
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

  const srcdir = completeIconsById[pinheadIconId].srcdir;
  const dirs = srcdir ? srcdir.split('/') : [];

  const catsForDir = {
    aircraft: ['Plain black SVG aircraft icons'],
    animals: ['Plain black SVG animal icons'],
    arrows: ['Black SVG arrow icons'],
    bicycles: ['Plain black SVG bicycle icons'],
    briefcases: ['Briefcase icons'],
    buildings: ['Plain black SVG building icons'],
    buses: ['Plain black SVG bus icons'],
    campsite_symbols: ['Tent icons'],
    cars: ['Plain black SVG automobile icons'],
    currency_symbols: ['Currency icons'],
    electrical_diagram_symbols: ['SVG electrical symbols'],
    food_and_drink: ['Plain black SVG food and drink icons'],
    hand_tools: ['Plain black SVG tool icons'],
    hearts: ['Plain black SVG heart icons'],
    japanese_map_symbols: ['SVG map symbols of Japan'],
    landforms: ['SVG nature icons'],
    manhole_covers: ['Manhole covers'],
    mobile_phones: ['Plain black SVG telephone icons'],
    motorcycles: ['Plain black SVG motorcycle icons'],
    people: ['Plain black SVG people icons'],
    phones: ['Plain black SVG telephone icons'],
    pixel_style: ['One-color SVG pixel art (black)'],
    plants: ['Plain black SVG plant icons'],
    religious: ['Plain black SVG religious computer icons'],
    tents: ['Tent icons'],
    towers_poles_masts: ['Tower icons'],
    trains: ['Plain black SVG train icons'],
    trucks: ['Plain black SVG truck icons'],
    watercraft: ['Plain black SVG watercraft icons'],
  };

  for (const dir in catsForDir) {
    if (dirs.includes(dir)) {
      categories = categories.concat(catsForDir[dir]);
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

async function uploadFile(filename, svg, newFileText) {

  const isFirstVersion = !!newFileText;
  
  const form = new FormData();
  form.append("action", "upload");
  form.append("filename", filename);
  form.append("file", new Blob([svg], { type: "image/svg+xml" }), filename);
  if (isFirstVersion) form.append("text", newFileText);
  const comment = (isFirstVersion ? 'Upload' : 'Upload latest version of') + ' Pinhead icon via Node.js';  
  form.append("comment", comment);
  form.append("token", loginInfo.token);
  // intentionally enable overwriting files only if this is an update
  form.append("ignorewarnings", isFirstVersion ? "0" : "1");
  form.append("format", "json");

  const res = await fetch(commonsApiBase, {
    method: "POST",
    body: form,
    headers: {
      Cookie: loginInfo.cookie,
      "User-Agent": userAgent
    }
  });
  return await res.json();
}

async function uploadMissingIcons() {
  console.log('Uploading icons...');
  if (Object.keys(iconsToUploadById).length) {
    console.log(`Uploading ${Object.keys(iconsToUploadById).length} icons to Wikimedia Commons`);
    for (const pinheadIconId in iconsToUploadById) {
      const filename = `${pinheadIconId} Pinhead icon.svg`;
      const text = textForNewFile(pinheadIconId);
      const json = await uploadFile(filename, iconsToUploadById[pinheadIconId].svg, text);
      if (json.upload?.result === 'Success') {
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
        console.log(`Uploading updated version of page text for file: ${filename}...`);

        validRemotePages[page.pageid] = {
          pinheadIconId: pinheadIconId,
          filename: filename
        };
        const params = new URLSearchParams({
          action: "edit",
          title: page.title,
          text: content,
          summary: "Update file description for Pinhead icon via Node.js",
          token: loginInfo.token,
          format: "json"
        });
        
        const res = await fetch(commonsApiBase, {
          method: "POST",
          body: params,
          headers: {
            Cookie: loginInfo.cookie,
            "User-Agent": userAgent
          }
        });
        const result2 = await res.json();
        console.log(result2.edit?.result);
      } else {
        console.error(result);
      }
    } else {
      console.error('Could not automatically update text description for: ' + pinheadIconId);
    }
  }
  console.log('Done uploading')
}

async function downloadEntityStatements() {
  console.log('Downloading entity statements...');

  const idsToGet = Object.keys(validRemotePages).map(pageid => 'M' + pageid);

  const maxIdsPerQuery = 50;
  while (idsToGet.length) {
    const batchIds = idsToGet.splice(0, maxIdsPerQuery);
    const batchInfo = await getMediaInfo(batchIds);
    if (batchInfo.entities && Object.keys(batchInfo.entities).length) {
      for (const mid in batchInfo.entities) {
        const item = batchInfo.entities[mid];
        const pageid = mid.slice(1);
        const page = validRemotePages[pageid];
        if (!page) {
          console.error('Cannot find page for: ' + pageid);
          console.log(item);
          console.error('Continuing anyway...');
        }
        // statements will be undefined if none have been added yet
        page.statements = item.statements || [];
      }
    } else {
      console.error('Could not get entities for: ' + batchIds);
      console.error('Continuing anyway...');
    }
  }

  async function getMediaInfo(ids) {
    const params = new URLSearchParams({
      action: "wbgetentities",
      ids: ids.join("|"),
      format: "json"
    });

    const res = await fetch(`${commonsApiBase}?${params}`, {
      headers: {
        "User-Agent": userAgent
      }
    });
    return res.json();
  }
  console.log('Done downloading');
}

async function uploadEntityStatements() {
  console.log('Uploading entity statements...');

  const yearRegex = /^\d{4}-\d{2}-\d{2}$/;

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
  
  for (const pageid in validRemotePages) {
    const remotePage = validRemotePages[pageid];
    if (!remotePage.statements) {
      console.error('Missing statements for ' + remotePage.filename);
      return;
    }
    const propsToUpload = Object.assign({}, defaultProps);
    const pinheadIconInfo = localIconsById[remotePage.pinheadIconId];
    if (!pinheadIconInfo) {
      console.error('Missing Pinhead icon info for ' + remotePage.filename);
      return;
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
    if (Object.keys(propsToUpload).length) {
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

  async function uploadClaims(pageid, claims) {
    const params = new URLSearchParams({
      action: "wbeditentity",
      id: 'M' + pageid,
      data: JSON.stringify({
        claims: claims
      }),
      token: loginInfo.token,
      format: "json"
    });

    const res = await fetch(commonsApiBase, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cookie": loginInfo.cookie,
        "User-Agent": userAgent
      },
      body: params
    });
    return await res.json();
  }
}
