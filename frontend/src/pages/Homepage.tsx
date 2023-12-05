import {
  Button,
  Card,
  CardBody,
  Flex,
  Grid,
  GridItem,
  Heading,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spacer,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { useState } from 'react';
import Page from '../components/Page/Page';
import { useGetMeetupQuery, useGetMeetupsQuery } from '../store/meetupSlice';

dayjs.extend(customParseFormat);

const Homepage = (): JSX.Element => {
  const [meetupId, setMeetupId] = useState<number>(0);
  const { data: meetups, isLoading } = useGetMeetupsQuery();
  const { data: meetup } = useGetMeetupQuery(meetupId);
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Page>
      <Text fontSize="3xl" as="b">
        Upcoming Meetups
      </Text>
      {!isLoading ? (
        <Grid templateColumns="repeat(4, 1fr)" gap={4}>
          {meetups?.map((card) => (
            <GridItem
              key={card.id}
              onClick={() => {
                onOpen();
                setMeetupId(card.id);
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
                imageUrl="https://lh3.googleusercontent.com/pw/ADCreHesVU05iKeKXUrmmOBkySFqLJHmFCgBx_Y6WZhGzf3NVB_Th8o_kUo901MM_i805f-JQNbSBBgsT0Gzn25LuAHGhzX_7Q2OX_9hGEJ5C1W-bYxu8gaKsUgtVectOIcLn49TM80kmGsgggnSfzknPvATJQ=w2646-h1764-s-no-gm?authuser=0"
              />
            </GridItem>
          ))}
        </Grid>
      ) : (
        <></>
      )}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Meetup Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Flex h={32} w="full">
              <Image
                w="full"
                src="https://cdn.discordapp.com/attachments/1089785393014112278/1158544783527129169/image.png?ex=651d4b29&is=651bf9a9&hm=c95e6cf90f1996ed9626799d43cfb55f693a8f55a2be58ddf14dd0a7c95c5324&"
                alt="testing this shit outs"
                borderRadius="lg"
                objectFit="cover"
              />
            </Flex>
            <Heading>{meetup?.name}</Heading>
            <Text>
              {dayjs(meetup?.date, 'YYYY-MM-DDTHH:mm:ss').format(
                'MMMM DD, YYYY @ h:mm A',
              )}
            </Text>
            <Text>{meetup?.location.full_address}</Text>
            <Text>Organizers: {meetup?.organizers.join(', ')}</Text>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
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
    <Card background={'white'}>
      <CardBody>
        <Flex h={32} w="full">
          <Image
            w="full"
            src={imageUrl}
            alt="testing this shit outs"
            borderRadius="lg"
            objectFit="cover"
          />
        </Flex>

        <Heading size="lg" py={2}>
          {' '}
          {name}
        </Heading>
        <Flex>
          <Text>{location}</Text>
          <Spacer />
          <Text>{date}</Text>
        </Flex>
      </CardBody>
    </Card>
  );
};

export default Homepage;
