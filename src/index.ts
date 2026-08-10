import RuntimeEventGrid from './event-grid';
import {
  Axis,
  CellPayload,
  EventStacking,
  GridEvent,
  GridId,
  GridItem,
  ColumnHistogramPayload,
  EventGridEventMap,
  EventGridOptions,
  RowHistogramPayload,
  TrackDefinition,
  TrackItemPayload,
  TrackPayload
} from './types';

class EventGrid<
  TColumn extends GridItem = GridItem,
  TRow extends GridItem = GridItem,
  TEvent extends GridEvent = GridEvent
> extends RuntimeEventGrid<TColumn, TRow, TEvent> {
  constructor(options: EventGridOptions<TColumn, TRow, TEvent> = {}) {
    super(options);
  }
}

namespace EventGrid {
  export type Id = GridId;
  export type Item = GridItem;
  export type Event = GridEvent;
  export type Stacking = EventStacking;
  export type GridAxis = Axis;
  export type Options<TColumn extends GridItem = GridItem, TRow extends GridItem = GridItem, TEvent extends GridEvent = GridEvent> = EventGridOptions<TColumn, TRow, TEvent>;
  export type Events<TColumn extends GridItem = GridItem, TRow extends GridItem = GridItem, TEvent extends GridEvent = GridEvent> = EventGridEventMap<TColumn, TRow, TEvent>;
  export type Cell<TColumn extends GridItem = GridItem, TRow extends GridItem = GridItem, TEvent extends GridEvent = GridEvent> = CellPayload<TColumn, TRow, TEvent>;
  export type ColumnHistogram<TColumn extends GridItem = GridItem> = ColumnHistogramPayload<TColumn>;
  export type RowHistogram<TRow extends GridItem = GridItem> = RowHistogramPayload<TRow>;
  export type Track = TrackDefinition;
  export type TrackItem = TrackItemPayload;
  export type TrackEvent<TAxis extends Axis = Axis> = TrackPayload<TAxis>;
}

export default EventGrid;
