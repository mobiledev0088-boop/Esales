import React, {useEffect} from 'react';
import {View, Modal, StyleSheet} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
} from 'react-native-reanimated';
import {useLoaderStore} from '../stores/useLoaderStore';
import {screenHeight, screenWidth} from '../utils/constant';
import AppImage from './customs/AppImage';
import AppText from './customs/AppText';

const GlobalLoader = () => {
  const globalLoading = useLoaderStore(state => state.globalLoading);

  return (
    <Modal transparent visible={globalLoading} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <View style={styles.loaderWrapper}>
              <AppImage
                source={require('../assets/images/logo2.png')}
                style={{width: 50, height: 50 , marginBottom:5, marginLeft:3}}
              />
              <Loader />
            </View>
          </View>
          {/* <AppText  weight="semibold" color="black">Loading...</AppText> */}
        </View>
      </View>
    </Modal>
  );
};

export default GlobalLoader;

const BARS = 11; // total bars
const SIZE = 110; // loader size
const BAR_WIDTH = 8;
const BAR_HEIGHT = 20;
const COLOR = '#00539B';

const Loader = () => {
  return (
    <View style={styles.container2}>
      {Array.from({length: BARS}).map((_, i) => (
        <Bar key={i} index={i} />
      ))}
    </View>
  );
};

const Bar = ({index}: {index: number}) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      index * 100, // stagger animation
      withRepeat(
        withTiming(1, {duration: 800}),
        -1,
        true, // reverse back
      ),
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: progress.value,
    };
  });

  const angle = (index * 360) / BARS;
  const radius = SIZE / 2 - BAR_HEIGHT / 2;

  const x = radius * Math.cos((angle * Math.PI) / 180);
  const y = radius * Math.sin((angle * Math.PI) / 180);

  return (
    <Animated.View
      style={[
        styles.bar,
        {
          transform: [
            {translateX: x},
            {translateY: y},
            {rotate: `${angle}deg`},
          ],
        },
        animatedStyle,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  overlay: {
    width: screenWidth,
    height: screenHeight,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 12,
  },

  container2: {
    width: SIZE,
    height: SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
    loaderWrapper: {
    width: SIZE,
    height: SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bar: {
    position: 'absolute',
    width: BAR_WIDTH,
    height: BAR_HEIGHT,
    borderRadius: 2,
    backgroundColor: COLOR,
  },
});
