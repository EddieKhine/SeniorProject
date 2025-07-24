import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import Floorplan from '@/models/Floorplan';
import Booking from '@/models/Booking';
import Restaurant from '@/models/Restaurants';
import User from '@/models/user'; // Import the User model
import jwt from 'jsonwebtoken';

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

    // Get user from token or cookie and fetch their full profile
    let token = request.headers.get("authorization")?.split(" ")[1];
    if (!token) {
        const cookieStore = await cookies();
        token = cookieStore.get('customerToken')?.value;
    }
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch the full user profile from the database to ensure data is up-to-date
    const currentUser = await User.findById(decoded.userId);
    if (!currentUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
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
      customerPhone: currentUser.contactNumber // Use the reliable, server-fetched phone number
    });

    // Add initial history entry
    booking.addToHistory('created', {
      tableId,
      guestCount,
      startTime,
      endTime
    });

    await booking.save();

    // Update the floorplan document using MongoDB's $set operator
    await Floorplan.updateOne(
      { _id: id, 'data.objects.objectId': tableId },
      {
        $set: {
          'data.objects.$.userData.bookingStatus': 'booked',
          'data.objects.$.userData.currentBooking': booking._id
        }
      }
    );

    return NextResponse.json({ 
      message: "Booking confirmed",
      booking,
      tableDetails: {
        friendlyId: tableId,
        bookingStatus: 'booked',
        bookingId: booking._id
      }
    });
  } catch (error) {
    console.error('Booking error:', error);
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