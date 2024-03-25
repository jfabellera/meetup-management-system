import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import config from './config';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('message', (msg) => {
    console.log('message: ' + msg);
    io.emit('message', msg);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

httpServer.listen(parseInt(config.socketPort), config.socketHostname, () => {
  console.log(`Socket server running on port ${config.socketPort}`);
});
