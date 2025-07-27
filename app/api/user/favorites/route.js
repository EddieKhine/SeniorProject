import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Favorite from "@/models/favorites";
import User from "@/models/user";
import { verifyFirebaseAuth } from "@/lib/firebase-admin";

// Helper function to ensure user exists in MongoDB
async function ensureUserExists(firebaseUid, email) {
  try {
    // First try to find by firebaseUid
    let user = await User.findOne({ firebaseUid });
    
    if (!user) {
      console.log("User not found by firebaseUid, attempting to create...");
      try {
        // Create new user
        user = await User.create({
          firebaseUid,
          email,
          role: 'customer'
        });
        console.log("New user created:", user._id);
      } catch (createError) {
        // If duplicate email error, try to find by email as fallback
        if (createError.code === 11000) {
          console.log("Duplicate key error, finding existing user by email...");
          user = await User.findOne({ email });
          if (user) {
            // Update existing user with firebaseUid if missing
            if (!user.firebaseUid) {
              user.firebaseUid = firebaseUid;
              await user.save();
            }
          }
        }
        if (!user) {
          throw createError;
        }
      }
    }
    
    return user;
  } catch (error) {
    console.error("Error in ensureUserExists:", error);
    throw error;
  }
}

// GET: Fetch user's favorite restaurants
export async function GET(req) {
  await dbConnect();

  try {
    // Verify Firebase authentication
    const authResult = await verifyFirebaseAuth(req);
    if (!authResult.success) {
      return NextResponse.json({ message: authResult.error }, { status: 401 });
    }

    const { firebaseUid, email } = authResult;

    // Ensure user exists in MongoDB
    const user = await ensureUserExists(firebaseUid, email);

    const favorites = await Favorite.find({ userId: user._id }).populate('restaurantId');

    // Add null check before accessing _id
    return NextResponse.json({ 
      favorites: favorites.map(fav => fav.restaurantId?._id || null).filter(Boolean)
    });

  } catch (error) {
    console.error("Error in favorites GET API:", error);
    
    // Handle MongoDB duplicate key errors specifically
    if (error.code === 11000) {
      return NextResponse.json({ 
        message: "User account conflict. Please contact support." 
      }, { status: 409 });
    }
    
    return NextResponse.json({ message: "Error fetching favorites" }, { status: 500 });
  }
}

// PUT: Toggle restaurant favorite status
export async function PUT(req) {
  try {
    await dbConnect();
    
    // Verify Firebase authentication
    const authResult = await verifyFirebaseAuth(req);
    if (!authResult.success) {
      return NextResponse.json({ message: authResult.error }, { status: 401 });
    }

    const { firebaseUid, email } = authResult;
    const { restaurantId } = await req.json();

    // Ensure user exists in MongoDB
    const user = await ensureUserExists(firebaseUid, email);

    // Check if the favorite already exists
    const existingFavorite = await Favorite.findOne({ userId: user._id, restaurantId });

    if (existingFavorite) {
      // Remove favorite
      await Favorite.deleteOne({ userId: user._id, restaurantId });
      return NextResponse.json({
        message: "Restaurant removed from favorites",
        isFavorite: false
      });
    } else {
      // Add favorite
      await Favorite.create({ userId: user._id, restaurantId });
      return NextResponse.json({
        message: "Restaurant added to favorites",
        isFavorite: true
      });
    }

  } catch (error) {
    console.error("Error in favorites PUT API:", error);
    
    // Handle MongoDB duplicate key errors specifically
    if (error.code === 11000) {
      return NextResponse.json({ 
        message: "User account conflict. Please contact support." 
      }, { status: 409 });
    }
    
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
} 