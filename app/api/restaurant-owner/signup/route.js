import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import RestaurantOwner from "@/models/restaurant-owner";
import Restaurant from "@/models/Restaurants";

export async function POST(req) {
  try {
    console.log("📌 [API] Restaurant Owner Signup request received");

    await dbConnect();
    console.log("✅ [API] Database connected successfully");
    
    const body = await req.json();
    console.log("📥 [API] Request Body:", body);

    const { email, firebaseUid, firstName = '', lastName = '', profileImage = '', contactNumber = '' } = body;

    // Basic validation
    if (!email || !firebaseUid) {
      console.warn("⚠️ [API] Missing required fields:", { email, firebaseUid });
      return NextResponse.json(
        { message: "Email and firebaseUid are required" },
        { status: 400 }
      );
    }

    // Check if restaurant owner already exists by firebaseUid first
    let owner = await RestaurantOwner.findOne({ firebaseUid });
    
    if (!owner) {
      // Check if owner exists by email (for existing owners before Firebase migration)
      owner = await RestaurantOwner.findOne({ email });
      if (owner) {
        console.log("🔄 [API] Found existing restaurant owner by email, updating with Firebase UID");
        // Update existing owner with Firebase UID
        owner.firebaseUid = firebaseUid;
      }
    }
    
    if (owner) {
      // Always overwrite with new info if provided
      let updated = false;
      if (firstName) { owner.firstName = firstName; updated = true; }
      if (lastName) { owner.lastName = lastName; updated = true; }
      if (profileImage) { owner.profileImage = profileImage; updated = true; }
      if (!owner.firebaseUid) { owner.firebaseUid = firebaseUid; updated = true; }
      
      if (updated) {
        await owner.save();
        console.log("✅ [API] Restaurant owner updated with Firebase UID:", owner.firebaseUid);
      }

      // Check if owner has any restaurants
      const restaurant = await Restaurant.findOne({ ownerId: owner._id });
      const hasRestaurant = !!restaurant;
      
      const ownerData = {
        userId: owner._id,
        email: owner.email,
        firstName: owner.firstName,
        lastName: owner.lastName,
        role: "restaurantOwner",
        isRestaurantOwner: true,
        subscriptionPlan: owner.subscriptionPlan || "Basic",
        hasRestaurant,
        profileImage: owner.profileImage
      };
      
      return NextResponse.json(
        { message: "Restaurant owner found and updated", user: ownerData },
        { status: 200 }
      );
    }

    // Create new restaurant owner profile in MongoDB
    console.log("🆕 [API] Creating new restaurant owner:", email);
    owner = new RestaurantOwner({
      email,
      firebaseUid,
      firstName,
      lastName,
      profileImage,
      contactNumber: contactNumber || "Not provided", // Default contact number
      createdAt: new Date(),
      role: "restaurant-owner",
      subscriptionPlan: "Basic"
    });

    await owner.save();
    console.log("✅ [API] New restaurant owner saved in MongoDB:", owner);
    
    const ownerData = {
      userId: owner._id,
      email: owner.email,
      firstName: owner.firstName,
      lastName: owner.lastName,
      role: "restaurantOwner",
      isRestaurantOwner: true,
      subscriptionPlan: owner.subscriptionPlan,
      hasRestaurant: false,
      profileImage: owner.profileImage
    };

    return NextResponse.json(
      { message: "Restaurant owner profile created successfully", user: ownerData },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ [API] Error in restaurant owner signup API:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}
