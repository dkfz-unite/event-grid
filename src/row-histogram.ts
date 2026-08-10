import {
  D3Selection,
  Emit,
  InternalOptions,
  PositionedEvent,
  PositionedRow,
  RowEventStat,
  idKey
} from './internal-types';
import { EVENT_GRID_EVENTS } from './event-names';

function getRowEventStats(
  eventTypes: string[],
  rows: PositionedRow[],
  events: PositionedEvent[]
): RowEventStat[] {
  const statsByRow: Record<string, RowEventStat> = {};
  const allowed: Record<string, boolean> = {};
  eventTypes.forEach((type) => { allowed[type] = true; });

  const stats = rows.map((row) => {
    const stat: RowEventStat = { row, total: 0 };
    eventTypes.forEach((type) => { stat[type] = 0; });
    statsByRow[idKey(row.id)] = stat;
    return stat;
  });

  events.forEach((event) => {
    const stat = statsByRow[idKey(event.rowId)];
    if (!stat || !allowed[event.type]) return;
    stat[event.type] = Number(stat[event.type]) + 1;
    stat.total += 1;
  });
  return stats;
}

class RowHistogram {
  readonly emit: Emit;
  readonly svg: D3Selection;
  readonly prefix: string;
  readonly summaryEventTypes: string[];
  readonly colorMap: Record<string, string>;
  readonly lineWidthOffset: number;
  readonly histogramWidth: number;
  readonly totalWidth: number;

  events: PositionedEvent[];
  domain: PositionedRow[];
  height: number;
  offset: number;
  barHeight: number;
  topCount = 1;

  container: D3Selection;
  chart: D3Selection;
  leftAxis: D3Selection;
  topAxis: D3Selection;
  zeroText: D3Selection;
  topText: D3Selection;
  middleText: D3Selection;
  topLabel: D3Selection;

  constructor(
    params: InternalOptions,
    svgElement: D3Selection,
    events: PositionedEvent[],
    offset?: number
  ) {
    this.summaryEventTypes = params.summaryEventTypes || params.types || [];
    this.events = events || [];
    this.prefix = params.prefix || 'eg-';
    this.emit = params.emit;
    this.svg = svgElement;
    this.domain = params.rows || [];
    this.colorMap = params.colorMap || {};
    this.lineWidthOffset = (params.histogramBorderPadding || {}).left || 10;
    const width = params.width || 500;
    this.height = params.height || 500;
    this.offset = typeof offset === 'number' ? offset : width;
    this.histogramWidth = params.rowHistogramWidth || 80;
    this.barHeight = this.domain.length ? this.height / this.domain.length : 0;
    this.totalWidth = this.histogramWidth + this.lineWidthOffset + 20;
  }

  render(): void {
    this.container = this.svg.append('g')
      .attr('class', `${this.prefix}row-histogram`);
    this.chart = this.container.append('g')
      .attr('transform', `translate(${this.offset + this.lineWidthOffset},0)`);
    this.renderAxis();
    this.renderBars();
    this.bindInteractions();
  }

  private bindInteractions(): void {
    this.chart
      .on('mouseover', (domEvent: MouseEvent) => {
        const target = domEvent.target as HTMLElement;
        if (!target.dataset || !target.dataset.rowId) return;
        this.emit(EVENT_GRID_EVENTS.rowHistogramMouseOver, this.payloadFor(target));
      })
      .on('mouseout', () => {
        this.emit(EVENT_GRID_EVENTS.rowHistogramMouseOut, { axis: 'row' });
      })
      .on('click', (domEvent: MouseEvent) => {
        const target = domEvent.target as HTMLElement;
        if (!target.dataset || !target.dataset.rowId) return;
        this.emit(EVENT_GRID_EVENTS.rowHistogramClick, this.payloadFor(target));
      });
  }

  private payloadFor(target: HTMLElement): Record<string, unknown> {
    const rowId = target.dataset.rowId as string;
    const row = this.domain.find((item) => idKey(item.id) === rowId);
    return {
      axis: 'row',
      item: row,
      rowId,
      type: target.dataset.eventType,
      count: Number(target.dataset.count)
    };
  }

  renderBars(): void {
    if (!this.chart) return;
    this.chart.selectAll(`.${this.prefix}summary-bar`).remove();
    const stats = getRowEventStats(this.summaryEventTypes, this.domain, this.events);
    this.topCount = stats.reduce((largest, stat) => Math.max(largest, stat.total), 1);

    stats.forEach((stat) => {
      if (!stat.total) return;
      let xOffset = 0;
      this.summaryEventTypes.forEach((type) => {
        const count = Number(stat[type] || 0);
        if (!count) return;
        const barWidth = this.histogramWidth * count / this.topCount;
        this.chart.append('rect')
          .attr('class', `${this.prefix}summary-bar`)
          .attr('x', xOffset)
          .attr('y', stat.row.y)
          .attr('width', barWidth)
          .attr('height', Math.max(0, this.barHeight - (this.barHeight < 3 ? 0 : 1)))
          .attr('fill', this.colorMap[type] || '#ccc')
          .attr('data-row-id', stat.row.id)
          .attr('data-event-type', type)
          .attr('data-count', count);
        xOffset += barWidth;
      });
    });
    this.updateAxis();
  }

  private renderAxis(): void {
    this.leftAxis = this.chart.append('line').attr('class', `${this.prefix}histogram-axis`);
    this.topAxis = this.chart.append('line').attr('class', `${this.prefix}histogram-axis`);
    this.zeroText = this.chart.append('text')
      .attr('class', `${this.prefix}label-text-font`)
      .attr('dy', '.32em')
      .attr('text-anchor', 'start');
    this.topText = this.chart.append('text')
      .attr('class', `${this.prefix}label-text-font`)
      .attr('dy', '.32em')
      .attr('text-anchor', 'start');
    this.middleText = this.chart.append('text')
      .attr('class', `${this.prefix}label-text-font`)
      .attr('dy', '.32em')
      .attr('text-anchor', 'middle');
    this.topLabel = this.chart.append('text')
      .text('Event frequency')
      .attr('class', `${this.prefix}label-text-font`)
      .attr('text-anchor', 'middle');
  }

  private updateAxis(): void {
    if (!this.leftAxis) return;
    this.leftAxis.attr('x1', 0).attr('x2', 0).attr('y1', 0).attr('y2', this.height);
    this.topAxis.attr('x1', 0).attr('x2', this.histogramWidth).attr('y1', 0).attr('y2', 0);
    this.zeroText.attr('x', 0).attr('y', -8).text(0);
    this.topText.attr('x', this.histogramWidth).attr('y', -8).attr('text-anchor', 'end').text(this.topCount);
    const half = Math.floor(this.topCount / 2);
    this.middleText.attr('x', this.histogramWidth * half / this.topCount).attr('y', -8).text(half);
    this.topLabel.attr('x', this.histogramWidth / 2).attr('y', -20);
  }

  update(domain: PositionedRow[]): void {
    this.domain = domain;
    this.barHeight = domain.length ? this.height / domain.length : 0;
    this.renderBars();
  }

  resize(width: number, height: number, offset?: number): void {
    this.height = height;
    this.offset = typeof offset === 'number' ? offset : width;
    this.barHeight = this.domain.length ? height / this.domain.length : 0;
    if (!this.chart) return;
    this.chart.attr('transform', `translate(${this.offset + this.lineWidthOffset},0)`);
    this.renderBars();
  }

  destroy(): void {
    if (this.container) this.container.remove();
  }
}

export default RowHistogram;
