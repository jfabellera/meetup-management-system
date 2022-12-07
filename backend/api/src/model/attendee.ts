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

module.exports = {
  getAttendees,
  getMeetups,
}

class Attendee {
  id: number;
  name: string;
  order_id: string;
  checked_in: boolean;
  raffle_number: number;
  meetup_name: string;

  constructor(
    id: number,
    name: string,
    order_id: string,
    checked_in: boolean,
    meetup_name: string
  ) {
    this.id = id;
    this.name = name;
    this.checked_in = checked_in;
    this.order_id = order_id;
    this.raffle_number = -1;
    this.meetup_name = meetup_name;
  }
}
