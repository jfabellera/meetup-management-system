import pool from '../config/database'

const getMeetups = () => {
  return new Promise(function(resolve, reject) {
    pool.query('SELECT DISTINCT meetup_name FROM attendees ORDER BY meetup_name DESC', (error, results) => {
      if (error) {
        reject(error)
      }
      resolve(results.rows);
    })
  })
}

const getAttendees = () => {
  return new Promise(function(resolve, reject) {
    pool.query('SELECT * FROM attendees ORDER BY id ASC', (error, results) => {
      if (error) {
        reject(error)
      }
      resolve(results.rows);
    })
  })
}

const updateAttendee = (id: string, name: string, checked_in: boolean, raffle_number: number, raffle_winner: boolean) => {
  return new Promise(function(resolve, reject) {
    pool.query(
      'UPDATE attendees SET name=$1, checked_in=$2, raffle_number=$3, raffle_winner=$4 WHERE id=$5',
      [name, checked_in, raffle_number, raffle_winner, id],
      (error, results) => {
        if (error) {
          reject(error)
        }
        resolve(results)
      }
    )
  })
}

module.exports = {
  getAttendees,
  getMeetups,
  updateAttendee
}
