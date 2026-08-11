# Styling

Import the default stylesheet after the constructor and before application overrides:

```js
import EventGrid from '@dkfz-unite/event-grid';
import '@dkfz-unite/event-grid/style.css';
import './event-grid-overrides.css';
```

The package stylesheet provides usable defaults for the matrix, histograms, tracks, labels, crosshairs, and hover states. Override only the parts required by the application.

## Scoped overrides

Scope rules to the host, especially when a page contains multiple grids:

```css
#project-grid .eg-background {
  fill: #fcfcfd;
  stroke: #64748b;
}

#project-grid .eg-label-text-font {
  fill: #1e293b;
  font-family: system-ui, sans-serif;
  font-size: 0.65rem;
}

#project-grid .eg-event:hover,
#project-grid .eg-summary-bar:hover,
#project-grid .eg-track-data:hover {
  fill-opacity: 0.6;
}
```

Load overrides after `style.css` so rules with equal specificity take precedence.

## Main selectors

| Selector | Element |
| --- | --- |
| `.eg-container` | Component root |
| `.eg-canvas` | Visualization wrapper |
| `.eg-maingrid-svg` | Main SVG |
| `.eg-background` | Matrix background and border |
| `.eg-column-line`, `.eg-row line` | Matrix grid lines |
| `.eg-histogram-axis` | Histogram axes |
| `.eg-label-text-font`, `.eg-row-label` | Shared and row labels |
| `.eg-track-group-label`, `.eg-track-label` | Track-group and track labels |
| `.eg-event` | Cell event segments |
| `.eg-summary-bar` | Histogram segments |
| `.eg-track-data` | Track cells |
| `.eg-vertical-cross`, `.eg-horizontal-cross` | Crosshair lines |

## Event-type selectors

Each cell segment also receives an event-type class. Characters other than letters, numbers, `_`, and `-` become `-`:

```css
.eg-event-type-blocked {
  stroke: #7f1d1d;
}
```

Prefer `configuration.colorPalette` and `configuration.colorMap` for fill colors because those settings keep grid cells and both histograms synchronized. See [Event colors and summaries](data.md#event-colors-and-summaries).

## Track selectors

Track cells receive classes derived from the stable track ID and their value, plus a `data-track-id` attribute:

```css
.eg-track-capacity {
  stroke: #475569;
}

.eg-track-value-high {
  fill: #2166ac;
}
```

Unsupported class-name characters are replaced with `-`. Prefer each track's `fill`, `opacityFunction`, `colorPalette`, and `colorMap` options for data-driven styling. See [Track colors and opacity](data.md#track-colors-and-opacity).

## Geometry versus CSS

Use [layout configuration](layout.md) for dimensions and spacing. Use CSS for typography, borders, backgrounds, and interaction appearance.

## Custom prefix

The default stylesheet targets `eg-`. A different `configuration.prefix` changes generated class names, so the default stylesheet no longer matches. Supply a complete stylesheet for the chosen prefix rather than using it as a simple visual override.
