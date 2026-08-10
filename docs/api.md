# API

Import the constructor and default styles:

```ts
import EventGrid from '@dkfz-unite/event-grid';
import '@dkfz-unite/event-grid/style.css';
```

## Constructor

```ts
const grid = new EventGrid({
  element: '#grid',
  columns,
  rows,
  events
});

grid.render();
```

Omitted collections default to empty arrays.

### Data

| Option | Type | Description |
| --- | --- | --- |
| `columns` | `GridItem[]` | Column items |
| `rows` | `GridItem[]` | Row items |
| `events` | `GridEvent[]` | Events joining a column and row |
| `element` | `string \| HTMLElement` | Host element; defaults to `body` |

See the [data interface](data-interface.md).

### Layout

| Option | Default | Description |
| --- | --- | --- |
| `width` | `500` | Matrix width |
| `height` | `500` | Matrix height |
| `minCellHeight` | `10` | Minimum row height |
| `scaleToFit` | `true` | Scale SVG to its container |
| `leftTextWidth` | `80` | Space for row labels |
| `margin` | `{ top: 30, right: 100, bottom: 15, left: 80 }` | Outer margins |
| `sortByFrequency` | `false` | Rank rows by occupied columns, then columns by row-event pattern |
| `grid` | `false` | Show cell lines |
| `heatMap` | `false` | Start in heat-map mode; cells darken as their event count increases |
| `heatMapColor` | `#D33682` | Heat-map color |
| `eventStacking` | `v` | `v` for vertical or `h` for horizontal cell segments |
| `rowHistogramWidth` | `80` | Row-histogram width |
| `prefix` | `eg-` | Generated CSS-class prefix |

### Events and colors

| Option | Description |
| --- | --- |
| `summaryEventTypes` | Included histogram types and their order; defaults to all types |
| `colorPalette` | Replacement categorical palette |
| `colorMap` | Per-type color overrides |

The resolved colors are available as `grid.colorMap`; the built-in palette is `EventGrid.defaultColorPalette`.

### Tracks

| Option | Description |
| --- | --- |
| `columnTracks`, `rowTracks` | Track definitions |
| `columnFillFunc`, `rowFillFunc` | Track-cell colors |
| `columnOpacityFunc`, `rowOpacityFunc` | Track-cell opacity |
| `trackHeight`, `trackPadding` | Track geometry |
| `trackLegendLabel` | Track legend HTML |
| `expandableGroups` | Groups whose tracks may be hidden or restored |
| `nullSentinel` | Value treated as unavailable; defaults to `-777` |

A track definition accepts `name`, `fieldName`, and optional `type`, `group`, `collapsed`, and `sort`.

## Methods

| Method | Effect |
| --- | --- |
| `render()` | Render the grid |
| `resize(width, height)` | Resize the grid |
| `cluster()` | Apply frequency ordering immediately |
| `sortColumns(comparator)`, `sortRows(comparator)` | Apply a custom order |
| `removeColumns(predicate)`, `removeRows(predicate)` | Remove items and linked events |
| `setHeatmap(active)`, `toggleHeatmap()` | Control heat-map mode |
| `setGridLines(active)`, `toggleGridLines()` | Control cell lines |
| `setCrosshair(active)`, `toggleCrosshair()` | Control crosshair mode |
| `reload()` | Rebuild from constructor options and restore configured ordering |
| `destroy()` | Remove rendered DOM |

## Native events

EventGrid extends [`EventTarget`](https://developer.mozilla.org/docs/Web/API/EventTarget). Event payloads are in [`CustomEvent.detail`](https://developer.mozilla.org/docs/Web/API/CustomEvent/detail). Use constants from `EventGrid.eventNames`.

```ts
const listener = ({ detail }: CustomEvent<EventGrid.Cell>) => {
  console.log(detail.events);
};

grid.addEventListener(EventGrid.eventNames.gridClick, listener);
grid.removeEventListener(EventGrid.eventNames.gridClick, listener);
```

Use `{ once: true }` for a one-time listener.

| Group | Events | Detail |
| --- | --- | --- |
| Grid | `gridClick`, `gridMouseOver` | `{ columnId, rowId, column, row, events }` |
| Crosshair | `gridCrosshairMouseOver` | Grid detail |
| Column histogram | `columnHistogramClick`, `columnHistogramMouseOver` | `{ axis, item, type, count }` |
| Row histogram | `rowHistogramClick`, `rowHistogramMouseOver` | `{ axis, item, rowId, type, count }` |
| Column tracks | `columnTrackClick`, `columnTrackMouseOver` | `{ axis, item }` |
| Row tracks | `rowTrackClick`, `rowTrackMouseOver` | `{ axis, item }` |
| Mouse-out | Corresponding `*MouseOut` event | Axis detail or no detail |
| Track controls | `trackLegendMouseOver`, `trackLegendMouseOut`, `addTrackClick` | Control-specific detail |

Render timing constants cover `render:all:*`, `render:mainGrid:*`, both histograms, and both track axes.
