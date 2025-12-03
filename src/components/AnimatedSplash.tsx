import { useState, useEffect, useRef, ReactNode } from 'react';
import { Animated, StyleSheet } from 'react-native';
import DynamicSplash from './DynamicSplash';

interface AnimatedSplashProps {
  children: ReactNode;
}

export default function AnimatedSplash({ children }: AnimatedSplashProps) {
  const [isSplashDone, setIsSplashDone] = useState(false);
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isSplashDone) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setIsAnimationComplete(true);
      });
    }
  }, [isSplashDone, fadeAnim]);

  return (
    <>
      {!isAnimationComplete && (
        <Animated.View style={[styles.splashContainer, { opacity: fadeAnim }]}>
          <DynamicSplash onFinish={() => setIsSplashDone(true)} />
        </Animated.View>
      )}
      {isSplashDone && children}
    </>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
});
