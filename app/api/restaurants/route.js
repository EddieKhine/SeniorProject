import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Restaurant from "@/models/Restaurants";
import jwt from "jsonwebtoken";
import RestaurantOwner from "@/models/restaurant-owner"; // Import restaurant owner model


// ✅ POST: Create new restaurant profile
export async function POST(req) {
  await dbConnect();

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const ownerId = decoded.userId;

    // Check if owner already has a restaurant
    const existingRestaurant = await Restaurant.findOne({ ownerId });
    if (existingRestaurant) {
      return NextResponse.json({ message: "Restaurant profile already exists" }, { status: 400 });
    }

    const restaurantData = await req.json();
    const restaurant = new Restaurant({
      ownerId,
      ...restaurantData
    });

    await restaurant.save();

    // Update owner with restaurant reference
    await RestaurantOwner.findByIdAndUpdate(ownerId, { restaurantId: restaurant._id });

    return NextResponse.json({ message: "Profile created successfully!", restaurant }, { status: 201 });
  } catch (error) {
    console.error("Error creating restaurant profile:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// ✅ GET: Fetch single restaurant profile
export async function GET(req) {
  await dbConnect();

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const ownerId = decoded.userId;

    // Find single restaurant by owner ID
    const restaurant = await Restaurant.findOne({ ownerId });
    
    if (!restaurant) {
      return NextResponse.json({ message: "No restaurant found", restaurant: null }, { status: 200 });
    }

    return NextResponse.json({ restaurant }, { status: 200 });

  } catch (error) {
    console.error("Error fetching restaurant profile:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// ✅ PUT: Update restaurant profile
export async function PUT(req) {
  await dbConnect();

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const ownerId = decoded.userId;

    // Check if the restaurant owner exists
    const ownerExists = await RestaurantOwner.findById(ownerId);
    if (!ownerExists) {
      return NextResponse.json({ message: "Owner not found" }, { status: 404 });
    }

    const {
      restaurantName,
      cuisineType,
      location,
      description,
      openingHours,
      images
    } = await req.json();

    if (!restaurantName || !cuisineType || !location || !description) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 });
    }

    // Find and update the restaurant profile
    const restaurant = await Restaurant.findOneAndUpdate(
      { ownerId },
      {
        restaurantName,
        cuisineType,
        location,
        description,
        openingHours,
        images
      },
      { new: true } // Returns the updated document
    );

    if (!restaurant) {
      return NextResponse.json({ message: "Restaurant not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Profile updated successfully!", restaurant }, { status: 200 });

  } catch (error) {
    console.error("Error updating restaurant profile:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}