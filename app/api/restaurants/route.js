import { NextResponse } from 'next/server';

// Simulate restaurant data for now
let restaurants = [
  { id: 1, name: 'Restaurant A', location: 'City A' },
  { id: 2, name: 'Restaurant B', location: 'City B' },
];

// Handle GET and POST requests
export async function GET() {
  try {
    // Simulating a delay or database operation
    return NextResponse.json({ restaurants }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch restaurants' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // Parse JSON body
    const data = await request.json();

    if (!data.name || !data.location) {
      return NextResponse.json({ error: 'Missing restaurant name or location' }, { status: 400 });
    }

    // Create a new restaurant
    const newRestaurant = {
      id: restaurants.length + 1,
      name: data.name,
      location: data.location,
    };

    // Simulate saving the restaurant (e.g., database operation)
    restaurants.push(newRestaurant);

    return NextResponse.json({ message: 'Restaurant created successfully', restaurant: newRestaurant }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create restaurant' }, { status: 500 });
  }
}
