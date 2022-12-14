import * as express from 'express'
const attendee = require('./model/attendee')

const DEFAULT_API_SERVER_PORT = '3000'

class Server {
  private express: express.Application

  constructor() {
    this.express = express.default()
    this.config()
    this.routes()
  }

  private config(): void {
    this.express.use(express.json())
    this.express.use(express.urlencoded({ extended: false }))
    this.express.use(function (req, res, next) {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Access-Control-Allow-Headers')
      next()
    })
  }

  private routes(): void {
    this.express.get('/', (req, res, next) => {
      res.send("Meetup Management System API")
    })

    this.express.get('/api/getAttendees', (req, res, next) => {
      attendee.getAttendees()
        .then((response: any) => {
          res.status(200).send(response)
        })
        .catch((error: any) => {
          res.status(500).send(error)
        })
    })

    this.express.get('/api/getMeetups', (req, res, next) => {
      attendee.getMeetups()
        .then((response: any) => {
          res.status(200).send(response)
        })
        .catch((error:any) => {
          res.status(500).send(error)
        })
    })

    this.express.use("*", (req, res, next) => {
      res.send("Not a valid endpoint.")
    })
  }

  public start = (port: number) => {
    return new Promise((resolve, reject) => {
      this.express.listen(port, () => {
        resolve(port)
      }).on('error', (err: Object) => reject(err))
    })
  }
}

const port = parseInt(process.env.MMS_API_SERVER_PORT || DEFAULT_API_SERVER_PORT)
const server = new Server().start(port)
  .then(port => console.log(`Running on port ${port}`))
  .catch(error => {
    console.log(error)
  })
