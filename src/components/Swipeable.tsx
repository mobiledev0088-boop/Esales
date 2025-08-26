import React, {useCallback} from 'react';
import {View, StyleSheet, Dimensions, LayoutChangeEvent} from 'react-native';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  SharedValue,
  WithTimingConfig,
} from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {runOnJS} from 'react-native-worklets';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Animation configuration constants
const SPRING_CONFIG = {
  stiffness: 150,
  mass: 1,
} as const;

// const TIMING_CONFIG: WithTimingConfig = {
//   duration: 300,
// } as const;

// TypeScript interfaces
interface SwipeableProps {
  id: string;
  children: React.ReactNode;
  onDismiss: (id: string) => void;
  threshold?: number;
  backgroundColor?: string;
  icon?: string;
  iconColor?: string;
  borderRadius?: number;
  disabled?: boolean;
}

interface AnimatedStyles {
  transform: Array<{translateX: number}>;
}

interface ContainerStyles {
  height?: number;
  opacity: number;
  marginVertical: number;
}

export default React.memo<SwipeableProps>(function Swipeable({
  id,
  children,
  onDismiss,
  threshold = 0.5,
  backgroundColor = '#ff3b30',
  icon = 'trash-outline',
  iconColor = 'white',
  borderRadius = 12,
  disabled = false,
}) {
  // Shared values for animations
  const translateX: SharedValue<number> = useSharedValue(0);
  const rowHeight: SharedValue<number> = useSharedValue(-1);
  const rowOpacity: SharedValue<number> = useSharedValue(1);

  // Memoized callback for onDismiss to prevent unnecessary re-renders
  const handleDismiss = useCallback(() => {
    onDismiss(id);
  }, [id, onDismiss]);

  // Memoized layout handler
  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const height = event.nativeEvent.layout.height;
      if (rowHeight.value === -1) {
        rowHeight.value = height - 1;
      }
    },
    [rowHeight],
  );

  // Pan gesture configuration
  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10]) // ignores small horizontal moves
    .activeOffsetY([-999, 999])
    .onUpdate(event => {
      if (disabled) return; // Prevent gestures if disabled
      // Only allow left swipe (negative translation)
      if (event.translationX < 0) {
        translateX.value = event.translationX;
      }
    })
    .onEnd(() => {
      const dismissThreshold = -SCREEN_WIDTH * threshold;
      if (translateX.value < dismissThreshold) {
        // Animate out and dismiss
        // translateX.value = withSpring(-SCREEN_WIDTH, SPRING_CONFIG);
        // rowHeight.value = withTiming(0, TIMING_CONFIG);
        // rowOpacity.value = withTiming(0, TIMING_CONFIG, () => {
        // });
        runOnJS(handleDismiss)();
      }
      translateX.value = withSpring(0, SPRING_CONFIG);
    });

  // Animated styles with proper typing
  const rowStyle = useAnimatedStyle(
    (): AnimatedStyles => ({
      transform: [{translateX: translateX.value}],
    }),
  );

  const containerStyle = useAnimatedStyle(
    (): ContainerStyles => ({
      height: rowHeight.value === -1 ? undefined : rowHeight.value,
      opacity: rowOpacity.value,
      marginVertical: rowHeight.value === 0 ? 0 : 6,
    }),
  );

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Delete Background */}
      <View style={[styles.deleteBackground, {backgroundColor, borderRadius}]}>
        <View className="w-12 h-12 bg-white/20 rounded-lg justify-center items-center">
          <Ionicons name={icon} size={28} color={iconColor} />
        </View>
      </View>

      {/* Foreground Content */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={rowStyle} onLayout={handleLayout}>
          {children}
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  deleteBackground: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 20,
  },
});
