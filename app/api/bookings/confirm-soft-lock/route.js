import { NextResponse } from 'next/server';
import dbConnect, { startSession } from '@/lib/mongodb';
import TableLock from '@/models/TableLock';
import Booking from '@/models/Booking';
import { verifyFirebaseAuth } from '@/lib/firebase-admin';
import User from '@/models/user';
import Restaurant from '@/models/Restaurants';

export async function POST(request) {
    try {
        await dbConnect();
        
        const {
            lockId,
            specialRequests = '',
            pricing
        } = await request.json();

        // Validate required fields
        if (!lockId) {
            return NextResponse.json(
                { error: 'Lock ID is required' },
                { status: 400 }
            );
        }

        // Verify authentication
        const authResult = await verifyFirebaseAuth(request);
        if (!authResult.success) {
            return NextResponse.json({ error: authResult.error }, { status: 401 });
        }

        const { firebaseUid } = authResult;

        // Find user by Firebase UID
        const user = await User.findOne({ firebaseUid });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Find the lock
        const tableLock = await TableLock.findOne({ 
            lockId,
            userId: user._id,
            status: 'active'
        });

        if (!tableLock) {
            return NextResponse.json(
                { error: 'Lock not found or expired' },
                { status: 404 }
            );
        }

        // Check if lock is expired
        if (tableLock.isExpired()) {
            tableLock.status = 'expired';
            await tableLock.save();
            
            return NextResponse.json(
                { error: 'Lock has expired' },
                { status: 410 }
            );
        }

        // Check SaaS booking limits before confirming
        const restaurant = await Restaurant.findById(tableLock.restaurantId).populate('subscriptionId');
        if (restaurant && restaurant.subscriptionId) {
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            const monthlyBookings = await Booking.countDocuments({
                restaurantId: tableLock.restaurantId,
                createdAt: {
                    $gte: new Date(currentYear, currentMonth, 1),
                    $lt: new Date(currentYear, currentMonth + 1, 1)
                }
            });
            
            const limit = restaurant.subscriptionId.usage.bookingsLimit;
            
            if (monthlyBookings >= limit && limit !== -1) { // -1 means unlimited
                return NextResponse.json({ 
                    error: 'Monthly booking limit reached',
                    message: `You have reached your monthly limit of ${limit} bookings. Please upgrade your plan to accept more bookings.`,
                    currentPlan: restaurant.subscriptionId.planType,
                    upgradeRequired: true,
                    currentUsage: monthlyBookings,
                    limit: limit
                }, { status: 403 });
            }
        }

        // Start a transaction to ensure atomicity
        const session = await startSession();
        
        try {
            await session.withTransaction(async () => {
                // Double-check for conflicts (race condition protection)
                const existingBooking = await Booking.findOne({
                    restaurantId: tableLock.restaurantId,
                    tableId: tableLock.tableId,
                    date: tableLock.date,
                    startTime: tableLock.startTime,
                    endTime: tableLock.endTime,
                    status: { $in: ['pending', 'confirmed'] }
                }).session(session);

                if (existingBooking) {
                    throw new Error('Table was booked by another user while confirming lock');
                }

                // Create the booking
                const booking = new Booking({
                    restaurantId: tableLock.restaurantId,
                    tableId: tableLock.tableId,
                    userId: tableLock.userId,
                    date: tableLock.date,
                    startTime: tableLock.startTime,
                    endTime: tableLock.endTime,
                    guestCount: tableLock.guestCount,
                    status: 'confirmed',
                    customerName: tableLock.metadata.customerName,
                    customerEmail: tableLock.metadata.customerEmail,
                    customerPhone: tableLock.metadata.customerPhone,
                    specialRequests,
                    pricing: pricing || tableLock.metadata.pricing,
                    lockInfo: {
                        lockId: tableLock.lockId,
                        lockedAt: tableLock.lockedAt,
                        lockExpiresAt: tableLock.expiresAt
                    }
                });

                // Add initial history entry
                booking.addToHistory('created', {
                    tableId: tableLock.tableId,
                    guestCount: tableLock.guestCount,
                    startTime: tableLock.startTime,
                    endTime: tableLock.endTime,
                    fromLock: true,
                    lockId: tableLock.lockId
                });

                await booking.save({ session });

                // Update SaaS usage tracking
                if (restaurant && restaurant.subscriptionId) {
                    await restaurant.subscriptionId.incrementUsage('bookingsThisMonth', 1);
                }

                // Mark lock as confirmed
                tableLock.status = 'confirmed';
                tableLock.confirmedAt = new Date();
                await tableLock.save({ session });
            });

            // Fetch the created booking for response
            const confirmedBooking = await Booking.findOne({
                'lockInfo.lockId': lockId
            }).populate('restaurantId', 'restaurantName');

            return NextResponse.json({
                success: true,
                message: 'Booking confirmed successfully',
                booking: {
                    _id: confirmedBooking._id,
                    bookingRef: confirmedBooking.bookingRef,
                    restaurantId: confirmedBooking.restaurantId._id,
                    restaurantName: confirmedBooking.restaurantId.restaurantName,
                    tableId: confirmedBooking.tableId,
                    date: confirmedBooking.date,
                    startTime: confirmedBooking.startTime,
                    endTime: confirmedBooking.endTime,
                    guestCount: confirmedBooking.guestCount,
                    status: confirmedBooking.status,
                    customerName: confirmedBooking.customerName,
                    customerEmail: confirmedBooking.customerEmail,
                    pricing: confirmedBooking.pricing
                }
            });

        } finally {
            await session.endSession();
        }

    } catch (error) {
        console.error('Error confirming soft lock:', error);
        
        // Handle specific error cases
        if (error.message.includes('Table was booked by another user')) {
            return NextResponse.json(
                { 
                    error: 'Table was booked by another user while confirming your reservation',
                    code: 'CONCURRENT_BOOKING'
                },
                { status: 409 }
            );
        }

        // Handle unique constraint violations
        if (error.code === 11000) {
            return NextResponse.json(
                { 
                    error: 'Table is no longer available',
                    code: 'DOUBLE_BOOKING_PREVENTED'
                },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to confirm booking' },
            { status: 500 }
        );
    }
}
