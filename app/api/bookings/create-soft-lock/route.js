import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TableLock from '@/models/TableLock';
import Booking from '@/models/Booking';
import { verifyFirebaseAuth } from '@/lib/firebase-admin';
import User from '@/models/user';
import Restaurant from '@/models/Restaurants';

export async function POST(request) {
    try {
        await dbConnect();
        
        const {
            restaurantId,
            tableId,
            date,
            startTime,
            endTime,
            guestCount,
            holdDurationMinutes = 5 // Default 5 minutes hold
        } = await request.json();

        // Validate required fields
        if (!restaurantId || !tableId || !date || !startTime || !endTime || !guestCount) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check SaaS booking limits
        const restaurant = await Restaurant.findById(restaurantId).populate('subscriptionId');
        if (restaurant && restaurant.subscriptionId) {
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            const monthlyBookings = await Booking.countDocuments({
                restaurantId,
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

        const lockDate = new Date(date);
        lockDate.setHours(0, 0, 0, 0);
        const expiresAt = new Date(Date.now() + (holdDurationMinutes * 60 * 1000));

        // Check if table is already booked for this time
        const existingBooking = await Booking.findOne({
            restaurantId,
            tableId,
            date: lockDate,
            startTime,
            endTime,
            status: { $in: ['pending', 'confirmed'] }
        });

        if (existingBooking) {
            return NextResponse.json(
                { 
                    error: 'Table is already booked for this time slot',
                    conflict: {
                        type: 'booking',
                        bookingId: existingBooking._id,
                        status: existingBooking.status
                    }
                },
                { status: 409 }
            );
        }

        // Check if table is already locked
        const existingLock = await TableLock.findActiveLocks(
            restaurantId, 
            tableId, 
            lockDate, 
            startTime, 
            endTime
        );

        if (existingLock.length > 0) {
            return NextResponse.json(
                { 
                    error: 'Table is currently locked by another user',
                    conflict: {
                        type: 'lock',
                        lockId: existingLock[0].lockId,
                        expiresAt: existingLock[0].expiresAt,
                        lockedBy: existingLock[0].userId.toString() === user._id.toString() ? 'self' : 'other'
                    }
                },
                { status: 409 }
            );
        }

        // Create new lock
        const lockId = TableLock.generateLockId();
        const tableLock = new TableLock({
            lockId,
            restaurantId,
            tableId,
            userId: user._id,
            date: lockDate,
            startTime,
            endTime,
            guestCount,
            expiresAt,
            metadata: {
                customerName: `${user.firstName} ${user.lastName || ''}`.trim(),
                customerEmail: user.email,
                customerPhone: user.contactNumber || 'Not provided'
            }
        });

        await tableLock.save();

        return NextResponse.json({
            success: true,
            lock: {
                lockId: tableLock.lockId,
                tableId: tableLock.tableId,
                expiresAt: tableLock.expiresAt,
                holdDurationMinutes,
                status: tableLock.status
            },
            message: `Table locked for ${holdDurationMinutes} minutes`
        });

    } catch (error) {
        console.error('Error creating soft lock:', error);
        
        // Handle unique constraint violations (race conditions)
        if (error.code === 11000) {
            return NextResponse.json(
                { 
                    error: 'Table was locked by another user while processing your request',
                    code: 'CONCURRENT_LOCK'
                },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to create soft lock' },
            { status: 500 }
        );
    }
}
