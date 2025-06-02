import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Import screens
import CardListScreen from './src/screens/CardListScreen';
import CardDetailScreen from './src/screens/CardDetailScreen';
import AddEditCardScreen from './src/screens/AddEditCardScreen';
import FindBestCardScreen from './src/screens/FindBestCardScreen';
import AddEditBonusScreen from './src/screens/AddEditBonusScreen';
import CategoriesScreen from './src/screens/CategoriesScreen';

// Import API provider
import { ApiProvider } from './src/context/ApiContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack navigator for Cards tab
function CardsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2196F3',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="CardList" 
        component={CardListScreen} 
        options={{ title: 'My Cards' }}
      />
      <Stack.Screen 
        name="CardDetail" 
        component={CardDetailScreen} 
        options={{ title: 'Card Details' }}
      />
      <Stack.Screen 
        name="AddEditCard" 
        component={AddEditCardScreen} 
        options={({ route }) => ({ 
          title: route.params?.card ? 'Edit Card' : 'Add Card' 
        })}
      />
      <Stack.Screen 
        name="AddEditBonus" 
        component={AddEditBonusScreen} 
        options={({ route }) => ({ 
          title: route.params?.bonus ? 'Edit Bonus' : 'Add Bonus' 
        })}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <ApiProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: ({ focused, color, size }) => {
                let iconName;
                if (route.name === 'Cards') {
                  iconName = 'credit-card';
                } else if (route.name === 'Find Best Card') {
                  iconName = 'search';
                } else if (route.name === 'Categories') {
                  iconName = 'category';
                }
                return <Icon name={iconName} size={size} color={color} />;
              },
              tabBarActiveTintColor: '#2196F3',
              tabBarInactiveTintColor: 'gray',
              headerStyle: {
                backgroundColor: '#2196F3',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            })}
          >
            <Tab.Screen 
              name="Cards" 
              component={CardsStack} 
              options={{ headerShown: false }}
            />
            <Tab.Screen 
              name="Find Best Card" 
              component={FindBestCardScreen} 
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