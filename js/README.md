# Pinhead JS

**Pinhead JS** is a utility and library for composing [**Pinhead**](https://pinhead.ink) icons into
various shapes, including pins, markers, circles, and squares. It's designed for map developers who
need flexible, programmatically generated icons for MapLibre GL JS, Leaflet, or any other web-based
mapping platform.

![](./examples/cafe-black-stroke.svg)
![](./examples/bike-circle-green.svg)
![](./examples/jeep-map_pin-stroke-1.svg)
![](./examples/cargobike-square-blue.svg)
![](./examples/burger-marker.svg)
![](./examples/sun-square-yellow.svg)
![](./examples/plane-square-navy.svg)
![](./examples/ice_cream-circle-pink.svg)
![](./examples/beer-marker-amber.svg)
![](./examples/rocket-map_pin-purple.svg)
![](./examples/pizza-square-red.svg)
![](./examples/bus-circle-blue.svg)
![](./examples/camera-marker-darkgrey.svg)
![](./examples/tree-map_pin-green.svg)
![](./examples/tent-square-brown.svg)

## Features

- **Icon Composition:** Layer any Pinhead icon onto background shapes.
- **Smart Coloring:** Automatically chooses contrasting icon colors based on the background fill.
- **Multiple Shapes:** Supports `circle`, `square`, `map_pin`, and `marker`.
- **Basic transforms:** Rotate and flip icons.
- **CLI & API:** Use it as a command-line tool for batch processing or as a JavaScript library in your app.
- **Custom Icon SVGs:** Pass raw SVG strings as the icon name to use custom icons.
- **Custom Shapes:** Use custom SVG strings or PNG data URIs as background shapes.
- **Migration:** A function is provided to simplify the usage of Pinehead's `changelog.json`.

## Installation

```bash
npm install @waysidemapping/pinhead-js
```

## Options

These options are common across both the CLI and API.

| Option         | Description                                                                                    | Default                                               |
| :------------- | :--------------------------------------------------------------------------------------------- | :---------------------------------------------------- |
| `cornerRadius` | Corner radius (applies to `square` only)                                                       | `4`                                                   |
| `fill`         | Sets the fill color of the icon                                                                | `black` or `white` (auto-calculated from `shapeFill`) |
| `padding`      | Internal padding between icon and shape edge                                                   | Varies by shape                                       |
| `scale`        | Scale factor for the output SVG dimensions                                                     | `1`                                                   |
| `shape`        | Background shape: `square`, `circle`, `map_pin`, `marker`, a raw SVG string, or a PNG data URI | `none`                                                |
| `shapeFill`    | Fill color of the background shape                                                             | `black`                                               |
| `stroke`       | Color of the stroke (applies to shape if present, otherwise icon)                              | Auto-calculated (contrasting or darkened/lightened)   |
| `strokeWidth`  | Width of the stroke                                                                            | `1` for `marker`, else `0`                            |
| `flip`         | Flip the icon: `horizontal` or `vertical`                                                      | `none`                                                |
| `rotate`       | Rotate the icon                                                                                | `none`                                                |

---

## Usage

### JavaScript API

#### Create Icons

Ideal for dynamic icon generation in the browser or on the server.

```javascript
import { getIcon } from "@waysidemapping/pinhead-js";

// Simple icon
const svg = getIcon("cargobike");

// Icon with background and custom colors
const marker = getIcon("jeep", {
  shape: "map_pin",
  shapeFill: "#6486f5",
  strokeWidth: 1,
});
```

##### Examples

| Result                                    | Code                                                                                              |
| :---------------------------------------- | :------------------------------------------------------------------------------------------------ |
| ![](./examples/cargobike.svg)             | `getIcon("cargobike")`                                                                            |
| ![](./examples/cafe-black-stroke.svg)     | `getIcon("cup_and_saucer", { strokeWidth: 1 })`                                                   |
| ![](./examples/bike-circle-green.svg)     | `getIcon("bicycle", { shape: "circle", shapeFill: "white", fill: "#6dad6f", stroke: "#6dad6f" })` |
| ![](./examples/burger-marker.svg)         | `getIcon("burger", { shape: "marker", shapeFill: "#3FB1CE" })`                                    |
| ![](./examples/ice_cream-circle-pink.svg) | `getIcon("ice_cream_on_cone", { shape: "circle", shapeFill: "pink" })`                            |
| ![](./examples/rocket-map_pin-purple.svg) | `getIcon("rocketship", { shape: "map_pin", shapeFill: "purple" })`                                |

#### Custom Icon SVGs

You can pass a raw SVG string as the icon name to use a custom icon.

```javascript
import { getIcon } from "@waysidemapping/pinhead-js";

const customIcon = getIcon(
  '<svg viewBox="0 0 15 15"><path d="M7.5 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" fill="red"/></svg>',
  {
    shape: "circle",
    shapeFill: "white",
  },
);
```

#### Custom Shapes

You can provide your own background shapes as SVG strings or PNG data URIs. Use the `padding` option as an array `[x, y]` to precisely position the 15x15 icon within your custom shape.

```javascript
import { getIcon } from "@waysidemapping/pinhead-js";

// Custom SVG shape
const customSvg = getIcon("bicycle", {
  shape:
    '<svg viewBox="0 0 25 25"><circle cx="12.5" cy="12.5" r="10" fill="green"/></svg>',
  padding: [5, 5],
});

// Custom PNG shape (base64 data URI)
const customPng = getIcon("bus", {
  shape:
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAjCAYAAABhCKGo...",
  padding: [5, 10],
});
```

#### Migrate an icon name

```javascript
import { migrateName } from "@waysidemapping/pinhead-js";

// Migrate a name previously used by Pinhead. If a name was used more than once, the more recent name is returned.
let name = migrateName("pedestrian"); // -> "person_walking"

// Migrate from a specific version (treasure_map was renamed, in v13, but a new treasure_map was introduced then too)
migrateName("treasure_map", "pinhead@10"); // -> "bifold_map_with_dotted_line_to_x"
migrateName("treasure_map", "pinhead@13"); // -> "treasure_map"

// Migrate from a seed source
migrateName("maps", "nps"); // -> "bifold_map_with_dotted_line_to_x"
```

### Command Line Interface (CLI)

#### 1. Generate a single icon

Outputs the SVG string directly to `stdout`.

```bash
npx pinhead get-icon cargobike --shape=square --shapeFill='#6486f5' > icon.svg
```

#### 2. Batch build from configuration

The `build-icons` command creates a collection of SVG files based on a JSON configuration file. By default, it looks for `pinhead.json` and writes results to a `./svgs/` directory.

```bash
npx pinhead build-icons --config my-icons.json --outdir ./assets/icons
```

**`pinhead.json` structure:**

```json
{
  "groups": [
    {
      "icons": {
        "bicycle": "bike-icon",
        "bus": "bus-marker"
      },
      "options": {
        "shape": "circle",
        "shapeFill": "#6486f5"
      }
    }
  ]
}
```

---

## Custom Icon SVG requirements

To work with Pinhead JS as a custom icon (passed as the `name` argument), custom SVG strings must follow these constraints:

- Use only `<path>` elements.
- Path elements should only contain the `d` attribute.
- The `viewBox` should be `"0 0 15 15"`, or `height` and `width` should be set to `15`.

---

## Integrations

### MapLibre GL JS

To use Pinhead JS dynamically with MapLibre:

```javascript
const svg = getIcon("greek_cross", { shape: "circle", shapeFill: "red" });

const img = new Image();
const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
img.src = URL.createObjectURL(blob);
await img.decode();

map.addImage("hospital-icon", img);

URL.revokeObjectURL(url);
```

---

## Inspiration

Pinhead JS is inspired by the [Maki Icon Editor](https://labs.mapbox.com/maki-icons/editor/) and [makiwich](https://github.com/mapbox/makiwich)

## License

Pinhead JS is distributed under [CC0](/LICENSE).
