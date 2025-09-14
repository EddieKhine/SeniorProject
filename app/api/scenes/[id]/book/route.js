import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect, { startSession } from '@/lib/mongodb';
import Floorplan from '@/models/Floorplan';
import Booking from '@/models/Booking';
import Restaurant from '@/models/Restaurants';
import User from '@/models/user'; // Import the User model
import { verifyFirebaseAuth } from "@/lib/firebase-admin";

// Helper function to ensure user exists in MongoDB
async function ensureUserExists(firebaseUid, email) {
  try {
    // First try to find by firebaseUid
    let user = await User.findOne({ firebaseUid });
    
    if (!user) {
      console.log("User not found by firebaseUid, attempting to create...");
      try {
        // Create new user
        user = await User.create({
          firebaseUid,
          email,
          role: 'customer'
        });
        console.log("New user created:", user._id);
      } catch (createError) {
        // If duplicate email error, try to find by email as fallback
        if (createError.code === 11000) {
          console.log("Duplicate key error, finding existing user by email...");
          user = await User.findOne({ email });
          if (user) {
            // Update existing user with firebaseUid if missing
            if (!user.firebaseUid) {
              user.firebaseUid = firebaseUid;
              await user.save();
            }
          }
        }
        if (!user) {
          throw createError;
        }
      }
    }
    
    return user;
  } catch (error) {
    console.error("Error in ensureUserExists:", error);
    throw error;
  }
}

// Helper function to generate time slots
function generateTimeSlots(openingTime, closingTime, interval = 30) {
    const slots = [];
    let current = new Date(`2000-01-01T${openingTime}`);
    const end = new Date(`2000-01-01T${closingTime}`);

    while (current <= end) {
        const timeString = current.toTimeString().slice(0, 5);
        slots.push(timeString);
        current.setMinutes(current.getMinutes() + interval);
    }
    return slots;
}

// POST /api/scenes/[id]/book - Book an item in a scene
export async function POST(request, { params }) {
  try {
    await dbConnect();
    const id = await params.id;
    const { 
      tableId, 
      date, 
      startTime,    // Now receiving startTime directly
      endTime,      // Now receiving endTime directly
      guestCount, 
      restaurantId,
      customerData
    } = await request.json();
    
    console.log('Looking for table:', tableId); // Debug log

    // Get restaurant operating hours
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    // Get the scene and find the table
    const scene = await Floorplan.findById(id);
    if (!scene) {
      return NextResponse.json({ error: "Floorplan not found" }, { status: 404 });
    }

    console.log('Scene objects:', scene.data.objects.length); // Debug log

    // Enhanced table lookup with more detailed logging
    const table = scene.data.objects.find(obj => {
      console.log('Checking table:', {
        type: obj.type,
        objectId: obj.objectId,
        friendlyId: obj.userData?.friendlyId,
        isTable: obj.userData?.isTable,
        lookingFor: tableId
      });

      // Match by objectId directly since it matches the friendlyId
      return (obj.type === 'furniture' || obj.type === 'table') && obj.objectId === tableId;
    });

    if (!table) {
      // Log all available tables for debugging
      const availableTables = scene.data.objects
        .filter(obj => obj.type === 'furniture' && obj.objectId?.startsWith('t'))
        .map(obj => ({
          objectId: obj.objectId,
          type: obj.type
        }));
      
      console.log('Available tables:', availableTables);
      
      return NextResponse.json({ 
        error: "Table not found",
        details: {
          searchedId: tableId,
          availableTables
        }
      }, { status: 404 });
    }

    // Initialize userData if it doesn't exist
    if (!table.userData) {
      table.userData = {
        isTable: true,
        friendlyId: table.objectId,
        bookingStatus: 'available',
        currentBooking: null,
        bookingHistory: []
      };
    }

    // Get the day of the week for the booking date
    const bookingDate = new Date(date);
    const dayOfWeek = bookingDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    console.log('Day of week:', dayOfWeek); // Debug log

    // Get operating hours for that day
    const dayHours = restaurant.openingHours[dayOfWeek];
    console.log('Restaurant hours:', dayHours); // Debug log
    
    if (!dayHours || !dayHours.open || !dayHours.close) {
      return NextResponse.json({ 
        error: "Restaurant is closed on this day" 
      }, { status: 400 });
    }

    // Parse the time for comparison
    const parseTime = (timeStr) => {
        const [time, period] = timeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    const openTime = parseTime(dayHours.open);
    const closeTime = parseTime(dayHours.close);
    console.log('Parsed times:', { openTime, closeTime }); // Debug log

    // Generate valid time slots based on restaurant hours
    const validTimeSlots = generateTimeSlots(openTime, closeTime);
    
    // Convert booking time to 24-hour format for comparison
    const bookingTime = parseTime(startTime);
    console.log('Booking time:', bookingTime); // Debug log
    
    // Validate time format
    if (!validTimeSlots.includes(bookingTime)) {
      return NextResponse.json({ 
        error: `Invalid time slot. Restaurant is open from ${dayHours.open} to ${dayHours.close}` 
      }, { status: 400 });
    }

    // Get user from token and fetch their full profile
    let token = request.headers.get("authorization")?.split(" ")[1];
    if (!token) {
        const cookieStore = await cookies();
        token = cookieStore.get('customerToken')?.value;
    }
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let currentUser;

    console.log('Token received:', token ? `${token.substring(0, 20)}...` : 'No token');

    // Handle different authentication types
    if (token.startsWith('line.')) {
      // LINE user authentication
      const lineUserId = token.replace('line.', '');
      console.log('LINE user lookup for:', lineUserId);
      currentUser = await User.findOne({ lineUserId });
    } else {
      // Firebase user authentication
      try {
        const authResult = await verifyFirebaseAuth(request);
        if (!authResult.success) {
          return NextResponse.json({ error: authResult.error }, { status: 401 });
        }

        const { firebaseUid, email } = authResult;
        currentUser = await ensureUserExists(firebaseUid, email);
      } catch (firebaseError) {
        console.error('Firebase token verification failed:', firebaseError);
        return NextResponse.json({ 
          error: "Invalid token", 
          details: "Firebase verification failed" 
        }, { status: 401 });
      }
    }
    if (!currentUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Calculate dynamic pricing for this booking
    let pricingData = null;
    try {
      const { dynamicPricing } = await import('@/utils/dynamicPricing');
      const pricingResult = await dynamicPricing.calculatePrice({
        restaurantId,
        tableId,
        date: new Date(date),
        time: startTime,
        guestCount,
        tableCapacity: guestCount <= 2 ? 2 : guestCount <= 4 ? 4 : 6,
        tableLocation: 'center' // Default, could be enhanced with actual table location
      });

      if (pricingResult.success) {
        pricingData = {
          basePrice: pricingResult.basePrice,
          finalPrice: pricingResult.finalPrice,
          currency: pricingResult.currency,
          factors: {
            demandFactor: pricingResult.breakdown.demandFactor.value,
            temporalFactor: pricingResult.breakdown.temporalFactor.value,
            historicalFactor: pricingResult.breakdown.historicalFactor.value,
            capacityFactor: pricingResult.breakdown.capacityFactor.value,
            holidayFactor: pricingResult.breakdown.holidayFactor.value
          },
          context: {
            occupancyRate: pricingResult.context?.occupancyRate || 0,
            tableCapacity: pricingResult.context?.tableInfo?.capacity || guestCount,
            tableLocation: pricingResult.context?.tableInfo?.location || 'center',
            demandLevel: pricingResult.context?.demandLevel || 'medium',
            holidayName: pricingResult.breakdown?.holidayFactor?.holiday?.name || null
          },
          confidence: pricingResult.confidence,
          calculatedAt: new Date()
        };
      }
    } catch (pricingError) {
      console.error('Dynamic pricing calculation failed:', pricingError);
      // Fallback pricing
      pricingData = {
        basePrice: 100,
        finalPrice: 100,
        currency: 'THB',
        factors: {
          demandFactor: 1.0,
          temporalFactor: 1.0,
          historicalFactor: 1.0,
          capacityFactor: 1.0,
          holidayFactor: 1.0
        },
        context: {
          occupancyRate: 0,
          tableCapacity: guestCount,
          tableLocation: 'center',
          demandLevel: 'medium',
          holidayName: null
        },
        confidence: 0.5,
        calculatedAt: new Date()
      };
    }

    // Start transaction for atomic booking creation
    const session = await startSession();
    
    try {
      await session.withTransaction(async () => {
        // Double-check table availability within transaction
        const isAvailable = await Booking.isTableAvailable(tableId, date, startTime, endTime);
        if (!isAvailable) {
          throw new Error('Table is no longer available for the selected time slot');
        }

        // Create and save booking using the server-fetched user data
        const booking = new Booking({
          userId: currentUser._id,
          restaurantId,
          floorplanId: id,
          tableId: tableId,
          date: new Date(date),
          startTime,
          endTime,
          guestCount,
          status: 'confirmed',
          customerName: `${currentUser.firstName} ${currentUser.lastName || ''}`.trim(),
          customerEmail: currentUser.email,
          customerPhone: currentUser.contactNumber || 'Not provided',
          pricing: pricingData
        });

        // Add initial history entry
        booking.addToHistory('created', {
          tableId,
          guestCount,
          startTime,
          endTime
        });

        await booking.save({ session });

        // Update the floorplan document using MongoDB's $set operator
        await Floorplan.updateOne(
          { _id: id, 'data.objects.objectId': tableId },
          {
            $set: {
              'data.objects.$.userData.bookingStatus': 'booked',
              'data.objects.$.userData.currentBooking': booking._id
            }
          },
          { session }
        );
      });
    } finally {
      await session.endSession();
    }

    // Fetch the created booking for response
    const createdBooking = await Booking.findOne({
      userId: currentUser._id,
      restaurantId,
      tableId,
      date: new Date(date),
      startTime,
      endTime
    }).populate('restaurantId', 'restaurantName');

    return NextResponse.json({ 
      message: "Booking confirmed",
      booking: {
        _id: createdBooking._id,
        bookingRef: createdBooking.bookingRef,
        version: createdBooking.version,
        restaurantId: createdBooking.restaurantId._id,
        restaurantName: createdBooking.restaurantId.restaurantName,
        tableId: createdBooking.tableId,
        date: createdBooking.date,
        startTime: createdBooking.startTime,
        endTime: createdBooking.endTime,
        guestCount: createdBooking.guestCount,
        status: createdBooking.status,
        customerName: createdBooking.customerName,
        customerEmail: createdBooking.customerEmail,
        pricing: createdBooking.pricing
      },
      tableDetails: {
        friendlyId: tableId,
        bookingStatus: 'booked',
        bookingId: createdBooking._id
      }
    });
  } catch (error) {
    console.error('Booking error:', error);
    
    // Handle MongoDB duplicate key errors specifically (unique constraint violations)
    if (error.code === 11000) {
      return NextResponse.json({ 
        error: "This table is already booked for the selected time slot",
        code: "DOUBLE_BOOKING_PREVENTED",
        details: "Unique constraint prevented double booking"
      }, { status: 409 });
    }

    // Handle table availability errors
    if (error.message.includes('Table is no longer available')) {
      return NextResponse.json(
        { 
          error: "Table is no longer available for the selected time slot",
          code: "TABLE_UNAVAILABLE",
          details: error.message
        },
        { status: 409 }
      );
    }

    // Handle transaction errors
    if (error.message.includes('Transaction')) {
      return NextResponse.json(
        { 
          error: "Booking transaction failed",
          code: "TRANSACTION_FAILED",
          details: "Please try again"
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// Helper function to calculate end time
function calculateEndTime(startTime) {
  const [time, period] = startTime.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  let endHours = hours;
  
  if (period === 'PM' && hours !== 12) endHours += 12;
  if (period === 'AM' && hours === 12) endHours = 0;
  
  endHours = (endHours + 2) % 24;
  
  return `${endHours === 0 ? 12 : endHours > 12 ? endHours - 12 : endHours}:${minutes.toString().padStart(2, '0')} ${endHours >= 12 ? 'PM' : 'AM'}`;
} 