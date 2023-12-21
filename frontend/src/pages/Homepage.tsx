import {
  AspectRatio,
  Button,
  Card,
  CardHeader,
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
        <Grid templateColumns="repeat(auto-fill, minmax(250px, 1fr))" gap={4}>
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
                imageUrl="https://media.discordapp.net/attachments/1149502169041621062/1182553630407135292/Eventbrite.jpg?ex=65851de4&is=6572a8e4&hm=bdc554f39abecd6436f4f344518f68c845a4340da137ad76ebfc258c034464cc&=&format=webp&width=2592&height=1296"
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
    <Card
      background={'white'}
      borderRadius="md"
      overflow="hidden"
      height="100%"
      cursor={'pointer'}
    >
      <AspectRatio ratio={2 / 1}>
        <Image src={imageUrl} objectFit="cover" />
      </AspectRatio>
      <CardHeader>
        <Text>{date}</Text>
        <Heading size="md">{name}</Heading>
        <Text>{location}</Text>
      </CardHeader>
    </Card>
  );
};

export default Homepage;
