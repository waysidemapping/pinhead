# Contributing

Contributions to Pinhead are **open**. We'd love for you to be involved! If you'd like to add or improve some icons, by all means open an [issue](https://github.com/waysidemapping/pinhead/issues/new) or [pull request](https://github.com/waysidemapping/pinhead/pulls/new). See the [open issues](https://github.com/waysidemapping/pinhead/issues) to browse icons that folks have requested.

By contributing, you agree to license your original work as [CC0](/LICENSE) and to upload license-compatible material only.

## Contributor FAQ

#### Is my icon in scope?

Probably! While this project is focused on maps, you'd be surprised how many icons that don't seem geographic at all end up making useful pinheads.

#### Why 15x15 pixels?

The 15x15 rule mostly comes from Temaki, which inherited it from Maki. Compared to OSM Carto's 14x14, it's pretty handy to use an odd number so that a 1px wide line can be perfectly centered. Going down to 13x13 is feasible for the some icons but starts to get hairy when trying to depcit more complex things. Maki actually used to distribute 11x11 versions of icons (sooo tiny!) but [dropped them](https://github.com/mapbox/maki/commit/96e8b4c5941d687ddf0fde527ad54dde5559eef2) in v7. Probably the benefit didn't justify the maintence overhead in the age of high-DPI displays. So yeah, 15x15 just feels like the sweet spot.

#### I found a cool icon online. Can I upload it?

Maybe! Any external icons **must** have a compatible license (CC0 or equivalent). If you're unsure, just ask. It's **not okay** to upload someone else's work if they retain copyright or have assigned usage restrictions.

#### My icon has been merged. When will it be released?

We aim to have a release roughly once per month. If you need something released sooner for a downstream project, feel free to ask. We can probably accommadate.

## Design guidelines

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
    * <img src="https://pinhead.ink/latest/car.svg" height="15px" width="15px"/> A straight-on horizontal perspective
    * <img src="https://pinhead.ink/latest/bicycle.svg" height="15px" width="15px"/> A horizontal side profile
    * <img src="https://pinhead.ink/latest/railway_track.svg" height="15px" width="15px"/> A top-down vertical perspective
    * <img src="https://pinhead.ink/latest/sandbox_with_sand_trowel.svg" height="15px" width="15px"/> 3D (sparingly!)
  * Multiple icons for different perspectives of the same thing are okay if they're all iconic.
* Orientation
  * Icons should be oriented to convey action from left to right. 
    * E.g. <img src="https://pinhead.ink/latest/bowling_pin_and_bowling_ball.svg" height="15px" width="15px"/> `bowling_pin_and_bowling_ball` implies the ball rolling into the pin from the left.
    * E.g. <img src="https://pinhead.ink/latest/bear_spray_can_with_spray.svg" height="15px" width="15px"/> `bear_spray_can_with_spray` shows the spray moving toward the right.
  * People, animals, vehicles, etc. depicted in profile should be facing to the right.
    * E.g. <img src="https://pinhead.ink/latest/person_on_inclined_swing.svg" height="15px" width="15px"/> `person_on_inclined_swing`, <img src="https://pinhead.ink/latest/bear.svg" height="15px" width="15px"/> `bear`, <img src="https://pinhead.ink/latest/sedan.svg" height="15px" width="15px"/> `sedan`
    * Except when moving backwards.
      * E.g. <img src="https://pinhead.ink/latest/motorboat_on_ramp.svg" height="15px" width="15px"/> `motorboat_on_ramp` since boats are usually launched backwards down slipways.
    * Except when acting as a barrier.
      * E.g. <img src="https://pinhead.ink/latest/police_officer_with_stop_arm.svg" height="15px" width="15px"/> `police_officer_with_stop_arm` since this gesture implies opposition to movement.
    * Except when characteristically shown facing left.
      * E.g. <img src="https://pinhead.ink/latest/ichthys.svg" height="15px" width="15px"/> `ichthys` since this symbol is widely depicted facing left.
  * Hand tools should be pointed to the right.
    * E.g. <img src="https://pinhead.ink/latest/chefs_knife.svg" height="15px" width="15px"/> `chefs_knife`, <img src="https://pinhead.ink/latest/hammer.svg" height="15px" width="15px"/> `hammer`, <img src="https://pinhead.ink/latest/table_tennis_paddle.svg" height="15px" width="15px"/> `table_tennis_paddle`
  * Multiple icons for different orientations generally aren't useful. Users can manually rotate or flip icons if desired.
    * Except when a different orientation gives the icon a different meaning (e.g. arrows).

#### SVGs

* SVGs must contain only shapes that can be rendered with `fill`. Rendering with `stroke` is not supported.
* SVGs must have viewBox="0 0 15 15" with no elements extending outside this frame.
* The build scripts will take care of most other SVG formatting issues.

#### Filenames

* An icon's filename is its unique ID. Choosing a good initial filename reduces the chance of needing to rename an icon later.
* Filenames should use American English.
* Filenames should contain only lowercase letters, numbers, and underscores, and should start with a letter.
* Filenames should be literal instead of symbolic.
  * E.g. prefer <img src="https://pinhead.ink/latest/giraffe.svg" height="15px" width="15px"/> `giraffe` to `zoo` and <img src="https://pinhead.ink/latest/greek_cross.svg" height="15px" width="15px"/> `greek_cross` to `medicine`.
* Filenames should consist of noun phrases separated by prepositions, conjunctions, or verb phrases describing the relationship between elements in the icon. 
  * E.g. <img src="https://pinhead.ink/latest/person_diving_into_water.svg" height="15px" width="15px"/> `person_diving_into_water`, <img src="https://pinhead.ink/latest/kayak_beside_kayak_paddle.svg" height="15px" width="15px"/> `kayak_beside_kayak_paddle`,  <img src="https://pinhead.ink/latest/propane_tank_with_recycling_symbol.svg" height="15px" width="15px"/> `propane_tank_with_recycling_symbol`
* Two icons with similar elements should use similar wordage.
  * E.g. <img src="https://pinhead.ink/latest/campsite_above_water.svg" height="15px" width="15px"/> `campsite_above_water` uses parallel language to <img src="https://pinhead.ink/latest/skull_above_water.svg" height="15px" width="15px"/> `skull_above_water` rather than something like "campsite_over_waves"
* Filenames should be descriptive enough to account for variant icons, even at the risk of being verbose.
  * E.g. using the name <img src="https://pinhead.ink/latest/bus_with_destination_display.svg" height="15px" width="15px"/> `bus_with_destination_display` instead of "bus" leaves room for a variant icon <img src="https://pinhead.ink/latest/bus.svg" height="15px" width="15px"/> `bus`.
* Standalone letters in filenames should refer to capital letters.
  * E.g. <img src="https://pinhead.ink/latest/a.svg" height="15px" width="15px"/> `a`, not "capital_a"
* Filenames for multiletter elements (words, abbreviations, etc.) should consist of the letters suffixed with `_text`.
  * E.g. <img src="https://pinhead.ink/latest/atm_text.svg" height="15px" width="15px"/> `atm_text`, not "atm"
* Filenames for stylized variants (pixel art, cartoon, etc.) should be prefixed with the style name.
   * E.g. <img src="https://pinhead.ink/latest/pixel_anchor.svg" height="15px" width="15px"/> `pixel_anchor`, not "anchor_pixelated"
* Filenames for graphical design variants (size, shape, stroke, etc.) should be suffixed with the graphical difference.
   * E.g. <img src="https://pinhead.ink/latest/circle_outline.svg" height="15px" width="15px"/> `circle_outline`, not "outlined_circle"
   * E.g. <img src="https://pinhead.ink/latest/diamond_tall.svg" height="15px" width="15px"/> `diamond_tall`, not "tall_diamond"
* Note: Prior to v26, most icons were categorized in subdirectories. The subpath was not intended to be part of the icon's ID.

## Icon policies

These polcies guide how the Pinhead project operates.

### AI/ML policy

Icons generated by AI/ML models are assumed to be protected by copyright unless the model owner releases the rights to said icons AND said models have been trained exclusively on public domain sources or sources owned by the model owner. As this is generally never the case, and since major AI/ML model owners are known to be disingenuous about this stuff to the detriment of artists, AI-generated icons will not be considered for inclusion in Pinhead at this time.

Since this repository is licensed in the public domain, you are technically free to train AI/ML models on the icons. But come on, wouldn't you rather draw a <img src="https://pinhead.ink/latest/bison.svg" height="15px" width="15px"/> lil guy and feel a little joy for once?

### Inclusion policy

Pinhead is cartography-first, but has a broad inclusion policy to serve a wide range of use cases. Compatible icons commonly include:

* Literal and abstract representations of places (e.g. mountain, triangle)
* Specific public landmarks (e.g. Eiffel Tower, Statue of Liberty)
* Attributes of places, such as goods, services, activities, and allowed access
* Symbols of any kind found in maps or atlases, including historical
* Symbols useful in map-related software (e.g. UI buttons, status indicators)
* Symbols supporting nontraditional uses of map software (e.g. games, imaging)
* Symbols found on real-world signage
* Simple shapes (squares, circles, arrows)
* Basic letters, numbers, and other text characters
* Components of, or variants of, other Pinhead icons
* Symbols present in upstream public domain icon sets
* Symbols necessary to complete a set (e.g. currency signs)
* Symbols serving specific downstream Pinhead users

Regardless of the above, icons will **not** be included in Pinhead if they include:

* Copyright-protected material
* Trademark-protected material
* Other material incompatible with US law
* AI-generated material
* Material considered universally offensive

Icons that some audiences may find objectionable may still be included provided they serve a legitimate purpose. Icons commonly considered problematic should be marked `sensitive` in the metadata files. Some examples include:

* Symbols depicting nudity for medical purposes
  * E.g. a groin icon may be useful in a medical app for people seeking sexual healthcare, especially if the app is not well translated into their language 
* Hateful symbols with other regional or historical uses
  * E.g. a swastika icon may be useful the context or Hinduism or on a map of World War II

### Deletion policy

Icon deletions can cause major downstream issues and are to be avoided except when absolutely necessary. Such cases include:

* Duplicate icons
* License issues, i.e. when an icon is revealed not to be dedicated to the public domain by its creator
* Policy violations, such as when an icon is revealed to be AI-generated
* Technical issues, such as an icon requiring advanced SVG rendering

When possible, problem icons should be replaced with compatible icons. In some instances, problem icons may need to be removed from versioned distributions that are otherwise expected to be stable.

## Code of conduct

You will be banned if you engage in harassment, unprofessional conduct, or copyright infringement. Be nice or be elsewhere :)
