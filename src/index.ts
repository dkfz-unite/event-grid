import RuntimeEventGrid from './event-grid';
import {
  Axis,
  CrosshairCellData,
  CrosshairInteractionPayload,
  ElementInteraction,
  EventStacking,
  GridEvent,
  GridId,
  GridItem,
  EventGridEventMap,
  EventGridOptions,
  GridInteractionPayload,
  HistogramCellData,
  HistogramInteractionPayload,
  TrackDefinition,
  TrackCellData,
  TrackField as TrackFieldType,
  TrackInteractionPayload,
  TrackItemPayload,
  TrackValueGetter as TrackValueGetterType
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
  export type Events<TEvent extends GridEvent = GridEvent> = EventGridEventMap<TEvent>;
  export type Interaction<TData, TElement extends Element = Element> = ElementInteraction<TData, TElement>;
  export type GridInteraction<TEvent extends GridEvent = GridEvent> = GridInteractionPayload<TEvent>;
  export type CrosshairCell<TEvent extends GridEvent = GridEvent> = CrosshairCellData<TEvent>;
  export type CrosshairInteraction<TEvent extends GridEvent = GridEvent> = CrosshairInteractionPayload<TEvent>;
  export type HistogramCell<TAxis extends Axis = Axis> = HistogramCellData<TAxis>;
  export type HistogramInteraction<TAxis extends Axis = Axis> = HistogramInteractionPayload<TAxis>;
  export type Track<TItem extends GridItem = GridItem> = TrackDefinition<TItem>;
  export type TrackField<TItem extends GridItem = GridItem> = TrackFieldType<TItem>;
  export type TrackValueGetter<TItem extends GridItem = GridItem> = TrackValueGetterType<TItem>;
  export type TrackItem<TItem extends GridItem = GridItem> = TrackItemPayload<TItem>;
  export type TrackCell<TAxis extends Axis = Axis> = TrackCellData<TAxis>;
  export type TrackInteraction<TAxis extends Axis = Axis> = TrackInteractionPayload<TAxis>;
}

export default EventGrid;
