import {
  Box,
  Button,
  Heading,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useDisclosure,
} from '@chakra-ui/react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { FiCheck } from 'react-icons/fi';
import { useParams } from 'react-router-dom';
import {
  useCheckInAttendeeMutation,
  useGetMeetupAttendeesQuery,
} from '../store/organizerSlice';

const CheckInPage = (): JSX.Element => {
  const { meetupId: meetupIdParam } = useParams();
  const meetupId = parseInt(meetupIdParam ?? '');
  const { data: attendees } = useGetMeetupAttendeesQuery(meetupId);

  const [searchValue, setSearchValue] = useState<string>('');
  const searchRef = useRef<HTMLInputElement>(null);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const confirmRef = useRef<HTMLButtonElement>(null);

  const [ticketId, setTicketId] = useState<number | null>(null);
  const [checkInAttendee] = useCheckInAttendeeMutation();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      searchRef.current?.focus();

      if (event.key === 'Escape') {
        setSearchValue('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSearchChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    setSearchValue(event.target.value);
  };

  const handleConfirm = (): void => {
    void (async () => {
      if (ticketId != null) {
        await checkInAttendee(ticketId);
      }
      setTicketId(null);
      setSearchValue('');
      onClose();
    })();
  };

  return (
    <Stack
      height={'100%'}
      direction={'column'}
      textAlign={'center'}
      margin={'1rem'}
    >
      <Heading
        size={'lg'}
        fontWeight={'medium'}
        marginBottom={'0.5rem'}
        textAlign={'center'}
      >
        Check-in
      </Heading>
      <Box
        padding={'0.5rem'}
        background={'white'}
        borderRadius={'md'}
        boxShadow={'sm'}
      >
        <Input
          ref={searchRef}
          variant={'ghost'}
          placeholder={'Start typing a username, name, or email...'}
          value={searchValue}
          onChange={handleSearchChange}
        />
      </Box>
      <Box
        background={'white'}
        borderRadius={'md'}
        boxShadow={'sm'}
        padding={'1rem'}
      >
        <TableContainer>
          <Table variant={'simple'}>
            <Thead>
              <Tr>
                <Th>Display Name</Th>
                <Th>First Name</Th>
                <Th>Last Name</Th>
                <Th>Checked in?</Th>
              </Tr>
            </Thead>
            <Tbody>
              {attendees != null
                ? attendees
                    .filter(
                      (attendee: any) =>
                        Boolean(
                          attendee.user.nick_name
                            .toLowerCase()
                            .includes(searchValue.toLowerCase()),
                        ) ||
                        Boolean(
                          attendee.user.first_name
                            .toLowerCase()
                            .includes(searchValue.toLowerCase()),
                        ) ||
                        Boolean(
                          attendee.user.last_name
                            .toLowerCase()
                            .includes(searchValue.toLowerCase()),
                        ),
                    )
                    .map((attendee: any) => (
                      <Tr
                        key={attendee.id}
                        cursor={'pointer'}
                        _hover={{ bg: 'blue.400', color: 'white' }}
                        onClick={() => {
                          setTicketId(attendee.id);
                          onOpen();
                        }}
                      >
                        <Td>{attendee.user.nick_name}</Td>
                        <Td>{attendee.user.first_name}</Td>
                        <Td>{attendee.user.last_name}</Td>
                        <Td>{attendee.is_checked_in ? <FiCheck /> : null}</Td>
                      </Tr>
                    ))
                : null}
            </Tbody>
          </Table>
        </TableContainer>

        <Modal
          initialFocusRef={confirmRef}
          isOpen={isOpen}
          onClose={() => {
            setTicketId(null);
            onClose();
          }}
        >
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Confirm check-in</ModalHeader>
            <ModalCloseButton />
            <ModalBody></ModalBody>

            <ModalFooter>
              <Button
                ref={confirmRef}
                colorScheme="blue"
                onClick={handleConfirm}
              >
                Confirm
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </Stack>
  );
};

export default CheckInPage;
