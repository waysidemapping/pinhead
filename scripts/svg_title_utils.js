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

/** Basename without `.svg`, lowercased (keeps underscores). */
function titleIdFromPath(svgPath) {
  const base = basename(svgPath);
  const ext = extname(base);
  const stem = ext.toLowerCase() === '.svg' ? base.slice(0, -ext.length) : base;
  return stem.toLowerCase();
}

function escapeAttrValue(value) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function ensureAriaDescribedByOnSvgOpenTag(svgOpenTag, titleId) {
  const escaped = escapeAttrValue(titleId);
  if (/\baria-describedby\s*=/i.test(svgOpenTag)) {
    return svgOpenTag.replace(
      /\baria-describedby\s*=\s*(["'])[^"']*\1/i,
      `aria-describedby="${escaped}"`
    );
  }
  const trimmed = svgOpenTag.trimEnd();
  if (!trimmed.endsWith('>')) {
    return svgOpenTag;
  }
  return `${trimmed.slice(0, -1)} aria-describedby="${escaped}">`;
}

function ariaDescribedByOnSvgOpenTag(svgOpenTag) {
  const match = svgOpenTag.match(/\baria-describedby\s*=\s*(["'])([^"']*)\1/i);
  return match ? match[2] : null;
}

function titleIdOnLeadingTitleOpen(afterOpenTag) {
  const match = afterOpenTag.match(/^\s*<title\b([^>]*)>/i);
  if (!match) {
    return null;
  }
  const idMatch = match[1].match(/\bid\s*=\s*(["'])([^"']*)\1/i);
  return idMatch ? idMatch[2] : null;
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

function upsertSvgTitle(svgContent, titleText, titleId) {
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
    const existingTitleId = titleIdOnLeadingTitleOpen(afterOpenTag);
    const existingAria = ariaDescribedByOnSvgOpenTag(svgOpenTag);
    if (
      inner === titleText &&
      !hasSecondLeadingTitle &&
      existingTitleId === titleId &&
      existingAria === titleId
    ) {
      return { updated: svgContent, changed: false };
    }
  }

  const sanitizedAfterOpenTag = stripAllLeadingTitles(afterOpenTag);

  const indent = detectIndentation(svgContent);
  const needsTrailingNewline = sanitizedAfterOpenTag.length > 0 && !sanitizedAfterOpenTag.startsWith('\n');
  const trailingNewline = needsTrailingNewline ? '\n' : '';
  const idAttr = escapeAttrValue(titleId);
  const titleNode = `\n${indent}<title id="${idAttr}">${titleText}</title>${trailingNewline}`;
  const svgOpenTagWithAria = ensureAriaDescribedByOnSvgOpenTag(svgOpenTag, titleId);
  const updated = svgContent.replace(
    svgOpenTag + afterOpenTag,
    `${svgOpenTagWithAria}${titleNode}${sanitizedAfterOpenTag}`
  );

  return { updated, changed: updated !== svgContent };
}

function addTitlesToSvgDirectory(rootDir) {
  const svgPaths = collectSvgFiles(rootDir);
  let updatedCount = 0;

  for (const svgPath of svgPaths) {
    const svgContent = readFileSync(svgPath, 'utf8');
    const titleText = titleFromPath(svgPath);
    const titleId = titleIdFromPath(svgPath);
    const { updated, changed } = upsertSvgTitle(svgContent, titleText, titleId);

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
  titleIdFromPath,
  upsertSvgTitle
};
