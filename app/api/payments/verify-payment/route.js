import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import dbConnect from '@/lib/mongodb';
import Booking from '@/models/Booking';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(request) {
  try {
    const { paymentIntentId } = await request.json();

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      );
    }

    // Retrieve the payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent) {
      return NextResponse.json(
        { error: 'Payment intent not found' },
        { status: 404 }
      );
    }

    await dbConnect();

    // Find the booking associated with this payment intent
    const booking = await Booking.findOne({ paymentIntentId });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found for this payment' },
        { status: 404 }
      );
    }

    // Verify payment status
    if (paymentIntent.status === 'succeeded') {
      // Update booking status if not already updated
      if (booking.status !== 'confirmed' || booking.paymentStatus !== 'paid') {
        booking.status = 'confirmed';
        booking.paymentStatus = 'paid';
        booking.paidAt = new Date();
        await booking.save();
      }

      return NextResponse.json({
        success: true,
        paymentStatus: 'succeeded',
        booking: {
          _id: booking._id,
          bookingRef: booking.bookingRef,
          date: booking.date,
          startTime: booking.startTime,
          endTime: booking.endTime,
          guestCount: booking.guestCount,
          amount: booking.amount,
          status: booking.status,
          paymentStatus: booking.paymentStatus
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        paymentStatus: paymentIntent.status,
        error: 'Payment was not successful'
      });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
} 