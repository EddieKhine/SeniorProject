import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { headers } from 'next/headers';
import dbConnect from "@/lib/mongodb";
import User from "@/models/user";
import { adminAuth } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

// Handle preflight requests
export async function OPTIONS(req) {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

// 🚀 GET Request: Fetch User Data
export async function GET(req) {
  try {
    const headersList = await headers();
    const authorization = headersList.get('authorization');
    const token = authorization?.split(' ')[1];

    if (!token) {
      return NextResponse.json({
        message: "Unauthorized: No token provided"
      }, {
        status: 401
      });
    }

    await dbConnect();
    let user;

    // Handle different authentication types
    if (token.startsWith('line.')) {
      // LINE user authentication - extract LINE User ID from token
      const lineUserId = token.replace('line.', '');
      user = await User.findOne({ lineUserId });
      if (!user) {
        return NextResponse.json({
          message: "LINE user not found"
        }, {
          status: 404
        });
      }
    } else {
      // Firebase authentication
      try {
        const decoded = await adminAuth.verifyIdToken(token);
        user = await User.findOne({ firebaseUid: decoded.uid }).select('-password');
        
        if (!user) {
          return NextResponse.json({ 
            message: "User not found" 
          }, {
            status: 404,
            headers: { 
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type, Authorization"
            },
          });
        }
      } catch (firebaseError) {
        console.error("Firebase token verification failed:", firebaseError);
        return NextResponse.json({
          message: "Invalid token"
        }, {
          status: 401
        });
      }
    }

    console.log('GET - Current user state:', {
      id: user?._id,
      email: user?.email,
      profileImage: user?.profileImage
    });

    return NextResponse.json({ 
      user 
    }, {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      },
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({
      message: "Internal Server Error"
    }, {
      status: 500
    });
  }
}

// 🚀 PUT Request: Update User Information
export async function PUT(req) {
  try {
    const headersList = await headers();
    const authorization = headersList.get('authorization');
    const token = authorization?.split(' ')[1];
    
    if (!token) {
      console.log('No token provided in profile update');
      return NextResponse.json({
        message: "Unauthorized"
      }, {
        status: 401
      });
    }

    const body = await req.json();
    const { email, firstName, lastName, contactNumber, newPassword, profileImage } = body;

    await dbConnect();
    let userQuery;

    // Handle different authentication types
    if (token.startsWith('line.')) {
      // LINE user authentication
      const lineUserId = token.replace('line.', '');
      const lineUser = await User.findOne({ lineUserId });
      if (!lineUser) {
        return NextResponse.json({
          message: "LINE user not found"
        }, {
          status: 404
        });
      }
      userQuery = { lineUserId };
    } else {
      // Firebase authentication
      try {
        const decoded = await adminAuth.verifyIdToken(token);
        userQuery = { firebaseUid: decoded.uid };
      } catch (firebaseError) {
        console.error("Firebase token verification failed:", firebaseError);
        return NextResponse.json({
          message: "Invalid token"
        }, {
          status: 401
        });
      }
    }

    // Get the MongoDB collection directly
    const collection = mongoose.connection.collection('users');
    
    // Prepare update document
    const updateDoc = {
      firstName,
      lastName,
      contactNumber,
    };
    if (profileImage) {
      updateDoc.profileImage = profileImage;
    }

    if (newPassword) {
      updateDoc.password = await bcrypt.hash(newPassword, 10);
    }

    console.log('Attempting direct MongoDB update with:', updateDoc);

    // Perform direct MongoDB update
    const result = await collection.updateOne(
      userQuery,
      { $set: updateDoc }
    );

    console.log('MongoDB update result:', result);

    // Fetch updated document
    const updatedUser = await collection.findOne(
      userQuery,
      { projection: { password: 0 } }
    );

    console.log('Updated user from DB:', updatedUser);

    const userResponse = {
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      contactNumber: updatedUser.contactNumber,
      role: updatedUser.role,
      profileImage: updatedUser.profileImage
    };

    return NextResponse.json({
      message: "Profile updated successfully!",
      user: userResponse
    }, {
      status: 200
    });

  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ 
      message: "Internal Server Error",
      error: error.message 
    }, {
      status: 500
    });
  }
}
  
