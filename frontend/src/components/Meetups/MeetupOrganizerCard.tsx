import {
  AspectRatio,
  Card,
  CardBody,
  Heading,
  HStack,
  Icon,
  Image,
  Stack,
  Text,
} from '@chakra-ui/react';
import { FiCalendar, FiClock, FiUsers } from 'react-icons/fi';

export interface MeetupOrganizerCardProps {
  name: string;
  date: Date;
  imageUrl: string;
}

export const MeetupOrganizerCard = ({
  name,
  date,
  imageUrl,
}: MeetupOrganizerCardProps): JSX.Element => {
  return (
    <Card background={'white'} direction={'row'} cursor={'pointer'}>
      <AspectRatio
        ratio={{ base: 1 / 1, sm: 2 / 1 }}
        width={{ base: '33%', sm: '40%' }}
      >
        <Image src={imageUrl} borderLeftRadius={'md'} />
      </AspectRatio>
      <Stack width={{ base: '67%', sm: '60%' }}>
        <CardBody
          padding={'1rem'}
          paddingY={'0.5rem'}
          textOverflow={'ellipsis'}
          overflow={'hidden'}
        >
          <Stack spacing={1}>
            <Heading size={'md'} fontWeight={'semibold'} noOfLines={1}>
              {name}
            </Heading>
            <HStack>
              <Icon as={FiCalendar} />
              <Text>{'April 27, 2024'}</Text>
            </HStack>
            <HStack>
              <Icon as={FiClock} />
              <Text>{'89 days'}</Text>
            </HStack>
            <HStack>
              <Icon as={FiUsers} />
              <Text>{'255 / 300'}</Text>
            </HStack>
          </Stack>
        </CardBody>
        {/* <CardBody padding={0} margin={0}>
        </CardBody> */}
      </Stack>
    </Card>
  );
};
