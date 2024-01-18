import * as dotenv from 'dotenv';

dotenv.config();

interface Config {
  apiUrl: string;
  apiPort: string;
  authUrl: string;
  authPort: string;
}

const config: Config = {
  apiUrl: process.env.MMS_API_SERVER_URL ?? 'http://localhost',
  apiPort: process.env.MMS_API_SERVER_PORT ?? '3000',
  authUrl: process.env.MMS_AUTH_SERVER_URL ?? 'http://localhost',
  authPort: process.env.MMS_AUTH_SERVER_PORT ?? '3001',
};

export default config;
