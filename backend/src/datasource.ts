import 'reflect-metadata';
import { DataSource } from 'typeorm';
import config from './config';
import { Meetup } from './entity/Meetup';
import { Ticket } from './entity/Ticket';
import { User } from './entity/User';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.databaseHost,
  port: parseInt(config.databasePort),
  username: config.databaseUser,
  password: config.databasePassword,
  database: config.databaseName,
  entities: [User, Meetup, Ticket],
  synchronize: true,
  logging: false,
});
