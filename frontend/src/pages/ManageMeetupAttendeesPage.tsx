import {
  Box,
  Heading,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import { useParams } from 'react-router-dom';
import { useGetMeetupAttendeesQuery } from '../store/meetupSlice';

const ManageMeetupAttendeesPage = (): JSX.Element => {
  const { meetupId } = useParams();
  const { data: attendees } = useGetMeetupAttendeesQuery(
    parseInt(meetupId ?? '0'),
  );

  return (
    <Box
      background={'white'}
      padding={'0.5rem'}
      borderRadius={'md'}
      boxShadow={'sm'}
      margin={{ base: '0.5rem', md: '1rem' }}
    >
      <Heading size={'lg'} paddingX={'1.5rem'} paddingY={'1rem'}>
        Attendees
      </Heading>
      <TableContainer>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Display Name</Th>
              <Th>First Name</Th>
              <Th>Last Name</Th>
            </Tr>
          </Thead>
          <Tbody>
            {attendees != null
              ? attendees.map((attendee: any) => (
                  <Tr key={attendee.id}>
                    <Td>{attendee.user.nick_name}</Td>
                    <Td>{attendee.user.first_name}</Td>
                    <Td>{attendee.user.last_name}</Td>
                  </Tr>
                ))
              : null}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ManageMeetupAttendeesPage;
