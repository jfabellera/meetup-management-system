// Coordinates a Stripe redirect's return tab with the tab the RSVP started
// in: the return tab announces itself ('return'), the original tab claims the
// outcome ('ack') and reports when it's safe to close ('finalized').
export const RSVP_RETURN_CHANNEL = 'rsvp-payment-return';

export interface RsvpReturnMessage {
  type: 'return' | 'ack' | 'finalized';
  ticketId: string | null;
  // On 'return' only: Stripe reported the payment as failed.
  failed?: boolean;
}

export const postRsvpReturnMessage = (message: RsvpReturnMessage): void => {
  const channel = new BroadcastChannel(RSVP_RETURN_CHANNEL);
  channel.postMessage(message);
  channel.close();
};
