import * as dotenv from 'dotenv';

dotenv.config();

interface Config {
  apiHostname: string;
  apiPort: string;
  authHostname: string;
  authPort: string;
  databaseHost: string;
  databasePort: string;
  databaseName: string;
  databaseUser: string;
  databasePassword: string;
  jwtSecret: string;
  aesKey: string;
  gcpApiKey: string;
  eventbriteApiKey: string;
  eventbriteClientSecret: string;
  apiUrl: string;
}

const config: Config = {
  apiHostname: process.env.MMS_API_SERVER_HOSTNAME ?? 'localhost',
  apiPort: process.env.MMS_API_SERVER_PORT ?? '3000',
  authHostname: process.env.MMS_AUTH_SERVER_HOSTNAME ?? 'localhost',
  authPort: process.env.MMS_AUTH_SERVER_PORT ?? '3001',
  databaseHost: process.env.MMS_DATABASE_HOST ?? 'localhost',
  databasePort: process.env.MMS_DATABASE_PORT ?? '5432',
  databaseName: process.env.MMS_DATABASE_NAME ?? '',
  databaseUser: process.env.MMS_DATABASE_USER ?? '',
  databasePassword: process.env.MMS_DATABASE_PASSWORD ?? '',
  jwtSecret: process.env.JWT_ACCESS_SECRET ?? '',
  aesKey: process.env.AES_ENCRYPTION_KEY ?? '',
  gcpApiKey: process.env.GCP_API_KEY ?? '',
  eventbriteApiKey: process.env.EVENTBRITE_API_KEY ?? '',
  eventbriteClientSecret: process.env.EVENTBRITE_CLIENT_SECRET ?? '',
  apiUrl: process.env.MMS_API_URL ?? '',
};

export default config;
