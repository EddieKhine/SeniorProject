import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Review from '@/models/Review';
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import Restaurant from '@/models/Restaurants';

// GET: Fetch reviews for a restaurant
export async function GET(req, { params }) {
  try {
    await dbConnect();
    const id = params.id;

    if (!id) {
      return NextResponse.json({ error: "Restaurant ID is required" }, { status: 400 });
    }

    // Connect to the specific database where users are stored
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db('cluster0');
    const usersCollection = db.collection('users');

    const reviews = await Review.find({ restaurantId: id }).sort({ createdAt: -1 });
    
    console.log('Reviews before population:', reviews);
    console.log('Users collection:', await usersCollection.findOne({}));
    
    // Manually populate user information
    const populatedReviews = await Promise.all(reviews.map(async (review) => {
      const user = await usersCollection.findOne({ _id: new ObjectId(review.userId) });
      const reviewObj = review.toObject();
      reviewObj.userId = user;
      return reviewObj;
    }));

    await client.close();
    return NextResponse.json({ reviews: populatedReviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: "Failed to fetch reviews", details: error.message },
      { status: 500 }
    );
  }
}

// POST: Create a new review
export async function POST(req, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Connect to MongoDB directly for user lookup
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db('cluster0');
    const usersCollection = db.collection('users');
    
    const user = await usersCollection.findOne({ 
      _id: new ObjectId(decoded.userId) 
    });

    if (!user) {
      await client.close();
      return NextResponse.json({ 
        error: "User not found",
        details: `No user found with ID: ${decoded.userId}`
      }, { status: 404 });
    }

    const { rating, comment, images } = await req.json();
    
    const review = new Review({
      userId: decoded.userId,
      restaurantId: id,
      rating,
      comment,
      images
    });

    await review.save();
    
    // Instead of using populate, manually construct the response
    const reviewResponse = {
      ...review.toObject(),
      userId: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    };

    // Update restaurant rating
    const allReviews = await Review.find({ restaurantId: id });
    const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = allReviews.length > 0 ? totalRating / allReviews.length : 0;

    await Restaurant.findByIdAndUpdate(id, {
      rating: averageRating,
      totalReviews: allReviews.length
    });

    await client.close();
    return NextResponse.json({ review: reviewResponse }, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error.message 
    }, { status: 500 });
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