'use client';

import { useState, useEffect } from 'react';
import { format, parseISO, isToday, isPast } from 'date-fns';
import { motion } from 'framer-motion';
import { RiCalendarLine, RiTimeLine, RiUserLine, RiPhoneLine, RiMailLine } from 'react-icons/ri';
import { FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function RestaurantReservation({ restaurantId }) {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    return today.toISOString().split('T')[0];
  });
  const [filterStatus, setFilterStatus] = useState('all');
  const [timeRange, setTimeRange] = useState('today');
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    pending: 0,
    cancelled: 0,
    completed: 0,
    totalGuests: 0
  });
  const [token, setToken] = useState(null);
  const [selectedBookings, setSelectedBookings] = useState(new Set());
  const [bulkAction, setBulkAction] = useState('');

  useEffect(() => {
    const storedToken = localStorage.getItem('restaurantOwnerToken');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  useEffect(() => {
    if (token && restaurantId) {
      fetchBookings();
    }
  }, [selectedDate, filterStatus, timeRange, restaurantId, token]);

  const fetchBookings = async () => {
    if (!token || !restaurantId) return;

    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        date: selectedDate,
        status: filterStatus !== 'all' ? filterStatus : '',
        timeRange: timeRange
      });

      console.log('Fetching bookings with params:', queryParams.toString());

      const response = await fetch(
        `/api/bookings/restaurant/${restaurantId}?${queryParams.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch bookings');
      }
      
      const data = await response.json();
      console.log('Received bookings data:', data);

      setBookings(data.bookings || []);
      setStats(data.stats || {
        total: 0,
        confirmed: 0,
        pending: 0,
        cancelled: 0,
        completed: 0,
        totalGuests: 0
      });
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error(error.message || 'Failed to fetch bookings');
      setBookings([]);
      setStats({
        total: 0,
        confirmed: 0,
        pending: 0,
        cancelled: 0,
        completed: 0,
        totalGuests: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBookingAction = async (bookingId, action) => {
    if (!token) {
      toast.error('Authentication required');
      return;
    }

    try {
      const response = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: action === 'confirm' ? 'confirmed' 
            : action === 'cancel' ? 'cancelled'
            : 'completed'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update booking status');
      }
      
      toast.success(`Booking ${action}ed successfully`);
      fetchBookings();
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Failed to update booking');
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const bookingDate = parseISO(booking.date);
    switch (filterStatus) {
      case 'upcoming':
        return !isPast(bookingDate) || isToday(bookingDate);
      case 'past':
        return isPast(bookingDate) && !isToday(bookingDate);
      case 'today':
        return isToday(bookingDate);
      default:
        return true;
    }
  });

  const handleBulkAction = async () => {
    if (!bulkAction || selectedBookings.size === 0) return;

    try {
      const promises = Array.from(selectedBookings).map(bookingId =>
        fetch(`/api/bookings/${bookingId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ status: bulkAction }),
        })
      );

      await Promise.all(promises);
      toast.success(`Successfully updated ${selectedBookings.size} bookings`);
      setSelectedBookings(new Set());
      setBulkAction('');
      fetchBookings();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error('Failed to update some bookings');
    }
  };

  const toggleBookingSelection = (bookingId) => {
    const newSelection = new Set(selectedBookings);
    if (newSelection.has(bookingId)) {
      newSelection.delete(bookingId);
    } else {
      newSelection.add(bookingId);
    }
    setSelectedBookings(newSelection);
  };

  const selectAllBookings = () => {
    if (selectedBookings.size === bookings.length) {
      setSelectedBookings(new Set());
    } else {
      setSelectedBookings(new Set(bookings.map(b => b._id)));
    }
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    if (!newDate) {
      const today = new Date();
      today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
      setSelectedDate(today.toISOString().split('T')[0]);
    } else {
      setSelectedDate(newDate);
    }
  };

  const handleTimeRangeChange = (e) => {
    setTimeRange(e.target.value);
    // Reset date selection when switching to a time range
    if (e.target.value !== '') {
      const today = new Date();
      today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
      setSelectedDate(today.toISOString().split('T')[0]);
    }
  };

  const handleFilterChange = (e) => {
    setFilterStatus(e.target.value);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Filters and Stats Panel */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
          {/* Date and Time Range Filters */}
          <div className="flex gap-4">
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF4F18]"
              disabled={timeRange !== ''}
            />
            <select
              value={timeRange}
              onChange={handleTimeRangeChange}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF4F18]"
            >
              <option value="">Select Specific Date</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            <select
              value={filterStatus}
              onChange={handleFilterChange}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF4F18]"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Bulk Actions */}
          {selectedBookings.size > 0 && (
            <div className="flex items-center gap-4">
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF4F18]"
              >
                <option value="">Bulk Actions</option>
                <option value="confirmed">Confirm Selected</option>
                <option value="cancelled">Cancel Selected</option>
                <option value="completed">Mark Selected as Completed</option>
              </select>
              <button
                onClick={handleBulkAction}
                disabled={!bulkAction}
                className="px-4 py-2 bg-[#FF4F18] text-white rounded-lg hover:bg-[#FF4F18]/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply to {selectedBookings.size} Selected
              </button>
            </div>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600">Total Bookings</p>
            <p className="text-2xl font-semibold text-[#141517]">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600">Confirmed</p>
            <p className="text-2xl font-semibold text-green-500">{stats.confirmed}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-2xl font-semibold text-yellow-500">{stats.pending}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600">Cancelled</p>
            <p className="text-2xl font-semibold text-red-500">{stats.cancelled}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-2xl font-semibold text-blue-500">{stats.completed}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600">Total Guests</p>
            <p className="text-2xl font-semibold text-[#FF4F18]">{stats.totalGuests}</p>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Table Header */}
          <div className="grid grid-cols-[auto,1fr,1fr,1fr,1fr,1fr,auto] gap-4 p-4 bg-gray-50 border-b border-gray-200 font-medium text-gray-700">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={selectedBookings.size === bookings.length}
                onChange={selectAllBookings}
                className="w-4 h-4 rounded border-gray-300 text-[#FF4F18] focus:ring-[#FF4F18]"
              />
            </div>
            <div>Booking ID</div>
            <div>Customer</div>
            <div>Date & Time</div>
            <div>Table & Guests</div>
            <div>Status</div>
            <div>Actions</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-200">
            {bookings.map((booking) => (
              <div
                key={booking._id}
                className="grid grid-cols-[auto,1fr,1fr,1fr,1fr,1fr,auto] gap-4 p-4 items-center hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedBookings.has(booking._id)}
                    onChange={() => toggleBookingSelection(booking._id)}
                    className="w-4 h-4 rounded border-gray-300 text-[#FF4F18] focus:ring-[#FF4F18]"
                  />
                </div>
                <div className="text-gray-900 font-medium">#{booking._id.slice(-6)}</div>
                <div>
                  <div className="text-gray-900">{booking.customerName}</div>
                  <div className="text-sm text-gray-500">{booking.customerEmail}</div>
                </div>
                <div>
                  <div className="text-gray-900">{format(parseISO(booking.date), 'MMM dd, yyyy')}</div>
                  <div className="text-sm text-gray-500">{booking.startTime} - {booking.endTime}</div>
                </div>
                <div>
                  <div className="text-gray-900">Table {booking.tableId}</div>
                  <div className="text-sm text-gray-500">{booking.guestCount} Guests</div>
                </div>
                <div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeStyle(booking.status)}`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {booking.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleBookingAction(booking._id, 'confirm')}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Confirm Booking"
                      >
                        <FaCheckCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleBookingAction(booking._id, 'cancel')}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Cancel Booking"
                      >
                        <FaTimesCircle className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  {booking.status === 'confirmed' && (
                    <button
                      onClick={() => handleBookingAction(booking._id, 'complete')}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Mark as Completed"
                    >
                      <FaCheckCircle className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center">
          <div className="p-4 rounded-lg bg-white shadow-lg">
            <FaSpinner className="w-8 h-8 text-[#FF4F18] animate-spin" />
          </div>
        </div>
      )}
    </div>
  );
} 