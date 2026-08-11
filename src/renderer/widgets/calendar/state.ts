export interface CalendarEvent {
  id: number;
  title: string;
  date: string;
  description: string;
}

export interface CalendarState {
  events: CalendarEvent[];
  nextEventId: number;
}
