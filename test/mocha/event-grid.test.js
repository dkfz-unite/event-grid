/* global chai, EventGrid */
var expect = chai.expect;

function fixture(element) {
  return new EventGrid({
    element: element,
    columns: [
      { id: 'c1', label: 'Alpha' },
      { id: 'c2', label: 'Beta' },
      { id: 'c3', label: 'Gamma' }
    ],
    rows: [
      { id: 'r1', label: 'Planning' },
      { id: 'r2', label: 'Build' }
    ],
    events: [
      { id: 'e1', columnId: 'c1', rowId: 'r1', type: 'complete' },
      { id: 'e2', columnId: 'c1', rowId: 'r2', type: 'active' },
      { id: 'e3', columnId: 'c2', rowId: 'r1', type: 'complete' },
      { id: 'e4', columnId: 'c3', rowId: 'r2', type: 'blocked' }
    ],
    colorMap: { complete: '#0a0', active: '#00a', blocked: '#a00' },
    summaryEventTypes: ['complete', 'active', 'blocked'],
    height: 200,
    width: 600
  });
}

function mouse(target, type, clientX, clientY, buttons) {
  target.dispatchEvent(new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX: clientX,
    clientY: clientY,
    button: 0,
    buttons: buttons
  }));
}

describe('EventGrid generic interface', function () {
  it('accepts an empty configuration', function () {
    var grid = new EventGrid({ element: '#test1' });
    expect(grid.columns).to.be.empty;
    expect(grid.rows).to.be.empty;
    expect(grid.events).to.be.empty;
    grid.destroy();
  });

  it('uses columnId and rowId to build the cell lookup', function () {
    var grid = fixture('#test2');
    expect(grid.lookupTable.c1.r1[0].id).to.equal('e1');
    expect(grid.lookupTable.c1.r2[0].type).to.equal('active');
    expect(grid.columns[0].id).to.equal('c1');
    expect(grid.columns[0].score).to.equal(12);
    grid.destroy();
  });

  it('dispatches native CustomEvents with constants and standard listener options', function () {
    var grid = fixture('#test1');
    var events = EventGrid.eventNames;
    var startCount = 0;
    var removedCount = 0;
    var cellDetail;
    var startEvent;
    function removedListener() { removedCount += 1; }

    grid.addEventListener(events.renderAllStart, function (event) {
      startCount += 1;
      startEvent = event;
    }, { once: true });
    grid.addEventListener(events.renderAllStart, removedListener);
    grid.removeEventListener(events.renderAllStart, removedListener);
    grid.addEventListener(events.gridClick, function (event) { cellDetail = event.detail; });

    grid.render();
    var eventElement = document.querySelector('#test1 .eg-event');
    eventElement.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    grid.render();

    expect(startCount).to.equal(1);
    expect(removedCount).to.equal(0);
    expect(startEvent).to.be.an.instanceof(CustomEvent);
    expect(cellDetail.element).to.equal(eventElement);
    expect(cellDetail.data.id).to.equal('e1');
    expect(cellDetail.data.columnId).to.equal('c1');
    expect(cellDetail.data.rowId).to.equal('r1');
    grid.destroy();
  });

  it('renders labels and event types from the generic fields', function () {
    var grid = fixture('#test3');
    grid.render();
    expect(document.querySelectorAll('#test3 .eg-event').length).to.equal(4);
    expect(document.querySelector('#test3 .eg-row-label').textContent).to.equal('Planning');
    expect(document.querySelector('#test3 .eg-event-type-complete').getAttribute('fill')).to.equal('#0a0');
    grid.destroy();
  });

  it('removes linked events when a column is removed', function () {
    var grid = fixture('#test4');
    grid.render();
    grid.removeColumns(function (column) { return column.id === 'c1'; });
    expect(grid.columns.length).to.equal(2);
    expect(grid.events.length).to.equal(2);
    expect(grid.lookupTable.c1).to.equal(undefined);
    grid.destroy();
  });

  it('can split multiple events horizontally', function () {
    var grid = new EventGrid({
      element: '#test7',
      columns: [{ id: 'c1', label: 'Alpha' }],
      rows: [{ id: 'r1', label: 'Planning' }],
      events: [
        { id: 'e1', columnId: 'c1', rowId: 'r1', type: 'active' },
        { id: 'e2', columnId: 'c1', rowId: 'r1', type: 'flagged' }
      ],
      eventStacking: 'h',
      colorMap: { active: '#00a', flagged: '#fa0' }
    });
    grid.render();

    var eventSegments = document.querySelectorAll('#test7 .eg-event');
    expect(eventSegments.length).to.equal(2);
    expect(eventSegments[0].getAttribute('data-cell-event-count')).to.equal('2');
    expect(eventSegments[0].getAttribute('data-event-stacking')).to.equal('h');
    expect(eventSegments[0].getAttribute('d')).not.to.equal(eventSegments[1].getAttribute('d'));
    grid.destroy();
  });

  it('stacks multiple events vertically by default', function () {
    var grid = new EventGrid({
      element: '#test8',
      columns: [{ id: 'c1', label: 'Alpha' }],
      rows: [{ id: 'r1', label: 'Planning' }],
      events: [
        { id: 'e1', columnId: 'c1', rowId: 'r1', type: 'active' },
        { id: 'e2', columnId: 'c1', rowId: 'r1', type: 'flagged' }
      ],
      colorMap: { active: '#00a', flagged: '#fa0' }
    });
    grid.render();

    var eventSegments = document.querySelectorAll('#test8 .eg-event');
    expect(eventSegments.length).to.equal(2);
    expect(eventSegments[0].getAttribute('data-event-stacking')).to.equal('v');
    expect(eventSegments[0].getAttribute('d')).not.to.equal(eventSegments[1].getAttribute('d'));
    grid.destroy();
  });

  it('optionally orders rows by occupied columns and columns by row pattern', function () {
    var grid = new EventGrid({
      element: '#test10',
      columns: [{ id: 'c4' }, { id: 'c1' }, { id: 'c2' }, { id: 'c3' }],
      rows: [{ id: 'r1' }, { id: 'r3' }, { id: 'r2' }],
      events: [
        { id: 'e1', columnId: 'c1', rowId: 'r2', type: 'active' },
        { id: 'e2', columnId: 'c2', rowId: 'r2', type: 'active' },
        { id: 'e3', columnId: 'c3', rowId: 'r2', type: 'active' },
        { id: 'e4', columnId: 'c2', rowId: 'r3', type: 'active' },
        { id: 'e5', columnId: 'c3', rowId: 'r3', type: 'active' },
        { id: 'e6', columnId: 'c3', rowId: 'r1', type: 'active' },
        { id: 'e7', columnId: 'c3', rowId: 'r1', type: 'flagged' }
      ],
      sortByFrequency: true
    });

    expect(grid.rows.map(function (row) { return row.id; })).to.deep.equal(['r2', 'r3', 'r1']);
    expect(grid.columns.map(function (column) { return column.id; })).to.deep.equal(['c3', 'c2', 'c1', 'c4']);

    grid.sortRows(function (first, second) { return String(first.id).localeCompare(String(second.id)); });
    grid.sortColumns(function (first, second) { return String(first.id).localeCompare(String(second.id)); });
    grid.reload();

    expect(grid.rows.map(function (row) { return row.id; })).to.deep.equal(['r2', 'r3', 'r1']);
    expect(grid.columns.map(function (column) { return column.id; })).to.deep.equal(['c3', 'c2', 'c1', 'c4']);
    grid.destroy();
  });

  it('darkens heat-map cells containing multiple events', function () {
    var grid = new EventGrid({
      element: '#test10',
      columns: [{ id: 'c1' }, { id: 'c2' }],
      rows: [{ id: 'r1' }],
      events: [
        { id: 'e1', columnId: 'c1', rowId: 'r1', type: 'active' },
        { id: 'e2', columnId: 'c2', rowId: 'r1', type: 'active' },
        { id: 'e3', columnId: 'c2', rowId: 'r1', type: 'flagged' }
      ],
      heatMap: true,
      heatMapColor: '#336699'
    });
    grid.render();

    var singleEvent = document.querySelector('#test10 .eg-event[data-column-id="c1"]');
    var multipleEvents = document.querySelectorAll('#test10 .eg-event[data-column-id="c2"]');
    var singleOpacity = Number(singleEvent.getAttribute('opacity'));
    var multipleOpacity = Number(multipleEvents[0].getAttribute('opacity'));

    expect(singleEvent.getAttribute('fill')).to.equal('#336699');
    expect(multipleEvents[0].getAttribute('fill')).to.equal('#336699');
    expect(multipleOpacity).to.be.above(singleOpacity);
    expect(Number(multipleEvents[1].getAttribute('opacity'))).to.equal(multipleOpacity);
    grid.destroy();
  });

  it('assigns consistent default colors by event type', function () {
    var grid = new EventGrid({
      element: '#test9',
      columns: [{ id: 'c1' }, { id: 'c2' }],
      rows: [{ id: 'r1' }],
      events: [
        { id: 'e1', columnId: 'c1', rowId: 'r1', type: 'alpha' },
        { id: 'e2', columnId: 'c2', rowId: 'r1', type: 'beta' },
        { id: 'e3', columnId: 'c2', rowId: 'r1', type: 'alpha' }
      ]
    });
    grid.render();

    var alphaEvents = document.querySelectorAll('#test9 .eg-event-type-alpha');
    var alphaSummary = document.querySelector('#test9 .eg-column-histogram [data-event-type="alpha"]');
    expect(EventGrid.defaultColorPalette.length).to.be.at.least(15);
    expect(grid.colorMap.alpha).not.to.equal(grid.colorMap.beta);
    expect(alphaEvents[0].getAttribute('fill')).to.equal(grid.colorMap.alpha);
    expect(alphaEvents[1].getAttribute('fill')).to.equal(grid.colorMap.alpha);
    expect(alphaSummary.getAttribute('fill')).to.equal(grid.colorMap.alpha);
    grid.destroy();
  });

  it('cycles a custom palette and applies per-type color overrides', function () {
    var grid = new EventGrid({
      element: '#test10',
      columns: [{ id: 'c1' }],
      rows: [{ id: 'r1' }],
      events: [
        { id: 'e1', columnId: 'c1', rowId: 'r1', type: 'alpha' },
        { id: 'e2', columnId: 'c1', rowId: 'r1', type: 'beta' },
        { id: 'e3', columnId: 'c1', rowId: 'r1', type: 'gamma' }
      ],
      colorPalette: ['#111111', '#222222'],
      colorMap: { beta: '#abcdef' }
    });

    expect(grid.colorMap.alpha).to.equal('#111111');
    expect(grid.colorMap.beta).to.equal('#abcdef');
    expect(grid.colorMap.gamma).to.equal('#111111');
    grid.destroy();
  });

  it('maps pointer coordinates to the crosshair cell', function () {
    var grid = fixture('#test10');
    var detail;
    grid.addEventListener(EventGrid.eventNames.gridCrosshairMouseOver, function (event) {
      detail = event.detail;
    });
    grid.render();
    grid.setCrosshair(true);

    var eventCell = document.querySelector('#test10 .eg-event[data-column-id="c1"][data-row-id="r1"]');
    var bounds = eventCell.getBoundingClientRect();
    mouse(eventCell, 'mousemove', bounds.left + bounds.width / 2, bounds.top + bounds.height / 2, 0);

    expect(detail.element).to.equal(eventCell);
    expect(detail.data.columnId).to.equal('c1');
    expect(detail.data.rowId).to.equal('r1');
    expect(detail.data.events[0].id).to.equal('e1');
    expect(document.querySelector('#test10 .eg-vertical-cross').getAttribute('opacity')).to.equal('1');
    expect(document.querySelector('#test10 .eg-horizontal-cross').getAttribute('opacity')).to.equal('1');
    grid.destroy();
  });

  it('reorders rows with the modern D3 drag behavior', function (done) {
    var grid = new EventGrid({
      element: '#test10',
      columns: [{ id: 'c1' }],
      rows: [{ id: 'r1' }, { id: 'r2' }, { id: 'r3' }],
      events: [],
      width: 300,
      height: 300
    });
    grid.render();

    var labels = document.querySelectorAll('#test10 .eg-row-label');
    var start = labels[0].getBoundingClientRect();
    var gridBounds = document.querySelector('#test10 .eg-background').getBoundingClientRect();
    var clientX = start.left + start.width / 2;
    var startY = start.top + start.height / 2;
    var destinationY = gridBounds.bottom - 1;

    mouse(labels[0], 'mousedown', clientX, startY, 1);
    mouse(window, 'mousemove', clientX, destinationY, 1);
    mouse(window, 'mouseup', clientX, destinationY, 0);

    setTimeout(function () {
      try {
        expect(grid.rows.map(function (row) { return row.id; })).to.deep.equal(['r2', 'r3', 'r1']);
        grid.destroy();
        done();
      } catch (error) {
        grid.destroy();
        done(error);
      }
    }, 0);
  });
});
