# Changelog

## [2.0.0] - 2026-02-20

### ⚠️ Breaking changes

Various icons have been renamed due to issues found in the initial release. A machine-readable version of the upgrade paths can be found in the [`migrations.json`](/migrations.json) file.

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

- Add [`migrations.json`](/migrations.json) file.

## [1.0.1] - 2026-02-20

- Add `version` property to the `index.json` and `index.complete.json` files

## [1.0.0] - 2026-02-19

_Initial release_
