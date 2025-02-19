import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  senderType: {
    type: String,
    enum: ['customer', 'restaurant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Add middleware to update conversation's lastMessage
messageSchema.post('save', async function(doc) {
  try {
    const Conversation = mongoose.model('Conversation');
    await Conversation.findByIdAndUpdate(doc.conversationId, {
      lastMessage: doc.content,
      lastMessageTime: doc.createdAt
    });
  } catch (error) {
    console.error('Error updating conversation:', error);
  }
});

export default mongoose.models.Message || mongoose.model('Message', messageSchema); 