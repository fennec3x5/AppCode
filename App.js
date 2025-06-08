// App.js
import 'react-native-get-random-values';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Notifications from 'expo-notifications';

// Import screens
import CardListScreen from './src/screens/CardListScreen';
import CardDetailScreen from './src/screens/CardDetailScreen';
import AddEditCardScreen from './src/screens/AddEditCardScreen';
import FindBestCardScreen from './src/screens/FindBestCardScreen';
import AddEditBonusScreen from './src/screens/AddEditBonusScreen';
import CategoriesScreen from './src/screens/CategoriesScreen';

// Import services and context
import { ApiProvider } from './src/context/ApiContext';
import { PushNotificationService } from './src/services/PushNotificationService';
import { colors, typography } from './src/config/Theme'; // Import theme for consistency

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// --- Centralized Stack Navigator options for a cleaner look ---
const stackNavigatorOptions = {
  headerStyle: {
    backgroundColor: colors.primary,
  },
  headerTintColor: colors.surface,
  headerTitleStyle: {
    ...typography.h4,
  },
  headerBackTitleVisible: false, // Cleaner look on iOS
};

// --- The Cards navigation stack ---
function CardsStack() {
  return (
    <Stack.Navigator screenOptions={stackNavigatorOptions}>
      <Stack.Screen 
        name="CardList" 
        component={CardListScreen} 
        options={{ title: 'My Cards' }}
      />
      <Stack.Screen 
        name="CardDetail" 
        component={CardDetailScreen} 
        options={({ route }) => ({ title: route.params?.card?.cardName || 'Card Details' })}
      />
      <Stack.Screen 
        name="AddEditCard" 
        component={AddEditCardScreen} 
        options={({ route }) => ({ title: route.params?.card ? 'Edit Card' : 'Add New Card' })}
      />
      <Stack.Screen 
        name="AddEditBonus" 
        component={AddEditBonusScreen} 
        options={({ route }) => ({ title: route.params?.bonus ? 'Edit Bonus' : 'Add Bonus' })}
      />
    </Stack.Navigator>
  );
}

// --- The main App component ---
export default function App() {
  
  useEffect(() => {
    // 1. Initialize the service (sets notification handler)
    PushNotificationService.initialize();
    
    // 2. Register the device (gets permissions and token)
    PushNotificationService.register();

    // 3. Set up listeners for app interaction (optional but good practice)
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification Received:', notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification Tapped:', response);
      // Here you can add logic to navigate to a specific screen
      // e.g., if (response.notification.request.content.data.cardId) { ... }
    });

    // Cleanup function to remove listeners when the app unmounts
    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  return (
    <ApiProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <Tab.Navigator
            initialRouteName="Find Best Card"
            screenOptions={({ route }) => ({
              tabBarIcon: ({ focused, color, size }) => {
                let iconName;
                if (route.name === 'Cards') iconName = 'credit-card';
                else if (route.name === 'Find Best Card') iconName = 'search';
                else if (route.name === 'Categories') iconName = 'category';
                return <Icon name={iconName} size={size} color={color} />;
              },
              tabBarActiveTintColor: colors.primary,
              tabBarInactiveTintColor: colors.textLight,
              // Use the same header style as the stack navigator for consistency
              headerStyle: stackNavigatorOptions.headerStyle,
              headerTintColor: stackNavigatorOptions.headerTintColor,
              headerTitleStyle: stackNavigatorOptions.headerTitleStyle,
            })}
          >
            <Tab.Screen 
              name="Find Best Card" 
              component={FindBestCardScreen} 
            />
            <Tab.Screen 
              name="Cards" 
              component={CardsStack} 
              options={{ headerShown: false }} // Hide tab header to show stack header
            />
            <Tab.Screen 
              name="Categories" 
              component={CategoriesScreen} 
            />
          </Tab.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </ApiProvider>
  );
}