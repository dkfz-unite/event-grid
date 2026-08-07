/* global chai, OncoGrid */
var expect = chai.expect;

describe('Tracks', function () {
  function dispatch(target, name) {
    var event = document.createEvent('MouseEvents');
    event.initEvent(name, true, true);
    target.dispatchEvent(event);
  }

  it('reads arbitrary metadata from columns and rows', function () {
    var grid = new OncoGrid({
      element: '#test6',
      columns: [{ id: 'c1', label: 'Alpha', owner: 'Avery' }, { id: 'c2', label: 'Beta', owner: 'Blake' }],
      rows: [{ id: 'r1', label: 'First', priority: 2 }],
      events: [{ id: 'e1', columnId: 'c1', rowId: 'r1', type: 'ok' }],
      columnTracks: [{ name: 'Owner', fieldName: 'owner', type: 'text' }],
      rowTracks: [{ name: 'Priority', fieldName: 'priority', type: 'number' }],
      columnFillFunc: function () { return '#123456'; },
      rowFillFunc: function () { return '#654321'; }
    });
    grid.render();

    var trackCells = document.querySelectorAll('#test6 .og-track-data');
    expect(trackCells.length).to.equal(3);
    expect(grid.mainGrid.columnTrack.groups[0].trackData[0].label).to.equal('Alpha');
    expect(grid.mainGrid.rowTrack.groups[0].trackData[0].value).to.equal(2);
    grid.destroy();
  });

  it('emits separate row and column track events', function () {
    var grid = new OncoGrid({
      element: '#test6',
      columns: [{ id: 'c1', owner: 'Avery' }],
      rows: [{ id: 'r1', priority: 2 }],
      events: [],
      columnTracks: [{ name: 'Owner', fieldName: 'owner', type: 'text' }],
      rowTracks: [{ name: 'Priority', fieldName: 'priority', type: 'number' }]
    });
    var columnHover;
    var columnClick;
    var rowHover;
    var rowClick;
    var events = OncoGrid.eventNames;
    grid.addEventListener(events.columnTrackMouseOver, function (event) { columnHover = event.detail; });
    grid.addEventListener(events.columnTrackClick, function (event) { columnClick = event.detail; });
    grid.addEventListener(events.rowTrackMouseOver, function (event) { rowHover = event.detail; });
    grid.addEventListener(events.rowTrackClick, function (event) { rowClick = event.detail; });
    grid.render();

    var columnCell = grid.mainGrid.columnTrack.groups[0].container.select('.og-track-data').node();
    var rowCell = grid.mainGrid.rowTrack.groups[0].container.select('.og-track-data').node();
    dispatch(columnCell, 'mouseover');
    dispatch(columnCell, 'click');
    dispatch(rowCell, 'mouseover');
    dispatch(rowCell, 'click');

    expect(columnHover.axis).to.equal('column');
    expect(columnClick.item.fieldName).to.equal('owner');
    expect(rowHover.axis).to.equal('row');
    expect(rowClick.item.fieldName).to.equal('priority');
    grid.destroy();
  });
});
