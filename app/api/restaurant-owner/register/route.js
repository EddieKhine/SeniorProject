import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb"; // Use your existing MongoDB connection setup
import RestaurantOwner from "@/models/restaurant-owner";

export async function POST(req) {
  try {
    await dbConnect(); // Ensure database connection

    const { firstName, lastName, email, password, contactNumber} =
      await req.json();

    // Validate input
    if (!firstName || !lastName || !email || !password || !contactNumber ) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    // Check for duplicate email
    const existingOwner = await RestaurantOwner.findOne({ email });
    if (existingOwner) {
      return NextResponse.json(
        { message: "Email already exists" },
        { status: 409 }
      );
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create restaurant owner
    const newOwner = new RestaurantOwner({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      contactNumber,
      subscriptionPlan: "Basic"
    });

    await newOwner.save();

    return NextResponse.json(
      { message: "Registration successful", ownerId: newOwner._id },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Error registering restaurant owner:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
