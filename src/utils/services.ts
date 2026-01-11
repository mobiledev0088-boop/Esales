import BackgroundFetch from 'react-native-background-fetch';
import Geolocation from 'react-native-geolocation-service';

import {isIOS} from './constant';
import {PermissionsAndroid} from 'react-native';
import {checkUserInsideRadius} from './checkUserInsideRadius';
import {request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import ReactNativeBlobUtil from 'react-native-blob-util';
import {ensureFolderExists, getMimeTypeFromUrl} from './commonFunctions';

type DownloadParams = {
  url: string;
  fileName: string;
  autoOpen?: boolean;
};

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

export async function downloadFile({
  url,
  fileName,
  autoOpen = true,
}: DownloadParams): Promise<string> {
  const safeName = fileName
    .replace(/[<>:"/\\|?*&=]/g, '_')
    .replace(/\s+$/g, '')
    .slice(0, 200);

  const mimeType = getMimeTypeFromUrl(url);
  const {fs} = ReactNativeBlobUtil;

  if (isIOS) {
    const iosPath = `${fs.dirs.DocumentDir}/Downloads/${safeName}`;
    await fs.mkdir(`${fs.dirs.DocumentDir}/Downloads`);
    const res = await ReactNativeBlobUtil.config({
      path: iosPath,
    }).fetch('GET', url);
    if (autoOpen) {
      ReactNativeBlobUtil.ios.openDocument(res.path());
    }
    return res.path();
  }
  const downloadPath = `/storage/emulated/0/Download/Esales`;
  await ensureFolderExists(downloadPath);

  await ReactNativeBlobUtil.config({
    addAndroidDownloads: {
      useDownloadManager: true, // 🔥 REQUIRED
      notification: true,
      path: `${downloadPath}/${safeName}`,
      mime: mimeType,
      title: safeName,
      description: 'Downloading file',
      mediaScannable: true,
    },
  }).fetch('GET', url);

  if (autoOpen) {
    ReactNativeBlobUtil.android.actionViewIntent(
      `${downloadPath}/${safeName}`,
      mimeType,
    );
  }
  return `${downloadPath}/${safeName}`;
}
