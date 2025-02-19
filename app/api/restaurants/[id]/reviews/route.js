import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Review from '@/models/Review';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import Restaurant from '@/models/Restaurants';

// GET: Fetch reviews for a restaurant
export async function GET(req, { params }) {
  await dbConnect();
  const { id } = params;

  try {
    const reviews = await Review.find({ 
      restaurantId: new mongoose.Types.ObjectId(id) 
    })
    .populate('userId', 'firstName lastName')
    .sort({ createdAt: -1 });

    return NextResponse.json({ reviews });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create a new review
export async function POST(req, { params }) {
  await dbConnect();
  const { id } = params;

  try {
    const { rating, comment } = await req.json();
    const token = req.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const review = await Review.create({
      restaurantId: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(decoded.userId),
      rating,
      comment
    });

    return NextResponse.json({ review });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Delete a review
export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const id = params.id;
    const { reviewId } = await req.json();
    
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find the review and check ownership
    const review = await Review.findById(reviewId);
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    if (review.userId.toString() !== decoded.userId) {
      return NextResponse.json({ error: "Not authorized to delete this review" }, { status: 403 });
    }

    await Review.findByIdAndDelete(reviewId);

    // Update restaurant rating
    const allReviews = await Review.find({ restaurantId: id });
    const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = allReviews.length > 0 ? totalRating / allReviews.length : 0;

    await Restaurant.findByIdAndUpdate(id, {
      rating: averageRating,
      totalReviews: allReviews.length
    });

    return NextResponse.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 