import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/user"; // Assuming you have a User model

export async function POST(req) {
  try {
    await dbConnect(); // Use the shared database connection

    const { email, firstName, lastName, password, contactNumber } = await req.json();

    // Basic validation
    if (!email || !firstName || !lastName || !password || !contactNumber) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: "Email already exists" },
        { status: 409 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user using Mongoose model
    const newUser = new User({
      email,
      firstName,
      lastName,
      password: hashedPassword,
      contactNumber,
      createdAt: new Date(),
      role: "customer",
    });

    await newUser.save();

    return NextResponse.json(
      { message: "Signup successful", userId: newUser._id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in signup API:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
