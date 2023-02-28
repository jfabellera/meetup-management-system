import { useEffect, useState } from 'react'
import {
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
  VStack
} from '@chakra-ui/react'
import Page from '../components/Page/Page'
import CheckInButton from '../components/CheckInButton/CheckInButton'
import Attendee from '../util/Attendee'

const SELECTED_MEETUP_STORAGE_KEY = 'selectedMeetup'

export default function CheckIn() {
  const [searchType, setSearchType] = useState('name')
  const [searchText, setSearchText] = useState('')
  const [attendeeData, setAttendeeData] = useState<Attendee[] | null>(null)
  const [filteredAttendeeData, setFilteredAttendeeData] = useState<Attendee[] | null>(null)

  useEffect(() => {
    getAttendees()
  }, [searchType, searchText, filteredAttendeeData])

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

          {/* TODO: Temporarily commenting out due to check-in button and filtering bug.
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
          */}

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
                        <Td><CheckInButton attendee={attendee} /></Td>
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
    </Page> 
  )
}
