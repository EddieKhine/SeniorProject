const next = require('next');
const express = require('express');
const { createServer } = require('http');
const { initSocket } = require('./lib/socket');
const cors = require('cors');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();
  
  // Add CORS middleware
  server.use(cors({
    origin: process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000",
    methods: ['GET', 'POST'],
    credentials: true
  }));

  const httpServer = createServer(server);
  
  // Initialize socket.io with the HTTP server
  const io = initSocket(httpServer);

  // Add socket.io middleware
  server.use((req, res, next) => {
    req.io = io;
    next();
  });

  server.all('*', (req, res) => {
    return handle(req, res);
  });

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });
}); 