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
import { useFormik } from 'formik';
import { useState, type ReactNode } from 'react';
import { FiArrowLeft, FiLock, FiUserCheck, FiUserX } from 'react-icons/fi';
import { toast } from 'sonner';
import * as Yup from 'yup';
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
import { hasMeetupEnded } from '../../util/timeUtil';
import { PaidRsvpPayment } from './PaidRsvpPayment';

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

  const onPaymentSuccess = (): void => {
    const refreshTickets = (): void => {
      dispatch(ticketSlice.util.invalidateTags(['Tickets']));
    };
    refreshTickets();
    setTimeout(refreshTickets, 2500);
    onCollapse();
  };

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

  const isPaymentStep = clientSecret != null && priceLabel != null;

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

  return (
    <form
      onSubmit={formik.handleSubmit}
      noValidate
      className="flex h-full flex-col"
    >
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
              {isManaging
                ? 'Manage your RSVP'
                : isPendingHold || isPaymentStep
                  ? 'Complete your payment'
                  : 'Confirm your RSVP'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isManaging
                ? 'Update your details for '
                : isPendingHold || isPaymentStep
                  ? 'Finish paying to confirm your spot at '
                  : 'Reserve your spot at '}
              <span className="font-semibold">{meetup.name}</span>.
            </p>
          </div>
        </div>

        {isPaymentStep ? (
          <PaidRsvpPayment
            clientSecret={clientSecret}
            amountLabel={priceLabel}
            holdExpiresAt={holdExpiresAt}
            onSuccess={onPaymentSuccess}
          />
        ) : (
          <>
            <div className="flex flex-col gap-4">
              <p className="text-md font-semibold">Ticket holder details</p>
              <FormField
                formik={formik}
                name="displayName"
                label="Display Name"
                disabled={!isLoggedIn}
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

            {hasEnded ? (
              <p className="text-sm font-semibold text-red-500">
                This meetup has already ended.
              </p>
            ) : !isLoggedIn ? (
              <p className="text-sm font-semibold text-yellow-600">
                You must be logged in to RSVP.
              </p>
            ) : null}
          </>
        )}
      </div>

      {!isPaymentStep ? (
        <div className="flex shrink-0 flex-col gap-3 p-4">
          <Button
            type="submit"
            size="lg"
            disabled={!isLoggedIn || hasEnded || isBusy || !formik.isValid}
          >
            <FiUserCheck />
            {isManaging
              ? 'Update RSVP'
              : isPendingHold
                ? `Complete payment · ${priceLabel}`
                : isPaid
                  ? `Continue to payment · ${priceLabel}`
                  : 'Confirm RSVP'}
            {(isRsvping || isUpdating) && <Spinner />}
          </Button>
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
        </div>
      ) : null}

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
    </form>
  );
};
