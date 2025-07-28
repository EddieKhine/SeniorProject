'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FaCheckCircle, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState('processing');
  const [bookingDetails, setBookingDetails] = useState(null);

  useEffect(() => {
    const paymentIntentId = searchParams.get('payment_intent');
    const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret');

    if (paymentIntentId && paymentIntentClientSecret) {
      // Verify payment status with our backend
      verifyPaymentStatus(paymentIntentId);
    } else {
      setPaymentStatus('error');
    }
  }, [searchParams]);

  const verifyPaymentStatus = async (paymentIntentId) => {
    try {
      const response = await fetch('/api/payments/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentIntentId }),
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentStatus('success');
        setBookingDetails(data.booking);
        toast.success('Payment verified successfully!');
      } else {
        setPaymentStatus('error');
        toast.error('Payment verification failed');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      setPaymentStatus('error');
      toast.error('Payment verification failed');
    }
  };

  const handleReturnToRestaurant = () => {
    window.location.href = '/';
  };

  if (paymentStatus === 'processing') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md mx-4 text-center">
          <FaSpinner className="text-[#FF4F18] text-4xl mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Verifying Payment</h2>
          <p className="text-gray-600">Please wait while we confirm your payment...</p>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md mx-4 text-center">
          <div className="text-red-500 text-4xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Payment Error</h2>
          <p className="text-gray-600 mb-6">
            There was an issue with your payment. Please contact support if you believe this is an error.
          </p>
          <button
            onClick={handleReturnToRestaurant}
            className="px-6 py-2 bg-[#FF4F18] text-white rounded-lg hover:bg-[#FF4F18]/90 transition-all"
          >
            Return to Restaurant
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-md mx-4 text-center">
        <FaCheckCircle className="text-[#FF4F18] text-5xl mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h2>
        <p className="text-gray-600 mb-6">
          Your booking has been confirmed and payment has been processed successfully.
        </p>
        
        {bookingDetails && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-medium text-gray-800 mb-2">Booking Details</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p><strong>Reference:</strong> {bookingDetails.bookingRef}</p>
              <p><strong>Date:</strong> {new Date(bookingDetails.date).toLocaleDateString()}</p>
              <p><strong>Time:</strong> {bookingDetails.startTime} - {bookingDetails.endTime}</p>
              <p><strong>Guests:</strong> {bookingDetails.guestCount}</p>
              <p><strong>Amount:</strong> ${bookingDetails.amount}</p>
            </div>
          </div>
        )}
        
        <div className="space-y-3">
          <button
            onClick={handleReturnToRestaurant}
            className="w-full px-6 py-2 bg-[#FF4F18] text-white rounded-lg hover:bg-[#FF4F18]/90 transition-all"
          >
            Return to Restaurant
          </button>
          <p className="text-xs text-gray-500">
            You will receive a confirmation email shortly.
          </p>
        </div>
      </div>
    </div>
  );
} 