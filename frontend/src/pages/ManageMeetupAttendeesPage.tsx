import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useDisclosure } from '@/hooks/useDisclosure';
import { type TicketInfo } from '@keebmeet/shared';
import dayjs from 'dayjs';
import { useState, type ReactNode } from 'react';
import { FiEdit2 } from 'react-icons/fi';
import { useParams } from 'react-router-dom';
import { AttendeeDetailsDialog } from '../components/AttendeeDetailsDialog';
import { DataTable, type DataTableColumn } from '../components/DataTable';
import { ExpandableCard } from '../components/ExpandableCard';
import { useGetMeetupQuery } from '../store/meetupSlice';
import { useGetMeetupAttendeesQuery } from '../store/organizerSlice';

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

const ManageMeetupAttendeesPage = (): ReactNode => {
  const { meetupId } = useParams();
  const { data: meetup } = useGetMeetupQuery(meetupId ?? '');
  const { data: attendees, isLoading } = useGetMeetupAttendeesQuery(
    {
      meetup_id: meetup?.id ?? '',
      params: {
        detail_level: 'detailed',
      },
    },
    { skip: meetup == null }
  );

  const { isOpen, onOpen, onClose } = useDisclosure();

  const [viewing, setViewing] = useState<TicketInfo | null>(null);

  const isPaidMeetup =
    meetup?.ticket_types?.some((type) => type.price_cents > 0) ?? false;

  const openDialog = (attendee: TicketInfo): void => {
    setViewing(attendee);
    onOpen();
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  const columns: Array<DataTableColumn<TicketInfo>> = [
    {
      id: 'name',
      header: 'Display Name',
      sortLabel: 'Name',
      sortValue: (attendee) => attendee.ticket_holder_display_name,
      cell: (attendee) => attendee.ticket_holder_display_name,
    },
    ...(isPaidMeetup
      ? [
          {
            id: 'status',
            header: 'Status',
            cell: (attendee: TicketInfo) =>
              paymentStatusBadge(attendee.payment_status),
          } satisfies DataTableColumn<TicketInfo>,
        ]
      : []),
    {
      id: 'firstName',
      header: 'First Name',
      sortLabel: 'First name',
      sortValue: (attendee) => attendee.ticket_holder_first_name,
      cell: (attendee) => orDash(attendee.ticket_holder_first_name),
    },
    {
      id: 'lastName',
      header: 'Last Name',
      sortLabel: 'Last name',
      sortValue: (attendee) => attendee.ticket_holder_last_name,
      cell: (attendee) => orDash(attendee.ticket_holder_last_name),
    },
    {
      id: 'entries',
      header: 'Raffle Entries',
      align: 'center',
      sortLabel: 'Raffle entries',
      sortValue: (attendee) => attendee.raffle_entries,
      cell: (attendee) => attendee.raffle_entries,
    },
    {
      id: 'wins',
      header: 'Raffle Wins',
      align: 'center',
      sortLabel: 'Raffle wins',
      sortValue: (attendee) => attendee.raffle_wins,
      cell: (attendee) => attendee.raffle_wins,
    },
    {
      id: 'signedUp',
      header: 'Signed Up',
      sortLabel: 'Signed up',
      sortValue: (attendee) => dayjs(attendee.created_at).valueOf(),
      cell: (attendee) => dayjs(attendee.created_at).format('M/D/YY hh:mm A'),
    },
    {
      id: 'rsvp',
      header: 'RSVP Method',
      cell: (attendee) => attendee.rsvp_method,
    },
  ];

  return (
    <div className="m-2 flex flex-col gap-4 md:m-4">
      <DataTable
        title="Attendees"
        data={attendees}
        columns={columns}
        getRowId={(attendee) => attendee.id}
        initialSort={{ columnId: 'signedUp', direction: 'desc' }}
        onRowClick={openDialog}
        search={{
          placeholder: 'Search attendees…',
          getText: (attendee) =>
            `${attendee.ticket_holder_display_name} ${attendee.ticket_holder_first_name} ${attendee.ticket_holder_last_name}`,
        }}
        emptyMessage={({ hasRows }) =>
          hasRows ? 'No attendees match your search.' : 'No attendees yet.'
        }
        renderCard={(attendee, { expanded, toggle }) => (
          <ExpandableCard
            title={attendee.ticket_holder_display_name}
            subtitle={dayjs(attendee.created_at).format('M/D/YY hh:mm A')}
            trailing={
              isPaidMeetup ? paymentStatusBadge(attendee.payment_status) : null
            }
            expanded={expanded}
            onToggle={toggle}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground text-sm">First name</span>
              <span className="text-sm">
                {orDash(attendee.ticket_holder_first_name)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground text-sm">Last name</span>
              <span className="text-sm">
                {orDash(attendee.ticket_holder_last_name)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground text-sm">
                Raffle entries
              </span>
              <span className="text-sm">{attendee.raffle_entries}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground text-sm">Raffle wins</span>
              <span className="text-sm">{attendee.raffle_wins}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground text-sm">RSVP method</span>
              <span className="text-sm">{attendee.rsvp_method}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => openDialog(attendee)}
            >
              <FiEdit2 />
              Edit details
            </Button>
          </ExpandableCard>
        )}
      />

      <AttendeeDetailsDialog
        key={viewing?.id}
        attendee={viewing}
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            onClose();
          }
        }}
        isPaidMeetup={isPaidMeetup}
      />
    </div>
  );
};

export default ManageMeetupAttendeesPage;
