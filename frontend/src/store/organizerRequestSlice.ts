import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import config from '../config';
import { type RootState } from './store';
import { OrganizerRequests } from '../../../backend/src/entity/OrganizerRequests';

export const organizerRequestSlice = createApi({
    reducerPath: 'organizerRequestSlice',
    tagTypes: ['OrganizerRequest'],
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
        // submitOrganizerRequest: builder.query<User, number>({
        //     query: (userId) => ({
        //         url: `/organizerRequests/${userId}`,
        //     }),
        //     providesTags: ['OrganizerRequest'],
        // }),
        getAllOrganizerRequest: builder.query<OrganizerRequests[], void>({
            query: (userId) => ({
                url: `/organizerRequests`,
            }),
            providesTags: ['OrganizerRequest'],
        }),
        // deleteOrganizerRequest: builder.query<User, number>({
        //     query: (userId) => ({
        //         url: `/organizerRequests/${userId}`,
        //     }),
        //     invalidatesTags: ['OrganizerRequest'],
        // })
    }),
});

export const {
    useGetAllOrganizerRequestQuery
} = organizerRequestSlice;
