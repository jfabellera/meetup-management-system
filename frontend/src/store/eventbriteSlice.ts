import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { type EventbriteOrganization } from '../../../backend/src/interfaces/eventbriteInterfaces';
import config from '../config';
import { type RootState } from './store';

export const eventbriteSlice = createApi({
  reducerPath: 'eventbriteSlice',
  tagTypes: ['Organizations', 'Events', 'Custom Questions', 'Ticket Classes'],
  baseQuery: fetchBaseQuery({
    baseUrl: `${config.apiUrl}/`,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).user.user?.token;

      if (token != null) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      return headers;
    },
  }),
  endpoints: (builder) => ({
    getOrganizations: builder.query<EventbriteOrganization[], void>({
      query: () => ({
        url: `/eventbrite/organizations`,
      }),
      providesTags: ['Organizations'],
    }),
    getEvents: builder.query<EventbriteOrganization[], number>({
      query: (organizationId) => ({
        url: `/eventbrite/organizations/${organizationId}/events`,
      }),
      providesTags: ['Events'],
    }),
    getCustomQuestions: builder.query<EventbriteOrganization[], number>({
      query: (eventId) => ({
        url: `/eventbrite/events/${eventId}/questions`,
      }),
      providesTags: ['Custom Questions'],
    }),
    getTicketClasses: builder.query<EventbriteOrganization[], number>({
      query: (eventId) => ({
        url: `/eventbrite/events/${eventId}/tickets`,
      }),
      providesTags: ['Ticket Classes'],
    }),
  }),
});

export const {
  useGetOrganizationsQuery,
  useGetEventsQuery,
  useGetCustomQuestionsQuery,
  useGetTicketClassesQuery,
} = eventbriteSlice;
