# Layout

All sizes are pixels. The matrix dimensions exclude labels, histograms, tracks, and margins.

| Configuration path | Type | Default | Effect |
| --- | --- | --- | --- |
| `configuration.width` | `number` | `500` | Matrix width |
| `configuration.height` | `number` | `500` | Requested matrix height |
| `configuration.minCellHeight` | `number` | `10` | Minimum height of each row; may increase the final height |
| `configuration.scaleToFit` | `boolean` | `true` | Scale the SVG with its container using its view box |
| `configuration.leftTextWidth` | `number` | `80` | Width reserved for row labels |
| `configuration.margin` | object | `{ top: 30, right: 100, bottom: 15, left: 80 }` | Outer space around the visualization |
| `configuration.rowHistogramWidth` | `number` | `80` | Width of the row histogram |
| `configuration.histogramBorderPadding.left` | `number` | `10` | Horizontal padding beside histogram borders |
| `configuration.histogramBorderPadding.bottom` | `number` | `5` | Vertical padding below histogram borders |
| `configuration.trackHeight` | `number` | `10` | Thickness of every metadata track |
| `configuration.trackPadding` | `number` | `20` | Space allocated around track groups |
| `configuration.prefix` | `string` | `'eg-'` | Prefix for generated CSS class names |

## Responsive sizing

With `configuration.scaleToFit: true`, the SVG uses its view box and the canvas fills the available host width. Give the host its intended width in application CSS:

```css
#grid {
  width: min(100%, 1100px);
}
```

Call the instance method when the matrix dimensions themselves must change:

```js
grid.resize(900, 480);
```

If `height / rowCount` is below `minCellHeight`, EventGrid increases the matrix height to `rowCount * minCellHeight`.

## Margins

Provide all four margin values:

```js
const configuration = {
  margin: {
    top: 40,
    right: 120,
    bottom: 20,
    left: 100
  }
};
```

## CSS prefix

The bundled stylesheet targets the default `eg-` prefix. Changing `configuration.prefix` changes generated class names and therefore requires a complete matching stylesheet. For ordinary visual overrides, keep the default prefix and load custom CSS after the package stylesheet. See [Styling](styling.md).
