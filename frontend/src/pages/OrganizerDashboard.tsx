import {
  Button,
  Container,
  Heading,
  HStack,
  Spacer,
  Stack,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { MeetupOrganizerCard } from '../components/Meetups/MeetupOrganizerCard';
import Page from '../components/Page/Page';
import { useAppSelector } from '../store/hooks';
import { useGetMeetupsQuery } from '../store/meetupSlice';

const OrganizerDashboard = (): JSX.Element => {
  const { user } = useAppSelector((state) => state.user);
  const { data: meetups } = useGetMeetupsQuery({
    by_organizer_id: user != null ? [user.id] : [],
    detail_level: 'detailed',
  });
  const navigate = useNavigate();

  const newMeetupOnClick = (): void => {
    navigate('/newmeetup');
  };

  return (
    <Page>
      <Container padding={'1rem'} maxWidth={'container.md'}>
        <HStack marginBottom={'1rem'}>
          <Heading fontWeight={'semibold'}>Your Meetups</Heading>
          <Spacer />
          <Button colorScheme={'green'} onClick={newMeetupOnClick}>
            New meetup
          </Button>
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
                    ticketsAvailable={meetup.tickets?.available ?? NaN}
                    ticketsTotal={meetup.tickets?.total ?? NaN}
                    onClick={() => {
                      navigate(`/meetup/${meetup.id}/manage`);
                    }}
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
