import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Review from '@/models/Review';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import Restaurant from '@/models/Restaurants';
import User from '@/models/user';

// GET: Fetch reviews for a restaurant
export async function GET(req, { params }) {
  await dbConnect();
  const { id } = params;

  try {
    const reviews = await Review.find({ 
      restaurantId: new mongoose.Types.ObjectId(id) 
    })
    .populate({
      path: 'userId',
      model: User,
      select: 'firstName lastName profileImage email'
    })
    .sort({ createdAt: -1 });

    // Ensure each review has a valid profile image
    const processedReviews = reviews.map(review => ({
      ...review.toObject(),
      userId: {
        ...review.userId.toObject(),
        profileImage: review.userId.profileImage || '/default-avatar.png'
      },
      // When processing review images, do not attempt to construct S3 URLs. Assume all image URLs are full URLs (Firebase Storage or otherwise).
      images: review.images
    }));

    return NextResponse.json({ reviews: processedReviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create a new review
export async function POST(req, { params }) {
  await dbConnect();
  const { id } = params;

  try {
    const { rating, comment, images } = await req.json();
    const token = req.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const review = await Review.create({
      restaurantId: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(decoded.userId),
      rating,
      comment,
      images: images || [] // Make sure images array is properly formatted
    });

    // Update restaurant rating
    const allReviews = await Review.find({ restaurantId: id });
    const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / allReviews.length;

    await Restaurant.findByIdAndUpdate(id, {
      rating: averageRating,
      totalReviews: allReviews.length
    });

    // Populate user data before sending response
    await review.populate({
      path: 'userId',
      model: User,
      select: 'firstName lastName profileImage'
    });

    return NextResponse.json({ review });
  } catch (error) {
    console.error('Error creating review:', error);
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