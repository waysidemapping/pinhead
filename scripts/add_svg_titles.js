import { addTitlesToSvgDirectory } from './svg_title_utils.js';

const rootDir = process.argv[2] ?? 'icons';

try {
  const { scannedCount, updatedCount } = addTitlesToSvgDirectory(rootDir);
  console.log(`Scanned ${scannedCount} SVG files in ${rootDir}`);
  console.log(`Updated ${updatedCount} SVG files with <title id> and aria-describedby`);
} catch (error) {
  console.error(`Failed to add SVG titles in ${rootDir}:`, error.message);
  process.exit(1);
}
