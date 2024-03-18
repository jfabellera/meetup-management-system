import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
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
    authorizeEventbrite: builder.mutation<void, string>({
      query: (accessCode) => ({
        url: `/oauth2/eventbrite`,
        method: 'POST',
        body: {
          access_code: accessCode,
        },
      }),
    }),
  }),
});

export const { useAuthorizeEventbriteMutation } = userSlice;
