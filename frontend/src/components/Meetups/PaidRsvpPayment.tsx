import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import config from '../../config';

export const stripePromise = loadStripe(config.stripePublishableKey);

export const PayButton = ({
  amountLabel,
  disabled,
  returnUrl,
  onSuccess,
}: {
  amountLabel: string;
  disabled?: boolean;
  returnUrl: string;
  onSuccess: () => void | Promise<void>;
}): ReactNode => {
  const stripe = useStripe();
  const elements = useElements();
  const [status, setStatus] = useState<'idle' | 'paying' | 'finalizing'>(
    'idle'
  );

  const onPay = (): void => {
    void (async () => {
      if (stripe == null || elements == null) return;
      setStatus('paying');
      // redirect: 'if_required' keeps cards on-site; redirect methods still
      // need a return_url to come back to.
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: returnUrl },
        redirect: 'if_required',
      });
      if (error != null) {
        setStatus('idle');
        toast.error(error.message ?? 'Payment failed. Please try again.');
        return;
      }
      setStatus('finalizing');
      await onSuccess();
    })();
  };

  return (
    <Button
      type="button"
      size="lg"
      onClick={onPay}
      disabled={stripe == null || status !== 'idle' || disabled}
    >
      {status === 'finalizing' ? 'Finalizing…' : `Pay ${amountLabel}`}
      {status !== 'idle' ? <Spinner /> : null}
    </Button>
  );
};
