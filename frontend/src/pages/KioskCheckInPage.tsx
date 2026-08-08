import QrScanner from '@/components/shared/QrScanner';
import { Spinner } from '@/components/ui/spinner';
import { type TicketInfo } from '@keebmeet/shared';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { MdQrCodeScanner } from 'react-icons/md';
import { Navigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useMeetupLiveUpdates } from '../hooks/useMeetupLiveUpdates';
import { useGetMeetupQuery } from '../store/meetupSlice';
import {
  useCheckInAttendeeMutation,
  useGetMeetupAttendeesQuery,
} from '../store/organizerSlice';
import { exitKioskMode, useKioskConfig } from '../util/kioskMode';

const EXIT_COMBO = ['BracketLeft', 'BracketRight', 'Backslash'];
const STATUS_RESET_MS = 6000;
// Barcode scanners type the whole code in a quick burst; anything that lingers
// longer is a partial/garbage read that would block future scans.
const DEVICE_INPUT_IDLE_RESET_MS = 2000;

type KioskStatus =
  | { kind: 'success' | 'already'; name: string }
  | { kind: 'unrecognized' | 'error' };

const KioskCheckInPage = (): ReactNode => {
  const kioskConfig = useKioskConfig();
  const { meetupId } = useParams();
  const { data: meetup } = useGetMeetupQuery(kioskConfig?.meetup ?? '', {
    skip: kioskConfig == null,
  });
  const { data: attendees } = useGetMeetupAttendeesQuery(
    { meetup_id: meetup?.id ?? '' },
    { skip: meetup == null }
  );
  const [checkInAttendee, { isLoading: isCheckingIn }] =
    useCheckInAttendeeMutation();

  useMeetupLiveUpdates(meetup);

  const [status, setStatus] = useState<KioskStatus | null>(null);
  const [deviceBuffer, setDeviceBuffer] = useState<string>('');
  const deviceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const held = new Set<string>();

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (!EXIT_COMBO.includes(event.code)) return;
      held.add(event.code);
      if (EXIT_COMBO.every((code) => held.has(code))) {
        held.clear();
        exitKioskMode();
        toast.info('Kiosk mode exited');
      }
    };
    const handleKeyUp = (event: KeyboardEvent): void => {
      held.delete(event.code);
    };
    // Keyups can be missed while the window is unfocused.
    const handleBlur = (): void => {
      held.clear();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Barcode scanners emit keystrokes, so keep the hidden input focused to
  // receive them.
  useEffect(() => {
    if (kioskConfig?.scanner !== 'device') return;

    const focusInput = (): void => {
      deviceInputRef.current?.focus();
    };

    focusInput();
    document.addEventListener('keydown', focusInput);
    return () => {
      document.removeEventListener('keydown', focusInput);
    };
  }, [kioskConfig?.scanner]);

  useEffect(() => {
    if (status == null) return;
    const timer = setTimeout(() => {
      setStatus(null);
    }, STATUS_RESET_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [status]);

  useEffect(() => {
    if (deviceBuffer === '') return;
    const timer = setTimeout(() => {
      setDeviceBuffer('');
    }, DEVICE_INPUT_IDLE_RESET_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [deviceBuffer]);

  const findAttendee = (value: string): TicketInfo | undefined =>
    attendees?.find((attendee) => attendee.qr_code_value === value);

  const handleScan = (raw: string): void => {
    const value = raw.trim();
    if (value === '' || isCheckingIn) return;

    const attendee = findAttendee(value);
    if (
      attendee == null ||
      attendee.payment_status === 'refunded' ||
      attendee.payment_status === 'pending'
    ) {
      setStatus({ kind: 'unrecognized' });
      return;
    }

    if (attendee.is_checked_in) {
      setStatus({
        kind: 'already',
        name: attendee.ticket_holder_display_name,
      });
      return;
    }

    void (async () => {
      const result = await checkInAttendee(attendee.id);
      setStatus(
        'error' in result
          ? { kind: 'error' }
          : { kind: 'success', name: attendee.ticket_holder_display_name }
      );
    })();
  };

  const handleDeviceInput = (value: string): void => {
    if (findAttendee(value.trim()) != null) {
      handleScan(value);
      setDeviceBuffer('');
    } else {
      setDeviceBuffer(value);
    }
  };

  if (kioskConfig != null && meetupId !== kioskConfig.meetup) {
    return (
      <Navigate to={`/meetup/${kioskConfig.meetup}/manage/checkin`} replace />
    );
  }

  const renderStatus = (): ReactNode => {
    if (isCheckingIn) {
      return <Spinner className="size-12" />;
    }

    switch (status?.kind) {
      case 'success':
        return (
          <>
            <FiCheckCircle className="size-16 text-green-600" />
            <p className="text-3xl font-semibold">Welcome, {status.name}!</p>
            <p className="text-muted-foreground">You&apos;re checked in.</p>
          </>
        );
      case 'already':
        return (
          <>
            <FiAlertCircle className="size-16 text-amber-500" />
            <p className="text-3xl font-semibold">
              {status.name}, you&apos;re already checked in
            </p>
            <p className="text-muted-foreground">
              Please see an organizer if this doesn&apos;t look right.
            </p>
          </>
        );
      case 'unrecognized':
        return (
          <>
            <FiAlertCircle className="text-destructive size-16" />
            <p className="text-3xl font-semibold">Ticket not recognized</p>
            <p className="text-muted-foreground">Please see an organizer.</p>
          </>
        );
      case 'error':
        return (
          <>
            <FiAlertCircle className="text-destructive size-16" />
            <p className="text-3xl font-semibold">Something went wrong</p>
            <p className="text-muted-foreground">
              Please try again or see an organizer.
            </p>
          </>
        );
      default:
        return (
          <p className="text-muted-foreground text-xl">
            {kioskConfig?.scanner === 'device'
              ? 'Scan your ticket to check in.'
              : 'Hold your ticket up to the camera to check in.'}
          </p>
        );
    }
  };

  return (
    <div className="bg-muted flex h-svh flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-2xl grow flex-col items-center justify-center gap-8 p-6 text-center">
        <div className="flex flex-col gap-1">
          <h1 className="line-clamp-2 text-3xl font-bold">{meetup?.name}</h1>
          <h2 className="text-muted-foreground text-xl">Self check-in</h2>
        </div>

        <div className="flex min-h-40 flex-col items-center justify-center gap-3">
          {renderStatus()}
        </div>

        {kioskConfig?.scanner === 'device' ? (
          <>
            <MdQrCodeScanner className="text-muted-foreground size-24 animate-pulse" />
            <input
              ref={deviceInputRef}
              className="sr-only"
              value={deviceBuffer}
              aria-label="Ticket code"
              onChange={(e) => {
                handleDeviceInput(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleScan(deviceBuffer);
                  setDeviceBuffer('');
                }
              }}
            />
          </>
        ) : (
          <QrScanner onScan={handleScan} />
        )}
      </div>
      <footer className="text-primary shrink-0 pb-6 text-center text-xl font-bold tracking-tight">
        KeebMeet
      </footer>
    </div>
  );
};

export default KioskCheckInPage;
