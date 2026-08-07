'use strict';

var OncoGridSampleData = (function () {
  var columns = [];
  var rows = [];
  var events = [];
  var owners = ['Avery', 'Blake', 'Casey', 'Drew', 'Emery'];
  var groups = ['North', 'Central', 'South'];
  var categories = ['Planning', 'Delivery', 'Quality', 'Operations', 'Support'];
  var eventTypes = ['complete', 'active', 'blocked', 'review'];
  var eventNumber = 1;

  function padded(number) {
    return number < 10 ? '0' + number : String(number);
  }

  for (var columnNumber = 1; columnNumber <= 15; columnNumber++) {
    columns.push({
      id: 'column-' + padded(columnNumber),
      label: 'Column ' + padded(columnNumber),
      owner: owners[(columnNumber - 1) % owners.length],
      group: groups[(columnNumber - 1) % groups.length],
      capacity: 45 + ((columnNumber * 13) % 56)
    });
  }

  for (var rowNumber = 1; rowNumber <= 30; rowNumber++) {
    rows.push({
      id: 'row-' + padded(rowNumber),
      label: 'Row ' + padded(rowNumber),
      category: categories[(rowNumber - 1) % categories.length],
      priority: 1 + ((rowNumber * 7) % 5)
    });
  }

  for (var rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    for (var columnIndex = 0; columnIndex < columns.length; columnIndex++) {
      var distribution = ((rowIndex + 1) * 17 + (columnIndex + 1) * 29 +
          (rowIndex + 1) * (columnIndex + 1) * 7) % 100;

      if (distribution < 24) {
        events.push({
          id: 'event-' + padded(eventNumber++),
          columnId: columns[columnIndex].id,
          rowId: rows[rowIndex].id,
          type: eventTypes[(rowIndex + columnIndex) % eventTypes.length],
          score: 10 + ((rowIndex * 11 + columnIndex * 7) % 91)
        });
      }

      if (distribution < 6) {
        events.push({
          id: 'event-' + padded(eventNumber++),
          columnId: columns[columnIndex].id,
          rowId: rows[rowIndex].id,
          type: 'flagged',
          score: 100,
          note: 'Second event in this cell'
        });
      }
    }
  }

  return {
    columns: columns,
    rows: rows,
    events: events
  };
}());
