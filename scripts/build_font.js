import { createReadStream, globSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'fs';
import { join, basename } from 'path';
import { Writable } from 'stream';
import { SVGIcons2SVGFontStream } from 'svgicons2svgfont';
import svg2ttf from 'svg2ttf';

const iconsDir = 'icons';
const distDir = 'font';

const firstFontVersion = 19;

const fontName = 'pinhead';
const classPrefix = 'pinhead';

copyFileSync('LICENSE', join(distDir, `LICENSE`));

const changelogs = JSON.parse(readFileSync('dist/changelog.json'))
  .toSorted((a, b) => parseInt(a.majorVersion) - parseInt(b.majorVersion));

const packageJson = JSON.parse(readFileSync('package.json'));
const majorVersion = parseInt(packageJson.version.split('.')[1]);

const fontPackageJson = {
  name: packageJson.name + '-font',
  description: "Official Pinhead map icon font distribution",
  version: `1.${majorVersion}.0`
};

for (const key of [
  "type",
  "license",
  "keywords",
  "homepage",
  "repository",
  "bugs",
  "funding",
  "publishConfig"
]) {
  fontPackageJson[key] = packageJson[key];
}

writeFileSync(join(distDir, `package.json`), JSON.stringify(fontPackageJson, null, 2));

async function buildFont() {
  mkdirSync(distDir, { recursive: true });

  const ttfPath = join(distDir, `${fontName}.ttf`);
  const cssPath = join(distDir, `${fontName}.css`);
  const htmlPath = join(distDir, `preview.html`);

  const fontStream = new SVGIcons2SVGFontStream({
    fontName: fontName,
    normalize: true,
    fontHeight: 1000,
    descent: 0,
  });

  let svgFont = '';
  const writableStream = new Writable({
    write(chunk, encoding, callback) {
      svgFont += chunk.toString();
      callback();
    }
  });

  fontStream.pipe(writableStream);

  let unicode = 0xe001;

  const codepointsByIconId = {};
  for (const versionChangelog of changelogs) {
    const version = versionChangelog.majorVersion;
    // Make sure we process all deletions/changes before additions
    const sortedIconChanges = versionChangelog.iconChanges.toSorted((a, b) => {
      if (b.oldId && !a.oldId) return 1;
      if (!b.oldId && a.oldId) return -1;
      return 0;
    });
    for (const iconChange of sortedIconChanges) {
      if (iconChange.oldId) {
        if (iconChange.newId) {
          codepointsByIconId[iconChange.newId] = codepointsByIconId[iconChange.oldId];
        }
        if (iconChange.newId !== iconChange.oldId) {
          delete codepointsByIconId[iconChange.oldId];
        }
      } else if (iconChange.newId) {
        codepointsByIconId[iconChange.newId] = true;
      }
    }
    if (parseInt(version) >= firstFontVersion) {
      const itemsIdsToAssignCodepoints = [];
      for (const iconId in codepointsByIconId) {
        const value = codepointsByIconId[iconId];
        if (value === true) {
          itemsIdsToAssignCodepoints.push(iconId);
        }
      }
      const sortedIds = itemsIdsToAssignCodepoints
        .toSorted((a, b) => a < b ? -1 : (a > b ? 1 : 0));
      for (const id of sortedIds) {
        const codepoint = unicode++;
        codepointsByIconId[id] = codepoint;
      }
    }
  }
  const glyphs = [];

  // make sure we add icons in codepoint order
  const codepoints = Object.values(codepointsByIconId)
    .toSorted();

  for (const codepoint of codepoints) {
    const iconId = Object.keys(codepointsByIconId)
      .find(iconId => codepointsByIconId[iconId] === codepoint);
    const file = `dist/icons/${iconId}.svg`;
    const glyphStream = createReadStream(file);
    glyphStream.metadata = {
      unicode: [String.fromCharCode(codepoint)],
      name: iconId
    };
    fontStream.write(glyphStream);

    glyphs.push({ name: iconId, codepoint: codepoint });
  }

  fontStream.end();
  await new Promise(resolve => writableStream.on('finish', resolve));

  const ttf = svg2ttf(svgFont);
  writeFileSync(ttfPath, Buffer.from(ttf.buffer));

  const css = `
@font-face {
  font-family: '${fontName}';
  src: url('./${fontName}.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

[class^="${classPrefix}-"] {
  display: inline-block;
  vertical-align: middle;
  line-height: 1em;
  width: 1em;
  height: 1em;
}

[class^="${classPrefix}-"]::before {
  font-family: '${fontName}';
  font-style: normal;
  font-weight: normal;
  font-variant: normal;
  text-transform: none;
  text-decoration: inherit;
  text-align: center;
  line-height: 1em;
  display: inline-block;
  width: 1em;
  height: 1em;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

${glyphs.map(g => {
  const hex = g.codepoint.toString(16);
  return `.${classPrefix}-${g.name}::before { content: "\\${hex}"; }`;
}).join('\n')}
`;

  writeFileSync(cssPath, css.trim());
  
    const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="initial-scale=1,maximum-scale=1,user-scalable=no"/>
    <title>${fontName} font preview</title>
    <link href="pinhead.css" rel="stylesheet" />
  </head>
  <body style="font-size:15px;">
    ${glyphs.map(g => `<span class="${classPrefix}-${g.name}"></span> <span>&lt;span class=&quot;${classPrefix}-${g.name}&quot;&gt;\&lt;/span&gt;</span><br/>`).join('\n')}
  </body>
</html>
`;

  writeFileSync(htmlPath, html.trim());

  console.log('Done:');
  console.log(`- ${ttfPath}`);
  console.log(`- ${cssPath}`);
  console.log(`- ${htmlPath}`);
}

await buildFont()
  .catch(console.error);
