import TrackGroup from './track-group';
import {
  D3Selection,
  InternalOptions,
  InternalTrack,
  PositionedColumn,
  PositionedRow,
  ResizeCallback,
  TrackFillCallback,
  TrackOpacityCallback,
  UpdateCallback
} from './internal-types';

class Track {
  readonly emit;
  readonly prefix: string;
  readonly svg: D3Selection;
  readonly rotated: boolean;
  readonly updateCallback: UpdateCallback;
  readonly resizeCallback: ResizeCallback;
  readonly expandableGroups: string[];
  readonly trackLegendLabel: string;
  readonly cellHeight: number;
  readonly availableTracks: InternalTrack[];
  readonly opacityFunc: TrackOpacityCallback;
  readonly fillFunc: TrackFillCallback;
  readonly nullSentinel: unknown;
  readonly padding: number;

  offset: number;
  width: number;
  height = 0;
  drawGridLines: boolean;
  domain: Array<PositionedColumn | PositionedRow>;
  groupMap: Record<string, TrackGroup> = {};
  groups: TrackGroup[] = [];
  container: D3Selection;

  constructor(
    params: InternalOptions,
    svg: D3Selection,
    rotated: boolean,
    tracks: InternalTrack[] | undefined,
    opacityFunc: TrackOpacityCallback | undefined,
    fillFunc: TrackFillCallback | undefined,
    updateCallback: UpdateCallback,
    offset: number,
    resizeCallback: ResizeCallback
  ) {
    this.emit = params.emit;
    this.padding = params.trackPadding ?? 20;
    this.offset = offset;
    this.prefix = params.prefix || 'eg-';
    this.svg = svg;
    this.rotated = rotated;
    this.updateCallback = updateCallback;
    this.resizeCallback = resizeCallback;
    this.expandableGroups = params.expandableGroups || [];
    this.trackLegendLabel = params.trackLegendLabel || '';
    this.domain = rotated ? params.rows : params.columns;
    this.width = (rotated ? params.height : params.width) || 500;
    this.cellHeight = params.trackHeight ?? 10;
    this.availableTracks = tracks || [];
    this.opacityFunc = opacityFunc || (() => 1);
    this.fillFunc = fillFunc || (() => '#6d72c5');
    this.drawGridLines = params.grid || false;
    this.nullSentinel = params.nullSentinel ?? -777;
    this.parseGroups();
  }

  private parseGroups(): void {
    this.availableTracks.forEach((track) => {
      const groupName = track.group || 'Tracks';
      const existing = this.groupMap[groupName];
      if (existing) {
        existing.addTrack(track);
        return;
      }

      const group = new TrackGroup({
        emit: this.emit,
        prefix: this.prefix,
        cellHeight: this.cellHeight,
        width: this.width,
        grid: this.drawGridLines,
        nullSentinel: this.nullSentinel,
        domain: this.domain,
        trackLegendLabel: this.trackLegendLabel,
        expandable: this.expandableGroups.indexOf(groupName) >= 0
      }, groupName, this.rotated, this.opacityFunc, this.fillFunc,
      this.updateCallback, this.resizeCallback);
      group.addTrack(track);
      this.groupMap[groupName] = group;
      this.groups.push(group);
    });
  }

  init(): void {
    this.container = this.svg.append('g');
    const labelHeight = this.rotated && this.groups.length > 0 ? 16.5 : 0;
    this.height = 0;

    this.groups.forEach((group) => {
      const trackContainer = this.container.append('g')
        .attr('transform', `translate(0,${this.height})`);
      group.init(trackContainer);
      this.height += Number(group.totalHeight) + this.padding;
    });

    const translateDown = this.rotated ? -(this.offset + this.height) : this.padding + this.offset;
    this.container
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('class', `${this.prefix}track`)
      .attr('transform', `${this.rotated ? 'rotate(90)' : ''}translate(0,${translateDown})`);
    this.height += labelHeight;
  }

  render(): void {
    this.groups.forEach((group) => group.render());
  }

  resize(width: number, height: number, offset?: number): void {
    if (typeof offset === 'number') this.offset = offset;
    this.width = this.rotated ? height : width;
    this.height = 0;
    const labelHeight = this.rotated ? 16.5 : 0;

    this.groups.forEach((group) => {
      group.container.attr('transform', `translate(0,${this.height})`);
      group.resize(this.width);
      this.height += Number(group.totalHeight) + this.padding;
    });

    const translateDown = this.rotated ? -(this.offset + this.height) : this.padding + this.offset;
    this.container
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('transform', `${this.rotated ? 'rotate(90)' : ''}translate(0,${translateDown})`);
    this.height += labelHeight;
  }

  update(domain: Array<PositionedColumn | PositionedRow>): void {
    this.domain = domain;
    this.groups.forEach((group) => group.update(domain));
  }

  setGridLines(active: boolean): void {
    this.groups.forEach((group) => group.setGridLines(active));
  }
}

export default Track;
