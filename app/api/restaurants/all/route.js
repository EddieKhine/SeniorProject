import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Restaurant from "@/models/Restaurants";

export async function GET() {
  await dbConnect();

  try {
    const restaurants = await Restaurant.find({})
      .select('restaurantName cuisineType location description openingHours images')
      .lean();

    return NextResponse.json({ restaurants }, { status: 200 });
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
} 