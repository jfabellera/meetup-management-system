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
import { Attendee } from '../util/Attendee'

const SELECTED_MEETUP_STORAGE_KEY = 'selectedMeetup'

export default function Raffle() {
  const [raffleNumber, setRaffleNumber] = useState(-1)
  const [raffleWinner, setRaffleWinner] = useState('')
  const [attendeeWinner, setAttendeeWinner] = useState<Attendee | null>(null)
  const [attendeeData, setAttendeeData] = useState<Attendee[] | null>(null)
  const [raffleEntrants, setRaffleEntrants] = useState<Attendee[] | null>(null)
  const [filteredAttendeeData, setFilteredAttendeeData] = useState<Attendee[] | null>(null)
  const [isPrizeClaimed, setIsPrizeClaimed] = useState(false)
  const [removeWinnersFromRolls, setRemoveWinnersFromRolls] = useState(true)

  useEffect(() => {
    if (!attendeeData) {
      getAttendees()
    } else {
      setFilteredAttendeeData(filterAttendeeData(attendeeData))
      setRaffleEntrants(generateRaffleEntrantPool(attendeeData))
    }
  }, [raffleNumber, raffleWinner, attendeeData, removeWinnersFromRolls])

  function getAttendees() {
    fetch(`${import.meta.env.VITE_API_URL}/getAttendees`)
      .then(response => {
        return response.json()
      })
      .then(data => {
        if (data) {
          setAttendeeData(data)
        }
      })
  }

  function filterAttendeeData(attendees: any) {
    const filteredAttendeeData = attendees.filter((attendee: Attendee) => {
      let selectedMeetup = localStorage.getItem(SELECTED_MEETUP_STORAGE_KEY)
      let isMeetupAttendee = attendee.meetup_name == selectedMeetup
      let isRaffleEntrant = attendee.raffle_number > 0

      return isMeetupAttendee && isRaffleEntrant
    })
    return filteredAttendeeData
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
      setAttendeeWinner(raffleEntrants[randomNumber])
      setRaffleWinner(raffleEntrants[randomNumber].name)
      setRaffleNumber(raffleEntrants[randomNumber].raffle_number)
      addToRaffleHistory()
    }
  }

  function addToRaffleHistory() {
    if (attendeeWinner) {
      const request = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendee_id: attendeeWinner.id
        })
      }

      fetch(`${import.meta.env.VITE_API_URL}/createRaffleWin`, request)
        .then(response => {
          console.log(response)
          return response
        })
        .then(data => {
          getAttendees()
        })
    }
  }

  function getLatestRaffleWinId() {

  }

  function claimRaffle() {
    setIsPrizeClaimed(true)
    console.log("!claim")

    if (attendeeWinner) {
      const request = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: attendeeWinner.id,
          name: attendeeWinner.name,
          raffle_number: attendeeWinner.raffle_number,
          raffle_winner: true,
          checked_in: attendeeWinner.checked_in,
          meetup_name: attendeeWinner.meetup_name,
          email: attendeeWinner.email
        })
      }
  
      fetch(`${import.meta.env.VITE_API_URL}/updateAttendee/${attendeeWinner.id}`, request)
        .then(response => {
          return response
        })
        .then(data => {
          getAttendees()
          setRaffleEntrants(generateRaffleEntrantPool(attendeeData))
        })

      fetch(`${import.meta.env.VITE_API_URL}/getLatestRaffleWin`)
        .then(response => {
          return response.json()
        })
        .then(data => {
          if (data) {
            const raffle_history_request = {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                claimed: true
              })
            }

            fetch(`${import.meta.env.VITE_API_URL}/updateRaffleWin/${data[0].id}`, raffle_history_request)
              .then(response => {
                return response
              })
              .then(data => {
              })
          }
        })
      
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
                  filteredAttendeeData ?
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
