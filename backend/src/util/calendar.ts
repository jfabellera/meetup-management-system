import {
  buildMeetupCalendarLinks,
  buildMeetupIcsContent,
  type MeetupCalendarEvent,
  type MeetupCalendarLinks,
} from '@keebmeet/shared';
import dayjs from 'dayjs';
import { Meetup } from '../entity/Meetup';

// date is the absolute instant; utc_offset only affects display.
const toCalendarEvent = (meetup: Meetup): MeetupCalendarEvent => ({
  id: meetup.id,
  title: meetup.name,
  description: meetup.description || undefined,
  location: [meetup.address, meetup.city, meetup.state, meetup.country]
    .filter((part) => part != null && part !== '')
    .join(', '),
  start: dayjs(meetup.date).toDate(),
  durationHours: meetup.duration_hours,
});

export const buildMeetupCalendarLinksFromEntity = (
  meetup: Meetup
): MeetupCalendarLinks => buildMeetupCalendarLinks(toCalendarEvent(meetup));

export const buildMeetupIcsFromEntity = (meetup: Meetup): string =>
  buildMeetupIcsContent(toCalendarEvent(meetup));
