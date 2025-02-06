import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

// Function to connect to MongoDB
async function connectDB() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  return client;
}

// 🚀 GET Request: Fetch User Data
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return new Response(JSON.stringify({ message: "Email is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const client = await connectDB();
    const db = client.db("cluster0");
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({ email }, { projection: { password: 0 } }); // Exclude password
    await client.close();

    if (!user) {
      return new Response(JSON.stringify({ message: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(user), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// 🚀 PUT Request: Update User Information
export async function PUT(req) {
    try {
      const body = await req.text();
      console.log("Raw request body:", body); // Debugging
  
      const { email, firstName, lastName, contactNumber, newPassword } = JSON.parse(body);
  
      if (!email) {
        return new Response(JSON.stringify({ message: "Email is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
  
      const client = await connectDB();
      const db = client.db("cluster0");
      const usersCollection = db.collection("users");
  
      const user = await usersCollection.findOne({ email });
      if (!user) {
        await client.close();
        return new Response(JSON.stringify({ message: "User not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
  
      // Prepare update object
      let updateFields = { firstName, lastName, contactNumber };
  
      if (newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        updateFields.password = hashedPassword;
      }
  
      await usersCollection.updateOne({ email }, { $set: updateFields });
      await client.close();
  
      return new Response(JSON.stringify({ message: "Profile updated successfully!" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      return new Response(JSON.stringify({ message: "Invalid request format" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
  
