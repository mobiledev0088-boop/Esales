import {useEffect, useRef} from 'react';
import {View, StyleSheet, Animated, useColorScheme} from 'react-native';
import {LinearGradient} from 'react-native-linear-gradient';

interface SkeletonProps {
  width?: number;
  height?: number;
  borderRadius?: number;
  baseColorLight?: string;
  highlightColorLight?: string;
  baseColorDark?: string;
  highlightColorDark?: string;
  isDarkOverride?: boolean; // allow manual override if provided
}

const Skeleton = ({
  width = 200,
  height = 20,
  borderRadius = 8,
  baseColorLight = '#E1E9EE',
  highlightColorLight = '#F2F8FC',
  baseColorDark = '#2A2F33',
  highlightColorDark = '#3A4248',
  isDarkOverride,
}: SkeletonProps) => {
  const shimmerAnim = useRef(new Animated.Value(-1)).current;
  const colorScheme = useColorScheme();
  const isDark = typeof isDarkOverride === 'boolean' ? isDarkOverride : colorScheme === 'dark';

  const baseColor = isDark ? baseColorDark : baseColorLight;
  const highlightColor = isDark ? highlightColorDark : highlightColorLight;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-width, width],
  });

  return (
    <View style={[styles.skeleton, {width, height, borderRadius, backgroundColor: baseColor}]}>
      <Animated.View
        style={{
          ...StyleSheet.absoluteFillObject,
          transform: [{translateX}],
        }}>
        <LinearGradient
          colors={[baseColor, highlightColor, baseColor]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={{flex: 1}}
        />
      </Animated.View>
    </View>
  );
};

export default Skeleton;

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
    marginVertical: 6,
  },
});