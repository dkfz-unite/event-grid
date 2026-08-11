import * as d3 from 'd3';
import defaultColorPalette from './default-color-palette';
import { EVENT_GRID_EVENTS } from './event-names';
import {
  D3Scale,
  D3Selection,
  InternalTrack,
  PositionedColumn,
  PositionedRow,
  TrackData,
  TrackGroupOptions,
  UpdateCallback,
  idKey
} from './internal-types';

const DEFAULT_TRACK_FILL = '#6d72c5';
const MIN_NUMERIC_OPACITY = 0.2;

function valueGetter(track: InternalTrack): (item: PositionedColumn | PositionedRow) => unknown {
  return typeof track.field === 'function'
    ? track.field
    : (item) => item[track.field as string];
}

function trackValue(track: InternalTrack, item: PositionedColumn | PositionedRow): unknown {
  return typeof track.field === 'function' ? track.field(item) : item[track.field];
}

function safeClass(value: unknown): string {
  return String(value).replace(/[^a-zA-Z0-9_-]/g, '-');
}

function numericValue(value: unknown): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  const converted = Number(value);
  return Number.isFinite(converted) ? converted : undefined;
}

function clampOpacity(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.max(0, Math.min(1, value));
}

function hasColor(map: Record<string, string> | undefined, key: string): boolean {
  return Boolean(map && Object.prototype.hasOwnProperty.call(map, key));
}

class TrackGroup {
  readonly emit;
  readonly prefix: string;
  readonly name: string;
  readonly cellHeight: number;
  readonly rotated: boolean;
  readonly updateCallback: UpdateCallback;

  width: number;
  height = 0;
  length = 0;
  drawGridLines: boolean;
  domain: Array<PositionedColumn | PositionedRow>;
  numDomain: number;
  tracks: InternalTrack[] = [];
  trackData: TrackData[] = [];
  cellWidth = 0;

  container: D3Selection;
  background: D3Selection;
  column: D3Selection;
  row: D3Selection;
  y!: D3Scale;

  constructor(
    params: TrackGroupOptions,
    name: string,
    rotated: boolean,
    updateCallback: UpdateCallback
  ) {
    this.emit = params.emit;
    this.prefix = params.prefix || 'eg-';
    this.name = name;
    this.cellHeight = params.cellHeight || 20;
    this.width = params.width;
    this.rotated = rotated;
    this.updateCallback = updateCallback;
    this.drawGridLines = params.grid || false;
    this.domain = params.domain;
    this.numDomain = this.domain.length;
  }

  addTrack(track: InternalTrack): void {
    if (this.tracks.some((existing) => idKey(existing.id) === idKey(track.id))) return;
    this.tracks.push(track);
    this.length = this.tracks.length;
    this.height = this.cellHeight * this.length;
  }

  refreshData(): void {
    this.trackData = [];
    this.domain.forEach((item, domainIndex) => {
      this.tracks.forEach((track) => {
        const value = trackValue(track, item);
        const available = value !== null;
        this.trackData.push({
          id: item.id,
          label: typeof item.label === 'undefined' ? String(item.id) : item.label,
          domainIndex,
          value,
          valueLabel: available ? value : 'Not available',
          available,
          fill: DEFAULT_TRACK_FILL,
          opacity: 1,
          trackId: track.id,
          trackLabel: track.label,
          field: track.field,
          type: track.type
        });
      });
    });
    this.applyStyles();
  }

  private applyStyles(): void {
    this.tracks.forEach((track) => {
      const items = this.trackData.filter((item) => idKey(item.trackId) === idKey(track.id));
      const available = items.filter((item) => item.available &&
        typeof item.value !== 'undefined' && item.value !== '');
      const numericValues = available.map((item) => numericValue(item.value));
      const numeric = track.type === 'number' ||
        (numericValues.length > 0 && numericValues.every((value) => typeof value === 'number'));
      const hasCustomPalette = Boolean(track.colorPalette && track.colorPalette.length);
      const palette = hasCustomPalette
        ? (track.colorPalette as string[]).slice()
        : defaultColorPalette.slice();
      const usePalette = !track.fill && (!numeric || hasCustomPalette);
      const generatedColors: Record<string, string> = Object.create(null) as Record<string, string>;
      let colorIndex = 0;

      items.forEach((item) => {
        const key = String(item.value);
        if (hasColor(track.colorMap, key)) {
          item.fill = (track.colorMap as Record<string, string>)[key];
        } else if (track.fill) {
          item.fill = track.fill;
        } else if (usePalette) {
          if (!generatedColors[key]) {
            generatedColors[key] = palette[colorIndex % palette.length];
            colorIndex += 1;
          }
          item.fill = generatedColors[key];
        } else {
          item.fill = DEFAULT_TRACK_FILL;
        }
      });

      if (track.opacityFunction) {
        items.forEach((item) => {
          item.opacity = clampOpacity(Number(track.opacityFunction?.(item)));
        });
        return;
      }

      if (!numeric) {
        items.forEach((item) => {
          if (!item.available) item.opacity = MIN_NUMERIC_OPACITY;
        });
        return;
      }
      const finiteValues: number[] = [];
      numericValues.forEach((value) => {
        if (typeof value === 'number') finiteValues.push(value);
      });
      const minimum = finiteValues.length ? Math.min(...finiteValues) : 0;
      const maximum = finiteValues.length ? Math.max(...finiteValues) : 0;
      items.forEach((item) => {
        const value = item.available ? numericValue(item.value) : undefined;
        if (typeof value === 'undefined') {
          item.opacity = MIN_NUMERIC_OPACITY;
        } else if (minimum === maximum) {
          item.opacity = 1;
        } else {
          item.opacity = MIN_NUMERIC_OPACITY +
            (1 - MIN_NUMERIC_OPACITY) * (value - minimum) / (maximum - minimum);
        }
      });
    });
  }

  init(container: D3Selection): void {
    this.container = container;
    this.container.append('text')
      .attr('x', -6)
      .attr('y', -11)
      .attr('dy', '.32em')
      .attr('text-anchor', 'end')
      .attr('class', `${this.prefix}track-group-label`)
      .text(this.name);

    this.background = this.container.append('rect')
      .attr('class', 'background')
      .attr('width', this.width)
      .attr('height', this.height);
    this.refreshData();
  }

  render(): void {
    this.computeCoordinates();
    this.cellWidth = this.domain.length ? this.width / this.domain.length : 0;
    this.renderData();
  }

  update(domain: Array<PositionedColumn | PositionedRow>): void {
    this.domain = domain;
    if (domain.length !== this.numDomain) {
      this.numDomain = domain.length;
      this.cellWidth = this.numDomain ? this.width / this.numDomain : 0;
    }

    this.refreshData();
    this.computeCoordinates();
    this.renderData();
  }

  resize(width: number): void {
    this.width = width;
    this.height = this.cellHeight * this.length;
    this.cellWidth = this.domain.length ? this.width / this.domain.length : 0;
    this.background.attr('class', 'background').attr('width', this.width).attr('height', this.height);
    this.computeCoordinates();
    this.renderData();
  }

  computeCoordinates(): void {
    this.y = d3.scaleBand<number>().domain(d3.range(this.length)).range([0, this.height]);
    if (this.column) this.column.remove();

    if (this.drawGridLines) {
      this.column = this.container.selectAll(`.${this.prefix}column`)
        .data(this.domain)
        .enter()
        .append('line')
        .attr('class', `${this.prefix}track-grid-line`)
        .attr('data-item-id', (item: PositionedColumn | PositionedRow) => item.id)
        .attr('transform', (item: PositionedColumn | PositionedRow) =>
          `translate(${this.itemPosition(item)})rotate(-90)`)
        .style('pointer-events', 'none')
        .attr('x1', -this.height);
    }

    if (this.row) this.row.remove();
    this.row = this.container.selectAll(`.${this.prefix}row`)
      .data(this.tracks)
      .enter()
      .append('g')
      .attr('class', `${this.prefix}row`)
      .attr('transform', (_track: InternalTrack, index: number) => `translate(0,${this.y(index) ?? 0})`);

    if (this.drawGridLines) this.row.append('line').style('pointer-events', 'none').attr('x2', this.width);
    const labels = this.row.append('text');
    labels
      .attr('class', `${this.prefix}track-label ${this.prefix}label-text-font`)
      .on('click', (_domEvent: MouseEvent, track: InternalTrack) => {
        if (!track.sort) return;
        this.domain.sort(track.sort(valueGetter(track)));
        this.updateCallback(false);
      })
      .transition()
      .attr('x', -6)
      .attr('y', this.cellHeight / 2)
      .attr('dy', '.32em')
      .attr('text-anchor', 'end')
      .text((track: InternalTrack) => track.label);
  }

  setGridLines(active: boolean): void {
    if (this.drawGridLines === active) return;
    this.drawGridLines = active;
    this.computeCoordinates();
  }

  renderData(): void {
    const selection = this.container.selectAll(`.${this.prefix}track-data`).data(this.trackData);
    const merged = selection.enter().append('rect').merge(selection);

    const yIndexLookup: Record<string, number> = {};
    this.tracks.forEach((track, index) => { yIndexLookup[idKey(track.id)] = index; });
    this.bindDataInteractions();

    merged
      .attr('data-track-data-index', (_data: TrackData, index: number) => index)
      .attr('data-track-id', (data: TrackData) => data.trackId)
      .attr('x', (data: TrackData) => this.itemPosition(this.domain[data.domainIndex]))
      .attr('y', (data: TrackData) => this.y(yIndexLookup[idKey(data.trackId)]) ?? 0)
      .attr('width', this.cellWidth)
      .attr('height', this.cellHeight)
      .attr('fill', (data: TrackData) => data.fill)
      .attr('opacity', (data: TrackData) => data.opacity)
      .attr('class', (data: TrackData) =>
        `${this.prefix}track-data ${this.prefix}track-${safeClass(data.trackId)} ` +
        `${this.prefix}track-value-${safeClass(data.value)}`);
    selection.exit().remove();
  }

  private bindDataInteractions(): void {
    this.container
      .on('click', (domEvent: MouseEvent) => this.emitTrackInteraction(domEvent, 'Click'))
      .on('mouseover', (domEvent: MouseEvent) => this.emitTrackInteraction(domEvent, 'MouseOver'))
      .on('mouseout', () => {
        const axis = this.rotated ? 'row' : 'column';
        const axisEvent = axis === 'column'
          ? EVENT_GRID_EVENTS.columnTrackMouseOut
          : EVENT_GRID_EVENTS.rowTrackMouseOut;
        this.emit(axisEvent, { axis });
      });
  }

  private emitTrackInteraction(domEvent: MouseEvent, suffix: 'Click' | 'MouseOver'): void {
    const target = domEvent.target as HTMLElement;
    const index = target.dataset && target.dataset.trackDataIndex;
    const item = typeof index === 'undefined' ? undefined : this.trackData[Number(index)];
    if (!item) return;
    const axis = this.rotated ? 'row' : 'column';
    const payload = { item, axis };
    const axisEvent = axis === 'column'
      ? suffix === 'Click' ? EVENT_GRID_EVENTS.columnTrackClick : EVENT_GRID_EVENTS.columnTrackMouseOver
      : suffix === 'Click' ? EVENT_GRID_EVENTS.rowTrackClick : EVENT_GRID_EVENTS.rowTrackMouseOver;
    this.emit(axisEvent, payload);
  }

  private itemPosition(item: PositionedColumn | PositionedRow): number {
    return this.rotated ? (item as PositionedRow).y : (item as PositionedColumn).x;
  }
}

export default TrackGroup;
