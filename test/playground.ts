import EventGrid from '../src';
import '../src/event-grid.css';
import sample, { SampleColumn, SampleEvent, SampleRow } from './data/sample-data';

function element<TElement extends HTMLElement>(id: string): TElement {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Missing playground element #${id}`);
  return found as TElement;
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
    { id: 'capacity', label: 'Capacity', field: 'capacity', fill: '#2e7d32', type: 'number', group: 'Column metadata' },
    { id: 'group', label: 'Group', field: (column) => column.metadata.group, colorPalette: ['#1565c0', '#ef6c00', '#6a1b9a'], type: 'text', group: 'Column metadata' }
  ],
  rowTracks: [
    { id: 'priority', label: 'Priority', field: 'priority', fill: '#607d8b', type: 'number', group: 'Row metadata' },
    { id: 'category', label: 'Category', field: (row) => row.metadata.category, colorMap: { Quality: '#c62828' }, type: 'text', group: 'Row metadata' }
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

function showPayload(event: CustomEvent<EventGrid.GridInteraction<SampleEvent>>) {
  const { element: source, data } = event.detail;
  element('details').textContent = JSON.stringify({
    element: source.tagName.toLowerCase(),
    event: data
  }, null, 2);
}

function showCrosshairPayload(event: CustomEvent<EventGrid.CrosshairInteraction<SampleEvent>>) {
  const { element: source, data } = event.detail;
  element('details').textContent = JSON.stringify({
    element: source.tagName.toLowerCase(),
    cell: data
  }, null, 2);
}

grid.addEventListener(EventGrid.eventNames.gridMouseOver, showPayload);
grid.addEventListener(EventGrid.eventNames.gridClick, showPayload);
grid.addEventListener(EventGrid.eventNames.gridCrosshairMouseOver, showCrosshairPayload);
element<HTMLButtonElement>('toggle-grid').onclick = () => grid.toggleGridLines();
element<HTMLButtonElement>('toggle-crosshair').onclick = () => grid.toggleCrosshair();
element<HTMLButtonElement>('toggle-heatmap').onclick = () => grid.toggleHeatmap();
element<HTMLButtonElement>('cluster').onclick = () => grid.cluster();
element<HTMLButtonElement>('reset').onclick = () => grid.reload();

grid.render();
