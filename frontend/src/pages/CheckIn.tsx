import { useEffect, useState } from 'react'
import { FiCheck, FiPlus } from 'react-icons/fi'
import {
  Button,
  Input,
  Radio,
  RadioGroup,
  Stack,
  Table,
  TableContainer,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  VStack,
  Modal,
  ModalBody,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalFooter,
  NumberInput,
  NumberInputField,
} from '@chakra-ui/react'
import Page from '../components/Page/Page'
import Attendee from '../util/Attendee'

const SELECTED_MEETUP_STORAGE_KEY = 'selectedMeetup'
const initAttendee: Attendee = {
  id: '',
  name: '',
  order_id: '',
  checked_in: false,
  raffle_number: -1,
  raffle_winner: false,
  meetup_name: '',
  email: ''
}

export default function CheckIn() {
  const [searchType, setSearchType] = useState('name')
  const [searchText, setSearchText] = useState('')
  const [attendeeData, setAttendeeData] = useState<Attendee[] | null>(null)
  const [filteredAttendeeData, setFilteredAttendeeData] = useState<Attendee[] | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [raffleNumber, setRaffleNumber] = useState(-1)
  const [currentAttendee, setCurrentAttendee] = useState<Attendee>(initAttendee)
  const [isButtonDisabled, setIsButtonDisabled] = useState(Number.isNaN(raffleNumber))
  const [validationMessage, setValidationMessage] = useState('')

  function updateUser() {
    if (currentAttendee) {
      const request = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentAttendee.id,
          name: currentAttendee.name,
          raffle_number: currentAttendee.checked_in ? raffleNumber : -1,
          raffle_winner: currentAttendee.raffle_winner,
          checked_in: currentAttendee.checked_in,
          meetup_name: currentAttendee.meetup_name,
          email: currentAttendee.email
        })
      }

      fetch(`${import.meta.env.VITE_API_URL}/updateAttendee/${currentAttendee.id}`, request)
        .then(response => {
          return response
        })
        .then(data => {
          getAttendees()
        })
    }
  }

  function validateInput(value: string) {
    if (Number.isNaN(parseInt(value))) {
      setValidationMessage('The input value is not a number.')
      setIsButtonDisabled(true)
    } else {
      setValidationMessage('')
      setIsButtonDisabled(false)
      setRaffleNumber(parseInt(value))
    }
  }

  function openModal(attendee: Attendee)
  {
    setCurrentAttendee(attendee)
    setShowModal(true)
  }

  function checkIn() {
    if (currentAttendee) {
      currentAttendee.checked_in = true
      updateUser()
    }
    setShowModal(false)
  }

  function undoCheckIn() {
    if (currentAttendee) {
      currentAttendee.checked_in = false
      updateUser()
    }
    setShowModal(false)
  }

  useEffect(() => {
    getAttendees()
  }, [searchType, searchText])

  function getAttendees() {
    fetch(`${import.meta.env.VITE_API_URL}/getAttendees`)
      .then(response => {
        return response.json()
      })
      .then(data => {
        if (data) {
          setAttendeeData(data)
          filterAttendees(data)
        }
      })
  }

  function filterAttendees(attendees: Attendee[] | null) {
    if (attendees) {
      let selectedMeetup = localStorage.getItem(SELECTED_MEETUP_STORAGE_KEY)

      setFilteredAttendeeData(
        attendees.filter(attendee => {
          let cleanSearchText = searchText.trim().toLowerCase()
          let isMeetupAttendee = attendee.meetup_name == selectedMeetup
          let searchTextMatch = false

          if (cleanSearchText != '') {
            let attendeeSearchTypeValue = searchType == 'name'
              ? attendee.name.toLowerCase()
              : attendee.order_id.toLowerCase()
            searchTextMatch = attendeeSearchTypeValue.includes(cleanSearchText)
          } else {
            searchTextMatch = true
          }

          return isMeetupAttendee && searchTextMatch
        })
      )
    }
  }

  function getNumberCheckedIn() {
    if (attendeeData) {
      let selectedMeetup = localStorage.getItem(SELECTED_MEETUP_STORAGE_KEY)
      return attendeeData.filter((attendee) => attendee.meetup_name == selectedMeetup && attendee.checked_in).length
    }
    return "-"
  }

  return (
    <Page
      pageTitle="Check-in"
      pageDescription="Search and filter attendees to check them in during meetups.">
        <VStack spacing="12px" alignItems="left">
          <Text># of Checked In Attendees: {getNumberCheckedIn()}</Text>

          <RadioGroup defaultValue={searchType} value={searchType} onChange={(value) => {
            setSearchType(value)
            filterAttendees(attendeeData)
          }}>
            <Stack spacing={5} direction="row">
              <Radio colorScheme="green" value="name">Search by Name</Radio>
              <Radio colorScheme="green" value="orderId">Search by Order Id</Radio>
            </Stack>
          </RadioGroup>

          <Input
            bg="white"
            placeholder={searchType == "name" ? "Search by Name" : "Search by Order Id"}
            value={searchText}
            onChange={(event) => {
                setSearchText(event.target.value)
                filterAttendees(attendeeData)
              }
            } />

          <TableContainer>
            <Table variant="simple" bg="whiteAlpha.600">
              <Thead bg="white">
                <Tr>
                  <Th>Name</Th>
                  <Th>Order ID</Th>
                  <Th>Raffle Number</Th>
                  <Th>Check-in Status</Th>
                </Tr>
              </Thead>
              <Tbody>
                {
                  filteredAttendeeData ?
                  filteredAttendeeData.map((attendeeData, i) => {
                      const attendee: Attendee = {
                        id: attendeeData.id,
                        name: attendeeData.name,
                        order_id: attendeeData.order_id,
                        checked_in: attendeeData.checked_in,
                        raffle_number: attendeeData.raffle_number,
                        raffle_winner: attendeeData.raffle_winner,
                        meetup_name: attendeeData.meetup_name,
                        email: attendeeData.email
                      }

                      return <Tr _hover= {{ bg: '#ccc' }} key={i}>
                        <Td>{attendee.name}</Td>
                        <Td>{attendee.order_id}</Td>
                        <Td>{attendee.raffle_number < 0 ? "Not assigned" : attendee.raffle_number }</Td>
                        <Td>
                          <Button
                            onClick={() => openModal(attendee) }
                            leftIcon={ attendee.checked_in ? <FiCheck /> : <FiPlus /> }
                            colorScheme={ attendee.checked_in ? 'green' : 'gray' }>
                            {attendee.checked_in
                              ? 'Checked In'
                              : 'Not Checked In'
                            }
                          </Button>
                        </Td>
                      </Tr>
                    })
                  : <Tr>
                      <Td>No data loaded.</Td>
                      <Td>-</Td>
                      <Td>-</Td>
                      <Td>-</Td>
                    </Tr>
                }
              </Tbody>
            </Table>
          </TableContainer>
        </VStack>
        <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{ currentAttendee.checked_in ? "Editing Check-in Details" : "Check-in Confirmation" }</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <NumberInput 
              name="input-raffle-number"
              placeholder="Enter raffle ticket number"
              defaultValue={currentAttendee ? currentAttendee.raffle_number : -1}
              onChange={(value) => validateInput(value)}>
              <NumberInputField />
            </NumberInput>
            <Text color='red'>{validationMessage}</Text>
          </ModalBody>

          <ModalFooter>
            {
              currentAttendee.checked_in
                ? <Button
                    height={12}
                    colorScheme="red"
                    mr={60}
                    onClick={undoCheckIn}>
                    Undo<br/>Check-in
                  </Button>
                : <></>
            }
            <Button
              isDisabled={isButtonDisabled}
              type="submit"
              height={12}
              colorScheme="green"
              onClick={checkIn}>
              Confirm
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Page> 
  )
}
