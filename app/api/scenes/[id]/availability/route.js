import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Booking from '@/models/Booking';
import Floorplan from '@/models/Floorplan';

export async function POST(request, { params }) {
  try {
    await dbConnect();
    const { date, startTime, endTime } = await request.json();
    const floorplanId = params.id;

    console.log('1. Input received:', { date, startTime, endTime, floorplanId });

    // Get tables from floorplan
    const floorplan = await Floorplan.findById(floorplanId);
    console.log('1a. Found floorplan:', floorplan ? 'yes' : 'no');
    
    if (!floorplan) {
      return NextResponse.json({ error: 'Floorplan not found' }, { status: 404 });
    }

    console.log('1b. Floorplan data:', {
      id: floorplan._id,
      objectCount: floorplan.data?.objects?.length || 0
    });

    // Get all tables from floorplan with their IDs
    const tables = floorplan.data.objects.filter(obj => {
      // Check if it's a furniture type and has userData
      if (obj.type !== 'furniture' || !obj.userData) return false;

      // Convert userData to plain object if it's a Map
      const userData = obj.userData instanceof Map ? 
        Object.fromEntries(obj.userData) : 
        (typeof obj.userData === 'object' ? obj.userData : {});

      const isTable = userData.isTable === true;

      console.log('Table check:', {
        id: obj.objectId,
        type: obj.type,
        isTable: isTable,
        userData: userData
      });

      return isTable;
    });

    console.log('2. Found tables:', tables.map(t => ({
      id: t.objectId,
      type: t.type,
      userData: t.userData instanceof Map ? 
        Object.fromEntries(t.userData) : 
        t.userData
    })));

    // Extract table IDs (these will be like "t1", "t2", etc.)
    const tableIds = tables.map(obj => obj.objectId);
    console.log('2a. All table IDs found:', tableIds);

    if (!tableIds || tableIds.length === 0) {
      return NextResponse.json({ 
        availableTables: [],
        debug: {
          totalTables: 0,
          bookingsFound: 0,
          availableCount: 0,
          message: 'No tables found in floorplan'
        }
      });
    }

    try {
      // Find bookings for the given date
      const bookingDate = new Date(date);
      bookingDate.setUTCHours(0, 0, 0, 0);

      console.log('3. Searching for bookings with:', {
        floorplanId,
        tableIds,
        date: bookingDate,
        status: ['pending', 'confirmed']
      });

      const bookings = await Booking.find({
        floorplanId: floorplanId,
        tableId: { $in: tableIds },
        date: bookingDate,
        status: { $in: ['pending', 'confirmed'] }
      });

      console.log('3a. Found bookings:', bookings.map(b => ({
        id: b._id,
        tableId: b.tableId,
        time: `${b.startTime} - ${b.endTime}`,
        status: b.status
      })));

      // If no bookings found, all tables are available
      if (!bookings || bookings.length === 0) {
        console.log('4. No bookings found, all tables available');
        return NextResponse.json({ 
          availableTables: [],
          debug: {
            totalTables: tableIds.length,
            bookingsFound: 0,
            availableCount: tableIds.length,
            message: 'No bookings found, all tables available'
          }
        });
      }

      // Check for time overlap
      const bookedTableIds = bookings.filter(booking => {
        // Convert booking times to comparable format (minutes since midnight)
        const bookingStart = timeToMinutes(booking.startTime);
        const bookingEnd = timeToMinutes(booking.endTime);
        const requestStart = timeToMinutes(startTime);
        const requestEnd = timeToMinutes(endTime);

        const hasOverlap = bookingStart < requestEnd && bookingEnd > requestStart;
        
        console.log('Time overlap check:', {
          tableId: booking.tableId,
          bookingTime: `${booking.startTime} - ${booking.endTime}`,
          requestTime: `${startTime} - ${endTime}`,
          bookingMinutes: `${bookingStart} - ${bookingEnd}`,
          requestMinutes: `${requestStart} - ${requestEnd}`,
          hasOverlap
        });

        return hasOverlap;
      }).map(booking => booking.tableId);

      console.log('4. Booked table IDs:', bookedTableIds);

      // If no overlapping bookings found, all tables are available
      if (bookedTableIds.length === 0) {
        return NextResponse.json({ 
          availableTables: [],
          debug: {
            totalTables: tableIds.length,
            bookingsFound: bookings.length,
            availableCount: tableIds.length,
            message: 'No overlapping bookings, all tables available'
          }
        });
      }

      // Get available tables by filtering out booked ones
      const availableTables = tableIds.filter(tableId => !bookedTableIds.includes(tableId));
      console.log('5. Final available tables:', availableTables);

      return NextResponse.json({ 
        availableTables,
        debug: {
          totalTables: tableIds.length,
          bookingsFound: bookings.length,
          availableCount: availableTables.length,
          bookedTables: bookedTableIds,
          message: 'Some tables are booked'
        }
      });

    } catch (bookingError) {
      console.error('Error checking bookings:', bookingError);
      return NextResponse.json({ 
        availableTables: [],
        debug: {
          totalTables: tableIds.length,
          bookingsFound: 0,
          availableCount: tableIds.length,
          error: bookingError.message,
          message: 'Error checking bookings, assuming all tables available'
        }
      });
    }

  } catch (error) {
    console.error('Error in availability check:', error);
    return NextResponse.json({ 
      availableTables: [],
      debug: {
        totalTables: 0,
        bookingsFound: 0,
        availableCount: 0,
        error: error.message,
        message: 'Error in availability check, assuming all tables available'
      }
    });
  }
}

// Helper function to convert time string to minutes since midnight
function timeToMinutes(timeStr) {
  const [time, period] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  
  // Convert to 24-hour format
  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }
  
  return hours * 60 + minutes;
}