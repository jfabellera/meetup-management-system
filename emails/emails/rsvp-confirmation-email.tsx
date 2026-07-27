import { Heading, Img, Link, Section, Text } from '@react-email/components';
import { EmailLayout } from '../components/EmailLayout';

export interface RsvpConfirmationEmailProps {
  meetupName: string;
  meetupDate: string;
  meetupLocation: string;
  amountPaid?: string;
  receiptUrl?: string;
  /**
   * Content ID of the QR code image attached to the email (defaults to
   * `qr-code`). The backend attaches the PNG with a matching `contentId`.
   */
  qrCodeCid?: string;
}

export const RsvpConfirmationEmail = ({
  meetupName,
  meetupDate,
  meetupLocation,
  amountPaid,
  receiptUrl,
  qrCodeCid = 'qr-code',
}: RsvpConfirmationEmailProps) => (
  <EmailLayout preview={`RSVP confirmation for ${meetupName}`}>
    <Heading className="text-foreground m-0 mb-4 text-[22px] font-semibold">
      You&apos;re going to {meetupName}!
    </Heading>
    <Text className="text-foreground m-0 mb-6 text-[15px] leading-6">
      Thanks for RSVPing. Here are the details:
    </Text>
    <Section className="border-border bg-background mb-6 rounded-md border border-solid p-4">
      <Text className="text-foreground m-0 text-[14px] leading-6">
        <strong>Date:</strong> {meetupDate}
      </Text>
      <Text className="text-foreground m-0 text-[14px] leading-6">
        <strong>Location:</strong> {meetupLocation}
      </Text>
      {amountPaid != null ? (
        <Text className="text-foreground m-0 text-[14px] leading-6">
          <strong>Paid:</strong> {amountPaid}
          {receiptUrl != null ? (
            <>
              {' · '}
              <Link href={receiptUrl} className="text-primary underline">
                View receipt
              </Link>
            </>
          ) : null}
        </Text>
      ) : null}
    </Section>
    <Text className="text-foreground m-0 mb-3 text-center text-[15px] leading-6">
      If asked, present this QR code at the event:
    </Text>
    <Img
      src={`cid:${qrCodeCid}`}
      alt="Your RSVP QR code"
      width={260}
      height={260}
      className="mx-auto block rounded-md"
    />
  </EmailLayout>
);

RsvpConfirmationEmail.PreviewProps = {
  meetupName: 'Tex Mechs Spring Meetup',
  meetupDate: 'Saturday, April 12, 2026 at 1:00 PM',
  meetupLocation: 'Austin Convention Center, Austin, TX',
} satisfies RsvpConfirmationEmailProps;

export default RsvpConfirmationEmail;
