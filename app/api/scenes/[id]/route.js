import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Floorplan from '@/models/Floorplan';
import jwt from 'jsonwebtoken';


// GET /api/scenes/[id] - Get specific scene
export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { id } = params;

    // Get authorization token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the floor plan by ID
    const floorplan = await Floorplan.findById(id);

    if (!floorplan) {
      return NextResponse.json(
        { error: 'Floor plan not found' },
        { status: 404 }
      );
    }

    // Return the raw floorplan data
    return NextResponse.json({
      id: floorplan._id.toString(),
      name: floorplan.name,
      restaurantId: floorplan.restaurantId.toString(),
      data: floorplan.data // This contains the raw objects array with positions, rotations, etc.
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/scenes/[id] - Update scene
export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const { id } = params;

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.data || !data.data.objects || !data.restaurantId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update floorplan
    const updatedFloorplan = await Floorplan.findByIdAndUpdate(
      id,
      {
        name: data.name,
        data: {
          objects: data.data.objects,
          version: data.data.version || 1
        }
      },
      { new: true }
    );

    if (!updatedFloorplan) {
      return NextResponse.json(
        { error: 'Floor plan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Floorplan updated successfully",
      floorplan: updatedFloorplan
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/scenes/[id] - Delete scene
export async function DELETE(request, context) {
  const { params } = await context; // Await the context to get params
  try {
    await dbConnect();
    const deletedScene = await Floorplan.findByIdAndDelete(params.id);
    
    if (!deletedScene) {
      return NextResponse.json(
        { error: 'Scene not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Scene deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 