// Based on CC0-licsened file:
// https://github.com/rapideditor/temaki/blob/49b592fdc0840ff20052affa20677da5ddd0f809/scripts/check.js

import chalk from 'chalk';
import { parse } from 'path';
import { globSync, writeFileSync, readFileSync } from 'fs';
import svgPathParse from 'svg-path-parse';
import xmlbuilder2 from 'xmlbuilder2';


checkIcons();

function ellipseAttrsToPathD(rx, cx, ry, cy) {
  return `M${cx - rx},${cy}a${rx},${ry} 0 1,0 ${rx * 2},0a${rx},${ry} 0 1,0 -${rx * 2},0z`;
}

// https://github.com/elrumordelaluz/element-to-path/blob/master/src/index.js
function rectAttrsToPathD(attrs) {
  const w = parseFloat(attrs('width'));
  const h = parseFloat(attrs('height'));
  const x = attrs('x') ? parseFloat(attrs('x')) : 0;
  const y = attrs('y') ? parseFloat(attrs('y')) : 0;
  let rx = attrs('rx') || 'auto';
  let ry = attrs('ry') || 'auto';
  if (rx === 'auto' && ry === 'auto') {
    rx = ry = 0;
  } else if (rx !== 'auto' && ry === 'auto') {
    rx = ry = calcValue(rx, w);
  } else if (ry !== 'auto' && rx === 'auto') {
    ry = rx = calcValue(ry, h);
  } else {
    rx = calcValue(rx, w);
    ry = calcValue(ry, h);
  }
  if (rx > w / 2) {
    rx = w / 2;
  }
  if (ry > h / 2) {
    ry = h / 2;
  }
  const hasCurves = rx > 0 && ry > 0;
  return [
    `M${x + rx} ${y}`,
    `H${x + w - rx}`,
    (hasCurves ? `A${rx} ${ry} 0 0 1 ${x + w} ${y + ry}` : ''),
    `V${y + h - ry}`,
    (hasCurves ? `A${rx} ${ry} 0 0 1 ${x + w - rx} ${y + h}` : ''),
    `H${x + rx}`,
    (hasCurves ? `A${rx} ${ry} 0 0 1 ${x} ${y + h - ry}` : ''),
    `V${y + ry}`,
    (hasCurves ? `A${rx} ${ry} 0 0 1 ${x + rx} ${y}` : ''),
    'z',
  ].filter(Boolean).join('');

  function calcValue(val, base) {
    return /%$/.test(val) ? (val.replace('%', '') * 100) / base : parseFloat(val);
  }
}

function checkIcons() {
  const START = '✅   ' + chalk.yellow('Checking icons...');
  const END = '👍  ' + chalk.green('done');

  console.log('');
  console.log(START);
  console.time(END);

  const iconIds = {};
  // const iconIdPartsObj = {};

  globSync(`./icons/**/*.svg`).forEach(cleanSvgFile);
    
  function cleanSvgFile(file) {
    const contents = readFileSync(file, 'utf8');
    let xml;
    try {
      xml = xmlbuilder2.create(contents);
    } catch (err) {
      console.error(chalk.red(`Error - ${err.message} reading:`));
      console.error('  ' + chalk.yellow(file));
      console.error('');
      process.exit(1);
    }

    const id = parse(file).name;
    if (!id.match(/^[a-z_]+$/)) {
      console.error(`Invalid charachters in filename: ` + id);
      process.exit(1);
    }
    iconIds[id] = true;
    // const parts = id.split(/_with_|_on_|_in_|_onto_|_into_|_and_|_under_|_over_|_above_|_beside_|_between_|_atop_|_within_|_from_|_to_|_toward_|_wearing_|_holding_|_carrying_|_crossing_|_dragging_|_aiming_|_boarding_|_riding_|_driving_|_using_/);
    // if (parts[0] !== id) {
    //  parts.forEach(part => iconIdPartsObj[part] = true);
    // }

    // Check the contents of the file
    let rootCount = 0;

    let childrenToRemove = new Set();
    let pathDataToAdd = new Set();

    xml.each((child, index, level) => {
      const node = child.node;
      if (node.nodeType !== 1) {   // ignore and remove things like DOCTYPE, CDATA, comments, text
        childrenToRemove.add(child);
        return;
      }

      // Checks for the root
      if (level === 1) {
        if (node.nodeName !== 'svg') {
          console.error(chalk.red('Error - Invalid node at document root: ') + chalk.yellow(node.nodeName));
          console.error(chalk.gray('  Each file should contain only a single root "svg" element.'));
          console.error('  in ' + file);
          console.error('');
          process.exit(1);
        }

        if (rootCount++ > 0) {
          console.error(chalk.red('Error - Multiple nodes at document root'));
          console.error(chalk.gray('  Each file should contain only a single root "svg" element.'));
          console.error('  in ' + file);
          console.error('');
          process.exit(1);
        }

        if (node.getAttribute('viewBox') !== '0 0 15 15') {
            console.warn(chalk.yellow('Warning - Unexpected viewBox on ' + node.nodeName + ': ' + node.getAttribute('viewBox')));
            console.warn('  in ' + file);
            console.warn('');
            process.exit(1);
        }

        // remove all attributes
        while (child.node.attributes.length > 0) {
          child.node.removeAttribute(child.node.attributes[0].name);
        }
        // add back the attributes we need in the order we want
        child.att({"xmlns": "http://www.w3.org/2000/svg", "viewBox": "0 0 15 15"});

      // Checks for deeper levels
      } else {
        if (node.nodeName === 'ellipse' || node.nodeName === 'circle') {
          const attr = (name) => parseFloat(node.getAttribute(name));
          pathDataToAdd.add(ellipseAttrsToPathD(attr('rx') || attr('r'), attr('cx'), attr('ry') || attr('r'), attr('cy')));
        } else if (node.nodeName === 'rect') {
          const attr = (name) => node.getAttribute(name);
          pathDataToAdd.add(rectAttrsToPathD(attr));
        } else if (node.nodeName === 'polygon') {
          pathDataToAdd.add('M ' + node.getAttribute('points') + 'z');
        } else if (node.nodeName === 'path') {
          pathDataToAdd.add(node.getAttribute('d'));
        } else if (node.nodeName !== 'title' && node.nodeName !== 'desc' && node.nodeName !== 'g') {
          console.warn(chalk.yellow('Warning - Suspicious node: ' + node.nodeName));
          console.warn(chalk.gray('  Each svg element should contain only one or more "path" elements.'));
          console.warn('  in ' + file);
          console.warn('');
          process.exit(1);
        }

        // remove all children since we'll re-add the paths we want later
        childrenToRemove.add(child);

        if (node.getAttribute('stroke') && node.getAttribute('stroke') !== 'none') {
          console.warn(chalk.yellow('Unexpcted stroke value on ' + node.nodeName + ': ' + node.getAttribute('stroke')));
          console.warn(chalk.gray('  SVGs must be renderable through fill alone.'));
          console.warn('  in ' + file);
          console.warn('');
          process.exit(1);
        }
        if (node.getAttribute('transform') && node.getAttribute('transform') !== 'translate(0, 0)') {
          console.warn(chalk.yellow('Unexpcted transform value on ' + node.nodeName + ': ' + node.getAttribute('transform')));
          console.warn(chalk.gray('  Elements must not rely on transforms.'));
          console.warn('  in ' + file);
          console.warn('');
          process.exit(1);
        }

        // suspicious attributes
        const suspiciousAttrs = node.attributes
          .map(attr => attr.name)
          .filter(name => !['d', 'fill', 'id', 'fill-rule', 'stroke', 'transform'].includes(name));

        if (suspiciousAttrs.length) {
          console.warn(chalk.yellow('Warning - Suspicious attributes on ' + node.nodeName + ': ' + suspiciousAttrs));
          console.warn(chalk.gray('  Avoid identifiers, style, and presentation attributes.'));
          console.warn('  in ' + file);
          console.warn('');
          process.exit(1);
        }
      }

    }, false, true);  /* visit_self = false, recursive = true */

    // remove nodes only after crawling everything to avoid early exit
    Array.from(childrenToRemove).forEach((child) => {
      child.remove();
    });

    const paths = Array.from(pathDataToAdd).map(path => {
      // automatically close any open paths since they'll appear that way anyway when filled
      if (path[path.length - 1].toUpperCase() !== 'Z') {
        path = path + 'Z';
      }
      return path;
    });
    // Join all paths into one. This could reveal issues that need to be fixed if multiple fills are overlapping
    const d = paths.join('');
    const normalizedD = svgPathParse.serializePath(svgPathParse.pathParse(d).normalize({round: 2}));
    xml.root().ele('path', {
      d: normalizedD
    });

    let xmlString = xml.end({ prettyPrint: true, headless: true });

    // xmlbuilder2 output order of attributes is non-determinstic, so standardize it manually
    xmlString = xmlString.replace(
      /<svg\s+([^>]+)>/,
      (_, attrs) => {
        // Match full key="value" pairs
        const attrMatches = attrs.match(/\S+="[^"]*"/g) || [];

        // Sort reverse alphabetically by attribute name
        attrMatches.sort((a, b) => {
          const nameA = a.split("=")[0];
          const nameB = b.split("=")[0];
          return nameB.localeCompare(nameA);
        });

        return `<svg ${attrMatches.join(" ")}>`;
      }
    );

    writeFileSync(file, xmlString);
  }

  // const iconIdParts = Object.keys(iconIdPartsObj).sort();
  // iconIdParts
  //   .filter(part => !iconIds[part])
  //   .forEach(part => console.log(`Missing icon part "${part}"`));
  // console.log(`Missing base icons for ${iconIdParts.filter(part => !iconIds[part]).length} parts of ${iconIdParts.length} parts total`);

  console.timeEnd(END);
}
