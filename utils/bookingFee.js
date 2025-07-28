import Booking from '@/models/Booking';

// Calculate the normal booking fee based on number of guests and restaurant (customize as needed)
export function calculateNormalFee(guestCount, restaurant) {
  return guestCount * 10;
}

// Get the top N most booked table IDs for a restaurant
export async function getTopBookedTables(restaurantId, topN = 3) {
  // Aggregate bookings to count table usage
  const result = await Booking.aggregate([
    { $match: { restaurantId: typeof restaurantId === 'string' ? new (require('mongoose')).Types.ObjectId(restaurantId) : restaurantId } },
    { $group: { _id: '$tableId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: topN }
  ]);
  return result.map(r => r._id);
}

// Calculate the adjusted fee for a table
export async function calculateTableFee({ guestCount, restaurant, tableId, restaurantId }) {
  const normalFee = calculateNormalFee(guestCount, restaurant);
  const topTables = await getTopBookedTables(restaurantId);
  if (topTables.includes(tableId)) {
    return Math.round(normalFee * 1.1); 
  }
  return normalFee;
} 