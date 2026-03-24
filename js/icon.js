import index from "@waysidemapping/pinhead/dist/icons/index.complete.json" with { type: "json" };
import tinycolor from "tinycolor2";
import { getSvgPathStrings, minify } from "./util.js";

// Hard coding for 15x15 requirement for Pinhead icons
const size = 15;

const defaultPadding = {
  map_pin: 4,
  circle: 2,
  square: 2,
  marker: 5,
};

export function getIcon(name, properties = {}) {
  let iconSvg;
  if (name.includes("<svg")) {
    iconSvg = name;
  } else {
    const icon = index.icons[name];
    if (!icon) {
      throw new Error(`unknown icon: ${name}`);
    }
    iconSvg = icon.svg;
  }

  const shape = properties.shape;

  const paths = getSvgPathStrings(iconSvg);

  let scale = properties.scale || 1;
  let shapeFill = properties.shapeFill || "#000";
  let strokeWidth = properties.strokeWidth || (shape === "marker" ? 1 : 0);
  let tinyShapeFill = tinycolor(shapeFill);
  let stroke = properties.stroke;
  if (!stroke) {
    if (shape == "marker") {
      stroke = (
        tinyShapeFill.isLight()
          ? tinyShapeFill.darken()
          : tinyShapeFill.lighten()
      ).toString();
    } else {
      stroke = tinyShapeFill.getBrightness() <= 160 ? "#fff" : "#000";
    }
  }
  let fill = properties.fill;
  if (shape && !fill) {
    fill = tinyShapeFill.getBrightness() <= 160 ? "#fff" : "#000";
  }
  let padding =
    properties.padding === undefined
      ? defaultPadding[shape]
      : properties.padding;
  let cornerRadius =
    properties.cornerRadius === undefined ? 4 : properties.cornerRadius;
  let iconOffset = [0, 0]; // base translation to account for background. does NOT account for stroke width!
  // Size of the output icon
  let height = size;
  let width = size;

  let bgScale = 1;
  // Compute iconOffset and final icon size
  switch (true) {
    case shape === "circle":
    case shape === "square":
      height += 2 * padding + 2 * strokeWidth;
      width += 2 * padding + 2 * strokeWidth;
      iconOffset = [padding, padding];
      break;
    case shape === "map_pin":
    case shape === "marker":
      height = 31 + 2 * strokeWidth;
      width = 23 + 2 * strokeWidth;
      iconOffset = [padding, padding];
      // Account for the fact that standard pin width is defined for padding=4
      const newWidth = width + 2 * (padding - 4);
      bgScale = newWidth / width;
      height *= bgScale;
      width = newWidth;
      if (shape === "marker")
        // account for marker shadow
        height += 5;
      height = Math.ceil(height);
      break;
    default:
      height += 2 * strokeWidth;
      width += 2 * strokeWidth;
      break;
  }

  let svg = minify`<svg xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 ${width} ${height}"
      ${scale ? `width="${scale * width}" height="${scale * height}"` : ""}
      >`;

  switch (true) {
    case shape === "circle":
      cornerRadius = (size + 2 * padding) / 2;
    case shape === "square":
      const rectSize = size + 2 * padding;
      if (strokeWidth) {
        svg += minify`<rect
          x="${strokeWidth}"
          y="${strokeWidth}"
          width="${rectSize}" height="${rectSize}"
          rx="${cornerRadius}" ry="${cornerRadius}"
          stroke-linejoin="round"
          stroke="${stroke}"
          stroke-width="${strokeWidth * 2}"
          />`;
      }
      svg += minify`<rect
          x="${strokeWidth}"
          y="${strokeWidth}"
          width="${rectSize}" height="${rectSize}"
          rx="${cornerRadius}" ry="${cornerRadius}"
          fill="${shapeFill}"
          />`;
      break;
    case shape === "marker":
      svg += minify`
            <ellipse opacity="0.04" cx="${width / 2}" cy="${height - 5}" rx="10.5" ry="5.25002273"/>
            <ellipse opacity="0.04" cx="${width / 2}" cy="${height - 5}" rx="10.5" ry="5.25002273"/>
            <ellipse opacity="0.04" cx="${width / 2}" cy="${height - 5}" rx="9.5" ry="4.77275007"/>
            <ellipse opacity="0.04" cx="${width / 2}" cy="${height - 5}" rx="8.5" ry="4.29549936"/>
            <ellipse opacity="0.04" cx="${width / 2}" cy="${height - 5}" rx="7.5" ry="3.81822308"/>
            <ellipse opacity="0.04" cx="${width / 2}" cy="${height - 5}" rx="6.5" ry="3.34094679"/>
            <ellipse opacity="0.04" cx="${width / 2}" cy="${height - 5}" rx="5.5" ry="2.86367051"/>
            <ellipse opacity="0.04" cx="${width / 2}" cy="${height - 5}" rx="4.5" ry="2.38636864"/>
        `;
    case shape === "map_pin":
      const d =
        "M 11.5,31 C 19.166667,22.234183 23,15.734183 23,11.5 23,5.1487254 17.851275,0 11.5,0 5.1487254,0 0,5.1487254 0,11.5 0,15.734183 3.8333333,22.234183 11.5,31 Z";
      let scaleTransform = "";
      if (bgScale !== 1) {
        scaleTransform = `scale(${bgScale}) `;
      }
      if (strokeWidth) {
        svg += minify`<path d="${d}"
          transform="${scaleTransform}translate(${strokeWidth} ${strokeWidth})"
          stroke-linejoin="round"
          stroke="${stroke}"
          stroke-width="${strokeWidth * 2}"
          />`;
      }
      svg += minify`<path d="${d}"
        fill="${shapeFill}"
        transform="${scaleTransform}translate(${strokeWidth} ${strokeWidth})"
        />`;
      break;
    default:
      // Nothing to do when not drawing a shape
      break;
  }
  let extraTransform = "";
  if (properties.rotate) {
    extraTransform = ` rotate(${properties.rotate} 7.5 7.5)`;
  }
  if (properties.flip === "horizontal") {
    iconOffset[0] += size;
    extraTransform = `scale(-1 1)`;
  } else if (properties.flip === "vertical") {
    iconOffset[1] += size;
    extraTransform = `scale(1 -1)`;
  }
  for (const path of paths) {
    if (!shape && strokeWidth) {
      svg += minify`<defs><clipPath id="stroke-clip">
              <path 
                clip-rule="evenodd"
                d="M${-strokeWidth} ${-strokeWidth}V${15 + strokeWidth}H${15 + strokeWidth}V${-15 - strokeWidth}Z M0 0 ${path}"
                />
        </clipPath></defs>`;
      // linecap & dasharray are a hack to fix problems with self intersection strokes in holes
      // https://stackoverflow.com/questions/69006152/svg-stroke-overlaps-disappear
      // to see the problem, remove the lines and generate a cargobike icon with stroke=1
      svg += minify`<path
              transform="translate(${iconOffset[0] + strokeWidth} ${iconOffset[1] + strokeWidth})${extraTransform}"
              clip-path="url(#stroke-clip)"
              fill="none"
              stroke-linejoin="round"
              stroke-linecap="round" stroke-dasharray="1 0"
              stroke="${stroke}"
              stroke-width="${2 * strokeWidth}"
              d="${path}"
              />`;
    }
    svg += minify`<path
            ${iconOffset[0] || iconOffset[1] || strokeWidth || extraTransform ? `transform="translate(${iconOffset[0] + strokeWidth} ${iconOffset[1] + strokeWidth})${extraTransform}"` : ""}
            ${fill ? `fill="${fill}"` : ""}
            d="${path}"
            />`;
  }
  svg += "</svg>";
  return svg;
}
