import d3 from 'd3';
import { ONCOGRID_EVENTS } from './event-names';
import {
  D3Scale,
  D3Selection,
  InternalTrack,
  PositionedColumn,
  PositionedRow,
  ResizeCallback,
  TrackData,
  TrackFillCallback,
  TrackGroupOptions,
  TrackOpacityCallback,
  UpdateCallback,
  idKey
} from './internal-types';

class TrackGroup {
  readonly emit;
  readonly prefix: string;
  readonly expandable: boolean;
  readonly name: string;
  readonly cellHeight: number;
  readonly nullSentinel: unknown;
  readonly rotated: boolean;
  readonly updateCallback: UpdateCallback;
  readonly resizeCallback: ResizeCallback;
  readonly trackLegendLabel: string;
  readonly opacityFunc: TrackOpacityCallback;
  readonly fillFunc: TrackFillCallback;

  width: number;
  height = 0;
  totalHeight = 0;
  length = 0;
  rendered = false;
  drawGridLines: boolean;
  domain: Array<PositionedColumn | PositionedRow>;
  numDomain: number;
  tracks: InternalTrack[] = [];
  collapsedTracks: InternalTrack[] = [];
  trackData: TrackData[] = [];
  cellWidth = 0;

  container: D3Selection;
  legend: D3Selection;
  background: D3Selection;
  column: D3Selection;
  row: D3Selection;
  y: D3Scale;

  constructor(
    params: TrackGroupOptions,
    name: string,
    rotated: boolean,
    opacityFunc: TrackOpacityCallback,
    fillFunc: TrackFillCallback,
    updateCallback: UpdateCallback,
    resizeCallback: ResizeCallback
  ) {
    this.emit = params.emit;
    this.prefix = params.prefix || 'og-';
    this.expandable = params.expandable;
    this.name = name;
    this.cellHeight = params.cellHeight || 20;
    this.width = params.width;
    this.nullSentinel = params.nullSentinel;
    this.rotated = rotated;
    this.updateCallback = updateCallback;
    this.resizeCallback = resizeCallback;
    this.trackLegendLabel = params.trackLegendLabel;
    this.opacityFunc = opacityFunc;
    this.fillFunc = fillFunc;
    this.drawGridLines = params.grid || false;
    this.domain = params.domain;
    this.numDomain = this.domain.length;
  }

  addTrack(input: InternalTrack | InternalTrack[]): void {
    const incoming = Array.isArray(input) ? input : [input];
    incoming.forEach((track) => {
      if (!this.rendered && track.collapsed && this.expandable) {
        this.collapsedTracks.push(track);
      } else {
        this.tracks.push(track);
      }
    });

    this.collapsedTracks = this.collapsedTracks.filter((collapsed) =>
      !this.tracks.some((track) => collapsed.fieldName === track.fieldName));

    const fields: Record<string, boolean> = {};
    this.tracks = this.tracks.filter((track) => {
      if (fields[track.fieldName]) return false;
      fields[track.fieldName] = true;
      return true;
    });

    this.length = this.tracks.length;
    this.height = this.cellHeight * this.length;
    if (this.rendered) {
      this.refreshData();
      this.resizeCallback();
    }
  }

  removeTrack(index: number): void {
    const removed = this.tracks.splice(index, 1);
    this.collapsedTracks = this.collapsedTracks.concat(removed);
    this.length = this.tracks.length;
    this.refreshData();
    this.resizeCallback();
  }

  refreshData(): void {
    this.trackData = [];
    this.domain.forEach((item, domainIndex) => {
      this.tracks.forEach((track) => {
        const value = item[track.fieldName];
        const isNullSentinel = value === this.nullSentinel;
        this.trackData.push({
          id: item.id,
          label: typeof item.label === 'undefined' ? String(item.id) : item.label,
          domainIndex,
          value,
          valueLabel: isNullSentinel ? 'Not available' : value,
          notNullSentinel: !isNullSentinel,
          trackLabel: track.name,
          fieldName: track.fieldName,
          type: track.type
        });
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

    const legendObject = this.container.append('svg:foreignObject').attr('width', 20).attr('height', 20);
    this.legend = legendObject
      .attr('x', 0)
      .attr('y', -22)
      .append('xhtml:div')
      .html(this.trackLegendLabel);

    this.background = this.container.append('rect')
      .attr('class', 'background')
      .attr('width', this.width)
      .attr('height', this.height);
    this.refreshData();
    this.totalHeight = this.height + (this.collapsedTracks.length ? this.cellHeight : 0);
  }

  render(): void {
    this.rendered = true;
    this.computeCoordinates();
    this.cellWidth = this.domain.length ? this.width / this.domain.length : 0;
    this.renderData();
    this.legend
      .on('mouseover', () => this.emit(ONCOGRID_EVENTS.trackLegendMouseOver, { group: this.name }))
      .on('mouseout', () => this.emit(ONCOGRID_EVENTS.trackLegendMouseOut));
  }

  update(domain: Array<PositionedColumn | PositionedRow>): void {
    this.domain = domain;
    if (domain.length !== this.numDomain) {
      this.numDomain = domain.length;
      this.cellWidth = this.numDomain ? this.width / this.numDomain : 0;
    }

    const positions: Record<string, number> = {};
    domain.forEach((item, index) => { positions[idKey(item.id)] = index; });
    this.trackData = this.trackData.filter((data) => {
      const domainIndex = positions[idKey(data.id)];
      if (typeof domainIndex === 'undefined') return false;
      data.domainIndex = domainIndex;
      return true;
    });

    this.computeCoordinates();
    this.container.selectAll(`.${this.prefix}track-data`)
      .data(this.trackData)
      .attr('x', (data: TrackData) => this.itemPosition(this.domain[data.domainIndex]))
      .attr('data-track-data-index', (_data: TrackData, index: number) => index)
      .attr('width', this.cellWidth);
  }

  resize(width: number): void {
    this.width = width;
    this.height = this.cellHeight * this.length;
    this.cellWidth = this.domain.length ? this.width / this.domain.length : 0;
    this.background.attr('class', 'background').attr('width', this.width).attr('height', this.height);
    this.computeCoordinates();
    this.totalHeight = this.height + (this.collapsedTracks.length ? this.cellHeight : 0);
    this.renderData();
  }

  computeCoordinates(): void {
    this.y = d3.scale.ordinal().domain(d3.range(this.length)).rangeBands([0, this.height]);
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
      .attr('transform', (_track: InternalTrack, index: number) => `translate(0,${this.y(index)})`);

    if (this.drawGridLines) this.row.append('line').style('pointer-events', 'none').attr('x2', this.width);
    const labels = this.row.append('text');
    labels
      .attr('class', `${this.prefix}track-label ${this.prefix}label-text-font`)
      .on('click', (track: InternalTrack) => {
        if (!track.sort) return;
        this.domain.sort(track.sort(track.fieldName));
        this.updateCallback(false);
      })
      .transition()
      .attr('x', -6)
      .attr('y', this.cellHeight / 2)
      .attr('dy', '.32em')
      .attr('text-anchor', 'end')
      .text((track: InternalTrack) => track.name);

    if (this.expandable) this.renderRemoveTrackButtons(labels);
    this.renderAddTrackButton();
  }

  private renderRemoveTrackButtons(labels: D3Selection): void {
    setTimeout(() => {
      const className = `${this.prefix}remove-track`;
      this.container.selectAll(`.${className}`).remove();
      const textLengths: Record<string, number> = {};
      labels.each(function (this: SVGTextElement, track: InternalTrack) {
        textLengths[track.name] = this.getComputedTextLength();
      });
      this.row.append('text')
        .attr('class', className)
        .text('-')
        .attr('y', this.cellHeight / 2)
        .attr('dy', '.32em')
        .on('click', (_track: InternalTrack, index: number) => this.removeTrack(index))
        .attr('x', function (this: SVGTextElement, track: InternalTrack) {
          return -(textLengths[track.name] + 12 + this.getComputedTextLength());
        });
    });
  }

  private renderAddTrackButton(): void {
    let addButton = this.container.selectAll(`.${this.prefix}add-track`);
    if (this.collapsedTracks.length && this.expandable) {
      if (addButton.empty()) {
        addButton = this.container.append('text')
          .text('+')
          .attr('class', `${this.prefix}add-track`)
          .attr('x', -6)
          .attr('dy', '.32em')
          .attr('text-anchor', 'end')
          .on('click', () => this.emit(ONCOGRID_EVENTS.addTrackClick, {
            hiddenTracks: this.collapsedTracks.slice(),
            addTrack: this.addTrack.bind(this)
          }));
      }
      addButton.attr('y', this.cellHeight / 2 +
        (this.length ? this.cellHeight + this.y(this.length - 1) : 0));
    } else {
      addButton.remove();
    }
  }

  setGridLines(active: boolean): void {
    if (this.drawGridLines === active) return;
    this.drawGridLines = active;
    this.computeCoordinates();
  }

  renderData(): void {
    const selection = this.container.selectAll(`.${this.prefix}track-data`).data(this.trackData);
    selection.enter().append('rect');

    const yIndexLookup: Record<string, number> = {};
    this.tracks.forEach((track, index) => { yIndexLookup[track.fieldName] = index; });
    this.bindDataInteractions();

    selection
      .attr('data-track-data-index', (_data: TrackData, index: number) => index)
      .attr('x', (data: TrackData) => this.itemPosition(this.domain[data.domainIndex]))
      .attr('y', (data: TrackData) => this.y(yIndexLookup[data.fieldName]))
      .attr('width', this.cellWidth)
      .attr('height', this.cellHeight)
      .attr('fill', this.fillFunc)
      .attr('opacity', this.opacityFunc)
      .attr('class', (data: TrackData) =>
        `${this.prefix}track-data ${this.prefix}track-${data.fieldName} ${this.prefix}track-${data.value}`);
    selection.exit().remove();
  }

  private bindDataInteractions(): void {
    this.container
      .on('click', () => this.emitTrackInteraction('Click'))
      .on('mouseover', () => this.emitTrackInteraction('MouseOver'))
      .on('mouseout', () => {
        const axis = this.rotated ? 'row' : 'column';
        const axisEvent = axis === 'column'
          ? ONCOGRID_EVENTS.columnTrackMouseOut
          : ONCOGRID_EVENTS.rowTrackMouseOut;
        this.emit(axisEvent, { axis });
      });
  }

  private emitTrackInteraction(suffix: 'Click' | 'MouseOver'): void {
    const target = d3.event.target as HTMLElement;
    const index = target.dataset && target.dataset.trackDataIndex;
    const item = typeof index === 'undefined' ? undefined : this.trackData[Number(index)];
    if (!item) return;
    const axis = this.rotated ? 'row' : 'column';
    const payload = { item, axis };
    const axisEvent = axis === 'column'
      ? suffix === 'Click' ? ONCOGRID_EVENTS.columnTrackClick : ONCOGRID_EVENTS.columnTrackMouseOver
      : suffix === 'Click' ? ONCOGRID_EVENTS.rowTrackClick : ONCOGRID_EVENTS.rowTrackMouseOver;
    this.emit(axisEvent, payload);
  }

  private itemPosition(item: PositionedColumn | PositionedRow): number {
    return this.rotated ? (item as PositionedRow).y : (item as PositionedColumn).x;
  }
}

export default TrackGroup;
