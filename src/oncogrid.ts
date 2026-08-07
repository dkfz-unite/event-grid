import cloneDeep from 'lodash.clonedeep';
import d3 from 'd3';
import MainGrid from './main-grid';
import defaultColorPalette from './default-color-palette';
import { ONCOGRID_EVENTS } from './event-names';
import { GridEvent, GridId, GridItem, OncoGridEventMap, OncoGridOptions } from './types';
import {
  D3Scale,
  D3Selection,
  EventLookup,
  InternalOptions,
  PositionedColumn,
  PositionedEvent,
  PositionedRow,
  idKey
} from './internal-types';

function eventTypes(events: PositionedEvent[]): string[] {
  const seen: Record<string, boolean> = {};
  const types: string[] = [];
  events.forEach((event) => {
    event.type = event.type || 'default';
    if (seen[event.type]) return;
    seen[event.type] = true;
    types.push(event.type);
  });
  return types;
}

function resolveColorPalette(palette?: string[]): string[] {
  return Array.isArray(palette) && palette.length ? palette.slice() : defaultColorPalette.slice();
}

function eventColorMap(
  types: string[],
  palette: string[],
  overrides?: Record<string, string>
): Record<string, string> {
  const colorMap: Record<string, string> = {};
  types.forEach((type, index) => { colorMap[type] = palette[index % palette.length]; });
  Object.keys(overrides || {}).forEach((type) => { colorMap[type] = (overrides as Record<string, string>)[type]; });
  colorMap.default = colorMap.default || palette[0];
  return colorMap;
}

class OncoGrid<
  TColumn extends GridItem = GridItem,
  TRow extends GridItem = GridItem,
  TEvent extends GridEvent = GridEvent
> extends EventTarget {
  static defaultColorPalette: string[] = defaultColorPalette.slice();
  static readonly eventNames = ONCOGRID_EVENTS;

  readonly params: OncoGridOptions<TColumn, TRow, TEvent>;
  readonly minCellHeight: number;
  readonly prefix: string;
  readonly container: D3Selection;

  width: number;
  height: number;
  columns: Array<TColumn & PositionedColumn> = [];
  rows: Array<TRow & PositionedRow> = [];
  events: Array<TEvent & PositionedEvent> = [];
  types: string[] = [];
  colorPalette: string[] = [];
  colorMap: Record<string, string> = {};
  lookupTable: EventLookup = {};
  x: D3Scale;
  y: D3Scale;
  mainGrid!: MainGrid;
  heatMapMode = false;
  drawGridLines = false;
  crosshairMode = false;

  constructor(params: OncoGridOptions<TColumn, TRow, TEvent> = {}) {
    super();
    this.params = params;
    this.width = params.width || 500;
    this.minCellHeight = params.minCellHeight || 10;
    this.height = params.height || 500;
    const rows = params.rows || [];
    if (rows.length && this.height / rows.length < this.minCellHeight) {
      this.height = rows.length * this.minCellHeight;
    }
    this.prefix = params.prefix || 'og-';
    this.container = d3.select(params.element || 'body')
      .append('div')
      .attr('class', `${this.prefix}container`)
      .style('position', 'relative');
    this.initGrid();
  }

  private emit<TKey extends keyof OncoGridEventMap<TColumn, TRow, TEvent>>(
    type: TKey,
    detail?: OncoGridEventMap<TColumn, TRow, TEvent>[TKey]
  ): boolean {
    return this.dispatchEvent(new CustomEvent(String(type), { detail }));
  }

  private initGrid(reloading = false): void {
    const cloned = cloneDeep(this.params) as OncoGridOptions<TColumn, TRow, TEvent>;
    this.columns = (cloned.columns || []) as Array<TColumn & PositionedColumn>;
    this.rows = (cloned.rows || []) as Array<TRow & PositionedRow>;
    this.events = (cloned.events || []) as Array<TEvent & PositionedEvent>;
    this.types = eventTypes(this.events);
    this.colorPalette = resolveColorPalette(cloned.colorPalette);
    this.colorMap = eventColorMap(this.types, this.colorPalette, cloned.colorMap);

    this.createLookupTable();
    this.computeCounts();
    this.computeRowScores();
    this.computeScores();
    this.sortByScores();
    this.calculatePositions();

    const options = {
      ...cloned,
      emit: this.emit.bind(this),
      wrapper: `.${this.prefix}container`,
      columns: this.columns,
      rows: this.rows,
      events: this.events,
      types: this.types,
      colorMap: this.colorMap
    } as unknown as InternalOptions;
    if (reloading) {
      options.width = this.width;
      options.height = this.height;
    }

    this.mainGrid = new MainGrid(
      options,
      this.lookupTable,
      this.update,
      () => this.resize(this.width, this.height),
      this.x,
      this.y
    );
    this.heatMapMode = this.mainGrid.heatMap;
    this.drawGridLines = this.mainGrid.drawGridLines;
    this.crosshairMode = this.mainGrid.crosshair;
  }

  private calculatePositions(): void {
    const getX = d3.scale.ordinal().domain(d3.range(this.columns.length)).rangeBands([0, this.width]);
    const getY = d3.scale.ordinal().domain(d3.range(this.rows.length)).rangeBands([0, this.height]);
    this.columns.forEach((column, index) => {
      column.x = getX(index);
    });
    this.rows.forEach((row, index) => {
      row.y = getY(index);
    });
    this.x = getX;
    this.y = getY;
  }

  private createLookupTable(): void {
    this.lookupTable = {};
    this.events.forEach((event) => {
      const columnId = idKey(event.columnId);
      const rowId = idKey(event.rowId);
      if (!this.lookupTable[columnId]) this.lookupTable[columnId] = {};
      if (!this.lookupTable[columnId][rowId]) this.lookupTable[columnId][rowId] = [];
      this.lookupTable[columnId][rowId].push(event);
    });
  }

  render(): void {
    this.emit(ONCOGRID_EVENTS.renderAllStart);
    this.mainGrid.render();
    this.emit(ONCOGRID_EVENTS.renderAllEnd);
  }

  private readonly update = (sortColumns = false): void => {
    if (sortColumns) {
      this.computeScores();
      this.sortByScores();
    }
    this.calculatePositions();
    this.mainGrid.lookupTable = this.lookupTable;
    this.mainGrid.update(this.x, this.y);
  };

  resize(width: number, height: number): void {
    this.width = Number(width);
    this.height = Number(height);
    if (this.rows.length && this.height / this.rows.length < this.minCellHeight) {
      this.height = this.rows.length * this.minCellHeight;
    }
    this.calculatePositions();
    this.mainGrid.resize(this.width, this.height, this.x, this.y);
  }

  private sortByScores(): void {
    this.columns.sort(this.sortScore);
  }

  private rowsSortByScores(): void {
    this.rows.sort(this.sortScore);
  }

  cluster(): void {
    this.computeCounts();
    this.rows.forEach((row) => { row.score = row.count; });
    this.rowsSortByScores();
    this.computeScores();
    this.sortByScores();
    this.update();
  }

  removeColumns(predicate: (column: TColumn) => boolean): void {
    const removed: Record<string, boolean> = {};
    for (let index = this.columns.length - 1; index >= 0; index -= 1) {
      if (!predicate(this.columns[index])) continue;
      removed[idKey(this.columns[index].id)] = true;
      this.columns.splice(index, 1);
    }
    for (let index = this.events.length - 1; index >= 0; index -= 1) {
      if (removed[idKey(this.events[index].columnId)]) this.events.splice(index, 1);
    }
    this.refreshData();
  }

  removeRows(predicate: (row: TRow) => boolean): void {
    const removed: Record<string, boolean> = {};
    for (let index = this.rows.length - 1; index >= 0; index -= 1) {
      if (!predicate(this.rows[index])) continue;
      removed[idKey(this.rows[index].id)] = true;
      this.rows.splice(index, 1);
    }
    for (let index = this.events.length - 1; index >= 0; index -= 1) {
      if (removed[idKey(this.events[index].rowId)]) this.events.splice(index, 1);
    }
    this.refreshData();
  }

  private refreshData(): void {
    this.types = eventTypes(this.events);
    this.createLookupTable();
    this.computeCounts();
    this.computeRowScores();
    this.computeScores();
    this.mainGrid.lookupTable = this.lookupTable;
    this.update();
    this.resize(this.width, this.height);
  }

  sortColumns(comparator: (a: TColumn, b: TColumn) => number): void {
    this.columns.sort(comparator);
    this.update();
  }

  sortRows(comparator: (a: TRow, b: TRow) => number): void {
    this.rows.sort(comparator);
    this.computeScores();
    this.sortByScores();
    this.update();
  }

  setHeatmap(active: boolean): void {
    this.heatMapMode = active;
    this.mainGrid.setHeatmap(active);
  }

  toggleHeatmap(): void {
    this.setHeatmap(!this.heatMapMode);
  }

  setGridLines(active: boolean): void {
    this.drawGridLines = active;
    this.mainGrid.setGridLines(active);
  }

  toggleGridLines(): void {
    this.setGridLines(!this.drawGridLines);
  }

  setCrosshair(active: boolean): void {
    this.crosshairMode = active;
    this.mainGrid.setCrosshair(active);
  }

  toggleCrosshair(): void {
    this.setCrosshair(!this.crosshairMode);
  }

  private eventScore(columnId: GridId, rowId: GridId): number {
    const rows = this.lookupTable[idKey(columnId)];
    return rows && rows[idKey(rowId)] ? 1 : 0;
  }

  private computeScores(): void {
    this.columns.forEach((column) => {
      column.score = this.rows.reduce((score, row, index) =>
        score + this.eventScore(column.id, row.id) * Math.pow(2, this.rows.length + 1 - index), 0);
    });
  }

  private computeRowScores(): void {
    this.rows.forEach((row, index) => { row.score = this.rows.length - index; });
  }

  private computeCounts(): void {
    const columnCounts: Record<string, number> = {};
    const rowCounts: Record<string, number> = {};
    this.events.forEach((event) => {
      const columnId = idKey(event.columnId);
      const rowId = idKey(event.rowId);
      columnCounts[columnId] = (columnCounts[columnId] || 0) + 1;
      rowCounts[rowId] = (rowCounts[rowId] || 0) + 1;
    });
    this.columns.forEach((column) => { column.count = columnCounts[idKey(column.id)] || 0; });
    this.rows.forEach((row) => { row.count = rowCounts[idKey(row.id)] || 0; });
  }

  private readonly sortScore = (
    first: PositionedColumn | PositionedRow,
    second: PositionedColumn | PositionedRow
  ): number => {
    if (first.score < second.score) return 1;
    if (first.score > second.score) return -1;
    return String(first.id) >= String(second.id) ? 1 : -1;
  };

  destroy(): void {
    this.mainGrid.destroy();
    this.container.remove();
  }

  reload(): void {
    this.mainGrid.destroy();
    this.initGrid(true);
    this.render();
  }
}

interface OncoGrid<
  TColumn extends GridItem = GridItem,
  TRow extends GridItem = GridItem,
  TEvent extends GridEvent = GridEvent
> {
  addEventListener<TKey extends keyof OncoGridEventMap<TColumn, TRow, TEvent>>(
    type: TKey,
    listener: (event: CustomEvent<OncoGridEventMap<TColumn, TRow, TEvent>[TKey]>) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener<TKey extends keyof OncoGridEventMap<TColumn, TRow, TEvent>>(
    type: TKey,
    listener: (event: CustomEvent<OncoGridEventMap<TColumn, TRow, TEvent>[TKey]>) => void,
    options?: boolean | EventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | EventListenerOptions
  ): void;
}

export default OncoGrid;
