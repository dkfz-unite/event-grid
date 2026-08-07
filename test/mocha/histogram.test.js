/* global chai, OncoGrid */
var expect = chai.expect;

describe('Histograms', function () {
  function dispatch(target, name) {
    var event = document.createEvent('MouseEvents');
    event.initEvent(name, true, true);
    target.dispatchEvent(event);
  }

  it('renders colored event-type stacks in both histograms', function () {
    var grid = new OncoGrid({
      element: '#test5',
      columns: [{ id: 'c1' }, { id: 'c2' }, { id: 'c3' }],
      rows: [{ id: 'r1', label: 'First' }, { id: 'r2', label: 'Second' }],
      events: [
        { id: 'e1', columnId: 'c1', rowId: 'r1', type: 'ok' },
        { id: 'e2', columnId: 'c1', rowId: 'r2', type: 'alert' },
        { id: 'e3', columnId: 'c2', rowId: 'r1', type: 'alert' },
        { id: 'e4', columnId: 'c3', rowId: 'r2', type: 'ok' }
      ],
      colorMap: { ok: '#00aa00', alert: '#aa0000' },
      summaryEventTypes: ['ok', 'alert']
    });
    grid.render();

    var columnBars = document.querySelectorAll('#test5 .og-column-histogram .og-histogram-bar');
    var rowBars = document.querySelectorAll('#test5 .og-row-histogram .og-summary-bar');
    var rowAxis = document.querySelectorAll('#test5 .og-row-histogram .og-histogram-axis');
    expect(columnBars.length).to.equal(4);
    expect(document.querySelectorAll('#test5 .og-histogram').length).to.equal(1);
    expect(rowBars.length).to.equal(4);
    expect(columnBars[0].getAttribute('height')).to.equal('40');
    expect(columnBars[1].getAttribute('height')).to.equal('40');
    expect(columnBars[0].getAttribute('fill')).to.equal('#00aa00');
    expect(columnBars[1].getAttribute('fill')).to.equal('#aa0000');
    expect(columnBars[0].getAttribute('y')).to.equal('40');
    expect(columnBars[1].getAttribute('y')).to.equal('0');
    expect(rowBars[0].getAttribute('fill')).to.equal('#00aa00');
    expect(rowBars[1].getAttribute('fill')).to.equal('#aa0000');
    expect(rowAxis[1].getAttribute('y1')).to.equal('0');
    expect(rowAxis[1].getAttribute('y2')).to.equal('0');
    expect(document.querySelector('#test5 .og-row-histogram').textContent).to.contain('Event frequency');
    grid.destroy();
  });

  it('emits separate row and column histogram events', function () {
    var grid = new OncoGrid({
      element: '#test5',
      columns: [{ id: 'c1', label: 'Column' }],
      rows: [{ id: 'r1', label: 'Row' }],
      events: [{ id: 'e1', columnId: 'c1', rowId: 'r1', type: 'ok' }]
    });
    var columnHover;
    var columnClick;
    var rowHover;
    var rowClick;
    var events = OncoGrid.eventNames;
    grid.addEventListener(events.columnHistogramMouseOver, function (event) { columnHover = event.detail; });
    grid.addEventListener(events.columnHistogramClick, function (event) { columnClick = event.detail; });
    grid.addEventListener(events.rowHistogramMouseOver, function (event) { rowHover = event.detail; });
    grid.addEventListener(events.rowHistogramClick, function (event) { rowClick = event.detail; });
    grid.render();

    var columnBar = document.querySelector('#test5 .og-column-histogram .og-summary-bar');
    var rowBar = document.querySelector('#test5 .og-row-histogram .og-summary-bar');
    dispatch(columnBar, 'mouseover');
    dispatch(columnBar, 'click');
    dispatch(rowBar, 'mouseover');
    dispatch(rowBar, 'click');

    expect(columnHover.axis).to.equal('column');
    expect(columnClick.item.id).to.equal('c1');
    expect(columnClick.type).to.equal('ok');
    expect(rowHover.axis).to.equal('row');
    expect(rowClick.item.id).to.equal('r1');
    expect(rowClick.type).to.equal('ok');
    grid.destroy();
  });
});
