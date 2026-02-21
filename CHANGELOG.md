# Changelog

## [3.0.0] - 2026-02-21

⚠️ This major release contains new and redesigned icons that may affect your setup. A machine-readable version of the icon upgrade paths can be found in the [`migrations.json`](/migrations.json) file.

### New icons

- <img src="https://pinhead.ink/v3/car_profile.svg" width="15px"/> Add `car_profile`
- <img src="https://pinhead.ink/v3/mobile_phone_with_keypad_and_antenna_and_wifi.svg" width="15px"/> Add `mobile_phone_with_keypad_and_antenna_and_wifi`
- <img src="https://pinhead.ink/v3/mobile_phone_with_touchscreen_and_antenna_and_wifi.svg" width="15px"/> Add `mobile_phone_with_touchscreen_and_antenna_and_wifi`

### Redesigned icons

- <img src="https://pinhead.ink/v2/wifi.svg" width="15px"/> -> <img src="https://pinhead.ink/v3/wifi.svg" width="15px"/> Update `wifi` to be simpler and bolder, and therefore more legible at smaller sizes and easier to combine with other icons

## [2.1.1] - 2026-02-20

### Developer changes

- List added icons in [`migrations.json`](/migrations.json) file
- Include `migrations.json` file in the distribution

## [2.1.0] - 2026-02-20

### Developer changes

- Remove unnecessary `<?xml version="1.0" encoding="UTF-8"?>` declarations from every icon
- Remove unnecessary `version="1.1"` and `xmlns:xlink="http://www.w3.org/1999/xlink"` attributes from `<svg>` element of every icon

## [2.0.0] - 2026-02-20

⚠️ This major release contains new, redesigned, and renamed icons that may affect your setup. A machine-readable version of the icon upgrade paths can be found in the [`migrations.json`](/migrations.json) file.

### New icons

- <img src="https://pinhead.ink/v2/turtle_top.svg" width="15px"/> Add `turtle_top`
- <img src="https://pinhead.ink/v2/arrow_down_to_down_bracket.svg" width="15px"/> Add `arrow_down_to_down_bracket`
- <img src="https://pinhead.ink/v2/arrow_up_to_up_bracket.svg" width="15px"/> Add `arrow_up_to_up_bracket`
- <img src="https://pinhead.ink/v2/arrow_left_to_left_bracket.svg" width="15px"/> Add `arrow_left_to_left_bracket`

### Redesigned icons

- <img src="https://pinhead.ink/v1/arrow_right_to_right_bracket.svg" width="15px"/> -> <img src="https://pinhead.ink/v2/arrow_right_to_right_bracket.svg" width="15px"/> Update `arrow_right_to_right_bracket` thickness to match similar arrow icons

### Renamed icons

Various icons have been renamed due to issues found in the initial release. 

- <img src="https://pinhead.ink/v2/latin_cross.svg" width="15px"/> Rename `cross_latin` -> `latin_cross` for consistency with `greek_cross`
- <img src="https://pinhead.ink/v2/flower_bouquet.svg" width="15px"/> Rename `flower_boquette` -> `flower_bouquet` to fix spelling
- <img src="https://pinhead.ink/v2/plant_in_raised_planter.svg" width="15px"/> Rename `plan_in_raised_planter` -> `plant_in_raised_planter` to fix typo
- Rename various transit icons for consistency
  - <img src="https://pinhead.ink/v2/hanging_rail_transit_vehicle_with_destination_display.svg" width="15px"/> `hanging_rail_transit_vehicle` -> `hanging_rail_transit_vehicle_with_destination_display`
  - <img src="https://pinhead.ink/v2/transit_vehicle_with_destination_display.svg" width="15px"/> `local_transit_vehicle` -> `transit_vehicle_with_destination_display`
  - <img src="https://pinhead.ink/v2/monorail_transit_vehicle_with_destination_display.svg" width="15px"/> `monorail_transit_vehicle` -> `monorail_transit_vehicle_with_destination_display`
  - <img src="https://pinhead.ink/v2/person_boarding_bus_with_destination_display.svg" width="15px"/> `person_boarding_bus` -> `person_boarding_bus_with_destination_display`
  - <img src="https://pinhead.ink/v2/person_boarding_hanging_rail_transit_vehicle_with_destination_display.svg" width="15px"/> `person_boarding_hanging_rail_transit_vehicle` -> `person_boarding_hanging_rail_transit_vehicle_with_destination_display`
  - <img src="https://pinhead.ink/v2/person_boarding_transit_vehicle_with_destination_display.svg" width="15px"/> `person_boarding_local_transit_vehicle` -> `person_boarding_transit_vehicle_with_destination_display`
  - <img src="https://pinhead.ink/v2/person_boarding_monorail_transit_vehicle_with_destination_display.svg" width="15px"/> `person_boarding_monorail_transit_vehicle` -> `person_boarding_monorail_transit_vehicle_with_destination_display`

### Developer changes

- Add [`migrations.json`](/migrations.json) file

## [1.0.1] - 2026-02-20

- Add `version` property to the `index.json` and `index.complete.json` files

## [1.0.0] - 2026-02-19

_Initial release_
