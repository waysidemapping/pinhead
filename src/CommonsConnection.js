import { existsSync } from "fs";

import dotenv from "dotenv";
if (existsSync(".env")) {
  dotenv.config({quiet: true});
}

const userAgent ="PinheadBot/1.0 (quincy@waysidemapping.org)";
const commonsApiBase = "https://commons.wikimedia.org/w/api.php";

let _loginInfo;
async function getLoginInfo() {
  if (!_loginInfo) _loginInfo = await login();
  return _loginInfo;
}

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

export async function downloadCategoryPages(commonsCategory) {
  console.log('Downloading category pages...');
  let allPages = [];
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
    allPages = allPages.concat(pages);
    cont = data.continue?.gcmcontinue;
  } while (cont);
  console.log(`Done downloading ${allPages.length} pages`);
  return allPages;
}

export async function uploadFile(filename, svg, newFileText) {

  const loginInfo = await getLoginInfo();

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

export async function uploadNewFileDescription(title, content) {
  console.log(`Uploading new version of page text for page: ${title}...`);
  const loginInfo = await getLoginInfo();
  const params = new URLSearchParams({
    action: "edit",
    title: title,
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
  const result = await res.json();
  console.log(result.edit?.result);
  return result;
}

export async function downloadEntityStatements(ids) {
  console.log('Downloading entity statements...');
  const maxIdsPerQuery = 50;
  let allEntities = [];
  const idsToGet = ids.map(pageid => 'M' + pageid);
  while (idsToGet.length) {
    const batchIds = idsToGet.splice(0, maxIdsPerQuery);
    const batchInfo = await getMediaInfo(batchIds);
    if (batchInfo?.entities) {
      allEntities = allEntities.concat(Object.values(batchInfo.entities));
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
  console.log(`Done downloading ${allEntities.length} entities`);
  return allEntities;
}

export async function uploadClaims(pageid, claims) {
  const loginInfo = await getLoginInfo();
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

export async function fetchWikidataEntities(ids, props = []) {
  const apiUrl = 'https://www.wikidata.org/w/api.php';
  const batchSize = 50;
  const results = {};

  async function fetchBatch(batchIds) {
    const formData = new URLSearchParams();
    formData.append('action', 'wbgetentities');
    formData.append('ids', batchIds.join('|'));
    formData.append('props', 'labels|aliases|claims');
    formData.append('format', 'json');

    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
      headers: {
        "User-Agent": userAgent
      }
    });

    const data = await response.json();
    return data.entities;
  }

  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const entities = await fetchBatch(batch);

    for (const id in entities) {
      const entity = entities[id];
      const entityLabels = entity.labels || {};
      const entityAliases = entity.aliases || {};
      const claims = entity.claims || {};

      const labels = {};
      for (const lang in entityLabels) {
        labels[lang] = entityLabels[lang].value;
      }

      const aliases = {};
      for (const lang in entityAliases) {
        aliases[lang] = entityAliases[lang].map(a => a.value);
      }

      const statements = {};
      for (const prop of props) {
        if (claims[prop]) {
          statements[prop] = claims[prop].map(claim => {
            const dv = claim.mainsnak.datavalue;
            if (!dv) return null;
            const value = dv.value;
            if (value.id) return value.id;
            return value;
          });
        }
      }

      results[id] = { labels, aliases, statements };
    }
  }

  return results;
}
