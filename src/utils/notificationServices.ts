import {getMessaging, onMessage} from '@react-native-firebase/messaging';
import notifee, {AndroidImportance, EventType} from '@notifee/react-native';
import {getPlatformVersion} from './commonFunctions';
import {
  PERMISSIONS,
  request,
  requestNotifications,
} from 'react-native-permissions';
import {isIOS} from './constant';

interface NotificationOptions {
  title: string;
  body: string;
  channelId: string;
  channelName?: string;
  screen?: string;
  params?: Record<string, string | number | object>; // More specific type
}

const messagingInstance = getMessaging();

export async function requestNotificationPermission() {
  const androidVersion = getPlatformVersion();
  if (!isIOS && androidVersion >= 33) {
    const POST_NOTIF = (PERMISSIONS as any)?.ANDROID?.POST_NOTIFICATIONS;
    if (POST_NOTIF) {
      await request(POST_NOTIF);
    }
  }
  await requestNotifications(['alert', 'sound', 'badge']);
}

export async function displayNotification({
  title,
  body,
  channelId,
  channelName = 'General',
  screen,
  params,
}: NotificationOptions) {
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
      ...(screen && {screen}),
      ...(params && {...params}),
    },
  });
}

export function registerForegroundHandler() {
  return onMessage(messagingInstance, async remoteMessage => {
    console.log('Foreground message:', remoteMessage);
    const title = remoteMessage.notification?.title || 'Notification';
    const body = remoteMessage.notification?.body || '';
    await displayNotification({
      title,
      body,
      channelId: 'FOREGROUND_CHANNEL',
    });
  });
}

export function registerNotificationPressHandler(
    navigationRef: React.RefObject<any>,
) {
  return notifee.onForegroundEvent(({type, detail}) => {
    if (type === EventType.PRESS) {
      const data = detail.notification?.data;
      console.log('Notification pressed:', data);
      navigateFromNotification(data, navigationRef);
    }
  });
}

export function navigateFromNotification(
  data: any,
  navigationRef: React.RefObject<any>,
) {
  if (!data?.screen) return;
  switch (data.screen) {
    case 'Attendance':
      navigationRef.current?.navigate('Attendance');
      break;
    default:
      navigationRef.current?.navigate('Index');
  }
}
