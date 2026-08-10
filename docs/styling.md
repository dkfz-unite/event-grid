# Styling

Import the default stylesheet before overrides:

```ts
import '@dkfz-unite/event-grid/style.css';
import './event-grid-overrides.css';
```

Defaults cover the grid, axes, labels, tracks, hover states, and crosshair.

## Scoped overrides

Scope rules to the host when a page contains more than one grid:

```css
#project-grid .eg-background {
  fill: #fcfcfd;
  stroke: #64748b;
}

#project-grid .eg-label-text-font {
  fill: #1e293b;
  font-size: 0.65rem;
}

#project-grid .eg-event:hover,
#project-grid .eg-summary-bar:hover {
  fill-opacity: 0.6;
}
```

## Selectors

| Selector | Element |
| --- | --- |
| `.eg-container` | Component root |
| `.eg-background` | Matrix background and border |
| `.eg-column-line`, `.eg-row line` | Matrix lines |
| `.eg-histogram-axis` | Histogram axes |
| `.eg-label-text-font`, `.eg-row-label` | Labels |
| `.eg-track-group-label`, `.eg-track-label` | Track labels |
| `.eg-event` | Cell event segments |
| `.eg-summary-bar` | Histogram segments |
| `.eg-track-data` | Track cells |
| `.eg-vertical-cross`, `.eg-horizontal-cross` | Crosshair |

## Event colors

Configure colors through options so cells and histograms stay synchronized:

```ts
const grid = new EventGrid({
  columns,
  rows,
  events,
  colorPalette: ['#0072b2', '#e69f00', '#009e73'],
  colorMap: { warning: '#d55e00' }
});
```

Use options for geometry and behavior; use CSS for typography, borders, backgrounds, and hover states. See [constructor options](api.md#constructor).

## Custom prefix

The bundled stylesheet targets `eg-`. A custom `prefix` changes generated class names, so it also requires matching application CSS.
