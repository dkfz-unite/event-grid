/* global chai, EventGrid */
var expect = chai.expect;

describe('Histograms', function () {
  function dispatch(target, name) {
    target.dispatchEvent(new MouseEvent(name, { bubbles: true, cancelable: true }));
  }

  it('renders colored event-type stacks in both histograms', function () {
    var grid = new EventGrid({
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

    var columnBars = document.querySelectorAll('#test5 .eg-column-histogram .eg-histogram-bar');
    var rowBars = document.querySelectorAll('#test5 .eg-row-histogram .eg-summary-bar');
    var rowAxis = document.querySelectorAll('#test5 .eg-row-histogram .eg-histogram-axis');
    var rowTicks = document.querySelectorAll('#test5 .eg-row-histogram .eg-histogram-tick');
    expect(columnBars.length).to.equal(4);
    expect(document.querySelectorAll('#test5 .eg-histogram').length).to.equal(1);
    expect(rowBars.length).to.equal(4);
    expect(columnBars[0].getAttribute('height')).to.equal('40');
    expect(columnBars[1].getAttribute('height')).to.equal('40');
    expect(columnBars[0].getAttribute('fill')).to.equal('#00aa00');
    expect(columnBars[1].getAttribute('fill')).to.equal('#aa0000');
    expect(columnBars[0].getAttribute('y')).to.equal('40');
    expect(columnBars[1].getAttribute('y')).to.equal('0');
    expect(rowBars[0].getAttribute('fill')).to.equal('#00aa00');
    expect(rowBars[1].getAttribute('fill')).to.equal('#aa0000');
    expect(document.querySelector('#test5 .eg-column-histogram > g').getAttribute('transform'))
      .to.equal('translate(0,-100)');
    expect(document.querySelector('#test5 .eg-row-histogram > g').getAttribute('transform'))
      .to.equal('translate(520,0)');
    expect(rowAxis[0].getAttribute('x1')).to.equal('-5');
    expect(rowAxis[0].getAttribute('x2')).to.equal('-5');
    expect(rowAxis[1].getAttribute('x1')).to.equal('-5');
    expect(rowAxis[1].getAttribute('x2')).to.equal('85');
    expect(rowAxis[1].getAttribute('y1')).to.equal('-5');
    expect(rowAxis[1].getAttribute('y2')).to.equal('-5');
    expect(Array.prototype.map.call(rowTicks, function (tick) { return tick.textContent; }))
      .to.deep.equal(['2', '1']);
    expect(rowTicks[0].getAttribute('y')).to.equal('-11');
    expect(rowTicks[1].getAttribute('y')).to.equal('-11');
    expect(document.querySelector('#test5 .eg-row-histogram').textContent).to.contain('Event frequency');
    grid.destroy();
  });

  it('emits separate row and column histogram events', function () {
    var grid = new EventGrid({
      element: '#test5',
      columns: [{ id: 'c1', label: 'Column' }],
      rows: [{ id: 'r1', label: 'Row' }],
      events: [{ id: 'e1', columnId: 'c1', rowId: 'r1', type: 'ok', label: 'Okay' }]
    });
    var columnHover;
    var columnClick;
    var rowHover;
    var rowClick;
    var events = EventGrid.eventNames;
    grid.addEventListener(events.columnHistogramMouseOver, function (event) { columnHover = event.detail; });
    grid.addEventListener(events.columnHistogramClick, function (event) { columnClick = event.detail; });
    grid.addEventListener(events.rowHistogramMouseOver, function (event) { rowHover = event.detail; });
    grid.addEventListener(events.rowHistogramClick, function (event) { rowClick = event.detail; });
    grid.render();

    var columnBar = document.querySelector('#test5 .eg-column-histogram .eg-summary-bar');
    var rowBar = document.querySelector('#test5 .eg-row-histogram .eg-summary-bar');
    dispatch(columnBar, 'mouseover');
    dispatch(columnBar, 'click');
    dispatch(rowBar, 'mouseover');
    dispatch(rowBar, 'click');

    expect(columnHover.element).to.equal(columnBar);
    expect(columnHover.data).to.deep.equal({ columnId: 'c1', type: 'ok', label: 'Okay', count: 1 });
    expect(columnClick.data).to.deep.equal({ columnId: 'c1', type: 'ok', label: 'Okay', count: 1 });
    expect(rowHover.element).to.equal(rowBar);
    expect(rowHover.data).to.deep.equal({ rowId: 'r1', type: 'ok', label: 'Okay', count: 1 });
    expect(rowClick.data).to.deep.equal({ rowId: 'r1', type: 'ok', label: 'Okay', count: 1 });
    grid.destroy();
  });
});
