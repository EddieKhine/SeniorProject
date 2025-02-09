import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    // Verify authentication token
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await verifyToken(token);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { restaurantId } = params;
    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID is required' }, { status: 400 });
    }

    // Connect to database
    const { db } = await connectToDatabase();

    // Find the floorplan for the specified restaurant
    const floorplan = await db.collection('floorplans').findOne({
      restaurantId: new ObjectId(restaurantId)
    });

    if (!floorplan) {
      return NextResponse.json({ floorplan: null }, { status: 200 });
    }

    return NextResponse.json({ floorplan }, { status: 200 });

  } catch (error) {
    console.error('Error in floorplan GET route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 