import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Floorplan from '@/models/Floorplan';
import Booking from '@/models/Booking';
import Restaurant from '@/models/Restaurants';
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
      time, 
      guestCount, 
      restaurantId,
      customerData
    } = await request.json();
    
    // Get restaurant operating hours
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
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
    const bookingTime = parseTime(time);
    console.log('Booking time:', bookingTime); // Debug log
    
    // Validate time format
    if (!validTimeSlots.includes(bookingTime)) {
      return NextResponse.json({ 
        error: `Invalid time slot. Restaurant is open from ${dayHours.open} to ${dayHours.close}` 
      }, { status: 400 });
    }

    // Get user from token
    const token = request.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Calculate end time (2 hours after start time)
    const startTime = new Date(`2000-01-01T${bookingTime}`);
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 2);
    const endTimeString = endTime.toTimeString().slice(0, 5);

    // Check if table is available for the entire 2-hour slot
    const existingBookings = await Booking.find({
      tableId,
      date,
      $or: [
        {
          time: {
            $gte: bookingTime,
            $lt: endTimeString
          }
        },
        {
          time: bookingTime
        }
      ],
      status: { $in: ['pending', 'confirmed'] }
    });

    if (existingBookings.length > 0) {
      return NextResponse.json({ 
        error: "Table not available for this time slot" 
      }, { status: 400 });
    }

    // Create booking
    const booking = new Booking({
      userId: decoded.userId,
      restaurantId,
      floorplanId: id,
      tableId,
      date: new Date(date),
      time: bookingTime,
      guestCount,
      status: 'confirmed',
      customerName: `${customerData.firstName} ${customerData.lastName}`.trim(),
      customerEmail: customerData.email,
      customerPhone: customerData.contactNumber
    });

    await booking.save();

    // Update table status in floorplan
    const scene = await Floorplan.findById(id);
    const table = scene.data.objects.find(obj => obj.objectId === tableId);
    if (table) {
      table.userData.bookingStatus = 'booked';
      table.userData.currentBooking = booking._id;
      scene.markModified('data.objects');
      await scene.save();
    }

    return NextResponse.json({ 
      message: "Booking confirmed",
      booking 
    });
  } catch (error) {
    console.error('Booking error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 