import { useEffect, useState } from 'react'
import {
  Box,
  Select,
} from '@chakra-ui/react'

const SELECTED_MEETUP_STORAGE_KEY = 'selectedMeetup'

interface Meetup {
  meetup_name: string
}

export default function MeetupDropdown() {
    const [meetupData, setMeetupData] = useState<Meetup[] | null>(null)
    const [selectedMeetup, setSelectedMeetup] = useState(() => {
      const storedSelectedMeetup = localStorage.getItem(SELECTED_MEETUP_STORAGE_KEY)
      return storedSelectedMeetup || ""
    })
    const [loading, setLoading] = useState(true)
    
    useEffect(() => {
      getMeetups()
    }, [])
  
    function getMeetups() {
      fetch(`${import.meta.env.VITE_API_URL}/getMeetups`)
        .then(response => {
          return response.json()
        })
        .then(data => {
          if (data) {
            setMeetupData(data)
          }
        })
        .finally(() => {
          setLoading(false)
        })
    }
  
    return (
      <Box height="100%" verticalAlign="middle" p="2">
        {
          meetupData ? 
            <Select
              variant="filled"
              placeholder={ loading ? 'Loading...' : 'Select a meetup' }
              value={selectedMeetup}
              onChange={(event) => {
                localStorage.setItem(SELECTED_MEETUP_STORAGE_KEY, event.target.value)
                setSelectedMeetup(event.target.value)
              }}>
            {
              meetupData.map((meetup, i) => {
                return <option value={meetup.meetup_name} key={i}>{meetup.meetup_name}</option>
              })
            }
            </Select>
          : <Select variant="filled" isDisabled={true} placeholder={ loading ? 'Loading...' : 'No available meetups.' }></Select>
        }
      </Box>
    )
  }
