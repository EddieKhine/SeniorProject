
import { Client, validateSignature } from "@line/bot-sdk";
import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import dbConnect from "@/lib/mongodb";
import Restaurant from "@/models/Restaurants";
import Floorplan from "@/models/Floorplan";
import Staff from "@/models/Staff";
import Booking from "@/models/Booking";
import User from "@/models/user";
import { notifyStaffOfNewBooking, notifyCustomerOfBookingConfirmation, notifyCustomerOfBookingRejection, getBookingDetailsForStaff } from "@/lib/lineNotificationService";

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = "stock";
const MONGODB_COLLECTION = "bookings";

const client = new Client(config);

let mongoClient;

// Event deduplication cache to prevent processing same events multiple times
const processedEvents = new Map();

// Clean up old events every 5 minutes to prevent memory leaks
setInterval(() => {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  for (const [eventId, timestamp] of processedEvents.entries()) {
    if (timestamp < fiveMinutesAgo) {
      processedEvents.delete(eventId);
    }
  }
}, 5 * 60 * 1000);

async function getBookings(restaurantId = null) {
  try {
    await dbConnect();
    
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);

    const query = {
      date: {
        $gte: todayStart,
        $lt: tomorrowEnd,
      },
      status: { $in: ['pending', 'confirmed'] }
    };

    if (restaurantId) {
      query.restaurantId = restaurantId;
    }

    const bookings = await Booking.find(query)
      .populate('restaurantId', 'restaurantName')
      .sort({ date: 1, startTime: 1 })
      .limit(10);

    return bookings;
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }
}

async function checkStaffInDatabase(lineUserId) {
  try {
    await dbConnect();
    
    console.log('Checking Line User ID:', lineUserId);
    
    // First, check if we have a staff member with this lineUserId stored
    let staff = await Staff.findOne({ 
      lineUserId: lineUserId,
      isActive: true 
    }).populate('restaurantId', 'restaurantName');
    
    if (staff) {
      console.log('Found staff by lineUserId:', staff.displayName);
      return { exists: true, staff, profile: null };
    }
    
    // If not found by lineUserId, this means they haven't been linked yet
    // or they're not a staff member
    console.log('No staff found with this Line User ID');
    return { exists: false, staff: null, profile: null };
  } catch (error) {
    console.error('Error checking staff in database:', error);
    return { exists: false, staff: null, profile: null };
  }
}

async function authenticateStaff(lineUserId) {
  const result = await checkStaffInDatabase(lineUserId);
  return result.staff;
}

async function getBookingDetails(bookingId, staffMember) {
  try {
    await dbConnect();
    
    const booking = await Booking.findOne({
      _id: bookingId,
      restaurantId: staffMember.restaurantId._id
    }).populate('restaurantId', 'restaurantName')
      .populate('userId', 'firstName lastName email contactNumber');

    return booking;
  } catch (error) {
    console.error('Error fetching booking details:', error);
    return null;
  }
}

async function updateBookingStatus(bookingId, status, staffMember) {
  try {
    await dbConnect();
    
    const booking = await Booking.findOne({
      _id: bookingId,
      restaurantId: staffMember.restaurantId._id
    });

    if (!booking) {
      return { success: false, message: 'Booking not found' };
    }

    booking.status = status;
    booking.addToHistory(status, {
      updatedBy: `Staff: ${staffMember.displayName}`,
      staffId: staffMember._id
    });

    await booking.save();
    return { success: true, booking };
  } catch (error) {
    console.error('Error updating booking:', error);
    return { success: false, message: 'Error updating booking' };
  }
}

// Hard-coded restaurant ID for this LINE bot
// Get restaurant ID from environment or use first available restaurant
async function getRestaurantId() {
  try {
    await dbConnect();
    // First try to find the specific restaurant ID
    const specificRestaurant = await Restaurant.findById("68d537658b174612538ddbc6").select('_id');
    if (specificRestaurant) {
      return specificRestaurant._id.toString();
    }
    // Fallback to first available restaurant
    const restaurant = await Restaurant.findOne().select('_id');
    if (restaurant) {
      return restaurant._id.toString();
    }
    // Final fallback to hardcoded ID if no restaurant found
    return "68d537658b174612538ddbc6";
  } catch (error) {
    console.error("Error getting restaurant ID:", error);
    return "68d537658b174612538ddbc6";
  }
}

async function getFloorplanImage() {
  try {
    await dbConnect();
    
    const restaurantId = await getRestaurantId();
    console.log('Looking for restaurant with ID:', restaurantId);
    
    // Get the specific restaurant this LINE bot is assigned to
    const restaurant = await Restaurant.findById(restaurantId);
    
    console.log('Found restaurant:', restaurant ? 'Yes' : 'No');
    if (restaurant) {
      console.log('Restaurant name:', restaurant.restaurantName);
      console.log('Has floorplanId:', restaurant.floorplanId ? 'Yes' : 'No');
    }
    
    if (!restaurant) {
      console.log('No restaurant found with ID:', restaurantId);
      return null;
    }
    
    // Try to find any floorplan for this restaurant
    let floorplan = null;
    
    if (restaurant.defaultFloorplanId) {
      console.log('Looking for floorplan with ID:', restaurant.defaultFloorplanId);
      floorplan = await Floorplan.findById(restaurant.defaultFloorplanId);
    } else {
      // If no default floorplan, get the first available floorplan
      console.log('No default floorplan, looking for any floorplan...');
      floorplan = await Floorplan.findOne();
    }
    
    console.log('Found floorplan:', floorplan ? 'Yes' : 'No');
    if (floorplan) {
      console.log('Has screenshotUrl:', floorplan.screenshotUrl ? 'Yes' : 'No');
      console.log('Screenshot URL:', floorplan.screenshotUrl);
    }
    
    if (!floorplan || !floorplan.screenshotUrl) {
      console.log('No floorplan or screenshot URL found');
      return null;
    }

    return {
      restaurantName: restaurant.restaurantName, // Fixed: was restaurant.name
      imageUrl: floorplan.screenshotUrl,
      floorplan: floorplan
    };
  } catch (error) {
    console.error('Error fetching floorplan:', error);
    return null;
  }
}

// Customer handling functions
async function checkCustomerInDatabase(lineUserId) {
  try {
    await dbConnect();
    
    console.log('Checking customer Line User ID:', lineUserId);
    
    // Check if we have a customer with this lineUserId
    let customer = await User.findOne({ 
      lineUserId: lineUserId,
      role: 'customer'
    });
    
    if (customer) {
      console.log('Found customer by lineUserId:', customer.firstName);
      return { exists: true, customer };
    }
    
    console.log('No customer found with this Line User ID');
    return { exists: false, customer: null };
  } catch (error) {
    console.error('Error checking customer in database:', error);
    return { exists: false, customer: null };
  }
}

async function createCustomerAccount(lineUserId, displayName, pictureUrl) {
  try {
    await dbConnect();
    
    // Create new customer account similar to LIFF login
    const lineEmail = `line.${lineUserId}@foodloft.local`;
    
    const customer = new User({
      email: lineEmail,
      firstName: displayName || "LINE User",
      lastName: "",
      profileImage: pictureUrl || "",
      lineUserId: lineUserId,
      contactNumber: "",
      role: "customer",
    });
    
    await customer.save();
    console.log("New LINE customer created:", customer);
    return customer;
  } catch (error) {
    console.error('Error creating customer account:', error);
    return null;
  }
}

async function handleCustomerMode(event, userId, client) {
  try {
    // Check if this is a repeat access - prevent spam
    const accessKey = `customer_mode_${userId}_${event.timestamp}`;
    if (processedEvents.has(accessKey)) {
      console.log("Duplicate customer mode access detected, skipping");
      return;
    }
    processedEvents.set(accessKey, Date.now());
    
    const profile = await client.getProfile(userId);
    const restaurantId = await getRestaurantId();
    
    console.log("👤 Customer accessing chatbot:");
    console.log("   LINE User ID:", userId);
    console.log("   Display Name:", profile.displayName);
    console.log("   Restaurant ID:", restaurantId);
    
    // Check if customer exists in database
    const customerCheck = await checkCustomerInDatabase(userId);
    
    if (!customerCheck.exists) {
      // Create new customer account
      const newCustomer = await createCustomerAccount(userId, profile.displayName, profile.pictureUrl);
      
      if (newCustomer) {
        // Create simple flex message for new customer
        const newCustomerMessage = {
          type: "flex",
          altText: "Welcome to our restaurant!",
          contents: {
            type: "bubble",
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: `Welcome ${profile.displayName}!`,
                  weight: "bold",
                  size: "xl",
                  color: "#1DB446",
                  align: "center"
                },
                {
                  type: "text",
                  text: "Your account has been created successfully!",
                  size: "sm",
                  color: "#666666",
                  align: "center",
                  margin: "md"
                },
                {
                  type: "text",
                  text: "You can now make bookings and manage your reservations.",
                  size: "sm",
                  color: "#333333",
                  align: "center",
                  margin: "md"
                },
                {
                  type: "button",
                  style: "primary",
                  height: "sm",
                  color: "#1DB446",
                  action: {
                    type: "postback",
                    data: "action=customer_book",
                    displayText: "Make a new booking",
                    label: "Make Booking"
                  },
                  margin: "lg"
                },
                {
                  type: "button",
                  style: "primary",
                  height: "sm",
                  color: "#0084FF",
                  action: {
                    type: "uri",
                    // Same LIFF ID for both local and production - LIFF app should be configured to point to ngrok URL for testing
                    uri: `https://liff.line.me/2007787204-zGYZn1ZE?restaurantId=${restaurantId}`,
                    label: "Open Restaurant App"
                  },
                  margin: "sm"
                },
                {
                  type: "button",
                  style: "secondary",
                  height: "sm",
                  action: {
                    type: "postback",
                    data: "action=customer_bookings",
                    displayText: "View my bookings",
                    label: "My Bookings"
                  },
                  margin: "sm"
                },
                {
                  type: "button",
                  style: "secondary",
                  height: "sm",
                  action: {
                    type: "postback",
                    data: "action=customer_floorplan",
                    displayText: "View restaurant layout",
                    label: "View Floorplan"
                  },
                  margin: "sm"
                },
                {
                  type: "button",
                  style: "secondary",
                  height: "sm",
                  action: {
                    type: "postback",
                    data: "action=customer_info",
                    displayText: "Restaurant information",
                    label: "Restaurant Info"
                  },
                  margin: "sm"
                }
              ],
              paddingAll: "lg"
            }
          }
        };

        return client.replyMessage(event.replyToken, newCustomerMessage);
      } else {
        return client.replyMessage(event.replyToken, {
          type: "text",
          text: "Sorry, there was an error creating your account. Please try again later.",
        });
      }
    } else {
      // Existing customer - Create simple flex message
      const existingCustomerMessage = {
        type: "flex",
        altText: "Customer Menu",
        contents: {
          type: "bubble",
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: `Welcome back ${profile.displayName}!`,
                weight: "bold",
                size: "xl",
                color: "#1DB446",
                align: "center"
              },
              {
                type: "text",
                text: "How can I help you today?",
                size: "sm",
                color: "#666666",
                align: "center",
                margin: "md"
              },
              {
                type: "button",
                style: "primary",
                height: "sm",
                color: "#1DB446",
                action: {
                  type: "postback",
                  data: "action=customer_book",
                  displayText: "Make a new booking",
                  label: "Make Booking"
                },
                margin: "md"
              },
              {
                type: "button",
                style: "primary",
                height: "sm",
                color: "#0084FF",
                action: {
                  type: "uri",
                  uri: `https://liff.line.me/2007787204-zGYZn1ZE?restaurantId=${restaurantId}`,
                  label: "Open Restaurant App"
                },
                margin: "sm"
              },
              {
                type: "button",
                style: "secondary",
                height: "sm",
                action: {
                  type: "postback",
                  data: "action=customer_bookings",
                  displayText: "View my bookings",
                  label: "My Bookings"
                },
                margin: "sm"
              },
              {
                type: "button",
                style: "secondary",
                height: "sm",
                action: {
                  type: "postback",
                  data: "action=customer_floorplan",
                  displayText: "View restaurant layout",
                  label: "View Floorplan"
                },
                margin: "sm"
              },
              {
                type: "button",
                style: "secondary",
                height: "sm",
                action: {
                  type: "postback",
                  data: "action=customer_info",
                  displayText: "Restaurant information",
                  label: "Restaurant Info"
                },
                margin: "sm"
              }
            ],
            paddingAll: "lg"
          }
        }
      };

      return client.replyMessage(event.replyToken, existingCustomerMessage);
    }
  } catch (error) {
    console.error('Error handling customer mode:', error);
    return client.replyMessage(event.replyToken, {
      type: "text",
      text: "Sorry, there was an error. Please try again later.",
    });
  }
}

async function handleCustomerPostback(event, userId, client, postbackData) {
  try {
    console.log("🎯 Customer postback received:", postbackData);
    
    // Check if customer exists
    const customerCheck = await checkCustomerInDatabase(userId);
    if (!customerCheck.exists) {
      console.log("❌ Customer not found, creating account...");
      return client.replyMessage(event.replyToken, {
        type: "text",
        text: "Please send a message first to create your customer account.",
      });
    }
    
    const customer = customerCheck.customer;
    console.log("✅ Customer found:", customer.firstName);

    switch (postbackData) {
      case "action=customer_book":
        console.log("📅 Handling customer booking request");
        return await handleCustomerBooking(event, userId, client, customer);
      
      case "action=customer_bookings":
        console.log("📋 Handling customer bookings request");
        return await handleCustomerBookings(event, userId, client, customer);
      
      case "action=customer_floorplan":
        console.log("🏢 Handling customer floorplan request");
        return await handleCustomerFloorplan(event, userId, client, customer);
      
      case "action=customer_info":
        console.log("ℹ️ Handling customer info request");
        return await handleCustomerInfo(event, userId, client, customer);
      
      case "action=cancel_booking":
        console.log("🚫 Handling customer cancel booking request");
        // Parse booking ID from postback data
        const bookingId = postbackData.split("bookingId=")[1];
        return await handleCustomerCancelBooking(event, userId, client, customer, bookingId);
      
      default:
        // Handle inline booking flow
        if (postbackData.startsWith("action=booking_time&date=")) {
          const selectedDate = postbackData.split("date=")[1];
          return await handleBookingTimeSelection(event, userId, client, customer, selectedDate);
        }
        
        if (postbackData.startsWith("action=booking_times&date=")) {
          const params = parseBookingParams(postbackData);
          return await handleBookingTimeSelection(event, userId, client, customer, params.date, params.page || 0);
        }
        
        if (postbackData.startsWith("action=booking_dates&page=")) {
          const page = parseInt(postbackData.split("page=")[1]);
          return await handleBookingDateSelection(event, userId, client, customer, page);
        }
        
        if (postbackData.startsWith("action=booking_guests&date=")) {
          const params = parseBookingParams(postbackData);
          return await handleBookingGuestSelection(event, userId, client, customer, params.date, params.time);
        }
        
        if (postbackData.startsWith("action=booking_tables&date=")) {
          const params = parseBookingParams(postbackData);
          return await handleBookingTableSelection(event, userId, client, customer, params.date, params.time, params.guests);
        }
        
        if (postbackData.startsWith("action=booking_table_page&date=")) {
          const params = parseBookingParams(postbackData);
          return await handleBookingTableSelection(event, userId, client, customer, params.date, params.time, params.guests, params.page || 0);
        }
        
        // Skip payment processing - go directly to booking completion for staff confirmation workflow
        if (postbackData.startsWith("action=booking_confirm&date=")) {
          console.log("✅ Booking confirm - skipping payment, going directly to completion");
          console.log("Postback data:", postbackData);
          const params = parseBookingParams(postbackData);
          console.log("Parsed params:", params);
          return await handleBookingCompletion(event, userId, client, customer, params.date, params.time, params.guests, params.table);
        }
        
        // Payment processing disabled - using staff confirmation workflow instead
        if (postbackData.startsWith("action=booking_payment_process&date=")) {
          console.log("Payment process disabled - redirecting to booking completion");
          const params = parseBookingParams(postbackData);
          return await handleBookingCompletion(event, userId, client, customer, params.date, params.time, params.guests, params.table);
        }
        
        if (postbackData.startsWith("action=booking_complete&date=")) {
          const params = parseBookingParams(postbackData);
          return await handleBookingCompletion(event, userId, client, customer, params.date, params.time, params.guests, params.table);
        }
        
        // Handle booking cancellation
        if (postbackData.startsWith("action=cancel_booking&bookingId=")) {
          const bookingId = postbackData.split("bookingId=")[1];
          return await handleCustomerCancelBooking(event, userId, client, customer, bookingId);
        }
        
        return client.replyMessage(event.replyToken, {
          type: "text",
          text: "Unknown action. Please try again.",
        });
    }
  } catch (error) {
    console.error('Error handling customer postback:', error);
    
    // Don't try to reply again if we already failed
    if (error.statusCode === 400) {
      console.log("Reply token already used, not sending error message");
      return;
    }
    
    return client.replyMessage(event.replyToken, {
      type: "text",
      text: "Sorry, there was an error. Please try again later.",
    });
  }
}

async function handleCustomerBooking(event, userId, client, customer) {
  console.log("Starting customer booking flow for:", customer.firstName);
  
  // Start inline booking flow directly
  try {
    return await handleBookingDateSelection(event, userId, client, customer);
  } catch (error) {
    console.error("Error in handleCustomerBooking:", error);
    
    // Don't try to reply again if we already failed
    if (error.statusCode === 400) {
      console.log("Reply token already used, not sending error message");
      return;
    }
    
    return client.replyMessage(event.replyToken, {
      type: "text",
      text: "Error starting booking process. Please try again.",
    });
  }
}

async function handleCustomerBookings(event, userId, client, customer) {
  try {
    await dbConnect();
    
    // Get customer's upcoming bookings only (today and future)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const bookings = await Booking.find({
      userId: customer._id,
      status: { $in: ['pending', 'confirmed'] },
      date: { $gte: today }
    })
    .populate('restaurantId', 'restaurantName')
    .populate('floorplanId', 'name')
    .sort({ date: 1, startTime: 1 });


    if (bookings.length === 0) {
      const noBookingsText = `📋 No Upcoming Bookings\n\n` +
        `You don't have any reservations for today or future dates.\n\n` +
        `💡 Quick Actions:\n` +
        `• Type "book" to make a new reservation\n` +
        `• Type "floorplan" to view our layout\n` +
        `• Type "info" for restaurant details`;

      return client.replyMessage(event.replyToken, {
        type: "text",
        text: noBookingsText,
        quickReply: {
          items: [
            {
              type: "action",
              action: {
                type: "postback",
                label: "📅 Make Booking",
                data: "action=customer_book",
                displayText: "Make a new booking"
              }
            },
            {
              type: "action",
              action: {
                type: "postback",
                label: "🏢 View Floorplan",
                data: "action=customer_floorplan",
                displayText: "View restaurant layout"
              }
            }
          ]
        }
      });
    }

    // Limit bookings to prevent LINE API 400 error (max 10 bookings)
    const limitedBookings = bookings.slice(0, 10);
    
    // Show bookings in carousel format
    const bookingTemplates = limitedBookings.map((booking, index) => {
      const dateObj = new Date(booking.date);
      const dateStr = dateObj.toLocaleDateString("en-GB");
      const statusEmoji = {
        'pending': '⏳',
        'confirmed': '✅',
        'cancelled': '❌',
        'completed': '✔️'
      };
      
      // Check if booking can be cancelled
      const bookingDateTime = new Date(booking.date);
      const [startHour, startMinute] = booking.startTime.split(':').map(Number);
      bookingDateTime.setHours(startHour, startMinute, 0, 0);
      
      const now = new Date();
      const timeDifference = bookingDateTime.getTime() - now.getTime();
      const hoursUntilBooking = timeDifference / (1000 * 60 * 60);
      
      const canCancel = booking.status === 'pending' || booking.status === 'confirmed';
      const isWithin2Hours = hoursUntilBooking < 2;
      
      const bubble = {
        type: "bubble",
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: `${booking.restaurantId.restaurantName}`,
              weight: "bold",
              size: "lg",
              color: "#1DB446"
            },
            {
              type: "text",
              text: `📅 ${dateStr} ${booking.startTime}-${booking.endTime}`,
              size: "sm",
              color: "#666666",
              margin: "md"
            },
            {
              type: "text",
              text: `👥 ${booking.guestCount} guests | 🍽️ Table ${booking.tableId}`,
              size: "sm",
              color: "#666666"
            },
            {
              type: "text",
              text: `${statusEmoji[booking.status] || '📋'} ${booking.status.toUpperCase()}`,
              size: "sm",
              color: "#666666",
              margin: "md"
            },
            {
              type: "text",
              text: `📝 Ref: ${booking.bookingRef}`,
              size: "xs",
              color: "#999999",
              margin: "md"
            }
          ]
        }
      };
      
      // Add cancel button only if booking can be cancelled
      if (canCancel && !isWithin2Hours) {
        bubble.footer = {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "button",
              action: {
                type: "postback",
                label: "🚫 Cancel Booking",
                data: `action=cancel_booking&bookingId=${booking._id}`,
                displayText: "Cancel this booking"
              },
              style: "secondary",
              color: "#FF4F18"
            }
          ]
        };
      } else if (isWithin2Hours && canCancel) {
        // Show message that booking cannot be cancelled
        bubble.footer = {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "⚠️ Cannot cancel within 2 hours of booking time",
              size: "xs",
              color: "#FF4F18",
              align: "center",
              margin: "md"
            }
          ]
        };
      }
      
      return bubble;
    });

    return client.replyMessage(event.replyToken, {
      type: "flex",
      altText: `Your Bookings (${limitedBookings.length}${bookings.length > 10 ? ` of ${bookings.length}` : ''})`,
      contents: {
        type: "carousel",
        contents: bookingTemplates
      }
    });

  } catch (error) {
    console.error('Error fetching customer bookings:', error);
    return client.replyMessage(event.replyToken, {
      type: "text",
      text: "Sorry, there was an error fetching your bookings. Please try again later.",
    });
  }
}

async function handleCustomerFloorplan(event, userId, client, customer) {
  try {
    await dbConnect();
    
    console.log("🏢 Customer requesting floorplan layout");
    
    // Get floorplan image data
    const floorplanData = await getFloorplanImage();
    
    if (!floorplanData) {
      return client.replyMessage(event.replyToken, {
        type: "text",
        text: "Sorry, no floorplan image is available at the moment.",
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const fullImageUrl = floorplanData.imageUrl.startsWith('http') 
      ? floorplanData.imageUrl 
      : `${baseUrl}${floorplanData.imageUrl}`;

    console.log("📸 Sending floorplan image:", fullImageUrl);

    return client.replyMessage(event.replyToken, [
      {
        type: "text",
        text: `🏢 Floorplan for ${floorplanData.restaurantName}:\n\nThis is our restaurant layout showing table locations and seating arrangements.`,
      },
      {
        type: "image",
        originalContentUrl: fullImageUrl,
        previewImageUrl: fullImageUrl,
      }
    ]);

  } catch (error) {
    console.error('Error handling floorplan request:', error);
    return client.replyMessage(event.replyToken, {
      type: "text",
      text: "Sorry, there was an error. Please try again later.",
    });
  }
}

async function handleCustomerInfo(event, userId, client, customer) {
  try {
    // Get restaurant information
    const restaurant = await Restaurant.findOne().select('restaurantName location contactNumber openingHours description');
    const restaurantId = await getRestaurantId();
    
    if (!restaurant) {
      return client.replyMessage(event.replyToken, {
        type: "text",
        text: "Restaurant information is not available.",
      });
    }

    // Format operating hours - simplified for LINE character limits
    let hoursText = 'Hours not available';
    if (restaurant.openingHours) {
      // Check if all days have the same hours
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const firstDayHours = restaurant.openingHours[days[0]];
      const allSameHours = days.every(day => {
        const dayHours = restaurant.openingHours[day];
        return dayHours && dayHours.open === firstDayHours?.open && dayHours.close === firstDayHours?.close;
      });
      
      if (allSameHours && firstDayHours?.open && firstDayHours?.close) {
        hoursText = `Daily: ${firstDayHours.open} - ${firstDayHours.close}`;
      } else {
        // Show different hours for each day (simplified)
        const hoursArray = [];
        days.forEach((day, index) => {
          const dayHours = restaurant.openingHours[day];
          if (dayHours && dayHours.open && dayHours.close) {
            const dayName = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index];
            hoursArray.push(`${dayName}: ${dayHours.open}-${dayHours.close}`);
          }
        });
        if (hoursArray.length > 0) {
          hoursText = hoursArray.join(' | ');
        }
      }
    }

    // Create Google Maps link from address
    let mapsLink = 'Address not available';
    if (restaurant.location?.address) {
      const encodedAddress = encodeURIComponent(restaurant.location.address);
      mapsLink = `https://maps.google.com/maps?q=${encodedAddress}`;
    }

    const infoText = `ℹ️ Restaurant Information\n\n` +
      `🏪 ${restaurant.restaurantName}\n` +
      `📍 ${restaurant.location?.address || 'Address not available'}\n` +
      `🗺️ ${mapsLink}\n` +
      `📞 ${restaurant.contactNumber || 'Contact not available'}\n\n` +
      `🕒 ${hoursText}\n\n` +
      `${restaurant.description || 'Welcome to our restaurant!'}\n\n` +
      `💡 Quick Actions:\n` +
      `• Type "book" to make a reservation\n` +
      `• Type "floorplan" to view our layout\n` +
      `• Type "menu" to see our offerings`;

    // Debug: Log the message being sent
    console.log("Restaurant info text:", infoText);
    console.log("Text length:", infoText.length);

    // Text messages have a 5000 character limit, so we're well within limits
    if (infoText.length > 5000) {
      console.log("Message too long, truncating...");
      const truncatedText = infoText.substring(0, 4997) + "...";
      return client.replyMessage(event.replyToken, {
        type: "text",
        text: truncatedText
      });
    }

    // Create LIFF URL with restaurant ID parameter
    const liffUrl = `https://liff.line.me/2007787204-zGYZn1ZE?restaurantId=${restaurantId}`;

    // Send as text message with quick reply buttons
    return client.replyMessage(event.replyToken, {
      type: "text",
      text: infoText,
      quickReply: {
        items: [
          {
            type: "action",
            action: {
              type: "postback",
              label: "📅 Make Booking",
              data: "action=customer_book",
              displayText: "Make a booking"
            }
          },
          {
            type: "action",
            action: {
              type: "postback",
              label: "🏢 View Floorplan",
              data: "action=customer_floorplan",
              displayText: "View floorplan"
            }
          },
          {
            type: "action",
            action: {
              type: "uri",
              label: "🌐 Visit Website",
              uri: liffUrl
            }
          }
        ]
      }
    });

  } catch (error) {
    console.error('Error handling restaurant info:', error);
    return client.replyMessage(event.replyToken, {
      type: "text",
      text: "Sorry, there was an error. Please try again later.",
    });
  }
}

async function handleCustomerCancelBooking(event, userId, client, customer, bookingId) {
  try {
    await dbConnect();
    
    console.log("🚫 Customer requesting to cancel booking:", bookingId);
    
    if (!bookingId) {
      return client.replyMessage(event.replyToken, {
        type: "text",
        text: "❌ Invalid booking ID. Please try again.",
      });
    }
    
    // Find the booking
    const booking = await Booking.findOne({
      _id: bookingId,
      userId: customer._id
    }).populate('restaurantId', 'restaurantName');
    
    if (!booking) {
      return client.replyMessage(event.replyToken, {
        type: "text",
        text: "❌ Booking not found or you don't have permission to cancel this booking.",
      });
    }
    
    // Check if booking can be cancelled
    if (booking.status === 'cancelled') {
      return client.replyMessage(event.replyToken, {
        type: "text",
        text: "❌ This booking has already been cancelled.",
      });
    }
    
    if (booking.status === 'completed') {
      return client.replyMessage(event.replyToken, {
        type: "text",
        text: "❌ This booking has already been completed and cannot be cancelled.",
      });
    }
    
    // Check if booking is too close to start time (within 2 hours)
    const bookingDateTime = new Date(booking.date);
    const [startHour, startMinute] = booking.startTime.split(':').map(Number);
    bookingDateTime.setHours(startHour, startMinute, 0, 0);
    
    const now = new Date();
    const timeDifference = bookingDateTime.getTime() - now.getTime();
    const hoursUntilBooking = timeDifference / (1000 * 60 * 60);
    
    if (hoursUntilBooking < 2) {
      return client.replyMessage(event.replyToken, {
        type: "text",
        text: "❌ This booking cannot be cancelled as it's within 2 hours of the start time. Please contact the restaurant directly.",
      });
    }
    
    // Cancel the booking
    booking.status = 'cancelled';
    booking.addToHistory('cancelled', {
      method: 'line_chat',
      cancelledBy: 'customer',
      reason: 'Customer requested cancellation'
    });
    
    await booking.save();
    
    // Update floorplan table status
    await Floorplan.updateOne(
      { 'data.objects.objectId': booking.tableId },
      {
        $set: {
          'data.objects.$.userData.bookingStatus': 'available',
          'data.objects.$.userData.currentBooking': null
        }
      }
    );
    
    // Format booking details for confirmation
    const dateObj = new Date(booking.date);
    const dateStr = dateObj.toLocaleDateString("en-GB", { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    const cancelText = `✅ Booking Cancelled Successfully!\n\n` +
      `🔖 Ref: ${booking.bookingRef}\n` +
      `📅 Date: ${dateStr}\n` +
      `⏰ Time: ${booking.startTime} - ${booking.endTime}\n` +
      `👥 Guests: ${booking.guestCount}\n` +
      `🪑 Table: ${booking.tableId}\n\n` +
      `Your booking has been cancelled and the table is now available for other customers.\n\n` +
      `💡 Quick Actions:\n` +
      `• Type "bookings" to view your remaining reservations\n` +
      `• Type "book" to make a new reservation\n` +
      `• Type "help" for more options`;
    
    console.log("✅ Booking cancelled successfully:", booking.bookingRef);
    
    return client.replyMessage(event.replyToken, {
      type: "text",
      text: cancelText,
      quickReply: {
        items: [
          {
            type: "action",
            action: {
              type: "postback",
              label: "📋 My Bookings",
              data: "action=customer_bookings",
              displayText: "View my bookings"
            }
          },
          {
            type: "action",
            action: {
              type: "postback",
              label: "📅 Make New Booking",
              data: "action=customer_book",
              displayText: "Make a new booking"
            }
          }
        ]
      }
    });
    
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return client.replyMessage(event.replyToken, {
      type: "text",
      text: "❌ Sorry, there was an error cancelling your booking. Please try again or contact the restaurant.",
    });
  }
}


// Inline Booking Flow Functions
async function handleBookingDateSelection(event, userId, client, customer, page = 0) {
  try {
    console.log("Starting date selection for customer:", customer.firstName, "page:", page);
    await dbConnect();
    
    // Get restaurant information
    const restaurant = await Restaurant.findOne().select('restaurantName openingHours');
    
    if (!restaurant) {
      console.log("No restaurant found in database");
      return client.replyMessage(event.replyToken, {
        type: "text",
        text: "Restaurant information not available. Please contact support.",
      });
    }
    
    console.log("Restaurant found:", restaurant.restaurantName);
    console.log("Operating hours:", restaurant.openingHours);

    // Generate available dates (next 12 days to fit carousel limit)
    const availableDates = generateAvailableDates(12, restaurant);
    console.log("Generated dates:", availableDates.length, "dates");
    
    console.log("Sending date selection message...");
    
    // Create flex message for date selection
    const dateBubbles = availableDates.map((date, index) => ({
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: date.label,
            weight: "bold",
            size: "lg",
            color: "#1DB446"
          },
          {
            type: "text",
            text: new Date(date.value).toLocaleDateString("en-GB", { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            }),
            size: "sm",
            color: "#666666",
            margin: "md"
          }
        ]
      },
      action: {
        type: "postback",
        data: `action=booking_time&date=${date.value}`,
        displayText: `Select ${date.label}`
      }
    }));

    const message = {
      type: "flex",
      altText: "Select Booking Date",
      contents: {
        type: "carousel",
        contents: dateBubbles
      }
    };
    
    console.log("Message to send:", JSON.stringify(message, null, 2));
    
    try {
      const result = await client.replyMessage(event.replyToken, message);
      console.log("Message sent successfully:", result);
      return result;
    } catch (sendError) {
      console.error("Error sending message:", sendError);
      console.error("Send error details:", {
        status: sendError.status,
        statusText: sendError.statusText,
        data: sendError.response?.data
      });
      throw sendError;
    }

  } catch (error) {
    console.error('Error in date selection:', error);
    console.error('Error stack:', error.stack);
    
    // Don't try to reply again if we already failed
    if (error.statusCode === 400) {
      console.log("Reply token already used, not sending error message");
      return;
    }
    
    return client.replyMessage(event.replyToken, {
      type: "text",
      text: "Sorry, there was an error. Please try again later.",
    });
  }
}

async function handleBookingTimeSelection(event, userId, client, customer, selectedDate, page = 0) {
  try {
    await dbConnect();
    
    // Get restaurant operating hours
    const restaurant = await Restaurant.findOne().select('openingHours');
    
    if (!restaurant) {
      return client.replyMessage(event.replyToken, {
        type: "text",
        text: "Restaurant information not available. Please contact support.",
      });
    }

    console.log("Using restaurant operating hours for time selection");
    console.log("Restaurant openingHours:", JSON.stringify(restaurant.openingHours, null, 2));
    
    // Parse operating hours for the selected date
    const hours = parseOperatingHours(restaurant, selectedDate);
    console.log("Parsed hours for", selectedDate, ":", hours);
    
    const allTimeSlots = generateTimeSlots(hours.open, hours.close, 30, selectedDate); // 30-minute intervals
    console.log("All generated time slots:", allTimeSlots);
    
    let timeSlots = allTimeSlots.slice(0, 12); // Limit to 12 slots for carousel
    console.log("Final time slots for display:", timeSlots.length, "slots (limited from", allTimeSlots.length, ")");
    
    // Check if we have any time slots
    if (timeSlots.length === 0) {
      console.log("No time slots available - trying fallback hours!");
      
      // Try with fallback hours (24-hour operation)
      const fallbackHours = { open: "00:00", close: "23:59" };
      const fallbackTimeSlots = generateTimeSlots(fallbackHours.open, fallbackHours.close, 30, selectedDate);
      const fallbackLimited = fallbackTimeSlots.slice(0, 12);
      
      console.log(`Fallback generated ${fallbackLimited.length} time slots`);
      
      if (fallbackLimited.length > 0) {
        // Use fallback time slots
        timeSlots = fallbackLimited;
        console.log("Using fallback time slots");
      } else {
        return client.replyMessage(event.replyToken, {
          type: "text",
          text: `Sorry, no time slots are available for ${new Date(selectedDate).toLocaleDateString("en-GB", { weekday: 'long', day: 'numeric', month: 'long' })}.\n\nRestaurant hours: ${hours.open} - ${hours.close}\n\nPlease try a different date.`,
        });
      }
    }
    
    const dateObj = new Date(selectedDate);
    const dateStr = dateObj.toLocaleDateString("en-GB", { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    console.log("Sending time selection message...");
    
    // Create flex message for time selection
    const timeBubbles = timeSlots.map((time, index) => {
      const [hour, minute] = time.split(':');
      const timeObj = new Date();
      timeObj.setHours(parseInt(hour), parseInt(minute));
      const timeDisplay = timeObj.toLocaleTimeString("en-GB", { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
      
      return {
        type: "bubble",
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: timeDisplay,
              weight: "bold",
              size: "xl",
              color: "#1DB446",
              align: "center"
            },
            {
              type: "text",
              text: "Available",
              size: "sm",
              color: "#666666",
              align: "center",
              margin: "md"
            }
          ]
        },
        action: {
          type: "postback",
          data: `action=booking_guests&date=${selectedDate}&time=${time}`,
          displayText: `Select ${timeDisplay}`
        }
      };
    });

    const message = {
      type: "flex",
      altText: "Select Booking Time",
      contents: {
        type: "carousel",
        contents: timeBubbles
      }
    };
    
    console.log("Time selection message:", JSON.stringify(message, null, 2));
    
    try {
      const result = await client.replyMessage(event.replyToken, message);
      console.log("Time selection message sent successfully:", result);
      return result;
    } catch (sendError) {
      console.error("Error sending time selection message:", sendError);
      console.error("Send error details:", {
        status: sendError.status,
        statusText: sendError.statusText,
        data: sendError.response?.data
      });
      throw sendError;
    }

  } catch (error) {
    console.error('Error in time selection:', error);
    console.error('Error stack:', error.stack);
    
    // Don't try to reply again if we already failed with 400 (reply token used)
    if (error.statusCode === 400) {
      console.log("Reply token already used, not sending error message");
      return;
    }
    
    return client.replyMessage(event.replyToken, {
      type: "text",
      text: "Sorry, there was an error. Please try again later.",
    });
  }
}

async function handleBookingGuestSelection(event, userId, client, customer, selectedDate, selectedTime) {
  try {
    // Create guest count selection buttons (limit to 4 - LINE limit)
    const guestButtons = [
      { count: 1, label: "1 Guest" },
      { count: 2, label: "2 Guests" },
      { count: 3, label: "3 Guests" },
      { count: 4, label: "4+ Guests" }
    ].map(guest => ({
      type: "postback",
      label: guest.label,
      data: `action=booking_tables&date=${selectedDate}&time=${selectedTime}&guests=${guest.count}`,
      displayText: `Select ${guest.label}`,
    }));

    const dateObj = new Date(selectedDate);
    const dateStr = dateObj.toLocaleDateString("en-GB", { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });

    // Create flex message for guest selection
    const guestBubbles = [
      { count: 1, label: "1 Guest", icon: "👤" },
      { count: 2, label: "2 Guests", icon: "👥" },
      { count: 3, label: "3 Guests", icon: "👥" },
      { count: 4, label: "4+ Guests", icon: "👥" }
    ].map(guest => ({
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: guest.icon,
            size: "xl",
            align: "center"
          },
          {
            type: "text",
            text: guest.label,
            weight: "bold",
            size: "lg",
            color: "#1DB446",
            align: "center",
            margin: "md"
          }
        ]
      },
      action: {
        type: "postback",
        data: `action=booking_tables&date=${selectedDate}&time=${selectedTime}&guests=${guest.count}`,
        displayText: `Select ${guest.label}`
      }
    }));

    return client.replyMessage(event.replyToken, {
      type: "flex",
      altText: "Select Number of Guests",
      contents: {
        type: "carousel",
        contents: guestBubbles
      }
    });

  } catch (error) {
    console.error('Error in guest selection:', error);
    return client.replyMessage(event.replyToken, {
      type: "text",
      text: "Sorry, there was an error. Please try again later.",
    });
  }
}

async function handleBookingTableSelection(event, userId, client, customer, selectedDate, selectedTime, guestCount, page = 0) {
  try {
    await dbConnect();
    
    // Get available tables for the selected date and time
    const availableTables = await getAvailableTables(selectedDate, selectedTime, guestCount);
    
    if (availableTables.length === 0) {
      const noTablesText = `❌ No Available Tables\n\n` +
        `📅 ${new Date(selectedDate).toLocaleDateString("en-GB", { weekday: 'short', month: 'short', day: 'numeric' })} at ${selectedTime}\n` +
        `👥 ${guestCount} guests\n\n` +
        `Sorry, no tables are available for your selected time.\n\n` +
        `💡 Quick Actions:\n` +
        `• Type "book" to try a different date\n` +
        `• Type "help" for more options`;

      return client.replyMessage(event.replyToken, {
        type: "text",
        text: noTablesText,
        quickReply: {
          items: [
            {
              type: "action",
              action: {
                type: "postback",
                label: "⏰ Try Different Time",
                data: `action=booking_time&date=${selectedDate}`,
                displayText: "Select different time"
              }
            },
            {
              type: "action",
              action: {
                type: "postback",
                label: "📅 Try Different Date",
                data: "action=customer_book",
                displayText: "Select different date"
              }
            }
          ]
        }
      });
    }

    const dateObj = new Date(selectedDate);
    const dateStr = dateObj.toLocaleDateString("en-GB", { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });

    // Create flex message for table selection (limit to 12 tables for carousel)
    const limitedTables = availableTables.slice(0, 12);
    const tableBubbles = limitedTables.map(table => ({
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: `Table ${table.id}`,
            weight: "bold",
            size: "xl",
            color: "#1DB446",
            align: "center"
          },
          {
            type: "text",
            text: `${table.capacity} seats`,
            size: "sm",
            color: "#666666",
            align: "center",
            margin: "md"
          },
          {
            type: "text",
            text: "Available",
            size: "xs",
            color: "#00C851",
            align: "center",
            margin: "sm"
          }
        ]
      },
      action: {
        type: "postback",
        data: `action=booking_confirm&date=${selectedDate}&time=${selectedTime}&guests=${guestCount}&table=${table.id}`,
        displayText: `Select Table ${table.id}`
      }
    }));

    // Use reply message for main table selection to avoid duplication
    const tableSelectionMessage = {
      type: "flex",
      altText: "Select Table",
      contents: {
        type: "carousel",
        contents: tableBubbles
      }
    };

    // Send floorplan image and table selection as separate messages using pushMessage
    // to avoid reply token conflicts and prevent looping
    try {
      const floorplanData = await getFloorplanImage();
      if (floorplanData && floorplanData.imageUrl) {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const fullImageUrl = floorplanData.imageUrl.startsWith('http') 
          ? floorplanData.imageUrl 
          : `${baseUrl}${floorplanData.imageUrl}`;
        
        // Send floorplan image using push message to preserve reply token
        await client.pushMessage(userId, {
          type: "image",
          originalContentUrl: fullImageUrl,
          previewImageUrl: fullImageUrl,
        });
        
        // Send explanatory text
        await client.pushMessage(userId, {
          type: "text",
          text: `📍 Restaurant Floorplan\n\nPlease refer to the floorplan above to see table locations. Select your preferred table from the options below:`,
        });
        
        // Send table selection options using reply token
        return client.replyMessage(event.replyToken, tableSelectionMessage);
        
      } else {
        // No floorplan available - send table selection directly with reply token
        return client.replyMessage(event.replyToken, {
          type: "text",
          text: `📋 Available Tables for ${dateStr} at ${selectedTime}\n${guestCount} guests\n\nSelect your preferred table:`,
        });
      }
    } catch (floorplanError) {
      console.error('Error sending floorplan image:', floorplanError);
      // If floorplan fails, send table selection directly using reply token
      return client.replyMessage(event.replyToken, {
        type: "text", 
        text: `📋 Available Tables for ${dateStr} at ${selectedTime}\n${guestCount} guests\n\nSelect your preferred table:`,
      });
    }

  } catch (error) {
    console.error('Error in table selection:', error);
    // Send error message using push to avoid reply token conflicts
    try {
      await client.pushMessage(userId, {
        type: "text",
        text: "Sorry, there was an error loading tables. Please try again later.",
      });
    } catch (pushError) {
      console.error('Error sending error message:', pushError);
    }
  }
}

async function handleBookingPayment(event, userId, client, customer, selectedDate, selectedTime, guestCount, tableId) {
  try {
    await dbConnect();
    
    // Get table and restaurant information
    const floorplan = await Floorplan.findOne();
    const restaurant = await Restaurant.findOne().select('restaurantName _id');
    
    if (!floorplan || !restaurant) {
      return client.replyMessage(event.replyToken, {
        type: "text",
        text: "Restaurant information not available.",
      });
    }

    // Find table details
    const table = floorplan.data.objects.find(obj => obj.objectId === tableId);
    const tableName = table ? `Table ${tableId}` : `Table ${tableId}`;
    const tableCapacity = table?.userData?.maxCapacity || 4;

    // Calculate pricing using the pricing API
    const pricingRequest = {
      restaurantId: restaurant._id.toString(),
      tableId: tableId,
      date: selectedDate,
      time: selectedTime,
      guestCount: parseInt(guestCount),
      tableCapacity: tableCapacity,
      tableLocation: table?.userData?.location || 'center'
    };

    console.log("Calculating pricing for:", pricingRequest);
    
    // Call the pricing API
    const pricingResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/pricing/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pricingRequest)
    });

    let pricingData;
    if (pricingResponse.ok) {
      try {
        pricingData = await pricingResponse.json();
        console.log("Pricing API response:", pricingData);
      } catch (jsonError) {
        console.error('Error parsing pricing response JSON:', jsonError);
        pricingData = null;
      }
    } else {
      console.error("Pricing API error:", pricingResponse.status);
      // Fallback pricing
      pricingData = {
        success: true,
        basePrice: 100,
        finalPrice: 100,
        currency: 'THB',
        breakdown: {
          basePrice: { value: 100, reason: 'Base table booking fee' }
        }
      };
    }

    // Ensure we have a valid finalPrice
    if (!pricingData.finalPrice) {
      console.error("No finalPrice in pricing data:", pricingData);
      pricingData.finalPrice = pricingData.basePrice || 100;
    }

    const dateObj = new Date(selectedDate);
    const dateStr = dateObj.toLocaleDateString("en-GB", { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Calculate end time (assuming 2-hour booking duration)
    const [startHour, startMinute] = selectedTime.split(':').map(Number);
    const endTime = new Date();
    endTime.setHours(startHour + 2, startMinute);
    const endTimeStr = endTime.toTimeString().slice(0, 5);

    // Create flex message for payment
    const paymentMessage = {
      type: "flex",
      altText: "Payment Required",
      contents: {
        type: "bubble",
        header: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "💳 Payment Required",
              weight: "bold",
              size: "xl",
              color: "#1DB446",
              align: "center"
            }
          ],
          paddingAll: "lg"
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: `${restaurant.restaurantName}`,
              weight: "bold",
              size: "lg",
              color: "#333333",
              align: "center",
              margin: "md"
            },
            {
              type: "separator",
              margin: "lg"
            },
            {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    {
                      type: "text",
                      text: "📅 Date:",
                      size: "sm",
                      color: "#666666",
                      flex: 0
                    },
                    {
                      type: "text",
                      text: dateStr,
                      size: "sm",
                      color: "#333333",
                      align: "end"
                    }
                  ],
                  margin: "sm"
                },
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    {
                      type: "text",
                      text: "🕐 Time:",
                      size: "sm",
                      color: "#666666",
                      flex: 0
                    },
                    {
                      type: "text",
                      text: `${selectedTime} - ${endTimeStr}`,
                      size: "sm",
                      color: "#333333",
                      align: "end"
                    }
                  ],
                  margin: "sm"
                },
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    {
                      type: "text",
                      text: "👥 Guests:",
                      size: "sm",
                      color: "#666666",
                      flex: 0
                    },
                    {
                      type: "text",
                      text: `${guestCount} guests`,
                      size: "sm",
                      color: "#333333",
                      align: "end"
                    }
                  ],
                  margin: "sm"
                },
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    {
                      type: "text",
                      text: "🍽️ Table:",
                      size: "sm",
                      color: "#666666",
                      flex: 0
                    },
                    {
                      type: "text",
                      text: `${tableName} (up to ${tableCapacity} seats)`,
                      size: "sm",
                      color: "#333333",
                      align: "end"
                    }
                  ],
                  margin: "sm"
                },
                {
                  type: "separator",
                  margin: "lg"
                },
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    {
                      type: "text",
                      text: "💰 Total Amount:",
                      weight: "bold",
                      size: "lg",
                      color: "#1DB446",
                      flex: 0
                    },
                    {
                      type: "text",
                      text: `${pricingData.finalPrice} ${pricingData.currency}`,
                      weight: "bold",
                      size: "lg",
                      color: "#1DB446",
                      align: "end"
                    }
                  ],
                  margin: "sm"
                }
              ],
              paddingAll: "lg"
            }
          ],
          paddingAll: "lg"
        },
        footer: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "button",
              style: "primary",
              height: "sm",
              color: "#1DB446",
              action: {
                type: "postback",
                data: `action=booking_payment_process&date=${selectedDate}&time=${selectedTime}&guests=${guestCount}&table=${tableId}&amount=${pricingData.finalPrice}`,
                displayText: "Pay and Confirm Booking",
                label: "💳 Pay & Confirm"
              }
            },
            {
              type: "button",
              style: "secondary",
              height: "sm",
              action: {
                type: "postback",
                data: "action=customer_book",
                displayText: "Cancel booking",
                label: "Cancel"
              },
              margin: "sm"
            }
          ],
          paddingAll: "lg"
        }
      }
    };

    return client.replyMessage(event.replyToken, paymentMessage);

  } catch (error) {
    console.error('Error in booking payment:', error);
    return client.replyMessage(event.replyToken, {
      type: "text",
      text: "Sorry, there was an error processing payment. Please try again later.",
    });
  }
}

async function handleBookingPaymentProcess(event, userId, client, customer, selectedDate, selectedTime, guestCount, tableId, amount) {
  try {
    await dbConnect();
    
    console.log(`Processing payment of ${amount} THB for booking...`);
    console.log(`Amount type: ${typeof amount}, Amount value: ${amount}`);
    console.log(`Booking details: ${selectedDate} ${selectedTime}, ${guestCount} guests, table ${tableId}`);
    
    // Validate amount
    if (!amount || isNaN(amount) || amount <= 0) {
      console.error("Invalid amount:", amount, "Type:", typeof amount);
      console.error("Full postback data:", event.postback?.data);
      return client.replyMessage(event.replyToken, {
        type: "text",
        text: `Invalid payment amount: ${amount}. Please try booking again.`,
      });
    }
    
    // Simulate payment processing (in a real implementation, you would integrate with a payment gateway)
    console.log(`Simulating payment processing for ${amount} THB...`);
    
    // Simulate payment success (you can add actual payment gateway integration here)
    const paymentSuccess = true; // This would be the result from your payment gateway
    
    if (paymentSuccess) {
      console.log("Payment successful, proceeding to booking completion");
      // Payment successful, proceed to booking completion
      // Create pricing data object to pass to booking completion
      const pricingData = {
        basePrice: 100, // Default base price, should match your pricing API
        finalPrice: amount,
        currency: 'THB',
        breakdown: {
          demandFactor: { value: 1, reason: 'Standard demand' },
          temporalFactor: { value: 1, reason: 'Regular timing' },
          historicalFactor: { value: 1, reason: 'Standard historical data' },
          capacityFactor: { value: 1, reason: 'Standard capacity' },
          holidayFactor: { value: 1, reason: 'No holiday' }
        }
      };
      return await handleBookingCompletion(event, userId, client, customer, selectedDate, selectedTime, guestCount, tableId, pricingData);
    } else {
      console.log("Payment failed");
      // Payment failed
      return client.replyMessage(event.replyToken, {
        type: "template",
        altText: "Payment Failed",
        template: {
          type: "buttons",
          text: `❌ Payment Failed\n\nWe couldn't process your payment of ${amount} THB.\n\nPlease try again or contact the restaurant for assistance.`,
          actions: [
            {
              type: "postback",
              label: "Try Again",
              data: `action=booking_confirm&date=${selectedDate}&time=${selectedTime}&guests=${guestCount}&table=${tableId}`,
              displayText: "Try payment again",
            },
            {
              type: "postback",
              label: "Cancel",
              data: "action=customer_book",
              displayText: "Cancel booking",
            }
          ],
        },
      });
    }

  } catch (error) {
    console.error('Error processing payment:', error);
    console.error('Error stack:', error.stack);
    return client.replyMessage(event.replyToken, {
      type: "text",
      text: "Sorry, there was an error processing your payment. Please try again later.",
    });
  }
}

async function handleBookingConfirmation(event, userId, client, customer, selectedDate, selectedTime, guestCount, tableId) {
  try {
    await dbConnect();
    
    // Get table and restaurant information
    const floorplan = await Floorplan.findOne();
    const restaurant = await Restaurant.findOne().select('restaurantName');
    
    if (!floorplan || !restaurant) {
      return client.replyMessage(event.replyToken, {
        type: "text",
        text: "Restaurant information not available.",
      });
    }

    // Find table details
    const table = floorplan.data.objects.find(obj => obj.objectId === tableId);
    const tableName = table ? `Table ${tableId}` : `Table ${tableId}`;
    const tableCapacity = table?.userData?.maxCapacity || 4;

    const dateObj = new Date(selectedDate);
    const dateStr = dateObj.toLocaleDateString("en-GB", { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Calculate end time (assuming 2-hour booking duration)
    const [startHour, startMinute] = selectedTime.split(':').map(Number);
    const endTime = new Date();
    endTime.setHours(startHour + 2, startMinute);
    const endTimeStr = endTime.toTimeString().slice(0, 5);

    // Create flex message for booking confirmation
    const confirmationMessage = {
      type: "flex",
      altText: "Confirm Your Booking",
      contents: {
        type: "bubble",
        header: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "Confirm Your Booking",
              weight: "bold",
              size: "xl",
              color: "#1DB446",
              align: "center"
            }
          ],
          backgroundColor: "#F0F8F0",
          paddingAll: "lg"
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: restaurant.restaurantName,
                  weight: "bold",
                  size: "lg",
                  color: "#333333",
                  align: "center"
                },
                {
                  type: "separator",
                  margin: "lg"
                },
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    {
                      type: "text",
                      text: "📅 Date:",
                      size: "sm",
                      color: "#666666",
                      flex: 0
                    },
                    {
                      type: "text",
                      text: dateStr,
                      size: "sm",
                      color: "#333333",
                      align: "end"
                    }
                  ],
                  margin: "md"
                },
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    {
                      type: "text",
                      text: "🕐 Time:",
                      size: "sm",
                      color: "#666666",
                      flex: 0
                    },
                    {
                      type: "text",
                      text: `${selectedTime} - ${endTimeStr}`,
                      size: "sm",
                      color: "#333333",
                      align: "end"
                    }
                  ],
                  margin: "sm"
                },
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    {
                      type: "text",
                      text: "👥 Guests:",
                      size: "sm",
                      color: "#666666",
                      flex: 0
                    },
                    {
                      type: "text",
                      text: `${guestCount} ${guestCount === 1 ? 'guest' : 'guests'}`,
                      size: "sm",
                      color: "#333333",
                      align: "end"
                    }
                  ],
                  margin: "sm"
                },
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    {
                      type: "text",
                      text: "🍽️ Table:",
                      size: "sm",
                      color: "#666666",
                      flex: 0
                    },
                    {
                      type: "text",
                      text: `${tableName} (up to ${tableCapacity} seats)`,
                      size: "sm",
                      color: "#333333",
                      align: "end"
                    }
                  ],
                  margin: "sm"
                }
              ]
            }
          ],
          paddingAll: "lg"
        },
        footer: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "button",
              style: "primary",
              height: "sm",
              color: "#1DB446",
              action: {
                type: "postback",
                data: `action=booking_complete&date=${selectedDate}&time=${selectedTime}&guests=${guestCount}&table=${tableId}`,
                displayText: "Confirm and book",
                label: "Confirm Booking"
              }
            },
            {
              type: "button",
              style: "secondary",
              height: "sm",
              action: {
                type: "postback",
                data: "action=customer_book",
                displayText: "Start over",
                label: "Cancel"
              },
              margin: "sm"
            }
          ],
          paddingAll: "lg"
        }
      }
    };

    return client.replyMessage(event.replyToken, confirmationMessage);

  } catch (error) {
    console.error('Error in booking confirmation:', error);
    return client.replyMessage(event.replyToken, {
      type: "text",
      text: "Sorry, there was an error. Please try again later.",
    });
  }
}

async function handleBookingCompletion(event, userId, client, customer, selectedDate, selectedTime, guestCount, tableId, pricingData = null) {
  try {
    console.log("🚀 handleBookingCompletion called with:", {
      selectedDate,
      selectedTime,
      guestCount,
      tableId,
      pricingData
    });
    await dbConnect();
    
    // Get restaurant and floorplan information
    const restaurant = await Restaurant.findOne();
    const floorplan = await Floorplan.findOne();
    
    if (!restaurant || !floorplan) {
      return client.replyMessage(event.replyToken, {
        type: "text",
        text: "Restaurant information not available.",
      });
    }

    // Calculate end time (2-hour booking duration)
    const [startHour, startMinute] = selectedTime.split(':').map(Number);
    const endTime = new Date();
    endTime.setHours(startHour + 2, startMinute);
    const endTimeStr = endTime.toTimeString().slice(0, 5);

    // Create booking using existing booking API logic
    const bookingData = {
      tableId: tableId,
      date: selectedDate,
      startTime: selectedTime,
      endTime: endTimeStr,
      guestCount: parseInt(guestCount),
      restaurantId: restaurant._id,
      customerData: {
        _id: customer._id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        contactNumber: customer.contactNumber || 'Not provided'
      },
      pricingData: pricingData
    };

    // Use existing booking creation logic
    console.log("📝 Creating booking with data:", JSON.stringify(bookingData, null, 2));
    const bookingResponse = await createBookingFromLine(bookingData, floorplan._id);
    console.log("📝 Booking response:", JSON.stringify(bookingResponse, null, 2));
    
    if (bookingResponse.success) {
      console.log("✅ Booking creation successful, sending pending confirmation message");
      const booking = bookingResponse.booking;
      const dateObj = new Date(selectedDate);
      const dateStr = dateObj.toLocaleDateString("en-GB", { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

      const bookingText = `📝 Booking Submitted!\n\n` +
        `🔖 Ref: ${booking.bookingRef}\n` +
        `📅 Date: ${dateStr}\n` +
        `⏰ Time: ${selectedTime} - ${endTimeStr}\n` +
        `👥 Guests: ${guestCount}\n` +
        `🪑 Table: ${tableId}\n\n` +
        `⏳ PENDING CONFIRMATION\n\n` +
        `💡 Quick Actions:\n` +
        `• Type "bookings" to view all your reservations\n` +
        `• Type "book" to make another reservation\n` +
        `• Type "help" for more options`;

      console.log("📤 Sending pending booking message to LINE API");
      console.log("Message length:", bookingText.length);
      
      // Send simple text message first to avoid quick reply issues
      return client.replyMessage(event.replyToken, {
        type: "text",
        text: bookingText
      });
    } else {
      return client.replyMessage(event.replyToken, {
        type: "text",
        text: `Booking failed: ${bookingResponse.error}\n\nPlease try again or contact the restaurant.`,
      });
    }

  } catch (error) {
    console.error('Error completing booking:', error);
    return client.replyMessage(event.replyToken, {
      type: "text",
      text: "Sorry, there was an error completing your booking. Please try again later.",
    });
  }
}

// Helper functions for booking flow
function parseBookingParams(postbackData) {
  const params = {};
  const parts = postbackData.split('&');
  
  parts.forEach(part => {
    if (part.includes('date=')) {
      params.date = part.split('date=')[1];
    } else if (part.includes('time=')) {
      params.time = part.split('time=')[1];
    } else if (part.includes('guests=')) {
      params.guests = part.split('guests=')[1];
    } else if (part.includes('table=')) {
      params.table = part.split('table=')[1];
    } else if (part.includes('page=')) {
      params.page = parseInt(part.split('page=')[1]);
    } else if (part.includes('amount=')) {
      params.amount = parseFloat(part.split('amount=')[1]);
    }
  });
  
  return params;
}

function generateAvailableDates(days, restaurant) {
  const dates = [];
  const today = new Date();
  
  // Start from today (i = 0) instead of tomorrow (i = 1)
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    // Check if restaurant is open on this day
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[date.getDay()];
    const dayHours = restaurant?.openingHours?.[dayName];
    
    // Only include dates when restaurant is open
    if (dayHours && dayHours.open && dayHours.close) {
      const dayNameShort = date.toLocaleDateString("en-GB", { weekday: 'short' });
      const monthDay = date.toLocaleDateString("en-GB", { month: 'short', day: 'numeric' });
      
      // Add "Today" label for today's date
      const label = i === 0 ? `Today ${monthDay}` : `${dayNameShort} ${monthDay}`;
      
      dates.push({
        label: label,
        value: date.toISOString().split('T')[0]
      });
    }
  }
  
  return dates;
}

function parseOperatingHours(restaurant, selectedDate) {
  // Get the day of the week for the selected date
  const dateObj = new Date(selectedDate);
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[dateObj.getDay()];
  
  console.log(`Looking for hours for day: ${dayName}`);
  
  // Get operating hours for the specific day
  const dayHours = restaurant.openingHours?.[dayName];
  console.log(`Day hours for ${dayName}:`, dayHours);
  
  if (dayHours && dayHours.open && dayHours.close) {
    console.log(`Using specific hours for ${dayName}: ${dayHours.open} - ${dayHours.close}`);
    return {
      open: dayHours.open,
      close: dayHours.close
    };
  }
  
  // Fallback to default hours if no specific day hours
  console.log(`No specific hours for ${dayName}, using default: 09:00 - 22:00`);
  return { open: "09:00", close: "22:00" };
}

function generateTimeSlots(openTime, closeTime, intervalMinutes = 30, selectedDate = null) {
  const slots = [];
  const [openHour, openMinute] = openTime.split(':').map(Number);
  const [closeHour, closeMinute] = closeTime.split(':').map(Number);
  
  console.log(`Generating time slots from ${openTime} to ${closeTime}`);
  
  const open = new Date();
  open.setHours(openHour, openMinute, 0, 0);
  
  const close = new Date();
  close.setHours(closeHour, closeMinute, 0, 0);
  
  const current = new Date(open);
  
  // Get current time for filtering past slots
  const now = new Date();
  const isToday = selectedDate && new Date(selectedDate).toDateString() === now.toDateString();
  
  console.log(`Selected date: ${selectedDate}, Is today: ${isToday}`);
  console.log(`Current time: ${now.toTimeString().slice(0, 5)}`);
  
  // Detect 24-hour restaurants (various formats)
  const is24Hour = (
    (openHour === 0 && openMinute === 0 && closeHour === 23 && closeMinute === 59) || // 00:00-23:59
    (openHour === 0 && openMinute === 0 && closeHour === 0 && closeMinute === 0) ||   // 00:00-00:00 (next day)
    (openHour === closeHour && openMinute === closeMinute) ||                         // Same time (24h)
    (openTime === closeTime)                                                          // Same string
  );
  
  const lastBookingTime = new Date(close);
  
  if (!is24Hour) {
    // Add 1-hour buffer before closing for non-24-hour restaurants
    lastBookingTime.setHours(closeHour - 1, closeMinute);
  }
  
  console.log(`Is 24-hour restaurant: ${is24Hour}`);
  console.log(`Last booking time: ${lastBookingTime.toTimeString().slice(0, 5)}`);
  
  while (current < lastBookingTime) {
    const timeStr = current.toTimeString().slice(0, 5);
    const currentHour = current.getHours();
    
    // For 24-hour restaurants, allow all times. For others, filter unreasonable times
    if (is24Hour || (currentHour >= 5 && currentHour <= 23)) {
      
      // Filter out past times if booking for today
      if (isToday) {
        const slotTime = new Date();
        slotTime.setHours(currentHour, current.getMinutes(), 0, 0);
        
        // Only add slots that are at least 1 hour in the future
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
        
        if (slotTime >= oneHourFromNow) {
          slots.push(timeStr);
          console.log(`Added future time slot: ${timeStr}`);
        } else {
          console.log(`Skipped past time slot: ${timeStr} (current: ${now.toTimeString().slice(0, 5)})`);
        }
      } else {
        // For future dates, add all valid time slots
        slots.push(timeStr);
        console.log(`Added time slot: ${timeStr}`);
      }
    } else {
      console.log(`Skipped time slot: ${timeStr} (hour: ${currentHour})`);
    }
    
    current.setMinutes(current.getMinutes() + intervalMinutes);
  }
  
  console.log(`Generated ${slots.length} time slots total`);
  return slots;
}

async function getAvailableTables(selectedDate, selectedTime, guestCount) {
  try {
    await dbConnect();
    
    // Calculate end time (2-hour booking duration)
    const [startHour, startMinute] = selectedTime.split(':').map(Number);
    const endTime = new Date();
    endTime.setHours(startHour + 2, startMinute);
    const endTimeStr = endTime.toTimeString().slice(0, 5);
    
    // Get floorplan
    const floorplan = await Floorplan.findOne();
    if (!floorplan) return [];
    
    // Get existing bookings for the selected date and time
    const existingBookings = await Booking.find({
      date: new Date(selectedDate),
      $or: [
        {
          startTime: { $lt: endTimeStr },
          endTime: { $gt: selectedTime }
        }
      ],
      status: { $in: ['pending', 'confirmed'] }
    });
    
    const bookedTableIds = new Set(existingBookings.map(booking => booking.tableId));
    
    // Filter available tables
    const availableTables = floorplan.data.objects
      .filter(obj => obj.type === 'table' || obj.objectId.startsWith('t'))
      .filter(obj => !bookedTableIds.has(obj.objectId))
      .filter(obj => {
        const capacity = obj.userData?.maxCapacity || 4;
        return capacity >= parseInt(guestCount);
      })
      .map(obj => ({
        id: obj.objectId,
        capacity: obj.userData?.maxCapacity || 4,
        name: obj.userData?.name || `Table ${obj.objectId}`
      }))
      .sort((a, b) => a.capacity - b.capacity); // Sort by capacity
    
    return availableTables;
    
  } catch (error) {
    console.error('Error getting available tables:', error);
    return [];
  }
}

async function createBookingFromLine(bookingData, floorplanId) {
  try {
    // This function replicates the booking creation logic from your existing API
    const { tableId, date, startTime, endTime, guestCount, restaurantId, customerData, pricingData } = bookingData;
    
    // Check table availability
    const isAvailable = await Booking.isTableAvailable(tableId, date, startTime, endTime);
    if (!isAvailable) {
      return { success: false, error: 'Table is no longer available' };
    }
    
    // Create booking with PENDING status for staff confirmation
    const booking = new Booking({
      userId: customerData._id,
      restaurantId: restaurantId,
      floorplanId: floorplanId,
      tableId: tableId,
      date: new Date(date),
      startTime: startTime,
      endTime: endTime,
      guestCount: guestCount,
      status: 'pending', // Changed to pending for staff confirmation
      customerName: `${customerData.firstName} ${customerData.lastName}`.trim(),
      customerEmail: customerData.email,
      customerPhone: customerData.contactNumber,
      pricing: pricingData || {
        basePrice: 100,
        finalPrice: 100,
        currency: 'THB',
        breakdown: {
          demandFactor: { value: 1, reason: 'Standard demand' },
          temporalFactor: { value: 1, reason: 'Regular timing' },
          historicalFactor: { value: 1, reason: 'Standard historical data' },
          capacityFactor: { value: 1, reason: 'Standard capacity' },
          holidayFactor: { value: 1, reason: 'No holiday' }
        }
      }
    });
    
    // Add initial history entry
    booking.addToHistory('created', {
      tableId,
      guestCount,
      startTime,
      endTime,
      method: 'line_chat'
    });
    
    await booking.save();
    
    // Send notification to staff about new pending booking
    try {
      if (booking && restaurantId) {
        await notifyStaffOfNewBooking(booking, restaurantId);
        console.log('✅ Staff notification sent for booking:', booking.bookingRef);
      } else {
        console.log('⚠️ Missing booking or restaurantId for notification');
      }
    } catch (notificationError) {
      console.error('❌ Failed to send staff notification:', notificationError);
      console.error('❌ Notification error details:', notificationError.stack);
      // Don't fail the booking creation if notification fails
    }

    // Note: LINE customer confirmation is handled in the booking completion flow
    // to avoid reply token conflicts. The confirmation message is sent as a reply
    // in the handleBookingCompletion function.
    
    // Update floorplan table status
    await Floorplan.updateOne(
      { _id: floorplanId, 'data.objects.objectId': tableId },
      {
        $set: {
          'data.objects.$.userData.bookingStatus': 'booked',
          'data.objects.$.userData.currentBooking': booking._id
        }
      }
    );
    
    return { success: true, booking };
    
  } catch (error) {
    console.error('Error creating booking from LINE:', error);
    return { success: false, error: error.message };
  }
}

async function handleEvent(event) {
  try {
    console.log("Handling event:", event.type, "from user:", event.source.userId);
    
    const userId = event.source.userId;

    // Check if user is in staff database first
    const staffCheck = await checkStaffInDatabase(userId);
    const staffMember = staffCheck.staff;
    
    console.log("Staff check result:", { exists: staffCheck.exists, hasStaff: !!staffMember });

  if (event.type === "message" && event.message.type === "text") {
    const messageText = event.message.text.toLowerCase();

    // Debug command to show user info
    if (messageText === 'debug' || messageText === 'info' || messageText === 'whoami') {
      try {
        const profile = await client.getProfile(userId);
        return client.replyMessage(event.replyToken, {
          type: "text",
          text: `🔍 **Debug Info:**\n\n📱 **Line User ID:**\n${userId}\n\n👤 **Display Name:**\n${profile.displayName}\n\n🆔 **Line ID (if set):**\n${profile.userId || 'Not available'}\n\n📸 **Profile Picture:**\n${profile.pictureUrl || 'Not available'}\n\n⚡ **Status Message:**\n${profile.statusMessage || 'Not set'}`
        });
      } catch (error) {
        console.error('Error getting profile for debug:', error);
        return client.replyMessage(event.replyToken, {
          type: "text",
          text: `🔍 **Debug Info:**\n\n📱 **Line User ID:**\n${userId}\n\n❌ Could not fetch additional profile info`
        });
      }
    }
    
    // If user is in database but not authenticated (needs password)
    if (staffCheck.exists && !staffMember) {
      // This case shouldn't happen with current logic, but keeping for safety
      return client.replyMessage(event.replyToken, {
        type: "text",
        text: "Please contact your manager for assistance.",
      });
    }
    
    // If user is in database and authenticated (staff member)
    if (staffMember) {
      // Staff menu
      return client.replyMessage(event.replyToken, {
        type: "template",
        altText: "Staff Menu",
        template: {
          type: "buttons",
          text: `Welcome ${staffMember.displayName}!\n${staffMember.restaurantId.restaurantName} - ${staffMember.role}`,
          actions: [
            ...(staffMember.permissions.canViewBookings ? [{
              type: "postback",
              label: "View Bookings",
              data: "action=show_bookings",
              displayText: "Show bookings",
            }] : []),
            ...(staffMember.permissions.canUpdateBookings ? [{
              type: "postback",
              label: "Manage Bookings",
              data: "action=manage_bookings",
              displayText: "Manage bookings",
            }] : []),
            {
              type: "postback",
              label: "Show Floorplan",
              data: "action=show_floorplan",
              displayText: "Show restaurant layout",
            },
            {
              type: "postback",
              label: "Help",
              data: "action=help",
              displayText: "Show help",
            },
          ],
        },
      });
    }
    
    // If user is NOT in database (regular customer or unregistered)
    if (!staffCheck.exists) {
        // Check if user is trying to register with QR token format: register TOKEN
        if (messageText.startsWith('register ')) {
          const token = messageText.replace('register ', '').trim().replace(/\n/g, '');
          
          console.log('🔍 Registration attempt:', { 
            messageText, 
            extractedToken: token, 
            tokenLength: token.length,
            userId 
          });
          
          if (token.length >= 8) {
            try {
              // Verify the registration token
              const verifyResponse = await fetch(`${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/staff/verify-qr`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token }),
              });

              console.log('🔍 Token verification response:', verifyResponse.status);

              if (verifyResponse.ok) {
                let tokenData;
                try {
                  tokenData = await verifyResponse.json();
                } catch (jsonError) {
                  console.error('Error parsing verify response JSON:', jsonError);
                  return client.replyMessage(event.replyToken, {
                    type: "text",
                    text: "❌ System error during registration. Please contact your manager.",
                  });
                }
                const profile = await client.getProfile(userId);

                // Complete the registration
                const completeResponse = await fetch(`${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/staff/complete-registration`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    token,
                    lineUserId: userId,
                    lineId: profile.displayName.toLowerCase().replace(/\s+/g, '') // Use display name as fallback Line ID
                  }),
                });

                if (completeResponse.ok) {
                  let registrationResult;
                  try {
                    registrationResult = await completeResponse.json();
                  } catch (jsonError) {
                    console.error('Error parsing complete response JSON:', jsonError);
                    return client.replyMessage(event.replyToken, {
                      type: "text",
                      text: "❌ Registration completed but system error occurred. Please contact your manager.",
                    });
                  }
                  return client.replyMessage(event.replyToken, {
                    type: "text",
                    text: `✅ Registration successful!\n\nWelcome ${tokenData.registrationData.displayName}!\nRole: ${tokenData.registrationData.role}\n\nYou can now use staff commands. Type anything to see the staff menu.`,
                  });
                } else {
                  let error;
                  try {
                    error = await completeResponse.json();
                  } catch (jsonError) {
                    console.error('Error parsing error response JSON:', jsonError);
                    error = { error: 'Unknown error occurred' };
                  }
                  return client.replyMessage(event.replyToken, {
                    type: "text",
                    text: `❌ Registration failed: ${error.error}\n\nPlease try again or contact your manager.`,
                  });
                }
              } else {
                return client.replyMessage(event.replyToken, {
                  type: "text",
                  text: "❌ Invalid or expired registration code.\n\nPlease get a new QR code from your manager.",
                });
              }
            } catch (error) {
              console.error('QR Registration error:', error);
              return client.replyMessage(event.replyToken, {
                type: "text",
                text: "❌ Registration failed due to system error.\nPlease try again later.",
              });
            }
          } else {
            return client.replyMessage(event.replyToken, {
              type: "text",
              text: "❌ Invalid registration code format.\n\nPlease use: register [CODE]\nExample: register ABC12345",
            });
          }
        }

        // Check if user is trying to register with old format: lineId|nickname|password (keep for backward compatibility)
        if (messageText.includes('|')) {
          const parts = event.message.text.split('|');
          if (parts.length === 3) {
            const [lineId, nickname, password] = parts.map(part => part.trim());

            // Validate password
            if (password !== '123') {
              return client.replyMessage(event.replyToken, {
                type: "text",
                text: "❌ Incorrect password!\n\nPlease contact your manager for the correct staff password.",
              });
            }

            // Register staff member
            try {
              const profile = await client.getProfile(userId);

              const response = await fetch(`${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/staff`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  lineId: lineId.toLowerCase(),
                  displayName: nickname,
                  restaurantId: await getRestaurantId(), // Get restaurant ID dynamically
                  role: 'waiter', // Default role
                  lineUserId: userId // Store the Line User ID for future authentication
                }),
              });

              if (response.ok) {
                return client.replyMessage(event.replyToken, {
                  type: "text",
                  text: `✅ Registration successful!\n\nWelcome ${nickname}!\nYou are now registered as a staff member.\n\nYou can now use the staff commands. Type anything to see the staff menu.`,
                });
              } else {
                let error;
                try {
                  error = await response.json();
                } catch (jsonError) {
                  console.error('Error parsing response JSON:', jsonError);
                  error = { error: 'System error occurred' };
                }
                return client.replyMessage(event.replyToken, {
                  type: "text",
                  text: `❌ Registration failed: ${error.error}\n\nPlease try again or contact your manager.`,
                });
              }
            } catch (error) {
              console.error('Staff registration error:', error);
              return client.replyMessage(event.replyToken, {
                type: "text",
                text: "❌ Registration failed due to system error.\nPlease try again later.",
              });
            }
          }
        }
      
      // All non-staff users are treated as customers automatically
      
      // Default message for non-staff - automatically treat as customer
      try {
        return await handleCustomerMode(event, userId, client);
      } catch (error) {
        console.error("Error in handleCustomerMode:", error);
        // Don't try to reply again if we already failed with 400 (reply token used)
        if (error.statusCode === 400) {
          console.log("Reply token already used in handleCustomerMode, skipping");
          return;
        }
        throw error;
       }
    }
  } 
  
  if (event.type === "postback") {
    const postbackData = event.postback.data;

    // Staff registration removed - focusing on customer experience
    
    // Customer mode is now handled automatically for non-staff users

    // Handle customer postback actions first (for non-staff users)
    if (postbackData.startsWith("action=customer_") || postbackData.startsWith("action=booking_") || postbackData.startsWith("action=cancel_")) {
      console.log("🎯 Handling customer postback:", postbackData);
      try {
        const result = await handleCustomerPostback(event, userId, client, postbackData);
        console.log("✅ Customer postback handled successfully");
        return result;
      } catch (error) {
        console.error("❌ Error handling customer postback:", error);
        // Don't try to reply again if we already failed with 400 (reply token used)
        if (error.statusCode === 400) {
          console.log("Reply token already used in handleCustomerPostback, skipping");
          return;
        }
        throw error;
      }
    }

    // For all other postback actions, check if user is authenticated staff
    if (!staffMember) {
      return client.replyMessage(event.replyToken, {
        type: "text",
        text: "Sorry, you are not authorized to use this system.",
      });
    }

    if (postbackData === "action=show_bookings") {
      if (!staffMember.permissions.canViewBookings) {
        return client.replyMessage(event.replyToken, {
          type: "text",
          text: "You don't have permission to view bookings.",
        });
      }

      try {
        const bookings = await getBookings(staffMember.restaurantId._id);
        if (bookings.length === 0) {
          return client.replyMessage(event.replyToken, {
            type: "text",
            text: "📋 No active bookings found for today or tomorrow.\n\nAll bookings are up to date! ✅",
          });
        }

        // Show bookings in a simple text format (easier to read all at once)
        const bookingsList = bookings.map((booking, index) => {
          const dateObj = new Date(booking.date);
          const dateStr = dateObj.toLocaleDateString("en-GB");
          const statusEmoji = {
            'pending': '⏳',
            'confirmed': '✅',
            'cancelled': '❌',
            'completed': '✔️'
          };
          
          return `${index + 1}. ${booking.customerName}\n` +
                 `📅 ${dateStr} ${booking.startTime}-${booking.endTime}\n` +
                 `👥 ${booking.guestCount} guests | 🍽️ Table ${booking.tableId}\n` +
                 `${statusEmoji[booking.status] || '📋'} ${booking.status.toUpperCase()}\n` +
                 `📝 Ref: ${booking.bookingRef}`;
        }).join('\n\n');

        const totalText = `📋 ALL BOOKINGS (${bookings.length})\n` +
                         `${staffMember.restaurantId.restaurantName}\n\n` +
                         bookingsList;

        // Split message if too long (Line has character limits)
        if (totalText.length > 2000) {
          const firstHalf = bookings.slice(0, Math.ceil(bookings.length / 2));
          const secondHalf = bookings.slice(Math.ceil(bookings.length / 2));
          
          const firstMessage = `📋 BOOKINGS (Part 1/${bookings.length})\n\n` +
            firstHalf.map((booking, index) => {
              const dateObj = new Date(booking.date);
              const dateStr = dateObj.toLocaleDateString("en-GB");
              const statusEmoji = {
                'pending': '⏳',
                'confirmed': '✅', 
                'cancelled': '❌',
                'completed': '✔️'
              };
              return `${index + 1}. ${booking.customerName}\n📅 ${dateStr} ${booking.startTime}-${booking.endTime}\n👥 ${booking.guestCount} guests | ${statusEmoji[booking.status]} ${booking.status.toUpperCase()}`;
            }).join('\n\n');

          const secondMessage = `📋 BOOKINGS (Part 2/${bookings.length})\n\n` +
            secondHalf.map((booking, index) => {
              const dateObj = new Date(booking.date);
              const dateStr = dateObj.toLocaleDateString("en-GB");
              const statusEmoji = {
                'pending': '⏳',
                'confirmed': '✅',
                'cancelled': '❌', 
                'completed': '✔️'
              };
              return `${index + firstHalf.length + 1}. ${booking.customerName}\n📅 ${dateStr} ${booking.startTime}-${booking.endTime}\n👥 ${booking.guestCount} guests | ${statusEmoji[booking.status]} ${booking.status.toUpperCase()}`;
            }).join('\n\n');

          return client.replyMessage(event.replyToken, [
            { type: "text", text: firstMessage },
            { type: "text", text: secondMessage }
          ]);
        }

        return client.replyMessage(event.replyToken, {
          type: "text",
          text: totalText,
        });
      } catch (error) {
        console.error('Error fetching bookings:', error);
        return client.replyMessage(event.replyToken, {
          type: "text",
          text: "❌ Error fetching bookings. Please try again.",
        });
      }
    }
    
    else if (postbackData === "action=manage_bookings") {
      if (!staffMember.permissions.canUpdateBookings) {
        return client.replyMessage(event.replyToken, {
          type: "text",
          text: "You don't have permission to manage bookings.",
        });
      }

      return client.replyMessage(event.replyToken, {
        type: "template",
        altText: "Booking Management",
        template: {
          type: "buttons",
          text: "Choose a booking management option:",
          actions: [
            {
              type: "postback",
              label: "View All Bookings",
              data: "action=show_bookings",
            },
            {
              type: "postback",
              label: "⏰ Today's Bookings",
              data: "action=today_bookings",
            },
            {
              type: "postback",
              label: "Tomorrow's Bookings",
              data: "action=tomorrow_bookings",
            },
            {
              type: "postback",
              label: "Search Booking",
              data: "action=search_booking",
            },
          ],
        },
      });
    }
    
    else if (postbackData.startsWith("action=booking_details&id=")) {
      const bookingId = postbackData.split("id=")[1];
      try {
        const booking = await getBookingDetails(bookingId, staffMember);
        if (!booking) {
          return client.replyMessage(event.replyToken, {
            type: "text",
            text: "Booking not found.",
          });
        }

        const dateObj = new Date(booking.date);
        const dateStr = dateObj.toLocaleDateString("en-GB");
        
        const customerInfo = booking.userId 
          ? `${booking.userId.firstName} ${booking.userId.lastName}`.trim()
          : booking.customerName;

        const detailsText = `📋 Booking Details\n\n` +
          `👤 Customer: ${customerInfo}\n` +
          `📧 Email: ${booking.customerEmail}\n` +
          `📞 Phone: ${booking.customerPhone}\n` +
          `📅 Date: ${dateStr}\n` +
          `⏰ Time: ${booking.startTime} - ${booking.endTime}\n` +
          `👥 Guests: ${booking.guestCount}\n` +
          `🏷️ Status: ${booking.status.toUpperCase()}\n` +
          `🍽️ Table: ${booking.tableId}\n` +
          `📝 Ref: ${booking.bookingRef}\n` +
          `${booking.specialRequests ? `💬 Notes: ${booking.specialRequests}` : ''}`;

        const actions = [];
        
        if (booking.status === 'pending' && staffMember.permissions.canUpdateBookings) {
          actions.push({
            type: "postback",
            label: "Confirm",
            data: `action=confirm_booking&id=${booking._id}`,
          });
        }
        
        if (booking.status === 'confirmed' && staffMember.permissions.canUpdateBookings) {
          actions.push({
            type: "postback",
            label: "Complete",
            data: `action=complete_booking&id=${booking._id}`,
          });
        }

        if (staffMember.permissions.canCancelBookings && ['pending', 'confirmed'].includes(booking.status)) {
          actions.push({
            type: "postback",
            label: "Cancel",
            data: `action=cancel_booking&id=${booking._id}`,
          });
        }

        if (actions.length > 0) {
          return client.replyMessage(event.replyToken, [
            {
              type: "text",
              text: detailsText,
            },
            {
              type: "template",
              altText: "Booking Actions",
              template: {
                type: "buttons",
                text: "Choose an action:",
                actions: actions.slice(0, 4)
              },
            }
          ]);
        } else {
          return client.replyMessage(event.replyToken, {
            type: "text",
            text: detailsText,
          });
        }
      } catch (error) {
        console.error('Error fetching booking details:', error);
        return client.replyMessage(event.replyToken, {
          type: "text",
          text: "Error fetching booking details.",
        });
      }
    }
    
    else if (postbackData.startsWith("action=confirm_booking&id=")) {
      if (!staffMember.permissions.canUpdateBookings) {
        return client.replyMessage(event.replyToken, {
          type: "text",
          text: "You don't have permission to confirm bookings.",
        });
      }

      const bookingId = postbackData.split("id=")[1];
      try {
        const result = await updateBookingStatus(bookingId, 'confirmed', staffMember);
        if (result.success) {
          return client.replyMessage(event.replyToken, {
            type: "text",
            text: `✅ Booking confirmed successfully!\n\nRef: ${result.booking.bookingRef}\nCustomer: ${result.booking.customerName}`,
          });
        } else {
          return client.replyMessage(event.replyToken, {
            type: "text",
            text: `❌ Error: ${result.message}`,
          });
        }
      } catch (error) {
        console.error('Error confirming booking:', error);
        return client.replyMessage(event.replyToken, {
          type: "text",
          text: "Error confirming booking. Please try again.",
        });
      }
    }
    
    else if (postbackData.startsWith("action=cancel_booking&id=")) {
      if (!staffMember.permissions.canCancelBookings) {
        return client.replyMessage(event.replyToken, {
          type: "text",
          text: "You don't have permission to cancel bookings.",
        });
      }

      const bookingId = postbackData.split("id=")[1];
      try {
        const result = await updateBookingStatus(bookingId, 'cancelled', staffMember);
        if (result.success) {
          return client.replyMessage(event.replyToken, {
            type: "text",
            text: `❌ Booking cancelled successfully!\n\nRef: ${result.booking.bookingRef}\nCustomer: ${result.booking.customerName}`,
          });
        } else {
          return client.replyMessage(event.replyToken, {
            type: "text",
            text: `❌ Error: ${result.message}`,
          });
        }
      } catch (error) {
        console.error('Error cancelling booking:', error);
        return client.replyMessage(event.replyToken, {
          type: "text",
          text: "Error cancelling booking. Please try again.",
        });
      }
    }
    
    // New notification system handlers
    else if (postbackData.startsWith("action=confirm_booking&bookingId=")) {
      if (!staffMember.permissions.canUpdateBookings) {
        return client.replyMessage(event.replyToken, {
          type: "text",
          text: "You don't have permission to confirm bookings.",
        });
      }

      // Parse parameters manually from postback data
      const bookingIdMatch = postbackData.match(/bookingId=([^&]+)/);
      const staffIdMatch = postbackData.match(/staffId=([^&]+)/);
      const bookingId = bookingIdMatch ? bookingIdMatch[1] : null;
      const staffId = staffIdMatch ? staffIdMatch[1] : null;

      try {
        await dbConnect();
        const booking = await Booking.findById(bookingId).populate('restaurantId', 'restaurantName');
        
        if (!booking) {
          return client.replyMessage(event.replyToken, {
            type: "text",
            text: "❌ Booking not found.",
          });
        }

        if (booking.status !== 'pending') {
          return client.replyMessage(event.replyToken, {
            type: "text",
            text: `❌ This booking has already been ${booking.status}.`,
          });
        }

        // Update booking status to confirmed
        booking.status = 'confirmed';
        booking.addToHistory('confirmed', {
          staffId: staffMember._id,
          staffName: staffMember.displayName,
          confirmedAt: new Date()
        });
        await booking.save();

        // Send confirmation to customer
        try {
          await notifyCustomerOfBookingConfirmation(booking, staffMember);
          console.log('✅ Customer confirmation sent successfully');
        } catch (notificationError) {
          console.error('❌ Failed to send customer confirmation:', notificationError);
        }

        const bookingDate = new Date(booking.date).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric'
        });

        return client.replyMessage(event.replyToken, {
          type: "text",
          text: `✅ Booking Confirmed!\n\n📋 Ref: ${booking.bookingRef}\n👤 Customer: ${booking.customerName}\n📅 Date: ${bookingDate}\n🕐 Time: ${booking.startTime}\n👥 Guests: ${booking.guestCount}\n🪑 Table: ${booking.tableId}\n\n✨ Customer has been notified of the confirmation!`,
        });

      } catch (error) {
        console.error('Error confirming booking:', error);
        return client.replyMessage(event.replyToken, {
          type: "text",
          text: "❌ Error confirming booking. Please try again.",
        });
      }
    }
    
    else if (postbackData.startsWith("action=reject_booking&bookingId=")) {
      if (!staffMember.permissions.canCancelBookings) {
        return client.replyMessage(event.replyToken, {
          type: "text",
          text: "You don't have permission to reject bookings.",
        });
      }

      // Parse parameters manually from postback data
      const bookingIdMatch = postbackData.match(/bookingId=([^&]+)/);
      const staffIdMatch = postbackData.match(/staffId=([^&]+)/);
      const bookingId = bookingIdMatch ? bookingIdMatch[1] : null;
      const staffId = staffIdMatch ? staffIdMatch[1] : null;

      try {
        await dbConnect();
        const booking = await Booking.findById(bookingId).populate('restaurantId', 'restaurantName');
        
        if (!booking) {
          return client.replyMessage(event.replyToken, {
            type: "text",
            text: "❌ Booking not found.",
          });
        }

        if (booking.status !== 'pending') {
          return client.replyMessage(event.replyToken, {
            type: "text",
            text: `❌ This booking has already been ${booking.status}.`,
          });
        }

        // Update booking status to cancelled
        booking.status = 'cancelled';
        booking.addToHistory('rejected', {
          staffId: staffMember._id,
          staffName: staffMember.displayName,
          rejectedAt: new Date(),
          reason: 'Rejected by staff'
        });
        await booking.save();

        // Send rejection notification to customer
        try {
          await notifyCustomerOfBookingRejection(booking, staffMember, 'Table not available at requested time');
        } catch (notificationError) {
          console.error('Failed to send customer rejection notification:', notificationError);
        }

        const bookingDate = new Date(booking.date).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric'
        });

        return client.replyMessage(event.replyToken, {
          type: "text",
          text: `❌ Booking Rejected\n\n📋 Ref: ${booking.bookingRef}\n👤 Customer: ${booking.customerName}\n📅 Date: ${bookingDate}\n🕐 Time: ${booking.startTime}\n\n📤 Customer has been notified of the rejection.`,
        });

      } catch (error) {
        console.error('Error rejecting booking:', error);
        return client.replyMessage(event.replyToken, {
          type: "text",
          text: "❌ Error rejecting booking. Please try again.",
        });
      }
    }
    
    else if (postbackData.startsWith("action=booking_details&bookingId=")) {
      // Parse parameters manually from postback data
      const bookingIdMatch = postbackData.match(/bookingId=([^&]+)/);
      const bookingId = bookingIdMatch ? bookingIdMatch[1] : null;

      try {
        const bookingDetails = await getBookingDetailsForStaff(bookingId);
        
        const detailsText = `📋 BOOKING DETAILS\n\n` +
          `📋 Reference: ${bookingDetails.bookingRef}\n` +
          `👤 Customer: ${bookingDetails.customerName}\n` +
          `📧 Email: ${bookingDetails.customerEmail}\n` +
          `📱 Phone: ${bookingDetails.customerPhone}\n` +
          `📅 Date: ${bookingDetails.date}\n` +
          `🕐 Time: ${bookingDetails.startTime} - ${bookingDetails.endTime}\n` +
          `👥 Guests: ${bookingDetails.guestCount}\n` +
          `🪑 Table: ${bookingDetails.tableId}\n` +
          `📍 Restaurant: ${bookingDetails.restaurantName}\n` +
          `⏰ Created: ${bookingDetails.createdAt}\n` +
          `💰 Price: ${bookingDetails.pricing?.finalPrice || 'N/A'} THB\n` +
          `📱 LINE Customer: ${bookingDetails.isLineCustomer ? 'Yes' : 'No'}\n` +
          `📊 Status: ${bookingDetails.status.toUpperCase()}`;

        const actions = [];
        
        if (bookingDetails.status === 'pending' && staffMember.permissions.canUpdateBookings) {
          actions.push({
            type: "postback",
            label: "✅ Confirm",
            data: `action=confirm_booking&bookingId=${bookingId}&staffId=${staffMember._id}`,
            displayText: `Confirm booking ${bookingDetails.bookingRef}`,
          });
        }

        if (bookingDetails.status === 'pending' && staffMember.permissions.canCancelBookings) {
          actions.push({
            type: "postback",
            label: "❌ Reject",
            data: `action=reject_booking&bookingId=${bookingId}&staffId=${staffMember._id}`,
            displayText: `Reject booking ${bookingDetails.bookingRef}`,
          });
        }

        actions.push({
          type: "postback",
          label: "📋 Show Bookings",
          data: "action=show_bookings",
          displayText: "Show all bookings",
        });

        if (actions.length > 0) {
          return client.replyMessage(event.replyToken, {
            type: "template",
            altText: `Booking details - ${bookingDetails.bookingRef}`,
            template: {
              type: "buttons",
              text: detailsText.length > 160 ? 
                `📋 ${bookingDetails.bookingRef}\n👤 ${bookingDetails.customerName}\n📅 ${bookingDetails.date}\n🕐 ${bookingDetails.startTime}\n👥 ${bookingDetails.guestCount}\n📊 ${bookingDetails.status.toUpperCase()}` :
                detailsText,
              actions: actions.slice(0, 4), // LINE limit is 4 actions
            },
          });
        } else {
          return client.replyMessage(event.replyToken, {
            type: "text",
            text: detailsText,
          });
        }

      } catch (error) {
        console.error('Error getting booking details:', error);
        return client.replyMessage(event.replyToken, {
          type: "text",
          text: "❌ Error fetching booking details. Please try again.",
        });
      }
    }
    
    else if (postbackData.startsWith("action=complete_booking&id=")) {
      if (!staffMember.permissions.canUpdateBookings) {
        return client.replyMessage(event.replyToken, {
          type: "text",
          text: "You don't have permission to complete bookings.",
        });
      }

      const bookingId = postbackData.split("id=")[1];
      try {
        const result = await updateBookingStatus(bookingId, 'completed', staffMember);
        if (result.success) {
          return client.replyMessage(event.replyToken, {
            type: "text",
            text: `✔️ Booking completed successfully!\n\nRef: ${result.booking.bookingRef}\nCustomer: ${result.booking.customerName}`,
          });
        } else {
          return client.replyMessage(event.replyToken, {
            type: "text",
            text: `❌ Error: ${result.message}`,
          });
        }
      } catch (error) {
        console.error('Error completing booking:', error);
        return client.replyMessage(event.replyToken, {
          type: "text",
          text: "Error completing booking. Please try again.",
        });
      }
    }
    
    else if (postbackData === "action=show_floorplan") {
      try {
        const floorplanData = await getFloorplanImage();
        
        if (!floorplanData) {
          return client.replyMessage(event.replyToken, {
            type: "text",
            text: "Sorry, no floorplan image is available at the moment.",
          });
        }

        const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const fullImageUrl = floorplanData.imageUrl.startsWith('http') 
          ? floorplanData.imageUrl 
          : `${baseUrl}${floorplanData.imageUrl}`;

        return client.replyMessage(event.replyToken, [
          {
            type: "text",
            text: `🏢 Floorplan for ${floorplanData.restaurantName}:`,
          },
          {
            type: "image",
            originalContentUrl: fullImageUrl,
            previewImageUrl: fullImageUrl,
          }
        ]);
      } catch (error) {
        console.error('Error fetching floorplan image:', error);
        return client.replyMessage(event.replyToken, {
          type: "text",
          text: "Sorry, there was an error retrieving the floorplan image.",
        });
      }
    }
    
    else if (postbackData === "action=help") {
      const helpText = `🤖 Staff Bot Help\n\n` +
        `Available Commands:\n` +
        `📋 View Bookings - See current bookings\n` +
        `✅ Manage Bookings - Confirm, cancel, or complete bookings\n` +
        `🏢 Show Floorplan - View restaurant layout\n\n` +
        `Your Permissions:\n` +
        `${staffMember.permissions.canViewBookings ? '✅' : '❌'} View Bookings\n` +
        `${staffMember.permissions.canCreateBookings ? '✅' : '❌'} Create Bookings\n` +
        `${staffMember.permissions.canUpdateBookings ? '✅' : '❌'} Update Bookings\n` +
        `${staffMember.permissions.canCancelBookings ? '✅' : '❌'} Cancel Bookings\n` +
        `${staffMember.permissions.canDeleteBookings ? '✅' : '❌'} Delete Bookings\n\n` +
        `Role: ${staffMember.role.toUpperCase()}\n` +
        `Restaurant: ${staffMember.restaurantId.restaurantName}`;

      return client.replyMessage(event.replyToken, {
        type: "text",
        text: helpText,
      });
    }
  }
  
  return Promise.resolve(null);
  } catch (error) {
    console.error("Error in handleEvent:", error);
    console.error("Event that caused error:", JSON.stringify(event, null, 2));
    
    // Don't try to reply again if we already failed with 400 (reply token used)
    if (error.statusCode === 400) {
      console.log("Reply token already used, not sending error message");
      return;
    }
    
    throw error; // Re-throw to be caught by the main handler
  }
}

export async function POST(req) {
  try {
    const startTime = Date.now();
    const body = await req.text();
    const signature = req.headers.get("x-line-signature");

    console.log("LINE Webhook received:", { 
      bodyLength: body.length, 
      hasSignature: !!signature,
      timestamp: new Date().toISOString()
    });

    if (!validateSignature(body, config.channelSecret, signature)) {
      console.log("Invalid signature");
      return new Response("Invalid signature", { status: 401 });
    }

    let events;
    try {
      const parsedBody = JSON.parse(body);
      events = parsedBody.events;
      if (!events || !Array.isArray(events)) {
        console.error("Invalid webhook body structure:", parsedBody);
        return new Response("Invalid webhook body", { status: 400 });
      }
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      console.error("Body content:", body.substring(0, 200) + "...");
      return new Response("Invalid JSON in webhook body", { status: 400 });
    }

    console.log("Processing events:", events.length);

    for (const event of events) {
      try {
        // Create unique event ID for deduplication
        const eventId = `${event.source.userId}_${event.timestamp}_${event.type}_${event.replyToken}`;
        
        // Check if we've already processed this event
        if (processedEvents.has(eventId)) {
          console.log(`⚠️ Duplicate event detected and skipped: ${eventId}`);
          continue;
        }
        
        // Mark event as processed
        processedEvents.set(eventId, Date.now());
        console.log(`🔄 Processing new event: ${eventId}`);
        
        await handleEvent(event);
        
      } catch (eventError) {
        console.error("Error handling event:", eventError);
        console.error("Event data:", JSON.stringify(event, null, 2));
        // Continue processing other events
      }
    }
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ Webhook processing completed in ${processingTime}ms`);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error("Webhook error:", error);
    console.error("Error stack:", error.stack);
    console.error(`❌ Webhook failed after ${processingTime}ms`);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
} 