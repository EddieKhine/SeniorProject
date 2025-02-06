import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import RestaurantOwner from "@/models/restaurant-owner";

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    // Basic validation
    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 });
    }

    // Connect to the database
    await dbConnect();

    // Find the restaurant owner by email
    const owner = await RestaurantOwner.findOne({ email });
    if (!owner) {
      return NextResponse.json({ message: "Restaurant owner not found" }, { status: 404 });
    }

    // Compare provided password with stored hashed password
    const isPasswordMatch = await bcrypt.compare(password, owner.password);
    if (!isPasswordMatch) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { userId: owner._id, email: owner.email, role: "restaurantOwner" },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    // Response with token and user information
    const responsePayload = {
      message: "Login successful",
      token,
      user: {
        userId: owner._id,
        email: owner.email,
        firstName: owner.firstName,
        lastName: owner.lastName,
        role: "restaurantOwner",
        subscriptionPlan: owner.subscriptionPlan || "Basic", // Default to Basic
      },
    };

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (error) {
    console.error("Error in restaurant owner login API:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
