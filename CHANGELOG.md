# Changelog

## [2.0.0] - 2026-02-20

### ⚠️ Breaking changes

Various icons have been renamed due to issues found in the initial release. A machine-readable version of the upgrade paths can be found in the [`migrations.json`](/migrations.json) file.

- Rename `cross_latin` -> `latin_cross` for consistency with `greek_cross`
- Rename `flower_boquette` -> `flower_bouquet` to fix spelling
- Rename `plan_in_raised_planter` -> `plant_in_raised_planter` to fix typo
- Rename various transit icons for consistency
  - `hanging_rail_transit_vehicle` -> `hanging_rail_transit_vehicle_with_destination_display`
  - `local_transit_vehicle` -> `transit_vehicle_with_destination_display`
  - `monorail_transit_vehicle` -> `monorail_transit_vehicle_with_destination_display`
  - `person_boarding_bus` -> `person_boarding_bus_with_destination_display`
  - `person_boarding_hanging_rail_transit_vehicle` -> person_boarding_hanging_rail_transit_vehicle_with_destination_display`
  - `person_boarding_local_transit_vehicle` -> `person_boarding_transit_vehicle_with_destination_display`
  - `person_boarding_monorail_transit_vehicle` -> `person_boarding_monorail_transit_vehicle_with_destination_display`

### Developer changes

- Add [`migrations.json`](/migrations.json) file.

## [1.0.1] - 2026-02-20

- Add `version` property to the `index.json` and `index.complete.json` files

## [1.0.0] - 2026-02-19

_Initial release_
