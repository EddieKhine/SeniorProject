import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Favorite from "@/models/favorites";
import jwt from "jsonwebtoken";

// GET: Fetch user's favorite restaurants
export async function GET(req) {
  await dbConnect();

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const favorites = await Favorite.find({ userId }).populate('restaurantId');

    // Add null check before accessing _id
    return NextResponse.json({ 
      favorites: favorites.map(fav => fav.restaurantId?._id || null).filter(Boolean)
    });

  } catch (error) {
    console.error("Error fetching favorites:", error);
    return NextResponse.json({ message: "Error fetching favorites" }, { status: 500 });
  }
}

// PUT: Toggle restaurant favorite status
export async function PUT(req) {
  try {
    await dbConnect();
    
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { restaurantId } = await req.json();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Check if the favorite already exists
    const existingFavorite = await Favorite.findOne({ userId, restaurantId });

    if (existingFavorite) {
      // Remove favorite
      await Favorite.deleteOne({ userId, restaurantId });
      return NextResponse.json({
        message: "Restaurant removed from favorites",
        isFavorite: false
      });
    } else {
      // Add favorite
      await Favorite.create({ userId, restaurantId });
      return NextResponse.json({
        message: "Restaurant added to favorites",
        isFavorite: true
      });
    }

  } catch (error) {
    console.error("Error in favorites API:", error);
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
} 