import { readFileSync, existsSync } from "fs";

import dotenv from "dotenv";
if (existsSync(".env")) {
  dotenv.config();
}

import { ChangelogReader } from '../src/ChangelogReader.js';

const changelogs = JSON.parse(readFileSync('dist/changelog.json'));
const iconsById = new ChangelogReader(changelogs).iconsById;

const currentVersion = JSON.parse(readFileSync('package.json')).version;
const versionParts = currentVersion.split('.');
const currentMajorVersion = versionParts[0];

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

async function downloadCategoryPages(category) {
  let cont = null;
  do {
    const params = new URLSearchParams({
      action: "query",
      generator: "categorymembers",
      gcmtitle: category,
      gcmtype: "file",
      gcmlimit: "500",
      prop: "revisions|imageinfo",
      iiprop: "url",
      rvslots: "main",
      rvprop: "content",
      format: "json"
    });

    if (cont) params.set("gcmcontinue", cont);

    const res = await fetch(`${commonsApiBase}?${params}`);
    const data = await res.json();

    const pages = Object.values(data.query?.pages || {});

    for (const page of pages) {
      const title = page.title;
      const content = page.revisions?.[0]?.slots?.main?.["*"];
      const results = content && /{{Pinhead\|(.+?)(?:\|v=(\d+?))}}/.exec(content);

      if (results && results.length >= 3) {
        const iconId = results[1];
        const commonsIconV = parseInt(results[2]);

        const iconInfo = iconsById[iconId];
        if (!iconInfo) {
          console.error(`Cannot find icon info for ${title}`);
        } else {
          const latestV = parseInt(iconsById[iconId].v);
          if (commonsIconV < latestV) {
             console.error(`Commons icon needs to be updated: ${title}`);
          }
          if (iconsToUpload[iconId]) {
            delete iconsToUpload[iconId];
          }
        }
      } else {
        console.error(`Cannot find valid {{Pinhead|}} template for ${title}`);
      }
    }

    cont = data.continue?.gcmcontinue;

  } while (cont);
}

async function login() {
  const tokenRes = await fetch(
    `${commonsApiBase}?action=query&meta=tokens&type=login&format=json`
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
    headers: { cookie }
  });

  const loginData = await loginRes.json();
  console.log("login:", loginData);

  cookie = loginRes.headers.get("set-cookie") || cookie;

  const csrfRes = await fetch(
    `${commonsApiBase}?action=query&meta=tokens&type=csrf&format=json`,
    { headers: { cookie: cookie } }
  );
  const csrfData = await csrfRes.json();
  const token = csrfData.query.tokens.csrftoken;

  return { cookie, token };
}

async function uploadFile(iconId, srcdir, svg, cookie, token) {
  const icon = iconsById[iconId];
  
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

  const categories = [];
  if (bys.includes('@quincylvania')) {
    categories.push('Pinhead icons by Quincy Morgan');
  }
  if (srcdir && srcdir.includes('pixel_style')) {
    categories.push('One-color SVG pixel art (black)');
  }
  const categoriesString = categories.map(cat => `[[Category:${cat}]]\n`).join('');

  const filename = `${iconId} Pinhead icon.svg`

  const form = new FormData();
  form.append("action", "upload");
  form.append("filename", filename);
  form.append("file", new Blob([svg], { type: "image/svg+xml" }), filename);

  form.append("text", `=={{int:filedesc}}==
{{Information
|description    = {{en|1=Plain black vector icon depicting "${iconId.replaceAll('_', ' ')}". Intended for display at 15x15 pixels or greater. Part of the [https://pinhead.ink Pinhead] map icon library.}}
|date           = ${icon.date}
|source         = https://github.com/waysidemapping/pinhead/blob/v${currentMajorVersion}.0.0/icons/${(srcdir ? srcdir + '/' : '') + iconId}.svg
|author         = ${bylines.join(', ')}
|permission     = 
|other versions = 
}}

=={{int:license-header}}==
{{Pinhead|${iconId}|v=${icon.v}}}

${categoriesString}`);

  form.append("comment", "Automated upload via Node.js");
  form.append("token", token);
  form.append("ignorewarnings", "0"); // don't overwrite
  form.append("format", "json");

  const res = await fetch(commonsApiBase, {
    method: "POST",
    body: form,
    headers: { Cookie: cookie }
  });
  const json = await res.json();
  console.log(json.upload?.result + ': ' + json.upload?.imageinfo?.descriptionurl);
}

async function uploadMissingIcons() {
  if (Object.keys(iconsToUpload).length) {
    console.log(`Uploading ${Object.keys(iconsToUpload).length} icons to Wikimedia Commons`);
    const {cookie, token} = await login();
    for (const id in iconsToUpload) {
      await uploadFile(id, iconsToUpload[id].srcdir, iconsToUpload[id].svg, cookie, token);
    }
    console.log("Upload complete");
  } else {
    console.log("No icons to upload");
  }
}

await downloadCategoryPages(commonsCategory)
  .catch(console.error);

await uploadMissingIcons()
  .catch(console.error);
