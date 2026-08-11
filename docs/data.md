# Data

EventGrid uses five data collections: `columns`, `columnTracks`, `rows`, `rowTracks`, and `events`. The component assigns no business meaning to them.

## JavaScript example

```js
const columns = [
  {
    id: 'c1',
    label: 'Alpha',
    metadata: { owner: 'Avery', score: 8 }
  },
  {
    id: 'c2',
    label: 'Beta',
    metadata: { owner: 'Blake', score: 3 }
  }
];

const rows = [
  { id: 'r1', label: 'Planning', priority: 2 },
  { id: 'r2', label: 'Build', priority: 1 }
];

const events = [
  { id: 'e1', columnId: 'c1', rowId: 'r1', type: 'complete' },
  { id: 'e2', columnId: 'c1', rowId: 'r2', type: 'active' },
  { id: 'e3', columnId: 'c1', rowId: 'r2', type: 'blocked' },
  { id: 'e4', columnId: 'c2', rowId: 'r2', type: 'active' }
];

const columnTracks = [{
  id: 'owner',
  label: 'Owner',
  field: (column) => column.metadata.owner,
  colorPalette: ['#0072b2', '#e69f00', '#009e73'],
  group: 'Details',
  sort: (getValue) => (a, b) =>
    String(getValue(a)).localeCompare(String(getValue(b)))
}];

const rowTracks = [{
  id: 'priority',
  label: 'Priority',
  field: 'priority',
  fill: '#6d72c5',
  group: 'Details',
  sort: (getValue) => (a, b) =>
    Number(getValue(a)) - Number(getValue(b))
}];

const grid = new EventGrid({
  element: '#grid',
  columns,
  columnTracks,
  rows,
  rowTracks,
  events
});

grid.render();
```

Input collections are deep-cloned. Layout and summary fields added internally do not modify the caller's objects.

## Columns and rows

Columns and rows have the same base shape.

```ts
interface GridItem {
  id: string | number;
  label?: string;
  [metadata: string]: unknown;
}
```

| Field | Required | Meaning |
| --- | --- | --- |
| `id` | yes | Unique identifier used by event references |
| `label` | no | Display text; the identifier is used when omitted |
| other fields | no | Application metadata available to tracks and emitted-event payloads |

Identifiers may be strings or numbers. EventGrid compares their string forms, so a numeric ID and its string equivalent—such as `1` and `'1'`—refer to the same item and must not both be used.

## Events

An event joins one column and one row. Its `type` controls its categorical color.

```ts
interface GridEvent {
  id: string | number;
  columnId: string | number;
  rowId: string | number;
  type: string;
  [metadata: string]: unknown;
}
```

| Field | Required | Meaning |
| --- | --- | --- |
| `id` | yes | Unique event identifier |
| `columnId` | yes | Identifier of an existing column |
| `rowId` | yes | Identifier of an existing row |
| `type` | yes | Application-defined category and color key |
| other fields | no | Metadata returned with cell interactions |

References are not inferred from labels or metadata. Validate that every event references an existing column and row.

### Multiple events in a cell

Events with the same `columnId` and `rowId` share a cell in equal segments:

```js
const vertical = { eventStacking: 'v' };   // default
const horizontal = { eventStacking: 'h' };
```

Cell interaction payloads return all events in that cell. In heat-map mode the cell instead uses one color whose darkness increases with the number of events.

### Frequency ordering

```js
const grid = new EventGrid({
  columns,
  rows,
  events,
  sortByFrequency: true
});
```

Rows occupying the most columns appear first. Multiple events in the same cell count as one occupied column. Columns are then ordered by event presence from the first row downward, producing the upper-left waterfall pattern. `grid.reload()` restores this configured order; `grid.cluster()` applies it at runtime.

Without `sortByFrequency`, EventGrid preserves input row order and orders columns from that row sequence. A user can also drag row labels to reorder rows; the column order is recalculated after the drop.

## Metadata tracks

A column track reads a field from each column. A row track reads a field from each row.

```ts
type TrackValueGetter<TItem extends GridItem = GridItem> = (item: TItem) => unknown;
type TrackField<TItem extends GridItem = GridItem> = string | TrackValueGetter<TItem>;

interface TrackDefinition<TItem extends GridItem = GridItem> {
  id: string | number;
  label: string;
  field: TrackField<TItem>;
  fill?: string;
  opacityFunction?: (data: TrackItemPayload<TItem>) => number;
  colorPalette?: string[];
  colorMap?: Record<string, string>;
  type?: string;
  group?: string;
  sort?: (
    getValue: TrackValueGetter<TItem>
  ) => (a: TItem, b: TItem) => number;
}
```

| Field | Required | Meaning |
| --- | --- | --- |
| `id` | yes | Stable track identifier used for identity and generated selectors |
| `label` | yes | Visible track label |
| `field` | yes | Direct property name or value-getter function |
| `fill` | no | One color for values not overridden by `colorMap` |
| `opacityFunction` | no | Custom opacity callback for this track |
| `colorPalette` | no | Palette assigned to unique values in first-seen order |
| `colorMap` | no | Color overrides keyed by stringified track value |
| `type` | no | Set to `'number'` to force numeric opacity; also included in interaction payloads |
| `group` | no | Shared group label; defaults to `Tracks` |
| `sort` | no | Factory returning the comparator used when the track label is clicked |

Track IDs must be unique within a group. Tracks with the same `group` share a group label. To change visible tracks, construct and render a grid with the required `columnTracks` and `rowTracks` collections.

### Track fields

Use a string for a direct property:

```js
{
  id: 'priority',
  label: 'Priority',
  field: 'priority'
}
```

Use a getter for nested data, computed values, or strongly typed metadata objects:

```js
{
  id: 'custom-field',
  label: 'Custom field',
  field: (entry) => entry.metadata.customField
}
```

The getter receives the complete column or row object. EventGrid stores its return value as the track cell's `value`.

### Track sorting

The `sort` function receives a normalized getter and returns a standard array comparator. EventGrid creates that getter from either supported `field` form:

```js
const numericTrack = {
  id: 'score',
  label: 'Score',
  field: (entry) => entry.metadata.score,
  sort: (getValue) => (a, b) =>
    Number(getValue(b)) - Number(getValue(a))
};
```

Clicking that track's label sorts its corresponding axis. Row sorting also recalculates the column order from the new row sequence.

### Track colors and opacity

Styling belongs to each track rather than the global grid configuration.

#### Defaults

EventGrid determines whether a track is numeric from its available values. Finite numbers and numeric strings such as `'12.5'` are numeric. `type: 'number'` forces numeric handling.

| Track values | Fill | Opacity |
| --- | --- | --- |
| Numeric | `#6d72c5` | Linear scale from `0.2` at the minimum to `1` at the maximum |
| Other values | Built-in 20-color palette, one color per unique value | `1` |

Equal numeric values use opacity `1`. `null` and invalid numeric values use opacity `0.2`. A `null` value is displayed as `Not available` and excluded from numeric range calculations. Zero and negative numbers remain ordinary numeric values.

#### One fill with custom opacity

```js
const scoreTrack = {
  id: 'score',
  label: 'Score',
  field: (entry) => entry.metadata.score,
  fill: '#2166ac',
  opacityFunction: ({ value }) => Number(value) >= 10 ? 1 : 0.35
};
```

`opacityFunction` receives the same payload as track interaction and returns a number from `0` to `1`. Values outside that range are clamped.

#### Palette and map

```js
const statusTrack = {
  id: 'status',
  label: 'Status',
  field: (entry) => entry.metadata.status,
  colorPalette: ['#0072b2', '#e69f00', '#009e73'],
  colorMap: {
    blocked: '#d55e00'
  }
};
```

Unique values receive palette colors in first-appearance order, cycling when necessary. `colorMap` overrides its named values. Map keys are the string form of the track value.

Color precedence is:

1. A matching `colorMap` entry.
2. The track's fixed `fill`, when supplied.
3. A supplied `colorPalette`.
4. Numeric default fill or categorical default palette.

Supplying `colorPalette` opts even a numeric track into per-value colors; its automatic numeric opacity still applies. A non-empty `fill` takes precedence over the palette for values not in `colorMap`.

#### Callback payload

The opacity callback and track interaction events receive:

```ts
interface TrackItemPayload {
  id: string | number;
  label: string;
  value: unknown;
  valueLabel: unknown;
  trackId: string | number;
  trackLabel: string;
  field: string | ((entry: GridItem) => unknown);
  type?: string;
}
```

| Property | Meaning |
| --- | --- |
| `id`, `label` | Current column or row identity |
| `value` | Raw value returned by the track field |
| `valueLabel` | Display value, or `Not available` when `value` is `null` |
| `trackId`, `trackLabel` | Track `id` and `label` |
| `field`, `type` | Values from the track definition |

## Event colors and summaries

The built-in palette contains 20 distinct colors. Event types receive colors in first-appearance order. If there are more types than colors, assignment cycles back to the start of the palette.

```js
const grid = new EventGrid({
  columns,
  rows,
  events,
  colorPalette: ['#0072b2', '#e69f00', '#009e73'],
  colorMap: {
    blocked: '#d55e00'
  },
  summaryEventTypes: ['blocked', 'active', 'complete']
});
```

The options combine as follows:

1. A non-empty `colorPalette` replaces the default palette.
2. Each encountered event type receives the next palette color, cycling when necessary.
3. `colorMap` overrides only its named types; all other types keep palette colors.

The resolved map is available as `grid.colorMap`; a copy of the built-in palette is available as `EventGrid.defaultColorPalette`.

`summaryEventTypes` selects the event types included in both histograms and controls their stack order. It does not hide events from grid cells or change `grid.colorMap`. When omitted, all encountered event types are summarized in first-appearance order. Each event contributes to a histogram count, so two events in one cell count twice there.

## TypeScript

The package includes declarations. JavaScript consumers do not need TypeScript.

```ts
interface ProjectColumn extends EventGrid.Item {
  metadata: {
    owner: string;
    score: number;
  };
}

interface ProjectRow extends EventGrid.Item {
  priority: number;
}

interface ProjectEvent extends EventGrid.Event {
  note?: string;
}

const configuration: EventGrid.Options<
  ProjectColumn,
  ProjectRow,
  ProjectEvent
> = {
  columns: [{
    id: 'c1',
    metadata: { owner: 'Avery', score: 8 }
  }],
  rows: [{ id: 'r1', priority: 1 }],
  events: [{
    id: 'e1',
    columnId: 'c1',
    rowId: 'r1',
    type: 'active',
    note: 'Typed metadata'
  }],
  columnTracks: [{
    id: 'owner',
    label: 'Owner',
    field: (column) => column.metadata.owner,
    colorPalette: ['#0072b2', '#e69f00'],
    sort: (getValue) => (a, b) =>
      String(getValue(a)).localeCompare(String(getValue(b)))
  }]
};

const grid = new EventGrid<ProjectColumn, ProjectRow, ProjectEvent>(configuration);
```

Public types include `EventGrid.Id`, `Item`, `Event`, `Stacking`, `GridAxis`, `Options`, `Events`, `Cell`, `ColumnHistogram`, `RowHistogram`, `Track`, `TrackField`, `TrackValueGetter`, `TrackItem`, and `TrackEvent`.
