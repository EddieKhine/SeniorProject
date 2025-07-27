import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import Floorplan from '@/models/Floorplan';

async function getExistingFloorplan(floorplanId) {
  try {
    await dbConnect();
    return await Floorplan.findById(floorplanId);
  } catch (error) {
    console.error('Error fetching existing floorplan:', error);
    return null;
  }
}

export async function POST(request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: "Unauthorized - Invalid token format" 
      }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded.userId) {
        return NextResponse.json({ 
          error: "Unauthorized - Invalid token payload" 
        }, { status: 401 });
      }
    } catch (jwtError) {
      return NextResponse.json({ 
        error: "Unauthorized - Token verification failed"
      }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('screenshot');
    const floorplanId = formData.get('floorplanId');
    const isEditing = formData.get('isEditing') === 'true';

    if (!file || !floorplanId) {
      return NextResponse.json({
        error: 'Missing screenshot file or floorplan ID'
      }, { status: 400 });
    }

    // Convert the file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create floorplan screenshots directory if it doesn't exist
    const screenshotsDir = path.join(process.cwd(), 'public', 'images', 'floorplans');
    try {
      await mkdir(screenshotsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, that's okay
    }

    // Generate filename - reuse existing if editing, create new if creating
    let filename;
    if (isEditing) {
      // Check if existing screenshot exists to reuse the same filename
      try {
        const existingFloorplan = await getExistingFloorplan(floorplanId);
        if (existingFloorplan && existingFloorplan.screenshotUrl) {
          // Extract filename from existing URL
          const urlParts = existingFloorplan.screenshotUrl.split('/');
          filename = urlParts[urlParts.length - 1];
        } else {
          // No existing screenshot, create new timestamped one
          const timestamp = Date.now();
          filename = `floorplan_${floorplanId}_${timestamp}.png`;
        }
      } catch (error) {
        console.error('Error checking existing floorplan:', error);
        const timestamp = Date.now();
        filename = `floorplan_${floorplanId}_${timestamp}.png`;
      }
    } else {
      // Creating new floorplan, use timestamp
      const timestamp = Date.now();
      filename = `floorplan_${floorplanId}_${timestamp}.png`;
    }
    
    const filePath = path.join(screenshotsDir, filename);

    // Write the file
    await writeFile(filePath, buffer);

    // Return the URL path
    const imageUrl = `/images/floorplans/${filename}`;

    return NextResponse.json({
      message: 'Screenshot uploaded successfully',
      imageUrl: imageUrl
    });

  } catch (error) {
    console.error('Screenshot upload error:', error);
    return NextResponse.json({
      error: 'Failed to upload screenshot'
    }, { status: 500 });
  }
} 