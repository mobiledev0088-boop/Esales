// src/providers/AppProviders.tsx
import '../../utils/sheets';

import CustomStatusBar from '../../components/CustomStatusBar';
import GlobalLoader from '../../components/GlobalLoader';

import {PropsWithChildren, useEffect, useRef} from 'react';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {QueryProvider} from './QueryProvider';
import {useThemeStore} from '../useThemeStore';
import {useColorScheme} from 'nativewind';
import {AppColors} from '../../config/theme';
import {SheetProvider} from 'react-native-actions-sheet';
import {useLoaderStore} from '../useLoaderStore';
import {enableScreens} from 'react-native-screens';
import {initBackgroundFetchService} from '../../utils/services';
import notifee from '@notifee/react-native';
import {
  navigateFromNotification,
  registerForegroundHandler,
  registerNotificationPressHandler,
} from '../../utils/notificationServices';

export const AppProviders = ({children}: PropsWithChildren) => {
  const navigationRef = useRef<any>(null);
  const pendingNavigation = useRef<any>(null);
  const {setColorScheme} = useColorScheme();
  const AppTheme = useThemeStore(state => state.AppTheme);
  const globalLoading = useLoaderStore(state => state.globalLoading);

  const handleInitialNotification = async () => {
    const notifeeEvent = await notifee.getInitialNotification();
    if (notifeeEvent) {
      const data = notifeeEvent.notification?.data;
      const screenName = data?.screen;
      if (screenName) {
        pendingNavigation.current = {screen: screenName, params: data};
      }
      return;
    }
  };

  const onReady = () => {
    if (pendingNavigation.current) {
      navigateFromNotification(pendingNavigation.current, navigationRef);
      pendingNavigation.current = null;
    }
  };

  useEffect(() => {
    setColorScheme(AppTheme);
    initBackgroundFetchService();
    handleInitialNotification();
    const fgUnsub = registerForegroundHandler();
    const pressUnsub = registerNotificationPressHandler(navigationRef);

    return () => {
      fgUnsub();
      pressUnsub();
    };
  }, [AppTheme, setColorScheme]);

  enableScreens();

  return (
    <QueryProvider>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{flex: 1}}>
          <NavigationContainer ref={navigationRef} onReady={onReady}>
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
