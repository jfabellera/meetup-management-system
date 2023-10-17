import {
  Link,
  ListItem,
  Text,
  UnorderedList,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Flex,
  Image,
  Grid,
  GridItem,
  Stack,
  Heading,
  Divider,
  Box,
  Spacer,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Button,
} from "@chakra-ui/react";
import { useState } from "react";
import Page from "../components/Page/Page";
import { useGetMeetingsQuery } from "../store/databaseSlice";

interface MeetupCardProps {
  id: string;
  name: string;
  location: string;
  date: string;
  image_url: string;
}
const ExampleCards: Array<MeetupCardProps> = [
  {
    id: "1",
    name: "Test Meeting",
    location: "location, TX",
    date: "11/11/1111",
    image_url:
      "https://cdn.discordapp.com/attachments/1089785393014112278/1158544783527129169/image.png?ex=651d4b29&is=651bf9a9&hm=c95e6cf90f1996ed9626799d43cfb55f693a8f55a2be58ddf14dd0a7c95c5324&",
  },
  // {
  //   name: "Test Meeting",
  //   location: "location, TX",
  //   date: "11/11/1111",
  //   image_url:
  //   "https://cdn.discordapp.com/attachments/1089785393014112278/1158544783527129169/image.png?ex=651d4b29&is=651bf9a9&hm=c95e6cf90f1996ed9626799d43cfb55f693a8f55a2be58ddf14dd0a7c95c5324&",
  // },
  // {
  //   name: "Test Meeting",
  //   location: "location, TX",
  //   date: "11/11/1111",
  //   image_url:
  //   "https://cdn.discordapp.com/attachments/1089785393014112278/1158544783527129169/image.png?ex=651d4b29&is=651bf9a9&hm=c95e6cf90f1996ed9626799d43cfb55f693a8f55a2be58ddf14dd0a7c95c5324&",
  // },
  // {
  //   name: "Test Meeting",
  //   location: "location, TX",
  //   date: "11/11/1111",
  //   image_url:
  //   "https://cdn.discordapp.com/attachments/1089785393014112278/1158544783527129169/image.png?ex=651d4b29&is=651bf9a9&hm=c95e6cf90f1996ed9626799d43cfb55f693a8f55a2be58ddf14dd0a7c95c5324&",
  // },
  // {
  //   name: "Test Meeting",
  //   location: "location, TX",
  //   date: "11/11/1111",
  //   image_url:
  //   "https://cdn.discordapp.com/attachments/1089785393014112278/1158544783527129169/image.png?ex=651d4b29&is=651bf9a9&hm=c95e6cf90f1996ed9626799d43cfb55f693a8f55a2be58ddf14dd0a7c95c5324&",
  // },
];

export default function Homepage() {
  const { data: meetings, isLoading } = useGetMeetingsQuery();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [modalInfo, setModalInfo] = useState({});

  if (isLoading) {
    console.log("loading");
  } else {
    console.log("loaded:");
    console.log(meetings);
    console.log(modalInfo);
  }

  if (isLoading) return <div>loading...</div>;
  return (
    <Page
      pageTitle="Meetup Management System"
      pageDescription="This app aims to help streamline activites related to mechanical keyboard
      meetups for the Texas Mechanical Keyboards community."
    >
      <Text fontSize="3xl" as="b">
        Upcoming Meetups
      </Text>
      <Grid templateColumns="repeat(4, 1fr)" gap={4}>
        {meetings.map((card) => (
          <GridItem
            key={card.id}
            onClick={() => {
              onOpen();
              setModalInfo(card);
            }}
          >
            <MeetupCard
              name={card.name}
              location="{card.location}"
              date={card.date}
              image_url="https://cdn.discordapp.com/attachments/1089785393014112278/1158544783527129169/image.png?ex=651d4b29&is=651bf9a9&hm=c95e6cf90f1996ed9626799d43cfb55f693a8f55a2be58ddf14dd0a7c95c5324&"
            ></MeetupCard>
          </GridItem>
        ))}
      </Grid>
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
            <Heading>{modalInfo.name}</Heading>
            <Text>{modalInfo.date}</Text>
            <Text>{modalInfo.location}</Text>
            <Text>Organizers {modalInfo.organizer_ids}</Text>
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
}

const MeetupCard = ({ name, location, date, image_url }: MeetupCardProps) => {
  return (
    <Card>
      <CardBody>
        <Flex h={32} w="full">
          <Image
            w="full"
            src={image_url}
            alt="testing this shit outs"
            borderRadius="lg"
            objectFit="cover"
          />
        </Flex>

        <Heading size="lg" py={2}>
          {" "}
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

const MeetupModal = ({}) => {
  return <></>;
};
