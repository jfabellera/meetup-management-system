import axios from 'axios';
import { type EventbriteAttendee } from '../interfaces/eventbriteInterfaces';

export const getEventbriteAttendees = async (
  accessToken: string,
  eventId: number,
  ticketClassId: number,
  questionId: number
): Promise<EventbriteAttendee[]> => {
  let hasMoreItems = false;
  let attendees: EventbriteAttendee[] = [];
  let page = 1;

  try {
    do {
      const response = await axios.get(
        `https://www.eventbriteapi.com/v3/events/${eventId}/attendees/`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { page },
        }
      );

      hasMoreItems = response.data.pagination.has_more_items;
      page++;

      attendees = attendees.concat(
        response.data.attendees
          .filter(
            (attendee: any) =>
              attendee.ticket_class_id === ticketClassId &&
              attendee.cancelled === false
          )
          .map((attendee: any) => {
            return {
              id: attendee.id,
              displayName: attendee.answers.find(
                (question: any) => question.question_id === questionId
              ).answer,
              firstName: attendee.profile.first_name,
              lastName: attendee.profile.last_name,
              email: attendee.profile.email,
              createdAt: attendee.created,
              isCheckedIn: attendee.checked_in,
            } satisfies EventbriteAttendee;
          })
      );
    } while (hasMoreItems);

    return attendees;
  } catch (error: any) {
    return [];
  }
};

export const getEventbriteAttendee = async (
  accessToken: string,
  eventId: number,
  attendeeId: number,
  questionId: number
): Promise<EventbriteAttendee | null> => {
  try {
    const response = await axios.get(
      `https://www.eventbriteapi.com/v3/events/${eventId}/attendees/${attendeeId}/`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const attendee = response.data;

    return {
      id: attendee.id,
      displayName: attendee.answers.find(
        (question: any) => question.question_id === questionId
      ).answer,
      firstName: attendee.profile.first_name,
      lastName: attendee.profile.last_name,
      email: attendee.profile.email,
      createdAt: attendee.created,
      isCheckedIn: attendee.checked_in,
    } satisfies EventbriteAttendee;
  } catch (error: any) {
    return null;
  }
};
