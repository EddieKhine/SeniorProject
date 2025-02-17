import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Floorplan from '@/models/Floorplan';
import Restaurant from '@/models/Restaurants';
import jwt from 'jsonwebtoken';

// GET /api/scenes - Get all scenes
export async function GET() {
  try {
    await dbConnect();
    const scenes = await Floorplan.find({}).sort({ createdAt: -1 });
    return NextResponse.json(scenes);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/scenes - Create new scene
export async function POST(request) {
  try {
    await dbConnect();
    
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: "Unauthorized - Invalid token format" 
      }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const ownerId = decoded.userId;

      if (!ownerId) {
        return NextResponse.json({ 
          error: "Unauthorized - Invalid token payload" 
        }, { status: 401 });
      }

      const data = await request.json();
      
      // Validate minimum required fields
      if (!data.restaurantId) {
        return NextResponse.json(
          { error: 'Missing restaurant ID' },
          { status: 400 }
        );
      }

      // Create floorplan with minimal required data
      const floorplan = new Floorplan({
        name: data.name || "Restaurant Floor Plan",
        restaurantId: data.restaurantId,
        ownerId: ownerId,
        data: {
          objects: data.data?.objects || [],
          version: data.data?.version || 1
        }
      });

      await floorplan.save();

      // Update restaurant with floorplan ID
      await Restaurant.findByIdAndUpdate(
        data.restaurantId,
        { floorplanId: floorplan._id }
      );

      return NextResponse.json({
        message: "Floorplan created successfully",
        floorplan
      });

    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return NextResponse.json({ 
        error: "Unauthorized - Token verification failed"
      }, { status: 401 });
    }

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ 
      error: "Internal server error"
    }, { status: 500 });
  }
} 