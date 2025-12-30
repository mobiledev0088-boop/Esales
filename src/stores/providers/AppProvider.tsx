// src/providers/AppProviders.tsx
import {PropsWithChildren, useEffect} from 'react';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {QueryProvider} from './QueryProvider';
import {useThemeStore} from '../useThemeStore';
import {useColorScheme} from 'nativewind';
import {AppColors} from '../../config/theme';
import CustomStatusBar from '../../components/CustomStatusBar';
import {SheetProvider} from 'react-native-actions-sheet';
import GlobalLoader from '../../components/GlobalLoader';
import {useLoaderStore} from '../useLoaderStore';

import '../../utils/sheets';
import {enableScreens} from 'react-native-screens';
import BackgroundFetch from 'react-native-background-fetch';
import { checkUserInsideRadius } from '../../utils/syncAttendance';

export const AppProviders = ({children}: PropsWithChildren) => {
  const {setColorScheme} = useColorScheme();

  const AppTheme = useThemeStore(state => state.AppTheme);
  const globalLoading = useLoaderStore(state => state.globalLoading);

  const initBackgroundFetch = async () => {
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
    console.log('[BackgroundFetch] Status: ', status);
  };

  useEffect(() => {
    setColorScheme(AppTheme);
    initBackgroundFetch();
  }, [AppTheme, setColorScheme]);

  enableScreens();

  return (
    <QueryProvider>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{flex: 1}}>
          <NavigationContainer>
            <SheetProvider>
              <CustomStatusBar
                backgroundColor={AppColors[AppTheme].primary}
                barStyle="light-content"
              />
              <SafeAreaView style={{flex: 1}}>{children}</SafeAreaView>
            </SheetProvider>
          </NavigationContainer>
          <GlobalLoader globalLoading={globalLoading} />
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </QueryProvider>
  );
};
