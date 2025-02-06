import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const { email, firstName, lastName, password, contactNumber } = await req.json();

    // Basic validation
    if (!email || !firstName || !lastName || !password || !contactNumber) {
      return new Response(JSON.stringify({ message: "All fields are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create the MongoDB client instance
    const client = new MongoClient(process.env.MONGODB_URI);

    // Connect to MongoDB
    await client.connect();

    const db = client.db("cluster0"); // Replace with your database name
    const usersCollection = db.collection("users");

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return new Response(JSON.stringify({ message: "Email already exists" }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user to database
    const newUser = {
      email,
      firstName,
      lastName,
      password: hashedPassword,
      contactNumber,
      createdAt: new Date(),
      role: "customer",
    };

    const result = await usersCollection.insertOne(newUser);

    // Close the MongoDB connection
    await client.close();

    return new Response(JSON.stringify({ message: "Signup successful", userId: result.insertedId }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in signup API:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
