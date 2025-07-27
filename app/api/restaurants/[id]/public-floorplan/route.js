import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Restaurant from '@/models/Restaurants';
import Floorplan from '@/models/Floorplan';

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    console.log('Fetching restaurant with ID:', id);

    // Fetch restaurant
    const restaurant = await Restaurant.findById(id).lean();
    
    if (!restaurant) {
      console.log('Restaurant not found:', id);
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    console.log('Found restaurant:', {
      id: restaurant._id,
      name: restaurant.restaurantName,
      floorplanId: restaurant.floorplanId
    });

    // Fetch floorplan data if it exists
    let floorplanData = null;
    if (restaurant.floorplanId) {
      const floorplan = await Floorplan.findById(restaurant.floorplanId).lean();
      if (floorplan) {
        console.log('Found floorplan with objects:', floorplan.data.objects.length);
        floorplanData = floorplan.data;
      } else {
        console.warn('Referenced floorplan not found:', restaurant.floorplanId);
      }
    }

    // Prepare the response object - IMPORTANT: Include contactNumber here
    const responseData = {
      _id: restaurant._id,
      floorplanId: restaurant.floorplanId,
      floorplanData: floorplanData,
      restaurantName: restaurant.restaurantName,
      description: restaurant.description,
      location: restaurant.location,
      rating: restaurant.rating,
      openingHours: restaurant.openingHours,
      phone: restaurant.phone,
      cuisine: restaurant.cuisineType,
      images: restaurant.images,
      contactNumber: restaurant.contactNumber,
      createdAt: restaurant.createdAt,
      updatedAt: restaurant.updatedAt
    };

    console.log("DEBUG - API: Response prepared with contact number:", responseData.contactNumber || "NOT SET");
    
    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error('Error in public-floorplan route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
} 