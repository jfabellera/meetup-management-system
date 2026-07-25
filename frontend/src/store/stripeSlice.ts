import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import config from '../config';
import { apiCacheDefaults } from './apiCacheDefaults';
import { type RootState } from './store';

export interface StripeConnectStatus {
  is_stripe_connected: boolean;
  stripe_charges_enabled: boolean;
  stripe_details_submitted: boolean;
}

export const stripeSlice = createApi({
  reducerPath: 'stripeSlice',
  ...apiCacheDefaults,
  tagTypes: ['StripeStatus'],
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
    getStripeStatus: builder.query<StripeConnectStatus, void>({
      query: () => ({
        url: 'stripe/connect/status',
      }),
      providesTags: ['StripeStatus'],
    }),
    // Creates the connected account if needed and returns a hosted-onboarding
    // URL to redirect the organizer to.
    createStripeAccountLink: builder.mutation<{ url: string }, void>({
      query: () => ({
        url: 'stripe/connect/account-link',
        method: 'POST',
      }),
    }),
  }),
});

export const { useGetStripeStatusQuery, useCreateStripeAccountLinkMutation } =
  stripeSlice;
