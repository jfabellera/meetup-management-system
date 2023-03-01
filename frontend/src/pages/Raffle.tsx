import { useEffect, useState } from 'react'
import { FiAward } from 'react-icons/fi'
import {
  Box,
  Button,
  Checkbox,
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
import Attendee from '../util/Attendee'
import { createRaffleWin, getAttendees, updateAttendee, updateRaffleWin } from '../api/MMSDataAPIService'

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

export default function Raffle() {
  const [attendeeData, setAttendeeData] = useState<Attendee[]>([initAttendee])
  const [filteredAttendeeData, setFilteredAttendeeData] = useState<Attendee[]>([initAttendee])

  const [loading, setLoading] = useState(true)

  const [raffleNumber, setRaffleNumber] = useState(-1)
  const [raffleWinner, setRaffleWinner] = useState('')
  const [raffleWinnerSaved, setRaffleWinnerSaved] = useState(false)
  const [attendeeWinner, setAttendeeWinner] = useState<Attendee | null>(null)
  const [raffleEntrants, setRaffleEntrants] = useState<Attendee[]>([initAttendee])
  const [isPrizeClaimed, setIsPrizeClaimed] = useState(false)
  const [removeWinnersFromRolls, setRemoveWinnersFromRolls] = useState(true)

  useEffect(() => {
    if (attendeeData) {
      filterAttendees(attendeeData)
      setRaffleEntrants(generateRaffleEntrantPool(attendeeData))
    }
  }, [attendeeData])

  useEffect(() => {
    if (attendeeWinner && !raffleWinnerSaved) {
      addToRaffleHistory()
    }
  }, [attendeeWinner])

  useEffect(() => {
    getAttendeesData()
    filterAttendees(attendeeData)
    setLoading(false)
  }, [loading])

  async function getAttendeesData() {
    try {
      const getAttendeesResponse = await getAttendees()
      setAttendeeData(getAttendeesResponse)
      filterAttendees(getAttendeesResponse)
    } catch(error) {
      console.log(error)
    }
  }

  function filterAttendees(attendees: Attendee[]) {
    const filteredAttendeeData = attendees.filter((attendee: Attendee) => {
      let selectedMeetup = localStorage.getItem(SELECTED_MEETUP_STORAGE_KEY)
      let isMeetupAttendee = attendee.meetup_name == selectedMeetup
      let isRaffleEntrant = attendee.raffle_number > 0

      return isMeetupAttendee && isRaffleEntrant
    })
    setFilteredAttendeeData(filteredAttendeeData)
  }

  function generateRaffleEntrantPool(attendees: any) {
    const raffleEntrantPool = attendees.filter((attendee: Attendee) => {
      let selectedMeetup = localStorage.getItem(SELECTED_MEETUP_STORAGE_KEY)
      let isMeetupAttendee = attendee.meetup_name == selectedMeetup
      let isRaffleEntrant = attendee.raffle_number > 0
      let isRaffleWinner = attendee.raffle_winner

      return isMeetupAttendee && isRaffleEntrant && (!removeWinnersFromRolls || !isRaffleWinner)
    })
    return raffleEntrantPool
  }

  function rollRaffleNumber() {
    setIsPrizeClaimed(false)
    if (raffleEntrants && raffleEntrants.length > 0) {
      let randomNumber = Math.floor(Math.random() * raffleEntrants.length)
      let hasWinnerBeenChosen = false
      while (!hasWinnerBeenChosen) {
        console.log(randomNumber)
        if (removeWinnersFromRolls && raffleEntrants[randomNumber].raffle_winner) {
          console.log("Re-rolling...")
          randomNumber = Math.floor(Math.random() * raffleEntrants.length)
        } else {
          hasWinnerBeenChosen = true
        }
      }
      setRaffleWinnerSaved(false)
      setRaffleWinner(raffleEntrants[randomNumber].name)
      setRaffleNumber(raffleEntrants[randomNumber].raffle_number)
      setAttendeeWinner(raffleEntrants[randomNumber])
    }
  }

  async function addToRaffleHistory() {
    try {
      if (attendeeWinner) {
        await createRaffleWin(attendeeWinner)
        setRaffleWinnerSaved(true)
        getAttendeesData()
      }
    } catch(error) {
      console.log(error)
    }
  }

  async function claimRaffle() {
    setIsPrizeClaimed(true)
    console.log("!claim")

    if (attendeeWinner) {
      attendeeWinner.raffle_winner = true
      try {
        await updateAttendee(attendeeWinner)
        await updateRaffleWin(attendeeWinner)
        getAttendeesData()
      } catch(error) {
        console.log(error)
      }
    }
  }

  return (
    <Page
      pageTitle="Raffle"
      pageDescription="Roll raffle numbers and mark raffle winners.">
        <VStack spacing="12px" alignItems="left">
          <Checkbox
            isChecked={removeWinnersFromRolls}
            onChange={(event) => {
              setRemoveWinnersFromRolls(event.target.checked)
            }}>Remove winners from rolls</Checkbox>
          <Button
            variant="solid"
            colorScheme="yellow"
            width="300px"
            onClick={rollRaffleNumber}
            isDisabled={raffleEntrants ? raffleEntrants.length == 0 : true }>
            Roll Raffle Number
          </Button>
          <Box>
            <Text>Raffle Winner Number: {raffleNumber > 0 ? raffleNumber : 'No number rolled!'}</Text>
            <Text>Raffle Winner Name: {raffleWinner ? raffleWinner : 'No winner rolled!'}</Text>
            <Button
              variant="solid"
              colorScheme="green"
              width="300px"
              onClick={claimRaffle}
              isDisabled={raffleWinner == '' || isPrizeClaimed}>
                Claim
              </Button>
          </Box>
          <TableContainer>
            <Table variant="simple" bg="whiteAlpha.600">
              <Thead bg="white">
                <Tr>
                  <Th>Name</Th>
                  <Th>Raffle Number</Th>
                  <Th>Raffle Winner</Th>
                </Tr>
              </Thead>
              <Tbody>
                {
                  !loading ?
                    filteredAttendeeData.map((attendee, i) => {
                      return <Tr _hover= {{ bg: '#ccc' }} key={i}>
                        <Td>{attendee.name}</Td>
                        <Td>{attendee.raffle_number ? attendee.raffle_number : '-'}</Td>
                        <Td>{attendee.raffle_winner ? <FiAward /> : ''}</Td>
                      </Tr>
                    })
                  : <Tr>
                      <Td>No data loaded.</Td>
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
