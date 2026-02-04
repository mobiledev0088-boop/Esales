import React from 'react';
import {
  StatusBar,
  View,
  StyleSheet,
} from 'react-native';
import { AppColors } from '../config/theme';
import { useThemeStore } from '../stores/useThemeStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CustomStatusBar =() => {
  const insets = useSafeAreaInsets();
  const AppTheme = useThemeStore(state => state.AppTheme);
  return (
    <>
      <View style={[styles.statusBarBackground, { backgroundColor: AppColors[AppTheme].primary, height: insets.top}]} />
      <StatusBar barStyle={'light-content'} />
    </>
  );
};

const styles = StyleSheet.create({
  statusBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
});

export default CustomStatusBar;
