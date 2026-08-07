'use strict';

var columns = [
  { id: 'c1', label: 'Alpha', owner: 'Avery', capacity: 80 },
  { id: 'c2', label: 'Beta', owner: 'Blake', capacity: 55 },
  { id: 'c3', label: 'Gamma', owner: 'Casey', capacity: 90 }
];
var rows = [
  { id: 'r1', label: 'Planning', priority: 3 },
  { id: 'r2', label: 'Build', priority: 2 },
  { id: 'r3', label: 'Release', priority: 1 }
];
var events = [
  { id: 'e1', columnId: 'c1', rowId: 'r1', type: 'complete' },
  { id: 'e2', columnId: 'c1', rowId: 'r2', type: 'active' },
  { id: 'e3', columnId: 'c2', rowId: 'r2', type: 'blocked' },
  { id: 'e4', columnId: 'c3', rowId: 'r3', type: 'complete' }
];

function sortNumber(field) {
  return function (a, b) { return b[field] - a[field]; };
}

var grid = new OncoGrid({
  element: '#grid-div',
  columns: columns,
  rows: rows,
  events: events,
  height: 300,
  width: 650,
  heatMap: false,
  grid: true,
  columnTracks: [
    { name: 'Capacity', fieldName: 'capacity', group: 'Details', type: 'number', sort: sortNumber }
  ],
  rowTracks: [
    { name: 'Priority', fieldName: 'priority', group: 'Details', type: 'number', sort: sortNumber }
  ],
  columnFillFunc: function () { return '#90caf9'; },
  rowFillFunc: function () { return '#b0bec5'; }
});
grid.render();

function removeEmptyColumns() {
  grid.removeColumns(function (column) { return column.count === 0; });
}

function toggleCrosshair() { grid.toggleCrosshair(); }
function toggleGridLines() { grid.toggleGridLines(); }

function resize() {
  grid.resize(
    document.getElementById('width-resize').value,
    document.getElementById('height-resize').value
  );
}
