import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TableLock from '@/models/TableLock';
import Booking from '@/models/Booking';

export async function POST(request) {
    try {
        await dbConnect();
        
        const {
            restaurantId,
            tableId,
            date,
            startTime,
            endTime,
            excludeLockId = null // Optional: exclude a specific lock from conflict check
        } = await request.json();

        // Validate required fields
        if (!restaurantId || !tableId || !date || !startTime || !endTime) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);

        // Check for existing bookings
        const existingBookings = await Booking.find({
            restaurantId,
            tableId,
            date: checkDate,
            startTime,
            endTime,
            status: { $in: ['pending', 'confirmed'] }
        }).select('_id status customerName customerEmail startTime endTime version');

        // Check for active locks
        const activeLocks = await TableLock.find({
            restaurantId,
            tableId,
            date: checkDate,
            startTime,
            endTime,
            status: 'active',
            expiresAt: { $gt: new Date() },
            ...(excludeLockId && { lockId: { $ne: excludeLockId } })
        }).select('_id lockId status expiresAt userId lockedAt');

        // Check for overlapping time slots
        const overlappingBookings = await Booking.find({
            restaurantId,
            tableId,
            date: checkDate,
            status: { $in: ['pending', 'confirmed'] },
            $or: [
                // Booking starts during requested time
                {
                    startTime: { $lt: endTime },
                    endTime: { $gt: startTime }
                }
            ]
        }).select('_id status customerName startTime endTime version');

        const overlappingLocks = await TableLock.find({
            restaurantId,
            tableId,
            date: checkDate,
            status: 'active',
            expiresAt: { $gt: new Date() },
            ...(excludeLockId && { lockId: { $ne: excludeLockId } }),
            $or: [
                // Lock starts during requested time
                {
                    startTime: { $lt: endTime },
                    endTime: { $gt: startTime }
                }
            ]
        }).select('_id lockId status expiresAt userId lockedAt startTime endTime');

        // Analyze conflicts
        const conflicts = {
            exactMatch: {
                bookings: existingBookings,
                locks: activeLocks,
                hasConflicts: existingBookings.length > 0 || activeLocks.length > 0
            },
            overlapping: {
                bookings: overlappingBookings,
                locks: overlappingLocks,
                hasConflicts: overlappingBookings.length > 0 || overlappingLocks.length > 0
            },
            summary: {
                totalConflicts: existingBookings.length + activeLocks.length + overlappingBookings.length + overlappingLocks.length,
                isAvailable: existingBookings.length === 0 && activeLocks.length === 0 && overlappingBookings.length === 0 && overlappingLocks.length === 0
            }
        };

        // Calculate availability score (0-100)
        let availabilityScore = 100;
        if (conflicts.exactMatch.hasConflicts) {
            availabilityScore -= 50; // Major conflict
        }
        if (conflicts.overlapping.hasConflicts) {
            availabilityScore -= 30; // Moderate conflict
        }

        // Add time-based availability info
        const now = new Date();
        const requestDate = new Date(date);
        const isPastDate = requestDate < now.setHours(0, 0, 0, 0);
        
        if (isPastDate) {
            availabilityScore = 0;
            conflicts.summary.isAvailable = false;
        }

        return NextResponse.json({
            success: true,
            availability: {
                isAvailable: conflicts.summary.isAvailable,
                score: Math.max(0, availabilityScore),
                conflicts: conflicts,
                checkedAt: new Date(),
                requestDetails: {
                    restaurantId,
                    tableId,
                    date: checkDate,
                    startTime,
                    endTime
                }
            }
        });

    } catch (error) {
        console.error('Error checking conflicts:', error);
        return NextResponse.json(
            { error: 'Failed to check for conflicts' },
            { status: 500 }
        );
    }
}

// GET endpoint for quick availability check
export async function GET(request) {
    try {
        await dbConnect();
        
        const { searchParams } = new URL(request.url);
        const restaurantId = searchParams.get('restaurantId');
        const tableId = searchParams.get('tableId');
        const date = searchParams.get('date');
        const startTime = searchParams.get('startTime');
        const endTime = searchParams.get('endTime');

        // Validate required fields
        if (!restaurantId || !tableId || !date || !startTime || !endTime) {
            return NextResponse.json(
                { error: 'Missing required query parameters' },
                { status: 400 }
            );
        }

        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);

        // Quick check for exact matches only
        const [bookingCount, lockCount] = await Promise.all([
            Booking.countDocuments({
                restaurantId,
                tableId,
                date: checkDate,
                startTime,
                endTime,
                status: { $in: ['pending', 'confirmed'] }
            }),
            TableLock.countDocuments({
                restaurantId,
                tableId,
                date: checkDate,
                startTime,
                endTime,
                status: 'active',
                expiresAt: { $gt: new Date() }
            })
        ]);

        const isAvailable = bookingCount === 0 && lockCount === 0;

        return NextResponse.json({
            isAvailable,
            conflicts: bookingCount + lockCount,
            checkedAt: new Date()
        });

    } catch (error) {
        console.error('Error in quick availability check:', error);
        return NextResponse.json(
            { error: 'Failed to check availability' },
            { status: 500 }
        );
    }
}
