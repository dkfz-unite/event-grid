# TypeScript

EventGrid publishes declarations with its JavaScript. Consumers do not need TypeScript at runtime.

## Typed data

```ts
import EventGrid from '@dkfz-unite/event-grid';
import '@dkfz-unite/event-grid/style.css';

interface ProjectColumn extends EventGrid.Item {
  owner: string;
}

interface ProjectRow extends EventGrid.Item {
  priority: number;
}

interface ProjectEvent extends EventGrid.Event {
  note?: string;
}

const grid = new EventGrid<ProjectColumn, ProjectRow, ProjectEvent>({
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
grid.addEventListener(EventGrid.eventNames.gridClick, ({ detail }) => {
  detail.column.owner;
  detail.row.priority;
  detail.events[0].note;
});

grid.addEventListener(
  EventGrid.eventNames.columnHistogramClick,
  ({ detail }) => {
    detail.item.owner;
    detail.type;
    detail.count;
  }
);
```

Use the native listener options and removal API:

```ts
const listener = (event: CustomEvent<EventGrid.Cell<
  ProjectColumn,
  ProjectRow,
  ProjectEvent
>>) => console.log(event.detail);

grid.addEventListener(EventGrid.eventNames.gridClick, listener, { once: true });
grid.removeEventListener(EventGrid.eventNames.gridClick, listener);
```

## Public types

The default export namespace includes:

- `Item`, `Event`, `Id`, and `Stacking`;
- `Options` and `Events`;
- `Cell`, `ColumnHistogram`, and `RowHistogram`;
- `Track`, `TrackItem`, and `TrackEvent`.

The library source is strict TypeScript. D3 v7 and its type definitions are used internally and bundled into the published builds.
