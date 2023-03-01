import pool from '../config/database'

const getLatestRaffleWin = () => {
    return new Promise(function(resolve, reject) {
      pool.query('SELECT * FROM raffle_history ORDER BY roll_timestamp DESC LIMIT 1;', (error, results) => {
        if (error) {
          reject(error)
        }
        resolve(results.rows);
      })
    }) 
}

const createRaffleWin = (attendee_id: string) => {
  return new Promise(function(resolve, reject) {
    pool.query('INSERT INTO raffle_history (attendee_id) VALUES ($1)', [attendee_id], (error, results) => {
      if (error) {
        reject(error)
      }
      resolve(results);
    })
  })
}

const updateRaffleWin = (id: string, claimed: boolean) => {
  return new Promise(function(resolve, reject) {
    pool.query(
      'UPDATE raffle_history SET claimed=$1 WHERE id=$2',
      [claimed, id],
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
  getLatestRaffleWin,
  createRaffleWin,
  updateRaffleWin,
}
