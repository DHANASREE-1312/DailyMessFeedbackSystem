import React, { useState, useEffect } from 'react';
import { User } from '../App';

interface AdminDashboardProps {
  user: User;
}

interface FeedbackStats {
  overall: {
    total_feedback: number;
    avg_rating: number;
    min_rating: number;
    max_rating: number;
    negative_feedback: number;
    days_covered: number;
  };
  by_meal_type: Array<{
    meal_type: string;
    count: number;
    avg_rating: number;
  }>;
}

interface Feedback {
  id: number;
  rating: number;
  comment: string;
  is_anonymous: boolean;
  status: string;
  meal_date: string;
  meal_type: string;
  created_at: string;
  username?: string;
  email?: string;
  dish_names?: string;
}

const AdminDashboard = ({ user }: AdminDashboardProps) => {
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
    rating: '',
    meal_type: '',
    status: ''
  });

  useEffect(() => {
    fetchStats();
    fetchFeedback();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`http://localhost:5000/api/feedback/admin/stats?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchFeedback = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const queryParams = new URLSearchParams({
        ...filters,
        limit: '50',
        offset: '0'
      }).toString();

      const response = await fetch(`http://localhost:5000/api/feedback/admin/all?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFeedback(data.feedback || []);
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const applyFilters = () => {
    fetchStats();
    fetchFeedback();
  };

  const updateFeedbackStatus = async (feedbackId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5000/api/feedback/${feedbackId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        // Refresh the feedback list
        fetchFeedback();
        fetchStats();
      } else {
        alert('Failed to update feedback status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update feedback status');
    }
  };

  const exportData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`http://localhost:5000/api/feedback/admin/export?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `feedback-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-lg ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Admin Dashboard
        </h2>
        <p className="text-gray-600">
          Monitor feedback trends and manage the mess feedback system.
        </p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-500 text-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-2">Total Feedback</h3>
            <p className="text-3xl font-bold">{stats.overall.total_feedback}</p>
          </div>

          <div className="bg-green-500 text-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-2">Average Rating</h3>
            <p className="text-3xl font-bold">{stats.overall.avg_rating?.toFixed(1) || 'N/A'}</p>
          </div>

          <div className="bg-yellow-500 text-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-2">Negative Feedback</h3>
            <p className="text-3xl font-bold">{stats.overall.negative_feedback}</p>
          </div>

          <div className="bg-purple-500 text-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-2">Days Covered</h3>
            <p className="text-3xl font-bold">{stats.overall.days_covered}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">🔍 Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              name="date_from"
              value={filters.date_from}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              name="date_to"
              value={filters.date_to}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
            <select
              name="rating"
              value={filters.rating}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Ratings</option>
              <option value="1">1 Star</option>
              <option value="2">2 Stars</option>
              <option value="3">3 Stars</option>
              <option value="4">4 Stars</option>
              <option value="5">5 Stars</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meal Type</label>
            <select
              name="meal_type"
              value={filters.meal_type}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Meals</option>
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={applyFilters}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            Apply Filters
          </button>
          <button
            onClick={exportData}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            📊 Export CSV
          </button>
        </div>
      </div>

      {/* Meal Type Breakdown */}
      {stats && stats.by_meal_type.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">🍽️ Breakdown by Meal Type</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {stats.by_meal_type.map((meal) => (
              <div key={meal.meal_type} className="border rounded-lg p-4">
                <h4 className="font-semibold capitalize text-lg text-blue-600 mb-2">
                  {meal.meal_type}
                </h4>
                <p className="text-2xl font-bold text-gray-800">{meal.count} feedback{meal.count !== 1 ? 's' : ''}</p>
                <p className="text-gray-600">Avg Rating: {meal.avg_rating?.toFixed(1) || 'N/A'}</p>
                {renderStars(Math.round(meal.avg_rating || 0))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Feedback */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">📋 Recent Feedback</h3>

        {feedback.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No feedback found matching the current filters.
          </p>
        ) : (
          <div className="space-y-4">
            {feedback.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 bg-white shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <p className="font-semibold capitalize text-lg">{item.meal_type}</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{item.meal_date}</p>
                    <p className="text-sm text-gray-500">
                      {item.is_anonymous ? 'Anonymous User' : (item.username || item.email)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    {renderStars(item.rating)}
                    <span className="font-semibold text-gray-700">{item.rating}/5</span>
                  </div>
                </div>

                {item.comment && (
                  <p className="text-gray-700 mb-3 italic bg-gray-50 p-3 rounded">"{item.comment}"</p>
                )}

                {item.dish_names && (
                  <p className="text-sm text-gray-500 mb-2">🍽️ {item.dish_names}</p>
                )}

                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    Submitted: {new Date(item.created_at).toLocaleString()}
                  </p>

                  {/* Status Change Dropdown */}
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Status:</label>
                    <select
                      value={item.status}
                      onChange={(e) => updateFeedbackStatus(item.id, e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
