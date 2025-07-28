import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import dbConnect from '@/lib/mongodb';
import Booking from '@/models/Booking';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  try {
    await dbConnect();

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('Payment succeeded:', paymentIntent.id);
        
        // Find booking by payment intent ID or booking ID from metadata
        let booking = null;
        if (paymentIntent.metadata.bookingId && paymentIntent.metadata.bookingId !== 'pending') {
          booking = await Booking.findById(paymentIntent.metadata.bookingId);
        }
        
        if (!booking) {
          // Try to find by payment intent ID
          booking = await Booking.findOne({ paymentIntentId: paymentIntent.id });
        }
        
        if (booking) {
          await Booking.findByIdAndUpdate(
            booking._id,
            {
              status: 'confirmed',
              paymentStatus: 'paid',
              paymentIntentId: paymentIntent.id,
              paidAt: new Date()
            }
          );
          console.log('Booking updated to confirmed:', booking._id);
        } else {
          console.log('No booking found for payment intent:', paymentIntent.id);
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log('Payment failed:', failedPayment.id);
        
        // Update booking status to cancelled if payment fails
        if (failedPayment.metadata.bookingId && failedPayment.metadata.bookingId !== 'pending') {
          await Booking.findByIdAndUpdate(
            failedPayment.metadata.bookingId,
            {
              status: 'cancelled',
              paymentStatus: 'failed'
            }
          );
          console.log('Booking updated to cancelled:', failedPayment.metadata.bookingId);
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
} 