import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { type TicketInfo } from '@keebmeet/shared';
import dayjs from 'dayjs';
import { useState, type ReactNode } from 'react';
import { FiEdit2 } from 'react-icons/fi';
import { toast } from 'sonner';
import {
  useEditAttendeeMutation,
  useRefundAttendeeMutation,
} from '../store/organizerSlice';

const paymentStatusBadge = (
  status: TicketInfo['payment_status']
): ReactNode => {
  switch (status) {
    case 'paid':
      return <Badge className="bg-green-600 text-white">Paid</Badge>;
    case 'pending':
      return (
        <Badge
          variant="outline"
          className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
        >
          Pending
        </Badge>
      );
    case 'refunded':
      return <Badge variant="secondary">Refunded</Badge>;
    default:
      // Free RSVP ('confirmed') — no payment to show.
      return null;
  }
};

const orDash = (value: string | null | undefined): ReactNode =>
  value != null && value.trim() !== '' ? (
    value
  ) : (
    <span className="text-muted-foreground">—</span>
  );

interface AttendeeDetailsDialogProps {
  attendee: TicketInfo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPaidMeetup: boolean;
}

export const AttendeeDetailsDialog = ({
  attendee,
  open,
  onOpenChange,
  isPaidMeetup,
}: AttendeeDetailsDialogProps): ReactNode => {
  const [editAttendee, { isLoading: isSaving }] = useEditAttendeeMutation();
  const [refundAttendee, { isLoading: isRefunding }] =
    useRefundAttendeeMutation();

  // Local editable copy so saved changes show immediately without waiting for
  // the attendees list to refetch. Callers key this component on the attendee
  // id, so a fresh copy is seeded whenever a different attendee is opened.
  const [viewing, setViewing] = useState<TicketInfo | null>(attendee);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [raffleEntries, setRaffleEntries] = useState<string>(
    attendee != null ? String(attendee.raffle_entries) : ''
  );
  const [refundConfirmOpen, setRefundConfirmOpen] = useState(false);

  const handleOpenChange = (next: boolean): void => {
    if (!next) {
      setIsEditing(false);
    }
    onOpenChange(next);
  };

  const startEditing = (): void => {
    if (viewing == null) return;
    setRaffleEntries(String(viewing.raffle_entries));
    setIsEditing(true);
  };

  const cancelEditing = (): void => {
    if (viewing != null) {
      setRaffleEntries(String(viewing.raffle_entries));
    }
    setIsEditing(false);
  };

  const entries = parseInt(raffleEntries, 10);
  const canSave = Number.isInteger(entries) && entries >= 0;

  const handleSave = (): void => {
    if (viewing == null || !canSave) return;

    void (async () => {
      const result = await editAttendee({
        ticketId: viewing.id,
        payload: {
          raffle_entries: entries,
        },
      });

      if ('error' in result) {
        toast.error('Error', {
          description: `Could not update ${viewing.ticket_holder_display_name}`,
        });
      } else {
        toast.success('Success', {
          description: `${viewing.ticket_holder_display_name} updated`,
        });
        setViewing({ ...viewing, raffle_entries: entries });
        setIsEditing(false);
      }
    })();
  };

  const handleRefund = (): void => {
    if (viewing == null) return;

    void (async () => {
      const result = await refundAttendee(viewing.id);

      if ('error' in result) {
        toast.error('Refund failed', {
          description: `Could not refund ${viewing.ticket_holder_display_name}`,
        });
      } else {
        toast.success('Ticket refunded', {
          description: `${viewing.ticket_holder_display_name} was refunded`,
        });
        setViewing({ ...viewing, payment_status: 'refunded' });
        setRefundConfirmOpen(false);
      }
    })();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <div className="flex items-center justify-between gap-2">
              <DialogTitle>Attendee details</DialogTitle>
              {!isEditing ? (
                <Button
                  variant="ghost"
                  aria-label="Edit attendee"
                  onClick={startEditing}
                >
                  <FiEdit2 />
                  Edit
                </Button>
              ) : null}
            </div>
          </DialogHeader>
          {viewing != null ? (
            <dl className="grid grid-cols-2 items-center gap-x-4 gap-y-3 text-sm">
              <dt className="text-muted-foreground">Display Name</dt>
              <dd className="text-right">
                {viewing.ticket_holder_display_name}
              </dd>

              {isPaidMeetup ? (
                <>
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="ml-auto">
                    {paymentStatusBadge(viewing.payment_status) ?? '—'}
                  </dd>
                </>
              ) : null}

              <dt className="text-muted-foreground">First Name</dt>
              <dd className="text-right">
                {orDash(viewing.ticket_holder_first_name)}
              </dd>

              <dt className="text-muted-foreground">Last Name</dt>
              <dd className="text-right">
                {orDash(viewing.ticket_holder_last_name)}
              </dd>

              <dt className="text-muted-foreground">Raffle Entries</dt>
              <dd className="text-right">
                {isEditing ? (
                  <Input
                    type="number"
                    min={0}
                    className="ml-auto w-24 text-right"
                    value={raffleEntries}
                    onChange={(e) => {
                      setRaffleEntries(e.target.value);
                    }}
                  />
                ) : (
                  viewing.raffle_entries
                )}
              </dd>

              <dt className="text-muted-foreground">Raffle Wins</dt>
              <dd className="text-right">{viewing.raffle_wins}</dd>

              <dt className="text-muted-foreground">Signed Up</dt>
              <dd className="text-right">
                {dayjs(viewing.created_at).format('M/D/YY hh:mm A')}
              </dd>
            </dl>
          ) : null}
          <DialogFooter>
            {isEditing ? (
              <>
                <Button variant="outline" onClick={cancelEditing}>
                  Cancel
                </Button>
                <Button disabled={!canSave || isSaving} onClick={handleSave}>
                  Save
                  {isSaving && <Spinner />}
                </Button>
              </>
            ) : (
              <>
                {isPaidMeetup && viewing?.payment_status === 'paid' ? (
                  <Button
                    variant="destructive"
                    className="mr-auto"
                    onClick={() => setRefundConfirmOpen(true)}
                  >
                    Refund ticket
                  </Button>
                ) : null}
                <Button
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                >
                  Close
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={refundConfirmOpen} onOpenChange={setRefundConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refund this ticket?</DialogTitle>
            <DialogDescription>
              {viewing?.ticket_holder_display_name} will be refunded in full and
              their spot released. Their ticket is kept but marked refunded.
              This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRefundConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isRefunding}
              onClick={handleRefund}
            >
              Refund
              {isRefunding && <Spinner />}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
