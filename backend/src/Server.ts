import * as express from 'express';
import config from './config';
import { AppDataSource } from './datasource';
import meetupRoutes from './routes/meetups';
import organizerRequests from './routes/organizerRequests';
import ticketRoutes from './routes/tickets';
import userRoutes from './routes/users';

void AppDataSource.initialize();

class Server {
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
        'Content-Type, Access-Control-Allow-Headers, Authorization'
      );
      next();
    });
  }

  private routes(): void {
    this.express.use('/users', userRoutes);
    this.express.use('/meetups', meetupRoutes);
    this.express.use('/tickets', ticketRoutes);
    this.express.use('/organizerRequests', organizerRequests);

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

const port = parseInt(config.apiPort);
const hostname = config.apiHostname;
const server = new Server();
server.start(port, hostname);
