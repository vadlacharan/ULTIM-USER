import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { api } from './api';

// Configure Notification Display Behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Service to request native push notification permissions and register token with backend
 */
export const registerForPushNotificationsAsync = async (): Promise<string | null> => {
  try {
    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request native permission if not granted yet
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Push Notification] Native permission not granted.');
      return null;
    }

    // Get Device Token
    const tokenData = await Notifications.getDevicePushTokenAsync().catch(async () => {
      return await Notifications.getExpoPushTokenAsync().catch(() => null);
    });

    const token = typeof tokenData === 'string' ? tokenData : tokenData?.data;

    if (token) {
      const platform = Platform.OS === 'ios' ? 'ios' : 'android';
      await api.registerPushToken(token, platform).catch(() => {});
      return token;
    }
  } catch (err) {
    console.log('[Push Notification Error]', err);
  }
  return null;
};
