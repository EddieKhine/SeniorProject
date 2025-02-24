'use client';

import { useState, useEffect } from 'react';
import { format, parseISO, isToday, isPast } from 'date-fns';
import { motion } from 'framer-motion';
import { RiCalendarLine, RiTimeLine, RiUserLine, RiPhoneLine, RiMailLine } from 'react-icons/ri';
import { FaCheckCircle, FaTimesCircle, FaSpinner, FaTrash } from 'react-icons/fa';
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
        return 'bg-green-100 text-green-800 border border-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border border-red-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-300';
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
    <div className="bg-white rounded-xl shadow-md p-6 max-h-[calc(100vh-200px)] flex flex-col">
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-[#FF4F18]/10 rounded-lg p-4">
          <h3 className="text-[#FF4F18] font-semibold">Total Bookings</h3>
          <p className="text-2xl font-bold text-[#FF4F18]">{stats.total}</p>
        </div>
        <div className="bg-[#FF4F18]/10 rounded-lg p-4">
          <h3 className="text-[#FF4F18] font-semibold">Confirmed</h3>
          <p className="text-2xl font-bold text-[#FF4F18]">{stats.confirmed}</p>
        </div>
        <div className="bg-[#FF4F18]/10 rounded-lg p-4">
          <h3 className="text-[#FF4F18] font-semibold">Pending</h3>
          <p className="text-2xl font-bold text-[#FF4F18]">{stats.pending}</p>
        </div>
        <div className="bg-[#FF4F18]/10 rounded-lg p-4">
          <h3 className="text-[#FF4F18] font-semibold">Cancelled</h3>
          <p className="text-2xl font-bold text-[#FF4F18]">{stats.cancelled}</p>
        </div>
        <div className="bg-[#FF4F18]/10 rounded-lg p-4">
          <h3 className="text-[#FF4F18] font-semibold">Completed</h3>
          <p className="text-2xl font-bold text-[#FF4F18]">{stats.completed}</p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="flex flex-wrap text-black gap-4 mb-6">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF4F18] focus:border-transparent"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF4F18] focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
        </select>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF4F18] focus:border-transparent"
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {/* Table Layout - Added overflow handling */}
      <div className="flex-1 overflow-y-auto">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#111827] uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#111827] uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#111827] uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#111827] uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#111827] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBookings.map((booking) => (
                <motion.tr
                  key={booking._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <RiUserLine className="text-[#FF4F18] mr-2" />
                      <div className="text-sm font-medium text-[#111827]">{booking.customerName}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-[#111827]">
                      <div className="flex items-center mb-1">
                        <RiPhoneLine className="text-[#FF4F18] mr-2" />
                        {booking.customerPhone}
                      </div>
                      <div className="flex items-center">
                        <RiMailLine className="text-[#FF4F18] mr-2" />
                        {booking.customerEmail}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-[#111827]">
                      <div className="flex items-center mb-1">
                        <RiCalendarLine className="text-[#FF4F18] mr-2" />
                        {format(parseISO(booking.date), 'MMM dd, yyyy')}
                      </div>
                      <div className="flex items-center">
                        <RiTimeLine className="text-[#FF4F18] mr-2" />
                        {`${booking.startTime} - ${booking.endTime}`}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeStyle(booking.status)}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {booking.status === 'pending' && (
                        <>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleBookingAction(booking._id, 'confirm')}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                            title="Confirm Booking"
                          >
                            <FaCheckCircle className="w-5 h-5" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleBookingAction(booking._id, 'cancel')}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Cancel Booking"
                          >
                            <FaTimesCircle className="w-5 h-5" />
                          </motion.button>
                        </>
                      )}
                      {booking.status === 'confirmed' && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleBookingAction(booking._id, 'complete')}
                          className="p-2 text-[#FF4F18] hover:bg-[#FF4F18]/10 rounded-lg transition-all"
                          title="Mark as Completed"
                        >
                          <FaCheckCircle className="w-5 h-5" />
                        </motion.button>
                      )}
                      {(booking.status === 'cancelled' || booking.status === 'completed') && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDeleteBooking(booking._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete Booking"
                        >
                          <FaTrash className="w-5 h-5" />
                        </motion.button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center">
          <div className="p-4 rounded-lg bg-white shadow-lg">
            <FaSpinner className="w-8 h-8 text-[#FF4F18] animate-spin" />
          </div>
        </div>
      )}
    </div>
  );
} 