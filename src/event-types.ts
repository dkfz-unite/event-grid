import { GridEvent } from './types';

export interface EventTypeDetails {
  type: string;
  label: string;
}

export function eventTypeDetails(events: GridEvent[]): EventTypeDetails[] {
  const details: EventTypeDetails[] = [];
  const byType: Record<string, EventTypeDetails> = Object.create(null) as Record<string, EventTypeDetails>;

  events.forEach((event) => {
    const label = typeof event.label === 'string' && event.label.trim()
      ? event.label
      : event.type;
    if (!byType[event.type]) {
      const detail = { type: event.type, label };
      byType[event.type] = detail;
      details.push(detail);
    } else if (byType[event.type].label === event.type && label !== event.type) {
      byType[event.type].label = label;
    }
  });
  return details;
}

export function eventTypeLabel(events: GridEvent[], type: string): string {
  const detail = eventTypeDetails(events).find((item) => item.type === type);
  return detail ? detail.label : type;
}
