import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';
import { Spinner } from '@/components/ui/spinner';
import { type MeetupInfo, type SimpleTicketInfo } from '@keebmeet/shared';
import { Elements, PaymentElement } from '@stripe/react-stripe-js';
import type { Appearance } from '@stripe/stripe-js';
import { useFormik } from 'formik';
import { useTheme } from 'next-themes';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { FaStripe } from 'react-icons/fa';
import { FiArrowLeft, FiLock, FiUserCheck, FiUserX } from 'react-icons/fi';
import { toast } from 'sonner';
import * as Yup from 'yup';
import { useHoldCountdown } from '../../hooks/useHoldCountdown';
import { useWaitForPaidTicket } from '../../hooks/useWaitForPaidTicket';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  ticketSlice,
  useCreateTicketMutation,
  useDeleteTicketMutation,
  useGetTicketQuery,
  useUpdateTicketMutation,
} from '../../store/ticketSlice';
import { useGetUserQuery } from '../../store/userSlice';
import { formatMoney } from '../../util/money';
import {
  postRsvpReturnMessage,
  RSVP_RETURN_CHANNEL,
  type RsvpReturnMessage,
} from '../../util/rsvpReturnChannel';
import { hasMeetupEnded } from '../../util/timeUtil';
import { HoldCountdown } from './HoldCountdown';
import { PayButton, stripePromise } from './PaidRsvpPayment';

// Same stylesheet index.html loads, so the iframe renders the app font.
const stripeFonts = [
  {
    cssSrc:
      'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap',
  },
];

// Hex equivalents of the oklch tokens in index.css. Stripe's appearance API
// can't parse oklch, and CSS variables don't cross into its iframe.
const stripeAppearance = (dark: boolean): Appearance => ({
  theme: dark ? 'night' : 'stripe',
  variables: {
    colorPrimary: dark ? '#d97757' : '#c96442',
    colorBackground: dark ? '#262624' : '#faf9f5',
    colorText: dark ? '#f1f1ef' : '#3d3929',
    colorTextSecondary: dark ? '#b7b5a9' : '#6e6d68',
    colorTextPlaceholder: dark ? '#b7b5a9' : '#6e6d68',
    colorDanger: '#ef4444',
    fontFamily: "'DM Sans', sans-serif",
    borderRadius: '14px',
  },
  rules: {
    '.Input': { borderColor: dark ? '#52514a' : '#b4b2a7', boxShadow: 'none' },
    '.Tab': { boxShadow: 'none' },
    '.Block': { boxShadow: 'none' },
  },
});

const TicketHolderSchema = Yup.object().shape({
  displayName: Yup.string().required('Required'),
  firstName: Yup.string().required('Required'),
  lastName: Yup.string().required('Required'),
  email: Yup.string().email('Invalid email').required('Required'),
});

interface MeetupRsvpFormProps {
  meetup: MeetupInfo;
  isLoggedIn: boolean;
  ticket: SimpleTicketInfo | null;
  onCollapse: () => void;
}

export const MeetupRsvpForm = ({
  meetup,
  isLoggedIn,
  ticket,
  onCollapse,
}: MeetupRsvpFormProps): ReactNode => {
  const { user } = useAppSelector((state) => state.user);
  const dispatch = useAppDispatch();
  const waitForPaidTicket = useWaitForPaidTicket();
  const { resolvedTheme } = useTheme();

  const { data: fullUser } = useGetUserQuery(user?.id ?? '', {
    skip: user == null,
  });

  const isPendingHold = ticket?.payment_status === 'pending';
  const isManaging = ticket != null && !isPendingHold;
  const { data: ticketDetails } = useGetTicketQuery(ticket?.id ?? '', {
    skip: ticket == null,
  });

  const [rsvp, { isLoading: isRsvping }] = useCreateTicketMutation();
  const [updateTicket, { isLoading: isUpdating }] = useUpdateTicketMutation();
  const [deleteTicket, { isLoading: isCancelling }] = useDeleteTicketMutation();
  const isBusy = isRsvping || isUpdating || isCancelling;

  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null);
  const [paidTicketId, setPaidTicketId] = useState<string | null>(null);

  // confirmPayment and the return tab's broadcast can both report the same
  // payment.
  const finalizedTicketRef = useRef<string | null>(null);

  // Only return to the modal once the webhook has secured the ticket as paid.
  const onPaymentSuccess = async (): Promise<void> => {
    if (paidTicketId != null && finalizedTicketRef.current === paidTicketId) {
      return;
    }
    finalizedTicketRef.current = paidTicketId;
    const paid =
      paidTicketId != null ? await waitForPaidTicket(paidTicketId) : false;
    dispatch(ticketSlice.util.invalidateTags(['Tickets']));
    toast.success(
      paid
        ? `You're going to ${meetup.name}!`
        : 'Payment received. Your ticket will be confirmed shortly.'
    );
    onCollapse();
  };

  const hasEnded = hasMeetupEnded(meetup);

  const ticketType = meetup.ticket_types?.[0];
  const isPaid = ticketType != null && ticketType.price_cents > 0;
  const priceLabel = isPaid
    ? formatMoney(ticketType.price_cents, ticketType.currency)
    : null;
  const canCancel =
    ticket != null &&
    ticket.payment_status !== 'paid' &&
    ticket.payment_status !== 'refunded';

  const holdExpired = useHoldCountdown(holdExpiresAt)?.expired === true;
  // Once the hold lapses the PaymentIntent is dead, so drop back to the fields.
  const isPaymentStep =
    clientSecret != null && priceLabel != null && !holdExpired;

  const formik = useFormik({
    // When managing, prefill from the existing ticket; otherwise from the
    // fetched user. Reinitialised once either loads. Editable so the user can
    // RSVP / manage on someone else's behalf.
    initialValues: {
      displayName:
        ticketDetails?.ticket_holder_display_name ??
        fullUser?.display_name ??
        '',
      firstName:
        ticketDetails?.ticket_holder_first_name ?? fullUser?.first_name ?? '',
      lastName:
        ticketDetails?.ticket_holder_last_name ?? fullUser?.last_name ?? '',
      email: ticketDetails?.ticket_holder_email ?? fullUser?.email ?? '',
    },
    enableReinitialize: true,
    validationSchema: TicketHolderSchema,
    onSubmit: (values) => {
      void (async () => {
        const ticketHolder = {
          display_name: values.displayName,
          first_name: values.firstName,
          last_name: values.lastName,
          email: values.email,
        };
        try {
          if (ticket != null && !isPendingHold) {
            await updateTicket({
              ticketId: ticket.id,
              ticketHolder,
            }).unwrap();
            toast.success('Your RSVP details were updated.');
          } else {
            const result = await rsvp({
              meetupId: meetup.id,
              ticketHolder,
            }).unwrap();
            if (result.clientSecret != null) {
              setClientSecret(result.clientSecret);
              setHoldExpiresAt(result.holdExpiresAt ?? null);
              setPaidTicketId(result.ticketId ?? null);
              return;
            }
            toast.success(`You're going to ${meetup.name}!`);
          }
          onCollapse();
        } catch {
          toast.error('Something went wrong. Please try again.');
        }
      })();
    },
  });

  const onPaymentSuccessRef = useRef(onPaymentSuccess);
  useEffect(() => {
    onPaymentSuccessRef.current = onPaymentSuccess;
  });
  useEffect(() => {
    if (paidTicketId == null) return;
    const channel = new BroadcastChannel(RSVP_RETURN_CHANNEL);
    channel.onmessage = (event: MessageEvent<RsvpReturnMessage>) => {
      if (
        event.data.type !== 'return' ||
        event.data.ticketId !== paidTicketId
      ) {
        return;
      }
      postRsvpReturnMessage({ type: 'ack', ticketId: paidTicketId });
      const done = (): void => {
        postRsvpReturnMessage({ type: 'finalized', ticketId: paidTicketId });
      };
      if (event.data.failed === true) {
        // confirmPayment already surfaced the failure; leave the step open.
        done();
      } else {
        void onPaymentSuccessRef.current().finally(done);
      }
    };
    return () => {
      channel.close();
    };
  }, [paidTicketId]);

  // A reopened pending hold already holds a seat, so resume its payment.
  const resumeStartedRef = useRef(false);
  useEffect(() => {
    if (!isPendingHold || clientSecret != null || resumeStartedRef.current) {
      return;
    }
    resumeStartedRef.current = true;
    void (async () => {
      try {
        const result = await rsvp({ meetupId: meetup.id }).unwrap();
        if (result.clientSecret != null) {
          setClientSecret(result.clientSecret);
          setHoldExpiresAt(result.holdExpiresAt ?? null);
          setPaidTicketId(result.ticketId ?? null);
        }
      } catch {
        // Fall back to the manual button.
      }
    })();
  }, [isPendingHold, clientSecret, meetup.id, rsvp]);

  const onCancelRsvp = (): void => {
    void (async () => {
      if (ticket == null) return;
      try {
        await deleteTicket(ticket.id).unwrap();
        setCancelConfirmOpen(false);
        toast.success('Your RSVP was cancelled.');
        onCollapse();
      } catch {
        toast.error('Could not cancel your RSVP. Please try again.');
      }
    })();
  };

  const content = (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="-ml-2 shrink-0"
            aria-label="Back to details"
            onClick={onCollapse}
          >
            <FiArrowLeft />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isManaging ? 'Manage your RSVP' : 'Confirm your RSVP'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isManaging
                ? 'Update your details for '
                : 'Reserve your spot at '}
              <span className="font-semibold">{meetup.name}</span>.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <p className="text-md font-semibold">Ticket holder details</p>
          <FormField
            formik={formik}
            name="displayName"
            label="Display Name"
            // Locked once payment starts — the hold already captured it.
            disabled={!isLoggedIn || isPaymentStep}
          />
          <div className="border-border flex flex-col gap-4 rounded-md border border-dashed p-3">
            <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <FiLock className="size-3 shrink-0" />
              From your account · only visible to organizers
            </p>
            <div className="flex flex-row gap-2">
              <FormField
                formik={formik}
                name="firstName"
                label="First Name"
                className="flex-1"
                disabled
              />
              <FormField
                formik={formik}
                name="lastName"
                label="Last Name"
                className="flex-1"
                disabled
              />
            </div>
            <FormField
              formik={formik}
              name="email"
              label="Email"
              type="email"
              disabled
            />
          </div>
        </div>

        {holdExpiresAt != null ? (
          <HoldCountdown holdExpiresAt={holdExpiresAt} />
        ) : null}

        {isPaymentStep ? <PaymentElement /> : null}

        {hasEnded ? (
          <p className="text-sm font-semibold text-red-500">
            This meetup has already ended.
          </p>
        ) : !isLoggedIn ? (
          <p className="text-sm font-semibold text-yellow-600">
            You must be logged in to RSVP.
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-col gap-2 p-4">
        {isPaymentStep && priceLabel != null ? (
          <PayButton
            amountLabel={priceLabel}
            disabled={!isLoggedIn || hasEnded}
            returnUrl={`${window.location.origin}/rsvp/return?ticket=${paidTicketId ?? ''}&meetup=${meetup.slug}`}
            onSuccess={onPaymentSuccess}
          />
        ) : (
          <Button
            type="submit"
            size="lg"
            disabled={!isLoggedIn || hasEnded || isBusy || !formik.isValid}
          >
            <FiUserCheck />
            {isManaging
              ? 'Update RSVP'
              : isPaid
                ? `Continue to payment · ${priceLabel}`
                : 'Confirm RSVP'}
            {(isRsvping || isUpdating) && <Spinner />}
          </Button>
        )}
        {canCancel ? (
          <Button
            type="button"
            variant="destructive"
            onClick={() => setCancelConfirmOpen(true)}
            disabled={!isLoggedIn || hasEnded || isBusy}
          >
            <FiUserX />
            {isPendingHold ? 'Cancel reservation' : 'Cancel RSVP'}
          </Button>
        ) : null}
        {isPaymentStep ? (
          <p className="text-muted-foreground -mb-2 flex h-4 items-center justify-center gap-1 text-xs">
            Powered by <FaStripe title="Stripe" className="size-7" />
          </p>
        ) : null}
      </div>

      <Dialog open={cancelConfirmOpen} onOpenChange={setCancelConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel your RSVP?</DialogTitle>
            <DialogDescription>
              This will release your spot at {meetup.name}. You can RSVP again
              later if there's still room.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Keep RSVP
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              onClick={onCancelRsvp}
              disabled={isBusy}
            >
              <FiUserX />
              Cancel RSVP
              {isCancelling && <Spinner />}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  return (
    <form
      onSubmit={formik.handleSubmit}
      noValidate
      className="flex h-full flex-col"
    >
      {/* One provider so the footer Pay button shares the card's context. */}
      {isPaymentStep ? (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            fonts: stripeFonts,
            appearance: stripeAppearance(resolvedTheme === 'dark'),
          }}
        >
          {content}
        </Elements>
      ) : (
        content
      )}
    </form>
  );
};
