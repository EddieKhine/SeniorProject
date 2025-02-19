const { Server } = require('socket.io');

let io;

function initSocket(server) {
  if (io) {
    return io;
  }

  io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000",
      methods: ['GET', 'POST'],
      credentials: true
    },
    path: '/api/socket',
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Handle joining chat rooms for customers
    socket.on('join_chat', (data) => {
      const { customerId, restaurantId } = data;
      const roomId = `chat_${customerId}_${restaurantId}`;
      socket.join(roomId);
      console.log(`Client ${socket.id} joined room: ${roomId}`);
    });

    // Handle joining for restaurant owners
    socket.on('join_restaurant', (data) => {
      const { restaurantId } = data;
      const roomId = `restaurant_${restaurantId}`;
      socket.join(roomId);
      console.log(`Restaurant ${socket.id} joined room: ${roomId}`);
    });

    // Handle sending messages
    socket.on('send_message', (data) => {
      const { conversationId, message, senderId, senderType, recipientId } = data;
      const roomId = senderType === 'restaurant' 
        ? `chat_${recipientId}_${senderId}`
        : `chat_${senderId}_${recipientId}`;
      
      io.to(roomId).emit('receive_message', {
        message: message,
        content: message,
        senderId,
        senderType,
        createdAt: new Date().toISOString(),
        conversationId
      });
      
      console.log(`Message sent in room ${roomId}: ${message}`);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}

module.exports = { initSocket, getIO }; 