import React, { useState } from 'react';

interface FeedbackFormProps {
  onSubmit?: () => void;
  onCancel?: () => void;
}

interface Menu {
  date: string;
  meals: {
    [key: string]: Array<{
      dish_name: string;
      description?: string;
    }>;
  };
}

const FeedbackForm = ({ onSubmit, onCancel }: FeedbackFormProps) => {
  const [formData, setFormData] = useState({
    meal_type: '',
    rating: 0,
    comment: '',
    is_anonymous: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.rating === 0) {
      setError('Please select a rating');
      setLoading(false);
      return;
    }

    if (!formData.meal_type) {
      setError('Please select a meal type');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Please login again');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5000/api/feedback/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setFormData({
          meal_type: '',
          rating: 0,
          comment: '',
          is_anonymous: false
        });
        if (onSubmit) onSubmit();
      } else {
        if (response.status === 401 || response.status === 403) {
          setError('Session expired. Please login again.');
          // Clear invalid tokens
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          // Reload page to show login form
          setTimeout(() => window.location.reload(), 2000);
        } else {
          setError(data.error || 'Failed to submit feedback');
        }
      }
    } catch (error) {
      setError('Network error. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
  };

  const handleRatingClick = (rating: number) => {
    setFormData({
      ...formData,
      rating
    });
  };

  if (success) {
    return (
      <div className="text-center p-6 bg-green-50 rounded-lg">
        <div className="text-green-600 text-4xl mb-4">✅</div>
        <h3 className="text-xl font-semibold text-green-800 mb-2">Feedback Submitted!</h3>
        <p className="text-green-700 mb-4">Thank you for your feedback. It helps us improve our service.</p>
        <button
          onClick={() => setSuccess(false)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          Submit Another Feedback
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Meal Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Which meal would you like to rate? *
        </label>
        <select
          name="meal_type"
          value={formData.meal_type}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Select a meal</option>
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
        </select>
      </div>

      {/* Rating Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          How would you rate this meal? *
        </label>
        <div className="flex flex-col items-center space-y-2">
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`text-4xl transition-all duration-200 hover:scale-110 ${
                  star <= formData.rating ? 'text-yellow-400' : 'text-gray-300'
                }`}
                onClick={() => handleRatingClick(star)}
              >
                ★
              </button>
            ))}
          </div>
          <div className="text-sm text-gray-600">
            {formData.rating === 0 ? 'Click a star to rate' :
             formData.rating === 1 ? 'Poor' :
             formData.rating === 2 ? 'Fair' :
             formData.rating === 3 ? 'Good' :
             formData.rating === 4 ? 'Very Good' : 'Excellent'}
          </div>
        </div>
      </div>

      {/* Comment */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Comments or Suggestions
        </label>
        <textarea
          name="comment"
          value={formData.comment}
          onChange={handleChange}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Share your thoughts about the meal, suggestions for improvement, or anything else you'd like to mention..."
        />
      </div>

      {/* Anonymous Option */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="is_anonymous"
          name="is_anonymous"
          checked={formData.is_anonymous}
          onChange={handleChange}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="is_anonymous" className="ml-2 text-sm text-gray-700">
          Submit anonymously (your name won't be shown with this feedback)
        </label>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Submit Buttons */}
      <div className="flex space-x-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting...' : 'Submit Feedback'}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500 text-center">
        * Share your feedback to help us improve our service
      </p>
    </form>
  );
};

export default FeedbackForm;
