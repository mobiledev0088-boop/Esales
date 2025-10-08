import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { twMerge } from 'tailwind-merge';
import AppIcon from './customs/AppIcon';
import { useThemeStore } from '../stores/useThemeStore';
import { AppColors } from '../config/theme';

interface AccordionItemProps {
  isExpanded: SharedValue<boolean>;
  children: React.ReactNode;
  viewKey: string;
  className?: string;
  duration?: number;
}

function AccordionItem({
  isExpanded,
  children,
  viewKey,
  className,
  duration = 500,
}: AccordionItemProps) {
  const height = useSharedValue(0);

  const derivedHeight = useDerivedValue(() =>
    withTiming(height.value * Number(isExpanded.value), {
      duration,
    })
  );

  const bodyStyle = useAnimatedStyle(() => ({
    height: derivedHeight.value,
  }));

  return (
    <Animated.View
      key={`accordionItem_${viewKey}`}
      style={bodyStyle}
      className={twMerge('w-full ', className)}>
      <View
        onLayout={(e) => {
          height.value = e.nativeEvent.layout.height;
        }}
        className="w-full absolute flex">
        {children}
      </View>
    </Animated.View>
  );
}

interface AccordionProps {
  header: React.ReactNode | string;
  children: React.ReactNode;
  initialOpening?: boolean;
  duration?: number;
  headerClassName?: string;
  contentClassName?: string;
  containerClassName?: string;
  needBottomBorder?: boolean;
  arrowSize?: number;
}

export default function Accordion({
  header,
  children,
  initialOpening = false,
  duration = 250,
  headerClassName,
  contentClassName,
  containerClassName,
  needBottomBorder = true,
  arrowSize = 24,
}: AccordionProps) {
  const open = useSharedValue(initialOpening);
  const AppTheme = useThemeStore((state) => state.AppTheme);

  const handlePress = () => {
    open.value = !open.value;
  };

  const renderHeader = () => {
    if (typeof header === 'string') {
      return (
        <Text className={twMerge('text-base font-semibold text-gray-800', headerClassName)}>
          {header}
        </Text>
      );
    }
    return header;
  };

  const iconRotation = useDerivedValue(() =>
    withTiming(open.value ? 90 : 0, {
      duration,
    })
  );

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotateZ: `${iconRotation.value}deg`,
      },
    ],
  }));  return (
    <View className={twMerge('w-full overflow-hidden', containerClassName)}>
      <TouchableOpacity
        className={twMerge('flex-row items-center justify-between px-3 pb-2', headerClassName)}
        onPress={handlePress}
        activeOpacity={0.7}>
        {renderHeader()}
         <Animated.View style={iconAnimatedStyle}>
          <AppIcon
            type="feather"
            name="chevron-right"
            size={arrowSize}
            color={AppColors[AppTheme].text}
          />
        </Animated.View>
      </TouchableOpacity>

      <AccordionItem
        isExpanded={open}
        viewKey="customAccordion"
        className={contentClassName}
        duration={duration}>
        {children}
      </AccordionItem>
      {/* condition Based Rendering */}
      {needBottomBorder && <View className="border-b border-gray-200" />}
    </View>
  );
}
