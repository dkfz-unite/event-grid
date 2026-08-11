import EventGrid from '../src';
import '../src/event-grid.css';
import sample, { SampleColumn, SampleEvent, SampleRow } from './data/sample-data';

function element<TElement extends HTMLElement>(id: string): TElement {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Missing playground element #${id}`);
  return found as TElement;
}

function sortNumber<TItem extends EventGrid.Item>(getValue: EventGrid.TrackValueGetter<TItem>) {
  return (a: TItem, b: TItem) => Number(getValue(b)) - Number(getValue(a));
}

function sortText<TItem extends EventGrid.Item>(getValue: EventGrid.TrackValueGetter<TItem>) {
  return (a: TItem, b: TItem) =>
    String(getValue(a)).localeCompare(String(getValue(b)));
}

const grid = new EventGrid<SampleColumn, SampleRow, SampleEvent>({
  element: '#grid',
  columns: sample.columns,
  rows: sample.rows,
  events: sample.events,
  width: 950,
  height: 600,
  leftTextWidth: 64,
  grid: true,
  eventStacking: 'v',
  trackHeight: 12,
  columnTracks: [
    { id: 'capacity', label: 'Capacity', field: 'capacity', fill: '#2e7d32', type: 'number', group: 'Column metadata', sort: sortNumber },
    { id: 'group', label: 'Group', field: (column) => column.metadata.group, colorPalette: ['#1565c0', '#ef6c00', '#6a1b9a'], type: 'text', group: 'Column metadata', sort: sortText }
  ],
  rowTracks: [
    { id: 'priority', label: 'Priority', field: 'priority', fill: '#607d8b', type: 'number', group: 'Row metadata', sort: sortNumber },
    { id: 'category', label: 'Category', field: (row) => row.metadata.category, colorMap: { Quality: '#c62828' }, type: 'text', group: 'Row metadata', sort: sortText }
  ]
});

grid.types.forEach((type) => {
  const item = document.createElement('span');
  item.style.setProperty('--color', grid.colorMap[type]);
  item.textContent = type;
  element('legend').appendChild(item);
});

const cellCounts: Record<string, number> = {};
sample.events.forEach((event) => {
  const cellKey = `${event.columnId}::${event.rowId}`;
  cellCounts[cellKey] = (cellCounts[cellKey] || 0) + 1;
});
const occupiedCells = Object.keys(cellCounts).length;
const multiEventCells = Object.values(cellCounts).filter((count) => count > 1).length;
const totalCells = sample.columns.length * sample.rows.length;

element('stats').textContent =
  `${sample.columns.length} columns × ${sample.rows.length} rows = ${totalCells}` +
  ` cells · ${sample.events.length} events · ${occupiedCells}` +
  ` occupied cells · ${totalCells - occupiedCells} empty cells · ` +
  `${multiEventCells} multi-event cells`;

function showPayload(event: CustomEvent<EventGrid.Cell<SampleColumn, SampleRow, SampleEvent>>) {
  const payload = event.detail;
  element('details').textContent = JSON.stringify({
    column: { id: payload.column.id, label: payload.column.label },
    row: { id: payload.row.id, label: payload.row.label },
    events: payload.events.map(({ id, type, score, note }) => ({ id, type, score, note }))
  }, null, 2);
}

grid.addEventListener(EventGrid.eventNames.gridMouseOver, showPayload);
grid.addEventListener(EventGrid.eventNames.gridClick, showPayload);
grid.addEventListener(EventGrid.eventNames.gridCrosshairMouseOver, showPayload);
element<HTMLButtonElement>('toggle-grid').onclick = () => grid.toggleGridLines();
element<HTMLButtonElement>('toggle-crosshair').onclick = () => grid.toggleCrosshair();
element<HTMLButtonElement>('toggle-heatmap').onclick = () => grid.toggleHeatmap();
element<HTMLButtonElement>('cluster').onclick = () => grid.cluster();
element<HTMLButtonElement>('reset').onclick = () => grid.reload();

grid.render();
