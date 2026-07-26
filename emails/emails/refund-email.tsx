import { Heading, Link, Section, Text } from '@react-email/components';
import { EmailLayout } from '../components/EmailLayout';

export interface RefundEmailProps {
  meetupName: string;
  amountRefunded?: string;
  receiptUrl?: string;
}

export const RefundEmail = ({
  meetupName,
  amountRefunded,
  receiptUrl,
}: RefundEmailProps) => (
  <EmailLayout preview={`Your ticket for ${meetupName} was refunded`}>
    <Heading className="text-foreground m-0 mb-4 text-[22px] font-semibold">
      Your ticket was refunded
    </Heading>
    <Text className="text-foreground m-0 mb-6 text-[15px] leading-6">
      Your ticket for <strong>{meetupName}</strong> has been refunded and your
      spot released. Refunds typically take 5–10 business days to appear on your
      statement.
    </Text>
    {amountRefunded != null ? (
      <Section className="border-border bg-background mb-6 rounded-md border border-solid p-4">
        <Text className="text-foreground m-0 text-[14px] leading-6">
          <strong>Refunded:</strong> {amountRefunded}
          {receiptUrl != null ? (
            <>
              {' · '}
              <Link href={receiptUrl} className="text-primary underline">
                View receipt
              </Link>
            </>
          ) : null}
        </Text>
      </Section>
    ) : null}
  </EmailLayout>
);

RefundEmail.PreviewProps = {
  meetupName: 'Tex Mechs Spring Meetup',
  amountRefunded: '$20.00',
  receiptUrl: 'https://pay.stripe.com/receipts/example',
} satisfies RefundEmailProps;

export default RefundEmail;
