import { Loader2 } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Page from '../components/Page/Page';
import { useGetStripeStatusQuery } from '../store/stripeSlice';

const StripeReturnPage = (): ReactNode => {
  const navigate = useNavigate();
  const { data, isFetching } = useGetStripeStatusQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  useEffect(() => {
    if (isFetching) return;

    if (data?.stripe_charges_enabled ?? false) {
      toast.success('Payments enabled', {
        description: 'Your Stripe account is ready to receive payments.',
      });
    } else {
      toast.info('Stripe setup incomplete', {
        description: 'Finish onboarding to start receiving payments.',
      });
    }

    void navigate('/account');
  }, [isFetching, data, navigate]);

  return (
    <Page>
      <div className="flex h-full flex-col items-center justify-center">
        <Loader2 className="size-10 animate-spin" />
        <p className="mt-4">Finishing up...</p>
      </div>
    </Page>
  );
};

export default StripeReturnPage;
