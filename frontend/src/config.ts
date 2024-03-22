interface Config {
  apiUrl: string;
  authUrl: string;
}

const config: Config = {
  apiUrl: import.meta.env.VITE_MMS_API_SERVER_URL ?? 'http://localhost:3000',
  authUrl: import.meta.env.VITE_MMS_AUTH_SERVER_URL ?? 'http://localhost:3001',
};

export default config;
