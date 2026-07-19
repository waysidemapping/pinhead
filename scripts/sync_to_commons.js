import { readFileSync } from "fs";
import {
  downloadCategoryPages,
  uploadFile,
  uploadNewFileDescription,
  downloadEntityStatements,
  uploadClaims,
  moveFile,
} from "../src/CommonsConnection.js";
import { ChangelogReader } from "../src/ChangelogReader.js";
import { CategoryReader } from "../src/CategoryReader.js";

const changelogs = JSON.parse(readFileSync("dist/changelog.json"));
const changelogReader = new ChangelogReader(changelogs);
const localIconsById = changelogReader.iconsById;
const localIconsByVersionedIconId = changelogReader.iconsByVersionedIconId;

const currentVersion = JSON.parse(readFileSync("package.json")).version;
const versionParts = currentVersion.split(".");
const currentMajorVersion = versionParts[1];

const pinheadTemplateRegex = /{{Pinhead\|(.+?)(?:\|v=(\d+?))}}/;

if (
  versionParts[2] !== "0" ||
  currentVersion.includes("dev") ||
  Object.values(localIconsById).some(
    (icon) => parseInt(icon.v) > parseInt(currentMajorVersion),
  )
) {
  console.log(
    "Skipping commons upload for non-release, non-major version of Pinhead",
  );
  process.exit(0);
}

const externalSources = JSON.parse(readFileSync("dist/external_sources.json"));
const completeIconsById = JSON.parse(
  readFileSync("dist/icons/index.complete.json"),
).icons;
const iconsToUploadById = Object.assign({}, completeIconsById);
const pagesNeedingUpdateByIconId = {};

const categoryReader = new CategoryReader(Object.keys(completeIconsById));

const validRemotePages = {};

const iconsToMoveByOldId = {};

const pages = await downloadCategoryPages(
  "Category:Plain_black_Pinhead_SVG_icons",
).catch(catchError);

for (const page of pages) {
  processCategoryPage(page);
}

await moveRenamedIcons().catch(catchError);

await uploadNewIconVersions().catch(catchError);

await uploadMissingIcons().catch(catchError);

const entities = await downloadEntityStatements(
  Object.keys(validRemotePages),
).catch(catchError);

for (const item of entities) {
  const pageid = item.id.slice(1);
  const page = validRemotePages[pageid];
  if (page) {
    // statements will be undefined if none have been added yet
    page.statements = item.statements || [];
  } else {
    console.error("Cannot find page for: " + pageid);
    console.log(item);
    console.error("Continuing anyway...");
  }
}

await uploadEntityStatements().catch(catchError);

function catchError(error) {
  console.error(error);
  process.exit(1);
}

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
            filename: page.title.slice(5),
          };
        }
        if (iconsToUploadById[pinheadIconId]) {
          delete iconsToUploadById[pinheadIconId];
        }
      } else {
        console.error(
          `Cannot find local icon info for Commmons page ${title} with icon id ${pinheadIconId} from version ${commonsIconV}`,
        );
      }
    } else {
      console.log(
        `Icon was renamed. Will attempt to move on Commons: ${pinheadIconId} -> ${targetId}`,
      );
      iconsToMoveByOldId[pinheadIconId] = {
        targetId: targetId,
        page: page,
      };
      // Remove target to avoid uploading duplicate icon
      if (iconsToUploadById[targetId]) {
        delete iconsToUploadById[targetId];
      }
    }
  } else {
    console.error(`Cannot find valid {{Pinhead|}} template for ${title}`);
  }
}

async function moveRenamedIcons() {
  for (const oldId in iconsToMoveByOldId) {
    const page = iconsToMoveByOldId[oldId].page;
    const oldFilename = page.title.slice(5);
    const targetId = iconsToMoveByOldId[oldId].targetId;
    const newFilename = `${targetId} Pinhead icon.svg`;

    // Don't leave a redirect page if we're going to upload another icon with the same name
    const noRedirect = !!iconsToUploadById[oldId];

    let reason = "Fix name of file originally uploaded by me.";
    if (noRedirect) {
      reason +=
        " Leaving no redirect to make way for corrected file of this name.";
    }
    const result = await moveFile(oldFilename, newFilename, reason, noRedirect);
    console.log(result);
    page.title = "File:" + newFilename.replaceAll("_", " ");
    // Always update page even if file is the same since the page text needs to be updated
    pagesNeedingUpdateByIconId[targetId] = page;
  }
}

function commonsPageAuthorValue(pinheadIconId) {
  const icon = localIconsById[pinheadIconId];
  let bys = (icon.by || []).concat(icon.srcBy || []);
  let bylines = bys.map((by) => {
    if (by === "@quincylvania") return `[[User:Quincylvania|Quincy Morgan]]`;
    return `GitHub user [https://github.com/${by.slice(1)} ${by}]`;
  });
  bylines = bylines.concat(
    (icon.src || [])
      .filter((src) => !src.includes("://"))
      .map((srcId) => {
        const source = externalSources.find((source) => source.id === srcId);
        return `[${source.repo.slice(0, -4)} ${source.name}] contributors`;
      }),
  );
  return [...new Set(bylines)].join(", ");
}

function commonsPageSourceValue(pinheadIconId) {
  return `https://github.com/waysidemapping/pinhead/blob/v${currentVersion}/icons/${pinheadIconId}.svg`;
}

function commonsPageCategoriesText(pinheadIconId) {
  const icon = localIconsById[pinheadIconId];
  let bys = (icon.by || []).concat(icon.srcBy || []);

  let categories = [];
  if (bys.includes("@quincylvania")) {
    categories.push("Pinhead icons by Quincy Morgan");
  }

  const commonsCategories =
    categoryReader.commonsCategoriesForIconId(pinheadIconId);
  if (commonsCategories?.length) {
    categories = categories.concat(commonsCategories);
  }
  return categories.map((cat) => `[[Category:${cat}]]\n`).join("");
}

function textForNewFile(pinheadIconId) {
  const icon = localIconsById[pinheadIconId];
  return `=={{int:filedesc}}==
{{Information
|description    = {{en|1=Plain black vector icon depicting "${pinheadIconId.replaceAll("_", " ")}". Intended for display at 15x15 pixels or greater. Part of the [https://pinhead.ink Pinhead] map icon library.}}
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
  console.log("Uploading icons...");
  if (Object.keys(iconsToUploadById).length) {
    console.log(
      `Uploading ${Object.keys(iconsToUploadById).length} icons to Wikimedia Commons`,
    );
    for (const pinheadIconId in iconsToUploadById) {
      const filename = `${pinheadIconId} Pinhead icon.svg`;
      const text = textForNewFile(pinheadIconId);
      console.log("Uploading file for: " + pinheadIconId);
      const json = await uploadFile(
        filename,
        iconsToUploadById[pinheadIconId].svg,
        text,
      );
      if (
        json.upload?.result === "Success" &&
        json.upload.pageid &&
        json.upload.filename
      ) {
        validRemotePages[json.upload.pageid] = {
          pinheadIconId: pinheadIconId,
          filename: json.upload.filename,
        };
      }
      console.log(
        json.upload?.result + ": " + json.upload?.imageinfo?.descriptionurl,
      );
    }
    console.log("Upload complete");
  } else {
    console.log("No icons to upload");
  }
  console.log("Done uploading");
}

function updatedFileText(text, pinheadIconId) {
  const sourceRegex =
    /^((?:\r|\n|.)*\| *?source *?=\s*)((?:\r|\n|.)*?)((?:\n\||}})(?:\r|\n|.)*)$/;
  const authorRegex =
    /^((?:\r|\n|.)*\| *?author *?=\s*)((?:\r|\n|.)*?)((?:\n\||}})(?:\r|\n|.)*)$/;
  const versionRegex =
    /^((?:\r|\n|.)*{{Pinhead\|)(.*?)(\|v=\s*)((?:\r|\n|.)*?)((?:\||}})(?:\r|\n|.)*)$/;

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
    text = text.replace(
      versionRegex,
      `$1${pinheadIconId}$3${localIconsById[pinheadIconId].v}$5`,
    );
  } else {
    return false;
  }
  return text;
}

async function uploadNewIconVersions() {
  console.log("Uploading updated icons...");
  for (const pinheadIconId in pagesNeedingUpdateByIconId) {
    const page = pagesNeedingUpdateByIconId[pinheadIconId];
    let content = page.revisions?.[0]?.slots?.main?.content;
    content = updatedFileText(content, pinheadIconId);
    if (content) {
      const filename = page.title.slice(5);
      const svg = completeIconsById[pinheadIconId].svg;
      console.log(`Uploading updated version of file: ${filename}`);
      const result = await uploadFile(filename, svg);
      if (
        result.upload?.result === "Success" ||
        result.error?.code === "fileexists-no-change"
      ) {
        if (result.upload?.result === "Success") {
          console.log("Success");
        } else {
          console.log("File already up to date");
        }
        validRemotePages[page.pageid] = {
          pinheadIconId: pinheadIconId,
          filename: filename,
        };
        await uploadNewFileDescription(page.title, content);
      } else {
        console.error(result);
      }
    } else {
      console.error(
        "Could not automatically update text description for: " + pinheadIconId,
      );
    }
  }
  console.log("Done uploading");
}

async function uploadEntityStatements() {
  console.log("Uploading entity statements...");

  const yearRegex = /^\d{4}-\d{2}-\d{2}$/;

  for (const pageid in validRemotePages) {
    const remotePage = validRemotePages[pageid];
    if (!remotePage.statements) {
      console.error("Missing statements for " + remotePage.filename);
      return;
    }

    const propsToUpload = getPropsToUpload(remotePage);

    if (propsToUpload && Object.keys(propsToUpload).length) {
      const claims = claimsForProps(propsToUpload);
      console.log(
        "Uploading props for " +
          remotePage.filename +
          ": " +
          claims.map((claim) => claim.mainsnak.property),
      );
      const data = await uploadClaims(pageid, claims);
      if (data.success !== 1) {
        console.log(data);
      } else {
        console.log("success: " + data.success);
      }
    }
  }
  console.log("Done uploading");

  function getPropsToUpload(remotePage) {
    const defaultProps = {
      P31: "Q52827", // instance of        = pictogram
      P7482: "Q138577495", // source of file     = Pinhead
      P1163: "image/svg+xml", // media type
      P2061: "Q20970430", // aspect ratio (W:H) = 1:1
      P275: "Q6938433", // copyright license  = Creative Commons CC0 License
      P6216: "Q88088423", // copyright status   = copyrighted, dedicated to the public domain by copyright holder
      P462: "Q23445", // color              = black
    };
    const dependentPropsBySupportingProp = {
      // only add copyright license if we're also adding copyright status
      P6216: "P275",
    };
    const propsForDir = {
      pixel_style: {
        P136: "Q811179", // genre = pixel art
      },
    };

    const pinheadIconInfo = localIconsById[remotePage.pinheadIconId];
    if (!pinheadIconInfo) {
      console.error("Missing Pinhead icon info for " + remotePage.filename);
      return;
    }
    const propsToUpload = Object.assign({}, defaultProps);
    const srcdir = completeIconsById[remotePage.pinheadIconId].srcdir;
    if (srcdir) {
      for (const dirPrefix in propsForDir) {
        if (srcdir.startsWith(dirPrefix)) {
          Object.assign(propsToUpload, propsForDir[dirPrefix]);
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
        if (
          dependentPropsBySupportingProp[prop] &&
          propsToUpload[dependentPropsBySupportingProp[prop]]
        ) {
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
            datavalue: {},
          },
          type: "statement",
          rank: "normal",
        };

        if (yearRegex.test(val)) {
          claim.mainsnak.datavalue = {
            value: {
              time: `+${val}T00:00:00Z`,
              timezone: 0,
              before: 0,
              after: 0,
              precision: 11,
              calendarmodel: "http://www.wikidata.org/entity/Q1985727",
            },
            type: "time",
          };
        } else if (val.slice(0, 1) === "Q") {
          claim.mainsnak.datavalue = {
            value: {
              "entity-type": "item",
              "numeric-id": parseInt(val.slice(1)),
            },
            type: "wikibase-entityid",
          };
        } else {
          claim.mainsnak.datavalue = {
            value: val,
            type: "string",
          };
        }
        claims.push(claim);
      }
    }
    return claims;
  }
}
