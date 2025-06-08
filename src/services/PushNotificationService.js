// src/services/PushNotificationService.js
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import app, { EXPO_PROJECT_ID } from '../config/FirebaseConfig'; // Assuming projectId is moved to config
import { v4 as uuidv4 } from 'uuid';

const db = getFirestore(app);
const NOTIFICATION_TOKEN_KEY = '@notification_token';
const DEVICE_ID_KEY = '@device_id'; // Key for our stable anonymous ID

// --- Internal Helper Functions ---

// 1. Get a stable, anonymous device ID
const getDeviceId = async () => {
  let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = uuidv4();
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
};

// 2. Handle permission requests
const requestPermissions = async () => {
  if (!Device.isDevice) {
    console.warn('Push notifications are only available on physical devices.');
    return false;
  }
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    Alert.alert('Permission Required', 'Push notifications have been disabled. You can enable them in your device settings.');
    return false;
  }
  return true;
};

// 3. Configure Android notification channel
const configureAndroidChannel = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
};

// 4. Get the actual push token (for real builds)
const getRealPushToken = async () => {
  try {
    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: EXPO_PROJECT_ID,
    })).data;
    console.log('Push notification token:', token);
    return token;
  } catch (error) {
    console.error('Error getting real push token:', error);
    Alert.alert('Token Error', 'Could not retrieve a push token for this device.');
    return null;
  }
};

// 5. Get a mock token for Expo Go
const getMockPushToken = () => {
  console.log('Running in Expo Go - using a mock token.');
  return `ExpoGo-${Device.osName}-${Date.now()}`;
};


// --- Public Service Object ---

export const PushNotificationService = {
  initialize: () => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  },

  isExpoGo: () => Constants.appOwnership === 'expo',

  register: async () => {
    try {
      const permissionsGranted = await requestPermissions();
      if (!permissionsGranted) return null;

      await configureAndroidChannel();

      const token = PushNotificationService.isExpoGo()
        ? getMockPushToken()
        : await getRealPushToken();
      
      if (!token) return null;

      await AsyncStorage.setItem(NOTIFICATION_TOKEN_KEY, token);
      await PushNotificationService.saveTokenToFirestore(token);
      
      return token;
    } catch (error) {
      console.error('Error during push notification registration:', error);
      return null;
    }
  },

  saveTokenToFirestore: async (token) => {
    try {
      const deviceId = await getDeviceId();
      await setDoc(doc(db, 'pushTokens', deviceId), {
        token,
        platform: Platform.OS,
        osVersion: Device.osVersion,
        isExpoGo: PushNotificationService.isExpoGo(),
        lastUpdated: new Date().toISOString(),
      });
      console.log('Token saved to Firestore for device:', deviceId);
    } catch (error) {
      console.error('Error saving token to Firestore:', error);
    }
  },

  scheduleLocalNotification: async ({ title, body, data, seconds = 1 }) => {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: { title, body, data },
        trigger: { seconds },
      });
      console.log('Scheduled local notification:', id);
      return id;
    } catch (error) {
      console.error('Error scheduling local notification:', error);
    }
  },

  checkExpiringBonusesLocally: async (cards) => {
    if (!Array.isArray(cards)) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiringBonuses = [];

    cards.forEach(card => {
      card.bonuses?.forEach(bonus => {
        if (!bonus.endDate) return;

        const endDate = new Date(bonus.endDate);
        const daysUntil = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

        if (daysUntil === 1) { // Expires tomorrow
          expiringBonuses.push({
            title: '⏰ Bonus Expiring Tomorrow',
            body: `${card.cardName}: ${bonus.rewardRate}${bonus.rewardType === 'percentage' ? '%' : 'x'} on ${bonus.categoryName}`,
            data: { cardId: card.id },
          });
        } else if (daysUntil === 0) { // Expires today
          expiringBonuses.push({
            title: '💳 Bonus Expiring Today!',
            body: `${card.cardName}: ${bonus.rewardRate}${bonus.rewardType === 'percentage' ? '%' : 'x'} on ${bonus.categoryName}`,
            data: { cardId: card.id },
          });
        }
      });
    });
    
    // Schedule all found notifications, staggered by 2 seconds
    for (let i = 0; i < expiringBonuses.length; i++) {
      await PushNotificationService.scheduleLocalNotification({
        ...expiringBonuses[i],
        seconds: 5 + i * 2,
      });
    }
    
    return expiringBonuses.length;
  },
};