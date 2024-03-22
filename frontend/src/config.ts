interface Config {
  apiUrl: string;
  authUrl: string;
  appUrl: string;
}

const config: Config = {
  apiUrl: import.meta.env.VITE_MMS_API_SERVER_URL ?? 'http://localhost:3000',
  authUrl: import.meta.env.VITE_MMS_AUTH_SERVER_URL ?? 'http://localhost:3001',
  appUrl: import.meta.env.VITE_MMS_APP_URL ?? 'http://localhost:5173',
};

export default config;
