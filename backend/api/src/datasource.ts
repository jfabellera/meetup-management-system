import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { User } from './entity/User'

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.MMS_DATABASE_HOST || 'localhost',
    port: parseInt(process.env.MMS_DATABASE_PORT || '5432'),
    username: process.env.MMS_DATABASE_USER || 'postgres',
    password: process.env.MMS_DATABASE_PASSWORD || 'password',
    database: process.env.MMS_DATABASE_NAME || 'mms-dev',
    entities: [User],
    synchronize: true,
    logging: false,
})
