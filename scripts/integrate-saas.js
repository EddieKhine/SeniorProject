import mongoose from 'mongoose';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env.local') });
config({ path: join(__dirname, '..', '.env') });

import dbConnect from '../lib/mongodb.js';
import Restaurant from '../models/Restaurants.js';
import Subscription from '../models/Subscription.js';
import Organization from '../models/Organization.js';
import UsageAnalytics from '../models/UsageAnalytics.js';
import Floorplan from '../models/Floorplan.js';
import Booking from '../models/Booking.js';

async function integrateSaaS() {
  try {
    console.log('🚀 Starting SaaS integration for existing restaurants...');
    console.log('🔍 Environment check:');
    console.log('  - MONGODB_URI:', process.env.MONGODB_URI ? '✅ Found' : '❌ Missing');
    console.log('  - NODE_ENV:', process.env.NODE_ENV || 'development');
    
    await dbConnect();
    
    // Get all existing restaurants
    const restaurants = await Restaurant.find({});
    console.log(`📊 Found ${restaurants.length} restaurants to integrate`);
    
    for (const restaurant of restaurants) {
      console.log(`\n🏪 Processing restaurant: ${restaurant.restaurantName}`);
      
      // 1. Create Organization for the restaurant
      let organization = await Organization.findOne({ 
        $or: [
          { 'members.userId': restaurant.ownerId },
          { name: `${restaurant.restaurantName} Organization` }
        ]
      });
      
      if (!organization) {
        console.log('  📁 Creating organization...');
        organization = new Organization({
          name: `${restaurant.restaurantName} Organization`,
          slug: await Organization.generateSlug(`${restaurant.restaurantName} Organization`),
          email: `admin@${restaurant.restaurantName.toLowerCase().replace(/\s+/g, '')}.com`,
          type: 'restaurant',
          address: {
            street: restaurant.location?.address || '',
            city: 'Bangkok',
            state: 'Bangkok',
            country: 'Thailand',
            coordinates: restaurant.location?.coordinates || { lat: 0, lng: 0 }
          },
          members: [{
            userId: restaurant.ownerId,
            role: 'owner',
            permissions: [
              'manage_organization',
              'manage_subscription',
              'manage_restaurants',
              'manage_staff',
              'manage_bookings',
              'view_analytics',
              'manage_settings'
            ],
            joinedAt: new Date(),
            isActive: true
          }],
          status: 'active',
          settings: {
            timezone: 'Asia/Bangkok',
            currency: 'THB',
            language: 'th'
          }
        });
        
        await organization.save();
        console.log(`  ✅ Created organization: ${organization.name}`);
      } else {
        console.log(`  📁 Using existing organization: ${organization.name}`);
      }
      
      // 2. Create Subscription for the restaurant
      let subscription = await Subscription.findOne({ restaurantId: restaurant._id });
      
      if (!subscription) {
        console.log('  💳 Creating subscription...');
        
        // Determine plan based on restaurant activity
        const floorPlansCount = await Floorplan.countDocuments({ restaurantId: restaurant._id });
        const bookingsCount = await Booking.countDocuments({ restaurantId: restaurant._id });
        
        let planType = 'free';
        if (floorPlansCount > 1 || bookingsCount > 100) {
          planType = 'basic';
        }
        if (floorPlansCount > 2 || bookingsCount > 500) {
          planType = 'business';
        }
        
        const planLimits = Subscription.getPlanLimits(planType);
        
        subscription = new Subscription({
          restaurantId: restaurant._id,
          ownerId: restaurant.ownerId,
          planType: planType,
          status: 'active',
          billingCycle: 'monthly',
          price: planType === 'free' ? 0 : planType === 'basic' ? 29 : planType === 'business' ? 79 : 149,
          currency: 'THB',
          startDate: new Date(),
          nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          usage: {
            floorPlansUsed: floorPlansCount,
            floorPlansLimit: planLimits.floorPlansLimit,
            tablesUsed: 0, // Will be calculated from floorplans
            tablesLimit: planLimits.tablesLimit,
            staffUsed: 1, // At least the owner
            staffLimit: planLimits.staffLimit,
            bookingsThisMonth: await Booking.countDocuments({ 
              restaurantId: restaurant._id,
              createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
            }),
            bookingsLimit: planLimits.bookingsLimit,
            apiCallsThisMonth: 0,
            apiCallsLimit: planLimits.apiCallsLimit,
            storageUsed: 0,
            storageLimit: planLimits.storageLimit
          },
          features: planLimits.features,
          paymentMethod: 'none'
        });
        
        await subscription.save();
        console.log(`  ✅ Created ${planType} subscription`);
      } else {
        console.log(`  💳 Using existing subscription: ${subscription.planType}`);
      }
      
      // 3. Update Restaurant with SaaS data
      console.log('  🔄 Updating restaurant with SaaS data...');
      
      restaurant.subscriptionId = subscription._id;
      restaurant.organizationId = organization._id;
      restaurant.saasStatus = 'active';
      
      // Update features and limits from subscription
      const planLimits = Subscription.getPlanLimits(subscription.planType);
      restaurant.features = planLimits.features;
      restaurant.limits = {
        floorPlansLimit: planLimits.floorPlansLimit,
        tablesLimit: planLimits.tablesLimit,
        staffLimit: planLimits.staffLimit,
        bookingsLimit: planLimits.bookingsLimit,
        apiCallsLimit: planLimits.apiCallsLimit,
        storageLimit: planLimits.storageLimit
      };
      
      await restaurant.save();
      console.log(`  ✅ Updated restaurant with SaaS integration`);
      
      // 4. Create initial usage analytics
      console.log('  📈 Creating usage analytics...');
      
      const existingAnalytics = await UsageAnalytics.findOne({ 
        organizationId: organization._id,
        restaurantId: restaurant._id 
      });
      
      if (!existingAnalytics) {
        // Create initial analytics entries for key events
        const analyticsEvents = [
          {
            organizationId: organization._id,
            restaurantId: restaurant._id,
            userId: restaurant.ownerId,
            eventType: 'subscription_created',
            eventData: {
              planType: subscription.planType,
              amount: subscription.price,
              currency: subscription.currency
            },
            timestamp: new Date()
          }
        ];
        
        // Add floorplan creation events
        const floorplans = await Floorplan.find({ restaurantId: restaurant._id });
        for (const floorplan of floorplans) {
          analyticsEvents.push({
            organizationId: organization._id,
            restaurantId: restaurant._id,
            userId: restaurant.ownerId,
            eventType: 'floorplan_created',
            eventData: {
              floorplanId: floorplan._id
            },
            timestamp: floorplan.createdAt
          });
        }
        
        // Add recent booking events
        const recentBookings = await Booking.find({ restaurantId: restaurant._id })
          .sort({ createdAt: -1 })
          .limit(10);
        
        for (const booking of recentBookings) {
          analyticsEvents.push({
            organizationId: organization._id,
            restaurantId: restaurant._id,
            userId: restaurant.ownerId,
            eventType: 'booking_created',
            eventData: {
              bookingId: booking._id,
              partySize: booking.guestCount,
              duration: 120 // Default 2 hours
            },
            timestamp: booking.createdAt
          });
        }
        
        await UsageAnalytics.insertMany(analyticsEvents);
        console.log(`  ✅ Created ${analyticsEvents.length} analytics events`);
      } else {
        console.log(`  📈 Using existing analytics`);
      }
      
      console.log(`  🎉 Successfully integrated ${restaurant.restaurantName} with SaaS system`);
    }
    
    console.log('\n🎉 SaaS integration completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Restaurants processed: ${restaurants.length}`);
    console.log(`- Organizations created/updated: ${await Organization.countDocuments()}`);
    console.log(`- Subscriptions created/updated: ${await Subscription.countDocuments()}`);
    console.log(`- Analytics events created: ${await UsageAnalytics.countDocuments()}`);
    
  } catch (error) {
    console.error('❌ Error during SaaS integration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database connection closed');
  }
}

// Run the integration
integrateSaaS();
