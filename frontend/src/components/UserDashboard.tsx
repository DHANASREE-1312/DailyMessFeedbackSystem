import React, { useState, useEffect } from 'react';
import { User } from '../App';
import FeedbackForm from './FeedbackForm';
import MealMenu from './MealMenu';

interface UserDashboardProps {
  user: User;
}

interface Feedback {
  id: number;
  rating: number;
  comment: string;
  meal_date: string;
  meal_type: string;
  created_at: string;
  status: string;
  dish_names?: string;
}


const UserDashboard = ({ user }: UserDashboardProps) => {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('today');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  useEffect(() => {
    fetchFeedbackHistory();
  }, []);


  const fetchFeedbackHistory = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:5000/api/feedback/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFeedback(data.feedback || []);
      }
    } catch (error) {
      console.error('Error fetching feedback history:', error);
    } finally {
      setLoading(false);
    }
  };



  const handleFeedbackSubmitted = () => {
    setShowFeedbackForm(false);
    fetchFeedbackHistory(); // Refresh feedback history
  };

  const tabs = [
    { id: 'today', label: 'Today\'s Meal', icon: '🍽️' },
    { id: 'feedback', label: 'Submit Feedback', icon: '📝' },
    { id: 'history', label: 'Feedback History', icon: '📋' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <span className="text-2xl">🍽️</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Daily Mess Feedback</h1>
                <p className="text-sm text-gray-600">Welcome back, {user.username}!</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">{new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-8 overflow-hidden">
          <div className="flex border-b border-gray-200">
            {tabs.map((tab) => {
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 font-medium transition-all duration-200 ${activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md transform scale-105'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'today' && (
              <MealMenu />
            )}

            {activeTab === 'feedback' && (
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">📝 Submit Your Feedback</h2>
                  <p className="text-gray-600">Help us improve by sharing your thoughts about each meal!</p>
                </div>

                {showFeedbackForm ? (
                  <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                    <FeedbackForm
                      onSubmit={handleFeedbackSubmitted}
                      onCancel={() => setShowFeedbackForm(false)}
                    />
                  </div>
                ) : (
                  <div className="text-center">
                    <button
                      onClick={() => setShowFeedbackForm(true)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                    >
                      <span className="mr-2">📝</span>
                      Start Giving Feedback
                    </button>
                    <p className="text-sm text-gray-500 mt-4">You can submit one feedback per meal type per day</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">📋 Your Feedback History</h2>
                  <p className="text-gray-600">Track your previous feedback and see how you\'ve rated our meals!</p>
                </div>

                {feedback.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-xl shadow-lg border border-gray-200">
                    <div className="text-6xl mb-4">📝</div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No Feedback Yet</h3>
                    <p className="text-gray-500 mb-4">You haven't submitted any feedback yet. Try rating today's meals!</p>
                    <button
                      onClick={() => setActiveTab('feedback')}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Submit Your First Feedback
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {feedback.map((item) => (
                      <div key={item.id} className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-full ${item.meal_type === 'breakfast' ? 'bg-orange-100 text-orange-600' : item.meal_type === 'lunch' ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'}`}>
                              <span className="text-lg">{item.meal_type === 'breakfast' ? '🌅' : item.meal_type === 'lunch' ? '☀️' : '🌙'}</span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 capitalize">{item.meal_type}</h3>
                              <p className="text-sm text-gray-600">{item.meal_date}</p>
                              <p className="text-xs text-gray-500">Status: <span className={`font-medium ${item.status === 'pending' ? 'text-yellow-600' : item.status === 'processing' ? 'text-blue-600' : 'text-green-600'}`}>{item.status}</span></p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`text-xl ${star <= item.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                              >
                                ⭐
                              </span>
                            ))}
                            <span className="ml-2 font-semibold text-gray-700">{item.rating}/5</span>
                          </div>
                        </div>

                        {item.comment && (
                          <p className="text-gray-700 mb-3 italic">"{item.comment}"</p>
                        )}

                        {item.dish_names && (
                          <p className="text-sm text-gray-500 mb-2">🍽️ {item.dish_names}</p>
                        )}

                        <div className="text-xs text-gray-400 flex items-center space-x-1">
                          <span>🕒</span>
                          <span>Submitted: {new Date(item.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
