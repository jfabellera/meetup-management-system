import { Loader2 } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { stripePromise } from '../components/Meetups/PaidRsvpPayment';
import Page from '../components/Page/Page';
import { useWaitForPaidTicket } from '../hooks/useWaitForPaidTicket';
import { useAppDispatch } from '../store/hooks';
import { ticketSlice } from '../store/ticketSlice';

const isSuccessfulStatus = (status?: string): boolean =>
  status === 'succeeded' || status === 'processing';

const RsvpReturnPage = (): ReactNode => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const waitForPaidTicket = useWaitForPaidTicket();
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    void (async () => {
      const ticketId = params.get('ticket');
      const meetupSlug = params.get('meetup');
      const clientSecret = params.get('payment_intent_client_secret');
      const meetupPath =
        meetupSlug != null && meetupSlug !== '' ? `/meetup/${meetupSlug}` : '/';

      // Prefer the authoritative PaymentIntent status; fall back to the
      // redirect_status Stripe appends to the URL.
      let status = params.get('redirect_status') ?? undefined;
      const stripe = await stripePromise;
      if (stripe != null && clientSecret != null) {
        const { paymentIntent } =
          await stripe.retrievePaymentIntent(clientSecret);
        status = paymentIntent?.status ?? status;
      }

      if (!isSuccessfulStatus(status)) {
        toast.error('Payment was not completed. Please try again.');
        void navigate(meetupPath, { replace: true });
        return;
      }

      const paid =
        ticketId != null && ticketId !== ''
          ? await waitForPaidTicket(ticketId)
          : false;
      dispatch(ticketSlice.util.invalidateTags(['Tickets']));
      toast.success(
        paid
          ? 'RSVP successful! '
          : 'Payment received. Your ticket will be confirmed shortly.'
      );
      void navigate(meetupPath, { replace: true });
    })();
  }, [params, navigate, dispatch, waitForPaidTicket]);

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
