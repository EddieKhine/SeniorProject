import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { FaPaperPlane, FaUser, FaSearch, FaPhone, FaEllipsisV, FaPaperclip } from 'react-icons/fa';
import jwt from 'jsonwebtoken';

export default function RestaurantOwnerChat() {
  const [conversations, setConversations] = useState([]);
  const [restaurantId, setRestaurantId] = useState(null);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'archived'
  const [unreadCount, setUnreadCount] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('restaurantOwnerToken');
    if (token) {
      try {
        const decoded = jwt.decode(token);
        console.log('Decoded token:', decoded);
        if (decoded.userId) {
          // Fetch restaurant ID if not in token
          fetch('/api/restaurant-owner/restaurant', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          .then(res => res.json())
          .then(data => {
            if (data.restaurant?._id) {
              setRestaurantId(data.restaurant._id);
            }
          })
          .catch(err => console.error('Error fetching restaurant:', err));
        }
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, []);

  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000', {
      path: '/api/socket',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    newSocket.on('connect', () => {
      console.log('Restaurant owner socket connected');
      newSocket.emit('join_restaurant', { restaurantId });
    });
    
    setSocket(newSocket);
    fetchConversations();

    return () => {
      newSocket.off('connect_error');
      newSocket.off('connect');
      newSocket.disconnect();
    };
  }, [restaurantId]);

  useEffect(() => {
    if (socket) {
      socket.on('receive_message', (data) => {
        if (activeConversation && data.conversationId === activeConversation._id) {
          setMessages(prev => [...prev, {
            content: data.message,
            senderId: data.senderId,
            senderType: data.senderType,
            createdAt: data.createdAt
          }]);
          scrollToBottom();
        } else {
          setUnreadCount(prev => ({
            ...prev,
            [data.conversationId]: (prev[data.conversationId] || 0) + 1
          }));
        }
        fetchConversations();
      });

      return () => {
        socket.off('receive_message');
      };
    }
  }, [socket, activeConversation]);

  const fetchConversations = async () => {
    try {
      if (!restaurantId) {
        console.log('No restaurant ID available yet');
        return;
      }
      
      console.log('Fetching conversations for restaurantId:', restaurantId);
      const token = localStorage.getItem('restaurantOwnerToken');
      
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ restaurantId })
      });
      
      const data = await response.json();
      
      if (data.conversations) {
        const conversationsWithCustomers = data.conversations.map(conv => ({
          ...conv,
          customerName: conv.customerId ? `${conv.customerId.firstName} ${conv.customerId.lastName}` : 'Unknown Customer',
          customerEmail: conv.customerId?.email || 'No email'
        }));
        setConversations(conversationsWithCustomers);
      } else {
        console.error('No conversations in response:', data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const token = localStorage.getItem('restaurantOwnerToken');
      const response = await fetch(`/api/messages?conversationId=${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.messages) {
        setMessages(data.messages);
        scrollToBottom();
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const markConversationAsRead = async (conversationId) => {
    try {
      const token = localStorage.getItem('restaurantOwnerToken');
      await fetch(`/api/conversations/${conversationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setUnreadCount(prev => ({
        ...prev,
        [conversationId]: 0
      }));
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  };

  const handleConversationClick = async (conversation) => {
    setActiveConversation(conversation);
    await fetchMessages(conversation._id);
    await markConversationAsRead(conversation._id);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return;

    const messageData = {
      conversationId: activeConversation._id,
      message: newMessage,
      senderId: restaurantId,
      senderType: 'restaurant',
      recipientId: activeConversation.customerId
    };

    setMessages(prev => [...prev, {
      content: newMessage,
      senderId: restaurantId,
      senderType: 'restaurant',
      createdAt: new Date().toISOString()
    }]);

    socket.emit('send_message', messageData);

    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('restaurantOwnerToken')}`
        },
        body: JSON.stringify(messageData)
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }

    setNewMessage('');
    scrollToBottom();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getFilteredConversations = () => {
    return conversations
      .filter(conv => {
        const matchesSearch = conv.customerName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = 
          filter === 'all' ? true :
          filter === 'unread' ? (unreadCount[conv._id] || 0) > 0 :
          filter === 'archived' ? conv.archived :
          true;
        return matchesSearch && matchesFilter;
      });
  };

  return (
    <div className="h-full bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="h-full flex">
        {/* Left Panel */}
        <div className="w-96 bg-gray-50 border-r border-gray-100">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800">Inbox</h2>
            <div className="mt-2 relative">
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search conversations..."
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF4F18]/20 focus:border-[#FF4F18]"
              />
              <FaSearch className="absolute right-3 top-3 text-gray-400" />
            </div>
          </div>

          <div className="px-3">
            <div className="flex gap-2 mb-4 overflow-x-auto px-3 py-2">
              <button 
                onClick={() => setFilter('all')}
                className={`px-4 py-1.5 ${
                  filter === 'all' 
                    ? 'bg-[#FF4F18] text-white' 
                    : 'bg-white text-gray-600 border border-gray-200'
                } rounded-full text-sm whitespace-nowrap`}
              >
                All Messages
              </button>
              <button 
                onClick={() => setFilter('unread')}
                className={`px-4 py-1.5 ${
                  filter === 'unread' 
                    ? 'bg-[#FF4F18] text-white' 
                    : 'bg-white text-gray-600 border border-gray-200'
                } rounded-full text-sm whitespace-nowrap`}
              >
                Unread
              </button>
              <button 
                onClick={() => setFilter('archived')}
                className={`px-4 py-1.5 ${
                  filter === 'archived' 
                    ? 'bg-[#FF4F18] text-white' 
                    : 'bg-white text-gray-600 border border-gray-200'
                } rounded-full text-sm whitespace-nowrap`}
              >
                Archived
              </button>
            </div>
          </div>

          <div className="overflow-y-auto h-[calc(100vh-220px)]">
            {getFilteredConversations().map(conv => (
              <div
                key={conv._id}
                onClick={() => handleConversationClick(conv)}
                className={`p-4 cursor-pointer transition-all border-l-4 ${
                  activeConversation?._id === conv._id 
                    ? 'bg-white border-l-[#FF4F18]' 
                    : 'border-l-transparent hover:bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <FaUser className="text-gray-500" />
                    </div>
                    {(unreadCount[conv._id] || 0) > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF4F18] text-white text-xs rounded-full flex items-center justify-center">
                        {unreadCount[conv._id]}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-semibold text-gray-900 truncate">
                        {conv.customerName}
                      </h4>
                      <span className="text-xs text-gray-500">
                        {new Date(conv.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {conv.lastMessage || 'No messages yet'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {activeConversation ? (
            <>
              <div className="p-6 border-b border-gray-100 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <FaUser className="text-gray-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {activeConversation.customerName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {activeConversation.customerEmail}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                      <FaPhone />
                    </button>
                    <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                      <FaEllipsisV />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-black bg-gray-50">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.senderType === 'restaurant' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-5 py-3 ${
                        msg.senderType === 'restaurant'
                          ? 'bg-[#FF4F18] text-white ml-4'
                          : 'bg-white shadow-sm mr-4'
                      }`}
                    >
                      <p className="text-[15px]">{msg.content}</p>
                      <span className={`text-xs block mt-1 ${
                        msg.senderType === 'restaurant' ? 'text-white/70' : 'text-gray-400'
                      }`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 bg-white border-t border-gray-100">
                <div className="flex items-end gap-3">
                  <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                    <FaPaperclip />
                  </button>
                  <div className="flex-1 bg-gray-50 rounded-xl p-2">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      placeholder="Type your message..."
                      className="w-full bg-transparent border-0 focus:ring-0 resize-none max-h-32 min-h-[2.5rem] text-gray-700 placeholder-gray-500"
                      rows="1"
                    />
                  </div>
                  <button
                    onClick={sendMessage}
                    className="p-3 bg-[#FF4F18] text-white rounded-xl hover:bg-[#FF4F18]/90 transition-colors"
                  >
                    <FaPaperPlane />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                  <FaUser className="text-3xl text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">Select a Conversation</h3>
                <p className="text-gray-500 max-w-md">
                  Choose a customer conversation from the left to start chatting
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 