import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Clock, Calendar, ChefHat, Coffee, Sun, Moon } from 'lucide-react';

interface MealItem {
  items: string[];
  description: string;
}

interface DayMeals {
  breakfast: MealItem;
  lunch: MealItem;
  dinner: MealItem;
}

interface TodayMealData {
  day: string;
  date: string;
  meals: DayMeals;
}

interface WeeklyMealData {
  [key: string]: DayMeals;
}

const MealMenu: React.FC = () => {
  const [todayMeals, setTodayMeals] = useState<TodayMealData | null>(null);
  const [weeklyMeals, setWeeklyMeals] = useState<WeeklyMealData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('today');

  useEffect(() => {
    fetchTodayMeals();
    fetchWeeklyMeals();
  }, []);

  const fetchTodayMeals = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/meals/today');
      const result = await response.json();
      
      if (result.success) {
        setTodayMeals(result.data);
      } else {
        setError('Failed to fetch today\'s meals');
      }
    } catch (err) {
      setError('Error connecting to server');
      console.error('Error fetching today\'s meals:', err);
    }
  };

  const fetchWeeklyMeals = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/meals/weekly');
      const result = await response.json();
      
      if (result.success) {
        setWeeklyMeals(result.data.weeklyMenu);
      } else {
        setError('Failed to fetch weekly meals');
      }
      setLoading(false);
    } catch (err) {
      setError('Error connecting to server');
      setLoading(false);
      console.error('Error fetching weekly meals:', err);
    }
  };

  const getMealIcon = (mealType: string) => {
    switch (mealType) {
      case 'breakfast':
        return <Coffee className="h-5 w-5 text-orange-500" />;
      case 'lunch':
        return <Sun className="h-5 w-5 text-yellow-500" />;
      case 'dinner':
        return <Moon className="h-5 w-5 text-blue-500" />;
      default:
        return <ChefHat className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatMealType = (mealType: string) => {
    return mealType.charAt(0).toUpperCase() + mealType.slice(1);
  };

  const formatDay = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  const MealCard: React.FC<{ mealType: string; meal: MealItem }> = ({ mealType, meal }) => (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {getMealIcon(mealType)}
          {formatMealType(mealType)}
        </CardTitle>
        <CardDescription className="text-sm">
          {meal.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {meal.items.map((item, index) => (
            <Badge 
              key={index} 
              variant="secondary" 
              className="text-xs px-2 py-1"
            >
              {item}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const DayMealDisplay: React.FC<{ day: string; meals: DayMeals; isToday?: boolean }> = ({ 
    day, 
    meals, 
    isToday = false 
  }) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-5 w-5 text-green-600" />
        <h3 className="text-xl font-semibold text-gray-800">
          {formatDay(day)}
          {isToday && <Badge className="ml-2 bg-green-600">Today</Badge>}
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MealCard mealType="breakfast" meal={meals.breakfast} />
        <MealCard mealType="lunch" meal={meals.lunch} />
        <MealCard mealType="dinner" meal={meals.dinner} />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-2 text-gray-600">Loading meal menu...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          <ChefHat className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="font-medium">Unable to load meal menu</p>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          🍽️ Mess Meal Menu
        </h2>
        <p className="text-gray-600">
          Delicious South Indian meals served daily
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="today" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Today's Menu
          </TabsTrigger>
          <TabsTrigger value="weekly" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Weekly Menu
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-6">
          {todayMeals ? (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <p className="text-lg text-gray-700">
                  {new Date(todayMeals.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <DayMealDisplay 
                day={todayMeals.day} 
                meals={todayMeals.meals} 
                isToday={true}
              />
            </div>
          ) : (
            <p className="text-center text-gray-500">No meal data available for today</p>
          )}
        </TabsContent>

        <TabsContent value="weekly" className="mt-6">
          {weeklyMeals ? (
            <div className="space-y-8">
              {Object.entries(weeklyMeals).map(([day, meals]) => (
                <DayMealDisplay 
                  key={day} 
                  day={day} 
                  meals={meals}
                  isToday={todayMeals?.day === day}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">No weekly meal data available</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MealMenu;
