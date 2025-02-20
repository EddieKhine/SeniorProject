import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import RestaurantOwner from "@/models/restaurant-owner";
import Restaurant from "@/models/Restaurants";

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    await dbConnect();

    const owner = await RestaurantOwner.findOne({ email });
    if (!owner) {
      return NextResponse.json({ error: "Restaurant owner not found" }, { status: 404 });
    }

    const isPasswordMatch = await bcrypt.compare(password, owner.password);
    if (!isPasswordMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Check if owner has any restaurants
    const restaurant = await Restaurant.findOne({ ownerId: owner._id });
    const hasRestaurant = !!restaurant;

    const token = jwt.sign(
      { 
        userId: owner._id, 
        email: owner.email,
        isRestaurantOwner: true,
        role: "restaurantOwner",
        hasRestaurant 
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    return NextResponse.json({
      message: "Login successful",
      token,
      user: {
        userId: owner._id,
        email: owner.email,
        firstName: owner.firstName,
        lastName: owner.lastName,
        role: "restaurantOwner",
        isRestaurantOwner: true,
        subscriptionPlan: owner.subscriptionPlan || "Basic",
        hasRestaurant
      },
    }, { status: 200 });

  } catch (error) {
    console.error("Error in restaurant owner login API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
