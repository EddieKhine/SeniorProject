import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Floorplan from '@/models/Floorplan';

// POST /api/scenes/[id]/book - Book an item in a scene
export async function POST(request, { params }) {
  try {
    await dbConnect();
    const { itemId, userId } = await request.json();
    const scene = await Floorplan.findById(params.id);
    if (!scene) {
      return NextResponse.json(
        { error: 'Scene not found' },
        { status: 404 }
      );
    }

    // Find and update the specific item
    const item = scene.data.objects.find(obj => 
      obj.userData.component_id === itemId
    );

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // Update booking information
    item.userData.status = 'booked';
    item.userData.booking_info = {
      booked_by: userId || 'anonymous',
      booking_time: new Date()
    };

    scene.markModified('data.objects');
    await scene.save();

    return NextResponse.json(scene);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 