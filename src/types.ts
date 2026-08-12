import { EVENT_GRID_EVENTS } from './event-names';

export type GridId = string | number;
export type Axis = 'column' | 'row';
export type EventStacking = 'h' | 'v';

export interface GridItem {
  id: GridId;
  label?: string;
  [metadata: string]: unknown;
}

export interface GridEvent {
  id: GridId;
  columnId: GridId;
  rowId: GridId;
  type: string;
  label?: string;
  [metadata: string]: unknown;
}

export type TrackValueGetter<TItem extends GridItem = GridItem> = (item: TItem) => unknown;
export type TrackField<TItem extends GridItem = GridItem> = string | TrackValueGetter<TItem>;

export interface TrackDefinition<TItem extends GridItem = GridItem> {
  id: GridId;
  label?: string;
  field: TrackField<TItem>;
  fill?: string;
  opacityFunction?: (data: TrackItemPayload<TItem>) => number;
  colorPalette?: string[];
  colorMap?: Record<string, string>;
  type?: string;
  group?: string;
  sort?: (getValue: TrackValueGetter<TItem>) => (a: TItem, b: TItem) => number;
}

export interface TrackItemPayload<TItem extends GridItem = GridItem> {
  id: GridId;
  label: string;
  value: unknown;
  valueLabel: unknown;
  trackId: GridId;
  trackLabel: string;
  field: TrackField<TItem>;
  type?: string;
}

export interface ElementInteraction<TData, TElement extends Element = Element> {
  element: TElement;
  data: TData;
}

export type GridInteractionPayload<TEvent extends GridEvent = GridEvent> =
  ElementInteraction<TEvent, SVGPathElement>;

export interface CrosshairCellData<TEvent extends GridEvent = GridEvent> {
  columnId: GridId;
  rowId: GridId;
  events: TEvent[];
}

export type CrosshairInteractionPayload<TEvent extends GridEvent = GridEvent> =
  ElementInteraction<CrosshairCellData<TEvent>, SVGElement>;

export interface ColumnHistogramCellData {
  columnId: GridId;
  type: string;
  label: string;
  count: number;
}

export interface RowHistogramCellData {
  rowId: GridId;
  type: string;
  label: string;
  count: number;
}

export type HistogramCellData<TAxis extends Axis = Axis> = TAxis extends 'column'
  ? ColumnHistogramCellData
  : RowHistogramCellData;

export type HistogramInteractionPayload<TAxis extends Axis = Axis> =
  ElementInteraction<HistogramCellData<TAxis>, SVGRectElement>;

export interface ColumnTrackCellData {
  columnId: GridId;
  id: GridId;
  label: string;
  value: unknown;
}

export interface RowTrackCellData {
  rowId: GridId;
  id: GridId;
  label: string;
  value: unknown;
}

export type TrackCellData<TAxis extends Axis = Axis> = TAxis extends 'column'
  ? ColumnTrackCellData
  : RowTrackCellData;

export type TrackInteractionPayload<TAxis extends Axis = Axis> =
  ElementInteraction<TrackCellData<TAxis>, SVGRectElement>;

export interface EventGridOptions<
  TColumn extends GridItem = GridItem,
  TRow extends GridItem = GridItem,
  TEvent extends GridEvent = GridEvent
> {
  element?: string | HTMLElement;
  columns?: TColumn[];
  rows?: TRow[];
  events?: TEvent[];
  sortByFrequency?: boolean;
  width?: number;
  height?: number;
  minCellHeight?: number;
  prefix?: string;
  margin?: { top: number; right: number; bottom: number; left: number };
  scaleToFit?: boolean;
  leftTextWidth?: number;
  grid?: boolean;
  heatMap?: boolean;
  heatMapColor?: string;
  eventStacking?: EventStacking;
  colorPalette?: string[];
  colorMap?: Record<string, string>;
  legend?: boolean;
  summaryEventTypes?: string[];
  rowHistogramWidth?: number;
  histogramBorderPadding?: { left?: number; bottom?: number };
  columnTracks?: Array<TrackDefinition<TColumn>>;
  rowTracks?: Array<TrackDefinition<TRow>>;
  trackHeight?: number;
  trackPadding?: number;
}

export interface EventGridEventMap<TEvent extends GridEvent = GridEvent> {
  [EVENT_GRID_EVENTS.gridClick]: GridInteractionPayload<TEvent>;
  [EVENT_GRID_EVENTS.gridMouseOver]: GridInteractionPayload<TEvent>;
  [EVENT_GRID_EVENTS.gridMouseOut]: void;
  [EVENT_GRID_EVENTS.gridCrosshairMouseOver]: CrosshairInteractionPayload<TEvent>;
  [EVENT_GRID_EVENTS.gridCrosshairMouseOut]: void;
  [EVENT_GRID_EVENTS.columnHistogramClick]: HistogramInteractionPayload<'column'>;
  [EVENT_GRID_EVENTS.columnHistogramMouseOver]: HistogramInteractionPayload<'column'>;
  [EVENT_GRID_EVENTS.columnHistogramMouseOut]: void;
  [EVENT_GRID_EVENTS.rowHistogramClick]: HistogramInteractionPayload<'row'>;
  [EVENT_GRID_EVENTS.rowHistogramMouseOver]: HistogramInteractionPayload<'row'>;
  [EVENT_GRID_EVENTS.rowHistogramMouseOut]: void;
  [EVENT_GRID_EVENTS.columnTrackClick]: TrackInteractionPayload<'column'>;
  [EVENT_GRID_EVENTS.columnTrackMouseOver]: TrackInteractionPayload<'column'>;
  [EVENT_GRID_EVENTS.columnTrackMouseOut]: void;
  [EVENT_GRID_EVENTS.rowTrackClick]: TrackInteractionPayload<'row'>;
  [EVENT_GRID_EVENTS.rowTrackMouseOver]: TrackInteractionPayload<'row'>;
  [EVENT_GRID_EVENTS.rowTrackMouseOut]: void;
  [EVENT_GRID_EVENTS.renderAllStart]: void;
  [EVENT_GRID_EVENTS.renderAllEnd]: void;
  [EVENT_GRID_EVENTS.renderMainGridStart]: void;
  [EVENT_GRID_EVENTS.renderMainGridEnd]: void;
  [EVENT_GRID_EVENTS.renderColumnHistogramStart]: void;
  [EVENT_GRID_EVENTS.renderColumnHistogramEnd]: void;
  [EVENT_GRID_EVENTS.renderRowHistogramStart]: void;
  [EVENT_GRID_EVENTS.renderRowHistogramEnd]: void;
  [EVENT_GRID_EVENTS.renderColumnTrackStart]: void;
  [EVENT_GRID_EVENTS.renderColumnTrackEnd]: void;
  [EVENT_GRID_EVENTS.renderRowTrackStart]: void;
  [EVENT_GRID_EVENTS.renderRowTrackEnd]: void;
}
