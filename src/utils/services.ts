import { PermissionsAndroid } from 'react-native';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import Geolocation from 'react-native-geolocation-service';
import { isIOS } from './constant';
import notifee, { AndroidImportance } from '@notifee/react-native';

interface NotificationOptions {
    title: string;
    body: string;
    channelId: string;
    channelName?: string;
    screen?: string;
    params?: Record<string, string | number | object>; // More specific type
}

const requestLocationPermission = async (): Promise<boolean> => {
    if (isIOS) {
        const status = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
        return status === RESULTS.GRANTED;
    } else {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
        return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
};

export const requestAndroidPermissions = async () => {
  const settings = await notifee.requestPermission();
  return settings.authorizationStatus;
};


// Get current location service
export const getCurrentLocation = async (): Promise<Geolocation.GeoPosition | null> => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return null;

    return new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
            position => resolve(position),
            error => reject(error),
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 10000,
                forceRequestLocation: true,
            }
        );
    });
};

// Send local notification service
export const sendLocalNotificationService = async ({
    title,
    body,
    channelId,
    channelName = 'General',
    screen,
    params,
}: NotificationOptions) => {
    
    await notifee.createChannel({
        id: channelId,
        name: channelName,
        importance: AndroidImportance.HIGH,
    });
    
  await notifee.displayNotification({
    title,
    body,
    android: {
      channelId,
      smallIcon: 'ic_launcher',
      pressAction: {
        id: 'default',
      },
    },
    data: {
      ...(screen && { screen }), 
      ...(params && { ...params }),
    },
  });
};

