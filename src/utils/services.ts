import {PermissionsAndroid} from 'react-native';
import {request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import Geolocation from 'react-native-geolocation-service';
import {isIOS} from './constant';

import BackgroundFetch from 'react-native-background-fetch';
import {checkUserInsideRadius} from './checkUserInsideRadius';

// hepler function
const requestLocationPermission = async (): Promise<boolean> => {
  if (isIOS) {
    const status = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
    return status === RESULTS.GRANTED;
  } else {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
};

// Get current location service
export const getCurrentLocation =
  async (): Promise<Geolocation.GeoPosition | null> => {
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
        },
      );
    });
};

export const initBackgroundFetchService = async () => {
  const status = await BackgroundFetch.configure(
    {
      minimumFetchInterval: 15, // Minimum 15 minutes
      stopOnTerminate: false, // Continue after app is closed (Android)
      startOnBoot: true, // Auto-start after device restart (Android)
      enableHeadless: true, // Run HeadlessTask (Android)
      requiredNetworkType: BackgroundFetch.NETWORK_TYPE_ANY,
    },
    async taskId => {
      console.log('[BackgroundFetch] Event received: ', taskId);
      await checkUserInsideRadius();
      // Finish the background fetch needed for it to work correctly
      BackgroundFetch.finish(taskId);
    },
    error => {
      console.error('[BackgroundFetch] Failed to configure: ', error);
    },
  );
  if (status === BackgroundFetch.STATUS_AVAILABLE) {
    console.log('[BackgroundFetch] Background fetch is enabled');
  } else {
    console.log('[BackgroundFetch] Background fetch is disabled');
  }
};
