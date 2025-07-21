import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/user";

export async function POST(req) {
  try {
    const { firebaseUid, email } = await req.json();

    console.log("🔐 Login API called with:", { firebaseUid, email });

    if (!firebaseUid || !email) {
      return NextResponse.json(
        { message: "firebaseUid and email are required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find user by firebaseUid and email
    const user = await User.findOne({ firebaseUid, email });

    if (!user) {
      console.log("❌ No user found for UID:", firebaseUid);
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    console.log("✅ User found:", user.email);

    // Prepare response
    const userData = {
      id: user._id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      contactNumber: user.contactNumber,
    };

    return NextResponse.json(
      { message: "Login successful", user: userData },
      { status: 200 }
    );
  } catch (error) {
    console.error("🔥 Error in login API:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
