import type EventGrid from '../../src';

export interface SampleColumn extends EventGrid.Item {
  metadata: {
    owner: string;
    group: string;
  };
  capacity: number;
}

export interface SampleRow extends EventGrid.Item {
  metadata: {
    category: string;
  };
  priority: number;
}

export interface SampleEvent extends EventGrid.Event {
  score: number;
  note?: string;
}

const columns: SampleColumn[] = [];
const rows: SampleRow[] = [];
const events: SampleEvent[] = [];
const owners = ['Avery', 'Blake', 'Casey', 'Drew', 'Emery'];
const eventTypes = ['complete', 'active', 'blocked', 'review'];
const eventLabels: Record<string, string> = {
  complete: 'Complete',
  active: 'In progress',
  blocked: 'Blocked',
  review: 'In review',
  flagged: 'Flagged'
};
let eventNumber = 1;

function padded(number: number): string {
  return String(number).padStart(2, '0');
}

for (let columnNumber = 1; columnNumber <= 15; columnNumber += 1) {
  columns.push({
    id: `column-${padded(columnNumber)}`,
    label: `Column ${padded(columnNumber)}`,
    metadata: {
      owner: owners[(columnNumber - 1) % owners.length],
      group: columnNumber <= 8 ? 'North' : columnNumber <= 13 ? 'Central' : 'South'
    },
    capacity: 45 + ((columnNumber * 13) % 56)
  });
}

for (let rowNumber = 1; rowNumber <= 30; rowNumber += 1) {
  rows.push({
    id: `row-${padded(rowNumber)}`,
    label: `Row ${padded(rowNumber)}`,
    metadata: {
      category: rowNumber <= 10
        ? 'Planning'
        : rowNumber <= 18
          ? 'Delivery'
          : rowNumber <= 24
            ? 'Quality'
            : rowNumber <= 28
              ? 'Operations'
              : 'Support'
    },
    priority: 1 + ((rowNumber * 7) % 5)
  });
}

for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
  for (let columnIndex = 0; columnIndex < columns.length; columnIndex += 1) {
    const distribution = ((rowIndex + 1) * 17 + (columnIndex + 1) * 29 +
      (rowIndex + 1) * (columnIndex + 1) * 7) % 100;

    if (distribution < 24) {
      const type = eventTypes[(rowIndex + columnIndex) % eventTypes.length];
      events.push({
        id: `event-${padded(eventNumber++)}`,
        columnId: columns[columnIndex].id,
        rowId: rows[rowIndex].id,
        type,
        label: eventLabels[type],
        score: 10 + ((rowIndex * 11 + columnIndex * 7) % 91)
      });
    }

    if (distribution < 6) {
      events.push({
        id: `event-${padded(eventNumber++)}`,
        columnId: columns[columnIndex].id,
        rowId: rows[rowIndex].id,
        type: 'flagged',
        label: eventLabels.flagged,
        score: 100,
        note: 'Second event in this cell'
      });
    }
  }
}

export default { columns, rows, events };
