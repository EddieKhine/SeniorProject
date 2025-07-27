
import { Client, validateSignature } from "@line/bot-sdk";
import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import dbConnect from "@/lib/mongodb";
import Restaurant from "@/models/Restaurants";
import Floorplan from "@/models/Floorplan";

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = "stock";
const MONGODB_COLLECTION = "bookings";

const client = new Client(config);

let mongoClient;

async function getBookings() {
  if (!mongoClient) {
    mongoClient = new MongoClient(MONGODB_URI, { useUnifiedTopology: true });
    await mongoClient.connect();
  }
  const db = mongoClient.db(MONGODB_DB);
  const collection = db.collection(MONGODB_COLLECTION);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);

  const bookings = await collection
    .find({
      date: {
        $gte: todayStart,
        $lt: tomorrowEnd,
      },
    })
    .limit(5)
    .toArray();

  return bookings;
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
  if (event.type === "message" && event.message.type === "text") {
    return client.replyMessage(event.replyToken, {
      type: "template",
      altText: "Buttons template",
      template: {
        type: "buttons",
        text: "Choose an option:",
        actions: [
          {
            type: "uri",
            label: "Visit Website",
            uri: "line://app/2007787204-zGYZn1ZE",
          },
          {
            type: "postback",
            label: "Say Hello",
            data: "action=say_hello",
          },
          {
            type: "postback",
            label: "Show Bookings",
            data: "action=show_bookings",
            displayText: "Show me bookings",
          },
          {
            type: "postback",
            label: "Show Floorplan",
            data: "action=show_floorplan",
            displayText: "Show me the restaurant layout",
          },
        ],
      },
    });
  } else if (
    event.type === "postback" &&
    event.postback.data === "action=say_hello"
  ) {
    const userId = event.source.userId;
    try {
      const profile = await client.getProfile(userId);
      return client.replyMessage(event.replyToken, {
        type: "text",
        text: `Hello, ${profile.displayName}!`,
      });
    } catch (error) {
      console.error(error);
      return client.replyMessage(event.replyToken, {
        type: "text",
        text: "Sorry, I couldn't get your profile information.",
      });
    }
  } else if (
    event.type === "postback" &&
    event.postback.data === "action=show_bookings"
  ) {
    try {
      const bookings = await getBookings();
      if (bookings.length === 0) {
        return client.replyMessage(event.replyToken, {
          type: "text",
          text: "No bookings found for today or tomorrow.",
        });
      }
      const bookingText = bookings
        .map((b, i) => {
          const dateObj = new Date(b.date);
          const dateStr = dateObj.toLocaleDateString("en-GB");
          return `Booking ${i + 1} (Ref: ${
            b.bookingRef
          }):\nName: ${b.customerName}\nDate: ${dateStr}\nTime: ${b.startTime} - ${b.endTime}\nStatus: ${b.status}`;
        })
        .join("\n\n");
      return client.replyMessage(event.replyToken, {
        type: "text",
        text: bookingText,
      });
    } catch (err) {
      return client.replyMessage(event.replyToken, {
        type: "text",
        text: "Error fetching bookings.",
      });
    }
  } else if (
    event.type === "postback" &&
    event.postback.data === "action=show_floorplan"
  ) {
    try {
      const floorplanData = await getFloorplanImage();
      
      if (!floorplanData) {
        return client.replyMessage(event.replyToken, {
          type: "text",
          text: "Sorry, no floorplan image is available at the moment.",
        });
      }

      // Get the full URL for the image using ngrok URL
      const baseUrl = 'https://075a9a8e23fc.ngrok-free.app';
      const fullImageUrl = floorplanData.imageUrl.startsWith('http') 
        ? floorplanData.imageUrl 
        : `${baseUrl}${floorplanData.imageUrl}`;
      
      console.log('Base URL:', baseUrl);
      console.log('Image URL from DB:', floorplanData.imageUrl);
      console.log('Full Image URL:', fullImageUrl);

      // Send the floorplan image
      return client.replyMessage(event.replyToken, [
        {
          type: "text",
          text: `Here's the floorplan for ${floorplanData.restaurantName}:`,
        },
        {
          type: "image",
          originalContentUrl: fullImageUrl,
          previewImageUrl: fullImageUrl,
        },
        {
          type: "text",
          text: "You can tap 'Visit Website' above to book a table or explore the interactive floorplan!",
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