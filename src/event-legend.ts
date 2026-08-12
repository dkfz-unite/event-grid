import { eventTypeDetails } from './event-types';
import { D3Selection, InternalOptions, PositionedEvent } from './internal-types';

interface LegendItem {
  type: string;
  label: string;
  color: string;
}

class EventLegend {
  readonly svg: D3Selection;
  readonly prefix: string;
  readonly colorMap: Record<string, string>;
  readonly enabled: boolean;
  readonly padding = 20;
  readonly labelGap = 8;
  readonly itemGap = 4;

  events: PositionedEvent[];
  offset: number;
  cellHeight: number;
  width = 0;
  height = 0;
  container: D3Selection;

  constructor(
    params: InternalOptions,
    svg: D3Selection,
    events: PositionedEvent[],
    offset: number,
    cellHeight: number
  ) {
    this.svg = svg;
    this.prefix = params.prefix || 'eg-';
    this.colorMap = params.colorMap || {};
    this.enabled = params.legend !== false;
    this.events = events;
    this.offset = offset;
    this.cellHeight = cellHeight;
  }

  render(): void {
    if (this.container) this.container.remove();
    const items = this.items();
    if (!this.enabled || !items.length) {
      this.width = 0;
      this.height = 0;
      return;
    }

    const size = this.cellHeight;
    this.container = this.svg.append('g')
      .attr('class', `${this.prefix}event-legend`)
      .attr('transform', `translate(${this.offset + this.padding},0)`);

    let longestLabelWidth = 0;
    items.forEach((item, index) => {
      const row = this.container.append('g')
        .attr('class', `${this.prefix}legend-item`)
        .attr('data-event-type', item.type)
        .attr('transform', `translate(0,${index * (size + this.itemGap)})`);
      row.append('rect')
        .attr('class', `${this.prefix}legend-swatch`)
        .attr('width', size)
        .attr('height', size)
        .attr('fill', item.color);
      const label = row.append('text')
        .attr('class', `${this.prefix}legend-label ${this.prefix}label-text-font`)
        .attr('x', size + this.labelGap)
        .attr('y', size / 2)
        .attr('dy', '.32em')
        .text(item.label);
      const labelNode = label.node() as SVGTextContentElement | null;
      const labelWidth = labelNode && typeof labelNode.getComputedTextLength === 'function'
        ? labelNode.getComputedTextLength()
        : item.label.length * 6;
      longestLabelWidth = Math.max(longestLabelWidth, labelWidth);
    });

    this.width = this.padding + size + this.labelGap + longestLabelWidth;
    this.height = items.length * size + Math.max(0, items.length - 1) * this.itemGap;
  }

  update(events: PositionedEvent[], offset: number, cellHeight: number): void {
    this.events = events;
    this.offset = offset;
    this.cellHeight = cellHeight;
    this.render();
  }

  private items(): LegendItem[] {
    return eventTypeDetails(this.events).map(({ type, label }) => ({
      type,
      label,
      color: this.colorMap[type] || this.colorMap.default || '#0067a5'
    }));
  }
}

export default EventLegend;
