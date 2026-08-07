/* global chai, OncoGrid */
var expect = chai.expect;

function fixture(element) {
  return new OncoGrid({
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

describe('OncoGrid generic interface', function () {
  it('accepts an empty configuration', function () {
    var grid = new OncoGrid({ element: '#test1' });
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
    var events = OncoGrid.eventNames;
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
    document.querySelector('#test1 .og-event').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    grid.render();

    expect(startCount).to.equal(1);
    expect(removedCount).to.equal(0);
    expect(startEvent).to.be.an.instanceof(CustomEvent);
    expect(cellDetail.column.id).to.equal('c1');
    expect(cellDetail.row.id).to.equal('r1');
    expect(cellDetail.events[0].id).to.equal('e1');
    grid.destroy();
  });

  it('renders labels and event types from the generic fields', function () {
    var grid = fixture('#test3');
    grid.render();
    expect(document.querySelectorAll('#test3 .og-event').length).to.equal(4);
    expect(document.querySelector('#test3 .og-row-label').textContent).to.equal('Planning');
    expect(document.querySelector('#test3 .og-event-type-complete').getAttribute('fill')).to.equal('#0a0');
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
    var grid = new OncoGrid({
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

    var eventSegments = document.querySelectorAll('#test7 .og-event');
    expect(eventSegments.length).to.equal(2);
    expect(eventSegments[0].getAttribute('data-cell-event-count')).to.equal('2');
    expect(eventSegments[0].getAttribute('data-event-stacking')).to.equal('h');
    expect(eventSegments[0].getAttribute('d')).not.to.equal(eventSegments[1].getAttribute('d'));
    grid.destroy();
  });

  it('stacks multiple events vertically by default', function () {
    var grid = new OncoGrid({
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

    var eventSegments = document.querySelectorAll('#test8 .og-event');
    expect(eventSegments.length).to.equal(2);
    expect(eventSegments[0].getAttribute('data-event-stacking')).to.equal('v');
    expect(eventSegments[0].getAttribute('d')).not.to.equal(eventSegments[1].getAttribute('d'));
    grid.destroy();
  });

  it('assigns consistent default colors by event type', function () {
    var grid = new OncoGrid({
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

    var alphaEvents = document.querySelectorAll('#test9 .og-event-type-alpha');
    var alphaSummary = document.querySelector('#test9 .og-column-histogram [data-event-type="alpha"]');
    expect(OncoGrid.defaultColorPalette.length).to.be.at.least(15);
    expect(grid.colorMap.alpha).not.to.equal(grid.colorMap.beta);
    expect(alphaEvents[0].getAttribute('fill')).to.equal(grid.colorMap.alpha);
    expect(alphaEvents[1].getAttribute('fill')).to.equal(grid.colorMap.alpha);
    expect(alphaSummary.getAttribute('fill')).to.equal(grid.colorMap.alpha);
    grid.destroy();
  });

  it('cycles a custom palette and applies per-type color overrides', function () {
    var grid = new OncoGrid({
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
});
