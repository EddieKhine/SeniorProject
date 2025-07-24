import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { headers } from 'next/headers';
import dbConnect from "@/lib/mongodb";
import User from "@/models/user";
import { getAuth } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

// 🚀 GET Request: Fetch User Data
export async function GET(req) {
  try {
    const headersList = headers();
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
      // Firebase user authentication
      try {
        const decoded = await getAuth().verifyIdToken(token);
        user = await User.findOne({ email: decoded.email });
      } catch (firebaseError) {
        console.error('Firebase token verification failed:', firebaseError);
        return NextResponse.json({
          message: "Invalid Firebase token"
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

    if (!user) {
      return NextResponse.json({
        message: "User not found"
      }, {
        status: 404
      });
    }

    return NextResponse.json({
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        contactNumber: user.contactNumber,
        role: user.role,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    console.error('Error in GET /api/customer/profile:', error);
    return NextResponse.json({
      message: "Internal Server Error"
    }, {
      status: 500
    });
  }
}

// 🚀 PUT Request: Update User Profile
export async function PUT(req) {
  try {
    const headersList = headers();
    const authorization = headersList.get('authorization');
    const token = authorization?.split(' ')[1];

    if (!token) {
      return NextResponse.json({
        message: "Unauthorized: No token provided"
      }, {
        status: 401
      });
    }

    const body = await req.json();
    const { email, firstName, lastName, contactNumber, newPassword, profileImage } = body;

    await dbConnect();
    let user;

    // Handle different authentication types
    if (token.startsWith('line.')) {
      // LINE user authentication
      const lineUserId = token.replace('line.', '');
      user = await User.findOne({ lineUserId });
    } else {
      // Firebase user authentication
      const decoded = await getAuth().verifyIdToken(token);
      user = await User.findOne({ email: decoded.email });
    }
    if (!user) {
      return NextResponse.json({
        message: "User not found"
      }, {
        status: 404
      });
    }

    // Update user fields
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (contactNumber !== undefined) user.contactNumber = contactNumber;
    if (profileImage !== undefined) user.profileImage = profileImage;

    // Handle password change if provided
    if (newPassword && newPassword.trim() !== '') {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
    }

    await user.save();

    console.log('PUT - Updated user state:', {
      id: user._id,
      email: user.email,
      profileImage: user.profileImage
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        contactNumber: user.contactNumber,
        role: user.role,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    console.error('Error in PUT /api/customer/profile:', error);
    return NextResponse.json({
      message: "Internal Server Error",
      error: error.message
    }, {
      status: 500
    });
  }
}
  
