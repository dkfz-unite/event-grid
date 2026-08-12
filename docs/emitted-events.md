# Emitted events

Data events in `configuration.events` describe matrix observations. This page covers browser events emitted by EventGrid.

EventGrid extends [`EventTarget`](https://developer.mozilla.org/docs/Web/API/EventTarget). Subscribe with `addEventListener()` and use names from `EventGrid.eventNames`.

```js
const handleGridClick = ({ detail: { element, data } }) => {
  console.log(element, data);
};

grid.addEventListener(EventGrid.eventNames.gridClick, handleGridClick);
grid.removeEventListener(EventGrid.eventNames.gridClick, handleGridClick);
```

Keep the function reference when a listener must later be removed.

## Handler structure

Handlers receive a native `CustomEvent`.

| Property | Meaning |
| --- | --- |
| `event.type` | Emitted event name |
| `event.detail` | Payload documented below |
| `event.target` | EventGrid instance |
| `event.currentTarget` | EventGrid instance while the listener runs |

Click and mouse-over payloads use one structure:

```ts
interface Interaction<TData, TElement extends Element = Element> {
  element: TElement;
  data: TData;
}
```

`detail.element` is the actual SVG path or rectangle that caused the interaction. `event.target` remains the EventGrid instance because it dispatches the `CustomEvent`.

### Tooltip example

```js
grid.addEventListener(EventGrid.eventNames.gridMouseOver, ({ detail }) => {
  const { element, data } = detail;
  const bounds = element.getBoundingClientRect();

  tooltip.textContent = `${data.type}: ${data.id}`;
  tooltip.style.left = `${bounds.right + 8}px`;
  tooltip.style.top = `${bounds.top}px`;
});
```

No separate listener on the grid's host element is required.

## Listener options

Native listener options work unchanged. `{ once: true }` removes the listener automatically after its first call:

```js
grid.addEventListener(
  EventGrid.eventNames.gridClick,
  (event) => console.log('First click only', event.detail),
  { once: true }
);
```

## Grid events

| Constant | `detail` |
| --- | --- |
| `gridClick`, `gridMouseOver` | `{ element: SVGPathElement, data: event }` |
| `gridMouseOut` | `undefined` |

`data` is the exact data event represented by the path, including `id`, `columnId`, `rowId`, `type`, and custom fields. Each stacked segment emits its own event data. Empty cells do not emit these events.

```js
grid.addEventListener(EventGrid.eventNames.gridClick, ({ detail }) => {
  console.log(detail.data.columnId, detail.data.rowId, detail.data.type);
});
```

## Crosshair events

| Constant | `detail` |
| --- | --- |
| `gridCrosshairMouseOver` | `{ element: SVGElement, data: { columnId, rowId, events } }` |
| `gridCrosshairMouseOut` | `undefined` |

Crosshair mode covers empty cells, so its compact cell data contains an `events` array. `element` is the SVG element currently under the pointer. Regular `gridMouseOver` is suppressed while crosshair mode is active.

## Histogram events

| Constants | `detail` |
| --- | --- |
| `columnHistogramClick`, `columnHistogramMouseOver` | `{ element, data: { axis: 'column', itemId, type, count } }` |
| `columnHistogramMouseOut` | `{ axis: 'column' }` |
| `rowHistogramClick`, `rowHistogramMouseOver` | `{ element, data: { axis: 'row', itemId, type, count } }` |
| `rowHistogramMouseOut` | `{ axis: 'row' }` |

`element` is the colored `SVGRectElement`. `itemId` identifies its column or row, `type` identifies the event-type segment, and `count` is that segment's event count.

```js
grid.addEventListener(EventGrid.eventNames.columnHistogramClick, ({ detail }) => {
  console.log(detail.element, detail.data.itemId, detail.data.type, detail.data.count);
});
```

## Track events

| Constants | `detail` |
| --- | --- |
| `columnTrackClick`, `columnTrackMouseOver` | `{ element, data: { axis: 'column', itemId, trackId, value } }` |
| `columnTrackMouseOut` | `{ axis: 'column' }` |
| `rowTrackClick`, `rowTrackMouseOver` | `{ element, data: { axis: 'row', itemId, trackId, value } }` |
| `rowTrackMouseOut` | `{ axis: 'row' }` |

`element` is the track cell's `SVGRectElement`. `itemId` identifies its column or row, `trackId` identifies the track, and `value` is the raw field value.

```js
grid.addEventListener(EventGrid.eventNames.rowTrackMouseOver, ({ detail }) => {
  console.log(detail.element, detail.data.trackId, detail.data.value);
});
```

## Render lifecycle events

Lifecycle events have `undefined` detail. Each `render()` call emits these pairs.

| Scope | Start constant | End constant |
| --- | --- | --- |
| Complete render | `renderAllStart` | `renderAllEnd` |
| Main grid | `renderMainGridStart` | `renderMainGridEnd` |
| Column histogram | `renderColumnHistogramStart` | `renderColumnHistogramEnd` |
| Row histogram | `renderRowHistogramStart` | `renderRowHistogramEnd` |
| Column tracks | `renderColumnTrackStart` | `renderColumnTrackEnd` |
| Row tracks | `renderRowTrackStart` | `renderRowTrackEnd` |

```js
grid.addEventListener(EventGrid.eventNames.renderAllEnd, () => {
  console.log('EventGrid render complete');
});
```

## TypeScript handlers

The selected event-name constant determines `event.detail` automatically:

```ts
grid.addEventListener(EventGrid.eventNames.gridClick, ({ detail }) => {
  detail.element.getBoundingClientRect();
  detail.data.type;
});

const listener = (event: CustomEvent<EventGrid.GridInteraction<MyEvent>>) => {
  console.log(event.detail.data);
};

grid.addEventListener(EventGrid.eventNames.gridClick, listener);
grid.removeEventListener(EventGrid.eventNames.gridClick, listener);
```

See [Data: TypeScript](data.md#typescript) for custom data types.
