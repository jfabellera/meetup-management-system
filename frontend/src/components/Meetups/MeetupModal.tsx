import {
  AspectRatio,
  Button,
  Flex,
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
} from '@chakra-ui/react';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { useEffect } from 'react';
import {
  FiCalendar,
  FiClock,
  FiMapPin,
  FiUser,
  FiUserCheck,
  FiUserX,
} from 'react-icons/fi';
import { type SimpleTicketInfo } from '../../../../backend/src/controllers/tickets';
import { useGetMeetupQuery } from '../../store/meetupSlice';
import {
  useCreateTicketMutation,
  useDeleteTicketMutation,
} from '../../store/ticketSlice';
import { MeetupCapacityStatus } from './MeetupCapacityStatus';

dayjs.extend(customParseFormat);

export interface MeetupModalProps {
  meetupId: number;
  isLoggedIn: boolean;
  ticket: SimpleTicketInfo | null;
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
}

export const MeetupModal = ({
  meetupId,
  isLoggedIn,
  ticket,
  isOpen,
  onClose,
  onOpen,
}: MeetupModalProps): JSX.Element => {
  const { data: meetup, refetch: refetchMeetup } = useGetMeetupQuery(meetupId, {
    skip: meetupId < 1,
  });
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
      if (ticket != null) {
        await unrsvp(ticket.id);
        await refetchMeetup();
      }
    })();
  };

  if (meetup == null) return <></>;

  return (
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
                  {dayjs(meetup.date, 'YYYY-MM-DDTHH:mm:ss').format('h:mm A')}
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
                  Organized by {new Intl.ListFormat().format(meetup.organizers)}
                </Text>
              </HStack>
            </Flex>

            {/* Description */}
            {/* TODO(jan): Add actual description from meetup details when implemented */}
            <Text>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
              reprehenderit in voluptate velit esse cillum dolore eu fugiat
              nulla pariatur. Excepteur sint occaecat cupidatat non proident,
              sunt in culpa qui officia deserunt mollit anim id est laborum.
            </Text>
          </Flex>
        </ModalBody>

        <ModalFooter>
          <MeetupCapacityStatus
            available={meetup.tickets.available}
            total={meetup.tickets.total}
          />
          <Spacer />
          {ticket != null ? (
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
  );
};
