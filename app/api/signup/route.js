import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/user";

export async function POST(req) {
  try {
    console.log("📌 [API] Signup request received");

    await dbConnect();
    console.log("✅ [API] Database connected successfully");
    
    const body = await req.json();
    console.log("📥 [API] Request Body:", body);
    const { email, firebaseUid, firstName = '', lastName = '', profileImage = '' } = body;

    // Basic validation
    if (!email || !firebaseUid) {
      console.warn("⚠️ [API] Missing required fields:", { email, firebaseUid });
      return NextResponse.json(
        { message: "Email and firebaseUid are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      // Always overwrite with new info if provided
      let updated = false;
      if (firstName) { user.firstName = firstName; updated = true; }
      if (lastName) { user.lastName = lastName; updated = true; }
      if (profileImage) { user.profileImage = profileImage; updated = true; }
      if (updated) await user.save();
      
      const userData = {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        contactNumber: user.contactNumber,
        profileImage: user.profileImage,
      };
      
      return NextResponse.json(
        { message: "User already exists", user: userData },
        { status: 200 }
      );
    }

    // Create new user profile in MongoDB
    console.log("🆕 [API] Creating new user:", email);
    user = new User({
      email,
      firebaseUid,
      firstName,
      lastName,
      profileImage,
      createdAt: new Date(),
      role: "customer",
    });

    await user.save();
    console.log("✅ [API] New user saved in MongoDB:", user);
    
    const userData = {
      id: user._id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      contactNumber: user.contactNumber,
      profileImage: user.profileImage,
    };

    return NextResponse.json(
      { message: "Profile created successfully", user: userData },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ [API] Error in signup API:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}
