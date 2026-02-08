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
    const iosPath = `${fs.dirs.DocumentDir}/Downloads`;
    console.log('iosPath', iosPath);
    const isExists = await fs.exists(iosPath);
    if (!isExists){
      await fs.mkdir(iosPath);
    }
    const res = await ReactNativeBlobUtil.config({
      path: `${iosPath}/${safeName}`,
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
