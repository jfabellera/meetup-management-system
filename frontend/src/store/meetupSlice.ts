import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { MeetupInfo } from '../../../backend/src/controllers/meetups';
import {
  EditMeetupPayload,
  type CreateMeetupPayload,
} from '../../../backend/src/util/validator';
import config from '../config';
import { type RootState } from './store';

export interface GetMeetupsOptions {
  detail_level?: string;
  by_organizer_id?: number[];
}

interface EditMeetupOptions {
  meetupId: number;
  payload: EditMeetupPayload;
}

export const meetupSlice = createApi({
  reducerPath: 'meetupSlice',
  tagTypes: ['Meetups', 'Meetup', 'Attendees'],
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
    editMeetup: builder.mutation<void, EditMeetupOptions>({
      query: ({ payload, meetupId }) => ({
        url: `meetups/${meetupId}`,
        method: 'PUT',
        body: payload,
      }),
      invalidatesTags: ['Meetup', 'Meetups'],
    }),
    getMeetupAttendees: builder.query<any, number>({
      query: (meetupId) => ({
        url: `meetups/${meetupId}/attendees`,
      }),
      providesTags: ['Attendees'],
    }),
  }),
});

export const {
  useGetMeetupsQuery,
  useGetMeetupQuery,
  useCreateMeetupMutation,
  useEditMeetupMutation,
  useGetMeetupAttendeesQuery,
} = meetupSlice;
