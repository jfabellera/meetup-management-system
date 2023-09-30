import * as express from 'express'
import jwt from 'jsonwebtoken'

const DEFAULT_AUTH_SERVER_PORT = '3001'

class AuthServer {
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
      res.send("Meetup Management System Authentication")
    })

    this.express.get('/login', (req, res) => {
      // TODO(jan): Once new database schema is setup, add actual password hash comparison and user info population
      // TODO(jan): Add field validation (express-validator)
      if (true) {
        // Authorized
        const userInfo = { username: '',  isAdmin: false, isOrganizer: false }
        const accessToken = jwt.sign({ userInfo }, process.env.JWT_ACCESS_SECRET || '')

        res.json({ accessToken: accessToken })
      } else {
        // Unauthorized
        res.status(401).json({ message: "Authentication failed" })
      }
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

const port = parseInt(process.env.MMS_AUTH_SERVER_PORT || DEFAULT_AUTH_SERVER_PORT)
const server = new AuthServer().start(port)
  .then(port => console.log(`Running on port ${port}`))
  .catch(error => {
    console.log(error)
  })