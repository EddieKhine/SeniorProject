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
    
    // Validate required fields
    if (!restaurantData.restaurantName || !restaurantData.cuisineType || 
        !restaurantData.location || !restaurantData.description) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // Create new restaurant with validated data
    const restaurant = new Restaurant({
      ownerId,
      restaurantName: restaurantData.restaurantName,
      cuisineType: restaurantData.cuisineType,
      location: restaurantData.location,
      description: restaurantData.description,
      openingHours: restaurantData.openingHours || {},
      images: restaurantData.images || { main: "", gallery: [] }
    });

    await restaurant.save();

    // Update owner with restaurant reference
    await RestaurantOwner.findByIdAndUpdate(ownerId, { restaurantId: restaurant._id });

    return NextResponse.json({ message: "Profile created successfully!", restaurant }, { status: 201 });
  } catch (error) {
    console.error("Error creating restaurant profile:", error);
    return NextResponse.json({ 
      message: "Internal server error", 
      error: error.message 
    }, { status: 500 });
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
export async function PUT(request) {
  await dbConnect();

  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const ownerId = decoded.userId;

    // Log for debugging
    console.log('Owner ID:', ownerId);

    const restaurantData = await request.json();
    console.log('Received restaurant data:', restaurantData);

    // Find and update the restaurant
    const restaurant = await Restaurant.findOneAndUpdate(
      { ownerId },
      {
        restaurantName: restaurantData.restaurantName,
        cuisineType: restaurantData.cuisineType,
        location: restaurantData.location,
        description: restaurantData.description,
        openingHours: restaurantData.openingHours,
        images: restaurantData.images
      },
      { new: true }
    );

    if (!restaurant) {
      return NextResponse.json({ message: "Restaurant not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      message: "Profile updated successfully!", 
      restaurant 
    }, { status: 200 });

  } catch (error) {
    console.error("Error updating restaurant profile:", error);
    return NextResponse.json({ 
      message: "Internal server error", 
      error: error.message 
    }, { status: 500 });
  }
}