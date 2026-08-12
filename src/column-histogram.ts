import {
  ColumnEventStat,
  D3Selection,
  Emit,
  InternalOptions,
  PositionedColumn,
  PositionedEvent,
  idKey
} from './internal-types';
import { EVENT_GRID_EVENTS } from './event-names';
import { HistogramInteractionPayload } from './types';

function getColumnEventStats(
  eventTypes: string[],
  columns: PositionedColumn[],
  events: PositionedEvent[]
): ColumnEventStat[] {
  const statsByColumn: Record<string, ColumnEventStat> = {};
  const allowed: Record<string, boolean> = {};
  eventTypes.forEach((type) => { allowed[type] = true; });

  const stats = columns.map((column) => {
    const stat: ColumnEventStat = { column, total: 0 };
    eventTypes.forEach((type) => { stat[type] = 0; });
    statsByColumn[idKey(column.id)] = stat;
    return stat;
  });

  events.forEach((event) => {
    const stat = statsByColumn[idKey(event.columnId)];
    if (!stat || !allowed[event.type]) return;
    stat[event.type] = Number(stat[event.type]) + 1;
    stat.total += 1;
  });
  return stats;
}

function getLargestCount(stats: ColumnEventStat[]): number {
  return stats.reduce((largest, stat) => Math.max(largest, stat.total), 1);
}

class ColumnHistogram {
  readonly emit: Emit;
  readonly svg: D3Selection;
  readonly prefix: string;
  readonly summaryEventTypes: string[];
  readonly colorMap: Record<string, string>;
  readonly histogramHeight = 80;
  readonly padding = 20;
  readonly centerText = -6;
  readonly lineHeightOffset: number;
  readonly totalHeight: number;

  items: PositionedColumn[];
  events: PositionedEvent[];
  stats: ColumnEventStat[] = [];
  histogramWidth: number;
  barWidth: number;
  topCount = 1;

  container: D3Selection;
  histogram: D3Selection;
  bottomAxis: D3Selection;
  leftAxis: D3Selection;
  topText: D3Selection;
  middleText: D3Selection;
  leftLabel: D3Selection;

  constructor(params: InternalOptions, svg: D3Selection) {
    const borderPadding = params.histogramBorderPadding || {};
    this.lineHeightOffset = borderPadding.bottom ?? 5;
    this.prefix = params.prefix || 'eg-';
    this.emit = params.emit;
    this.svg = svg;
    this.items = params.columns || [];
    this.events = params.events || [];
    this.summaryEventTypes = params.summaryEventTypes || params.types || [];
    this.colorMap = params.colorMap || {};
    this.histogramWidth = params.width || 500;
    this.barWidth = this.items.length ? this.histogramWidth / this.items.length : 0;
    this.totalHeight = this.histogramHeight + this.lineHeightOffset + this.padding;
  }

  render(): void {
    this.refreshStats();
    this.container = this.svg.append('g')
      .attr('class', `${this.prefix}histogram ${this.prefix}column-histogram`);
    this.histogram = this.container.append('g')
      .attr('transform', `translate(0,-${this.histogramHeight + this.padding})`);
    this.renderAxis();
    this.renderBars();
    this.bindInteractions();
  }

  private bindInteractions(): void {
    this.histogram
      .on('mouseover', (domEvent: MouseEvent) => {
        const target = domEvent.target as SVGRectElement;
        const index = target.dataset && target.dataset.itemIndex;
        if (typeof index === 'undefined' || !this.items[Number(index)]) return;
        const payload = this.payloadFor(target, Number(index));
        this.emit(EVENT_GRID_EVENTS.columnHistogramMouseOver, payload);
      })
      .on('mouseout', () => {
        this.emit(EVENT_GRID_EVENTS.columnHistogramMouseOut, { axis: 'column' });
      })
      .on('click', (domEvent: MouseEvent) => {
        const target = domEvent.target as SVGRectElement;
        const index = target.dataset && target.dataset.itemIndex;
        if (typeof index === 'undefined' || !this.items[Number(index)]) return;
        const payload = this.payloadFor(target, Number(index));
        this.emit(EVENT_GRID_EVENTS.columnHistogramClick, payload);
      });
  }

  private payloadFor(target: SVGRectElement, index: number): HistogramInteractionPayload<'column'> {
    return {
      element: target,
      data: {
        axis: 'column',
        itemId: this.items[index].id,
        type: target.dataset.eventType || '',
        count: Number(target.dataset.count)
      }
    };
  }

  renderBars(): void {
    if (!this.histogram) return;
    this.histogram.selectAll(`.${this.prefix}histogram-bar`).remove();

    this.stats.forEach((stat, index) => {
      let yOffset = this.histogramHeight;
      this.summaryEventTypes.forEach((type) => {
        const count = Number(stat[type] || 0);
        if (!count) return;
        const barHeight = this.histogramHeight * count / this.topCount;
        yOffset -= barHeight;
        this.histogram.append('rect')
          .attr('class', `${this.prefix}histogram-bar ${this.prefix}summary-bar`)
          .attr('data-item-index', index)
          .attr('data-column-id', stat.column.id)
          .attr('data-event-type', type)
          .attr('data-count', count)
          .attr('width', Math.max(0, this.barWidth - (this.barWidth < 3 ? 0 : 1)))
          .attr('height', barHeight)
          .attr('x', stat.column.x)
          .attr('y', yOffset)
          .attr('fill', this.colorMap[type] || '#ccc');
      });
    });
  }

  update(items: PositionedColumn[]): void {
    this.items = items;
    this.barWidth = items.length ? this.histogramWidth / items.length : 0;
    this.refreshStats();
    if (!this.histogram) return;
    this.updateAxis();
    this.renderBars();
  }

  resize(width: number): void {
    this.histogramWidth = width;
    this.barWidth = this.items.length ? this.histogramWidth / this.items.length : 0;
    if (!this.container) return;
    this.histogram.attr('transform', `translate(0,-${this.histogramHeight + this.padding})`);
    this.updateAxis();
    this.renderBars();
  }

  private refreshStats(): void {
    this.stats = getColumnEventStats(this.summaryEventTypes, this.items, this.events);
    this.topCount = getLargestCount(this.stats);
  }

  private renderAxis(): void {
    this.bottomAxis = this.histogram.append('line').attr('class', `${this.prefix}histogram-axis`);
    this.leftAxis = this.histogram.append('line').attr('class', `${this.prefix}histogram-axis`);
    this.topText = this.histogram.append('text')
      .attr('class', `${this.prefix}label-text-font`)
      .attr('dy', '.32em')
      .attr('text-anchor', 'end');
    this.middleText = this.histogram.append('text')
      .attr('class', `${this.prefix}label-text-font`)
      .attr('dy', '.32em')
      .attr('text-anchor', 'end');
    this.leftLabel = this.histogram.append('text')
      .text('Event frequency')
      .attr('class', `${this.prefix}label-text-font`)
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)');
    this.updateAxis();
  }

  private updateAxis(): void {
    if (!this.bottomAxis) return;
    this.bottomAxis
      .attr('y1', this.histogramHeight + this.lineHeightOffset)
      .attr('y2', this.histogramHeight + this.lineHeightOffset)
      .attr('x2', this.histogramWidth + (this.lineHeightOffset * 2))
      .attr('transform', `translate(-${this.lineHeightOffset},0)`);
    this.leftAxis
      .attr('y1', 0)
      .attr('y2', this.histogramHeight + this.lineHeightOffset)
      .attr('transform', `translate(-${this.lineHeightOffset},0)`);
    this.topText.attr('x', this.centerText).text(this.topCount);
    const half = Math.floor(this.topCount / 2);
    const middleHeight = half
      ? this.histogramHeight - (this.histogramHeight * half / this.topCount)
      : this.histogramHeight;
    this.middleText.attr('x', this.centerText).attr('y', middleHeight).text(half);
    this.leftLabel
      .attr('x', -this.histogramHeight / 2)
      .attr('y', -this.lineHeightOffset - this.padding);
  }

}

export default ColumnHistogram;
