import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const databaseApi = createApi({
  reducerPath: 'databaseApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:3000/',
  }),
  endpoints: (builder) => ({
    getMeetings: builder.query({
      query: () => ({
        url: `meetups/`,
      }),
      providesTags: ['Meetups'],
    }),
    getMeeting: builder.query({
      query: (id) => ({
        url: `meetups/${id}`,
      }),
      providesTags: ['Meetup'],
    }),
  }),
});

export const { useGetMeetingsQuery, useGetMeetingQuery } = databaseApi;
