import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import app from '../config/FirebaseConfig';

const db = getFirestore(app);
const NOTIFICATION_TOKEN_KEY = '@notification_token';
const EXPO_GO_LIMITATION_KEY = '@expo_go_limitation_acknowledged';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,  // Show banner when app is in foreground
    shouldShowList: true,    // Show in notification list
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const PushNotificationService = {
  // Check if we're in Expo Go
  isExpoGo: () => {
    return Constants.appOwnership === 'expo';
  },

  // Show warning about Expo Go limitations
  showExpoGoWarning: async () => {
    const hasShownWarning = await AsyncStorage.getItem(EXPO_GO_LIMITATION_KEY);
    
    if (!hasShownWarning && PushNotificationService.isExpoGo()) {
      Alert.alert(
        'Push Notifications Limited',
        'Push notifications are limited in Expo Go. For full functionality:\n\n' +
        '1. Local notifications (reminders) will work\n' +
        '2. Remote push notifications require a development build\n\n' +
        'You can still use the app normally!',
        [
          {
            text: 'Learn More',
            onPress: () => {
              // Open documentation
              console.log('Open docs');
            },
          },
          {
            text: 'OK',
            onPress: async () => {
              await AsyncStorage.setItem(EXPO_GO_LIMITATION_KEY, 'true');
            },
          },
        ]
      );
    }
  },

  // Register for push notifications
  registerForPushNotifications: async () => {
    try {
      // Show warning if in Expo Go
      await PushNotificationService.showExpoGoWarning();

      if (!Device.isDevice) {
        console.log('Push notifications only work on physical devices');
        return null;
      }

      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }

      // Configure Android channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      // For Expo Go, we can't get a real push token
      // but we can still use local notifications
      if (PushNotificationService.isExpoGo()) {
        console.log('Running in Expo Go - using local notifications only');
        
        // Store a mock token for development
        const mockToken = `ExpoGo-${Device.deviceName || 'device'}-${Date.now()}`;
        await AsyncStorage.setItem(NOTIFICATION_TOKEN_KEY, mockToken);
        
        // You could still save this to Firestore for testing
        await PushNotificationService.saveTokenToFirestore(mockToken, true);
        
        return mockToken;
      }

      // Get the real token (only works in development/production builds)
      try {
        // Your specific project ID
        const projectId = 'e5e984e4-7d5f-40ee-982e-0d02f45ded63';
        
        const token = (await Notifications.getExpoPushTokenAsync({
          projectId: projectId,
        })).data;
        
        console.log('Push notification token:', token);

        // Store token locally
        await AsyncStorage.setItem(NOTIFICATION_TOKEN_KEY, token);

        // Store token in Firestore
        await PushNotificationService.saveTokenToFirestore(token, false);

        return token;
      } catch (error) {
        console.error('Error getting push token:', error);
        return null;
      }
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  },

  // Save token to Firestore
  saveTokenToFirestore: async (token, isExpoGo = false) => {
    try {
      // For now, we'll use the device ID as the user identifier
      const deviceId = Device.deviceName || 'anonymous';
      
      await setDoc(doc(db, 'pushTokens', deviceId), {
        token,
        platform: Platform.OS,
        deviceName: Device.deviceName,
        isExpoGo,
        lastUpdated: new Date().toISOString(),
      });
      
      console.log('Token saved to Firestore');
    } catch (error) {
      console.error('Error saving token to Firestore:', error);
    }
  },

  // Schedule local notification (works in Expo Go)
  scheduleLocalNotification: async (title, body, seconds = 5) => {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { type: 'bonus-expiring' },
        },
        trigger: { seconds },
      });
      console.log('Scheduled notification:', id);
      return id;
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  },

  // Schedule daily check for expiring bonuses (local notifications)
  scheduleDailyExpiryCheck: async () => {
    try {
      // Cancel any existing daily check
      await Notifications.cancelAllScheduledNotificationsAsync();

      // Schedule a daily trigger at 9 AM
      const trigger = {
        hour: 9,
        minute: 0,
        repeats: true,
      };

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Check Your Expiring Bonuses',
          body: 'Open the app to see which bonus categories are expiring soon!',
          data: { type: 'daily-check' },
        },
        trigger,
      });

      console.log('Daily notification check scheduled');
    } catch (error) {
      console.error('Error scheduling daily check:', error);
    }
  },

  // Get stored token
  getStoredToken: async () => {
    try {
      return await AsyncStorage.getItem(NOTIFICATION_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting stored token:', error);
      return null;
    }
  },

  // Check for expiring bonuses locally (for Expo Go)
  checkExpiringBonusesLocally: async (cards) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const notifications = [];
    
    for (const card of cards) {
      if (card.bonuses && Array.isArray(card.bonuses)) {
        for (const bonus of card.bonuses) {
          if (bonus.endDate) {
            const endDate = new Date(bonus.endDate);
            endDate.setHours(0, 0, 0, 0);
            
            // Check if bonus expires today
            if (endDate.getTime() === today.getTime()) {
              notifications.push({
                title: '💳 Bonus Expiring Today!',
                body: `${card.cardName}: ${bonus.rewardRate}${bonus.rewardType === 'percentage' ? '%' : 'x'} on ${bonus.categoryName}`,
                data: {
                  cardId: card.id,
                  cardName: card.cardName,
                  categoryName: bonus.categoryName,
                }
              });
            }
            // Check if bonus expires tomorrow
            else if (endDate.getTime() === today.getTime() + 86400000) {
              notifications.push({
                title: '⏰ Bonus Expiring Tomorrow',
                body: `${card.cardName}: ${bonus.rewardRate}${bonus.rewardType === 'percentage' ? '%' : 'x'} on ${bonus.categoryName}`,
                data: {
                  cardId: card.id,
                  cardName: card.cardName,
                  categoryName: bonus.categoryName,
                }
              });
            }
          }
        }
      }
    }
    
    // Schedule local notifications
    for (let i = 0; i < notifications.length; i++) {
      await PushNotificationService.scheduleLocalNotification(
        notifications[i].title,
        notifications[i].body,
        5 + (i * 2) // Stagger notifications by 2 seconds
      );
    }
    
    return notifications.length;
  },
};