import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { type TicketInfo } from '../../../backend/src/controllers/meetups';
import { type RaffleWinnerResponse } from '../../../backend/src/interfaces/rafflesInterfaces';
import config from '../config';
import { type RootState } from './store';

export const organizerSlice = createApi({
  reducerPath: 'organizerSlice',
  tagTypes: ['Attendees'],
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
    getMeetupAttendees: builder.query<TicketInfo[], number>({
      query: (meetupId) => ({
        url: `meetups/${meetupId}/attendees`,
      }),
      providesTags: ['Attendees'],
    }),
    checkInAttendee: builder.mutation<void, number>({
      query: (ticketId) => ({
        url: `tickets/${ticketId}/checkin`,
        method: 'POST',
      }),
      invalidatesTags: ['Attendees'],
    }),
    rollRaffleWinner: builder.mutation<RaffleWinnerResponse, number>({
      query: (meetupId) => ({
        url: `meetups/${meetupId}/raffle`,
        method: 'POST',
      }),
    }),
    claimRaffleWinner: builder.mutation<void, number>({
      query: (ticketId) => ({
        url: `tickets/${ticketId}/claim`,
        method: 'POST',
      }),
    }),
  }),
});

export const {
  useGetMeetupAttendeesQuery,
  useCheckInAttendeeMutation,
  useRollRaffleWinnerMutation,
  useClaimRaffleWinnerMutation,
} = organizerSlice;
