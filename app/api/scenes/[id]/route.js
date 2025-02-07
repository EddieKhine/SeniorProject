import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Floorplan from '@/models/Floorplan';

// GET /api/scenes/[id] - Get specific scene
export async function GET(request, { params }) {
  try {
    await dbConnect();
    const scene = await Floorplan.findById(params.id);
    
    if (!scene) {
      return NextResponse.json(
        { error: 'Scene not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(scene);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/scenes/[id] - Update scene
export async function PUT(request, { params }) {
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
export async function DELETE(request, { params }) {
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