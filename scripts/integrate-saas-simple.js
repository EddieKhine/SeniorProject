import mongoose from 'mongoose';

// Simple MongoDB connection without environment variables
const MONGODB_URI = 'mongodb+srv://u6511146:ponepone1999@cluster0.oqkra.mongodb.net/stock?retryWrites=true&w=majority';

async function integrateSaaS() {
  try {
    console.log('🚀 Starting SaaS integration for existing restaurants...');
    console.log('🔍 Using MongoDB URI:', MONGODB_URI);
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Import models after connection
    const { default: Restaurant } = await import('../models/Restaurants.js');
    const { default: Subscription } = await import('../models/Subscription.js');
    const { default: Organization } = await import('../models/Organization.js');
    const { default: UsageAnalytics } = await import('../models/UsageAnalytics.js');
    const { default: Floorplan } = await import('../models/Floorplan.js');
    const { default: Booking } = await import('../models/Booking.js');
    
    // Get all existing restaurants
    const restaurants = await Restaurant.find({});
    console.log(`📊 Found ${restaurants.length} restaurants to integrate`);
    
    for (const restaurant of restaurants) {
      console.log(`\n🏪 Processing restaurant: ${restaurant.restaurantName}`);
      
      // 1. Create Organization for the restaurant
      let organization = await Organization.findOne({ 
        'members.userId': restaurant.ownerId
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
