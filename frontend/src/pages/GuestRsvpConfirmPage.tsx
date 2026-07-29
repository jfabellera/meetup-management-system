import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Page from '../components/Page/Page';
import { useConfirmGuestRsvpMutation } from '../store/ticketSlice';

type Status = 'confirming' | 'success' | 'error';

const GuestRsvpConfirmPage = (): ReactNode => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const hasRun = useRef(false);

  const [confirmGuestRsvp] = useConfirmGuestRsvpMutation();
  const [status, setStatus] = useState<Status>('confirming');
  const [message, setMessage] = useState<string | null>(null);
  const [meetupSlug, setMeetupSlug] = useState<string | null>(null);

  const token = params.get('token');

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    void (async () => {
      if (token == null) {
        setStatus('error');
        return;
      }

      try {
        const result = await confirmGuestRsvp(token).unwrap();
        setMeetupSlug(result.meetup?.slug ?? null);
        setStatus('success');
      } catch (error) {
        const detail = (error as { data?: { message?: string } }).data?.message;
        setMessage(detail ?? null);
        setStatus('error');
      }
    })();
  }, []);

  return (
    <Page>
      <div className="flex h-full flex-col items-center justify-center gap-4 p-4 text-center">
        {status === 'confirming' && (
          <>
            <Loader2 className="size-10 animate-spin" />
            <p>Confirming your RSVP...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="size-12 text-green-600" />
            <h1 className="text-2xl font-bold">RSVP confirmed</h1>
            <p className="text-muted-foreground">
              You&apos;re all set. Check your email for your ticket.
            </p>
            <Button
              size="lg"
              onClick={() =>
                void navigate(
                  meetupSlug != null ? `/meetup/${meetupSlug}` : '/'
                )
              }
            >
              View meetup
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="text-destructive size-12" />
            <h1 className="text-2xl font-bold">Couldn&apos;t confirm RSVP</h1>
            <p className="text-muted-foreground">
              {message ?? 'This confirmation link is invalid or has expired.'}
            </p>
            <Button variant="ghost" onClick={() => void navigate('/')}>
              Back home
            </Button>
          </>
        )}
      </div>
    </Page>
  );
};

export default GuestRsvpConfirmPage;
