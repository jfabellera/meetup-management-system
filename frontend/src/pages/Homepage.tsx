import {
  AspectRatio,
  Button,
  Card,
  CardHeader,
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
  VStack,
} from '@chakra-ui/react';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { useEffect, useState } from 'react';
import { FaCircle } from 'react-icons/fa';
import {
  FiCalendar,
  FiClock,
  FiImage,
  FiMapPin,
  FiUser,
} from 'react-icons/fi';
import Page from '../components/Page/Page';
import { useAppSelector } from '../store/hooks';
import { useGetMeetupQuery, useGetMeetupsQuery } from '../store/meetupSlice';

dayjs.extend(customParseFormat);

const Homepage = (): JSX.Element => {
  const [meetupId, setMeetupId] = useState<number>(0);
  const { data: meetups, isLoading } = useGetMeetupsQuery();
  const { data: meetup } = useGetMeetupQuery(meetupId);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isLoggedIn } = useAppSelector((state) => state.user);

  // Open modal once meetup is loaded
  useEffect(() => {
    if (meetupId !== 0) {
      onOpen();
    }
  }, [meetup]);

  return (
    <Page>
      <Heading fontSize="3xl" mb={'0.5em'}>
        Upcoming Meetups
      </Heading>
      {!isLoading ? (
        <Grid templateColumns="repeat(auto-fill, minmax(250px, 1fr))" gap={4}>
          {meetups?.map((card) => (
            <GridItem
              key={card.id}
              onClick={() => {
                setMeetupId(card.id);

                // Only open modal immediately if the selected meetup is already loaded
                if (meetup?.id === card.id) {
                  onOpen();
                }
              }}
            >
              <MeetupCard
                name={card.name}
                location={`${card.location.city}, ${
                  card.location.state ?? card.location.country
                }`}
                date={dayjs(card.date, 'YYYY-MM-DDTHH:mm:ss').format(
                  'MMMM DD, YYYY',
                )}
                imageUrl={card.image_url}
              />
            </GridItem>
          ))}
        </Grid>
      ) : (
        <></>
      )}
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
            {meetup?.image_url != null ? (
              <AspectRatio ratio={2 / 1}>
                <Image
                  src={meetup?.image_url}
                  fallbackSrc="https://via.placeholder.com/150"
                  objectFit="cover"
                  borderTopRadius={'md'}
                />
              </AspectRatio>
            ) : null}
            <Flex direction={'column'} padding={'1em'} paddingBottom={'0'}>
              <Heading paddingBottom={'0.4em'}>{meetup?.name}</Heading>
              <Flex
                direction={'column'}
                paddingBottom={'1em'}
                fontWeight={'semibold'}
              >
                {/* Date */}
                <HStack>
                  <Icon as={FiCalendar} />
                  <Text>
                    {dayjs(meetup?.date, 'YYYY-MM-DDTHH:mm:ss').format(
                      'MMMM DD, YYYY',
                    )}
                  </Text>
                </HStack>

                {/* Time */}
                {/* TODO(jan): Add end time once implemented into API */}
                <HStack>
                  <Icon as={FiClock} />
                  <Text>
                    {dayjs(meetup?.date, 'YYYY-MM-DDTHH:mm:ss').format(
                      'h:mm A',
                    )}
                  </Text>
                </HStack>

                {/* Location */}
                <HStack>
                  <Icon as={FiMapPin} />
                  <Text>{meetup?.location.full_address}</Text>
                </HStack>

                {/* Organizers */}
                <HStack>
                  <Icon as={FiUser} />
                  <Text>
                    Organized by{' '}
                    {new Intl.ListFormat().format(meetup?.organizers)}
                  </Text>
                </HStack>
              </Flex>

              {/* Description */}
              {/* TODO(jan): Add actual description from meetup details when implemented */}
              <Text>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor
                in reprehenderit in voluptate velit esse cillum dolore eu fugiat
                nulla pariatur. Excepteur sint occaecat cupidatat non proident,
                sunt in culpa qui officia deserunt mollit anim id est laborum.
              </Text>
            </Flex>
          </ModalBody>

          <ModalFooter>
            <MeetupCapacityStatus
              available={meetup?.tickets.available}
              total={meetup?.tickets.total}
            />
            <Spacer />
            {/* TODO(jan): Implement */}
            {isLoggedIn ? (
              <Button colorScheme={'green'} mr={3}>
                RSVP
              </Button>
            ) : null}
            <Button colorScheme={'pink'} mr={3} onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Page>
  );
};

interface MeetupCardProps {
  name: string;
  location: string;
  date: string;
  imageUrl: string;
}

const MeetupCard = ({
  name,
  location,
  date,
  imageUrl,
}: MeetupCardProps): JSX.Element => {
  return (
    <Card
      background={'white'}
      borderRadius="md"
      overflow="hidden"
      height="100%"
      cursor={'pointer'}
    >
      <AspectRatio ratio={2 / 1}>
        {imageUrl != null ? (
          <Image
            src={imageUrl}
            fallbackSrc="https://via.placeholder.com/150"
            objectFit="cover"
          />
        ) : (
          <Flex backgroundColor={'gray.200'}>
            <Icon as={FiImage} boxSize={8} />
          </Flex>
        )}
      </AspectRatio>
      <CardHeader padding={'12px'}>
        <VStack spacing={2} align={'left'}>
          <Text fontWeight={'semibold'} color={'gray.600'}>
            {date}
          </Text>
          <Heading size={'md'}>{name}</Heading>
          <Text>{location}</Text>
        </VStack>
      </CardHeader>
    </Card>
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
