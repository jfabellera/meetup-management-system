import { type SimpleTicketInfo } from '@keebmeet/shared';
import { useEffect } from 'react';
import { useAppDispatch } from '../store/hooks';
import { ticketSlice } from '../store/ticketSlice';

/**
 * Schedules a refetch of the ticket list when the soonest pending hold expires.
 */
export const useHoldExpiryRefetch = (tickets?: SimpleTicketInfo[]): void => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (tickets == null) return;

    const now = Date.now();
    const nextExpiry = tickets
      .filter(
        (ticket) =>
          ticket.payment_status === 'pending' && ticket.hold_expires_at != null
      )
      .map((ticket) => new Date(ticket.hold_expires_at as string).getTime())
      .filter((expiry) => expiry > now)
      .sort((a, b) => a - b)[0];

    if (nextExpiry == null) return;

    // Small buffer so the server clock is definitely past expiry.
    const id = setTimeout(
      () => dispatch(ticketSlice.util.invalidateTags(['Tickets'])),
      nextExpiry - now + 500
    );
    return () => clearTimeout(id);
  }, [tickets, dispatch]);
};
