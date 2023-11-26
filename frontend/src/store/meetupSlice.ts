import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface Meetup {
  id: number;
  name: string;
  location: string;
  date: string;
  organizer_ids: number[];
  imageUrl: string;
}

export const meetupSlice = createApi({
  reducerPath: 'meetupSlice',
  tagTypes: ['Meetups', 'Meetup'],
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:3000/',
  }),
  endpoints: (builder) => ({
    getMeetups: builder.query<Meetup[], void>({
      query: () => ({
        url: `meetups/`,
      }),
      providesTags: ['Meetups'],
    }),
    getMeetup: builder.query<Meetup, number>({
      query: (id) => ({
        url: `meetups/${id}`,
      }),
      providesTags: ['Meetup'],
    }),
  }),
});

export const { useGetMeetupsQuery, useGetMeetupQuery } = meetupSlice;
