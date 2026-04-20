import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { basename, extname, join } from 'path';

function collectSvgFiles(dir) {
  let results = [];
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(collectSvgFiles(fullPath));
      continue;
    }

    if (entry.isFile() && extname(entry.name).toLowerCase() === '.svg') {
      results.push(fullPath);
    }
  }

  return results;
}

function toTitleCase(text) {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function titleFromPath(svgPath) {
  const nameWithoutExtension = basename(svgPath, '.svg');
  return toTitleCase(nameWithoutExtension.replaceAll('_', ' '));
}

function detectIndentation(svgContent) {
  const indentedLine = svgContent.match(/\r?\n([ \t]+)</);
  return indentedLine ? indentedLine[1] : '  ';
}

/** Remove every <title>...</title> that appears immediately after <svg> (only whitespace between). */
function stripAllLeadingTitles(afterSvgOpen) {
  let rest = afterSvgOpen;
  const titleBlock = /^\s*<title\b[^>]*>[\s\S]*?<\/title>\s*/i;
  while (titleBlock.test(rest)) {
    rest = rest.replace(titleBlock, '');
  }
  return rest;
}

function upsertSvgTitle(svgContent, titleText) {
  const svgOpenTagMatch = svgContent.match(/<svg\b[^>]*>/i);
  if (!svgOpenTagMatch) {
    return { updated: svgContent, changed: false };
  }

  const svgOpenTag = svgOpenTagMatch[0];
  const afterOpenTag = svgContent.slice(svgOpenTagMatch.index + svgOpenTag.length);

  const singleLeadingTitle = /^\s*<title\b[^>]*>([\s\S]*?)<\/title>\s*/i;
  const firstTitleMatch = afterOpenTag.match(singleLeadingTitle);
  if (firstTitleMatch) {
    const inner = firstTitleMatch[1].trim();
    const afterFirstTitle = afterOpenTag.slice(firstTitleMatch[0].length);
    const hasSecondLeadingTitle = /^\s*<title\b/i.test(afterFirstTitle);
    if (inner === titleText && !hasSecondLeadingTitle) {
      return { updated: svgContent, changed: false };
    }
  }

  const sanitizedAfterOpenTag = stripAllLeadingTitles(afterOpenTag);

  const indent = detectIndentation(svgContent);
  const needsTrailingNewline = sanitizedAfterOpenTag.length > 0 && !sanitizedAfterOpenTag.startsWith('\n');
  const trailingNewline = needsTrailingNewline ? '\n' : '';
  const titleNode = `\n${indent}<title>${titleText}</title>${trailingNewline}`;
  const updated = svgContent.replace(svgOpenTag + afterOpenTag, `${svgOpenTag}${titleNode}${sanitizedAfterOpenTag}`);

  return { updated, changed: updated !== svgContent };
}

function addTitlesToSvgDirectory(rootDir) {
  const svgPaths = collectSvgFiles(rootDir);
  let updatedCount = 0;

  for (const svgPath of svgPaths) {
    const svgContent = readFileSync(svgPath, 'utf8');
    const titleText = titleFromPath(svgPath);
    const { updated, changed } = upsertSvgTitle(svgContent, titleText);

    if (!changed) {
      continue;
    }

    writeFileSync(svgPath, updated);
    updatedCount += 1;
  }

  return {
    scannedCount: svgPaths.length,
    updatedCount
  };
}

export {
  addTitlesToSvgDirectory,
  collectSvgFiles,
  titleFromPath,
  upsertSvgTitle
};
