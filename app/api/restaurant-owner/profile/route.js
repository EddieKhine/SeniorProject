import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import RestaurantOwner from '@/models/restaurant-owner';
import jwt from 'jsonwebtoken';

export async function GET(req) {
  await dbConnect();

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const ownerId = decoded.userId;

    // Find the restaurant owner
    const owner = await RestaurantOwner.findById(ownerId).select('-password');
    
    if (!owner) {
      return NextResponse.json({ message: 'Owner not found' }, { status: 404 });
    }

    return NextResponse.json({
      name: `${owner.firstName} ${owner.lastName}`,
      email: owner.email,
      phoneNumber: owner.contactNumber,
      createdAt: owner.createdAt,
      subscriptionPlan: owner.subscriptionPlan
    });

  } catch (error) {
    console.error('Error fetching owner profile:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
} 