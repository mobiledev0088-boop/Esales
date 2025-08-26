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
import '../../utils/sheets';

export const AppProviders = ({children}: PropsWithChildren) => {
  const {setColorScheme} = useColorScheme();
  const AppTheme = useThemeStore(state => state.AppTheme);

  useEffect(() => {
    setColorScheme(AppTheme);
  }, [AppTheme, setColorScheme]);

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
          <GlobalLoader />
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </QueryProvider>
  );
};
