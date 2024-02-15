import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { MeetupInfo } from '../../../backend/src/controllers/meetups';
import { type CreateMeetupPayload } from '../../../backend/src/util/validator';
import config from '../config';
import { type RootState } from './store';

export interface GetMeetupsOptions {
  detail_level?: string;
  by_organizer_id?: number[];
}

export const meetupSlice = createApi({
  reducerPath: 'meetupSlice',
  tagTypes: ['Meetups', 'Meetup'],
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
    getMeetups: builder.query<MeetupInfo[], GetMeetupsOptions>({
      query: (options) => ({
        url: `meetups/`,
        params: options,
      }),
      providesTags: ['Meetups'],
    }),
    getMeetup: builder.query<MeetupInfo, number>({
      query: (id) => ({
        url: `meetups/${id}`,
      }),
      providesTags: ['Meetup'],
    }),
    createMeetup: builder.mutation<void, CreateMeetupPayload>({
      query: (payload) => ({
        url: `meetups/`,
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['Meetups'],
    }),
  }),
});

export const {
  useGetMeetupsQuery,
  useGetMeetupQuery,
  useCreateMeetupMutation,
} = meetupSlice;
