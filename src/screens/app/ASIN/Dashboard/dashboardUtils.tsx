import { Alert, TouchableOpacity, View } from 'react-native';
import { ErrorDisplayProps } from '../../../../types/dashboard';
import AppIcon from '../../../../components/customs/AppIcon';
import AppText from '../../../../components/customs/AppText';

// Error handling utilities for Dashboard
export const handleApiError = (error: Error | null, componentName: string = 'Component') => {
  if (!error) return null;
  
  console.error(`${componentName} Error:`, error.message);
  return {
    title: 'Something went wrong',
    message: `Unable to load ${componentName.toLowerCase()} data. Please try again.`,
    retry: true
  };
};

export const calculatePercentage = (achieved: string | number, target: string | number): number => {
  const achievedNum = Number(achieved) || 0;
  const targetNum = Number(target) || 0;
  
  if (targetNum === 0) return 0;
  return Math.round((achievedNum / targetNum) * 100);
};

export const getPerformanceColor = (percentage: number): {
  bgColor: string;
  textColor: 'success' | 'warning' | 'error';
} => {
  if (percentage >= 90) {
    return { bgColor: 'bg-green-100', textColor: 'success' };
  } else if (percentage >= 70) {
    return { bgColor: 'bg-orange-100', textColor: 'warning' };
  } else {
    return { bgColor: 'bg-red-100', textColor: 'error' };
  }
};

export const formatDisplayValue = (value: string | number | undefined): string => {
  if (value === undefined || value === null || value === '') return '0';
  
  const numValue = Number(value);
  
  // Check if it's a valid number
  if (isNaN(numValue)) return String(value);
  
  // Convert to Indian numbering system (with commas)
  return numValue.toLocaleString('en-IN');
};

export const showErrorAlert = (title: string, message: string, onRetry?: () => void) => {
  Alert.alert(
    title,
    message,
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      ...(onRetry ? [{
        text: 'Retry',
        onPress: onRetry,
      }] : []),
    ]
  );
};

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  title,
  message,
  onRetry,
  showRetry = true,
}) => {
  return (
    <View className="flex-1 items-center justify-center p-6">
      <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4">
        <AppIcon name="alert-circle" type="feather" color="#EF4444" size={32} />
      </View>

      <AppText
        size="lg"
        weight="bold"
        color="text"
        className="text-center mb-2">
        {title}
      </AppText>

      <AppText size="sm" color="gray" className="text-center mb-6 max-w-xs">
        {message}
      </AppText>

      {showRetry && onRetry && (
        <TouchableOpacity
          className="bg-blue-600 px-6 py-3 rounded-lg flex-row items-center"
          activeOpacity={0.7}
          onPress={onRetry}>
          <AppIcon name="refresh-cw" type="feather" color="white" size={16} />
          <AppText size="sm" weight="semibold" color="white" className="ml-2">
            Try Again
          </AppText>
        </TouchableOpacity>
      )}
    </View>
  );
};