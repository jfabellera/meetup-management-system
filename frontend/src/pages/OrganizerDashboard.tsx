import {
  Button,
  Container,
  Heading,
  HStack,
  Spacer,
  Stack,
} from '@chakra-ui/react';
import { MeetupOrganizerCard } from '../components/Meetups/MeetupOrganizerCard';
import Page from '../components/Page/Page';
import { useAppSelector } from '../store/hooks';
import { useGetMeetupsQuery } from '../store/meetupSlice';

const OrganizerDashboard = (): JSX.Element => {
  const { user } = useAppSelector((state) => state.user);
  const { data: meetups } = useGetMeetupsQuery({
    organizer_ids: user != null ? [user.id] : [],
  });

  return (
    <Page>
      <Container padding={0} maxWidth={'container.md'}>
        <HStack marginBottom={'1rem'}>
          <Heading fontWeight={'semibold'}>Your Meetups</Heading>
          <Spacer />
          <Button colorScheme={'green'}>New meetup</Button>
        </HStack>
        <Stack spacing={4}>
          {meetups != null
            ? meetups.map((meetup) => {
                return (
                  <MeetupOrganizerCard
                    key={meetup.id}
                    name={meetup.name}
                    date={meetup.date}
                    imageUrl={meetup.image_url}
                    ticketsAvailable={0} // TODO(jan): implement once supported
                    ticketsTotal={0} // TODO(jan): implement once supported
                  />
                );
              })
            : null}
        </Stack>
      </Container>
    </Page>
  );
};

export default OrganizerDashboard;
