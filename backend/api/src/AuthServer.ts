import * as express from 'express'
import { createUser, updateUser, deleteUser, login } from './controllers/auth'
import { AppDataSource } from './datasource'

AppDataSource.initialize();

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
    this.express.post('/', createUser);
    this.express.put('/:id', updateUser);
    this.express.delete('/:id', deleteUser);

    this.express.post('/login', login);

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

const port = parseInt(process.env.MMS_AUTH_SERVER_PORT || '3001')
const server = new AuthServer().start(port)
  .then(port => console.log(`Running on port ${port}`))
  .catch(error => {
    console.log(error)
  })
