import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Subscription from '@/models/Subscription';
import RestaurantOwner from '@/models/restaurant-owner';
import Restaurant from '@/models/Restaurants';
import Staff from '@/models/Staff';
import Floorplan from '@/models/Floorplan';
import Booking from '@/models/Booking';

export async function GET(req) {
  try {
    await dbConnect();
    
    // Get owner ID from query params or headers
    const { searchParams } = new URL(req.url);
    const ownerId = searchParams.get('ownerId');
    
    if (!ownerId) {
      return NextResponse.json(
        { success: false, error: 'Owner ID is required' },
        { status: 400 }
      );
    }
    
    // Find the owner
    const owner = await RestaurantOwner.findById(ownerId);
    if (!owner) {
      return NextResponse.json(
        { success: false, error: 'Owner not found' },
        { status: 404 }
      );
    }
    
    // Get owner's subscription
    const subscription = await Subscription.findOne({ ownerId }).populate('restaurantId', 'restaurantName');
    
    if (!subscription) {
      return NextResponse.json({
        success: true,
        data: {
          hasSubscription: false,
          message: 'No subscription found. You are on the free plan.'
        }
      });
    }
    
    // Get current usage data
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Get owner's restaurants
    const restaurants = await Restaurant.find({ ownerId });
    const restaurantIds = restaurants.map(r => r._id);
    
    // Calculate current usage
    const [
      totalStaff,
      totalFloorPlans,
      totalTables,
      monthlyBookings
    ] = await Promise.all([
      // Staff count across all restaurants
      Staff.countDocuments({ 
        restaurantId: { $in: restaurantIds }, 
        isActive: true 
      }),
      
      // Floor plans count across all restaurants
      Floorplan.countDocuments({ 
        restaurantId: { $in: restaurantIds } 
      }),
      
      // Tables count (from floorplans)
      Floorplan.aggregate([
        { $match: { restaurantId: { $in: restaurantIds } } },
        { $unwind: '$tables' },
        { $count: 'totalTables' }
      ]).then(result => result[0]?.totalTables || 0),
      
      // Monthly bookings
      Booking.countDocuments({
        restaurantId: { $in: restaurantIds },
        createdAt: {
          $gte: new Date(currentYear, currentMonth, 1),
          $lt: new Date(currentYear, currentMonth + 1, 1)
        }
      })
    ]);
    
    // Calculate usage percentages
    const calculatePercentage = (used, limit) => {
      if (limit === -1) return 0; // Unlimited
      return Math.min((used / limit) * 100, 100);
    };
    
    const usageData = {
      restaurants: {
        used: restaurants.length,
        limit: subscription.usage.restaurantsLimit,
        percentage: calculatePercentage(restaurants.length, subscription.usage.restaurantsLimit)
      },
      staff: {
        used: totalStaff,
        limit: subscription.usage.staffLimit,
        percentage: calculatePercentage(totalStaff, subscription.usage.staffLimit)
      },
      floorPlans: {
        used: totalFloorPlans,
        limit: subscription.usage.floorPlansLimit,
        percentage: calculatePercentage(totalFloorPlans, subscription.usage.floorPlansLimit)
      },
      tables: {
        used: totalTables,
        limit: subscription.usage.tablesLimit,
        percentage: calculatePercentage(totalTables, subscription.usage.tablesLimit)
      },
      monthlyBookings: {
        used: monthlyBookings,
        limit: subscription.usage.bookingsLimit,
        percentage: calculatePercentage(monthlyBookings, subscription.usage.bookingsLimit)
      },
      apiCalls: {
        used: subscription.usage.apiCallsThisMonth || 0,
        limit: subscription.usage.apiCallsLimit,
        percentage: calculatePercentage(subscription.usage.apiCallsThisMonth || 0, subscription.usage.apiCallsLimit)
      },
      storage: {
        used: subscription.usage.storageUsed || 0,
        limit: subscription.usage.storageLimit,
        percentage: calculatePercentage(subscription.usage.storageUsed || 0, subscription.usage.storageLimit)
      }
    };
    
    // Check if any limits are exceeded
    const exceededLimits = Object.entries(usageData).filter(([key, data]) => 
      data.limit !== -1 && data.used >= data.limit
    ).map(([key]) => key);
    
    return NextResponse.json({
      success: true,
      data: {
        hasSubscription: true,
        subscription: {
          _id: subscription._id,
          planType: subscription.planType,
          status: subscription.status,
          billingCycle: subscription.billingCycle,
          price: subscription.price,
          currency: subscription.currency,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          features: subscription.features
        },
        usage: usageData,
        exceededLimits,
        restaurants: restaurants.map(r => ({
          _id: r._id,
          name: r.restaurantName,
          staffCount: totalStaff, // This will be calculated per restaurant in a more detailed view
          floorPlanCount: totalFloorPlans
        })),
        summary: {
          totalRestaurants: restaurants.length,
          totalStaff,
          totalFloorPlans,
          totalTables,
          monthlyBookings,
          apiCallsThisMonth: subscription.usage.apiCallsThisMonth || 0
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching subscription data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subscription data' },
      { status: 500 }
    );
  }
}
