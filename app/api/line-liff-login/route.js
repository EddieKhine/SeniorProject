import dbConnect from "@/lib/mongodb";
import User from "@/models/user";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    console.log("🔥 LINE LIFF login endpoint called");
    await dbConnect();
    const body = await req.json();
    console.log("📱 LIFF Login Request Details:");
    console.log("   User ID:", body.userId);
    console.log("   Display Name:", body.displayName);
    console.log("   Picture URL:", body.pictureUrl);
    
    console.log("   Full Body:", JSON.stringify(body, null, 2));
    const { userId, displayName, pictureUrl } = body;

    // Check if user exists by LINE userId
    console.log("🔍 Searching for existing user with LINE ID:", userId);
    let user = await User.findOne({ lineUserId: userId });
    
    if (!user) {
      console.log("👤 Creating NEW LINE user...");
      // Create new user compatible with Firebase auth system
      // Use a unique email format for LINE users
      const lineEmail = `line.${userId}@foodloft.local`;
      
      user = new User({
        email: lineEmail,
        // firebaseUid is omitted for LINE users as they don't have Firebase UID
        firstName: displayName || "LINE User",
        lastName: "",
        profileImage: pictureUrl || "",
        lineUserId: userId,
        contactNumber: "",
        role: "customer",
      });
      await user.save();
      console.log("✅ NEW LINE user created successfully!");
      console.log("   Database ID:", user._id);
      console.log("   LINE User ID:", user.lineUserId);
      console.log("   Email:", user.email);
      console.log("   Name:", user.firstName);
    } else {
      console.log("✅ EXISTING LINE user found!");
      console.log("   Database ID:", user._id);
      console.log("   LINE User ID:", user.lineUserId);
      console.log("   Email:", user.email);
      console.log("   Name:", user.firstName);
      
      // Update profile info if changed
      let updated = false;
      if (displayName && user.firstName !== displayName) {
        console.log("   Updating display name:", user.firstName, "→", displayName);
        user.firstName = displayName;
        updated = true;
      }
      if (pictureUrl && user.profileImage !== pictureUrl) {
        console.log("   Updating profile picture");
        user.profileImage = pictureUrl;
        updated = true;
      }
      if (updated) {
        await user.save();
        console.log("   Profile updated successfully!");
      } else {
        console.log("   No profile updates needed");
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

    console.log("🚀 Sending response to LIFF client...");
    console.log("   Response user data:", {
      id: userData.id,
      lineUserId: userData.lineUserId,
      firstName: userData.firstName,
      isLineUser: userData.isLineUser
    });
    
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