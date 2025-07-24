import dbConnect from "@/lib/mongodb";
import User from "@/models/user";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    console.log("LINE LIFF login endpoint called");
    await dbConnect();
    const body = await req.json();
    console.log("Received LIFF login request body:", body);
    const { userId, displayName, pictureUrl } = body;

    // Check if user exists by LINE userId
    let user = await User.findOne({ lineUserId: userId });
    if (!user) {
      // Create new user compatible with Firebase auth system
      // Use a unique email format for LINE users
      const lineEmail = `line.${userId}@foodloft.local`;
      
      user = new User({
        email: lineEmail,
        firebaseUid: null, // LINE users don't have Firebase UID initially
        firstName: displayName || "LINE User",
        lastName: "",
        profileImage: pictureUrl || "",
        lineUserId: userId,
        contactNumber: "",
        role: "customer",
      });
      await user.save();
      console.log("New LINE user created in MongoDB:", user);
    } else {
      // Update profile info if changed
      let updated = false;
      if (displayName && user.firstName !== displayName) {
        user.firstName = displayName;
        updated = true;
      }
      if (pictureUrl && user.profileImage !== pictureUrl) {
        user.profileImage = pictureUrl;
        updated = true;
      }
      if (updated) {
        await user.save();
        console.log("Updated existing LINE user:", user);
      } else {
        console.log("Existing LINE user found:", user);
      }
    }

    // Prepare user data for response (compatible with new auth system)
    const userData = {
      id: user._id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      contactNumber: user.contactNumber,
      profileImage: user.profileImage,
      lineUserId: user.lineUserId,
      isLineUser: true // Flag to identify LINE users
    };

    // Store user data in localStorage (client-side will handle this)
    // No JWT tokens needed anymore with new auth system
    return NextResponse.json({ 
      message: "LINE login successful", 
      user: userData 
    });
  } catch (error) {
    console.error("LINE LIFF login error:", error);
    return NextResponse.json({ 
      message: "Internal Server Error", 
      error: error.message 
    }, { status: 500 });
  }
} 