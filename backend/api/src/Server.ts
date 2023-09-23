import * as express from 'express'
import userRoutes from './routes/users'
import meetupRoutes from './routes/meetups'
import { AppDataSource } from './datasource'

AppDataSource.initialize();

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
    this.express.use('/users', userRoutes);
    this.express.use('/meetups', meetupRoutes);

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

const port = parseInt(process.env.MMS_API_SERVER_PORT || '3000')
const server = new Server().start(port)
  .then(port => console.log(`Running on port ${port}`))
  .catch(error => {
    console.log(error)
  })
