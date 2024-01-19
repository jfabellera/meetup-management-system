import {
  AspectRatio,
  Button,
  Flex,
  Grid,
  GridItem,
  Heading,
  HStack,
  Icon,
  Image,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalOverlay,
  Spacer,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { useEffect, useState } from 'react';
import { FaCircle } from 'react-icons/fa';
import {
  FiCalendar,
  FiClock,
  FiMapPin,
  FiUser,
  FiUserCheck,
  FiUserX,
} from 'react-icons/fi';
import { MeetupCard } from '../components/Meetups/MeetupCard';
import Page from '../components/Page/Page';
import { useAppSelector } from '../store/hooks';
import { useGetMeetupQuery, useGetMeetupsQuery } from '../store/meetupSlice';
import {
  useCreateTicketMutation,
  useDeleteTicketMutation,
  useGetTicketsQuery,
} from '../store/ticketSlice';

dayjs.extend(customParseFormat);

const Homepage = (): JSX.Element => {
  const { isLoggedIn, user } = useAppSelector((state) => state.user);
  const [meetupId, setMeetupId] = useState<number>(0);
  const { data: meetups, isLoading } = useGetMeetupsQuery();
  const { data: meetup, refetch: refetchMeetup } = useGetMeetupQuery(meetupId, {
    skip: meetupId < 1,
  });
  // TODO(jan): figure out how to remove this ugly ternary without getting linting errors
  const { data: tickets } = useGetTicketsQuery(user != null ? user.id : 0, {
    skip: user == null,
  });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [rsvp] = useCreateTicketMutation();
  const [unrsvp] = useDeleteTicketMutation();

  // Open modal once meetup is loaded
  useEffect(() => {
    if (meetupId !== 0) {
      onOpen();
    }
  }, [meetup]);

  /**
   * RSVP for meetup and refetch meetup info to update count
   */
  const rsvpOnclick = (): void => {
    // void to match onClick expected type
    void (async () => {
      if (meetup != null) {
        await rsvp(meetup.id);
        await refetchMeetup();
      }
    })();
  };

  /**
   * Remove RSVP for meetup and refetch meetup info to update count
   */
  const unrsvpOnClick = (): void => {
    // void to match onClick expected type
    void (async () => {
      const ticket = tickets?.filter(
        (ticket) => ticket.meetup_id === meetup?.id,
      )[0];
      if (ticket !== undefined) {
        await unrsvp(ticket.id);
        await refetchMeetup();
      }
    })();
  };

  /**
   * Get whether the logged in user is attending a meetup for the specified
   * meetup ID
   *
   * @param meetupId
   * @returns Whether the user is attending the meetup
   */
  const isAttendingMeetup = (meetupId: number): boolean => {
    if (user != null && tickets != null) {
      return (
        tickets.filter((ticket) => ticket.meetup_id === meetupId).length > 0
      );
    }
    return false;
  };

  return (
    <Page>
      <Heading fontSize="3xl" mb={'0.5em'}>
        Upcoming Meetups
      </Heading>
      {!isLoading ? (
        <Grid templateColumns="repeat(auto-fill, minmax(250px, 1fr))" gap={4}>
          {meetups?.map((meetup) => (
            <GridItem
              key={meetup.id}
              onClick={() => {
                setMeetupId(meetup.id);

                // Only open modal immediately if the selected meetup is already loaded
                if (meetup?.id === meetup.id) {
                  onOpen();
                }
              }}
            >
              <MeetupCard
                meetup={meetup}
                attending={isAttendingMeetup(meetup.id)}
              />
            </GridItem>
          ))}
        </Grid>
      ) : (
        <></>
      )}
      {meetup != null ? (
        <Modal
          isOpen={isOpen}
          onClose={onClose}
          isCentered
          motionPreset={'slideInBottom'}
          size={'3xl'}
          scrollBehavior={'inside'}
        >
          <ModalOverlay />
          <ModalContent>
            <ModalBody padding={0}>
              {meetup.image_url != null ? (
                <AspectRatio ratio={2 / 1}>
                  <Image
                    src={meetup.image_url}
                    fallbackSrc="https://via.placeholder.com/150"
                    objectFit="cover"
                    borderTopRadius={'md'}
                  />
                </AspectRatio>
              ) : null}
              <Flex direction={'column'} padding={'1em'} paddingBottom={'0'}>
                <Heading paddingBottom={'0.4em'}>{meetup.name}</Heading>
                <Flex
                  direction={'column'}
                  paddingBottom={'1em'}
                  fontWeight={'semibold'}
                >
                  {/* Date */}
                  <HStack>
                    <Icon as={FiCalendar} />
                    <Text>
                      {dayjs(meetup.date, 'YYYY-MM-DDTHH:mm:ss').format(
                        'MMMM DD, YYYY',
                      )}
                    </Text>
                  </HStack>

                  {/* Time */}
                  {/* TODO(jan): Add end time once implemented into API */}
                  <HStack>
                    <Icon as={FiClock} />
                    <Text>
                      {dayjs(meetup.date, 'YYYY-MM-DDTHH:mm:ss').format(
                        'h:mm A',
                      )}
                    </Text>
                  </HStack>

                  {/* Location */}
                  <HStack>
                    <Icon as={FiMapPin} />
                    <Text>{meetup.location.full_address}</Text>
                  </HStack>

                  {/* Organizers */}
                  <HStack>
                    <Icon as={FiUser} />
                    <Text>
                      Organized by{' '}
                      {new Intl.ListFormat().format(meetup.organizers)}
                    </Text>
                  </HStack>
                </Flex>

                {/* Description */}
                {/* TODO(jan): Add actual description from meetup details when implemented */}
                <Text>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco
                  laboris nisi ut aliquip ex ea commodo consequat. Duis aute
                  irure dolor in reprehenderit in voluptate velit esse cillum
                  dolore eu fugiat nulla pariatur. Excepteur sint occaecat
                  cupidatat non proident, sunt in culpa qui officia deserunt
                  mollit anim id est laborum.
                </Text>
              </Flex>
            </ModalBody>

            <ModalFooter>
              <MeetupCapacityStatus
                available={meetup.tickets.available}
                total={meetup.tickets.total}
              />
              <Spacer />
              {/* TODO(jan): Implement */}
              {isAttendingMeetup(meetup.id) ? (
                <Button
                  leftIcon={<FiUserX />}
                  colorScheme={'red'}
                  mr={3}
                  disabled={!isLoggedIn}
                  onClick={unrsvpOnClick}
                >
                  Cancel RSVP
                </Button>
              ) : (
                <Button
                  leftIcon={<FiUserCheck />}
                  colorScheme={'green'}
                  mr={3}
                  disabled={!isLoggedIn}
                  onClick={rsvpOnclick}
                >
                  RSVP
                </Button>
              )}
              <Button colorScheme={'pink'} mr={3} onClick={onClose}>
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      ) : null}
    </Page>
  );
};

interface MeetupCapacityStatusProps {
  available: number;
  total: number;
}

const MeetupCapacityStatus = ({
  available,
  total,
}: MeetupCapacityStatusProps): JSX.Element => {
  let statusColor: string;
  const capacityRatio = available / total;

  if (capacityRatio > 0.4) {
    statusColor = 'green.500';
  } else if (capacityRatio > 0.1) {
    statusColor = 'yellow.500';
  } else {
    statusColor = 'red.500';
  }

  return (
    <HStack>
      <Icon as={FaCircle} boxSize={3} color={statusColor} />
      <Text>
        {available} of {total} available
      </Text>
    </HStack>
  );
};

export default Homepage;
