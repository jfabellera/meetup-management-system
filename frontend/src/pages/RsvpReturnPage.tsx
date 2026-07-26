import { Loader2 } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import Page from '../components/Page/Page';
import { useWaitForPaidTicket } from '../hooks/useWaitForPaidTicket';
import {
  postRsvpReturnMessage,
  RSVP_RETURN_CHANNEL,
  type RsvpReturnMessage,
} from '../util/rsvpReturnChannel';

const ACK_TIMEOUT_MS = 400;
// The original tab polls up to 30s before reporting 'finalized'.
const FINALIZED_TIMEOUT_MS = 35_000;

const RsvpReturnPage = (): ReactNode => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const waitForPaidTicket = useWaitForPaidTicket();
  const announcedRef = useRef(false);

  const ticketId = searchParams.get('ticket');
  const meetup = searchParams.get('meetup');
  const meetupPath =
    meetup != null ? `/meetup/${encodeURIComponent(meetup)}` : '/';
  const redirectStatus = searchParams.get('redirect_status');
  const redirectFailed =
    redirectStatus != null &&
    redirectStatus !== 'succeeded' &&
    redirectStatus !== 'processing';

  useEffect(() => {
    const channel = new BroadcastChannel(RSVP_RETURN_CHANNEL);
    let finalizedTimer: number | undefined;
    let settled = false;

    const settleHere = (): void => {
      if (settled) return;
      settled = true;
      if (redirectFailed) {
        toast.error('Payment failed. Please try again.');
        void navigate(meetupPath, { replace: true });
        return;
      }
      void (async () => {
        const paid =
          ticketId != null ? await waitForPaidTicket(ticketId) : false;
        toast.success(
          paid
            ? 'Payment successful! Your spot is confirmed.'
            : 'Payment received. Your ticket will be confirmed shortly.'
        );
        void navigate(meetupPath, { replace: true });
      })();
    };

    const ackTimer = window.setTimeout(settleHere, ACK_TIMEOUT_MS);

    channel.onmessage = (event: MessageEvent<RsvpReturnMessage>) => {
      if (event.data.ticketId !== ticketId) return;
      if (event.data.type === 'ack') {
        clearTimeout(ackTimer);
        finalizedTimer = window.setTimeout(settleHere, FINALIZED_TIMEOUT_MS);
      } else if (event.data.type === 'finalized') {
        // If the browser refuses to close, settle here.
        window.close();
        settleHere();
      }
    };

    // StrictMode double-mounts effects.
    if (!announcedRef.current) {
      announcedRef.current = true;
      postRsvpReturnMessage({
        type: 'return',
        ticketId,
        failed: redirectFailed,
      });
    }

    return () => {
      clearTimeout(ackTimer);
      clearTimeout(finalizedTimer);
      channel.close();
    };
  }, [ticketId, redirectFailed, meetupPath, navigate, waitForPaidTicket]);

  return (
    <Page>
      <div className="flex h-full flex-col items-center justify-center">
        <Loader2 className="size-10 animate-spin" />
        <p className="mt-4">Finalizing your payment…</p>
      </div>
    </Page>
  );
};

export default RsvpReturnPage;
