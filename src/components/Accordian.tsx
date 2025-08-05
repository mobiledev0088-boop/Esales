import { LayoutChangeEvent, View, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { twMerge } from 'tailwind-merge';
import AppIcon from './customs/AppIcon';
import { useRef } from 'react';

type AccordionProps = {
  header: React.ReactNode;
  children: React.ReactNode;
  duration?: number;
  arrowSize?: number;
  initiallyExpanded?: boolean;
  headerContainerClassName?: string;
  contentContainerClassName?: string;
};

export function Accordion({
  header,
  children,
  duration = 120,
  arrowSize = 24,
  initiallyExpanded = false,
  headerContainerClassName = '',
  contentContainerClassName = '',
}: AccordionProps) {
  const isExpanded = useSharedValue(initiallyExpanded ? 1 : 0);
  const contentHeight = useSharedValue(0);
  const measured = useRef(false);

  const animationConfig = {
    duration,
    easing: Easing.out(Easing.cubic),
  };

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    height: withTiming(isExpanded.value * contentHeight.value, animationConfig),
    overflow: 'hidden',
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotateZ: `${interpolate(isExpanded.value, [0, 1], [0, 90])}deg`,
      },
    ],
  }));

  const handleHeaderPress = () => {
    isExpanded.value = withTiming(isExpanded.value === 1 ? 0 : 1, animationConfig);
  };

  const handleContentLayout = (e: LayoutChangeEvent) => {
    const measuredHeight = e.nativeEvent.layout.height;
    if (!measured.current || Math.abs(measuredHeight - contentHeight.value) > 0.5) {
      contentHeight.value = measuredHeight;
      measured.current = true;
    }
  };

  const mergedHeaderClass = twMerge(
    'flex-row items-center justify-between px-3 pb-2',
    headerContainerClassName
  );

  const mergedContentClass = twMerge(
    'pb-3 bg-white rounded-md',
    contentContainerClassName
  );

  return (
    <View className="space-y-1">
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handleHeaderPress}
        className={mergedHeaderClass}
      >
        {header}
        <Animated.View style={iconAnimatedStyle}>
          <AppIcon
            type="feather"
            name="chevron-right"
            size={arrowSize}
            color="#000"
          />
        </Animated.View>
      </TouchableOpacity>

      {/* Invisible view to measure height once */}
      <View
        style={{
          position: 'absolute',
          opacity: 0,
          zIndex: -1,
          left: 0,
          right: 0,
        }}
        onLayout={handleContentLayout}
      >
        <View className={mergedContentClass}>{children}</View>
      </View>

      {/* Actual animated accordion content */}
      <Animated.View style={[{ width: '100%' }, containerAnimatedStyle]}>
        <View className={mergedContentClass}>
          {children}
        </View>
      </Animated.View>

      <View className="border-b border-gray-200" />
    </View>
  );
}

