import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import config from '../../config';
import { HoldCountdown } from './HoldCountdown';

const stripePromise = loadStripe(config.stripePublishableKey);

interface PaymentFormProps {
  amountLabel: string;
  onSuccess: () => void;
}

const PaymentForm = ({
  amountLabel,
  onSuccess,
}: PaymentFormProps): ReactNode => {
  const stripe = useStripe();
  const elements = useElements();
  const [isPaying, setIsPaying] = useState(false);

  const onPay = (): void => {
    void (async () => {
      if (stripe == null || elements == null) return;
      setIsPaying(true);
      // redirect: 'if_required' keeps card payments on-site; the ticket is
      // finalized by the payment_intent.succeeded webhook.
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
    <div className="flex flex-col gap-4">
      <PaymentElement />
      <Button
        type="button"
        size="lg"
        onClick={onPay}
        disabled={stripe == null || isPaying}
      >
        Pay {amountLabel}
        {isPaying ? <Spinner /> : null}
      </Button>
    </div>
  );
};

interface PaidRsvpPaymentProps {
  clientSecret: string;
  amountLabel: string;
  holdExpiresAt?: string | null;
  onSuccess: () => void;
}

export const PaidRsvpPayment = ({
  clientSecret,
  amountLabel,
  holdExpiresAt,
  onSuccess,
}: PaidRsvpPaymentProps): ReactNode => (
  <div className="flex flex-col gap-4">
    {holdExpiresAt != null ? (
      <HoldCountdown
        holdExpiresAt={holdExpiresAt}
        className="sticky top-0 z-10 backdrop-blur-sm"
      />
    ) : null}
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentForm amountLabel={amountLabel} onSuccess={onSuccess} />
    </Elements>
  </div>
);
