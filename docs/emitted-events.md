# Emitted events

Data events in `configuration.events` describe matrix observations. This page covers interaction and render events emitted by the component.

EventGrid extends the browser's [`EventTarget`](https://developer.mozilla.org/docs/Web/API/EventTarget). Subscribe with `addEventListener()` and use constants from `EventGrid.eventNames`.

```js
const handleGridClick = (event) => {
  const { column, row, events } = event.detail;
  console.log(column, row, events);
};

grid.addEventListener(EventGrid.eventNames.gridClick, handleGridClick);
grid.removeEventListener(EventGrid.eventNames.gridClick, handleGridClick);
```

Keep the function reference when a listener must later be removed.

## The handler event

Handlers receive a native `CustomEvent`.

| Property | Meaning |
| --- | --- |
| `event.type` | Emitted event name |
| `event.detail` | EventGrid payload documented below |
| `event.target` | The EventGrid instance |
| `event.currentTarget` | The EventGrid instance while the listener runs |

`event.target` is not the SVG element that was clicked or hovered because EventGrid dispatches the `CustomEvent` from its own instance.

### Using a rendered element for a tooltip

Use the emitted event for data and a delegated DOM listener on the host when the tooltip also needs the actual rendered element or pointer coordinates:

```js
const host = document.querySelector('#grid');

host.addEventListener('pointermove', (event) => {
  if (!(event.target instanceof Element)) return;

  const element = event.target.closest(
    '.eg-event, .eg-summary-bar, .eg-track-data'
  );
  if (!element || !host.contains(element)) return;

  const bounds = element.getBoundingClientRect();
  tooltip.style.left = `${bounds.right + 8}px`;
  tooltip.style.top = `${bounds.top}px`;
});

grid.addEventListener(EventGrid.eventNames.gridMouseOver, ({ detail }) => {
  tooltip.textContent = `${detail.row.label} / ${detail.column.label}`;
});
```

Grid event elements also expose `data-column-id`, `data-row-id`, and `data-event-type` attributes. Histogram segments expose the corresponding axis identifier, event type, and count. Track cells expose `data-track-id`.

## Listener options

Native listener options work unchanged. `{ once: true }` asks the browser to remove the listener automatically after its first call:

```js
grid.addEventListener(
  EventGrid.eventNames.gridClick,
  (event) => console.log('First click only', event.detail),
  { once: true }
);
```

Other standard options accepted by `EventTarget` may also be passed.

## Grid and crosshair events

| Constant | Detail |
| --- | --- |
| `EventGrid.eventNames.gridClick` | cell payload |
| `EventGrid.eventNames.gridMouseOver` | cell payload |
| `EventGrid.eventNames.gridMouseOut` | `undefined` |
| `EventGrid.eventNames.gridCrosshairMouseOver` | cell payload |
| `EventGrid.eventNames.gridCrosshairMouseOut` | `undefined` |

A cell payload is:

```ts
interface CellPayload<TColumn, TRow, TEvent> {
  columnId: string | number;
  rowId: string | number;
  column: TColumn;
  row: TRow;
  events: TEvent[];
}
```

`events` contains every data event in the cell.

`gridClick` and `gridMouseOver` originate from rendered event segments, so empty cells do not emit them. When crosshair mode is active, `gridCrosshairMouseOver` reports every cell under the pointer, including empty cells whose `events` array is empty; regular `gridMouseOver` is suppressed.

## Histogram events

Click and mouse-over events on the same axis share a payload.

| Constants | Detail |
| --- | --- |
| `columnHistogramClick`, `columnHistogramMouseOver` | `{ axis: 'column', item, type, count }` |
| `columnHistogramMouseOut` | `{ axis: 'column' }` |
| `rowHistogramClick`, `rowHistogramMouseOver` | `{ axis: 'row', item, rowId, type, count }` |
| `rowHistogramMouseOut` | `{ axis: 'row' }` |

Access these names through `EventGrid.eventNames`, for example:

```js
grid.addEventListener(
  EventGrid.eventNames.columnHistogramClick,
  ({ detail }) => {
    console.log(detail.item, detail.type, detail.count);
  }
);
```

`item` is the full column or row object. `type` is the colored event-type segment, and `count` is that segment's event count.

## Track events

| Constants | Detail |
| --- | --- |
| `columnTrackClick`, `columnTrackMouseOver` | `{ axis: 'column', item }` |
| `columnTrackMouseOut` | `{ axis: 'column' }` |
| `rowTrackClick`, `rowTrackMouseOver` | `{ axis: 'row', item }` |
| `rowTrackMouseOut` | `{ axis: 'row' }` |

The track `item` contains the row or column `id` and `label`, plus `value`, `valueLabel`, `trackId`, `trackLabel`, `field`, and optional `type`. See [Track colors and opacity](data.md#track-colors-and-opacity) for field meanings.

```js
grid.addEventListener(EventGrid.eventNames.rowTrackMouseOver, ({ detail }) => {
  console.log(detail.axis, detail.item.trackLabel, detail.item.valueLabel);
});
```

## Render lifecycle events

Lifecycle events have `undefined` detail. Each `render()` call emits these start/end pairs.

| Scope | Start constant | End constant |
| --- | --- | --- |
| Complete render | `renderAllStart` | `renderAllEnd` |
| Main grid | `renderMainGridStart` | `renderMainGridEnd` |
| Column histogram | `renderColumnHistogramStart` | `renderColumnHistogramEnd` |
| Row histogram | `renderRowHistogramStart` | `renderRowHistogramEnd` |
| Column tracks | `renderColumnTrackStart` | `renderColumnTrackEnd` |
| Row tracks | `renderRowTrackStart` | `renderRowTrackEnd` |

Use the constants through `EventGrid.eventNames`:

```js
grid.addEventListener(EventGrid.eventNames.renderAllEnd, () => {
  console.log('EventGrid render complete');
});

grid.render();
```

## TypeScript handlers

The selected event-name constant determines the type of `event.detail`:

```ts
grid.addEventListener(EventGrid.eventNames.gridClick, ({ detail }) => {
  detail.column;
  detail.row;
  detail.events;
});

const listener = (event: CustomEvent<EventGrid.Cell>) => {
  console.log(event.detail.events);
};

grid.addEventListener(EventGrid.eventNames.gridClick, listener);
grid.removeEventListener(EventGrid.eventNames.gridClick, listener);
```

Generic column, row, and data-event types flow into these payloads as shown in [Data: TypeScript](data.md#typescript).
