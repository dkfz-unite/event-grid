# TypeScript

OncoGrid publishes declarations with its JavaScript. Consumers do not need TypeScript at runtime.

## Typed data

```ts
import OncoGrid from '@dkfz-unite/oncogrid';
import '@dkfz-unite/oncogrid/style.css';

interface ProjectColumn extends OncoGrid.Item {
  owner: string;
}

interface ProjectRow extends OncoGrid.Item {
  priority: number;
}

interface ProjectEvent extends OncoGrid.Event {
  note?: string;
}

const grid = new OncoGrid<ProjectColumn, ProjectRow, ProjectEvent>({
  columns: [{ id: 'c1', owner: 'Avery' }],
  rows: [{ id: 'r1', priority: 1 }],
  events: [{
    id: 'e1',
    columnId: 'c1',
    rowId: 'r1',
    type: 'active',
    note: 'Typed metadata'
  }]
});
```

## Typed events

The event-name constant determines the type of `CustomEvent.detail`:

```ts
grid.addEventListener(OncoGrid.eventNames.gridClick, ({ detail }) => {
  detail.column.owner;
  detail.row.priority;
  detail.events[0].note;
});

grid.addEventListener(
  OncoGrid.eventNames.columnHistogramClick,
  ({ detail }) => {
    detail.item.owner;
    detail.type;
    detail.count;
  }
);
```

Use the native listener options and removal API:

```ts
const listener = (event: CustomEvent<OncoGrid.Cell<
  ProjectColumn,
  ProjectRow,
  ProjectEvent
>>) => console.log(event.detail);

grid.addEventListener(OncoGrid.eventNames.gridClick, listener, { once: true });
grid.removeEventListener(OncoGrid.eventNames.gridClick, listener);
```

## Public types

The default export namespace includes:

- `Item`, `Event`, `Id`, and `Stacking`;
- `Options` and `Events`;
- `Cell`, `ColumnHistogram`, and `RowHistogram`;
- `Track`, `TrackItem`, and `TrackEvent`.

The library source is strict TypeScript. D3 v3 remains behind an internal compatibility type boundary and is bundled into the published builds.
