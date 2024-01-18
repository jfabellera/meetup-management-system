import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { type SimpleTicketInfo } from '../../../backend/src/controllers/tickets';
import config from '../config';
import { type RootState } from './store';

export const ticketSlice = createApi({
  reducerPath: 'ticketSlice',
  tagTypes: ['Tickets'],
  baseQuery: fetchBaseQuery({
    baseUrl: `${config.apiUrl}:${config.apiPort}/`,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).user.user?.token;

      if (token != null) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      return headers;
    },
  }),
  endpoints: (builder) => ({
    getTickets: builder.query<SimpleTicketInfo[], number>({
      query: (userId) => ({
        url: `users/${userId}/tickets`,
      }),
      providesTags: ['Tickets'],
    }),
    createTicket: builder.mutation<void, number>({
      query: (meetupId) => ({
        url: `meetups/${meetupId}/rsvp`,
        method: 'POST',
      }),
      invalidatesTags: ['Tickets'],
    }),
    deleteTicket: builder.mutation<void, number>({
      query: (ticketId) => ({
        url: `tickets/${ticketId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Tickets'],
    }),
  }),
});

export const {
  useGetTicketsQuery,
  useCreateTicketMutation,
  useDeleteTicketMutation,
} = ticketSlice;
