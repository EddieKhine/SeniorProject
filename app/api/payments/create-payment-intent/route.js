import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(request) {
  try {
    const { amount, currency = 'usd', bookingDetails } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: {
        bookingDetails: JSON.stringify(bookingDetails),
        bookingId: bookingDetails.bookingId || 'pending',
        restaurantId: bookingDetails.restaurantId,
        tableId: bookingDetails.tableId,
        guestCount: bookingDetails.guestCount,
        date: bookingDetails.date,
        time: bookingDetails.time
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Update the booking with the payment intent ID
    if (bookingDetails.bookingId && bookingDetails.bookingId !== 'pending') {
      try {
        const { default: Booking } = await import('@/models/Booking');
        const { default: dbConnect } = await import('@/lib/mongodb');
        await dbConnect();
        
        await Booking.findByIdAndUpdate(bookingDetails.bookingId, {
          paymentIntentId: paymentIntent.id
        });
      } catch (error) {
        console.error('Error updating booking with payment intent ID:', error);
      }
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
} 