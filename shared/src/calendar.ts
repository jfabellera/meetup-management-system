import { google, ics, outlook } from 'calendar-link';

export interface MeetupCalendarEvent {
  id: string;
  title: string;
  description?: string;
  location: string;
  // Absolute start instant; an ISO string must carry its UTC offset.
  start: Date | string;
  durationHours: number;
}

export interface MeetupCalendarLinks {
  google: string;
  outlook: string;
}

const toCalendarEvent = (event: MeetupCalendarEvent) => ({
  title: event.title,
  description: event.description,
  location: event.location,
  duration: [event.durationHours, 'hour'] as [number, 'hour'],
  start: event.start,
  // Stable UID so a re-sent invite updates the same event.
  uid: `keebmeet-meetup-${event.id}`,
});

export const buildMeetupCalendarLinks = (
  event: MeetupCalendarEvent
): MeetupCalendarLinks => {
  const calendarEvent = toCalendarEvent(event);
  return {
    google: google(calendarEvent),
    outlook: outlook(calendarEvent),
  };
};

// Raw .ics text, decoded from calendar-link's data URI so it can be attached to
// an email (many clients strip data: links).
export const buildMeetupIcsContent = (event: MeetupCalendarEvent): string => {
  const dataUri = ics(toCalendarEvent(event));
  return decodeURIComponent(dataUri.slice(dataUri.indexOf(',') + 1));
};
