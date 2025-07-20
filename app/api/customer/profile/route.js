import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { headers } from 'next/headers';
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import User from "@/models/user";

// 🚀 GET Request: Fetch User Data
export async function GET(req) {
  try {
    const headersList = await headers();
    const token = headersList.get('authorization')?.split(' ')[1];
    
    if (!token) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await dbConnect();

    const user = await User.findOne({ email: decoded.email }).select('-password');
    console.log('GET - Current user state:', {
      id: user?._id,
      email: user?.email,
      profileImage: user?.profileImage
    });

    return new Response(JSON.stringify({ user }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// 🚀 PUT Request: Update User Information
export async function PUT(req) {
  try {
    const headersList = await headers();
    const token = headersList.get('authorization')?.split(' ')[1];
    
    if (!token) {
      console.log('No token provided in profile update');
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const body = await req.json();
    const { email, firstName, lastName, contactNumber, newPassword, profileImage } = body;

    await dbConnect();

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
      { email: decoded.email },
      { $set: updateDoc }
    );

    console.log('MongoDB update result:', result);

    // Fetch updated document
    const updatedUser = await collection.findOne(
      { email: decoded.email },
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

    return new Response(JSON.stringify({
      message: "Profile updated successfully!",
      user: userResponse
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error updating profile:", error);
    return new Response(JSON.stringify({ 
      message: "Internal Server Error",
      error: error.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
  
