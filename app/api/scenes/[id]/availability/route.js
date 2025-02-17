import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Booking from '@/models/Booking';

export async function POST(request, { params }) {
  try {
    await dbConnect();
    const { tableId, date } = await request.json();

    // Get all bookings for this table on this date
    const existingBookings = await Booking.find({
      tableId,
      date: {
        $gte: new Date(date),
        $lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1))
      }
    });

    // Generate all possible time slots (e.g., every 30 minutes)
    const startHour = 6; // 6 AM
    const endHour = 23; // 11 PM
    const allSlots = [];
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute of [0, 30]) {
        const time = new Date(date);
        time.setHours(hour, minute);
        allSlots.push(
          time.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })
        );
      }
    }

    // Filter out booked slots
    const bookedTimes = existingBookings.map(booking => booking.startTime);
    const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));

    return NextResponse.json({ availableSlots });
    
  } catch (error) {
    console.error('Error checking availability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}