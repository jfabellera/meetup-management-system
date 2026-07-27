import { type ReactNode } from 'react';
import OrganizerPaymentTerms from '../components/Account/OrganizerPaymentTerms';
import Page from '../components/Page/Page';
import BackButton from '../components/shared/BackButton';

const OrganizerPaymentTermsPage = (): ReactNode => (
  <Page>
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4">
      <div className="relative flex items-center justify-center">
        <h1 className="text-2xl font-bold">Organizer Payment Terms</h1>
      </div>
      <div className="bg-card text-card-foreground rounded-lg p-8 shadow-lg">
        <OrganizerPaymentTerms />
      </div>
    </div>
  </Page>
);

export default OrganizerPaymentTermsPage;
