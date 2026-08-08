import QrScanner from '@/components/shared/QrScanner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useDisclosure } from '@/hooks/useDisclosure';
import { cn } from '@/lib/utils';
import { type TicketInfo } from '@keebmeet/shared';
import type React from 'react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { FiCheck, FiLock, FiSearch, FiX } from 'react-icons/fi';
import { MdQrCodeScanner } from 'react-icons/md';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { AttendeeDetailsDialog } from '../components/AttendeeDetailsDialog';
import { ExpandableCard } from '../components/ExpandableCard';
import { enterKioskMode, useKioskMeetup } from '../util/kioskMode';
import { useGetMeetupQuery } from '../store/meetupSlice';
import {
  useCheckInAttendeeMutation,
  useEditAttendeeMutation,
  useGetMeetupAttendeesQuery,
} from '../store/organizerSlice';

const orDash = (value: string | null | undefined): ReactNode =>
  value != null && value.trim() !== '' ? (
    value
  ) : (
    <span className="text-muted-foreground">—</span>
  );

const CheckInPage = (): ReactNode => {
  const { meetupId: slugParam } = useParams();
  const { data: meetup } = useGetMeetupQuery(slugParam ?? '');
  const { data: attendees, isLoading } = useGetMeetupAttendeesQuery(
    {
      meetup_id: meetup?.id ?? '',
      params: { detail_level: 'detailed' },
    },
    { skip: meetup == null }
  );

  const [searchValue, setSearchValue] = useState<string>('');
  const searchRef = useRef<HTMLInputElement>(null);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();
  const {
    isOpen: isKioskConfirmOpen,
    onOpen: onKioskConfirmOpen,
    onClose: onKioskConfirmClose,
  } = useDisclosure();
  const isKioskMode = useKioskMeetup() != null;
  const [editingAttendee, setEditingAttendee] = useState<TicketInfo | null>(
    null
  );

  const isPaidMeetup =
    meetup?.ticket_types?.some((type) => type.price_cents > 0) ?? false;

  const openEditDialog = (attendee: TicketInfo): void => {
    setEditingAttendee(attendee);
    onEditOpen();
  };

  const [ticket, setTicket] = useState<TicketInfo | null>(null);
  // Tracks the user's intent rather than the ticket's current state: selecting
  // an attendee always means "check in", and undoing only happens via the
  // dedicated button in the table.
  const [action, setAction] = useState<'checkin' | 'uncheckin'>('checkin');
  // Undoing a check-in is destructive, so we require the organizer to type the
  // attendee's display name to confirm.
  const [confirmText, setConfirmText] = useState<string>('');
  const [checkInAttendee, { isLoading: isCheckingIn }] =
    useCheckInAttendeeMutation();
  const [editAttendee, { isLoading: isUncheckingIn }] =
    useEditAttendeeMutation();

  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [useCamera, setUseCamera] = useState<boolean>(false);

  const filteredAttendees = useMemo(() => {
    if (attendees == null) return [];
    const filtered = attendees
      .filter(
        (attendee: TicketInfo) =>
          attendee.payment_status !== 'refunded' &&
          attendee.payment_status !== 'pending'
      )
      .filter(
        (attendee: TicketInfo) =>
          Boolean(
            attendee.ticket_holder_display_name
              .toLowerCase()
              .includes(searchValue.toLowerCase())
          ) ||
          Boolean(
            attendee.ticket_holder_first_name
              .toLowerCase()
              .includes(searchValue.toLowerCase())
          ) ||
          Boolean(
            attendee.ticket_holder_last_name
              .toLowerCase()
              .includes(searchValue.toLowerCase())
          ) ||
          Boolean(attendee.qr_code_value.includes(searchValue))
      )
      .sort((a, b) => {
        return a.ticket_holder_display_name.toLowerCase() <
          b.ticket_holder_display_name.toLowerCase()
          ? -1
          : 1;
      });

    if (searchValue !== '' && filtered.length > 0) {
      setFocusedIndex(0);
    } else {
      setFocusedIndex(null);
    }

    return filtered;
  }, [attendees, searchValue]);

  const handleCheckIn = (attendee: TicketInfo | null = ticket): void => {
    void (async () => {
      if (attendee != null) {
        const result = await checkInAttendee(attendee.id);

        if ('error' in result) {
          toast.error('Error', {
            description: `Could not check ${attendee.ticket_holder_display_name} in`,
          });
        } else {
          toast.success('Success', {
            description: `${attendee.ticket_holder_display_name} checked in`,
            action: {
              label: 'Edit details',
              onClick: () => openEditDialog(attendee),
            },
          });
        }
      }
      setTicket(null);
      setSearchValue('');
      setConfirmText('');
      onClose();
    })();
  };

  // Whether the undo confirmation requirement (typing the display name) is met.
  // Check-in has no such requirement.
  const canConfirm =
    action === 'checkin' ||
    (ticket != null &&
      confirmText.trim() === ticket.ticket_holder_display_name.trim());

  const handleUncheckIn = (): void => {
    if (!canConfirm) return;
    void (async () => {
      if (ticket != null) {
        const result = await editAttendee({
          ticketId: ticket.id,
          payload: { is_checked_in: false },
        });

        if ('error' in result) {
          toast.error('Error', {
            description: `Could not undo check-in for ${ticket.ticket_holder_display_name}`,
          });
        } else {
          toast.success('Success', {
            description: `Check-in undone for ${ticket.ticket_holder_display_name}`,
          });
        }
      }
      setTicket(null);
      setSearchValue('');
      setConfirmText('');
      onClose();
    })();
  };

  const handleSelectAttendee = (
    attendee: TicketInfo,
    bypassConfirm: boolean = false
  ): void => {
    if (attendee.is_checked_in) {
      toast.warning('Already checked in', {
        description: `${attendee.ticket_holder_display_name} is already checked in`,
        action: {
          label: 'Edit details',
          onClick: () => openEditDialog(attendee),
        },
      });
      if (bypassConfirm) {
        setSearchValue('');
      } else {
        searchRef.current?.select();
      }
      return;
    }

    setTicket(attendee);
    setAction('checkin');

    if (bypassConfirm) {
      handleCheckIn(attendee);
      return;
    }

    onOpen();
  };

  // If whole search value matches a QR code, automatically check in the
  // attendee without requiring a confirmation dialog. Useful for barcode
  // scanners. Scanners don't need to be configured to press enter after
  // scanning, but if they do there shouldn't be any issues.
  useEffect(() => {
    if (
      filteredAttendees.length === 1 &&
      searchValue === filteredAttendees[0].qr_code_value
    ) {
      handleSelectAttendee(filteredAttendees[0], true);
    }
  }, [searchValue, filteredAttendees]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (isKioskConfirmOpen) return;

      if (isOpen) {
        if (event.key === 'Enter') {
          event.preventDefault();
          if (action === 'uncheckin') {
            handleUncheckIn();
          } else {
            handleCheckIn();
          }
        }
        return;
      }

      searchRef.current?.focus();

      if (event.key === 'Escape') {
        setSearchValue('');
      }

      if (event.key === 'Enter') {
        if (searchValue !== '' && focusedIndex != null) {
          event.preventDefault();
          handleSelectAttendee(filteredAttendees[focusedIndex]);
        }
      }

      if (event.key === 'ArrowDown') {
        if (focusedIndex != null) {
          event.preventDefault();
          setFocusedIndex(
            Math.min(filteredAttendees.length - 1, focusedIndex + 1)
          );
        }
      }

      if (event.key === 'ArrowUp') {
        if (focusedIndex != null) {
          event.preventDefault();
          setFocusedIndex(Math.max(0, focusedIndex - 1));
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    focusedIndex,
    isOpen,
    isKioskConfirmOpen,
    searchValue,
    filteredAttendees,
    action,
    ticket,
    confirmText,
  ]);

  const handleSearchChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    setFocusedIndex(null);
    setSearchValue(event.target.value);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col gap-2 p-4 text-center">
      <div className="relative mb-2">
        <h2 className="text-center text-2xl font-medium">Check-in</h2>
        {!isKioskMode && (
          <Button
            variant="outline"
            size="sm"
            className="absolute top-1/2 right-0 hidden -translate-y-1/2 md:inline-flex"
            onClick={onKioskConfirmOpen}
          >
            <FiLock />
            Kiosk mode
          </Button>
        )}
      </div>

      {useCamera && (
        <div className="flex flex-col items-center justify-center gap-2">
          <QrScanner onScan={setSearchValue} />
        </div>
      )}
      <div className="bg-card text-card-foreground focus-within:border-ring focus-within:ring-ring/50 flex flex-row items-center gap-1 rounded-md border p-1.5 shadow-sm transition-[color,box-shadow] focus-within:ring-[3px]">
        <FiSearch className="text-muted-foreground ml-2 size-4 shrink-0" />
        <Input
          ref={searchRef}
          className="h-10 border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent"
          placeholder={'Start typing a username, name, or email...'}
          value={searchValue}
          onChange={handleSearchChange}
        />
        {searchValue !== '' && (
          <Button
            size="icon-lg"
            variant="ghost"
            aria-label="Clear search"
            onClick={() => {
              setSearchValue('');
              searchRef.current?.focus();
            }}
          >
            <FiX />
          </Button>
        )}
        <Button
          size="icon-lg"
          variant={useCamera ? 'default' : 'outline'}
          aria-label="Scan QR code"
          onClick={() => setUseCamera(!useCamera)}
        >
          <MdQrCodeScanner />
        </Button>
      </div>
      {filteredAttendees.length === 0 ? (
        <div className="bg-card text-muted-foreground rounded-md p-8 text-center text-sm shadow-sm">
          {searchValue !== ''
            ? 'No attendees match your search.'
            : 'No attendees to check in yet.'}
        </div>
      ) : null}

      {/* Desktop: table with keyboard-navigable rows. */}
      <div
        className={cn(
          'bg-card text-card-foreground rounded-md p-4 shadow-sm',
          filteredAttendees.length === 0 ? 'hidden' : 'hidden md:block'
        )}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Display Name</TableHead>
              <TableHead>First Name</TableHead>
              <TableHead>Last Name</TableHead>
              <TableHead>Checked in?</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAttendees != null
              ? filteredAttendees.map((attendee) => (
                  <TableRow
                    key={attendee.id}
                    className={cn(
                      'hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors',
                      focusedIndex != null &&
                        attendee.id === filteredAttendees[focusedIndex].id
                        ? 'bg-accent text-accent-foreground'
                        : ''
                    )}
                    onClick={() => {
                      handleSelectAttendee(attendee);
                    }}
                  >
                    <TableCell className="text-left">
                      {attendee.ticket_holder_display_name}
                    </TableCell>
                    <TableCell className="text-left">
                      {orDash(attendee.ticket_holder_first_name)}
                    </TableCell>
                    <TableCell className="text-left">
                      {orDash(attendee.ticket_holder_last_name)}
                    </TableCell>
                    <TableCell className="text-left">
                      {attendee.is_checked_in ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTicket(attendee);
                                setAction('uncheckin');
                                setConfirmText('');
                                onOpen();
                              }}
                            >
                              <FiCheck />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Click to edit</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))
              : null}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: a card per attendee; expand to check in or undo. */}
      <div
        className={cn(
          'flex-col gap-2 text-left md:hidden',
          filteredAttendees.length === 0 ? 'hidden' : 'flex'
        )}
      >
        {filteredAttendees.map((attendee) => (
          <ExpandableCard
            key={attendee.id}
            title={attendee.ticket_holder_display_name}
            trailing={
              attendee.is_checked_in ? (
                <FiCheck
                  className="size-4 shrink-0 text-green-600"
                  aria-label={`${attendee.ticket_holder_display_name} is checked in`}
                />
              ) : null
            }
            expanded={expandedId === attendee.id}
            onToggle={() =>
              setExpandedId(expandedId === attendee.id ? null : attendee.id)
            }
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
            {attendee.is_checked_in ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setTicket(attendee);
                  setAction('uncheckin');
                  setConfirmText('');
                  onOpen();
                }}
              >
                Undo check-in
              </Button>
            ) : (
              <Button
                className="w-full"
                onClick={() => handleSelectAttendee(attendee)}
              >
                Check in
              </Button>
            )}
          </ExpandableCard>
        ))}
      </div>

      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setTicket(null);
            setConfirmText('');
            onClose();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'uncheckin'
                ? 'Confirm undo check-in'
                : 'Confirm check-in'}
            </DialogTitle>
          </DialogHeader>
          <p>
            {action === 'uncheckin'
              ? `Do you want to undo check-in for ${ticket?.ticket_holder_display_name ?? 'user'}?`
              : `Do you want to check ${ticket?.ticket_holder_display_name ?? 'user'} in?`}
          </p>
          {action === 'uncheckin' ? (
            <div className="flex flex-col gap-2 text-left">
              <p className="text-muted-foreground text-sm">
                Type{' '}
                <span className="text-foreground font-medium">
                  {ticket?.ticket_holder_display_name}
                </span>{' '}
                to confirm.
              </p>
              <Input
                value={confirmText}
                onChange={(e) => {
                  setConfirmText(e.target.value);
                }}
                placeholder={ticket?.ticket_holder_display_name}
              />
            </div>
          ) : null}
          <DialogFooter>
            <Button
              variant={action === 'uncheckin' ? 'destructive' : 'default'}
              autoFocus={action === 'checkin'}
              disabled={!canConfirm || isCheckingIn || isUncheckingIn}
              onClick={
                action === 'uncheckin'
                  ? handleUncheckIn
                  : () => {
                      handleCheckIn();
                    }
              }
            >
              Confirm
              {(isCheckingIn || isUncheckingIn) && <Spinner />}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isKioskConfirmOpen}
        onOpenChange={(open) => {
          if (!open) onKioskConfirmClose();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter kiosk mode?</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 text-left text-sm">
            <p>
              Kiosk mode turns this device into a self-service check-in station
              that you can leave out for attendees.
            </p>
            <p>
              While it&apos;s active you will be locked out of all other
              organizer pages and navigation — only this check-in page is
              accessible, even after a refresh.
            </p>
            <p>
              To exit kiosk mode, press{' '}
              <kbd className="bg-muted rounded border px-1.5 py-0.5 font-mono text-xs">
                [
              </kbd>{' '}
              <kbd className="bg-muted rounded border px-1.5 py-0.5 font-mono text-xs">
                ]
              </kbd>{' '}
              <kbd className="bg-muted rounded border px-1.5 py-0.5 font-mono text-xs">
                \
              </kbd>{' '}
              simultaneously.
            </p>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (slugParam != null) enterKioskMode(slugParam);
                onKioskConfirmClose();
              }}
            >
              <FiLock />
              Enter kiosk mode
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AttendeeDetailsDialog
        key={editingAttendee?.id}
        attendee={editingAttendee}
        open={isEditOpen}
        onOpenChange={(open) => {
          if (!open) {
            onEditClose();
          }
        }}
        isPaidMeetup={isPaidMeetup}
      />
    </div>
  );
};

export default CheckInPage;
