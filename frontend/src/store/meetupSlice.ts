import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { MeetupInfo } from '../../../backend/src/controllers/meetups';
import config from '../config';

export interface GetMeetupsOptions {
  detail_level?: string;
  organizer_ids?: number[];
}

export const meetupSlice = createApi({
  reducerPath: 'meetupSlice',
  tagTypes: ['Meetups', 'Meetup'],
  baseQuery: fetchBaseQuery({
    baseUrl: `${config.apiUrl}:${config.apiPort}/`,
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
  }),
});

export const { useGetMeetupsQuery, useGetMeetupQuery } = meetupSlice;
