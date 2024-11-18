"use client"; // Ensures the component runs on the client side

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);  // Add a loading state
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoading(true);  // Start loading

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const { message } = await res.json();  // Adjusted to match the response from the server
        setError(message);  // Set the error message
        setLoading(false);  // Stop loading
        return;
      }

      const data = await res.json();
      alert('Login successful');
      router.push('/'); // Redirect to home page after login
    } catch (err) {
      console.error('Login failed:', err);
      setError('An error occurred. Please try again.');
      setLoading(false);  // Stop loading
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gradient-to-r from-[#FF6A00] to-[#FFB400]">
      <div className="flex w-full max-w-4xl bg-white rounded-lg shadow-lg">
        {/* Image section */}
        <div className="w-1/2 h-full">
          <img
            src="images/signup-image2.png"
            alt="Login Image"
            className="w-full h-full object-cover rounded-l-lg"
          />
        </div>

        {/* Form section */}
        <form onSubmit={handleLogin} className="w-1/2 p-8">
          <h2 className="text-2xl font-bold text-center text-[#F4A261] mb-6">Login</h2>

          {error && <p className="text-red-500 text-center mb-4">{error}</p>}

          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F4A261] text-black"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F4A261] text-black"
            />
          </div>

          <button
            type="submit"
            disabled={loading}  // Disable button while loading
            className={`w-full py-3 mt-6 ${loading ? 'bg-gray-400' : 'bg-[#F4A261]'} text-black font-semibold rounded-md hover:bg-[#E07B5D] transition`}
          >
            {loading ? 'Logging in...' : 'Login'}  {/* Display loading state */}
          </button>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account? <a href="/signup" className="text-[#F4A261] hover:text-[#E07B5D]">Sign Up</a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
