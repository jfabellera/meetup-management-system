import { Grid, GridItem, Heading, useDisclosure } from '@chakra-ui/react';
import { useState } from 'react';
import { type SimpleTicketInfo } from '../../../backend/src/controllers/tickets';
import { MeetupCard } from '../components/Meetups/MeetupCard';
import { MeetupModal } from '../components/Meetups/MeetupModal';
import Page from '../components/Page/Page';
import { useAppSelector } from '../store/hooks';
import { useGetMeetupsQuery } from '../store/meetupSlice';
import { useGetTicketsQuery } from '../store/ticketSlice';

const Homepage = (): JSX.Element => {
  const { isLoggedIn, user } = useAppSelector((state) => state.user);
  const [meetupId, setMeetupId] = useState<number>(0);
  const { data: meetups, isLoading } = useGetMeetupsQuery();
  // TODO(jan): figure out how to remove this ugly ternary without getting linting errors
  const { data: tickets } = useGetTicketsQuery(user != null ? user.id : 0, {
    skip: user == null,
  });
  const { isOpen, onOpen, onClose } = useDisclosure();

  /**
   * Get ticket for a meetup if the logged in user is attending the meetup. Otherwise, return null.
   *
   * @param meetupId
   * @returns User's ticket for a meetup or null.
   */
  const getTicketForMeetup = (meetupId: number): SimpleTicketInfo | null => {
    if (user != null && tickets != null) {
      const ticket = tickets.filter(
        (ticket) => ticket.meetup_id === meetupId,
      )[0];
      return ticket ?? null;
    }
    return null;
  };

  const meetupCardOnClick = (selectedMeetupId: number): void => {
    setMeetupId(selectedMeetupId);

    // Only open modal immediately if the selected meetup is already loaded
    if (selectedMeetupId === meetupId) {
      onOpen();
    }
  };

  return (
    <Page>
      {isLoading ? (
        <></>
      ) : (
        <>
          <Heading fontSize="3xl" mb={'0.5em'}>
            Upcoming Meetups
          </Heading>
          <Grid templateColumns="repeat(auto-fill, minmax(250px, 1fr))" gap={4}>
            {meetups
              ?.filter((meetup) => new Date(meetup.date) > new Date())
              .map((meetup) => (
                <GridItem
                  key={meetup.id}
                  onClick={() => {
                    meetupCardOnClick(meetup.id);
                  }}
                >
                  <MeetupCard
                    meetup={meetup}
                    attending={getTicketForMeetup(meetup.id) != null}
                  />
                </GridItem>
              ))}
          </Grid>
          <Heading fontSize="3xl" my={'0.5em'}>
            Previous Meetups
          </Heading>
          <Grid templateColumns="repeat(auto-fill, minmax(250px, 1fr))" gap={4}>
            {meetups
              ?.filter((meetup) => new Date(meetup.date) <= new Date())
              .map((meetup) => (
                <GridItem
                  key={meetup.id}
                  onClick={() => {
                    meetupCardOnClick(meetup.id);
                  }}
                >
                  <MeetupCard
                    meetup={meetup}
                    attending={getTicketForMeetup(meetup.id) != null}
                  />
                </GridItem>
              ))}
          </Grid>
          <MeetupModal
            meetupId={meetupId}
            ticket={getTicketForMeetup(meetupId)}
            isLoggedIn={isLoggedIn}
            isOpen={isOpen}
            onClose={onClose}
            onOpen={onOpen}
          />
        </>
      )}
    </Page>
  );
};

export default Homepage;
