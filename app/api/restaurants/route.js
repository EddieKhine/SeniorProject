import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Restaurant from "@/models/Restaurants";
import jwt from "jsonwebtoken";
import RestaurantOwner from "@/models/restaurant-owner"; // Import restaurant owner model


// ✅ POST: Create or update restaurant profile
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
      openingHours
    } = await req.json();

    if (!restaurantName || !cuisineType || !location || !description) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 });
    }

    // Check if restaurant profile already exists
    let restaurant = await Restaurant.findOne({ ownerId });

    if (restaurant) {
      // ✅ Update existing profile
      restaurant.restaurantName = restaurantName;
      restaurant.cuisineType = cuisineType;
      restaurant.location = location;
      restaurant.description = description;
      restaurant.openingHours = openingHours;
    } else {
      // ✅ Create new profile
      restaurant = new Restaurant({
        ownerId,
        restaurantName,
        cuisineType,
        location,
        description,
        openingHours,
      });
    }

    await restaurant.save();

    return NextResponse.json({ message: "Profile saved successfully!", restaurant }, { status: 201 });

  } catch (error) {
    console.error("Error saving restaurant profile:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
