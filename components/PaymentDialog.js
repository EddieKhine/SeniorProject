import { useState } from 'react';
import { FaCreditCard, FaPaypal, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

export default function PaymentDialog({ bookingDetails, onClose, onSuccess }) {
  const [paymentMethod, setPaymentMethod] = useState('credit-card');
  const [isProcessing, setIsProcessing] = useState(false);
  const amount = (bookingDetails.guestCount * 10).toFixed(2);

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Show success message
      toast.success('Payment successful! Your table has been reserved.', {
        duration: 5000,
        icon: '🎉'
      });
      
      // Optional: Show a more detailed success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50';
      successMessage.innerHTML = `
        <div class="bg-white rounded-xl shadow-xl p-6 max-w-md mx-4 text-center animate-fade-up">
          <div class="text-[#FF4F18] text-5xl mb-4">🎉</div>
          <h3 class="text-xl font-bold text-gray-800 mb-2">Booking Confirmed!</h3>
          <p class="text-gray-600 mb-4">Your table has been successfully reserved. We look forward to serving you!</p>
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
      
      setIsProcessing(false);
      onSuccess();
    } catch (error) {
      setIsProcessing(false);
      toast.error('Payment failed. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 animate-fade-up">
        <div className="border-b border-gray-100 p-4 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">Complete Payment</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-4">
          {/* Booking Summary */}
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

          {/* Payment Methods */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => setPaymentMethod('credit-card')}
              className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all
                ${paymentMethod === 'credit-card' 
                  ? 'border-[#FF4F18] bg-[#FF4F18]/5 text-[#FF4F18]' 
                  : 'border-gray-200 text-gray-600 hover:border-[#FF4F18]/50'}`}
            >
              <FaCreditCard className="text-2xl mb-2" />
              <span className="text-sm font-medium">Credit Card</span>
            </button>
            <button
              onClick={() => setPaymentMethod('paypal')}
              className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all
                ${paymentMethod === 'paypal' 
                  ? 'border-[#FF4F18] bg-[#FF4F18]/5 text-[#FF4F18]' 
                  : 'border-gray-200 text-gray-600 hover:border-[#FF4F18]/50'}`}
            >
              <FaPaypal className="text-2xl mb-2" />
              <span className="text-sm font-medium">PayPal</span>
            </button>
          </div>

          {/* Credit Card Form */}
          {paymentMethod === 'credit-card' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Card Number
                </label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF4F18] focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF4F18] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CVV
                  </label>
                  <input
                    type="text"
                    placeholder="123"
                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF4F18] focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 p-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePayment}
            disabled={isProcessing}
            className="px-6 py-2 bg-[#FF4F18] text-white rounded-lg hover:bg-[#FF4F18]/90 
              transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <FaSpinner className="animate-spin" />
                Processing...
              </>
            ) : (
              `Pay $${amount}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 