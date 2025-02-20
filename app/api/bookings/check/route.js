import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Booking from '@/models/Booking';

export async function POST(request) {
    try {
        await dbConnect();
        const { restaurantId, date, startTime, endTime } = await request.json();

        // Find all bookings for this time slot
        const bookings = await Booking.find({
            restaurantId,
            date: new Date(date),
            startTime,
            endTime,
            status: { $in: ['pending', 'confirmed'] }
        });

        // Return the booked table IDs
        return NextResponse.json({
            bookings: bookings.map(booking => ({
                tableId: booking.tableId,
                startTime: booking.startTime,
                endTime: booking.endTime
            }))
        });

    } catch (error) {
        console.error('Error checking bookings:', error);
        return NextResponse.json(
            { error: 'Failed to check bookings' },
            { status: 500 }
        );
    }
} 