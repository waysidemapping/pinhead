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

- **Icon Composition:** Layer any **Pinhead** icon onto background shapes.
- **Smart Coloring:** Automatically chooses contrasting icon colors based on the background fill.
- **Multiple Shapes:** Supports `circle`, `square`, `map_pin`, and `marker`.
- **CLI & API:** Use it as a command-line tool for batch processing or as a JavaScript library in your app.
- **Custom SVGs:** Pass raw SVG strings to compose custom icons

## Installation

```bash
npm install @waysidemapping/pinhead
```

## Options

These options are common across both the CLI and API.

| Option         | Description                                                       | Default                                               |
| :------------- | :---------------------------------------------------------------- | :---------------------------------------------------- |
| `cornerRadius` | Corner radius (applies to `square` only)                          | `4`                                                   |
| `fill`         | Sets the fill color of the icon                                   | `black` or `white` (auto-calculated from `shapeFill`) |
| `padding`      | Internal padding between icon and shape edge                      | Varies by shape                                       |
| `scale`        | Scale factor for the output SVG dimensions                        | `1`                                                   |
| `shape`        | Background shape: `square`, `circle`, `map_pin`, or `marker`      | `none`                                                |
| `shapeFill`    | Fill color of the background shape                                | `black`                                               |
| `stroke`       | Color of the stroke (applies to shape if present, otherwise icon) | Auto-calculated (contrasting or darkened/lightened)   |
| `strokeWidth`  | Width of the stroke                                               | `1` for `marker`, else `0`                            |

---

## Usage

### JavaScript API

Ideal for dynamic icon generation in the browser or on the server.

```javascript
import { getSprite } from "@waysidemapping/pinhead-js";

// Simple icon
const svg = getSprite("cargobike");

// Icon with background and custom colors
const marker = getSprite("jeep", {
  shape: "map_pin",
  shapeFill: "#6486f5",
  strokeWidth: 1,
});
```

#### Examples

| Result                                       | Code                                                                                                |
| :------------------------------------------- | :-------------------------------------------------------------------------------------------------- |
| ![](./examples/cargobike.svg)         | `getSprite("cargobike")`                                                                            |
| ![](./examples/cafe-black-stroke.svg) | `getSprite("cup_and_saucer", { strokeWidth: 1 })`                                                   |
| ![](./examples/bike-circle-green.svg) | `getSprite("bicycle", { shape: "circle", shapeFill: "white", fill: "#6dad6f", stroke: "#6dad6f" })` |
| ![](./examples/burger-marker.svg)     | `getSprite("burger", { shape: "marker", shapeFill: "#3FB1CE" })`                                    |
| ![](./examples/ice_cream-circle-pink.svg)| `getSprite("ice_cream_on_cone", { shape: "circle", shapeFill: "pink" })`                           |
| ![](./examples/rocket-map_pin-purple.svg)| `getSprite("rocketship", { shape: "map_pin", shapeFill: "purple" })`                               |

### Command Line Interface (CLI)

#### 1. Generate a single sprite

Outputs the SVG string directly to `stdout`.

```bash
npx pinhead get-sprite cargobike --shape=square --shapeFill='#6486f5' > icon.svg
```

#### 2. Batch build from configuration

The `build-sprites` command creates a collection of SVG files based on a JSON configuration file. By default, it looks for `pinhead.json` and writes results to a `./svgs/` directory.

```bash
npx pinhead build-sprites --config my-icons.json --outdir ./assets/icons
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

## Custom SVG icon requirements

To work with **Pinhead JS**, custom SVG strings must follow these constraints:

- Use only `<path>` elements.
- Path elements should only contain the `d` attribute.
- The `viewBox` should be `"0 0 15 15"`, or `height` and `width` should be set to `15`.

---


## Versioning 

Because **Pinhead** generally uses major version numbers, but **Pinhead JS** uses it's `changelog.json` too offer compatibility across versions, the major version of **Pinhead JS** reflects breaking API changes, the minor version reflects the version of Pinhead, and the patch version is incremented for non-breaking changes.

EG: `@waysidemapping/pinhead-js==1.15.0` bundles `@waysidemapping/pinhead==15.0.0`

If you wish to use a very specific version of **Pinhead**, you can import it yourself and use **Pinhead JS**'s custom SVG support: 

```
import { getSprite } from "@waysidemapping/pinhead-js";
import index from "@waysidemapping/pinhead/dist/icons/index.complete.json" with { type: "json" };

const svg = getSprite(index.icons['bicycle'].svg, { shape: 'marker' });
```

---

## Integrations

### MapLibre GL JS

To use **Pinhead JS** dynamically with MapLibre:

```javascript
const svg = getSprite("greek_cross", { shape: "circle", shapeFill: "red" });

const img = new Image();
const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
img.src = URL.createObjectURL(blob);
await img.decode();

map.addImage("hospital-icon", img);

URL.revokeObjectURL(url);
```

---

## Inspiration

**Pinhead JS** is inspired by the [Maki Icon Editor](https://labs.mapbox.com/maki-icons/editor/) and [makiwich](https://github.com/mapbox/makiwich)

## License

**Pinhead JS** is distributed under [CC0](/LICENSE).
