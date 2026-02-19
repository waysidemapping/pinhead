# <img src="https://pinhead.ink/v1/pin.svg" height="60px" width="60px"/> Pinhead Map Icons

_Quality public domain icons for your map pins_

[<img src="https://pinhead.ink/v1/bird_flying.svg" height="15px" width="15px"/> pinhead.ink <img src="https://pinhead.ink/v1/bird_flying.svg" height="15px" width="15px"/>](https://pinhead.ink) 

So you're making a map and need some icons. Well, maybe a lot of icons. Like, for anything that might appear on a map. And they need to be visually consistent. Like the size and direction and whatever. And they gotta be free. Even public domain. In vector format. With no AI BS. Oh, and they all need to be legible on the head of a pin.

This happened to me while building [themap.is](https://github.com/waysidemapping/themap.is). I put together this icon library in case it happens to you too. It's called **Pinhead**.

Pinhead has 1,000+ icons and counting, including standardized versions of the most popular public domain cartographic icon sets: [Maki](https://github.com/mapbox/maki), [Temaki](https://github.com/rapideditor/temaki), [OSM Carto](https://github.com/openstreetmap-carto/openstreetmap-carto), and [NPMap](https://github.com/nationalparkservice/symbol-library).

## Overview

Pinhead is a repository of public domain SVG icons designed to be displayed at 15x15 pixels (minimum). This is much smaller than most other icon sets since the target use case is cartography. Map icons need to be really small to support high visual density. The cool part is that you can scale them up and they'll still look great, so you can use them for all kinds of things, not just maps.

## Where the icons are from

Pinhead is seeded from the following public domain sources. Thank you to all the contributors who made these projects possible.

- [Maki](https://github.com/mapbox/maki) ([CC0](https://github.com/mapbox/maki/blob/main/LICENSE.txt))
- [Temaki](https://github.com/rapideditor/temaki) ([CC0](https://github.com/rapideditor/temaki/blob/main/LICENSE.md)) A special shoutout to Temaki for directly inspiring this repo and provding some of the build scripts <3
- [OpenStreetMap Carto](https://github.com/openstreetmap-carto/openstreetmap-carto) ([CC0](https://github.com/openstreetmap-carto/openstreetmap-carto/blob/master/LICENSE.txt))
- [NPMap Symbol Library](https://github.com/nationalparkservice/symbol-library) (public domain)
- [OpenTrailMap](https://github.com/osmus/OpenTrailMap) ([MIT](https://github.com/osmus/OpenTrailMap/blob/main/LICENSE))

I've been gradually cleaning up the seed icons by scaling them to the same size, conflating duplicates, improving names, removing SVG cruft, and manually improving legibility. I've also been splitting out certain icon elements into standalone icons, such as taking the <img src="https://pinhead.ink/v1/wine_bottle_and_wine_glass.svg" height="15px" width="15px"/> "wine" icon and creating two additional icons: <img src="https://pinhead.ink/v1/wine_glass.svg" height="15px" width="15px"/> `wine_glass` and <img src="https://pinhead.ink/v1/wine_bottle.svg" height="15px" width="15px"/> `wine_bottle`.

If you know of other sources for public domain map icon that might be a good fit for Pinhead, I'd love to [hear about them](https://github.com/waysidemapping/pinhead/issues/new)!

And finally, the icons come from the likes of you! I myself have been addings some totally new icons I've designed in support of [themap.is](https://github.com/waysidemapping/themap.is). I'm hoping for contributors to grow and sustain this icon library. Keep reading if you're interested.

## Contributing

Contributions to Pinhead are **open**. I'd love to make this the best and largest library of public domain map icons anywhere on the web, but I can't do it alone. If you have questions, comments, or art, by all means open an [issue](https://github.com/waysidemapping/pinhead/issues/new) or [pull request](https://github.com/waysidemapping/pinhead/pulls/new) :)

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
  * Hand tools should be pointed to the right.
  * Icons with major and minor elements positioned side-by-side should have the major element on the left and minor element on the right.
  * Multiple icons for different orientations generally isn't useful. Users can manually rotate or flip icons as needed.

#### SVGs

* SVGs must contain only shapes that can be rendered with `fill`. Rendering with `stroke` is not supported.
* SVGs must have viewBox="0 0 15 15" with no elements extending outside this frame.
* The build scripts will take care of most other SVG formatting issues.

#### Filenames

* The filename is the only icon ID, which means changing a filename after publishing will break stuff and should be avoided.
* Filenames should be literal and descriptive at the risk of being verbose.
  * E.g. prefer <img src="https://pinhead.ink/v1/giraffe.svg" height="15px" width="15px"/> `giraffe` to `zoo` and <img src="https://pinhead.ink/v1/greek_cross.svg" height="15px" width="15px"/> `greek_cross` to `medicine`.
* Two files should have similar names if the components of their icons are similar.
* The subdirectory of an icon is not important.

### AI/ML policy

Icons generated by AI/ML models are assumed to be protected by copyright unless the model owner releases the rights to said icons AND said models have been trained exclusively on public domain sources or sources owned by the model owner. As this is generally never the case, and since major AI/ML model owners are known to be disingenuous about this stuff to the detriment of artists, AI-generated icons will not be considered for inclusion in Pinhead at this time.

Since this repository is licensed in the public domain, you are technically free to train AI/ML models on the icons. But come on, wouldn't you rather draw a <img src="https://pinhead.ink/v1/bison.svg" height="15px" width="15px"/> lil guy and feel a little joy for once?


## License

This repository is distributed under [CC0](/LICENSE).
