// /app/api/signup/route.js
import dbConnect from "@/lib/mongodb"; // Make sure to implement MongoDB connection
import User from "@/models/user"; // User model for MongoDB

export async function POST(req) {
  await dbConnect();

  const { email, username, password, contactNumber } = await req.json();

  if (!email || !username || !password || !contactNumber) {
    return new Response(
      JSON.stringify({ message: "All fields are required." }),
      { status: 400 }
    );
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return new Response(
        JSON.stringify({ message: "Email or username already taken." }),
        { status: 400 }
      );
    }

    // Create new user
    const newUser = new User({
      email,
      username,
      password, // Remember to hash the password before saving (use bcrypt)
      contactNumber
    });
    await newUser.save();

    return new Response(
      JSON.stringify({ message: "Signup successful!" }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Error during signup:", error);
    return new Response(
      JSON.stringify({ message: "Internal server error." }),
      { status: 500 }
    );
  }
}
