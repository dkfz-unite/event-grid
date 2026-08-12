import EventGrid from '@dkfz-unite/event-grid';

interface ProjectColumn extends EventGrid.Item {
  owner: string;
  metadata: {
    customField: number;
  };
}

interface ProjectRow extends EventGrid.Item {
  priority: number;
}

interface ProjectEvent extends EventGrid.Event {
  note?: string;
}

const grid = new EventGrid<ProjectColumn, ProjectRow, ProjectEvent>({
  columns: [{ id: 'c1', owner: 'Avery', metadata: { customField: 4 } }],
  rows: [{ id: 'r1', priority: 1 }],
  events: [{ id: 'e1', columnId: 'c1', rowId: 'r1', type: 'active', note: 'Typed metadata' }],
  columnTracks: [
    {
      id: 'owner',
      label: 'Owner',
      field: 'owner',
      colorPalette: ['#123456', '#654321']
    },
    {
      id: 'custom-field',
      label: 'Custom field',
      field: (column) => column.metadata.customField,
      fill: '#123456',
      opacityFunction: (data) => Number(data.value) / 10,
      colorMap: { '4': '#654321' },
      sort: (getValue) => (a, b) => Number(getValue(a)) - Number(getValue(b))
    }
  ],
  rowTracks: [{ id: 'priority', label: 'Priority', field: 'priority' }],
  sortByFrequency: true,
  eventStacking: 'v'
});

grid.addEventListener(EventGrid.eventNames.columnHistogramClick, (event) => {
  const payload = event.detail;
  payload.element.getBoundingClientRect();
  payload.data.itemId.toString();
  payload.data.type.toUpperCase();
});

grid.addEventListener(EventGrid.eventNames.rowHistogramMouseOver, (event) => {
  const payload = event.detail;
  payload.element.getBoundingClientRect();
  payload.data.itemId.toString();
  payload.data.count.toFixed(0);
});

const gridClickListener = (event: CustomEvent<EventGrid.GridInteraction<ProjectEvent>>) => {
  const payload = event.detail;
  payload.element.getBoundingClientRect();
  payload.data.note?.toUpperCase();
};
grid.addEventListener(EventGrid.eventNames.gridClick, gridClickListener, { once: true });
grid.removeEventListener(EventGrid.eventNames.gridClick, gridClickListener);

grid.addEventListener(EventGrid.eventNames.columnTrackMouseOver, ({ detail }) => {
  detail.element.getBoundingClientRect();
  detail.data.itemId.toString();
  detail.data.trackId.toString();
  detail.data.value;
});

new EventGrid({
  // @ts-expect-error Only horizontal or vertical event stacking is supported.
  eventStacking: 'diagonal'
});
