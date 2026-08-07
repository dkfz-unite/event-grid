import OncoGrid from '../src';
import '../src/oncogrid.css';

interface SampleColumn extends OncoGrid.Item {
  owner: string;
  group: string;
  capacity: number;
}

interface SampleRow extends OncoGrid.Item {
  category: string;
  priority: number;
}

interface SampleEvent extends OncoGrid.Event {
  score: number;
  note?: string;
}

interface SampleData {
  columns: SampleColumn[];
  rows: SampleRow[];
  events: SampleEvent[];
}

declare global {
  interface Window {
    OncoGridSampleData: SampleData;
  }
}

const sample = window.OncoGridSampleData;

function element<TElement extends HTMLElement>(id: string): TElement {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Missing playground element #${id}`);
  return found as TElement;
}

function sortNumber(field: string) {
  return (a: SampleColumn | SampleRow, b: SampleColumn | SampleRow) =>
    Number(b[field]) - Number(a[field]);
}

function sortText(field: string) {
  return (a: SampleColumn | SampleRow, b: SampleColumn | SampleRow) =>
    String(a[field]).localeCompare(String(b[field]));
}

function trackFill(data: OncoGrid.TrackItem): string {
  if (data.fieldName === 'capacity') {
    const value = Number(data.value);
    return value >= 75 ? '#2e7d32' : value >= 55 ? '#66bb6a' : '#c8e6c9';
  }
  if (data.fieldName === 'priority') {
    return ['#eceff1', '#cfd8dc', '#b0bec5', '#90a4ae', '#78909c'][Number(data.value) - 1];
  }
  return '#b3e5fc';
}

const grid = new OncoGrid<SampleColumn, SampleRow, SampleEvent>({
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
    { name: 'Capacity', fieldName: 'capacity', type: 'number', group: 'Column metadata', sort: sortNumber },
    { name: 'Group', fieldName: 'group', type: 'text', group: 'Column metadata', sort: sortText }
  ],
  rowTracks: [
    { name: 'Priority', fieldName: 'priority', type: 'number', group: 'Row metadata', sort: sortNumber },
    { name: 'Category', fieldName: 'category', type: 'text', group: 'Row metadata', sort: sortText }
  ],
  columnFillFunc: trackFill,
  rowFillFunc: trackFill
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

function showPayload(event: CustomEvent<OncoGrid.Cell<SampleColumn, SampleRow, SampleEvent>>) {
  const payload = event.detail;
  element('details').textContent = JSON.stringify({
    column: { id: payload.column.id, label: payload.column.label },
    row: { id: payload.row.id, label: payload.row.label },
    events: payload.events.map(({ id, type, score, note }) => ({ id, type, score, note }))
  }, null, 2);
}

grid.addEventListener(OncoGrid.eventNames.gridMouseOver, showPayload);
grid.addEventListener(OncoGrid.eventNames.gridClick, showPayload);
grid.addEventListener(OncoGrid.eventNames.gridCrosshairMouseOver, showPayload);
element<HTMLButtonElement>('toggle-grid').onclick = () => grid.toggleGridLines();
element<HTMLButtonElement>('toggle-crosshair').onclick = () => grid.toggleCrosshair();
element<HTMLButtonElement>('toggle-heatmap').onclick = () => grid.toggleHeatmap();
element<HTMLButtonElement>('cluster').onclick = () => grid.cluster();
element<HTMLButtonElement>('reset').onclick = () => window.location.reload();

grid.render();
