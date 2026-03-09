import { readFileSync, existsSync } from "fs";

import dotenv from "dotenv";
if (existsSync(".env")) {
  dotenv.config({quiet: true});
}

import { ChangelogReader } from '../src/ChangelogReader.js';

const changelogs = JSON.parse(readFileSync('dist/changelog.json'));
const iconsById = new ChangelogReader(changelogs).iconsById;

const currentVersion = JSON.parse(readFileSync('package.json')).version;
const versionParts = currentVersion.split('.');
const currentMajorVersion = versionParts[0];

const userAgent ="PinheadBot/1.0 (quincy@waysidemapping.org)";

if (versionParts[1] !== '0' || versionParts[2] !== '0' ||
  currentVersion.includes('dev') ||
  Object.values(iconsById).some(icon => parseInt(icon.v) > parseInt(currentVersion))) {
  console.log('Skipping commons upload for non-release, non-major version of Pinhead');
  process.exit(0);
}

const commonsApiBase = "https://commons.wikimedia.org/w/api.php";
const commonsCategory = "Category:Plain_black_Pinhead_SVG_icons";

const externalSources = JSON.parse(readFileSync('dist/external_sources.json'));

const iconsToUpload = JSON.parse(readFileSync('dist/icons/index.complete.json')).icons;

const validRemotePages = {};

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

        const iconInfo = iconsById[pinheadIconId];
        if (!iconInfo) {
          console.error(`Cannot find icon info for ${title}`);
        } else {
          const latestV = parseInt(iconsById[pinheadIconId].v);
          if (commonsIconV < latestV) {
             console.error(`Commons icon needs to be updated: ${title}`);
          } else {
            validRemotePages[page.pageid] = {
              pinheadIconId: pinheadIconId,
              filename: page.title.slice(5)
            };
          }
          if (iconsToUpload[pinheadIconId]) {
            delete iconsToUpload[pinheadIconId];
          }
        }
      } else {
        console.error(`Cannot find valid {{Pinhead|}} template for ${title}`);
      }
    }

    cont = data.continue?.gcmcontinue;

  } while (cont);
  console.log('Done downloading');
}

async function uploadFile(pinheadIconId, srcdir, svg, cookie, token) {
  const icon = iconsById[pinheadIconId];
  
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

  let categories = [];
  if (bys.includes('@quincylvania')) {
    categories.push('Pinhead icons by Quincy Morgan');
  }
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
  
  const categoriesString = categories.map(cat => `[[Category:${cat}]]\n`).join('');

  const filename = `${pinheadIconId} Pinhead icon.svg`

  const form = new FormData();
  form.append("action", "upload");
  form.append("filename", filename);
  form.append("file", new Blob([svg], { type: "image/svg+xml" }), filename);

  form.append("text", `=={{int:filedesc}}==
{{Information
|description    = {{en|1=Plain black vector icon depicting "${pinheadIconId.replaceAll('_', ' ')}". Intended for display at 15x15 pixels or greater. Part of the [https://pinhead.ink Pinhead] map icon library.}}
|date           = ${icon.ogDate}
|source         = https://github.com/waysidemapping/pinhead/blob/v${currentMajorVersion}.0.0/icons/${(srcdir ? srcdir + '/' : '') + pinheadIconId}.svg
|author         = ${bylines.join(', ')}
|permission     = 
|other versions = 
}}

=={{int:license-header}}==
{{Pinhead|${pinheadIconId}|v=${icon.v}}}
{{Cc-zero}}

${categoriesString}`);

  form.append("comment", "Automated upload via Node.js");
  form.append("token", token);
  form.append("ignorewarnings", "0"); // don't overwrite
  form.append("format", "json");

  const res = await fetch(commonsApiBase, {
    method: "POST",
    body: form,
    headers: {
      Cookie: cookie,
      "User-Agent": userAgent
    }
  });
  const json = await res.json();
  if (json.upload?.result === 'Success') {
    validRemotePages[json.upload.pageid] = {
      filename: json.upload.filename
    };
  } 
  console.log(json.upload?.result + ': ' + json.upload?.imageinfo?.descriptionurl);
}

async function uploadMissingIcons(loginInfo) {
  console.log('Uploading icons...');
  if (Object.keys(iconsToUpload).length) {
    console.log(`Uploading ${Object.keys(iconsToUpload).length} icons to Wikimedia Commons`);
    for (const id in iconsToUpload) {
      await uploadFile(id, iconsToUpload[id].srcdir, iconsToUpload[id].svg, loginInfo.cookie, loginInfo.token);
    }
    console.log("Upload complete");
  } else {
    console.log("No icons to upload");
  }
  console.log("Done uploading");
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

async function uploadEntityStatements(loginInfo) {
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
    const pinheadIconInfo = iconsById[remotePage.pinheadIconId];
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

const loginInfo = await login();

await downloadCategoryPages()
  .catch(console.error);

await uploadMissingIcons(loginInfo)
  .catch(console.error);

await downloadEntityStatements()
  .catch(console.error);

await uploadEntityStatements(loginInfo)
  .catch(console.error);

