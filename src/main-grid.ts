import * as d3 from 'd3';
import ColumnHistogram from './column-histogram';
import RowHistogram from './row-histogram';
import Track from './track';
import { EVENT_GRID_EVENTS } from './event-names';
import {
  CrosshairInteractionPayload,
  EventStacking,
  GridId,
  GridInteractionPayload
} from './types';
import {
  D3Scale,
  D3Selection,
  Emit,
  EventLookup,
  InternalOptions,
  InternalTrack,
  Margin,
  PositionedColumn,
  PositionedEvent,
  PositionedRow,
  UpdateCallback,
  idKey
} from './internal-types';

function safeClass(value: unknown): string {
  return String(value || 'default').replace(/[^a-zA-Z0-9_-]/g, '-');
}

class MainGrid {
  readonly emit: Emit;
  readonly updateCallback: UpdateCallback;
  readonly scaleToFit: boolean;
  readonly leftTextWidth: number;
  readonly prefix: string;
  readonly minCellHeight: number;
  readonly wrapper: D3Selection;
  readonly colorMap: Record<string, string>;
  readonly margin: Margin;
  readonly eventStacking: EventStacking;
  readonly heatMapColor: string;

  x: D3Scale;
  y: D3Scale;
  lookupTable: EventLookup;
  columns: PositionedColumn[];
  rows: PositionedRow[];
  events: PositionedEvent[];
  width: number;
  height: number;
  cellWidth: number;
  cellHeight: number;
  heatMap: boolean;
  drawGridLines: boolean;
  crosshair = false;
  histogramHeightColumns: number;

  columnMap: Record<string, PositionedColumn> = {};
  rowMap: Record<string, PositionedRow> = {};

  canvas: D3Selection;
  svg: D3Selection;
  container: D3Selection;
  background: D3Selection;
  gridContainer: D3Selection;
  eventsContainer: D3Selection;
  row: D3Selection;
  verticalCross: D3Selection;
  horizontalCross: D3Selection;

  columnHistogram: ColumnHistogram;
  columnTrack: Track;
  rowHistogram: RowHistogram;
  rowTrack: Track;

  constructor(
    params: InternalOptions,
    lookupTable: EventLookup,
    updateCallback: UpdateCallback,
    x: D3Scale,
    y: D3Scale
  ) {
    this.emit = params.emit;
    this.x = x;
    this.y = y;
    this.lookupTable = lookupTable;
    this.updateCallback = updateCallback;

    this.scaleToFit = typeof params.scaleToFit === 'boolean' ? params.scaleToFit : true;
    this.leftTextWidth = params.leftTextWidth || 80;
    this.prefix = params.prefix || 'eg-';
    this.minCellHeight = params.minCellHeight || 10;
    this.columns = params.columns;
    this.rows = params.rows;
    this.events = params.events;
    this.wrapper = d3.select(params.wrapper || 'body');
    this.colorMap = params.colorMap || { default: '#0067a5' };
    this.width = params.width || 500;
    this.height = params.height || 500;
    this.cellWidth = this.columns.length ? this.width / this.columns.length : 0;
    this.cellHeight = this.rows.length ? this.height / this.rows.length : 0;
    if (this.rows.length && this.cellHeight < this.minCellHeight) {
      this.cellHeight = this.minCellHeight;
      this.height = this.rows.length * this.minCellHeight;
      params.height = this.height;
    }
    this.margin = params.margin || { top: 30, right: 100, bottom: 15, left: 80 };
    this.heatMap = params.heatMap || false;
    this.eventStacking = params.eventStacking === 'h' ? 'h' : 'v';
    this.drawGridLines = params.grid || false;
    this.heatMapColor = params.heatMapColor || '#D33682';

    this.createItemMaps();
    this.initSvg();
    this.columnHistogram = new ColumnHistogram(params, this.container);
    this.histogramHeightColumns = this.columnHistogram.totalHeight;
    this.columnTrack = new Track(
      params,
      this.container,
      false,
      params.columnTracks as InternalTrack[] | undefined,
      updateCallback,
      this.height
    );
    this.columnTrack.init();
    this.rowHistogram = new RowHistogram(params, this.container, this.events, this.width);
    this.rowTrack = new Track(
      params,
      this.container,
      true,
      params.rowTracks as InternalTrack[] | undefined,
      updateCallback,
      this.width + this.rowHistogram.totalWidth
    );
    this.rowTrack.init();
  }

  private initSvg(): void {
    this.canvas = this.wrapper.append('canvas').attr('class', `${this.prefix}canvas`);
    this.svg = this.wrapper.append('svg')
      .attr('class', `${this.prefix}maingrid-svg`)
      .attr('id', `${this.prefix}maingrid-svg`)
      .attr('width', '100%')
      .style('position', 'absolute')
      .style('top', 0)
      .style('left', 0);
    this.container = this.svg.append('g');
    this.background = this.container.append('rect')
      .attr('class', `${this.prefix}background`)
      .attr('width', this.width)
      .attr('height', this.height);
    this.gridContainer = this.container.append('g');
    this.eventsContainer = this.container.append('g').attr('class', `${this.prefix}events`);
  }

  render(): void {
    this.emit(EVENT_GRID_EVENTS.renderMainGridStart);
    this.computeCoordinates();
    this.renderEvents();
    this.bindGridInteractions();
    this.emit(EVENT_GRID_EVENTS.renderMainGridEnd);

    this.emit(EVENT_GRID_EVENTS.renderColumnHistogramStart);
    this.columnHistogram.render();
    this.emit(EVENT_GRID_EVENTS.renderColumnHistogramEnd);
    this.emit(EVENT_GRID_EVENTS.renderRowHistogramStart);
    this.rowHistogram.render();
    this.emit(EVENT_GRID_EVENTS.renderRowHistogramEnd);
    this.emit(EVENT_GRID_EVENTS.renderColumnTrackStart);
    this.columnTrack.render();
    this.emit(EVENT_GRID_EVENTS.renderColumnTrackEnd);
    this.emit(EVENT_GRID_EVENTS.renderRowTrackStart);
    this.rowTrack.render();
    this.emit(EVENT_GRID_EVENTS.renderRowTrackEnd);
    this.defineCrosshairBehaviour();
    this.resizeSvg();
  }

  private bindGridInteractions(): void {
    this.svg
      .on('mouseover', (domEvent: MouseEvent) => {
        if (this.crosshair) return;
        const element = domEvent.target as SVGPathElement;
        const event = this.eventFromTarget(element);
        if (event) this.emit(EVENT_GRID_EVENTS.gridMouseOver, this.eventPayload(element, event));
      })
      .on('mouseout', () => this.emit(EVENT_GRID_EVENTS.gridMouseOut))
      .on('click', (domEvent: MouseEvent) => {
        const element = domEvent.target as SVGPathElement;
        const event = this.eventFromTarget(element);
        if (event) this.emit(EVENT_GRID_EVENTS.gridClick, this.eventPayload(element, event));
      });
  }

  private eventFromTarget(target: SVGElement): PositionedEvent | undefined {
    const index = target.dataset && target.dataset.eventIndex;
    return typeof index === 'undefined' ? undefined : this.events[Number(index)];
  }

  private eventPayload(
    element: SVGPathElement,
    event: PositionedEvent
  ): GridInteractionPayload<PositionedEvent> {
    return { element, data: event };
  }

  eventsAt(columnId: GridId, rowId: GridId): PositionedEvent[] {
    const columnEvents = this.lookupTable[idKey(columnId)];
    return columnEvents && columnEvents[idKey(rowId)] ? columnEvents[idKey(rowId)] : [];
  }

  renderEvents(): void {
    const renderableEvents = this.events.filter((event) =>
      Boolean(this.columnMap[idKey(event.columnId)] && this.rowMap[idKey(event.rowId)]));
    const selection = this.eventsContainer.selectAll(`.${this.prefix}event`)
      .data(renderableEvents, (event: PositionedEvent, index: number) =>
        typeof event.id === 'undefined' ? index : event.id);

    const merged = selection.enter().append('path').merge(selection);
    merged
      .attr('data-event-index', (event: PositionedEvent) => this.events.indexOf(event))
      .attr('data-column-id', (event: PositionedEvent) => event.columnId)
      .attr('data-row-id', (event: PositionedEvent) => event.rowId)
      .attr('data-event-type', (event: PositionedEvent) => event.type)
      .attr('data-event-stacking', this.eventStacking)
      .attr('data-cell-event-index', (event: PositionedEvent) =>
        this.eventsAt(event.columnId, event.rowId).indexOf(event))
      .attr('data-cell-event-count', (event: PositionedEvent) =>
        this.eventsAt(event.columnId, event.rowId).length)
      .attr('class', (event: PositionedEvent) =>
        `${this.prefix}event ${this.prefix}event-type-${safeClass(event.type)}`)
      .attr('d', (event: PositionedEvent) => this.getRectangularPath(event))
      .attr('fill', (event: PositionedEvent) => this.getColor(event))
      .attr('opacity', (event: PositionedEvent) => this.getOpacity(event));
    selection.exit().remove();
  }

  update(x: D3Scale, y: D3Scale): void {
    this.x = x;
    this.y = y;
    this.createItemMaps();
    this.cellWidth = this.columns.length ? this.width / this.columns.length : 0;
    this.cellHeight = this.rows.length ? this.height / this.rows.length : 0;
    this.computeCoordinates();
    this.renderEvents();
    this.columnHistogram.events = this.events;
    this.columnHistogram.update(this.columns);
    this.columnTrack.update(this.columns);
    this.rowTrack.update(this.rows);
    this.rowHistogram.events = this.events;
    this.rowHistogram.update(this.rows);
  }

  computeCoordinates(): void {
    this.cellWidth = this.columns.length ? this.width / this.columns.length : 0;
    this.cellHeight = this.rows.length ? this.height / this.rows.length : 0;
    this.gridContainer.selectAll(`.${this.prefix}column-line`).remove();
    if (this.drawGridLines) {
      this.gridContainer.selectAll(`.${this.prefix}column-line`)
        .data(this.columns)
        .enter()
        .append('line')
        .attr('class', `${this.prefix}column-line`)
        .attr('x1', (column: PositionedColumn) => column.x)
        .attr('x2', (column: PositionedColumn) => column.x)
        .attr('y2', this.height)
        .style('pointer-events', 'none');
    }

    this.gridContainer.selectAll(`.${this.prefix}row`).remove();
    this.row = this.gridContainer.selectAll(`.${this.prefix}row`)
      .data(this.rows)
      .enter()
      .append('g')
      .attr('class', `${this.prefix}row`)
      .attr('transform', (row: PositionedRow) => `translate(0,${row.y})`);
    if (this.drawGridLines) this.row.append('line').attr('x2', this.width).style('pointer-events', 'none');
    this.row.append('text')
      .attr('class', `${this.prefix}row-label ${this.prefix}label-text-font`)
      .attr('x', -8)
      .attr('y', this.cellHeight / 2)
      .attr('dy', '.32em')
      .attr('text-anchor', 'end')
      .style('display', this.cellHeight < this.minCellHeight ? 'none' : null)
      .text((row: PositionedRow) => typeof row.label === 'undefined' ? row.id : row.label);
    this.defineRowDragBehaviour();
  }

  resize(width: number, height: number, x: D3Scale, y: D3Scale): void {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.cellWidth = this.columns.length ? width / this.columns.length : 0;
    this.cellHeight = this.rows.length ? height / this.rows.length : 0;
    if (this.rows.length && this.cellHeight < this.minCellHeight) {
      this.cellHeight = this.minCellHeight;
      this.height = this.rows.length * this.minCellHeight;
    }
    this.createItemMaps();
    this.background.attr('width', this.width).attr('height', this.height);
    this.computeCoordinates();
    this.columnHistogram.resize(this.width);
    this.columnTrack.resize(this.width, this.height, this.height);
    this.rowHistogram.resize(this.width, this.height, this.width);
    this.rowTrack.resize(this.width, this.height, this.width + this.rowHistogram.totalWidth);
    this.renderEvents();
    this.resizeSvg();
    if (this.verticalCross) {
      this.verticalCross.attr('y2', this.height + this.columnTrack.height);
      this.horizontalCross.attr('x2', this.width + this.rowHistogram.totalWidth + this.rowTrack.height);
    }
  }

  resizeSvg(): void {
    const totalWidth = this.margin.left + this.leftTextWidth + this.width +
      this.rowHistogram.totalWidth + this.rowTrack.height + this.margin.right;
    const totalHeight = this.margin.top + this.histogramHeightColumns + this.height +
      this.columnTrack.height + this.margin.bottom;
    this.canvas.attr('width', totalWidth).attr('height', totalHeight);
    if (this.scaleToFit) {
      this.canvas.style('width', '100%');
      this.svg.attr('viewBox', `0 0 ${totalWidth} ${totalHeight}`);
    } else {
      this.canvas.style('width', `${totalWidth}px`);
      this.svg.attr('width', totalWidth).attr('height', totalHeight);
    }
    this.container.attr('transform',
      `translate(${this.margin.left + this.leftTextWidth},${this.margin.top + this.histogramHeightColumns})`);
  }

  private defineCrosshairBehaviour(): void {
    if (this.verticalCross) return;
    const moveCrosshair = (domEvent: MouseEvent, target: Element): void => {
      if (!this.crosshair) return;
      const coordinates = d3.pointer(domEvent, target);
      this.verticalCross.attr('x1', coordinates[0]).attr('x2', coordinates[0]).attr('opacity', 1);
      this.horizontalCross.attr('y1', coordinates[1]).attr('y2', coordinates[1]).attr('opacity', 1);
      const xIndex = coordinates[0] > this.width ? -1 : this.rangeToDomain(this.x, coordinates[0]);
      const yIndex = coordinates[1] > this.height ? -1 : this.rangeToDomain(this.y, coordinates[1]);
      const column = this.columns[xIndex];
      const row = this.rows[yIndex];
      if (column && row) {
        const payload: CrosshairInteractionPayload<PositionedEvent> = {
          element: domEvent.target as SVGElement,
          data: {
            columnId: column.id,
            rowId: row.id,
            events: this.eventsAt(column.id, row.id)
          }
        };
        this.emit(EVENT_GRID_EVENTS.gridCrosshairMouseOver, payload);
      }
    };

    this.verticalCross = this.container.append('line')
      .attr('class', `${this.prefix}vertical-cross`)
      .attr('y1', -this.histogramHeightColumns)
      .attr('y2', this.height + this.columnTrack.height)
      .attr('opacity', 0)
      .style('pointer-events', 'none');
    this.horizontalCross = this.container.append('line')
      .attr('class', `${this.prefix}horizontal-cross`)
      .attr('x1', 0)
      .attr('x2', this.width + this.rowHistogram.totalWidth + this.rowTrack.height)
      .attr('opacity', 0)
      .style('pointer-events', 'none');

    const grid = this;
    this.container
      .on('mouseover', function (this: Element, domEvent: MouseEvent) { moveCrosshair(domEvent, this); })
      .on('mousemove', function (this: Element, domEvent: MouseEvent) { moveCrosshair(domEvent, this); })
      .on('mouseout', () => {
        if (!grid.crosshair) return;
        grid.verticalCross.attr('opacity', 0);
        grid.horizontalCross.attr('opacity', 0);
        grid.emit(EVENT_GRID_EVENTS.gridCrosshairMouseOut);
      });
  }

  private defineRowDragBehaviour(): void {
    const grid = this;
    const drag = d3.drag<SVGGElement, PositionedRow>();
    drag.on('start', (dragEvent) => dragEvent.sourceEvent.stopPropagation());
    drag.on('drag', function (this: SVGGElement, dragEvent) {
      d3.select(this).attr('transform', `translate(0,${dragEvent.y})`);
    });
    drag.on('end', (dragEvent, row) => {
      const coordinates = d3.pointer(dragEvent.sourceEvent, grid.container.node() as Element);
      const yIndex = grid.rangeToDomain(grid.y, coordinates[1]);
      const dragged = grid.rows.indexOf(row);
      if (dragged < 0 || yIndex < 0) return;
      grid.rows.splice(dragged, 1);
      grid.rows.splice(yIndex, 0, row);
      grid.updateCallback(true);
    });
    this.row.call(drag);
  }

  createItemMaps(): void {
    this.columnMap = {};
    this.rowMap = {};
    this.columns.forEach((column) => { this.columnMap[idKey(column.id)] = column; });
    this.rows.forEach((row) => { this.rowMap[idKey(row.id)] = row; });
  }

  getY(event: PositionedEvent): number {
    const row = this.rowMap[idKey(event.rowId)];
    return row ? row.y : 0;
  }

  getCellX(event: PositionedEvent): number {
    const column = this.columnMap[idKey(event.columnId)];
    return column ? column.x : 0;
  }

  getColor(event: PositionedEvent): string {
    if (this.heatMap) return this.heatMapColor;
    return this.colorMap[event.type] || this.colorMap.default || '#0067a5';
  }

  getOpacity(event: PositionedEvent): number {
    if (!this.heatMap) return 1;
    const eventCount = Math.max(1, this.eventsAt(event.columnId, event.rowId).length);
    return 1 - Math.pow(0.75, eventCount);
  }

  getRectangularPath(event: PositionedEvent): string {
    const cellEvents = this.eventsAt(event.columnId, event.rowId);
    const eventIndex = Math.max(0, cellEvents.indexOf(event));
    const eventCount = Math.max(1, cellEvents.length);
    let eventWidth = this.cellWidth;
    let eventHeight = this.cellHeight;
    let x = this.getCellX(event);
    let y = this.getY(event);
    if (this.eventStacking === 'v') {
      eventHeight = this.cellHeight / eventCount;
      y += eventIndex * eventHeight;
    } else {
      eventWidth = this.cellWidth / eventCount;
      x += eventIndex * eventWidth;
    }
    return `M ${x} ${y} H ${x + eventWidth} V ${y + eventHeight} H ${x}Z`;
  }

  setHeatmap(active: boolean): boolean {
    if (active === this.heatMap) return this.heatMap;
    this.heatMap = active;
    this.renderEvents();
    return this.heatMap;
  }

  setGridLines(active: boolean): boolean {
    if (this.drawGridLines === active) return this.drawGridLines;
    this.drawGridLines = active;
    this.rowTrack.setGridLines(active);
    this.columnTrack.setGridLines(active);
    this.computeCoordinates();
    return this.drawGridLines;
  }

  setCrosshair(active: boolean): boolean {
    this.crosshair = active;
    return this.crosshair;
  }

  rangeToDomain(scale: D3Scale, value: number): number {
    if (!scale || !scale.domain().length) return -1;
    const domain = scale.domain();
    const [start, end] = scale.range();
    const distance = end >= start ? value - start : start - value;
    const index = Math.floor(distance / scale.step());
    return domain[Math.min(domain.length - 1, Math.max(0, index))];
  }

  destroy(): void {
    this.wrapper.select(`.${this.prefix}maingrid-svg`).remove();
    this.wrapper.select(`.${this.prefix}canvas`).remove();
  }
}

export default MainGrid;
