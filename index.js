/**
 * @format
 */

import App from './App';
import BackgroundFetch from 'react-native-background-fetch';

import {AppRegistry} from 'react-native';
import {name as appName} from './app.json';
import { checkUserInsideRadius } from './src/utils/checkUserInsideRadius';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import notifee, { EventType } from '@notifee/react-native';

const messagingInstance = getMessaging();

const MyHeadlessTask = async (event) => {
  console.log('[BackgroundFetch HeadlessTask] start');
  const taskId = event.taskId;
  await checkUserInsideRadius();
  BackgroundFetch.finish(taskId);
}


setBackgroundMessageHandler(messagingInstance,async remoteMessage => {
  console.log('Message handled in the background!', remoteMessage);
});

notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS) {
    const data = detail.notification?.data;
    const screen = data?.screen;
    if (screen) {
      console.log('User pressed notification with screen:', screen);
    }
  }
});
// Register the headless task
AppRegistry.registerComponent(appName, () => App);

BackgroundFetch.registerHeadlessTask(MyHeadlessTask);