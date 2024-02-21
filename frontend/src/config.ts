interface Config {
  apiUrl: string;
  apiPort: string;
  authUrl: string;
  authPort: string;
}

const config: Config = {
  apiUrl: import.meta.env.VITE_MMS_API_SERVER_URL ?? 'http://localhost',
  apiPort: import.meta.env.VITE_MMS_API_SERVER_PORT ?? '3000',
  authUrl: import.meta.env.VITE_MMS_AUTH_SERVER_URL ?? 'http://localhost',
  authPort: import.meta.env.VITE_MMS_AUTH_SERVER_PORT ?? '3001',
};

export default config;
