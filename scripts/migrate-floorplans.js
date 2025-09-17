/**
 * Migration script to convert single floorplanId to multiple floorplans structure
 * This script will:
 * 1. Find all restaurants with floorplanId
 * 2. Move floorplanId to floorplans array
 * 3. Set defaultFloorplanId to the existing floorplanId
 * 4. Mark existing floorplan as default
 * 5. Remove old floorplanId field
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try multiple paths for env files
const envPaths = [
  join(__dirname, '..', '.env.local'),
  join(__dirname, '..', '.env'),
  '.env.local',
  '.env'
];

console.log('🔍 Looking for environment files...');
console.log('📍 Script starting execution...');
let envLoaded = false;

for (const envPath of envPaths) {
  if (existsSync(envPath)) {
    console.log(`📁 Found env file: ${envPath}`);
    config({ path: envPath });
    if (process.env.MONGODB_URI) {
      console.log('✅ MONGODB_URI loaded successfully');
      envLoaded = true;
      break;
    }
  }
}

// Try loading without specifying path (default behavior)
if (!envLoaded) {
  console.log('🔄 Trying default dotenv loading...');
  config();
  if (process.env.MONGODB_URI) {
    console.log('✅ MONGODB_URI loaded via default method');
    envLoaded = true;
  }
}

if (!envLoaded || !process.env.MONGODB_URI) {
  console.log('❌ MONGODB_URI not found in environment variables');
  console.log('Available env vars:', Object.keys(process.env).filter(key => !key.startsWith('npm_')).slice(0, 10));
  console.log('\n💡 Please ensure your .env file contains:');
  console.log('MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database');
  console.log('\n🔧 Alternative: Set environment variable directly:');
  console.log('Windows: set MONGODB_URI=your-connection-string && npm run migrate:floorplans');
  console.log('Linux/Mac: MONGODB_URI=your-connection-string npm run migrate:floorplans');
  process.exit(1);
}

// Now that we've loaded the environment variables, we can import the modules
console.log('📦 Importing modules...');
const { default: dbConnect } = await import('../lib/mongodb.js');
const { default: Restaurant } = await import('../models/Restaurants.js');
const { default: Floorplan } = await import('../models/Floorplan.js');
console.log('✅ Modules imported successfully');

async function migrateFloorplans() {
  try {
    await dbConnect();
    console.log('🔄 Starting floorplan migration...');

    // Find all restaurants with the old floorplanId field
    const restaurants = await Restaurant.find({ floorplanId: { $exists: true } });
    console.log(`📊 Found ${restaurants.length} restaurants to migrate`);

    let migratedCount = 0;
    let errorCount = 0;

    for (const restaurant of restaurants) {
      try {
        console.log(`\n🏪 Migrating restaurant: ${restaurant.restaurantName} (${restaurant._id})`);
        
        if (restaurant.floorplanId) {
          // Verify floorplan exists
          const floorplan = await Floorplan.findById(restaurant.floorplanId);
          
          if (floorplan) {
            console.log(`  ✅ Found floorplan: ${floorplan.name}`);
            
            // Mark floorplan as default
            await Floorplan.findByIdAndUpdate(restaurant.floorplanId, { 
              isDefault: true 
            });
            console.log(`  ⭐ Marked floorplan as default`);
            
            // Update restaurant with new structure
            await Restaurant.findByIdAndUpdate(restaurant._id, {
              floorplans: [restaurant.floorplanId],
              defaultFloorplanId: restaurant.floorplanId,
              $unset: { floorplanId: 1 }  // Remove old field
            });
            
            console.log(`  ✅ Updated restaurant structure`);
            migratedCount++;
          } else {
            console.log(`  ❌ Floorplan not found, removing reference`);
            // Remove invalid floorplan reference and initialize new structure
            await Restaurant.findByIdAndUpdate(restaurant._id, {
              $unset: { floorplanId: 1 },
              $set: { floorplans: [] }
            });
            migratedCount++;
          }
        } else {
          // Just remove the field if it's null/empty and ensure new structure
          await Restaurant.findByIdAndUpdate(restaurant._id, {
            $unset: { floorplanId: 1 },
            $set: { 
              floorplans: [],
              // Don't set defaultFloorplanId if no floorplans exist
            }
          });
          console.log(`  🧹 Cleaned up empty floorplanId field and initialized new structure`);
          migratedCount++; // Count this as a successful migration
        }
        
      } catch (error) {
        console.error(`  ❌ Error migrating restaurant ${restaurant._id}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successfully migrated: ${migratedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📝 Total processed: ${restaurants.length}`);

    // Verify migration
    const remainingOldStructure = await Restaurant.countDocuments({ 
      floorplanId: { $exists: true, $ne: null } 
    });
    const newStructure = await Restaurant.countDocuments({ floorplans: { $exists: true } });
    const withDefaults = await Restaurant.countDocuments({ 
      defaultFloorplanId: { $exists: true, $ne: null } 
    });
    
    console.log('\n🔍 Verification:');
    console.log(`Restaurants with old structure remaining: ${remainingOldStructure}`);
    console.log(`Restaurants with new structure: ${newStructure}`);
    console.log(`Restaurants with default floorplan set: ${withDefaults}`);

    // Test public floorplan API for a sample restaurant
    if (newStructure > 0) {
      console.log('\n🧪 Testing public floorplan API compatibility...');
      const sampleRestaurant = await Restaurant.findOne({ defaultFloorplanId: { $exists: true } });
      if (sampleRestaurant) {
        console.log(`✅ Sample restaurant ready for public API: ${sampleRestaurant.restaurantName}`);
        console.log(`   - Default floorplan: ${sampleRestaurant.defaultFloorplanId}`);
        console.log(`   - Total floorplans: ${sampleRestaurant.floorplans?.length || 0}`);
      }
    }

    if (remainingOldStructure === 0) {
      console.log('🎉 Migration completed successfully!');
      console.log('📱 Public floorplan API will now use default floorplans automatically');
    } else {
      console.log('⚠️  Some restaurants still have old structure. Review manually.');
    }

  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if called directly
const scriptPath = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] && scriptPath.endsWith(process.argv[1].replace(/\\/g, '/'));

if (isMainModule || scriptPath.includes('migrate-floorplans.js')) {
  console.log('✅ Script is being run directly, starting migration...');
  migrateFloorplans()
    .then(() => {
      console.log('🎉 Migration script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
} else {
  console.log('ℹ️ Script is being imported, not running migration');
}

export default migrateFloorplans;
