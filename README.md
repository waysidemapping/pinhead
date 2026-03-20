# <img src="https://pinhead.ink/v1/pin.svg" height="60px" width="60px"/> Pinhead Map Icons

_Quality public domain icons for your map pins_

[<img src="https://pinhead.ink/v1/bird_flying.svg" height="15px" width="15px"/> pinhead.ink <img src="https://pinhead.ink/v1/bird_flying.svg" height="15px" width="15px"/>](https://pinhead.ink) 

So you're making a map and need some icons. Well, maybe a lot of icons. Like, for anything that might appear on a map. And they need to be visually consistent. Like the size and direction and whatever. And they gotta be free. Even public domain. In vector format. With no AI. Oh, and they all need to be legible on the head of a pin.

This happened to me while building [themap.is](https://github.com/waysidemapping/themap.is). I put together this icon library in case it happens to you too. It's called **Pinhead**.

Pinhead is an active, collaborative project. There are now over 1,500 total icons, including [standardized versions](https://pinhead.ink/coverage) of the most popular public domain cartographic icon sets: [Maki](https://github.com/mapbox/maki), [Temaki](https://github.com/rapideditor/temaki), [OSM Carto](https://github.com/openstreetmap-carto/openstreetmap-carto), and [NPMap](https://github.com/nationalparkservice/symbol-library).

## Overview

Pinhead is a library of free vector icons. There are other projects like this, but Pinhead is special because it's:

1. Cartography first
2. 100% public domain

Map icons need to be really small to support high visual density, so all of Pinhead icon's are intended to be legible at **15x15 pixels** minimum. This is much smaller than most other icon sets you'll find, but you can scale them up and they'll still look great. And since they're licensed **CC0**, you can use them anywhere for free without restrictions.

## Community and support

A small community is developing around Pinhead! We're working to make this the best and largest library of public domain map icons anywhere on the web, but we can't do it alone. Come join us in the [#pinhead](https://osmus.slack.com/archives/C0AH40E4J9W) channel on [OSM US Slack](https://slack.openstreetmap.us/). Bring your questions, comments, and ideas, or feel free to [open an issue](https://github.com/waysidemapping/pinhead/issues/new) on GitHub. You can also contact me ([@quincylvania](https://github.com/quincylvania)) directly through any of the channels listed on [my website](https://waysidemapping.org).

## Usage

There are a number of ways to get Pinhead icons. But before you get started, you'll want to be aware of a few things:

- **Churn**: Pinhead is an active project receiving regular updates. If you want stability, use a specific version of Pinhead. If you want to stay up-to-date with the latest version, be aware that icons may change. Developers can use the `changelog.json` file to deal with changes automatically.
- **Verison numbers**: Each Pinhead version number refers to a complete, static set of icons. The version number increments whenever an icon is added, deleted, renamed, or otherwise changed. This ensures version integrity, so that two apps running the same Pinhead version will have the same icons.
- **Content warning**: Pinhead aims to be comprehensive and contains icons that some audiences may find objectionable. Sensitive users should review any icons they plan to redistribute or display to others.

### Getting an icon

Visit [pinhead.ink](https://pinhead.ink) to browse the icons. Each icon has a download link, a copyable `<svg>` code, and an embeddable `<img>` code. These links are permanent and will not break in the future even if an icon is deleted or renamed, so feel free to save, share, or embed them.

### Getting all the icons

If you want to get the full set of icon files, use the `download` link on [pinhead.ink](https://pinhead.ink) for the most recent version. The zipped file is <1 MB. You can also browse [past versions](https://github.com/waysidemapping/pinhead/releases). Each release contains the following:

- `dist/icons/*.svg`: the individual icon SVG files
- `dist/icons/index.json`: a list of all the available icons in this version
- `dist/icons/index.complete.json`: same as the above but with the SVG code included inline
- `dist/changelog.json`: a machine-readable list of icon additions, deletions, and renames between major versions
- `dist/external_sources.json`: a detailed list of the external icon sources referenced in `changelog.json`

### Hosted icons

The above files are also hosted on pinhead.ink (through GitHub Pages) at the following URLs. You can point your app directly to these endpoints.

- For each version:
  - `https://pinhead.ink/v*/*.svg`
  - `https://pinhead.ink/v*/index.json`
  - `https://pinhead.ink/v*/index.complete.json`
- For the latest version only:
  - `https://pinhead.ink/changelog.json`
  - `https://pinhead.ink/external_sources.json`

It is *not* recommended for production apps to depend directly on the GitHub repository or any of its raw files as these may change without notice.

### Icons on Wikimedia Commons

All Pinhead icons are [synced to Wikimedia Commons](https://commons.wikimedia.org/wiki/Category:Plain_black_Pinhead_SVG_icons) for convenient integration with Wikipedia, Wikidata, the OpenStreetMap Wiki, and other such projects. These files are easy to [search](https://commons.wikimedia.org/w/index.php?search=pinhead+icon&title=Special%3AMediaSearch&go=Go&type=image&filemime=svg).

### Node.js package

Node developers can install Pinhead as usual. The npm package has no dependencies and is basically just a directory of SVG files and JSON metadata.

```
npm install @waysidemapping/pinhead
```

This package uses a special flavor of semantic versioning (`major.minor.patch`), with the Pinhead version number corresponding to the minor version. If your app expects the icons to be static, depend on the package like (`~x.x.0`). If your app can automatically handle icons changes, i.e. by reading the `changelog.json` file, then depend on the package like (`^x.x.0`). We'll only increment the major version if there is a breaking change to the package format, in which case the minor version will NOT reset to zero but will remain the Pinhead version number. Note that prior to v15, the Pinhead version number corresponded to the major package version instead of the minor.

## Where the icons are from

Pinhead is seeded from the following public domain sources. Thank you to all of the contributors to these projects.

- <img src="https://pinhead.ink/v1/temaki.svg" width="15px"/> [Temaki](https://github.com/rapideditor/temaki) ([CC0](https://github.com/rapideditor/temaki/blob/main/LICENSE.md)) A special shoutout to Temaki for directly inspiring this repo and provding some of the build scripts <3
- <img src="https://pinhead.ink/v1/sushi.svg" width="15px"/> [Maki](https://github.com/mapbox/maki) ([CC0](https://github.com/mapbox/maki/blob/main/LICENSE.txt))
- <img src="https://pinhead.ink/v1/bear.svg" width="15px"/> [NPMap Symbol Library](https://github.com/nationalparkservice/symbol-library) (public domain)
- <img src="https://pinhead.ink/v1/beer_mug_with_foam.svg" width="15px"/> [OpenStreetMap Carto](https://github.com/openstreetmap-carto/openstreetmap-carto) ([CC0](https://github.com/openstreetmap-carto/openstreetmap-carto/blob/master/LICENSE.txt))
- <img src="https://pinhead.ink/v15/dna.svg" width="15px"/> [Health Icons](https://github.com/resolvetosavelives/healthicons) ([CC0](https://healthicons.org/about#license))
- <img src="https://pinhead.ink/v18/gull.svg" width="15px"/> [OpenGemeenten Iconenset](https://github.com/OpenGemeenten/Iconenset/) ([CC0](https://github.com/OpenGemeenten/Iconenset/blob/master/LICENSE.md))
- <img src="https://pinhead.ink/v13/sailing_ship_in_water.svg" width="15px"/> [princesse](https://github.com/Viglino/map-font-symbols/tree/main/princesse) and [pirate](https://github.com/Viglino/map-font-symbols/tree/main/pirate) map icons by [@Viglino](https://github.com/Viglino) (CC0)
- <img src="https://pinhead.ink/v5/badge_shield.svg" width="15px"/> [OpenStreetMap Americana](https://github.com/osm-americana/openstreetmap-americana/) ([CC0](https://github.com/osm-americana/openstreetmap-americana/blob/main/LICENSE))
- <img src="https://pinhead.ink/v1/deer_head_with_antlers.svg" width="15px"/> [OpenTrailMap](https://github.com/osmus/OpenTrailMap) ([MIT](https://github.com/osmus/OpenTrailMap/blob/main/LICENSE))

I've been cleaning up the seed icons by scaling them to the same size, conflating duplicates, improving names, removing SVG cruft, and manually improving legibility. I've also been splitting out certain icon elements into standalone icons, such as taking the <img src="https://pinhead.ink/v1/wine_bottle_and_wine_glass.svg" height="15px" width="15px"/> "wine" icon and creating two additional icons: <img src="https://pinhead.ink/v1/wine_glass.svg" height="15px" width="15px"/> `wine_glass` and <img src="https://pinhead.ink/v1/wine_bottle.svg" height="15px" width="15px"/> `wine_bottle`.

If you know of other sources for public domain map icon that might be a good fit for Pinhead, I'd love to [hear about them](https://github.com/waysidemapping/pinhead/issues/new)!

And finally, the icons come from the likes of you! I myself have been addings some totally new icons I've designed in support of [themap.is](https://github.com/waysidemapping/themap.is). I'm hoping for contributors to grow and sustain this icon library.

## Contributing

Contributions to Pinhead are **open**. See the [contributors' guide](CONTRIBUTING.md) for details, including the icon design guidelines, the code of conduct, and the AI/ML policy.

## License

This repository is distributed under [CC0](/LICENSE).
