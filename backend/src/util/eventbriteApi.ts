import axios from 'axios';
import {
  type EventbriteAttendee,
  type EventbriteEvent,
  type EventbriteOrganization,
  type EventbriteQuestion,
  type EventbriteTicket,
} from '../interfaces/eventbriteInterfaces';

export const getEventbriteOrganizations = async (
  accessToken: string
): Promise<EventbriteOrganization[]> => {
  try {
    const response = await axios.get(
      'https://www.eventbriteapi.com/v3/users/me/organizations/',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const organizations: EventbriteOrganization[] =
      response.data.organizations?.map((organization: any) => {
        return {
          name: organization.name,
          id: organization.id,
        } satisfies EventbriteOrganization;
      });

    return organizations;
  } catch (error: any) {
    return [];
  }
};

export const getEventbriteEvents = async (
  accessToken: string,
  organizationId: number
): Promise<EventbriteEvent[]> => {
  try {
    const response = await axios.get(
      `https://www.eventbriteapi.com/v3/organizations/${organizationId}/events/`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const events: EventbriteEvent[] = response.data.events?.map(
      (event: any) => {
        return {
          name: event.name.text,
          id: event.id,
        } satisfies EventbriteEvent;
      }
    );

    return events;
  } catch (error: any) {
    return [];
  }
};

export const getEventbriteEvent = async (
  accessToken: string,
  eventId: number
): Promise<EventbriteEvent | undefined> => {
  try {
    const response = await axios.get(
      `https://www.eventbriteapi.com/v3/events/${eventId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const event = response.data;

    return {
      id: event.id,
      name: event.name?.text,
      imageUrl: event.logo?.original?.url,
      date: event.start?.utc,
      url: event.url,
    } satisfies EventbriteEvent;
  } catch (error: any) {
    return undefined;
  }
};

export const getEventbriteTickets = async (
  accessToken: string,
  eventId: number
): Promise<EventbriteTicket[]> => {
  try {
    const response = await axios.get(
      `https://www.eventbriteapi.com/v3/events/${eventId}/ticket_classes/`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const tickets: EventbriteTicket[] = response.data.ticket_classes?.map(
      (ticket: any) => {
        return {
          name: ticket.name,
          id: ticket.id,
        } satisfies EventbriteTicket;
      }
    );

    return tickets;
  } catch (error: any) {
    return [];
  }
};

export const getEventbriteTicket = async (
  accessToken: string,
  eventId: number,
  ticketId: number
): Promise<EventbriteTicket | undefined> => {
  try {
    const response = await axios.get(
      `https://www.eventbriteapi.com/v3/events/${eventId}/ticket_classes/${ticketId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const ticket = response.data;

    return {
      id: ticket.id,
      name: ticket.name,
      total: ticket.quantity_total,
      sold: ticket.quantity_sold,
    } satisfies EventbriteTicket;
  } catch (error: any) {
    return undefined;
  }
};

export const getEventbriteQuestions = async (
  accessToken: string,
  eventId: number
): Promise<EventbriteQuestion[]> => {
  try {
    const response = await axios.get(
      `https://www.eventbriteapi.com/v3/events/${eventId}/questions/`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const questions: EventbriteQuestion[] = response.data.questions?.map(
      (question: any) => {
        return {
          name: question.question.text,
          id: question.id,
        } satisfies EventbriteQuestion;
      }
    );

    return questions;
  } catch (error: any) {
    return [];
  }
};

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

// TODO(jan): Reduce code duplication
export const getEventbriteAttendeeByUri = async (
  accessToken: string,
  resourceUri: string,
  questionId: number
): Promise<EventbriteAttendee | undefined> => {
  try {
    const response = await axios.get(resourceUri, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

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
    return undefined;
  }
};
