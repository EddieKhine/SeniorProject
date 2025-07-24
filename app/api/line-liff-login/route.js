import dbConnect from "@/lib/mongodb";
import User from "@/models/user";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

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
      // Create new user
      user = new User({
        firstName: displayName,
        lastName: "",
        email: `${userId}@line.me`, // LINE does not provide email by default
        profileImage: pictureUrl,
        lineUserId: userId,
        password: "liff", // placeholder, not used
        contactNumber: "",
        role: "customer",
      });
      await user.save();
      console.log("New user created in MongoDB:", user);
    } else {
      console.log("Existing user found in MongoDB:", user);
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Set HTTP-only cookie
    const response = NextResponse.json({ user });
    response.headers.set(
      "Set-Cookie",
      `customerToken=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600; Secure`
    );
    return response;
  } catch (error) {
    console.error("LINE LIFF login error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 