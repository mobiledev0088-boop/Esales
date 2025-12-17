import { memo } from 'react';
import {TouchableOpacity, View, StyleProp, ViewStyle} from 'react-native';
import AppIcon from './customs/AppIcon';
import { twMerge } from 'tailwind-merge';
import clsx from 'clsx';
import { getShadowStyle } from '../utils/appStyles';

interface FilterButtonProps {
  onPress: () => void;
  hasActiveFilters?: boolean;
  needBorder?: boolean;
  noShadow?: boolean;
  shadowLevel?: 1 | 2 | 3| 4 | 5;
  iconName?: string;
  iconSize?: number;
  iconColor?: string;
  containerClassName?: string;
  containerStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

const FilterButton: React.FC<FilterButtonProps> = ({
  onPress,
  hasActiveFilters = false,
  needBorder = false,
  shadowLevel = 1,
  noShadow = false,
  iconName = 'tune-variant',
  iconSize = 20,
  iconColor = '#3B82F6',
  containerClassName,
  containerStyle,
}) => {
    const classStyle = twMerge(clsx('p-4 mb-3 rounded-md bg-white',needBorder ? 'border border-gray-200 dark:border-gray-700' : '',containerClassName)); 
    const mergedContainerStyle = [noShadow ? {} : getShadowStyle(shadowLevel) ,containerStyle];
    return (
    <TouchableOpacity
      className={classStyle}
      style={mergedContainerStyle}
      onPress={onPress}
      activeOpacity={0.7}
      >
      <View className="items-center justify-center relative">
        <AppIcon
          name={iconName}
          size={iconSize}
          color={iconColor}
          type="material-community"
        />

        {hasActiveFilters && (
          <View className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
        )}
      </View>
    </TouchableOpacity>
  );
};

export default memo(FilterButton);
