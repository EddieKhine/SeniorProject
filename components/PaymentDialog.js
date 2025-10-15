import { useState, useEffect } from 'react';
import { FaCreditCard, FaSpinner, FaQrcode } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import StripeQRPayment from './StripeQRPayment';

// Check if Stripe publishable key is available
if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  console.error('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable');
}

// Initialize Stripe with error handling
const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
      .then(stripe => {
        if (!stripe) {
          console.error('Failed to load Stripe.js');
          throw new Error('Failed to load Stripe.js');
        }
        console.log('Stripe.js loaded successfully');
        return stripe;
      })
      .catch(error => {
        console.error('Error loading Stripe.js:', error);
        throw error;
      })
  : Promise.reject(new Error('Missing Stripe publishable key'));

// Stripe Card Element styling
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

// Stripe Payment Form Component
function StripePaymentForm({ amount, onSuccess, onError, bookingDetails }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState('');

  // Create payment intent when component mounts
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/stripe/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: amount,
            currency: 'thb',
            metadata: {
              restaurantId: bookingDetails.restaurantId,
              tableId: bookingDetails.tableId,
              date: bookingDetails.date,
              time: bookingDetails.time,
              guestCount: bookingDetails.guestCount,
            },
          }),
        });

        const data = await response.json();
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          throw new Error(data.error || 'Failed to create payment intent');
        }
      } catch (error) {
        console.error('Error creating payment intent:', error);
        onError('Failed to initialize payment. Please try again.');
      }
    };

    if (amount > 0) {
      createPaymentIntent();
    }
  }, [amount, bookingDetails, onError]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsProcessing(true);

    const cardElement = elements.getElement(CardElement);

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (error) {
        console.error('Payment failed:', error);
        onError(error.message || 'Payment failed. Please try again.');
      } else if (paymentIntent.status === 'succeeded') {
        console.log('Payment succeeded:', paymentIntent);
        onSuccess(paymentIntent);
      }
    } catch (error) {
      console.error('Payment error:', error);
      onError('An unexpected error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Information
        </label>
        <div className="p-3 border border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-[#FF4F18] focus-within:border-transparent">
          <CardElement options={cardElementOptions} />
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start space-x-2">
          <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-blue-600 text-xs">ℹ️</span>
          </div>
          <div className="text-xs text-blue-800">
            <p className="font-medium mb-1">Secure Payment:</p>
            <p className="text-blue-700">Your card information is encrypted and processed securely by Stripe.</p>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || !clientSecret || isProcessing}
        className="w-full px-6 py-3 bg-[#FF4F18] text-white rounded-lg hover:bg-[#FF4F18]/90 
          transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <FaSpinner className="animate-spin" />
            Processing Payment...
          </>
        ) : (
          `Pay ${amount} THB`
        )}
      </button>
    </form>
  );
}

export default function PaymentDialog({ bookingDetails, onClose, onSuccess }) {
  const [paymentMethod, setPaymentMethod] = useState('stripe-qr');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pricing, setPricing] = useState(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(true);
  
  // Calculate dynamic pricing using the real algorithm API
  useEffect(() => {
    const calculatePrice = async () => {
      try {
        setIsLoadingPrice(true);
        
        // Validate and format time before sending to API
        let formattedTime = bookingDetails.time;
        
        // If time is in time slot format (e.g., "7:00 PM - 9:00 PM"), extract start time
        if (formattedTime && formattedTime.includes(' - ')) {
          const [startTime] = formattedTime.split(' - ');
          
          // Convert 12-hour format to 24-hour format
          const parseTime12to24 = (time12h) => {
            const [time, period] = time12h.trim().split(' ');
            let [hours, minutes] = time.split(':').map(Number);
            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          };
          
          formattedTime = parseTime12to24(startTime);
        }
        
        // Check if time is valid HH:MM format
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!formattedTime || !timeRegex.test(formattedTime)) {
          console.warn('Invalid time format, using fallback:', formattedTime);
          formattedTime = '19:00'; // Default fallback time
        }

        // Prepare request data for the pricing API
        const requestData = {
          restaurantId: bookingDetails.restaurantId,
          tableId: bookingDetails.tableId,
          date: bookingDetails.date,
          time: formattedTime,
          guestCount: bookingDetails.guestCount,
          tableCapacity: bookingDetails.tableCapacity || (bookingDetails.guestCount <= 2 ? 2 : bookingDetails.guestCount <= 4 ? 4 : 6),
          tableLocation: bookingDetails.tableLocation || 'center'
        };
        
        console.log('PaymentDialog: Sending pricing request to real algorithm:', requestData);
        console.log('PaymentDialog: Time value debug:', {
          originalTime: bookingDetails.time,
          timeType: typeof bookingDetails.time,
          timeValid: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(bookingDetails.time || '')
        });
        
        // Call the real pricing API with full algorithm
        const response = await fetch('/api/pricing/calculate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData)
        });

        if (response.ok) {
          const pricingData = await response.json();
          console.log('PaymentDialog: Received pricing data:', pricingData);
          
          if (pricingData.success) {
            setPricing(pricingData);
          } else {
            console.warn('Pricing API returned unsuccessful result:', pricingData);
            // Use the fallback price from API response if available
            setPricing({
              success: true,
              finalPrice: pricingData.fallbackPrice || 100,
              currency: 'THB',
              breakdown: { 
                message: `Algorithm issue: ${pricingData.error || 'Unknown error'}`,
                fallback: true
              }
            });
          }
        } else {
          // Handle HTTP errors
          let errorMessage = `HTTP ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            // Response body isn't JSON
          }
          
          console.error('Pricing API HTTP error:', response.status, errorMessage);
          
          // Use fallback pricing
          setPricing({
            success: true,
            finalPrice: 100,
            currency: 'THB',
            breakdown: { 
              message: `API error (${errorMessage}). Using base price.`,
              fallback: true
            }
          });
        }
      } catch (error) {
        console.error('Network error calling pricing API:', error);
        
        // Network error fallback
        setPricing({
          success: true,
          finalPrice: 100,
          currency: 'THB',
          breakdown: { 
            message: 'Network error. Using base price.',
            fallback: true
          }
        });
      } finally {
        setIsLoadingPrice(false);
      }
    };

    // Only calculate if we have the minimum required data
    if (bookingDetails.restaurantId && bookingDetails.date && bookingDetails.time && bookingDetails.guestCount) {
      calculatePrice();
    } else {
      console.log('PaymentDialog: Missing required booking details for pricing:', {
        hasRestaurantId: !!bookingDetails.restaurantId,
        hasDate: !!bookingDetails.date,
        hasTime: !!bookingDetails.time,
        hasGuestCount: !!bookingDetails.guestCount
      });
      
      // Missing required data - use base price
      setPricing({
        success: true,
        finalPrice: 100,
        currency: 'THB',
        breakdown: { 
          message: 'Missing booking details. Using base price.',
          fallback: true
        }
      });
      setIsLoadingPrice(false);
    }
  }, [bookingDetails]);

  // Calculate table price (not per person)
  const tablePrice = pricing ? pricing.finalPrice : 100;
  const tableCapacity = bookingDetails.tableCapacity || (bookingDetails.guestCount <= 2 ? 2 : bookingDetails.guestCount <= 4 ? 4 : 6);

  const handlePromtpayPayment = async () => {
    setIsProcessing(true);
    try {
      // Simulate Promtpay payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Show success message
      const toastMessage = 'Payment confirmed! Your booking has been submitted and is pending restaurant confirmation.';
      
      toast.success(toastMessage, {
        duration: 6000,
        icon: '⏳'
      });
      
      // Show detailed success message
      showSuccessMessage('Promtpay payment has been confirmed and ');
      
      setIsProcessing(false);
      onSuccess();
    } catch (error) {
      setIsProcessing(false);
      toast.error('Payment failed. Please try again.');
    }
  };

  const handleStripePaymentSuccess = (paymentIntent) => {
    console.log('Stripe payment successful:', paymentIntent);
    
    // Show success message
    const toastMessage = 'Payment successful! Your booking has been submitted and is pending restaurant confirmation.';
    
    toast.success(toastMessage, {
      duration: 6000,
      icon: '✅'
    });
    
    // Show detailed success message
    const paymentType = paymentMethod === 'stripe-qr' ? 'QR code' : 'Credit card';
    showSuccessMessage(`${paymentType} payment has been confirmed and `);
    
    onSuccess();
  };

  const handleStripePaymentError = (error) => {
    console.error('Stripe payment error:', error);
    toast.error(error || 'Payment failed. Please try again.');
  };

  const showSuccessMessage = (paymentType) => {
    const successMessage = document.createElement('div');
    successMessage.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50';
    successMessage.innerHTML = `
      <div class="bg-white rounded-xl shadow-xl p-6 max-w-md mx-4 text-center animate-fade-up">
        <div class="text-[#FF4F18] text-5xl mb-4">⏳</div>
        <h3 class="text-xl font-bold text-gray-800 mb-2">Booking Submitted!</h3>
        <p class="text-gray-600 mb-4">Your ${paymentType}booking has been submitted successfully and is pending restaurant confirmation. You will receive a confirmation once approved.</p>
        <button class="px-6 py-2 bg-[#FF4F18] text-white rounded-lg hover:bg-[#FF4F18]/90 transition-all">
          OK
        </button>
      </div>
    `;
    
    document.body.appendChild(successMessage);
    
    // Remove success message when OK is clicked
    successMessage.querySelector('button').addEventListener('click', () => {
      document.body.removeChild(successMessage);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (document.body.contains(successMessage)) {
        document.body.removeChild(successMessage);
      }
    }, 5000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-[95vw] sm:max-w-md mx-auto animate-fade-up max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col my-auto">
        {/* Header - Sticky */}
        <div className="border-b border-gray-100 p-3 sm:p-4 flex justify-between items-center flex-shrink-0 bg-white">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800">Complete Payment</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors text-xl sm:text-2xl font-light p-1 rounded-full hover:bg-gray-100 min-w-[32px] min-h-[32px] flex items-center justify-center"
          >
            ×
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1">
          {/* Booking Summary */}
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <h4 className="font-medium text-gray-800 mb-2 text-sm sm:text-base">Booking Summary</h4>
            <div className="space-y-1 text-xs sm:text-sm text-gray-600">
              <p>Date: {new Date(bookingDetails.date).toLocaleDateString()}</p>
              <p>Time: {bookingDetails.time}</p>
              <p>Table: {bookingDetails.tableId}</p>
              <p>Guests: {bookingDetails.guestCount}</p>
              
              {/* Dynamic Pricing Display */}
              {isLoadingPrice ? (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <FaSpinner className="animate-spin text-[#FF4F18] text-sm" />
                    <p className="text-xs sm:text-sm text-gray-500">Calculating price...</p>
                  </div>
                </div>
              ) : (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Table reservation fee:</span>
                      <span className="font-medium">{tablePrice} THB</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{tableCapacity}-person table for {bookingDetails.guestCount} guests</span>
                      <span>{tableCapacity >= bookingDetails.guestCount ? 'Perfect fit' : 'Over capacity'}</span>
                    </div>
                    
                    {/* Show compact pricing breakdown if available */}
                    {pricing && pricing.breakdown && !pricing.breakdown.fallback && (
                      <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                        {/* Collapsible header */}
                        <button 
                          onClick={() => document.getElementById('price-details')?.classList.toggle('hidden')}
                          className="flex items-center justify-between w-full text-sm font-medium text-blue-800 hover:text-blue-900"
                        >
                          <span>💰 Price Details</span>
                          <span className="text-xs">Click to expand</span>
                        </button>
                        
                        {/* Compact factors display (always visible) */}
                        <div className="mt-2 flex flex-wrap gap-1 text-xs">
                          {Object.entries(pricing.breakdown).map(([factor, data]) => {
                            const multiplier = data.value || 1;
                            const percentage = ((multiplier - 1) * 100).toFixed(0);
                            const isSignificant = Math.abs(percentage) >= 5;
                            
                            if (!isSignificant && multiplier === 1) return null;

                            const factorIcon = {
                              demandFactor: '📊',
                              temporalFactor: '⏰',
                              historicalFactor: '📈',
                              capacityFactor: '🪑',
                              holidayFactor: '🎉'
                            }[factor] || '📝';

                            return (
                              <span key={factor} className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                multiplier > 1 ? 'bg-red-100 text-red-700' : 
                                multiplier < 1 ? 'bg-green-100 text-green-700' : 
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {factorIcon} {percentage > 0 ? '+' : ''}{percentage}%
                              </span>
                            );
                          })}
                        </div>

                        {/* Expandable details */}
                        <div id="price-details" className="hidden mt-2 space-y-2">
                          {/* Base price */}
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">🏪 Base fee:</span>
                            <span className="font-medium">{pricing.basePrice} THB</span>
                          </div>

                          {/* Detailed factors */}
                          {Object.entries(pricing.breakdown).map(([factor, data]) => {
                            const multiplier = data.value || 1;
                            const percentage = ((multiplier - 1) * 100).toFixed(0);
                            const isSignificant = Math.abs(percentage) >= 5;
                            
                            if (!isSignificant && multiplier === 1) return null;

                            const factorName = {
                              demandFactor: 'Current demand',
                              temporalFactor: 'Time slot',
                              historicalFactor: 'Popularity',
                              capacityFactor: 'Table type',
                              holidayFactor: 'Special event'
                            }[factor] || factor;

                            return (
                              <div key={factor} className="text-xs">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">{factorName}:</span>
                                  <span className={`font-medium ${
                                    multiplier > 1 ? 'text-red-600' : 
                                    multiplier < 1 ? 'text-green-600' : 
                                    'text-gray-600'
                                  }`}>
                                    {percentage > 0 ? '+' : ''}{percentage}%
                                  </span>
                                </div>
                                {data.reason && (
                                  <div className="text-gray-500 text-xs mt-1">
                                    {data.reason.length > 40 ? data.reason.substring(0, 40) + '...' : data.reason}
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {/* Calculation */}
                          <div className="pt-2 border-t border-blue-200">
                            <div className="text-xs text-gray-600 font-mono">
                              {pricing.basePrice} × {Object.values(pricing.breakdown).reduce((acc, d) => acc * (d.value || 1), 1).toFixed(2)} = {pricing.finalPrice} THB
                            </div>
                          </div>

                          {/* Simple explanation */}
                          <div className="p-2 bg-yellow-50 rounded text-xs">
                            <span className="text-yellow-800 font-medium">
                              💡 {(() => {
                                const total = Object.values(pricing.breakdown).reduce((acc, d) => acc * (d.value || 1), 1);
                                if (total > 1.3) return "High demand + premium factors";
                                if (total > 1.1) return "Moderate demand/peak time";
                                if (total < 0.9) return "Off-peak discount";
                                return "Standard pricing";
                              })()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="flex justify-between">
                        <span className="text-lg font-medium text-gray-800">Total Table Fee:</span>
                        <span className="text-lg font-bold text-[#FF4F18]">{tablePrice} THB</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
            <button
              onClick={() => setPaymentMethod('stripe-qr')}
              className={`flex flex-col items-center p-2 sm:p-3 rounded-lg border-2 transition-all min-h-[80px] sm:min-h-[90px]
                ${paymentMethod === 'stripe-qr' 
                  ? 'border-[#FF4F18] bg-[#FF4F18]/5 text-[#FF4F18]' 
                  : 'border-gray-200 text-gray-600 hover:border-[#FF4F18]/50'}`}
            >
              <FaQrcode className="text-lg sm:text-2xl mb-1 sm:mb-2" />
              <span className="text-xs sm:text-sm font-medium text-center">QR Payment</span>
            </button>
            <button
              onClick={() => setPaymentMethod('credit-card')}
              className={`flex flex-col items-center p-2 sm:p-3 rounded-lg border-2 transition-all min-h-[80px] sm:min-h-[90px]
                ${paymentMethod === 'credit-card' 
                  ? 'border-[#FF4F18] bg-[#FF4F18]/5 text-[#FF4F18]' 
                  : 'border-gray-200 text-gray-600 hover:border-[#FF4F18]/50'}`}
            >
              <FaCreditCard className="text-lg sm:text-2xl mb-1 sm:mb-2" />
              <span className="text-xs sm:text-sm font-medium text-center">Credit Card</span>
            </button>
          </div>

          {/* Stripe QR Payment */}
          {paymentMethod === 'stripe-qr' && (
            <div className="space-y-4">
              <StripeQRPayment
                amount={tablePrice}
                onSuccess={handleStripePaymentSuccess}
                onError={handleStripePaymentError}
                bookingDetails={bookingDetails}
              />
            </div>
          )}

          {/* Stripe Credit Card Form */}
          {paymentMethod === 'credit-card' && (
            <div className="space-y-4">
              <Elements stripe={stripePromise}>
                <StripePaymentForm
                  amount={tablePrice}
                  onSuccess={handleStripePaymentSuccess}
                  onError={handleStripePaymentError}
                  bookingDetails={bookingDetails}
                />
              </Elements>
            </div>
          )}
        </div>

        {/* Cancel button for QR and credit card payments - they handle their own flow */}
        {(paymentMethod === 'stripe-qr' || paymentMethod === 'credit-card') && (
          <div className="border-t border-gray-100 p-4 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}