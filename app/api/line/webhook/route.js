
import { Client, validateSignature } from "@line/bot-sdk";
import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import dbConnect from "@/lib/mongodb";
import Restaurant from "@/models/Restaurants";
import Floorplan from "@/models/Floorplan";
import Staff from "@/models/Staff";
import Booking from "@/models/Booking";

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = "stock";
const MONGODB_COLLECTION = "bookings";

const client = new Client(config);

let mongoClient;

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
const RESTAURANT_ID = "67b7164d8d2856f0a190046d";

async function getFloorplanImage() {
  try {
    await dbConnect();
    
    console.log('Looking for restaurant with ID:', RESTAURANT_ID);
    
    // Get the specific restaurant this LINE bot is assigned to
    const restaurant = await Restaurant.findById(RESTAURANT_ID);
    
    console.log('Found restaurant:', restaurant ? 'Yes' : 'No');
    if (restaurant) {
      console.log('Restaurant name:', restaurant.restaurantName);
      console.log('Has floorplanId:', restaurant.floorplanId ? 'Yes' : 'No');
    }
    
    if (!restaurant) {
      console.log('No restaurant found with ID:', RESTAURANT_ID);
      return null;
    }
    
    if (!restaurant.floorplanId) {
      console.log('Restaurant has no floorplanId');
      return null;
    }

    console.log('Looking for floorplan with ID:', restaurant.floorplanId);
    const floorplan = await Floorplan.findById(restaurant.floorplanId);
    
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

async function handleEvent(event) {
  const userId = event.source.userId;

  // Check if user is in staff database first
  const staffCheck = await checkStaffInDatabase(userId);
  const staffMember = staffCheck.staff;

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
              label: "📋 View Bookings",
              data: "action=show_bookings",
              displayText: "Show bookings",
            }] : []),
            ...(staffMember.permissions.canUpdateBookings ? [{
              type: "postback",
              label: "✅ Manage Bookings",
              data: "action=manage_bookings",
              displayText: "Manage bookings",
            }] : []),
            {
              type: "postback",
              label: "🏢 Show Floorplan",
              data: "action=show_floorplan",
              displayText: "Show restaurant layout",
            },
            {
              type: "postback",
              label: "ℹ️ Help",
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
              const verifyResponse = await fetch(`${process.env.NEXTAUTH_URL || 'https://822ebac2ac81.ngrok-free.app'}/api/staff/verify-qr`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token }),
              });

              console.log('🔍 Token verification response:', verifyResponse.status);

              if (verifyResponse.ok) {
                const tokenData = await verifyResponse.json();
                const profile = await client.getProfile(userId);

                // Complete the registration
                const completeResponse = await fetch(`${process.env.NEXTAUTH_URL || 'https://822ebac2ac81.ngrok-free.app'}/api/staff/complete-registration`, {
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
                  const registrationResult = await completeResponse.json();
                  return client.replyMessage(event.replyToken, {
                    type: "text",
                    text: `✅ Registration successful!\n\nWelcome ${tokenData.registrationData.displayName}!\nRole: ${tokenData.registrationData.role}\n\nYou can now use staff commands. Type anything to see the staff menu.`,
                  });
                } else {
                  const error = await completeResponse.json();
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

              const response = await fetch(`${process.env.NEXTAUTH_URL || 'https://822ebac2ac81.ngrok-free.app'}/api/staff`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  lineId: lineId.toLowerCase(),
                  displayName: nickname,
                  restaurantId: RESTAURANT_ID, // Use the hardcoded restaurant ID
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
                const error = await response.json();
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
      
      // Check if user is trying to register as staff
      if (messageText.includes('staff') || messageText.includes('register') || messageText.includes('join')) {
        return client.replyMessage(event.replyToken, {
          type: "template",
          altText: "Staff Registration",
          template: {
            type: "buttons",
            text: "Are you a staff member?\nClick below to register:",
            actions: [
              {
                type: "postback",
                label: "👤 Register as Staff",
                data: "action=register_staff",
                displayText: "Register as staff member",
              },
              {
                type: "postback",
                label: "ℹ️ I'm a Customer",
                data: "action=customer_mode",
                displayText: "I'm a customer",
              }
            ],
          },
        });
      }
      
      // Default message for non-staff
      return client.replyMessage(event.replyToken, {
        type: "text",
        text: "Hello! 👋\n\nWelcome to our restaurant booking system!\nYou can make reservations through our website.",
      });
    }
  } 
  
  if (event.type === "postback") {
    const postbackData = event.postback.data;

    // Handle staff registration (only allow non-staff to access this)
    if (postbackData === "action=register_staff") {
      // Only allow registration if user is NOT in database
      if (staffCheck.exists) {
        return client.replyMessage(event.replyToken, {
          type: "text",
          text: "You are already registered as a staff member! Type any message to see the staff menu.",
        });
      }
      try {
        const profile = await client.getProfile(userId);
        
        return client.replyMessage(event.replyToken, {
          type: "text",
          text: `Hello ${profile.displayName}! 👋\n\nTo register as a staff member, please provide:\n\n1️⃣ Your Line ID (username)\n2️⃣ Your nickname\n3️⃣ The staff password\n\nPlease reply in this format:\nlineId|nickname|password\n\nExample: akmo610|John|123`,
        });
      } catch (error) {
        return client.replyMessage(event.replyToken, {
          type: "text",
          text: "Sorry, I couldn't get your profile information. Please try again.",
        });
      }
    }
    
    if (postbackData === "action=customer_mode") {
      return client.replyMessage(event.replyToken, {
        type: "text",
        text: "Welcome! 🎉\n\nAs a customer, you can make restaurant bookings through our website.\nVisit our website to explore restaurants and make reservations.",
      });
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
              label: "📋 View All Bookings",
              data: "action=show_bookings",
            },
            {
              type: "postback",
              label: "⏰ Today's Bookings",
              data: "action=today_bookings",
            },
            {
              type: "postback",
              label: "📅 Tomorrow's Bookings",
              data: "action=tomorrow_bookings",
            },
            {
              type: "postback",
              label: "🔍 Search Booking",
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
            label: "✅ Confirm",
            data: `action=confirm_booking&id=${booking._id}`,
          });
        }
        
        if (booking.status === 'confirmed' && staffMember.permissions.canUpdateBookings) {
          actions.push({
            type: "postback",
            label: "✔️ Complete",
            data: `action=complete_booking&id=${booking._id}`,
          });
        }

        if (staffMember.permissions.canCancelBookings && ['pending', 'confirmed'].includes(booking.status)) {
          actions.push({
            type: "postback",
            label: "❌ Cancel",
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

        const baseUrl = 'https://822ebac2ac81.ngrok-free.app';
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
}

export async function POST(req) {
  const body = await req.text();
  const signature = req.headers.get("x-line-signature");

  if (!validateSignature(body, config.channelSecret, signature)) {
    return new Response("Invalid signature", { status: 401 });
  }

  const events = JSON.parse(body).events;

  try {
    await Promise.all(events.map(handleEvent));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return new Response("Error", { status: 500 });
  }
} 