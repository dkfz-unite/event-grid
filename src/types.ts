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
  [metadata: string]: unknown;
}

export type TrackValueGetter<TItem extends GridItem = GridItem> = (item: TItem) => unknown;
export type TrackField<TItem extends GridItem = GridItem> = string | TrackValueGetter<TItem>;

export interface TrackDefinition<TItem extends GridItem = GridItem> {
  id: GridId;
  label: string;
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

export interface CellPayload<
  TColumn extends GridItem = GridItem,
  TRow extends GridItem = GridItem,
  TEvent extends GridEvent = GridEvent
> {
  columnId: GridId;
  rowId: GridId;
  column: TColumn;
  row: TRow;
  events: TEvent[];
}

export interface ColumnHistogramPayload<TColumn extends GridItem = GridItem> {
  axis: 'column';
  item: TColumn;
  type: string;
  count: number;
}

export interface TrackPayload<
  TAxis extends Axis = Axis,
  TItem extends GridItem = GridItem
> {
  axis: TAxis;
  item: TrackItemPayload<TItem>;
}

export interface RowHistogramPayload<TRow extends GridItem = GridItem> {
  axis: 'row';
  item: TRow;
  rowId: GridId;
  type: string;
  count: number;
}

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
  summaryEventTypes?: string[];
  rowHistogramWidth?: number;
  histogramBorderPadding?: { left?: number; bottom?: number };
  columnTracks?: Array<TrackDefinition<TColumn>>;
  rowTracks?: Array<TrackDefinition<TRow>>;
  trackHeight?: number;
  trackPadding?: number;
}

export interface EventGridEventMap<
  TColumn extends GridItem = GridItem,
  TRow extends GridItem = GridItem,
  TEvent extends GridEvent = GridEvent
> {
  [EVENT_GRID_EVENTS.gridClick]: CellPayload<TColumn, TRow, TEvent>;
  [EVENT_GRID_EVENTS.gridMouseOver]: CellPayload<TColumn, TRow, TEvent>;
  [EVENT_GRID_EVENTS.gridMouseOut]: void;
  [EVENT_GRID_EVENTS.gridCrosshairMouseOver]: CellPayload<TColumn, TRow, TEvent>;
  [EVENT_GRID_EVENTS.gridCrosshairMouseOut]: void;
  [EVENT_GRID_EVENTS.columnHistogramClick]: ColumnHistogramPayload<TColumn>;
  [EVENT_GRID_EVENTS.columnHistogramMouseOver]: ColumnHistogramPayload<TColumn>;
  [EVENT_GRID_EVENTS.columnHistogramMouseOut]: { axis: 'column' };
  [EVENT_GRID_EVENTS.rowHistogramClick]: RowHistogramPayload<TRow>;
  [EVENT_GRID_EVENTS.rowHistogramMouseOver]: RowHistogramPayload<TRow>;
  [EVENT_GRID_EVENTS.rowHistogramMouseOut]: { axis: 'row' };
  [EVENT_GRID_EVENTS.columnTrackClick]: TrackPayload<'column', TColumn>;
  [EVENT_GRID_EVENTS.columnTrackMouseOver]: TrackPayload<'column', TColumn>;
  [EVENT_GRID_EVENTS.columnTrackMouseOut]: { axis: 'column' };
  [EVENT_GRID_EVENTS.rowTrackClick]: TrackPayload<'row', TRow>;
  [EVENT_GRID_EVENTS.rowTrackMouseOver]: TrackPayload<'row', TRow>;
  [EVENT_GRID_EVENTS.rowTrackMouseOut]: { axis: 'row' };
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
