import * as express from 'express';
import { type RequestHandler } from 'express';
import config from './config';
import { createUser, deleteUser, login, updateUser } from './controllers/auth';
import { AppDataSource } from './datasource';
import { authChecker, Rule } from './middleware/authChecker';

void AppDataSource.initialize();

class AuthServer {
  private readonly express: express.Application;

  constructor() {
    this.express = express.default();
    this.config();
    this.routes();
  }

  private config(): void {
    this.express.use(express.json());
    this.express.use(express.urlencoded({ extended: false }));
    this.express.use(function (req, res, next) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader(
        'Access-Control-Allow-Methods',
        'GET,POST,PUT,DELETE,OPTIONS'
      );
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Access-Control-Allow-Headers'
      );
      next();
    });
  }

  private routes(): void {
    this.express.post('/', createUser as RequestHandler);
    this.express.put(
      '/:user_id',
      authChecker([Rule.overrideAdmin]) as RequestHandler,
      updateUser as RequestHandler
    );
    this.express.delete(
      '/:user_id',
      authChecker([Rule.overrideAdmin]) as RequestHandler,
      deleteUser as RequestHandler
    );

    this.express.post('/login', login as RequestHandler);

    this.express.use('*', (req, res, next) => {
      res.send('Not a valid endpoint.');
    });
  }

  public start = (port: number, hostname: string): void => {
    this.express
      .listen(port, hostname, () => {
        console.log(`Running on port ${port}`);
      })
      .on('error', (err) => {
        console.log(err);
      });
  };
}

const port = parseInt(config.authPort);
const hostname = config.authHostname;
const server = new AuthServer();
server.start(port, hostname);
