import { useCallback } from 'react';
import { useLazyGetTicketStatusQuery } from '../store/ticketSlice';

const POLL_ATTEMPTS = 30;
const POLL_INTERVAL_MS = 1000;

/**
 * Polls a ticket until the payment_intent.succeeded webhook marks it paid.
 */
export const useWaitForPaidTicket = (): ((
  ticketId: string
) => Promise<boolean>) => {
  const [pollTicket] = useLazyGetTicketStatusQuery();

  return useCallback(
    async (ticketId: string): Promise<boolean> => {
      for (let i = 0; i < POLL_ATTEMPTS; i++) {
        try {
          const status = await pollTicket(ticketId).unwrap();
          if (status.payment_status === 'paid') return true;
        } catch {
          // keep polling
        }
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      }
      return false;
    },
    [pollTicket]
  );
};
