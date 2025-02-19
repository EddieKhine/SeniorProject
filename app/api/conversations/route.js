import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import User from '@/models/user';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

export async function POST(req) {
  await dbConnect();

  try {
    const { restaurantId } = await req.json();
    console.log('Raw restaurantId received:', restaurantId);
    
    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID is required' }, { status: 400 });
    }
    
    const token = req.headers.get('authorization').split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if the request is from a restaurant owner
    const isRestaurantOwner = decoded.role === 'restaurantOwner';
    
    if (isRestaurantOwner) {
      console.log('Finding conversations for restaurant:', restaurantId);
      // Use new keyword with ObjectId
      const conversations = await Conversation.find({ 
        restaurantId: new mongoose.Types.ObjectId(restaurantId) 
      })
      .populate({
        path: 'customerId',
        model: User,
        select: 'firstName lastName email'
      })
      .sort({ updatedAt: -1 });
      
      console.log('Found conversations count:', conversations.length);
      return NextResponse.json({ conversations });
    } else {
      // For customers: get or create single conversation
      const customerId = decoded.userId;
      console.log('Finding/creating conversation for customer:', customerId);
      
      let conversation = await Conversation.findOne({
        customerId: new mongoose.Types.ObjectId(customerId),
        restaurantId: new mongoose.Types.ObjectId(restaurantId)
      });

      if (!conversation) {
        conversation = await Conversation.create({
          customerId: new mongoose.Types.ObjectId(customerId),
          restaurantId: new mongoose.Types.ObjectId(restaurantId)
        });
        console.log('Created new conversation:', conversation._id);
      }

      const messages = await Message.find({ conversationId: conversation._id })
        .sort({ createdAt: 1 });

      return NextResponse.json({ conversation, messages });
    }
  } catch (error) {
    console.error('Conversation API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req, { params }) {
    await dbConnect();
  
    try {
      const { id } = params;
      const token = req.headers.get('authorization').split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
      const messages = await Message.find({ conversationId: id })
        .sort({ createdAt: 1 });
  
      return NextResponse.json({ messages });
    } catch (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }