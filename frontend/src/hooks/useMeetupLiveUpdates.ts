import { type MeetupInfo } from '@keebmeet/shared';
import { useEffect } from 'react';
import { socket } from '../socket';
import { useAppDispatch } from '../store/hooks';
import { meetupSlice } from '../store/meetupSlice';
import { organizerSlice } from '../store/organizerSlice';

/**
 * Subscribe user to updates for the selected meetup. This will invalidate the
 * cache for the fetched meetup and attendees whenever a meetup is updated.
 */
export const useMeetupLiveUpdates = (
  meetup: MeetupInfo | null | undefined
): void => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (meetup == null) return;

    // Socket rooms and the attendee/raffle caches are keyed by the numeric id;
    // the getMeetup cache tag by slug.
    const invalidate = (): void => {
      dispatch(
        meetupSlice.util.invalidateTags([{ type: 'Meetup', id: meetup.slug }])
      );
      dispatch(
        organizerSlice.util.invalidateTags([
          { type: 'Attendees', id: meetup.id },
        ])
      );
      dispatch(
        organizerSlice.util.invalidateTags([
          'Raffle',
          { type: 'Raffles', id: meetup.id },
        ])
      );
    };

    socket.emit('meetup:subscribe', { meetupId: meetup.id });

    socket.on('meetup:update', () => {
      invalidate();
    });

    // Resubscribe and force update on reconnection after losing connection
    socket.on('connect', () => {
      socket.emit('meetup:subscribe', { meetupId: meetup.id });
      invalidate();
    });

    // Stay subscribed to updates in case user comes back to page
  }, [meetup, dispatch]);
};
