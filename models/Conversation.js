import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Customer'
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'RestaurantOwner'
  },
  lastMessage: {
    type: String,
    default: ''
  },
  lastMessageTime: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true 
});

export default mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema); 