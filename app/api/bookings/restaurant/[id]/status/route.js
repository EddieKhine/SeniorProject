import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Booking from '@/models/Booking';
import Restaurant from '@/models/Restaurants';
import jwt from 'jsonwebtoken';
import { sendBookingStatusNotification } from '@/lib/email/bookingNotifications';

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
      return NextResponse.json(
        { error: 'Invalid or expired token' },
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

    // Check if status is actually changing
    if (booking.status === status) {
      return NextResponse.json({ 
        message: 'Booking status is already up to date',
        booking: {
          _id: booking._id,
          status: booking.status,
          updatedAt: booking.updatedAt
        }
      });
    }

    // Store the previous status for history
    const previousStatus = booking.status;

    // Add to history only if status is actually changing
    booking.addToHistory('modified', {
      previousStatus: previousStatus,
      newStatus: status,
      updatedBy: 'restaurant_owner',
      updatedAt: new Date()
    });

    booking.status = status;
    await booking.save();

    // 🚀 Send email notification for status changes
    try {
      const emailData = {
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        restaurantName: restaurant.restaurantName,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        guestCount: booking.guestCount,
        tableId: booking.tableId,
        bookingRef: booking.bookingRef,
        createdAt: booking.createdAt
      };

      console.log('📧 Sending email notification to:', booking.customerEmail);
      console.log('📧 Email data:', emailData);

      // Send email notification (don't wait for it to complete to avoid blocking the API response)
      sendBookingStatusNotification(emailData, status, previousStatus)
        .then(result => {
          if (result.success) {
            console.log('✅ Email notification sent successfully:', result.messageId || result.message);
          } else {
            console.error('❌ Email notification failed:', result.error);
          }
        })
        .catch(error => {
          console.error('❌ Email notification error:', error);
        });
    } catch (emailError) {
      console.error('❌ Email preparation failed:', emailError);
      // Continue with booking update even if email fails
    }

    return NextResponse.json({ 
      message: 'Booking status updated successfully',
      booking: {
        _id: booking._id,
        status: booking.status,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update booking status' },
      { status: 500 }
    );
  }
}
