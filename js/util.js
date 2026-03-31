export function getSvgPathStrings(iconSvg) {
  const paths = [];
  for (const { groups } of iconSvg.matchAll(
    /<path[^>]+?d="(?<path>[^"]+?)"/gm,
  )) {
    paths.push(groups.path);
  }
  return paths;
}

// minify is a JS template tag function to strip whitespace from XML
export function minify(strings, ...values) {
  // Interleave the strings and values
  let output = strings.reduce((acc, part, i) => {
    return acc + part + (values[i] !== undefined ? values[i] : "");
  }, "");

  // remove newlines
  output = output.replace(/\n/g, " ");
  // trim
  output = output.trim();
  // remove double spaces
  output = output.replace(/\s\s+/g, " ");
  // remove spaces around > and < and />
  output = output.replace(/\s*(\/?>|<)\s*/g, "$1");
  return output;
}
