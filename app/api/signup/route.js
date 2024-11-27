import dbConnect from "@/lib/mongodb"; // Make sure to implement MongoDB connection
import User from "@/models/user"; // User model for MongoDB
import bcrypt from 'bcryptjs';

export async function POST(req) {
  await dbConnect();

  const { email, name, password, contactNumber } = await req.json();

  // Validate required fields
  if (!email || !name || !password || !contactNumber) {
    return new Response(
      JSON.stringify({ message: "All fields are required." }),
      { status: 400 }
    );
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { name }] });
    if (existingUser) {
      return new Response(
        JSON.stringify({ message: "Email or username already taken." }),
        { status: 400 }
      );
    }

    // Hash the password using bcryptjs
    const salt = await bcrypt.genSalt(10); // Generate a salt with a strength of 10
    const hashedPassword = await bcrypt.hash(password, salt); // Hash the password with the salt

    // Create new user
    const newUser = new User({
      email,
      name,
      password: hashedPassword, // Save the hashed password
      contactNumber
    });

    // Save the user to the database
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
