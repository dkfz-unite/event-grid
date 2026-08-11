# Configuration

Pass one configuration object to the constructor, then call `render()` on the returned grid instance.

```js
const configuration = {
  // Host and data
  element: '#grid',
  columns,
  columnTracks,
  rows,
  rowTracks,
  events,

  // Event summaries and colors
  summaryEventTypes: ['active', 'complete', 'blocked'],
  colorPalette: ['#0072b2', '#e69f00', '#009e73'],
  colorMap: { blocked: '#d55e00' },
  heatMapColor: '#D33682',

  // Behavior
  sortByFrequency: false,
  eventStacking: 'v',
  grid: false,
  heatMap: false,

  // Layout
  width: 500,
  height: 500,
  minCellHeight: 10,
  scaleToFit: true,
  leftTextWidth: 80,
  margin: { top: 30, right: 100, bottom: 15, left: 80 },
  rowHistogramWidth: 80,
  histogramBorderPadding: { left: 10, bottom: 5 },
  trackHeight: 10,
  trackPadding: 20,
  prefix: 'eg-'
};

const grid = new EventGrid(configuration);
grid.render();
```

All properties are optional. The identifiers above refer to application data or callback functions defined before the configuration object.

## Data and tracks

| Path | Default | Purpose |
| --- | --- | --- |
| `configuration.element` | `'body'` | CSS selector or `HTMLElement` that receives the grid |
| `configuration.columns` | `[]` | Column items |
| `configuration.rows` | `[]` | Row items |
| `configuration.events` | `[]` | Events joining columns to rows |
| `configuration.columnTracks` | `[]` | Metadata tracks for columns |
| `configuration.rowTracks` | `[]` | Metadata tracks for rows |

See [Data](data.md) for schemas, tracks, callback functions, and TypeScript types.

## Events and colors

| Path | Default | Purpose |
| --- | --- | --- |
| `configuration.summaryEventTypes` | all event types | Event types included in the two histograms, in stack order |
| `configuration.colorPalette` | built-in 20-color palette | Colors assigned to event types |
| `configuration.colorMap` | `{}` | Explicit colors keyed by event type |
| `configuration.heatMapColor` | `'#D33682'` | Base color used in heat-map mode |

These properties control data-event rendering. They are unrelated to the interaction events emitted by the component. See [Data: Event colors and summaries](data.md#event-colors-and-summaries).

## Behavior

| Path | Default | Purpose |
| --- | --- | --- |
| `configuration.sortByFrequency` | `false` | When enabled, initially order rows by occupied-column frequency before ordering columns by the resulting row pattern |
| `configuration.eventStacking` | `'v'` | Arrange multiple cell events vertically (`'v'`) or horizontally (`'h'`) |
| `configuration.grid` | `false` | Initially show cell grid lines |
| `configuration.heatMap` | `false` | Initially render one heat-map cell whose shade darkens with its event count |

`reload()` restores these configured values. Runtime controls such as crosshair mode are [instance methods](methods.md), not constructor properties.

With the default `sortByFrequency: false`, input row order is retained and columns are ordered by event presence from that row sequence.

## Layout

Dimensions, margins, histogram spacing, track spacing, scaling, and the CSS prefix are listed in [Layout](layout.md).

## Configuration versus methods

Configuration describes the initial grid. Methods operate on the constructed instance:

```js
const grid = new EventGrid(configuration);
grid.render();

grid.setCrosshair(true);
grid.resize(900, 480);
grid.cluster();
```

See [Methods](methods.md) for every available operation.
