import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Message from '@/models/Message';
import jwt from 'jsonwebtoken';

export async function POST(req) {
  await dbConnect();

  try {
    const { conversationId, message, senderType, recipientId } = await req.json();
    const token = req.headers.get('authorization').split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const newMessage = await Message.create({
      conversationId,
      content: message,
      sender: decoded.userId,
      senderType,
      recipientId
    });

    return NextResponse.json({ message: newMessage });
  } catch (error) {
    console.error('Message creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  await dbConnect();

  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');
    
    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 