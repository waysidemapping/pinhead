export function getSvgPathStrings(iconSvg) {
  const paths = [];
  for (const { groups } of iconSvg.matchAll(
    /<path[^>]+?d="(?<path>[^"]+?)"/gm,
  )) {
    paths.push(groups.path);
  }
  return paths;
}
