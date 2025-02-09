import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Floorplan from '@/models/Floorplan';

// GET /api/scenes/[id] - Get specific scene
export async function GET(request, context) {
  const { params } = await context; // Await the context to get params
  console.log("API route hit for fetching floorplan with ID:", params.id);
  await dbConnect();
  console.log("Received ID for fetching:", params.id);
  console.log("Fetching floorplan with ID:", params.id);  // Log the ID being queried

  try {
    // Add ID validation
    if (!params.id || !params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }
    
    const scene = await Floorplan.findById(params.id);
    
    if (!scene) {
      console.log("No floorplan found for ID:", params.id);  // Log if not found
      return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
    }
    
    return NextResponse.json(scene);
  } catch (error) {
    console.error("Error fetching floorplan:", error);  // Log any server errors
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/scenes/[id] - Update scene
export async function PUT(request, context) {
  const { params } = await context; // Await the context to get params
  try {
    await dbConnect();
    const data = await request.json();
    
    const updatedScene = await Floorplan.findByIdAndUpdate(
      params.id,
      {
        $set: {
          name: data.name,
          'data.objects': data.data.objects,
          'data.version': data.data.version || 1,
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    if (!updatedScene) {
      return NextResponse.json(
        { error: 'Scene not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedScene);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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