import React from 'react';
import {
  StatusBar,
  StatusBarStyle,
  Platform,
  View,
  StyleSheet,
} from 'react-native';

interface Props {
  backgroundColor: string;
  barStyle?: StatusBarStyle;
}

const CustomStatusBar: React.FC<Props> = ({
  backgroundColor,
  barStyle = 'light-content',
}) => {
  return (
    <>
      <View style={[styles.statusBarBackground, { backgroundColor }]} />
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={barStyle}
      />
    </>
  );
};

const styles = StyleSheet.create({
  statusBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 48 : StatusBar.currentHeight ?? 0,
    zIndex: 1,
  },
});

export default CustomStatusBar;
