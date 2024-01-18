import * as dotenv from 'dotenv';

dotenv.config();

interface Config {
  apiUrl: string;
  apiPort: string;
  authUrl: string;
  authPort: string;
  databaseHost: string;
  databasePort: string;
  databaseName: string;
  databaseUser: string;
  databasePassword: string;
  jwtSecret: string;
  gcpApiKey: string;
}

const config: Config = {
  apiUrl: process.env.MMS_API_SERVER_URL ?? 'http://localhost',
  apiPort: process.env.MMS_API_SERVER_PORT ?? '3000',
  authUrl: process.env.MMS_AUTH_SERVER_URL ?? 'http://localhost',
  authPort: process.env.MMS_AUTH_SERVER_PORT ?? '3001',
  databaseHost: process.env.MMS_DATABASE_HOST ?? 'localhost',
  databasePort: process.env.MMS_DATABASE_PORT ?? '5432',
  databaseName: process.env.MMS_DATABASE_NAME ?? '',
  databaseUser: process.env.MMS_DATABASE_USER ?? '',
  databasePassword: process.env.MMS_DATABASE_PASSWORD ?? '',
  jwtSecret: process.env.JWT_ACCESS_SECRET ?? '',
  gcpApiKey: process.env.GCP_API_KEY ?? '',
};

export default config;
