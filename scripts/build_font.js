import { createReadStream, globSync, mkdirSync, writeFileSync } from 'fs';
import { join, basename } from 'path';
import { Writable } from 'stream';
import { SVGIcons2SVGFontStream } from 'svgicons2svgfont';
import svg2ttf from 'svg2ttf';

const iconsDir = 'icons';
const distDir = 'font';

const fontName = 'pinhead';
const classPrefix = 'pinhead';

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

  const files = Array.from(globSync(`${iconsDir}/**/*.svg`))
    .toSorted((a, b) => basename(a, '.svg') < basename(b, '.svg') ? -1 : (basename(a, '.svg') > basename(b, '.svg') ? 1 : 0));

  let unicode = 0xe001;
  const glyphs = [];

  for (const file of files) {
    const name = basename(file, '.svg');
    const codepoint = unicode++;

    const glyph = createReadStream(file);
    glyph.metadata = {
      unicode: [String.fromCharCode(codepoint)],
      name,
    };

    fontStream.write(glyph);

    glyphs.push({ name, codepoint });
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