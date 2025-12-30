/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import BackgroundFetch from 'react-native-background-fetch';
import { checkUserInsideRadius } from './src/utils/syncAttendance';

AppRegistry.registerComponent(appName, () => App);

const MyHeadlessTask = async (event) => {
  console.log('[BackgroundFetch HeadlessTask] start');
  const taskId = event.taskId;
  await checkUserInsideRadius();
  BackgroundFetch.finish(taskId);
}

// Register the headless task
BackgroundFetch.registerHeadlessTask(MyHeadlessTask);