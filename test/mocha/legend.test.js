/* global chai, EventGrid */
var expect = chai.expect;

describe('Event legend', function () {
  it('shows resolved event colors and labels by default', function () {
    var grid = new EventGrid({
      element: '#test11',
      columns: [{ id: 'c1' }],
      rows: [{ id: 'r1' }, { id: 'r2' }],
      events: [
        { id: 'e1', columnId: 'c1', rowId: 'r1', type: 'active', label: 'In progress' },
        { id: 'e2', columnId: 'c1', rowId: 'r2', type: 'blocked' },
        { id: 'e3', columnId: 'c1', rowId: 'r2', type: 'active', label: 'Active' }
      ],
      colorMap: { active: '#123456', blocked: '#654321' },
      width: 200,
      height: 100,
      scaleToFit: false
    });
    grid.render();

    var items = document.querySelectorAll('#test11 .eg-legend-item');
    var swatches = document.querySelectorAll('#test11 .eg-legend-swatch');
    var labels = document.querySelectorAll('#test11 .eg-legend-label');

    expect(items.length).to.equal(2);
    expect(Array.prototype.map.call(items, function (item) {
      return item.getAttribute('data-event-type');
    })).to.deep.equal(['active', 'blocked']);
    expect(Array.prototype.map.call(labels, function (label) {
      return label.textContent;
    })).to.deep.equal(['In progress', 'blocked']);
    expect(swatches[0].getAttribute('fill')).to.equal('#123456');
    expect(swatches[1].getAttribute('fill')).to.equal('#654321');
    expect(swatches[0].getAttribute('width')).to.equal('50');
    expect(swatches[0].getAttribute('height')).to.equal('50');
    expect(document.querySelector('#test11 .eg-event-legend').getAttribute('transform'))
      .to.equal('translate(320,0)');

    grid.resize(200, 80);
    expect(document.querySelector('#test11 .eg-legend-swatch').getAttribute('width')).to.equal('40');
    expect(document.querySelector('#test11 .eg-legend-swatch').getAttribute('height')).to.equal('40');
    grid.destroy();
  });

  it('can be disabled', function () {
    var grid = new EventGrid({
      element: '#test11',
      columns: [{ id: 'c1' }],
      rows: [{ id: 'r1' }],
      events: [{ id: 'e1', columnId: 'c1', rowId: 'r1', type: 'active' }],
      legend: false
    });
    grid.render();

    expect(document.querySelector('#test11 .eg-event-legend')).to.equal(null);
    expect(grid.mainGrid.eventLegend.width).to.equal(0);
    grid.destroy();
  });
});
