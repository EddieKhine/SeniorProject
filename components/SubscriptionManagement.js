import React, { useState, useEffect } from 'react';
import { 
  FaCreditCard, 
  FaUsers, 
  FaBuilding, 
  FaTable, 
  FaCalendarAlt, 
  FaChartLine, 
  FaHdd,
  FaExclamationTriangle,
  FaCheckCircle,
  FaCrown,
  FaStar,
  FaRocket,
  FaGem,
  FaInfinity
} from 'react-icons/fa';

const SubscriptionManagement = ({ ownerId }) => {
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSubscriptionData();
  }, [ownerId]);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/restaurant-owner/subscription?ownerId=${ownerId}`);
      const data = await response.json();
      
      if (data.success) {
        setSubscriptionData(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch subscription data');
    } finally {
      setLoading(false);
    }
  };

  const getPlanIcon = (planType) => {
    switch (planType) {
      case 'free': return <FaStar className="text-yellow-500" />;
      case 'basic': return <FaCheckCircle className="text-green-500" />;
      case 'business': return <FaRocket className="text-blue-500" />;
      case 'professional': return <FaCrown className="text-purple-500" />;
      case 'enterprise': return <FaGem className="text-pink-500" />;
      default: return <FaStar className="text-gray-500" />;
    }
  };

  const getPlanColor = (planType) => {
    switch (planType) {
      case 'free': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'basic': return 'bg-green-100 text-green-800 border-green-200';
      case 'business': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'professional': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'enterprise': return 'bg-pink-100 text-pink-800 border-pink-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const ProgressBar = ({ label, used, limit, percentage, icon, isUnlimited = false }) => {
    const isExceeded = !isUnlimited && used >= limit;
    const isNearLimit = !isUnlimited && percentage >= 80;
    
    return (
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-semibold text-gray-700">{label}</span>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-gray-900">
              {isUnlimited ? `${used} / ∞` : `${used} / ${limit}`}
            </span>
            {isExceeded && (
              <div className="flex items-center gap-1 text-red-600 text-sm">
                <FaExclamationTriangle />
                <span>Limit Exceeded</span>
              </div>
            )}
            {isNearLimit && !isExceeded && (
              <div className="flex items-center gap-1 text-orange-600 text-sm">
                <FaExclamationTriangle />
                <span>Near Limit</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-300 ${
              isExceeded 
                ? 'bg-red-500' 
                : isNearLimit 
                ? 'bg-orange-500' 
                : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        
        <div className="mt-2 text-sm text-gray-600">
          {isUnlimited ? (
            <span className="flex items-center gap-1">
              <FaInfinity className="text-green-500" />
              Unlimited usage
            </span>
          ) : (
            `${percentage.toFixed(1)}% used`
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading subscription data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-800">
          <FaExclamationTriangle />
          <span className="font-semibold">Error</span>
        </div>
        <p className="text-red-700 mt-1">{error}</p>
      </div>
    );
  }

  if (!subscriptionData.hasSubscription) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center gap-2 text-yellow-800 mb-2">
          <FaStar />
          <span className="font-semibold">Free Plan</span>
        </div>
        <p className="text-yellow-700">{subscriptionData.message}</p>
        <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Upgrade Plan
        </button>
      </div>
    );
  }

  const { subscription, usage, exceededLimits, summary } = subscriptionData;

  return (
    <div className="space-y-6">
      {/* Subscription Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FaCreditCard className="text-blue-600" />
            Subscription Overview
          </h2>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Manage Subscription
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg border-2 ${getPlanColor(subscription.planType)}`}>
            <div className="flex items-center gap-2 mb-2">
              {getPlanIcon(subscription.planType)}
              <span className="font-bold text-lg">{subscription.planType.toUpperCase()}</span>
            </div>
            <div className="text-sm">
              <div>Status: <span className="font-semibold">{subscription.status}</span></div>
              <div>Billing: <span className="font-semibold">{subscription.billingCycle}</span></div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Monthly Cost</div>
            <div className="text-2xl font-bold text-gray-900">
              {subscription.currency} {subscription.price}
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Next Billing</div>
            <div className="text-lg font-semibold text-gray-900">
              {subscription.endDate ? new Date(subscription.endDate).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Usage Limits */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FaChartLine className="text-green-600" />
          Usage & Limits
        </h3>
        
        {exceededLimits.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 text-red-800 mb-2">
              <FaExclamationTriangle />
              <span className="font-semibold">Limits Exceeded</span>
            </div>
            <p className="text-red-700 text-sm">
              You have exceeded limits for: {exceededLimits.join(', ')}. 
              Consider upgrading your plan to continue using these features.
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ProgressBar
            label="Restaurants"
            used={usage.restaurants.used}
            limit={usage.restaurants.limit}
            percentage={usage.restaurants.percentage}
            icon={<FaBuilding className="text-blue-600" />}
            isUnlimited={usage.restaurants.limit === -1}
          />
          
          <ProgressBar
            label="Staff Members"
            used={usage.staff.used}
            limit={usage.staff.limit}
            percentage={usage.staff.percentage}
            icon={<FaUsers className="text-purple-600" />}
            isUnlimited={usage.staff.limit === -1}
          />
          
          <ProgressBar
            label="Floor Plans"
            used={usage.floorPlans.used}
            limit={usage.floorPlans.limit}
            percentage={usage.floorPlans.percentage}
            icon={<FaBuilding className="text-green-600" />}
            isUnlimited={usage.floorPlans.limit === -1}
          />
          
          <ProgressBar
            label="Tables"
            used={usage.tables.used}
            limit={usage.tables.limit}
            percentage={usage.tables.percentage}
            icon={<FaTable className="text-orange-600" />}
            isUnlimited={usage.tables.limit === -1}
          />
          
          <ProgressBar
            label="Monthly Bookings"
            used={usage.monthlyBookings.used}
            limit={usage.monthlyBookings.limit}
            percentage={usage.monthlyBookings.percentage}
            icon={<FaCalendarAlt className="text-blue-600" />}
            isUnlimited={usage.monthlyBookings.limit === -1}
          />
          
          <ProgressBar
            label="API Calls (Monthly)"
            used={usage.apiCalls.used}
            limit={usage.apiCalls.limit}
            percentage={usage.apiCalls.percentage}
            icon={<FaChartLine className="text-indigo-600" />}
            isUnlimited={usage.apiCalls.limit === -1}
          />
          
          <ProgressBar
            label="Storage (MB)"
            used={usage.storage.used}
            limit={usage.storage.limit}
            percentage={usage.storage.percentage}
            icon={<FaHdd className="text-gray-600" />}
            isUnlimited={usage.storage.limit === -1}
          />
        </div>
      </div>

      {/* Quick Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{summary.totalRestaurants}</div>
            <div className="text-sm text-gray-600">Restaurants</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{summary.totalStaff}</div>
            <div className="text-sm text-gray-600">Staff Members</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{summary.totalFloorPlans}</div>
            <div className="text-sm text-gray-600">Floor Plans</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{summary.monthlyBookings}</div>
            <div className="text-sm text-gray-600">This Month's Bookings</div>
          </div>
        </div>
      </div>

      {/* Plan Features */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Plan Features</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(subscription.features).map(([feature, enabled]) => (
            <div key={feature} className="flex items-center gap-2">
              {enabled ? (
                <FaCheckCircle className="text-green-500" />
              ) : (
                <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
              )}
              <span className="text-sm text-gray-700 capitalize">
                {feature.replace(/([A-Z])/g, ' $1').trim()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManagement;
