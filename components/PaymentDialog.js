import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { toast } from 'react-hot-toast';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

function CustomCardForm({ bookingDetails, onClose, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [form, setForm] = useState({
    name: '',
    email: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const amount = (bookingDetails.guestCount * 10).toFixed(2);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);

    if (!stripe || !elements) {
      setError('Stripe is not loaded');
      setIsProcessing(false);
      return;
    }

    // 1. Create PaymentMethod
    const cardElement = elements.getElement(CardElement);
    const { paymentMethod, error: pmError } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: {
        name: form.name,
        email: form.email,
      },
    });
    if (pmError) {
      setError(pmError.message);
      setIsProcessing(false);
      return;
    }

    // 2. Call backend to create PaymentIntent
    const res = await fetch('/api/payments/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: parseFloat(amount),
        currency: 'usd',
        payment_method: paymentMethod.id,
        bookingDetails,
        payment_method_types: ['card'],
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to create payment intent');
      setIsProcessing(false);
      return;
    }
    const clientSecret = data.clientSecret;

    // 3. Confirm the card payment
    const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: paymentMethod.id,
      receipt_email: form.email,
    });
    setIsProcessing(false);
    if (confirmError) {
      setError(confirmError.message);
      return;
    }
    if (paymentIntent && paymentIntent.status === 'succeeded') {
      toast.success('Payment successful! Your table has been reserved.', {
        duration: 5000,
        icon: '🎉',
      });
      onSuccess();
    } else {
      setError('Payment was not successful.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 animate-fade-up">
        <div className="border-b border-gray-100 p-4 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">Complete Payment</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">×</button>
        </div>
        <form className="p-4" onSubmit={handleSubmit}>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-800 mb-2">Booking Summary</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p>Date: {new Date(bookingDetails.date).toLocaleDateString()}</p>
              <p>Time: {bookingDetails.time}</p>
              <p>Table: {bookingDetails.tableId}</p>
              <p>Guests: {bookingDetails.guestCount}</p>
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-lg font-medium text-gray-800">Total: ${amount}</p>
              </div>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input name="name" type="text" value={form.name} onChange={handleChange} required className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF4F18] focus:border-transparent" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} required className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF4F18] focus:border-transparent" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Card Details</label>
            <div className="p-2.5 border border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-[#FF4F18] focus-within:border-transparent">
              <CardElement options={{ style: { base: { fontSize: '16px' } } }} />
            </div>
          </div>
          {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
          <div className="border-t border-gray-100 pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">Cancel</button>
            <button type="submit" disabled={isProcessing} className="px-6 py-2 bg-[#FF4F18] text-white rounded-lg hover:bg-[#FF4F18]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              {isProcessing ? 'Processing...' : `Pay $${amount}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PaymentDialog(props) {
  return (
    <Elements stripe={stripePromise}>
      <CustomCardForm {...props} />
    </Elements>
  );
} 