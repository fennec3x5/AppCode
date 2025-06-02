export const DEFAULT_CATEGORIES = [
  {
    id: 'groceries',
    name: 'Groceries',
    icon: 'shopping-cart',
    color: '#4CAF50'
  },
  {
    id: 'gas',
    name: 'Gas',
    icon: 'local-gas-station',
    color: '#FF9800'
  },
  {
    id: 'dining',
    name: 'Dining',
    icon: 'restaurant',
    color: '#F44336'
  },
  {
    id: 'travel',
    name: 'Travel',
    icon: 'flight',
    color: '#2196F3'
  },
  {
    id: 'online-shopping',
    name: 'Online Shopping',
    icon: 'computer',
    color: '#9C27B0'
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    icon: 'movie',
    color: '#E91E63'
  },
  {
    id: 'streaming',
    name: 'Streaming Services',
    icon: 'play-circle-outline',
    color: '#00BCD4'
  },
  {
    id: 'utilities',
    name: 'Utilities',
    icon: 'power',
    color: '#607D8B'
  },
  {
    id: 'pharmacy',
    name: 'Pharmacy',
    icon: 'local-pharmacy',
    color: '#009688'
  },
  {
    id: 'home-improvement',
    name: 'Home Improvement',
    icon: 'home',
    color: '#795548'
  },
  {
    id: 'department-stores',
    name: 'Department Stores',
    icon: 'store',
    color: '#FF5722'
  },
  {
    id: 'wholesale',
    name: 'Wholesale Clubs',
    icon: 'warehouse',
    color: '#3F51B5'
  },
  {
    id: 'transit',
    name: 'Transit',
    icon: 'train',
    color: '#8BC34A'
  },
  {
    id: 'rideshare',
    name: 'Rideshare',
    icon: 'local-taxi',
    color: '#FFC107'
  },
  {
    id: 'hotels',
    name: 'Hotels',
    icon: 'hotel',
    color: '#673AB7'
  },
  {
    id: 'fitness',
    name: 'Fitness',
    icon: 'fitness-center',
    color: '#FF4081'
  },
  {
    id: 'subscription',
    name: 'Subscriptions',
    icon: 'autorenew',
    color: '#00ACC1'
  },
  {
    id: 'office-supplies',
    name: 'Office Supplies',
    icon: 'business-center',
    color: '#5C6BC0'
  },
  {
    id: 'insurance',
    name: 'Insurance',
    icon: 'security',
    color: '#78909C'
  },
  {
    id: 'other',
    name: 'Other',
    icon: 'more-horiz',
    color: '#9E9E9E'
  }
];

// Helper function to get category by ID
export const getCategoryById = (categoryId) => {
  return DEFAULT_CATEGORIES.find(cat => cat.id === categoryId);
};

// Helper function to get category by name (case-insensitive)
export const getCategoryByName = (categoryName) => {
  return DEFAULT_CATEGORIES.find(cat => 
    cat.name.toLowerCase() === categoryName.toLowerCase()
  );
};

// Storage keys
export const CUSTOM_CATEGORIES_KEY = '@custom_categories';
export const FAVORITE_CATEGORIES_KEY = '@favorite_categories';