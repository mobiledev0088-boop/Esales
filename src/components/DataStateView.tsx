// components/DataStateView.tsx
import { ScrollView, View } from "react-native";
import AppIcon from "./customs/AppIcon";
import AppText from "./customs/AppText";
import AppButton from "./customs/AppButton";
import { screenHeight } from "../utils/constant";

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
  <View className="flex-1 justify-center items-center px-3">
    <AppText className="text-base text-center mb-4">
      Something went wrong while fetching data.
    </AppText>
    {onRetry && (
      <AppButton title="Retry" onPress={onRetry} />
    )}
  </View>
);

const DefaultEmptyComponent = () => (
  <View className="justify-center items-center px-3" style={{height: screenHeight * 0.7}}>
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
    return <ScrollView showsVerticalScrollIndicator={false}>{LoadingComponent ?? null}</ScrollView>;
  }

  if (isError) {
    return <>{ErrorComponent ?? <DefaultErrorComponent onRetry={onRetry} />}</>;
  }

  if (isEmpty) {
    return <>{EmptyComponent ?? <DefaultEmptyComponent />}</>;
  }

  return <>{children}</>;
}