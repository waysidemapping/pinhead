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
  const iconIdPartsObj = {};

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
    const parts = id.split(/_with_|_on_|_in_|_onto_|_into_|_and_|_under_|_over_|_above_|_beside_|_between_|_atop_|_within_|_from_|_to_|_toward_|_wearing_|_holding_|_carrying_|_crossing_|_dragging_|_aiming_|_boarding_|_riding_|_driving_|_using_/);
    // if (parts[0] !== id) {
    //  parts.forEach(part => iconIdPartsObj[part] = true);
    // }

    // Make xml declaration consistent
    xml.dec({ version: '1.0', encoding: 'UTF-8' });

    // Check the contents of the file
    let rootCount = 0;
    let warnings = [];

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

        // Remove unwanted svg attributes
        child.removeAtt(['width', 'height', 'x', 'y', 'id']);

        if (node.getAttribute('viewBox') !== '0 0 15 15') {
            warnings.push(chalk.yellow('Warning - Unexpected viewBox on ' + node.nodeName + ': ' + node.getAttribute('viewBox')));
        }

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
          warnings.push(chalk.yellow('Warning - Suspicious node: ' + node.nodeName));
          warnings.push(chalk.gray('  Each svg element should contain only one or more "path" elements.'));
          process.exit(1);
        }

        // remove all children since we'll re-add the paths we want later
        childrenToRemove.add(child);

        // suspicious attributes
        const suspiciousAttrs = node.attributes
          .map(attr => attr.name)
          .filter(name => !['d', 'fill'].includes(name));

        if (suspiciousAttrs.length) {
          warnings.push(chalk.yellow('Warning - Suspicious attributes on ' + node.nodeName + ': ' + suspiciousAttrs));
          warnings.push(chalk.gray('  Avoid identifiers, style, and presentation attributes.'));
          process.exit(1);
        }
      }

    }, false, true);  /* visit_self = false, recursive = true */

    // remove nodes only after crawling everything to avoid early exit
    Array.from(childrenToRemove).forEach((child) => {
      child.remove();
    });

    Array.from(pathDataToAdd).forEach(d => {
        xml.root().ele('path', {
          d: svgPathParse.serializePath(svgPathParse.pathParse(d).normalize({round: 2}))
        });
    });

    if (warnings.length) {
      warnings.forEach(w => console.warn(w));
      console.warn('  in ' + file);
      console.warn('');
    }

    writeFileSync(file, xml.end({ prettyPrint: true }));
  }

  // const iconIdParts = Object.keys(iconIdPartsObj).sort();
  // iconIdParts
  //   .filter(part => !iconIds[part])
  //   .forEach(part => console.log(`Missing icon part "${part}"`));
  // console.log(`Missing base icons for ${iconIdParts.filter(part => !iconIds[part]).length} parts of ${iconIdParts.length} parts total`);

  console.timeEnd(END);
}
