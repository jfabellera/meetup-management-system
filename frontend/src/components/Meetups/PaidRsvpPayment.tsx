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
  onSuccess,
}: {
  amountLabel: string;
  disabled?: boolean;
  onSuccess: () => void;
}): ReactNode => {
  const stripe = useStripe();
  const elements = useElements();
  const [isPaying, setIsPaying] = useState(false);

  const onPay = (): void => {
    void (async () => {
      if (stripe == null || elements == null) return;
      setIsPaying(true);
      // redirect: 'if_required' keeps card payments on-site; the webhook
      // finalizes the ticket.
      const { error } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });
      if (error != null) {
        setIsPaying(false);
        toast.error(error.message ?? 'Payment failed. Please try again.');
        return;
      }
      toast.success('Payment received! Finalizing your ticket…');
      onSuccess();
    })();
  };

  return (
    <Button
      type="button"
      size="lg"
      onClick={onPay}
      disabled={stripe == null || isPaying || disabled}
    >
      Pay {amountLabel}
      {isPaying ? <Spinner /> : null}
    </Button>
  );
};
