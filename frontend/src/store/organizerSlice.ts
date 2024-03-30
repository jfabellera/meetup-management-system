import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { type TicketInfo } from '../../../backend/src/controllers/meetups';
import { type RaffleWinnerResponse } from '../../../backend/src/interfaces/rafflesInterfaces';
import {
  type ClaimRaffleWinnerPayload,
  type RollRaffleWinnerPayload,
} from '../../../backend/src/util/validator';
import config from '../config';
import { type RootState } from './store';

export interface GetMeetupAttendeesOptions {
  meetup_id: number;
  params?: {
    detail_level?: string;
  };
}

export interface RollRaffleWinnerOptions {
  meetupId: number;
  payload?: RollRaffleWinnerPayload;
}

export interface ClaimRaffleWinnerOptions {
  ticketId: number;
  payload?: ClaimRaffleWinnerPayload;
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
      providesTags: (result, error, arg) => [
        { type: 'Attendees', id: arg.meetup_id },
      ],
    }),
    checkInAttendee: builder.mutation<void, number>({
      query: (ticketId) => ({
        url: `tickets/${ticketId}/checkin`,
        method: 'POST',
      }),
      invalidatesTags: ['Attendees'],
    }),
    rollRaffleWinner: builder.mutation<
      RaffleWinnerResponse,
      RollRaffleWinnerOptions
    >({
      query: (options) => ({
        url: `meetups/${options.meetupId}/raffle`,
        method: 'POST',
        body: options.payload,
      }),
    }),
    claimRaffleWinner: builder.mutation<void, ClaimRaffleWinnerOptions>({
      query: (options) => ({
        url: `tickets/${options.ticketId}/claim`,
        method: 'POST',
        body: options.payload,
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
