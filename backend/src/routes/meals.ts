import express from 'express';

const router = express.Router();

// Static South Indian meal data for each day of the week
const weeklyMealMenu = {
  monday: {
    breakfast: {
      items: ['Idli', 'Sambar', 'Coconut Chutney', 'Podi', 'Filter Coffee'],
      description: 'Soft steamed rice cakes with lentil curry and fresh chutneys'
    },
    lunch: {
      items: ['Sambar Rice', 'Rasam', 'Curd Rice', 'Papad', 'Pickle', 'Vegetable Curry'],
      description: 'Traditional South Indian rice meals with variety of curries'
    },
    dinner: {
      items: ['Chapati', 'Dal Tadka', 'Mixed Vegetable Curry', 'Rice', 'Buttermilk'],
      description: 'North Indian style dinner with fresh rotis and dal'
    }
  },
  tuesday: {
    breakfast: {
      items: ['Dosa', 'Sambar', 'Tomato Chutney', 'Mint Chutney', 'Tea'],
      description: 'Crispy fermented crepes with spicy lentil curry'
    },
    lunch: {
      items: ['Lemon Rice', 'Rasam', 'Mor Kuzhambu', 'Appalam', 'Beans Poriyal'],
      description: 'Tangy lemon rice with traditional South Indian accompaniments'
    },
    dinner: {
      items: ['Pongal', 'Sambar', 'Ghee', 'Coconut Chutney', 'Pickle'],
      description: 'Comfort food rice and lentil dish with ghee'
    }
  },
  wednesday: {
    breakfast: {
      items: ['Upma', 'Coconut Chutney', 'Sambar', 'Banana', 'Coffee'],
      description: 'Semolina breakfast dish with vegetables and nuts'
    },
    lunch: {
      items: ['Curd Rice', 'Sambar', 'Rasam', 'Cabbage Poriyal', 'Pickle', 'Papad'],
      description: 'Cooling curd rice perfect for mid-week meals'
    },
    dinner: {
      items: ['Biryani', 'Raita', 'Boiled Egg', 'Pickle', 'Papad'],
      description: 'Fragrant spiced rice with aromatic herbs and spices'
    }
  },
  thursday: {
    breakfast: {
      items: ['Poha', 'Coconut Chutney', 'Sambar', 'Lime', 'Tea'],
      description: 'Flattened rice with curry leaves and peanuts'
    },
    lunch: {
      items: ['Tamarind Rice', 'Rasam', 'Potato Curry', 'Curd', 'Pickle'],
      description: 'Tangy tamarind flavored rice with spicy accompaniments'
    },
    dinner: {
      items: ['Roti', 'Paneer Curry', 'Dal', 'Rice', 'Salad'],
      description: 'Fresh rotis with creamy paneer curry'
    }
  },
  friday: {
    breakfast: {
      items: ['Rava Dosa', 'Sambar', 'Coconut Chutney', 'Jaggery', 'Filter Coffee'],
      description: 'Crispy semolina crepes with traditional accompaniments'
    },
    lunch: {
      items: ['Vegetable Pulao', 'Raita', 'Pickle', 'Papad', 'Sweet Dish'],
      description: 'Aromatic rice with mixed vegetables and yogurt'
    },
    dinner: {
      items: ['Chapati', 'Chana Masala', 'Jeera Rice', 'Pickle', 'Onion Salad'],
      description: 'Spicy chickpea curry with cumin flavored rice'
    }
  },
  saturday: {
    breakfast: {
      items: ['Vada', 'Sambar', 'Coconut Chutney', 'Tomato Chutney', 'Coffee'],
      description: 'Crispy lentil donuts with spicy and tangy chutneys'
    },
    lunch: {
      items: ['Bisi Bele Bath', 'Raita', 'Chips', 'Pickle', 'Sweet'],
      description: 'Spicy rice and lentil dish with vegetables and spices'
    },
    dinner: {
      items: ['Puri', 'Aloo Curry', 'Chole', 'Rice', 'Pickle'],
      description: 'Fluffy fried bread with spicy potato and chickpea curry'
    }
  },
  sunday: {
    breakfast: {
      items: ['Pongal', 'Vada', 'Sambar', 'Coconut Chutney', 'Kesari', 'Coffee'],
      description: 'Special Sunday breakfast with sweet kesari'
    },
    lunch: {
      items: ['Special Meals', 'Sambar', 'Rasam', 'Kootu', 'Poriyal', 'Curd', 'Sweet', 'Pickle', 'Papad'],
      description: 'Traditional South Indian full course meal with multiple dishes'
    },
    dinner: {
      items: ['Fried Rice', 'Manchurian', 'Soup', 'Pickle', 'Ice Cream'],
      description: 'Indo-Chinese special dinner with dessert'
    }
  }
};

// Get today's meal menu
router.get('/today', (req, res) => {
  try {
    const today = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayNames[today.getDay()];
    
    const todaysMeals = weeklyMealMenu[currentDay as keyof typeof weeklyMealMenu];
    
    res.json({
      success: true,
      data: {
        day: currentDay,
        date: today.toDateString(),
        meals: todaysMeals
      }
    });
  } catch (error) {
    console.error('Error fetching today\'s meals:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching today\'s meals'
    });
  }
});

// Get weekly meal menu
router.get('/weekly', (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        weeklyMenu: weeklyMealMenu,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching weekly meals:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching weekly meals'
    });
  }
});

// Get specific day's meal menu
router.get('/day/:dayName', (req, res) => {
  try {
    const { dayName } = req.params;
    const day = dayName.toLowerCase();
    
    if (!weeklyMealMenu[day as keyof typeof weeklyMealMenu]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid day name. Use: monday, tuesday, wednesday, thursday, friday, saturday, sunday'
      });
    }
    
    const dayMeals = weeklyMealMenu[day as keyof typeof weeklyMealMenu];
    
    res.json({
      success: true,
      data: {
        day: day,
        meals: dayMeals
      }
    });
  } catch (error) {
    console.error('Error fetching day meals:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching day meals'
    });
  }
});

export default router;
