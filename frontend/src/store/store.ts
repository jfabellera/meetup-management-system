import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import authSlice from './authSlice';
import { eventbriteSlice } from './eventbriteSlice';
import { meetupSlice } from './meetupSlice';
import { organizerSlice } from './organizerSlice';
import { ticketSlice } from './ticketSlice';
import { userSlice } from './userSlice';

export const store = configureStore({
  reducer: {
    [meetupSlice.reducerPath]: meetupSlice.reducer,
    [ticketSlice.reducerPath]: ticketSlice.reducer,
    [organizerSlice.reducerPath]: organizerSlice.reducer,
    [userSlice.reducerPath]: userSlice.reducer,
    [eventbriteSlice.reducerPath]: eventbriteSlice.reducer,
    user: authSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(meetupSlice.middleware)
      .concat(ticketSlice.middleware)
      .concat(organizerSlice.middleware)
      .concat(userSlice.middleware)
      .concat(eventbriteSlice.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
