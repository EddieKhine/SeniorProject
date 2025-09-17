import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Restaurant from '@/models/Restaurants';
import Floorplan from '@/models/Floorplan';
import jwt from 'jsonwebtoken';

// GET /api/restaurants/[id]/floorplans - Get all floorplans for a restaurant
export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find restaurant and populate floorplans
    const restaurant = await Restaurant.findById(id).populate('floorplans');
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    // Verify ownership
    if (restaurant.ownerId.toString() !== decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized - Not restaurant owner' }, { status: 403 });
    }

    return NextResponse.json({ 
      floorplans: restaurant.floorplans,
      defaultFloorplanId: restaurant.defaultFloorplanId
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/restaurants/[id]/floorplans - Create a new floorplan for a restaurant
export async function POST(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const data = await request.json();
    
    // Validate required fields
    if (!data.name) {
      return NextResponse.json({ error: 'Floorplan name is required' }, { status: 400 });
    }

    // Find restaurant
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    // Verify ownership
    if (restaurant.ownerId.toString() !== decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized - Not restaurant owner' }, { status: 403 });
    }

    // Check if this is the first floorplan (should be default)
    const isFirstFloorplan = !restaurant.floorplans || restaurant.floorplans.length === 0;

    // Create new floorplan
    const floorplan = new Floorplan({
      name: data.name,
      restaurantId: id,
      isDefault: isFirstFloorplan || data.isDefault || false,
      screenshotUrl: data.screenshotUrl || '',
      data: {
        objects: data.data?.objects || [],
        version: data.data?.version || 1
      }
    });

    await floorplan.save();

    // Add floorplan to restaurant
    await Restaurant.findByIdAndUpdate(id, {
      $push: { floorplans: floorplan._id },
      ...(isFirstFloorplan && { defaultFloorplanId: floorplan._id })
    });

    return NextResponse.json({
      message: "Floorplan created successfully",
      floorplan
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
