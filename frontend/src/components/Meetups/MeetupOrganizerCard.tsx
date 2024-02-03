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
      <CardBody
        width={{ base: '67%', sm: '60%' }}
        padding={'1rem'}
        paddingY={{ base: '0.5rem', sm: '1rem' }}
        textOverflow={'ellipsis'}
        overflow={'hidden'}
        display={'flex'}
        flexDirection={'column'}
      >
        <Stack spacing={{ base: 0, sm: 1.5 }} flex={1} justify={'center'}>
          <Heading size={'md'} fontWeight={'semibold'} noOfLines={1}>
            {name}
          </Heading>
          <HStack>
            <Icon as={FiCalendar} />
            <Text noOfLines={1}>{'April 27, 2024'}</Text>
          </HStack>
          <HStack>
            <Icon as={FiClock} />
            <Text noOfLines={1}>{'89 days'}</Text>
          </HStack>
          <HStack>
            <Icon as={FiUsers} />
            <Text noOfLines={1}>{'255 / 300'}</Text>
          </HStack>
        </Stack>
      </CardBody>
      {/* <CardBody padding={0} margin={0}>
        </CardBody> */}
    </Card>
  );
};
