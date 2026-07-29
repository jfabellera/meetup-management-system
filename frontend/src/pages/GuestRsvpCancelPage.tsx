import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Page from '../components/Page/Page';
import { useCancelGuestRsvpMutation } from '../store/ticketSlice';

type Status = 'idle' | 'cancelling' | 'success' | 'error';

const GuestRsvpCancelPage = (): ReactNode => {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [cancelGuestRsvp] = useCancelGuestRsvpMutation();
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const token = params.get('token');

  const onCancel = (): void => {
    void (async () => {
      if (token == null) {
        setStatus('error');
        return;
      }
      setStatus('cancelling');
      try {
        await cancelGuestRsvp(token).unwrap();
        setStatus('success');
      } catch (error) {
        const detail = (error as { data?: { message?: string } }).data?.message;
        setMessage(detail ?? null);
        setStatus('error');
      }
    })();
  };

  return (
    <Page>
      <div className="flex h-full flex-col items-center justify-center gap-4 p-4 text-center">
        {status === 'idle' && (
          <>
            <h1 className="text-2xl font-bold">Cancel your RSVP?</h1>
            <p className="text-muted-foreground">
              This releases your spot. You can RSVP again later if there&apos;s
              still room.
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => void navigate('/')}>
                Keep RSVP
              </Button>
              <Button
                variant="destructive"
                onClick={onCancel}
                disabled={token == null}
              >
                Cancel RSVP
              </Button>
            </div>
          </>
        )}

        {status === 'cancelling' && (
          <>
            <Loader2 className="size-10 animate-spin" />
            <p>Cancelling your RSVP...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="size-12 text-green-600" />
            <h1 className="text-2xl font-bold">RSVP cancelled</h1>
            <p className="text-muted-foreground">
              Your spot has been released. Thanks for letting us know.
            </p>
            <Button variant="ghost" onClick={() => void navigate('/')}>
              Back home
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="text-destructive size-12" />
            <h1 className="text-2xl font-bold">Couldn&apos;t cancel RSVP</h1>
            <p className="text-muted-foreground">
              {message ?? 'This cancellation link is invalid or has expired.'}
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

export default GuestRsvpCancelPage;
