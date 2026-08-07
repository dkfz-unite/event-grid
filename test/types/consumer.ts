import OncoGrid from '@dkfz-unite/oncogrid';

interface ProjectColumn extends OncoGrid.Item {
  owner: string;
}

interface ProjectRow extends OncoGrid.Item {
  priority: number;
}

interface ProjectEvent extends OncoGrid.Event {
  note?: string;
}

const grid = new OncoGrid<ProjectColumn, ProjectRow, ProjectEvent>({
  columns: [{ id: 'c1', owner: 'Avery' }],
  rows: [{ id: 'r1', priority: 1 }],
  events: [{ id: 'e1', columnId: 'c1', rowId: 'r1', type: 'active', note: 'Typed metadata' }],
  eventStacking: 'v'
});

grid.addEventListener(OncoGrid.eventNames.columnHistogramClick, (event) => {
  const payload = event.detail;
  payload.item.owner.toUpperCase();
  payload.type.toUpperCase();
});

grid.addEventListener(OncoGrid.eventNames.rowHistogramMouseOver, (event) => {
  const payload = event.detail;
  payload.item.priority.toFixed(0);
  payload.count.toFixed(0);
});

const gridClickListener = (event: CustomEvent<OncoGrid.Cell<ProjectColumn, ProjectRow, ProjectEvent>>) => {
  const payload = event.detail;
  payload.events[0].note?.toUpperCase();
};
grid.addEventListener(OncoGrid.eventNames.gridClick, gridClickListener, { once: true });
grid.removeEventListener(OncoGrid.eventNames.gridClick, gridClickListener);

new OncoGrid({
  // @ts-expect-error Only horizontal or vertical event stacking is supported.
  eventStacking: 'diagonal'
});
