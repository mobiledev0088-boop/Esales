// components/DataStateView.tsx
import {ScrollView, View} from 'react-native';
import AppIcon from './customs/AppIcon';
import AppText from './customs/AppText';
import AppButton from './customs/AppButton';
import {screenHeight} from '../utils/constant';

type DataStateViewProps = {
  isLoading: boolean;
  isError: boolean;
  isEmpty?: boolean;
  onRetry?: () => void;
  LoadingComponent?: React.ReactNode;
  ErrorComponent?: React.ReactNode;
  EmptyComponent?: React.ReactNode;
  children: React.ReactNode;
};

const DefaultErrorComponent = ({onRetry}: {onRetry?: () => void}) => (
  <View className="flex-1 justify-center items-center px-6">
    <AppIcon type="feather" name="alert-circle" size={56} color="#EF4444" />
    <AppText
      size="lg"
      weight="semibold"
      className="mt-4 mb-2 text-center text-red-500">
      Oops! Something went wrong
    </AppText>
    <AppText size="sm" className="text-center text-gray-500 mb-6">
      We couldn't load data. Please check your connection and tap refresh to try
      again.
    </AppText>
    <AppButton
      title="Refresh"
      onPress={onRetry}
      iconName="refresh-cw"
      className="px-6"
    />
  </View>
);

const DefaultEmptyComponent = () => (
  <View
    className="justify-center items-center px-3"
    style={{height: screenHeight * 0.7}}>
    <AppIcon name="inbox" size={48} color="#9CA3AF" type="fontAwesome" />
    <AppText size="md" className="text-center">
      No data available to display.
    </AppText>
  </View>
);

export function DataStateView({
  isLoading,
  isError,
  isEmpty,
  onRetry,
  LoadingComponent,
  ErrorComponent,
  EmptyComponent,
  children,
}: DataStateViewProps) {
  if (isLoading) {
    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {LoadingComponent ?? null}
      </ScrollView>
    );
  }

  if (isError) {
    return <>{ErrorComponent ?? <DefaultErrorComponent onRetry={onRetry} />}</>;
  }

  if (isEmpty) {
    return <>{EmptyComponent ?? <DefaultEmptyComponent />}</>;
  }

  return <>{children}</>;
}
