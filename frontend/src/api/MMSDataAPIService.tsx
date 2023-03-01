import Attendee from '../util/Attendee'

export function getAttendees() {
  return fetch(`${import.meta.env.VITE_API_URL}/getAttendees`)
    .then(response => {
      return response.json()
    })
}

export function getMeetups() {
  return fetch(`${import.meta.env.VITE_API_URL}/getMeetups`)
    .then(response => {
      return response.json()
    })
}

export function updateAttendee(attendee: Attendee) {
  if (attendee) {
    const request = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: attendee.id,
        name: attendee.name,
        raffle_number: attendee.raffle_number,
        raffle_winner: attendee.raffle_winner,
        checked_in: attendee.checked_in,
        meetup_name: attendee.meetup_name,
        email: attendee.email
      })
    }

    return fetch(`${import.meta.env.VITE_API_URL}/updateAttendee/${attendee.id}`, request)
      .then(response => {
        return response.json()
      })
  }
}

export function createRaffleWin(attendee: Attendee) {
  const request = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      attendee_id: attendee.id
    })
  }

  return fetch(`${import.meta.env.VITE_API_URL}/createRaffleWin`, request)
    .then(response => {
      return response.json()
    })
}

export function updateRaffleWin(attendee: Attendee) {
  return fetch(`${import.meta.env.VITE_API_URL}/getLatestRaffleWin`)
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

        return fetch(`${import.meta.env.VITE_API_URL}/updateRaffleWin/${data[0].id}`, raffle_history_request)
          .then(response => {
            return response
          })
      }
    })
}

export function getLatestRaffleWin() {
  return fetch(`${import.meta.env.VITE_API_URL}/getLatestRaffleWin`)
    .then(response => {
      return response.json()
    })
}