import { ONCOGRID_EVENTS } from './event-names';

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

export interface TrackDefinition<TItem extends GridItem = GridItem> {
  name: string;
  fieldName: string;
  type?: string;
  group?: string;
  collapsed?: boolean;
  sort?: (fieldName: string) => (a: TItem, b: TItem) => number;
}

export interface TrackItemPayload {
  id: GridId;
  label: string;
  value: unknown;
  valueLabel: unknown;
  trackLabel: string;
  fieldName: string;
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

export interface TrackPayload<TAxis extends Axis = Axis> {
  axis: TAxis;
  item: TrackItemPayload;
}

export interface RowHistogramPayload<TRow extends GridItem = GridItem> {
  axis: 'row';
  item: TRow;
  rowId: GridId;
  type: string;
  count: number;
}

export interface OncoGridOptions<
  TColumn extends GridItem = GridItem,
  TRow extends GridItem = GridItem,
  TEvent extends GridEvent = GridEvent
> {
  element?: string | HTMLElement;
  columns?: TColumn[];
  rows?: TRow[];
  events?: TEvent[];
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
  columnOpacityFunc?: (data: TrackItemPayload) => number;
  rowOpacityFunc?: (data: TrackItemPayload) => number;
  columnFillFunc?: (data: TrackItemPayload) => string;
  rowFillFunc?: (data: TrackItemPayload) => string;
  trackHeight?: number;
  trackPadding?: number;
  trackLegendLabel?: string;
  expandableGroups?: string[];
  nullSentinel?: unknown;
}

export interface OncoGridEventMap<
  TColumn extends GridItem = GridItem,
  TRow extends GridItem = GridItem,
  TEvent extends GridEvent = GridEvent
> {
  [ONCOGRID_EVENTS.gridClick]: CellPayload<TColumn, TRow, TEvent>;
  [ONCOGRID_EVENTS.gridMouseOver]: CellPayload<TColumn, TRow, TEvent>;
  [ONCOGRID_EVENTS.gridMouseOut]: void;
  [ONCOGRID_EVENTS.gridCrosshairMouseOver]: CellPayload<TColumn, TRow, TEvent>;
  [ONCOGRID_EVENTS.gridCrosshairMouseOut]: void;
  [ONCOGRID_EVENTS.columnHistogramClick]: ColumnHistogramPayload<TColumn>;
  [ONCOGRID_EVENTS.columnHistogramMouseOver]: ColumnHistogramPayload<TColumn>;
  [ONCOGRID_EVENTS.columnHistogramMouseOut]: { axis: 'column' };
  [ONCOGRID_EVENTS.rowHistogramClick]: RowHistogramPayload<TRow>;
  [ONCOGRID_EVENTS.rowHistogramMouseOver]: RowHistogramPayload<TRow>;
  [ONCOGRID_EVENTS.rowHistogramMouseOut]: { axis: 'row' };
  [ONCOGRID_EVENTS.columnTrackClick]: TrackPayload<'column'>;
  [ONCOGRID_EVENTS.columnTrackMouseOver]: TrackPayload<'column'>;
  [ONCOGRID_EVENTS.columnTrackMouseOut]: { axis: 'column' };
  [ONCOGRID_EVENTS.rowTrackClick]: TrackPayload<'row'>;
  [ONCOGRID_EVENTS.rowTrackMouseOver]: TrackPayload<'row'>;
  [ONCOGRID_EVENTS.rowTrackMouseOut]: { axis: 'row' };
  [ONCOGRID_EVENTS.trackLegendMouseOver]: { group: string };
  [ONCOGRID_EVENTS.trackLegendMouseOut]: void;
  [ONCOGRID_EVENTS.addTrackClick]: {
    hiddenTracks: Array<TrackDefinition<TColumn | TRow>>;
    addTrack: (track: TrackDefinition<TColumn | TRow>) => void;
  };
  [ONCOGRID_EVENTS.renderAllStart]: void;
  [ONCOGRID_EVENTS.renderAllEnd]: void;
  [ONCOGRID_EVENTS.renderMainGridStart]: void;
  [ONCOGRID_EVENTS.renderMainGridEnd]: void;
  [ONCOGRID_EVENTS.renderColumnHistogramStart]: void;
  [ONCOGRID_EVENTS.renderColumnHistogramEnd]: void;
  [ONCOGRID_EVENTS.renderRowHistogramStart]: void;
  [ONCOGRID_EVENTS.renderRowHistogramEnd]: void;
  [ONCOGRID_EVENTS.renderColumnTrackStart]: void;
  [ONCOGRID_EVENTS.renderColumnTrackEnd]: void;
  [ONCOGRID_EVENTS.renderRowTrackStart]: void;
  [ONCOGRID_EVENTS.renderRowTrackEnd]: void;
}
