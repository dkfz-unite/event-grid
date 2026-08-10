import {
  GridEvent,
  GridId,
  GridItem,
  EventGridOptions,
  TrackDefinition,
  TrackItemPayload
} from './types';
import { EventGridEventName } from './event-names';
import type { ScaleBand } from 'd3';

export type D3Selection = any;
export type D3Scale = ScaleBand<number>;
export type Emit = (eventName: EventGridEventName, payload?: unknown) => boolean;
export type UpdateCallback = (sortColumns?: boolean) => void;
export type ResizeCallback = () => void;

export interface PositionedColumn extends GridItem {
  x: number;
  count: number;
  score: number;
}

export interface PositionedRow extends GridItem {
  y: number;
  count: number;
  score: number;
}

export interface PositionedEvent extends GridEvent {}

export type EventLookup = Record<string, Record<string, PositionedEvent[]>>;

export interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface InternalOptions extends EventGridOptions<PositionedColumn, PositionedRow, PositionedEvent> {
  emit: Emit;
  wrapper: string;
  columns: PositionedColumn[];
  rows: PositionedRow[];
  events: PositionedEvent[];
  types: string[];
  colorMap: Record<string, string>;
  margin?: Margin;
}

export interface ColumnEventStat {
  column: PositionedColumn;
  total: number;
  [eventType: string]: PositionedColumn | number;
}

export interface RowEventStat {
  row: PositionedRow;
  total: number;
  [eventType: string]: PositionedRow | number;
}

export interface TrackData extends TrackItemPayload {
  domainIndex: number;
  notNullSentinel: boolean;
}

export interface TrackGroupOptions {
  emit: Emit;
  prefix: string;
  cellHeight: number;
  width: number;
  grid: boolean;
  nullSentinel: unknown;
  domain: Array<PositionedColumn | PositionedRow>;
  trackLegendLabel: string;
  expandable: boolean;
}

export type InternalTrack = TrackDefinition<PositionedColumn | PositionedRow>;
export type TrackFillCallback = (data: TrackData) => string;
export type TrackOpacityCallback = (data: TrackData) => number;

export function idKey(id: GridId): string {
  return String(id);
}
