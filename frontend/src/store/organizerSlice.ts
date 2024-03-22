import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { type TicketInfo } from '../../../backend/src/controllers/meetups';
import { type RaffleWinnerResponse } from '../../../backend/src/interfaces/rafflesInterfaces';
import config from '../config';
import { type RootState } from './store';

export interface GetMeetupAttendeesOptions {
  meetup_id: number;
  params?: {
    detail_level?: string;
  };
}

export const organizerSlice = createApi({
  reducerPath: 'organizerSlice',
  tagTypes: ['Attendees'],
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
    getMeetupAttendees: builder.query<TicketInfo[], GetMeetupAttendeesOptions>({
      query: (options) => ({
        url: `meetups/${options.meetup_id}/attendees`,
        params: options.params,
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
