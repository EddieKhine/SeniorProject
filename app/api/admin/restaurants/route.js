import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Restaurant from '@/models/Restaurants';
import Staff from '@/models/Staff';

// Get all restaurants with filtering and pagination
export async function GET(req) {
  try {
    // Temporarily disable authentication for testing
    // const token = req.headers.get('authorization')?.replace('Bearer ', '');
    // if (!token) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // const jwt = require('jsonwebtoken');
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // if (!decoded.adminId) {
    //   return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    // }

    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const status = searchParams.get('status');
    const cuisine = searchParams.get('cuisine');
    const search = searchParams.get('search');
    
    const skip = (page - 1) * limit;
    
    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (cuisine) filter.cuisineType = cuisine;
    if (search) {
      filter.$or = [
        { restaurantName: { $regex: search, $options: 'i' } },
        { 'location.address': { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Get restaurants with proper population
    const restaurants = await Restaurant.find(filter)
      .populate('ownerId', 'firstName lastName email')
      .populate('subscriptionId', 'planType status price billingCycle usage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Restaurant.countDocuments(filter);

    console.log('Restaurants query successful, found:', restaurants.length);

    // Add staff count to each restaurant
    const restaurantsWithStaffCount = [];
    
    for (const restaurant of restaurants) {
      try {
        const staffCount = await Staff.countDocuments({ 
          restaurantId: restaurant._id, 
          isActive: true 
        });
        
        restaurantsWithStaffCount.push({
          ...restaurant.toObject(),
          staffCount
        });
      } catch (error) {
        console.error(`Error getting staff count for restaurant ${restaurant._id}:`, error);
        restaurantsWithStaffCount.push({
          ...restaurant.toObject(),
          staffCount: 0
        });
      }
    }
    
    console.log('Admin restaurants API - Total restaurants found:', total);
    console.log('Admin restaurants API - Restaurants with staff count:', restaurantsWithStaffCount.length);
    
    return NextResponse.json({
      success: true,
      data: restaurantsWithStaffCount,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch restaurants',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// Create new restaurant
export async function POST(req) {
  try {
    // Verify admin authentication
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded.adminId) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const restaurantData = await req.json();
    
    await dbConnect();
    
    // Check if restaurant already exists
    const existingRestaurant = await Restaurant.findOne({
      restaurantName: restaurantData.restaurantName,
      'location.address': restaurantData.location?.address
    });
    
    if (existingRestaurant) {
      return NextResponse.json(
        { success: false, error: 'Restaurant already exists' },
        { status: 400 }
      );
    }
    
    const restaurant = new Restaurant(restaurantData);
    await restaurant.save();
    
    return NextResponse.json({
      success: true,
      data: restaurant,
      message: 'Restaurant created successfully'
    });
    
  } catch (error) {
    console.error('Error creating restaurant:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create restaurant' },
      { status: 500 }
    );
  }
}
