import { useEffect, useState } from 'react'
import { FiCheck, FiPlus } from 'react-icons/fi'
import {
  Button,
  Modal,
  ModalBody,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalFooter,
  NumberInput,
  NumberInputField,
  useDisclosure,
} from '@chakra-ui/react';
import Attendee from '../util/Attendee'

export default function CheckInButton( { attendee }: { attendee: Attendee }) {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [ raffleNumber, setRaffleNumber ] = useState(attendee.raffle_number)

  function updateUser() {
    const request = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: attendee.id,
        name: attendee.name,
        raffle_number: attendee.checked_in ? raffleNumber : -1,
        raffle_winner: attendee.raffle_winner,
        checked_in: attendee.checked_in,
        meetup_name: attendee.meetup_name,
        email: attendee.email
      })
    }
    console.log(request)

    fetch(`${import.meta.env.VITE_API_URL}/updateAttendee/${attendee.id}`, request)
      .then(response => {
        return response
      })
      .then(data => {
        console.log(`Check-in Status: ${attendee.checked_in}`)
        console.log(`Raffle number: ${attendee.raffle_number}`);
      })
  }

  function checkIn() {
    attendee.checked_in = true
    updateUser()
    onClose()
  }

  function undoCheckIn() {
    attendee.checked_in = false
    updateUser()    
    onClose()
  }

  return (
    <>
      <Button
        onClick={onOpen}
        leftIcon={ attendee.checked_in ? <FiCheck /> : <FiPlus /> }
        colorScheme={ attendee.checked_in ? 'green' : 'gray' }>
        {attendee.checked_in
          ? 'Checked In'
          : 'Not Checked In'
        }
      </Button>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{ attendee.checked_in ? "Editing Check-in Details" : "Check-in Confirmation" }</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <NumberInput 
              name="input-raffle-number"
              placeholder="Enter raffle ticket number"
              defaultValue={raffleNumber ? raffleNumber : -1} 
              onChange={(value) => setRaffleNumber(Number.parseInt(value))}>
              <NumberInputField />
            </NumberInput>
          </ModalBody>

          <ModalFooter>
            {
              attendee.checked_in
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
              type="submit"
              height={12}
              colorScheme="green"
              onClick={checkIn}>
              Confirm
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}