import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import mongoose from 'mongoose';

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    console.log('Login attempt for email:', email);

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Use direct MongoDB query
    const collection = mongoose.connection.collection('users');
    const user = await collection.findOne({ email });

    console.log('Found user data:', {
      id: user?._id,
      email: user?.email,
      profileImage: user?.profileImage
    });

    if (!user) {
      console.log('No user found for email:', email);
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Compare provided password with stored hashed password
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      console.log('Invalid password for user:', email);
      return NextResponse.json(
        { message: "Invalid password" },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Get the full profile image URL
    const profileImage = user.profileImage 
      ? (user.profileImage.startsWith('http') 
          ? user.profileImage 
          : user.profileImage)
      : null;

    console.log('Processed profile image URL:', profileImage);

    const userData = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      contactNumber: user.contactNumber,
      role: user.role,
      profileImage: user.profileImage
    };

    console.log('Sending user data:', userData);

    return NextResponse.json({
      message: "Login successful",
      token,
      user: userData
    });
  } catch (error) {
    console.error("Error in login API:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
