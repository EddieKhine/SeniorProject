import { Client } from "@line/bot-sdk";
import dbConnect from "@/lib/mongodb";
import Staff from "@/models/Staff";
import Restaurant from "@/models/Restaurants";
import Booking from "@/models/Booking";
import User from "@/models/user";

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new Client(config);

/**
 * Send notification to staff members when a new booking is created
 * @param {Object} booking - The booking object
 * @param {String} restaurantId - The restaurant ID
 */
export async function notifyStaffOfNewBooking(booking, restaurantId) {
  try {
    if (!booking || !restaurantId) {
      console.log('Invalid booking or restaurantId provided to notifyStaffOfNewBooking');
      return;
    }

    await dbConnect();
    
    // Get all active staff members for this restaurant who can view bookings
    const staffMembers = await Staff.find({
      restaurantId: restaurantId,
      isActive: true,
      'permissions.canViewBookings': true,
      lineUserId: { $exists: true, $ne: null }
    }).populate('restaurantId', 'restaurantName');

    if (staffMembers.length === 0) {
      console.log('No staff members found to notify for restaurant:', restaurantId);
      return;
    }

    // Get restaurant info
    const restaurant = await Restaurant.findById(restaurantId);
    const restaurantName = restaurant?.restaurantName || 'Restaurant';

    // Format booking date and time
    const bookingDate = new Date(booking.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Create notification message
    const notificationText = `🔔 NEW BOOKING REQUEST\n\n` +
      `📅 Date: ${bookingDate}\n` +
      `🕐 Time: ${booking.startTime} - ${booking.endTime}\n` +
      `👥 Guests: ${booking.guestCount}\n` +
      `🪑 Table: ${booking.tableId}\n` +
      `👤 Customer: ${booking.customerName}\n` +
      `📧 Email: ${booking.customerEmail}\n` +
      `📱 Phone: ${booking.customerPhone}\n` +
      `📋 Reference: ${booking.bookingRef}\n\n` +
      `⏳ Status: PENDING CONFIRMATION\n\n` +
      `Please confirm or reject this booking request.`;

    // Create interactive template for staff with permissions to update bookings
    const createStaffTemplate = (staff) => {
      const actions = [
        {
          type: "postback",
          label: "✅ Confirm Booking",
          data: `action=confirm_booking&bookingId=${booking._id}&staffId=${staff._id}`,
          displayText: `Confirm booking ${booking.bookingRef}`,
        }
      ];

      // Add reject option if staff can cancel bookings
      if (staff.permissions.canCancelBookings) {
        actions.push({
          type: "postback",
          label: "❌ Reject Booking",
          data: `action=reject_booking&bookingId=${booking._id}&staffId=${staff._id}`,
          displayText: `Reject booking ${booking.bookingRef}`,
        });
      }

      // Add view details option
      actions.push({
        type: "postback",
        label: "📋 View Details",
        data: `action=booking_details&bookingId=${booking._id}`,
        displayText: `View booking details`,
      });

      return {
        type: "template",
        altText: `New booking request - ${booking.bookingRef}`,
        template: {
          type: "buttons",
          text: notificationText.length > 160 ? 
            `🔔 NEW BOOKING REQUEST\n\n📅 ${bookingDate}\n🕐 ${booking.startTime}\n👥 ${booking.guestCount} guests\n🪑 Table ${booking.tableId}\n👤 ${booking.customerName}\n\n⏳ PENDING CONFIRMATION` :
            notificationText,
          actions: actions,
        },
      };
    };

    // Send notifications to all eligible staff members
    const notificationPromises = staffMembers.map(async (staff) => {
      try {
        const message = staff.permissions.canUpdateBookings ? 
          createStaffTemplate(staff) : 
          {
            type: "text",
            text: notificationText + `\n\n(Contact your manager to confirm this booking)`
          };

        await client.pushMessage(staff.lineUserId, message);
        console.log(`✅ Notification sent to staff: ${staff.displayName} (${staff.role})`);
        
        return { success: true, staffId: staff._id, staffName: staff.displayName };
      } catch (error) {
        console.error(`❌ Failed to send notification to ${staff.displayName}:`, error);
        return { success: false, staffId: staff._id, staffName: staff.displayName, error: error.message };
      }
    });

    const results = await Promise.allSettled(notificationPromises);
    
    // Log results
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;
    
    console.log(`📊 Notification Results: ${successful} sent, ${failed} failed out of ${staffMembers.length} staff members`);
    
    return {
      totalStaff: staffMembers.length,
      successful,
      failed,
      results: results.map(r => r.status === 'fulfilled' ? r.value : { success: false, error: r.reason })
    };

  } catch (error) {
    console.error('Error sending staff notifications:', error);
    throw error;
  }
}

/**
 * Send booking confirmation to customer
 * @param {Object} booking - The booking object
 * @param {Object} staff - The staff member who confirmed
 */
export async function notifyCustomerOfBookingConfirmation(booking, staff) {
  try {
    // Only send if customer has LINE User ID (came through LINE bot)
    if (!booking || !booking.userId || !staff) {
      console.log('Invalid booking, userId, or staff provided to notifyCustomerOfBookingConfirmation');
      return;
    }

    await dbConnect();
    
    // Get customer LINE User ID
    console.log('🔍 Looking for customer with userId:', booking.userId);
    const customer = await User.findById(booking.userId);
    console.log('🔍 Found customer:', customer ? {
      id: customer._id,
      email: customer.email,
      firstName: customer.firstName,
      lineUserId: customer.lineUserId,
      hasLineUserId: !!customer.lineUserId
    } : 'null');
    
    if (!customer || !customer.lineUserId) {
      console.log('❌ Customer not found or no LINE User ID for booking:', booking.bookingRef);
      console.log('   - Customer exists:', !!customer);
      console.log('   - Customer has lineUserId:', customer ? !!customer.lineUserId : 'N/A');
      return;
    }

    // Format booking date
    const bookingDate = new Date(booking.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const confirmationText = `✅ BOOKING CONFIRMED!\n\n` +
      `Ref: ${booking.bookingRef}\n` +
      `📅 ${bookingDate}\n` +
      `🕐 ${booking.startTime} - ${booking.endTime}\n` +
      `👥 ${booking.guestCount} guests, Table ${booking.tableId}\n\n` +
      `Confirmed by staff. See you soon!`;

    const message = {
      type: "template",
      altText: `Booking confirmed - ${booking.bookingRef}`,
      template: {
        type: "buttons",
        text: confirmationText,
        actions: [
          {
            type: "postback",
            label: "📋 My Bookings",
            data: "action=customer_bookings",
            displayText: "View my bookings",
          },
          {
            type: "postback",
            label: "ℹ️ Restaurant Info",
            data: "action=customer_info",
            displayText: "Restaurant information",
          }
        ],
      },
    };

    await client.pushMessage(customer.lineUserId, message);
    console.log(`✅ Confirmation sent to customer: ${customer.firstName} for booking ${booking.bookingRef}`);
    
    return { success: true };

  } catch (error) {
    console.error('Error sending customer confirmation:', error);
    throw error;
  }
}

/**
 * Send booking rejection notification to customer
 * @param {Object} booking - The booking object
 * @param {Object} staff - The staff member who rejected
 * @param {String} reason - Optional rejection reason
 */
export async function notifyCustomerOfBookingRejection(booking, staff, reason = null) {
  try {
    // Only send if customer has LINE User ID (came through LINE bot)
    if (!booking || !booking.userId || !staff) {
      console.log('Invalid booking, userId, or staff provided to notifyCustomerOfBookingRejection');
      return;
    }

    await dbConnect();
    
    // Get customer LINE User ID
    const customer = await User.findById(booking.userId);
    
    if (!customer || !customer.lineUserId) {
      console.log('Customer not found or no LINE User ID for booking:', booking.bookingRef);
      return;
    }

    // Format booking date
    const bookingDate = new Date(booking.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const rejectionText = `❌ BOOKING REQUEST DECLINED\n\n` +
      `We're sorry, but your table reservation request could not be confirmed.\n\n` +
      `📋 Reference: ${booking.bookingRef}\n` +
      `📅 Date: ${bookingDate}\n` +
      `🕐 Time: ${booking.startTime} - ${booking.endTime}\n` +
      `👥 Guests: ${booking.guestCount}\n` +
      `🪑 Table: ${booking.tableId}\n\n` +
      (reason ? `📝 Reason: ${reason}\n\n` : '') +
      `Please try booking a different time slot or contact us directly.`;

    const message = {
      type: "template",
      altText: `Booking declined - ${booking.bookingRef}`,
      template: {
        type: "buttons",
        text: rejectionText,
        actions: [
          {
            type: "postback",
            label: "📅 Make New Booking",
            data: "action=customer_book",
            displayText: "Make a new booking",
          },
          {
            type: "postback",
            label: "ℹ️ Contact Us",
            data: "action=customer_info",
            displayText: "Restaurant information",
          }
        ],
      },
    };

    await client.pushMessage(customer.lineUserId, message);
    console.log(`📤 Rejection notification sent to customer: ${customer.firstName} for booking ${booking.bookingRef}`);
    
    return { success: true };

  } catch (error) {
    console.error('Error sending customer rejection notification:', error);
    throw error;
  }
}

/**
 * Get booking details for staff display
 * @param {String} bookingId - The booking ID
 */
export async function getBookingDetailsForStaff(bookingId) {
  try {
    await dbConnect();
    
    const booking = await Booking.findById(bookingId)
      .populate('restaurantId', 'restaurantName')
      .populate('userId', 'firstName lastName lineUserId');

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Format booking date
    const bookingDate = new Date(booking.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const createdDate = new Date(booking.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return {
      bookingRef: booking.bookingRef,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      date: bookingDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
      guestCount: booking.guestCount,
      tableId: booking.tableId,
      status: booking.status,
      restaurantName: booking.restaurantId?.restaurantName || 'Unknown',
      createdAt: createdDate,
      pricing: booking.pricing,
      isLineCustomer: !!booking.userId?.lineUserId
    };

  } catch (error) {
    console.error('Error getting booking details:', error);
    throw error;
  }
}
