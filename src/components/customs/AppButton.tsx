import AppText from './AppText';
import AppIcon from './AppIcon';

import {ActivityIndicator, TouchableOpacity, View} from 'react-native';
import {AppTextColorType,AppTextSizeType,AppTextWeightType} from '../../types/customs';
import {useLoaderStore} from '../../stores/useLoaderStore';
import {twMerge} from 'tailwind-merge';

interface AppButtonProps {
  title: string | React.ReactNode;
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  iconName?: string; 
  className?: string; 
  color?: AppTextColorType;
  size?: AppTextSizeType;
  weight?: AppTextWeightType;
  disabled?: boolean;
  noLoading?: boolean;
}

export default function AppButton ({
  title,
  onPress,
  onPressIn,
  onPressOut,
  iconName,
  className = '',
  color = 'white',
  size = 'base',
  weight = 'medium',
  disabled = false,
  noLoading = false,
}: AppButtonProps) {
  const isLoading = useLoaderStore(state => state.isLoading);
  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      className={twMerge(`bg-primary p-3 rounded-sm items-center ${className}`)}
      activeOpacity={0.7}
      disabled={isLoading || disabled}
      style={{opacity: isLoading || disabled ? 0.7 : 1}}>
      {isLoading && !noLoading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <View className="flex-row items-center gap-2">
          {iconName && (
            <AppIcon type="feather" name={iconName} size={16} color={color} />
          )}
          <AppText
            className="text-center"
            color={color}
            size={size}
            weight={weight}>
            {title}
          </AppText>
        </View>
      )}
    </TouchableOpacity>
  );
};