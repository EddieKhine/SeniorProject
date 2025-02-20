import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Booking from '@/models/Booking';
import Restaurant from '@/models/Restaurants';
import jwt from 'jsonwebtoken';

export async function PATCH(request, { params }) {
  try {
    await dbConnect();
    const bookingId = params.id;
    const { status } = await request.json();

    // Verify token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      console.error('Token verification error:', error);
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    if (!decoded.isRestaurantOwner) {
      return NextResponse.json(
        { error: 'Unauthorized - Restaurant owner access required' },
        { status: 401 }
      );
    }

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Verify restaurant ownership
    const restaurant = await Restaurant.findOne({
      _id: booking.restaurantId,
      ownerId: decoded.userId
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Unauthorized - Not the owner of this restaurant' },
        { status: 403 }
      );
    }

    // Add to history before updating status
    booking.addToHistory('status_updated', {
      previousStatus: booking.status,
      newStatus: status,
      updatedAt: new Date(),
      updatedBy: decoded.userId
    });

    booking.status = status;
    await booking.save();

    return NextResponse.json({
      booking,
      message: `Booking status updated to ${status} successfully`
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    return NextResponse.json(
      { error: 'Failed to update booking status' },
      { status: 500 }
    );
  }
} 