# Usage

## Things to know

There are a number of ways to get Pinhead icons. But before you get started, you'll want to be aware of a few things:

- **Churn**: Pinhead is an active project receiving regular updates. You can monitor the [releases feed](https://github.com/waysidemapping/pinhead/releases.atom) to be notified of new Pinhead versions. If you want stability, use a specific version of Pinhead. If you're staying up-to-date with the latest version, be aware that icons may change. Developers can use the `changelog.json` file to deal with changes automatically.
- **Version numbers**: Each Pinhead version number refers to a complete, static set of icons. The version number increments whenever an icon is added, deleted, renamed, or otherwise changed. This ensures version integrity, so that two apps running the same Pinhead version will have the same icons.
- **Content warning**: Pinhead aims to be comprehensive and contains icons that some audiences may find objectionable. Icons commonly considered problematic are marked `sensitive` in the metadata files, but concerned users should manually review any icons they plan to redistribute or display to others.

## Browsing the icons

Visiting [pinhead.ink](https://pinhead.ink) is the best way to browse the icons. Each icon has a download link, a copyable `<svg>` code, and an embeddable `<img>` code. These links are permanent and will not break in the future even if an icon is deleted or renamed, so feel free to save, share, or embed them.

## Distributions

### Static download

You can get the latest release as a static archive using the `download` link on [pinhead.ink](https://pinhead.ink). The compressed directory is <2 MB. You can also browse [past versions](https://github.com/waysidemapping/pinhead/releases). Each release contains the following files:

- `dist/icons/*.svg`: the individual icon SVG files
- `dist/icons/index.json`: a list of all the available icons in this version
- `dist/icons/index.complete.json`: same as the above but with the SVG code included inline
- `dist/changelog.json`: a machine-readable list of icon additions, deletions, and renames between Pinhead versions
- `dist/external_sources.json`: a detailed list of the external icon sources referenced in `changelog.json`

Note that if you just "download once and forget" then you'll miss out on any future improvements.

### Web font

If you want easy access to all the Pinhead icons on your website, the easiest solution is to use the web font.

1. Link the hosted CSS file for the latest Pinhead version in your `<head>` element:

```
<link href="https://pinhead.ink/v{{VERSION}}/pinhead.css" rel="stylesheet"/>
```

2. Add icon elements with a class in the format `pinhead-ICON_ID`:
   
```
<span class="pinhead-box_truck"></span>
```

3. Style like text:

```
font-size: 15px; color: navy; text-decoration: underline solid 2px red;
```

### Hosted files

The following files are hosted on pinhead.ink (through GitHub Pages) at the following URLs. You can point your app directly to these endpoints as they are stable.

- For each version:
  - `https://pinhead.ink/v*/*.svg`: The individual icon SVG files
  - `https://pinhead.ink/v*/index.json`: A list of all the available icons in this version
  - `https://pinhead.ink/v*/index.complete.json`: Same as the above but with the SVG code included inline
  - `https://pinhead.ink/v*/pinhead.ttf`: Icons compiled into a font file
  - `https://pinhead.ink/v*/pinhead.css`: Stylesheet for easy web usage of the font file
- For the latest version:
  - `https://pinhead.ink/latest/*.svg`: The individual icon SVG files, with each file representing the highest-versioned icon of that name (even if the name was later changed)
  - `https://pinhead.ink/changelog.json`: A machine-readable list of icon additions, deletions, and renames between Pinhead versions
  - `https://pinhead.ink/external_sources.json`: A detailed list of the external icon sources referenced in `changelog.json`

It is *not* recommended for production apps to depend directly on the GitHub repository or any of its raw files as these may change without notice.

### Icons on Wikimedia Commons

All Pinhead icons are [synced to Wikimedia Commons](https://commons.wikimedia.org/wiki/Category:Plain_black_Pinhead_SVG_icons) for convenient integration with Wikipedia, Wikidata, the OpenStreetMap Wiki, and other such projects. These files are easy to [search](https://commons.wikimedia.org/w/index.php?title=Special%3AMediaSearch&search=deepcat%3A%22Plain+black+Pinhead+SVG+icons%22&type=image).

In Wiki markup, you can reference any icon like: `[[File:Bus Pinhead icon.svg|15px]]`

### Icons in QGIS

Pinhead is bundled as a default collection in the [QGIS Resource Sharing](https://github.com/QGIS-Contribution/QGIS-ResourceSharing/) plugin, making it easy to use Pinhead icons in your QGIS project. These icon files support rich styling within the QGIS UI. For installation instructions and raw file downloads, see the [pinhead-qgis-resources](https://github.com/waysidemapping/pinhead-qgis-resources) repo.

### Node.js packages

Pinhead is distributed in two different packages for Node developers. The packages have no dependencies and contain no code.

- [@waysidemapping/pinhead](https://www.npmjs.com/package/@waysidemapping/pinhead): SVG icons and JSON metadata files
  - `npm install @waysidemapping/pinhead`
- [@waysidemapping/pinhead-font](https://www.npmjs.com/package/@waysidemapping/pinhead-font): icon font and CSS for use on webpages
  - `npm install @waysidemapping/pinhead-font`

These packages use a special flavor of semantic versioning (`major.minor.patch`), with the Pinhead version number corresponding to the minor version. If your app expects the icons to be static, depend on the package like (`~x.x.0`). If your app can automatically handle icon changes, i.e. by reading the `changelog.json` file, then depend on the package like (`^x.x.0`). We'll only increment the major version if there is a breaking change to the package format, in which case the minor version will NOT reset to zero but will remain the Pinhead version number. Note that prior to v15, the Pinhead version number of `@waysidemapping/pinhead` corresponded to the major package version instead of the minor.

## Handling the SVGs

Manipulating the SVG markup is a powerful way to customize Pinhead icons in your application. Developers may assume all icon files conform to the following standards:

* The root `svg` element has a `viewBox="0 0 15 15"` attribute but no `width` nor `height` attributes
* The root `svg` element contains only a single `path` element with only a `d` attribute
* The `d` attribute contains one or more explicitly closed paths
* No paths visually extend outside the 15x15 view box
* No styling attributes are specified
