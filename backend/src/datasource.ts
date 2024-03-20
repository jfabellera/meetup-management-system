import 'reflect-metadata';
import { DataSource } from 'typeorm';
import config from './config';
import { EventbriteRecord } from './entity/EventbriteRecord';
import { Meetup } from './entity/Meetup';
import { OrganizerRequests } from './entity/OrganizerRequests';
import { Ticket } from './entity/Ticket';
import { User } from './entity/User';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.databaseHost,
  port: parseInt(config.databasePort),
  username: config.databaseUser,
  password: config.databasePassword,
  database: config.databaseName,
  entities: [User, Meetup, Ticket, EventbriteRecord, OrganizerRequests],
  synchronize: true,
  logging: false,
});
