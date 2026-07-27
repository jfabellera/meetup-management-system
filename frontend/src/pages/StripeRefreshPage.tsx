import { Loader2 } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Page from '../components/Page/Page';
import { useCreateStripeAccountLinkMutation } from '../store/stripeSlice';

const StripeRefreshPage = (): ReactNode => {
  const navigate = useNavigate();
  const [createStripeAccountLink] = useCreateStripeAccountLinkMutation();
  const isMount = useRef(false);

  useEffect(() => {
    if (isMount.current) return;
    isMount.current = true;

    void (async () => {
      try {
        const { url } = await createStripeAccountLink({
          acceptPaymentTerms: false,
        }).unwrap();
        window.location.href = url;
      } catch {
        toast.error('Could not resume Stripe onboarding. Please try again.');
        void navigate('/account');
      }
    })();
  }, [createStripeAccountLink, navigate]);

  return (
    <Page>
      <div className="flex h-full flex-col items-center justify-center">
        <Loader2 className="size-10 animate-spin" />
        <p className="mt-4">Redirecting...</p>
      </div>
    </Page>
  );
};

export default StripeRefreshPage;
