import { useEffect, useState } from 'react'
import { FiCheck, FiPlus } from 'react-icons/fi'
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  NumberInput,
  NumberInputField,
  Radio,
  RadioGroup,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
} from '@chakra-ui/react'
import { getAttendees, updateAttendee } from '../api/MMSDataAPIService'
import Attendee from '../util/Attendee'
import Page from '../components/Page/Page'

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
  const [attendeeData, setAttendeeData] = useState<Attendee[]>([initAttendee])
  const [filteredAttendeeData, setFilteredAttendeeData] = useState<Attendee[]>([initAttendee])
  const [currentAttendee, setCurrentAttendee] = useState<Attendee>(initAttendee)
  const [raffleNumber, setRaffleNumber] = useState(-1)

  const [loading, setLoading] = useState(true)

  const [searchType, setSearchType] = useState('name')
  const [searchText, setSearchText] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [isButtonDisabled, setIsButtonDisabled] = useState(Number.isNaN(raffleNumber))
  const [validationMessage, setValidationMessage] = useState('')

  useEffect(() => {
    filterAttendees(attendeeData)
  }, [searchType, searchText, attendeeData])

  useEffect(() => {
    getAttendeesData()
    filterAttendees(attendeeData)
  }, [loading])

  async function getAttendeesData() {
    try {
      const getAttendeeResponseData = await getAttendees()
      setAttendeeData(getAttendeeResponseData)
      setLoading(false)
    } catch(error) {
      console.log(error)
    }
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

  function openModal(attendee: Attendee) {
    setCurrentAttendee(attendee)
    setShowModal(true)
  }

  async function onModalSubmit(checkInStatus: boolean) {
    currentAttendee.checked_in = checkInStatus
    currentAttendee.raffle_number = currentAttendee.checked_in ? raffleNumber : -1

    try {
      await updateAttendee(currentAttendee)
      getAttendeesData()
    } catch(error) {
      console.log(error)
    }

    setShowModal(false)
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
                  !loading ?
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
                    onClick={() => onModalSubmit(false)}>
                    Undo<br/>Check-in
                  </Button>
                : <></>
            }
            <Button
              isDisabled={isButtonDisabled}
              type="submit"
              height={12}
              colorScheme="green"
              onClick={() => onModalSubmit(true)}>
              Confirm
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Page> 
  )
}
