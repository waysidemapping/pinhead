# <img src="https://pinhead.ink/v1/pin.svg" height="60px" width="60px"/> Pinhead Map Icons

_Quality public domain icons for your map pins_

[<img src="https://pinhead.ink/v1/bird_flying.svg" height="15px" width="15px"/> pinhead.ink <img src="https://pinhead.ink/v1/bird_flying.svg" height="15px" width="15px"/>](https://pinhead.ink) 

So you're making a map and need some icons. Well, maybe a lot of icons. Like, for anything that might appear on a map. And they need to be visually consistent. Like the size and direction and whatever. And they gotta be free. Even public domain. In vector format. With no AI. Oh, and they all need to be legible on the head of a pin.

This happened to me while building [themap.is](https://github.com/waysidemapping/themap.is). I put together this icon library in case it happens to you too. It's called **Pinhead**.

Pinhead has 1,000+ icons and counting, including [standardized versions](https://pinhead.ink/coverage) of the most popular public domain cartographic icon sets: [Maki](https://github.com/mapbox/maki), [Temaki](https://github.com/rapideditor/temaki), [OSM Carto](https://github.com/openstreetmap-carto/openstreetmap-carto), and [NPMap](https://github.com/nationalparkservice/symbol-library).

## Overview

Pinhead is a library of free vector icons. There are other projects like this, but Pinhead is special because it's:

1. Cartography first
2. 100% public domain

Map icons need to be really small to support high visual density, so all of Pinhead icon's are intended to be legible at **15x15 pixels** minimum. This is much smaller than most other icon sets you'll find, but you can scale them up and they'll still look great. And since they're licensed **CC0**, you can use them anywhere for free without restrictions.

## Usage

There are a few easy ways to get and use the icons depending on what you're trying to do.

Visit [pinhead.ink](https://pinhead.ink) to browse the icons. Each icon has a download link, a copyable `<svg>` code, and an embeddable `<img>` code. These links are permanent and will not break in the future even if an icon is deleted or renamed, so feel to save, share, or embed them.

If you want to get the full set of icon files, use the download link on pinhead.ink for the most recent version. Or, you can browse all version in the [releases](https://github.com/waysidemapping/pinhead/releases).

### For developers

Node developers can install Pinhead as usual:

```
npm install @waysidemapping/pinhead
```

Pinhead has no dependencies and is basically just a directory of SVG files. A few convenience files are included:

- `dist/icons/index.json`: a list of all the available icons in this version
- `dist/icons/index.complete.json`: same as the above but with the SVG code included inline
- `dist/changelog.json`: a machine-readable list of icon additions, deletions, and renames between major versions
- `dist/external_sources.json`: a detailed list of the external icons sources referenced in changelog.json

#### Version numbers

Pinhead uses a flavor of semantic versioning, with major releases (v2.0.0) corresponding to breaking changes, minor releases (v2.1.0) corresponding to backwards-compatible changes, and patch releases (v2.1.1) corresponding to fixes.

When it comes to icons: renaming or deleting an icon, or making any visual modification, is a breaking change. Perhaps counterintuitively, adding a new icon is also considered a breaking change. The goal is clear version integrity, where each major version number refers to a complete set of icons with no differences between minor versions. In effect, this means you can think of Pinhead v1 and Pinhead v2 as two static, independent icon sets. This avoids common gotchas, like developers depending on a package like `^1.0.0` and potentially seeing different lists of icons in development vs. production in the case where v1.1.0 adds an icon. 

## Where the icons are from

Pinhead is seeded from the following public domain sources. Thank you to all the contributors who made these projects possible.

- <img src="https://pinhead.ink/v1/temaki.svg" width="15px"/> [Temaki](https://github.com/rapideditor/temaki) ([CC0](https://github.com/rapideditor/temaki/blob/main/LICENSE.md)) A special shoutout to Temaki for directly inspiring this repo and provding some of the build scripts <3
- <img src="https://pinhead.ink/v1/sushi.svg" width="15px"/> [Maki](https://github.com/mapbox/maki) ([CC0](https://github.com/mapbox/maki/blob/main/LICENSE.txt))
- <img src="https://pinhead.ink/v1/bear.svg" width="15px"/> [NPMap Symbol Library](https://github.com/nationalparkservice/symbol-library) (public domain)
- <img src="https://pinhead.ink/v1/beer_mug_with_foam.svg" width="15px"/> [OpenStreetMap Carto](https://github.com/openstreetmap-carto/openstreetmap-carto) ([CC0](https://github.com/openstreetmap-carto/openstreetmap-carto/blob/master/LICENSE.txt))
- <img src="https://pinhead.ink/v5/badge_shield.svg" width="15px"/> [OpenStreetMap Americana](https://github.com/osm-americana/openstreetmap-americana/) ([CC0](https://github.com/osm-americana/openstreetmap-americana/blob/main/LICENSE))
- <img src="https://pinhead.ink/v1/deer_head_with_antlers.svg" width="15px"/> [OpenTrailMap](https://github.com/osmus/OpenTrailMap) ([MIT](https://github.com/osmus/OpenTrailMap/blob/main/LICENSE))

I've been cleaning up the seed icons by scaling them to the same size, conflating duplicates, improving names, removing SVG cruft, and manually improving legibility. I've also been splitting out certain icon elements into standalone icons, such as taking the <img src="https://pinhead.ink/v1/wine_bottle_and_wine_glass.svg" height="15px" width="15px"/> "wine" icon and creating two additional icons: <img src="https://pinhead.ink/v1/wine_glass.svg" height="15px" width="15px"/> `wine_glass` and <img src="https://pinhead.ink/v1/wine_bottle.svg" height="15px" width="15px"/> `wine_bottle`.

If you know of other sources for public domain map icon that might be a good fit for Pinhead, I'd love to [hear about them](https://github.com/waysidemapping/pinhead/issues/new)!

And finally, the icons come from the likes of you! I myself have been addings some totally new icons I've designed in support of [themap.is](https://github.com/waysidemapping/themap.is). I'm hoping for contributors to grow and sustain this icon library. Keep reading if you're interested.

## Contributing

Contributions to Pinhead are **open**. I'd love to make this the best and largest library of public domain map icons anywhere on the web, but I can't do it alone. If you have questions, comments, or art, by all means open an [issue](https://github.com/waysidemapping/pinhead/issues/new) or [pull request](https://github.com/waysidemapping/pinhead/pulls/new) :)

### Contributor FAQ 

#### Is my icon in scope?

Probably! While this project is focused on maps, you'd be surprised how many icons that don't seem geographic at all end up making useful pinheads.

#### Why 15x15 pixels?

The 15x15 rule mostly comes from Temaki, which inherited it from Maki. Compared to OSM Carto's 14x14, it's pretty handy to use an odd number so that a 1px wide line can be perfectly centered. Going down to 13x13 is feasible for the some icons but starts to get hairy when trying to depcit more complex things. Maki actually used to distribute 11x11 versions of icons (sooo tiny!) but [dropped them](https://github.com/mapbox/maki/commit/96e8b4c5941d687ddf0fde527ad54dde5559eef2) in v7. Probably the benefit didn't justify the maintence overhead in the age of high-DPI displays. So yeah, 15x15 just feels like the sweet spot.

### Design guidelines

If the following sections seem too technical or intimidating, feel free to just ignore them and go straight to opening a PR for your cool icon. These are intended only for managing internal consistency and I'd be happy to give you pointers after the fact. There aren't many hard rules here. Have fun with it!

#### Visual design

* Legibility
  * Icons should be basically legible when displayed at 15x15 screen points on a 2x pixel density display.
  * _Ideally_ icons should also be legible on a traditional 1x display at 15x15 pixels, but alas this is not always possible for some of the more complex graphics.
  * Snapping shapes to 1px and 0.5px increments on the 15x15 pixel grid can often help.
  * Shapes that are too small, overly detailed, or too close together usually look muddy at small sizes.
  * Screen legiblity is more of an art than a science, try experimenting.
* Perspective
  * Most things are more iconic from one angle than another. Prefer in this order:
    * <img src="https://pinhead.ink/v1/car.svg" height="15px" width="15px"/> A straight-on horizontal perspective
    * <img src="https://pinhead.ink/v1/bicycle.svg" height="15px" width="15px"/> A horizontal side profile
    * <img src="https://pinhead.ink/v1/railway_track.svg" height="15px" width="15px"/> A top-down vertical perspective
    * <img src="https://pinhead.ink/v1/sandbox_with_sand_trowel.svg" height="15px" width="15px"/> 3D (sparingly!)
  * Multiple icons for different perspectives of the same thing can be okay if they're all iconic.
* Orientation
  * People, animals, vehicles, etc. depicted in profile should be facing to the right.
    * Except when moving backwards (e.g. boats on slipways).
    * Except when standing in opposition to movement (e.g. the "stop arm" checkpoint officers).
  * Hand tools should be pointed to the right.
  * Icons with major and minor elements positioned side-by-side should have the major element on the left and minor element on the right.
  * Multiple icons for different orientations generally isn't useful. Users can manually rotate or flip icons if desired.
    * Except when a different orientation gives the icon a different meaning (e.g. arrows).

#### SVGs

* SVGs must contain only shapes that can be rendered with `fill`. Rendering with `stroke` is not supported.
* SVGs must have viewBox="0 0 15 15" with no elements extending outside this frame.
* The build scripts will take care of most other SVG formatting issues.

#### Filenames

* The filename is the only icon ID, which means changing a filename after publishing will break stuff and should be avoided.
* Filenames should be literal and descriptive at the risk of being verbose.
  * E.g. prefer <img src="https://pinhead.ink/v1/giraffe.svg" height="15px" width="15px"/> `giraffe` to `zoo` and <img src="https://pinhead.ink/v1/greek_cross.svg" height="15px" width="15px"/> `greek_cross` to `medicine`.
* Two files should have similar names if the components of their icons are similar.
* Two files cannot share a name, even if they are in different subdirectories.

#### Subdirectories
* The subdirectory of an icon is used only for developer-side convenience and has no effect on distributed icons.
* Files are broadly organized by design, not by content.
* Some subdirectories contain README.md files which give more detailed information.

### AI/ML policy

Icons generated by AI/ML models are assumed to be protected by copyright unless the model owner releases the rights to said icons AND said models have been trained exclusively on public domain sources or sources owned by the model owner. As this is generally never the case, and since major AI/ML model owners are known to be disingenuous about this stuff to the detriment of artists, AI-generated icons will not be considered for inclusion in Pinhead at this time.

Since this repository is licensed in the public domain, you are technically free to train AI/ML models on the icons. But come on, wouldn't you rather draw a <img src="https://pinhead.ink/v1/bison.svg" height="15px" width="15px"/> lil guy and feel a little joy for once?

### Code of conduct

If you engage in harassment or other unprofessional conduct you will be banned. Be nice or be elsewhere :)

## License

This repository is distributed under [CC0](/LICENSE).
