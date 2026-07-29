import { Button, Heading, Text } from '@react-email/components';
import { EmailLayout } from '../components/EmailLayout';

export interface GuestRsvpVerificationEmailProps {
  meetupName: string;
  confirmLink: string;
}

export const GuestRsvpVerificationEmail = ({
  meetupName,
  confirmLink,
}: GuestRsvpVerificationEmailProps) => (
  <EmailLayout preview={`Confirm your RSVP for ${meetupName}`}>
    <Heading className="m-0 mb-4 text-[22px] font-semibold text-foreground">
      Confirm your RSVP
    </Heading>
    <Text className="m-0 mb-6 text-[15px] leading-6 text-foreground">
      Tap the button below to confirm your RSVP for {meetupName}. Your spot
      isn&apos;t reserved until you confirm. This link expires in one hour.
    </Text>
    <Button
      className="rounded-md bg-primary px-5 py-3 text-[15px] font-semibold text-primary-foreground"
      href={confirmLink}
    >
      Confirm RSVP
    </Button>
    <Text className="mt-8 mb-1 text-[13px] leading-5 text-muted-foreground">
      If the button doesn&apos;t work, copy and paste this link into your
      browser:
    </Text>
    <Text className="m-0 text-[13px] break-all text-primary">{confirmLink}</Text>
  </EmailLayout>
);

GuestRsvpVerificationEmail.PreviewProps = {
  meetupName: 'Tex Mechs Spring Meetup',
  confirmLink: 'https://keebmeet.com/rsvp/confirm?token=preview-token',
} satisfies GuestRsvpVerificationEmailProps;

export default GuestRsvpVerificationEmail;
