'use client';

import { useState, useEffect, useCallback } from 'react';
import { FaStar, FaImage, FaTimes, FaTrash, FaRegSmile, FaRegMeh, FaRegFrown } from 'react-icons/fa';
import Image from 'next/image';
import ImageUpload from '@/components/ImageUpload';

export default function ReviewSection({ restaurantId, onLoginClick }) {
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '', images: [] });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userReview, setUserReview] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/reviews`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch reviews');
      }
      const data = await response.json();
      console.log('Fetched reviews with images:', data.reviews);
      setReviews(data.reviews || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setError('Failed to load reviews. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchReviews();
    const token = localStorage.getItem('customerToken');
    const user = localStorage.getItem('customerUser');
    setIsLoggedIn(!!token);
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
  }, [fetchReviews, restaurantId]);

  useEffect(() => {
    if (reviews.length > 0 && isLoggedIn) {
      const token = localStorage.getItem('customerToken');
      const userId = JSON.parse(atob(token.split('.')[1])).userId;
      const existingReview = reviews.find(review => review.userId?._id === userId);
      setUserReview(existingReview);
    }
  }, [reviews, isLoggedIn]);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (newReview.images.length + files.length > 5) {
      setError('Maximum 5 images allowed per review');
      return;
    }

    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'review');

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload image');
        }

        const { url } = await response.json();
        // Store the full S3 URL
        setNewReview(prev => ({
          ...prev,
          images: [...prev.images, url]
        }));
      } catch (error) {
        console.error('Error uploading image:', error);
        setError('Failed to upload image. Please try again.');
      }
    }
  };

  const validateReview = () => {
    if (newReview.comment.length < 10) {
      setError('Review must be at least 10 characters long');
      return false;
    }
    if (newReview.rating < 1) {
      setError('Please select a rating');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (userReview) {
      setShowConfirmDialog(true);
      return;
    }
    await submitReview();
  };

  const handleDeleteAndResubmit = async () => {
    try {
      const token = localStorage.getItem('customerToken');
      const response = await fetch(`/api/restaurants/${restaurantId}/reviews`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reviewId: userReview._id })
      });

      if (!response.ok) throw new Error('Failed to delete review');
      
      await submitReview();
      setShowConfirmDialog(false);
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to update review. Please try again.');
    }
  };

  const submitReview = async () => {
    if (!validateReview()) {
      return;
    }

    setIsSubmitting(true);
    setError('');
    
    try {
      const token = localStorage.getItem('customerToken');
      if (!token) {
        setError('Please log in to submit a review');
        return;
      }

      console.log('Submitting review with images:', newReview.images);

      const response = await fetch(`/api/restaurants/${restaurantId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rating: newReview.rating,
          comment: newReview.comment,
          images: newReview.images
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit review');
      }

      const { review } = await response.json();
      console.log('Submitted review:', review);
      setReviews(prevReviews => [review, ...prevReviews]);
      setNewReview({ rating: 5, comment: '', images: [] });
      setError('');
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    
    try {
      const token = localStorage.getItem('customerToken');
      const response = await fetch(`/api/restaurants/${restaurantId}/reviews`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reviewId })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      setReviews(prev => prev.filter(review => review._id !== reviewId));
    } catch (error) {
      setError(error.message);
    }
  };

  const ConfirmDialog = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-bold mb-4">Replace Existing Review?</h3>
        <p className="text-gray-600 mb-6">
          You already have a review for this restaurant. Would you like to delete your existing review and post a new one?
        </p>
        <div className="flex justify-end gap-4">
          <button
            onClick={() => setShowConfirmDialog(false)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteAndResubmit}
            className="px-4 py-2 bg-[#FF4F18] text-white rounded-lg hover:bg-[#FF4F18]/90"
          >
            Replace Review
          </button>
        </div>
      </div>
    </div>
  );

  const getFullImageUrl = (imageUrl) => {
    if (!imageUrl) return '/default-image.jpg';
    if (imageUrl.startsWith('http') || imageUrl.startsWith('blob')) {
      return imageUrl;
    }
    // If it's a relative path from your upload API
    return `${process.env.NEXT_PUBLIC_API_URL || ''}${imageUrl}`;
  };

  const getProfileImageUrl = (user) => {
    if (!user || !user.profileImage) return '/default-avatar.png';
    // If it's already a full S3 URL, return it
    if (user.profileImage.startsWith('https://')) {
      return user.profileImage;
    }
    return '/default-avatar.png';
  };

  const renderReviewForm = () => {
    if (!isLoggedIn) {
      return (
        <div className="bg-gradient-to-r from-white to-gray-50 rounded-xl p-8 shadow-lg border border-gray-100">
          <div className="text-center space-y-4">
            <FaRegSmile className="text-4xl text-[#FF4F18] mx-auto" />
            <h3 className="text-xl font-semibold text-gray-800">Share Your Experience</h3>
            <p className="text-gray-600">Join our community and let others know about your dining experience</p>
            <button
              onClick={onLoginClick}
              className="px-8 py-3 bg-[#FF4F18] text-white rounded-full hover:bg-[#FF4F18]/90 transition-all transform hover:scale-105 shadow-md"
            >
              Log In to Write a Review
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 space-y-6">
        <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
          <div className="w-12 h-12 bg-gray-100 rounded-full overflow-hidden">
            <Image 
              src={getProfileImageUrl(currentUser)}
              alt={`${currentUser?.firstName || 'Anonymous'}'s profile`}
              width={48}
              height={48}
              className="object-cover"
            />
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {currentUser?.firstName} {currentUser?.lastName}
            </p>
            <p className="text-sm text-gray-500">Sharing your experience</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <p className="text-gray-600 font-medium">How was your experience?</p>
            <div className="flex gap-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                  className={`text-3xl transition-all transform hover:scale-110 ${
                    star <= newReview.rating ? 'text-[#FF4F18]' : 'text-gray-300'
                  }`}
                >
                  <FaStar />
                </button>
              ))}
            </div>
            <div className="text-sm text-gray-500">
              {newReview.rating === 5 && "Outstanding!"}
              {newReview.rating === 4 && "Very Good"}
              {newReview.rating === 3 && "Good"}
              {newReview.rating === 2 && "Fair"}
              {newReview.rating === 1 && "Poor"}
            </div>
          </div>

          <div className="relative">
            <textarea
              value={newReview.comment}
              onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
              placeholder="Tell us more about your experience..."
              className="w-full p-4 border text-black rounded-xl focus:ring-2 focus:ring-[#FF4F18]/20 focus:border-[#FF4F18] transition-all"
              rows={4}
              required
            />
            <span className="absolute bottom-2 right-2 text-sm text-gray-400">
              {newReview.comment.length}/500
            </span>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Add Photos</p>
            <div className="flex gap-3 flex-wrap">
              {newReview.images.map((url, index) => (
                <div key={index} className="relative group">
                  <div className="w-24 h-24 rounded-lg overflow-hidden">
                    <Image src={url} alt="Review" width={96} height={96} className="object-cover" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewReview(prev => ({
                      ...prev,
                      images: prev.images.filter((_, i) => i !== index)
                    }))}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <FaTimes size={12} />
                  </button>
                </div>
              ))}
              
              <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#FF4F18] transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <FaImage className="text-gray-400 text-xl mb-1" />
                <span className="text-xs text-gray-500">Add Photos</span>
                <span className="text-xs text-gray-400">({newReview.images.length}/5)</span>
              </label>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-[#FF4F18] text-white rounded-full hover:bg-[#FF4F18]/90 transition-all transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shadow-md"
          >
            {isSubmitting ? 'Posting...' : 'Share Your Review'}
          </button>
        </form>
      </div>
    );
  };

  const renderReviews = () => (
    <div className="space-y-6">
      {reviews.map((review) => (
        <div key={review._id} 
          className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-100 rounded-full overflow-hidden">
                <Image 
                  src={getProfileImageUrl(review.userId)}
                  alt={`${review.userId?.firstName || 'Anonymous'}'s profile`}
                  width={48}
                  height={48}
                  className="object-cover"
                />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {review.userId?.firstName || 'Anonymous'} {review.userId?.lastName || ''}
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5 text-[#FF4F18]">
                    {[...Array(review.rating)].map((_, i) => (
                      <FaStar key={i} className="text-sm" />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">
                    • {new Date(review.createdAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </span>
                </div>
              </div>
            </div>
            {isLoggedIn && review.userId?._id === JSON.parse(atob(localStorage.getItem('customerToken').split('.')[1])).userId && (
              <button
                onClick={() => handleDeleteReview(review._id)}
                className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-full"
              >
                <FaTrash size={14} />
              </button>
            )}
          </div>
          <p className="text-gray-600 ml-16 mb-4">{review.comment}</p>
          
          {review.images && review.images.length > 0 && (
            <div className="ml-16 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {review.images.map((imageUrl, index) => (
                <div 
                  key={index} 
                  className="relative aspect-square rounded-lg overflow-hidden hover:opacity-90 transition-opacity cursor-pointer group"
                >
                  <Image
                    src={getFullImageUrl(imageUrl)}
                    alt={`Review image ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    onClick={() => window.open(getFullImageUrl(imageUrl), '_blank')}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity" />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
        <div className="flex items-center gap-2">
          <div className="text-[#FF4F18] font-medium text-lg">
            {reviews.length > 0 
              ? (reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length).toFixed(1)
              : '0.0'
            }
          </div>
          <div className="flex text-[#FF4F18]">
            <FaStar />
          </div>
          <span className="text-gray-500">({reviews.length})</span>
        </div>
      </div>
      {renderReviewForm()}
      {showConfirmDialog && <ConfirmDialog />}
      {renderReviews()}
    </div>
  );
} 