import {
  Box,
  Button,
  Heading,
  HStack,
  Input,
  Spacer,
  Text,
  useBoolean,
  type BoxProps,
} from '@chakra-ui/react';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { FiEdit } from 'react-icons/fi';
import { useParams } from 'react-router-dom';
import { useGetMeetupQuery } from '../store/meetupSlice';

dayjs.extend(customParseFormat);

interface FieldDisplayProps extends BoxProps {
  name: string;
  value: string | number | null | undefined;
  editable: boolean;
}

const FieldDisplay = ({
  name,
  value,
  editable,
  ...rest
}: FieldDisplayProps): JSX.Element => {
  return (
    <Box paddingY={'0.5rem'} {...rest}>
      <Text fontWeight={'semibold'}>{name}</Text>
      {editable ? (
        <Input
          variant={'outline'}
          defaultValue={value?.toString()}
          maxWidth={'sm'}
        />
      ) : (
        <Text textColor={'blackAlpha.700'}>{value ?? 'N/A'}</Text>
      )}
    </Box>
  );
};

const ManageMeetupSettingsPage = (): JSX.Element => {
  const { meetupId } = useParams();
  const { data: meetup } = useGetMeetupQuery(parseInt(meetupId ?? '0'));
  const [editable, setEditable] = useBoolean(false);

  return (
    <Box
      background={'white'}
      borderRadius={'md'}
      boxShadow={'sm'}
      padding={{ base: '1rem', md: '1.5rem' }}
      margin={{ base: '0.5rem', md: '1rem' }}
    >
      <HStack>
        <Heading size={'lg'} marginBottom={'0.5rem'}>
          Settings
        </Heading>
        <Spacer />
        <Button
          variant={'ghost'}
          leftIcon={<FiEdit />}
          onClick={setEditable.toggle}
        >
          Edit
        </Button>
      </HStack>
      <FieldDisplay
        name={'Meetup Name'}
        value={meetup?.name}
        editable={editable}
      />
      <FieldDisplay
        name={'Date'}
        value={dayjs(meetup?.date, 'YYYY-MM-DDTHH:mm:ss').format(
          'MMMM DD, YYYY',
        )}
        editable={editable}
      />
      <FieldDisplay
        name={'Start Time'}
        value={dayjs(meetup?.date, 'YYYY-MM-DDTHH:mm:ss').format('h:mm A')}
        editable={editable}
      />
      <FieldDisplay
        name={'Address'}
        value={meetup?.location.full_address}
        editable={editable}
      />
      <FieldDisplay
        name={'Duration (hours)'}
        value={meetup?.duration_hours}
        editable={editable}
      />
      <FieldDisplay
        name={'Capacity'}
        value={meetup?.tickets?.total}
        editable={editable}
      />
    </Box>
  );
};

export default ManageMeetupSettingsPage;
