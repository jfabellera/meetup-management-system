import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { type User } from '../../../backend/src/interfaces/userInterfaces';
import config from '../config';
import { type RootState } from './store';

export const organizerRequestSlice = createApi({
    reducerPath: 'organizerRequestSlice',
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
        submitOrganizerRequest: builder.query<User, number>({
            query: (userId) => ({
                url: `/users/${userId}`,
            }),
            providesTags: ['User'],
        }),
        getAllOrganizerRequest: builder.query<User, number>({
            query: (userId) => ({
                url: `/users/${userId}`,
            }),
            providesTags: ['User'],
        })
    }),
});

export const {
    useSubmitOrganizerRequestQuery,
    useGetAllOrganizerRequestQuery
} = organizerRequestSlice;
