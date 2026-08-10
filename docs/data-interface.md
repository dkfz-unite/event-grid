# Data interface

EventGrid accepts `columns`, `rows`, and `events`. It assigns no business meaning to them.

## Example

```ts
const columns = [
  { id: 'c1', label: 'Alpha', owner: 'Avery' },
  { id: 'c2', label: 'Beta', owner: 'Blake' }
];

const rows = [
  { id: 'r1', label: 'Planning', priority: 2 },
  { id: 'r2', label: 'Build', priority: 1 }
];

const events = [
  { id: 'e1', columnId: 'c1', rowId: 'r1', type: 'complete' },
  { id: 'e2', columnId: 'c1', rowId: 'r2', type: 'active' },
  { id: 'e3', columnId: 'c2', rowId: 'r2', type: 'blocked' }
];

const grid = new EventGrid({ columns, rows, events });
```

## Schema

### Columns and rows

| Field | Required | Description |
| --- | --- | --- |
| `id` | yes | Unique `string \| number`; used by event references |
| `label` | no | Display text; defaults to `id` |
| any other field | no | Application metadata, available to tracks and callbacks |

Input items are cloned. Internal position and summary fields do not modify the caller's objects.

### Events

| Field | Required | Description |
| --- | --- | --- |
| `id` | yes | Unique event identifier |
| `columnId` | yes | Matching column `id` |
| `rowId` | yes | Matching row `id` |
| `type` | yes | Application-defined category and color key |
| any other field | no | Metadata returned in interaction details |

Validate references before constructing the grid. An unmatched event cannot be positioned.

## Multiple events per cell

Events sharing `columnId` and `rowId` occupy equal segments:

```ts
eventStacking: 'v' // default: vertically stacked
eventStacking: 'h' // horizontally arranged
```

Interaction details return every event in the cell.

## Frequency ordering

Enable the original waterfall-like ordering when constructing the grid:

```ts
const grid = new EventGrid({
  columns,
  rows,
  events,
  sortByFrequency: true
});
```

Rows with events in the most columns appear first. Multiple events in one cell count once. Columns are then ordered by event presence from the first row downward, placing occupied cells toward the upper left. `reload()` restores this configured ordering; `cluster()` applies it on demand.

## Histograms and colors

Both histograms show total frequency and colored type proportions. `summaryEventTypes` filters and orders their segments.

```ts
const grid = new EventGrid({
  columns,
  rows,
  events,
  summaryEventTypes: ['complete', 'active', 'blocked'],
  colorPalette: ['#0072b2', '#e69f00', '#009e73'],
  colorMap: { blocked: '#d55e00' }
});
```

Colors are assigned by first type appearance and cycle when the palette is exhausted. Cells and both histograms use the same `grid.colorMap`.

## Metadata tracks

Tracks read fields from their corresponding item:

```ts
columnTracks: [{
  name: 'Owner',
  fieldName: 'owner',
  type: 'text',
  group: 'Details',
  sort: (fieldName) => (a, b) =>
    String(a[fieldName]).localeCompare(String(b[fieldName]))
}]
```

Use column or row fill and opacity callbacks to style track cells. Callback data includes `id`, `label`, `value`, `valueLabel`, `trackLabel`, `fieldName`, and `type`.

## Interaction detail

```ts
grid.addEventListener(EventGrid.eventNames.gridClick, ({ detail }) => {
  detail.columnId;
  detail.rowId;
  detail.column;
  detail.row;
  detail.events;
});
```

See the [API event table](api.md#native-events) and [TypeScript guide](typescript.md).
