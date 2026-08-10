import EventGrid from '@dkfz-unite/event-grid';

interface ProjectColumn extends EventGrid.Item {
  owner: string;
}

interface ProjectRow extends EventGrid.Item {
  priority: number;
}

interface ProjectEvent extends EventGrid.Event {
  note?: string;
}

const grid = new EventGrid<ProjectColumn, ProjectRow, ProjectEvent>({
  columns: [{ id: 'c1', owner: 'Avery' }],
  rows: [{ id: 'r1', priority: 1 }],
  events: [{ id: 'e1', columnId: 'c1', rowId: 'r1', type: 'active', note: 'Typed metadata' }],
  sortByFrequency: true,
  eventStacking: 'v'
});

grid.addEventListener(EventGrid.eventNames.columnHistogramClick, (event) => {
  const payload = event.detail;
  payload.item.owner.toUpperCase();
  payload.type.toUpperCase();
});

grid.addEventListener(EventGrid.eventNames.rowHistogramMouseOver, (event) => {
  const payload = event.detail;
  payload.item.priority.toFixed(0);
  payload.count.toFixed(0);
});

const gridClickListener = (event: CustomEvent<EventGrid.Cell<ProjectColumn, ProjectRow, ProjectEvent>>) => {
  const payload = event.detail;
  payload.events[0].note?.toUpperCase();
};
grid.addEventListener(EventGrid.eventNames.gridClick, gridClickListener, { once: true });
grid.removeEventListener(EventGrid.eventNames.gridClick, gridClickListener);

new EventGrid({
  // @ts-expect-error Only horizontal or vertical event stacking is supported.
  eventStacking: 'diagonal'
});
