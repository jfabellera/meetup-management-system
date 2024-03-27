interface Config {
  apiUrl: string;
  authUrl: string;
  socketUrl: string;
  appUrl: string;
}

const config: Config = {
  apiUrl: import.meta.env.VITE_MMS_API_SERVER_URL ?? 'http://localhost:3000',
  authUrl: import.meta.env.VITE_MMS_AUTH_SERVER_URL ?? 'http://localhost:3001',
  socketUrl:
    import.meta.env.VITE_MMS_SOCKET_SERVER_URL ?? 'http://localhost:3002',
  appUrl: import.meta.env.VITE_MMS_APP_URL ?? 'http://localhost:5173',
};

export default config;
