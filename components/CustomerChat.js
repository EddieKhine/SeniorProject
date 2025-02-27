import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaPaperPlane } from 'react-icons/fa';

export default function CustomerChat({ 
  restaurantId, 
  restaurantName, 
  customerId,
  setShowChat
}) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [conversation, setConversation] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000', {
      path: '/api/socket',
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
      withCredentials: true
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      newSocket.emit('join_chat', { customerId, restaurantId });
    });
    
    setSocket(newSocket);
    fetchOrCreateConversation();

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [customerId, restaurantId]);

  useEffect(() => {
    if (socket) {
      socket.on('receive_message', (data) => {
        console.log('Received message:', data);
        setMessages(prev => [...prev, {
          message: data.message,
          senderId: data.senderId,
          senderType: data.senderType,
          timestamp: data.timestamp
        }]);
        scrollToBottom();
      });

      return () => {
        socket.off('receive_message');
      };
    }
  }, [socket]);

  const fetchOrCreateConversation = async () => {
    const response = await fetch('/api/conversations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('customerToken')}`
      },
      body: JSON.stringify({ restaurantId })
    });
    
    const data = await response.json();
    setConversation(data.conversation);
    setMessages(data.messages);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      // Ensure conversation exists
      if (!conversation) {
        await fetchOrCreateConversation();
      }

      const messageData = {
        conversationId: conversation._id,
        message: newMessage,
        senderId: customerId,
        senderType: 'customer',
        recipientId: restaurantId
      };

      // Update local messages state immediately
      setMessages(prev => [...prev, {
        content: newMessage,
        senderId: customerId,
        senderType: 'customer',
        createdAt: new Date().toISOString()
      }]);

      // Emit message through socket
      socket.emit('send_message', messageData);

      // Save message to database
      await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('customerToken')}`
        },
        body: JSON.stringify(messageData)
      });

      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-16 sm:bottom-20 right-2 sm:right-6 w-[calc(100%-1rem)] sm:w-[400px] max-w-[400px] h-[500px] sm:h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-[1000] overflow-hidden"
      >
        {/* Header */}
        <div className="p-3 sm:p-4 bg-[#FF4F18] text-white flex justify-between items-center">
          <div>
            <h3 className="text-base sm:text-lg font-semibold">{restaurantName}</h3>
            <p className="text-xs sm:text-sm text-white/80">Chat Support</p>
          </div>
          <button 
            onClick={() => setShowChat(false)}
            className="p-1.5 sm:p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <FaTimes className="text-lg sm:text-xl" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`mb-2 sm:mb-4 ${
                msg.senderType === 'customer' ? 'text-right' : 'text-left'
              }`}
            >
              <div
                className={`inline-block p-2.5 sm:p-3 rounded-2xl max-w-[80%] ${
                  msg.senderType === 'customer'
                    ? 'bg-[#FF4F18] text-white'
                    : 'bg-white shadow-md'
                }`}
              >
                <p className={`text-sm sm:text-base ${msg.senderType === 'customer' ? 'text-white' : 'text-gray-800'}`}>
                  {msg.content || msg.message}
                </p>
                <span className={`text-[10px] sm:text-xs ${
                  msg.senderType === 'customer' ? 'text-white/70' : 'text-gray-500'
                }`}>
                  {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : 'Just now'}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 sm:p-4 border-t border-gray-100">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 p-2.5 sm:p-3 text-sm sm:text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF4F18]/20 focus:border-[#FF4F18]"
              placeholder="Type your message..."
            />
            <button
              onClick={sendMessage}
              className="p-2.5 sm:p-3 bg-[#FF4F18] text-white rounded-xl hover:bg-[#FF4F18]/90 transition-colors"
            >
              <FaPaperPlane className="text-sm sm:text-base" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
} 