import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { type User } from '../../../backend/src/interfaces/userInterfaces';
import config from '../config';
import { type RootState } from './store';

export const userSlice = createApi({
  reducerPath: 'userSlice',
  tagTypes: ['User'],
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
    getUser: builder.query<User, number>({
      query: (userId) => ({
        url: `/users/${userId}`,
      }),
      providesTags: ['User'],
    }),
    authorizeEventbrite: builder.mutation<void, string>({
      query: (accessCode) => ({
        url: `/oauth2/eventbrite`,
        method: 'POST',
        body: {
          access_code: accessCode,
        },
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const { useGetUserQuery, useAuthorizeEventbriteMutation } = userSlice;
