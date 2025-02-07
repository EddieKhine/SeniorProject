import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Floorplan from '@/models/Floorplan';
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
    
    // Debug: Log headers
    console.log('Auth header:', request.headers.get("authorization"));
    
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      console.log('No authorization header found');
      return NextResponse.json({ error: "Unauthorized - No token provided" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      console.log('Token extraction failed');
      return NextResponse.json({ error: "Unauthorized - Invalid token format" }, { status: 401 });
    }

    // Debug: Log token (first few characters)
    console.log('Token (first 10 chars):', token.substring(0, 10));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded token:', decoded);
      const ownerId = decoded.userId;

      if (!ownerId) {
        console.log('No userId in decoded token');
        return NextResponse.json({ error: "Unauthorized - Invalid token payload" }, { status: 401 });
      }

      const data = await request.json();
      console.log('Request data:', {
        name: data.name,
        restaurantId: data.restaurantId,
        hasObjects: !!data.data?.objects
      });

      // Validate required fields
      if (!data.name || !data.data || !data.data.objects || !data.restaurantId) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      // Create new floorplan
      const floorplan = new Floorplan({
        name: data.name,
        restaurantId: data.restaurantId,
        ownerId: ownerId, // Add owner reference
        data: {
          objects: data.data.objects,
          version: data.data.version || 1
        }
      });

      await floorplan.save();

      return NextResponse.json({
        message: "Floorplan saved successfully",
        floorplan,
        token: jwt.sign(
          { 
            floorplanId: floorplan._id,
            restaurantId: data.restaurantId,
            ownerId 
          },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        )
      });

    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return NextResponse.json({ 
        error: "Unauthorized - Token verification failed",
        details: process.env.NODE_ENV === 'development' ? jwtError.message : undefined
      }, { status: 401 });
    }

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
} 