import { readFileSync, writeFileSync } from 'fs';

const changelogs = JSON.parse(readFileSync('dist/changelog.json'))
  .toSorted((a, b) => parseInt(a.majorVersion) - parseInt(b.majorVersion));

const packageJson = JSON.parse(readFileSync('js/package.json'));
const majorVersion = parseInt(packageJson.version.split('.')[1]);

const jsPackageJson = JSON.parse(readFileSync('js/package.json'));
jsPackageJson.version = `1.${majorVersion}.0`;

writeFileSync('js/package.json', JSON.stringify(jsPackageJson, null, 2));
