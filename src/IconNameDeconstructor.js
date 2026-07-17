const iconNamePartSeparator =
  /_with_|_on_|_in_|_onto_|_into_|_and_|_under_|_over_|_above_|_beside_|_between_|_atop_|_within_|_from_|_to_|_toward_|_wearing_|_holding_|_carrying_|_crossing_|_dragging_|_aiming_|_boarding_|_riding_|_driving_|_using_/;

export function deconstructIconName(name) {
  return name.split(iconNamePartSeparator);
}
