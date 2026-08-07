# Styling

Import the default stylesheet before overrides:

```ts
import '@dkfz-unite/oncogrid/style.css';
import './oncogrid-overrides.css';
```

Defaults cover the grid, axes, labels, tracks, hover states, and crosshair.

## Scoped overrides

Scope rules to the host when a page contains more than one grid:

```css
#project-grid .og-background {
  fill: #fcfcfd;
  stroke: #64748b;
}

#project-grid .og-label-text-font {
  fill: #1e293b;
  font-size: 0.65rem;
}

#project-grid .og-event:hover,
#project-grid .og-summary-bar:hover {
  stroke: #0f172a;
  stroke-width: 2;
}
```

## Selectors

| Selector | Element |
| --- | --- |
| `.og-container` | Component root |
| `.og-background` | Matrix background and border |
| `.og-column-line`, `.og-row line` | Matrix lines |
| `.og-histogram-axis` | Histogram axes |
| `.og-label-text-font`, `.og-row-label` | Labels |
| `.og-track-group-label`, `.og-track-label` | Track labels |
| `.og-event` | Cell event segments |
| `.og-summary-bar` | Histogram segments |
| `.og-track-data` | Track cells |
| `.og-vertical-cross`, `.og-horizontal-cross` | Crosshair |

## Event colors

Configure colors through options so cells and histograms stay synchronized:

```ts
const grid = new OncoGrid({
  columns,
  rows,
  events,
  colorPalette: ['#0072b2', '#e69f00', '#009e73'],
  colorMap: { warning: '#d55e00' }
});
```

Use options for geometry and behavior; use CSS for typography, borders, backgrounds, and hover states. See [constructor options](api.md#constructor).

## Custom prefix

The bundled stylesheet targets `og-`. A custom `prefix` changes generated class names, so it also requires matching application CSS.
