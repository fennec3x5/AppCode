// App.js
import 'react-native-get-random-values';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Notifications from 'expo-notifications';
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';

// Import screens
import CardListScreen from './src/screens/CardListScreen';
import CardDetailScreen from './src/screens/CardDetailScreen';
import AddEditCardScreen from './src/screens/AddEditCardScreen';
import FindBestCardScreen from './src/screens/FindBestCardScreen';
import AddEditBonusScreen from './src/screens/AddEditBonusScreen';
import CategoriesScreen from './src/screens/CategoriesScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';

// Import services and context
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ApiProvider } from './src/context/ApiContext';
import { PushNotificationService } from './src/services/PushNotificationService';
import { colors, typography } from './src/config/Theme';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack Navigator options
const stackNavigatorOptions = {
  headerStyle: {
    backgroundColor: colors.primary,
  },
  headerTintColor: colors.surface,
  headerTitleStyle: {
    ...typography.h4,
  },
  headerBackTitleVisible: false,
};

// Auth Stack
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

// Cards Stack
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

// Main Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Find Best Card"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Cards') iconName = 'credit-card';
          else if (route.name === 'Find Best Card') iconName = 'search';
          else if (route.name === 'Categories') iconName = 'category';
          else if (route.name === 'Profile') iconName = 'person';
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
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
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name="Categories" 
        component={CategoriesScreen} 
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
      />
    </Tab.Navigator>
  );
}

// Profile Screen (simple placeholder for now)
function ProfileScreen() {
  const { user, logout } = useAuth();
  
  return (
    <View style={styles.profileContainer}>
      <Icon name="person" size={80} color={colors.primary} />
      <Text style={styles.profileEmail}>{user?.email}</Text>
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutButtonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

// App Navigator that handles auth state
function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    PushNotificationService.initialize();
    if (isAuthenticated) {
      PushNotificationService.register();
    }

    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification Received:', notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification Tapped:', response);
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, [isAuthenticated]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}

// Main App component
export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ApiProvider>
          <AppNavigator />
        </ApiProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  profileContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 20,
  },
  profileEmail: {
    ...typography.h4,
    color: colors.text,
    marginTop: 20,
    marginBottom: 40,
  },
  logoutButton: {
    backgroundColor: colors.error,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  logoutButtonText: {
    ...typography.button,
    color: '#fff',
  },
});