/* global chai, EventGrid */
var expect = chai.expect;

describe('Tracks', function () {
  function dispatch(target, name) {
    target.dispatchEvent(new MouseEvent(name, { bubbles: true, cancelable: true }));
  }

  it('reads arbitrary metadata from columns and rows', function () {
    var grid = new EventGrid({
      element: '#test6',
      columns: [
        { id: 'c1', label: 'Alpha', metadata: { owner: 'Avery' } },
        { id: 'c2', label: 'Beta', metadata: { owner: 'Blake' } }
      ],
      rows: [{ id: 'r1', label: 'First', priority: 2 }],
      events: [{ id: 'e1', columnId: 'c1', rowId: 'r1', type: 'ok' }],
      columnTracks: [{
        id: 'owner',
        label: 'Owner',
        field: function (column) { return column.metadata.owner; },
        fill: '#123456',
        type: 'text'
      }],
      rowTracks: [{
        id: 'priority',
        label: 'Priority',
        field: 'priority',
        fill: '#654321',
        type: 'number'
      }]
    });
    grid.render();

    var trackCells = document.querySelectorAll('#test6 .eg-track-data');
    expect(trackCells.length).to.equal(3);
    expect(grid.mainGrid.columnTrack.groups[0].trackData[0].label).to.equal('Alpha');
    expect(grid.mainGrid.columnTrack.groups[0].trackData[0].value).to.equal('Avery');
    expect(grid.mainGrid.columnTrack.groups[0].trackData[0].fill).to.equal('#123456');
    expect(grid.mainGrid.rowTrack.groups[0].trackData[0].value).to.equal(2);
    expect(grid.mainGrid.rowTrack.groups[0].trackData[0].fill).to.equal('#654321');
    grid.destroy();
  });

  it('scales numeric and numeric-string values through the default opacity range', function () {
    var grid = new EventGrid({
      element: '#test6',
      columns: [
        { id: 'c1', metric: '10' },
        { id: 'c2', metric: '20' },
        { id: 'c3', metric: 15 }
      ],
      rows: [],
      events: [],
      columnTracks: [{ id: 'score', label: 'Score', field: 'metric' }]
    });
    grid.render();

    var data = grid.mainGrid.columnTrack.groups[0].trackData;
    expect(data.map(function (item) { return item.fill; })).to.deep.equal([
      '#6d72c5', '#6d72c5', '#6d72c5'
    ]);
    expect(data[0].opacity).to.equal(0.2);
    expect(data[1].opacity).to.equal(1);
    expect(data[2].opacity).to.be.closeTo(0.6, 0.000001);
    grid.destroy();
  });

  it('uses null as the unavailable track value without reserving numeric sentinels', function () {
    var grid = new EventGrid({
      element: '#test6',
      columns: [
        { id: 'c1', metric: null },
        { id: 'c2', metric: -777 }
      ],
      rows: [],
      events: [],
      columnTracks: [{ id: 'metric', label: 'Metric', field: 'metric' }]
    });
    grid.render();

    var data = grid.mainGrid.columnTrack.groups[0].trackData;
    var missing = data.find(function (item) { return item.id === 'c1'; });
    var negative = data.find(function (item) { return item.id === 'c2'; });
    expect(missing.valueLabel).to.equal('Not available');
    expect(missing.opacity).to.equal(0.2);
    expect(negative.valueLabel).to.equal(-777);
    expect(negative.opacity).to.equal(1);
    grid.destroy();
  });

  it('maps categorical values through palettes, maps, and custom opacity', function () {
    var grid = new EventGrid({
      element: '#test6',
      columns: [
        { id: 'c1', status: 'ready' },
        { id: 'c2', status: 'blocked' },
        { id: 'c3', status: 'ready' }
      ],
      rows: [],
      events: [],
      columnTracks: [{
        id: 'status',
        label: 'Status',
        field: 'status',
        colorPalette: ['#111111', '#222222'],
        colorMap: { blocked: '#ff0000' },
        opacityFunction: function (item) { return item.value === 'ready' ? 0.4 : 1; }
      }]
    });
    grid.render();

    var data = grid.mainGrid.columnTrack.groups[0].trackData;
    expect(data.map(function (item) { return item.fill; })).to.deep.equal([
      '#111111', '#ff0000', '#111111'
    ]);
    expect(data.map(function (item) { return item.opacity; })).to.deep.equal([0.4, 1, 0.4]);
    grid.destroy();
  });

  it('emits separate row and column track events', function () {
    var grid = new EventGrid({
      element: '#test6',
      columns: [{ id: 'c1', owner: 'Avery' }],
      rows: [{ id: 'r1', priority: 2 }],
      events: [],
      columnTracks: [{ id: 'owner', label: 'Owner', field: 'owner', type: 'text' }],
      rowTracks: [{ id: 'priority', label: 'Priority', field: 'priority', type: 'number' }]
    });
    var columnHover;
    var columnClick;
    var rowHover;
    var rowClick;
    var events = EventGrid.eventNames;
    grid.addEventListener(events.columnTrackMouseOver, function (event) { columnHover = event.detail; });
    grid.addEventListener(events.columnTrackClick, function (event) { columnClick = event.detail; });
    grid.addEventListener(events.rowTrackMouseOver, function (event) { rowHover = event.detail; });
    grid.addEventListener(events.rowTrackClick, function (event) { rowClick = event.detail; });
    grid.render();

    var columnCell = grid.mainGrid.columnTrack.groups[0].container.select('.eg-track-data').node();
    var rowCell = grid.mainGrid.rowTrack.groups[0].container.select('.eg-track-data').node();
    dispatch(columnCell, 'mouseover');
    dispatch(columnCell, 'click');
    dispatch(rowCell, 'mouseover');
    dispatch(rowCell, 'click');

    expect(columnHover.element).to.equal(columnCell);
    expect(columnHover.data.axis).to.equal('column');
    expect(columnClick.data.itemId).to.equal('c1');
    expect(columnClick.data.trackId).to.equal('owner');
    expect(columnClick.data.value).to.equal('Avery');
    expect(rowHover.element).to.equal(rowCell);
    expect(rowHover.data.axis).to.equal('row');
    expect(rowClick.data.itemId).to.equal('r1');
    expect(rowClick.data.trackId).to.equal('priority');
    expect(rowClick.data.value).to.equal(2);
    grid.destroy();
  });

  it('sorts an axis through a track-label listener', function () {
    var grid = new EventGrid({
      element: '#test6',
      columns: [
        { id: 'c1', metadata: { owner: 'Blake' } },
        { id: 'c2', metadata: { owner: 'Avery' } }
      ],
      rows: [{ id: 'r1' }],
      events: [],
      columnTracks: [{
        id: 'owner',
        label: 'Owner',
        field: function (column) { return column.metadata.owner; },
        sort: function (getValue) {
          return function (first, second) {
            return String(getValue(second)).localeCompare(String(getValue(first)));
          };
        }
      }]
    });
    grid.render();

    dispatch(document.querySelector('#test6 .eg-track-label'), 'click');

    expect(grid.columns.map(function (column) { return column.id; })).to.deep.equal(['c1', 'c2']);
    grid.destroy();
  });

  it('sorts numeric tracks from lowest to highest by default', function () {
    var grid = new EventGrid({
      element: '#test6',
      columns: [
        { id: 'c30', metric: 30 },
        { id: 'c2', metric: '2' },
        { id: 'missing', metric: null },
        { id: 'c10', metric: 10 }
      ],
      rows: [],
      events: [],
      columnTracks: [{ id: 'metric', label: 'Metric', field: 'metric' }]
    });
    grid.render();

    dispatch(document.querySelector('#test6 .eg-track-label'), 'click');

    expect(grid.columns.map(function (column) { return column.id; }))
      .to.deep.equal(['c2', 'c10', 'c30', 'missing']);
    grid.destroy();
  });

  it('groups categorical tracks by descending value frequency by default', function () {
    var grid = new EventGrid({
      element: '#test6',
      columns: [
        { id: 'c1', category: 'v4' },
        { id: 'c2', category: 'v2' },
        { id: 'c3', category: 'v1' },
        { id: 'c4', category: 'v3' },
        { id: 'c5', category: 'v1' },
        { id: 'c6', category: 'v2' },
        { id: 'c7', category: 'v1' },
        { id: 'c8', category: 'v3' },
        { id: 'c9', category: 'v1' },
        { id: 'missing', category: null }
      ],
      rows: [],
      events: [],
      columnTracks: [{ id: 'category', label: 'Category', field: 'category' }]
    });
    grid.render();

    dispatch(document.querySelector('#test6 .eg-track-label'), 'click');

    expect(grid.columns.map(function (column) { return column.id; })).to.deep.equal([
      'c3', 'c5', 'c7', 'c9', 'c2', 'c6', 'c4', 'c8', 'c1', 'missing'
    ]);
    grid.destroy();
  });

  it('renders the largest categorical row-track group first from top to bottom', function () {
    var grid = new EventGrid({
      element: '#test6',
      columns: [{ id: 'c1' }],
      rows: [
        { id: 'r1', category: 'small' },
        { id: 'r2', category: 'large' },
        { id: 'r3', category: 'medium' },
        { id: 'r4', category: 'large' },
        { id: 'r5', category: 'medium' },
        { id: 'r6', category: 'large' }
      ],
      events: [],
      rowTracks: [{ id: 'category', label: 'Category', field: 'category' }]
    });
    grid.render();

    dispatch(document.querySelector('#test6 .eg-track-label'), 'click');

    expect(grid.rows.map(function (row) { return row.category; }))
      .to.deep.equal(['large', 'large', 'large', 'medium', 'medium', 'small']);

    var rendered = Array.prototype.map.call(
      document.querySelectorAll('#test6 .eg-track-category'),
      function (cell) {
        return {
          value: cell.getAttribute('class').match(/eg-track-value-([^ ]+)/)[1],
          top: cell.getBoundingClientRect().top
        };
      }
    ).sort(function (first, second) { return first.top - second.top; });
    expect(rendered.map(function (cell) { return cell.value; }))
      .to.deep.equal(['large', 'large', 'large', 'medium', 'medium', 'small']);
    grid.destroy();
  });
});
