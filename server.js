const next = require('next');
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();
  const httpServer = createServer(server);
  
  // Add CORS middleware
  server.use(cors({
    origin: process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000",
    methods: ['GET', 'POST'],
    credentials: true
  }));

  // Initialize Socket.IO
  const io = new Server(httpServer, {
    path: '/api/socket',
    cors: {
      origin: process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join_restaurant', (data) => {
      socket.join(`restaurant_${data.restaurantId}`);
      console.log(`Restaurant ${socket.id} joined room: restaurant_${data.restaurantId}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  // Add socket.io middleware
  server.use((req, res, next) => {
    req.io = io;
    next();
  });

  server.all('*', (req, res) => {
    return handle(req, res);
  });

  const PORT = process.env.PORT || 3000;  // Changed back to 3000
  httpServer.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });
}); 