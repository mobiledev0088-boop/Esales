import {View, TouchableOpacity, ActivityIndicator} from 'react-native';
import ActionSheet, {
  SheetManager,
  useSheetPayload,
} from 'react-native-actions-sheet';
import {useThemeStore} from '../../../../../stores/useThemeStore';
import AppIcon from '../../../../../components/customs/AppIcon';
import AppText from '../../../../../components/customs/AppText';
import {useQuery} from '@tanstack/react-query';
import {handleASINApiCall} from '../../../../../utils/handleApiCall';

interface TrackStatusSheetPayload {
  awbNumber?: string | null;
  courierCompany?: string | null;
  Origin_Location?: string | null;
  Destination_Location?: string | null;
  testMode?: boolean; // For testing purposes
}

interface TrackingInfo {
  awbNo?: string;
  status?: string;
  lastUpdated?: string;
  origin?: string;
  destination?: string;
  transporter?: string;
  pickupDate?: string;
  consignee?: string;
  weight?: string;
  estimatedDelivery?: string;
}

interface DetailRowProps {
  icon: string;
  label: string;
  value: string;
  isDarkMode: boolean;
  isLast?: boolean;
}

//  API HOOk
const useTrackingInfo = (
  awbNumber?: string | null,
  courierCompany?: string | null,
) => {
  return useQuery({
    queryKey: ['trackingInfo', awbNumber, courierCompany],
    enabled: Boolean(awbNumber && courierCompany),
    queryFn: async () => {
      const res = await handleASINApiCall(
        '/StandPOSM/StandPOSMAllocation_RequestIDList',
        {
          AWB_Number: awbNumber || '',
          Courier_Company: courierCompany || '',
        },
      );

      const result = res?.DashboardData;
      if (!result?.Status) {
        throw new Error(result?.Message || 'Failed to load tracking info');
      }
      return result?.Datainfo as TrackingInfo;
    },
  });
};

//  Detail Row Component
const DetailRow = ({
  icon,
  label,
  value,
  isDarkMode,
  isLast,
}: DetailRowProps) => (
  <View
    className={`flex-row items-center py-3 ${!isLast ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}>
    <View className="w-8">
      <AppIcon
        type="ionicons"
        name={icon}
        size={18}
        color={isDarkMode ? '#9ca3af' : '#6b7280'}
      />
    </View>
    <AppText
      size="sm"
      className="text-gray-600 dark:text-gray-400 flex-1 ml-2"
      weight="medium">
      {label}
    </AppText>
    <AppText
      size="sm"
      weight="semibold"
      className="text-gray-800 dark:text-gray-200">
      {value}
    </AppText>
  </View>
);

export default function TrackStatusSheet() {
  const payload = useSheetPayload() as TrackStatusSheetPayload | undefined;

  const {awbNumber, courierCompany} = payload || {};

  const AppTheme = useThemeStore(state => state.AppTheme);
  const isDarkMode = AppTheme === 'dark';

  const hasRequiredData = awbNumber && courierCompany;

  const {data, isLoading, isError, error} = useTrackingInfo(
    awbNumber,
    courierCompany,
  );

  const handleClose = () => {
    SheetManager.hide('TrackStatusSheet');
  };

  const trackingData = data;

  return (
    <View>
      <ActionSheet
        id="TrackStatusSheet"
        useBottomSafeAreaPadding
        gestureEnabled
        containerStyle={{
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
        }}
        indicatorStyle={{
          backgroundColor: isDarkMode ? '#6b7280' : '#d1d5db',
          width: 50,
          height: 4,
          borderRadius: 2,
          marginTop: 8,
        }}>
        <View className="px-5 py-4 pb-6">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-5">
            <AppText
              size="xl"
              weight="bold"
              className="text-blue-600 dark:text-blue-400">
              Tracking Status
            </AppText>
            <TouchableOpacity onPress={handleClose} className="p-1">
              <AppIcon
                type="ionicons"
                name="close"
                size={24}
                color={isDarkMode ? '#9ca3af' : '#6b7280'}
              />
            </TouchableOpacity>
          </View>

          {/* Missing Data State */}
          {!hasRequiredData && (
            <View className="items-center justify-center py-10">
              <View className="bg-orange-100 dark:bg-orange-900/20 rounded-full p-4 mb-3">
                <AppIcon
                  type="ionicons"
                  name="warning-outline"
                  size={48}
                  color="#F59E0B"
                />
              </View>
              <AppText
                size="base"
                weight="semibold"
                className="text-gray-800 dark:text-gray-200 mb-2">
                No Data Available
              </AppText>
              <AppText size="sm" color="gray" className="text-center px-4">
                Missing AWB Number and Courier Company. Please provide the
                required information to track your shipment.
              </AppText>
            </View>
          )}

          {/* Loading State */}
          {hasRequiredData && isLoading && (
            <View className="items-center justify-center py-10">
              <ActivityIndicator size="large" color="#00539B" />
              <AppText size="sm" color="gray" className="mt-3">
                Loading tracking information...
              </AppText>
            </View>
          )}

          {/* Error State */}
          {hasRequiredData && isError && !isLoading && (
            <View className="items-center justify-center py-10">
              <View className="bg-red-100 dark:bg-red-900/20 rounded-full p-4 mb-3">
                <AppIcon
                  type="ionicons"
                  name="alert-circle-outline"
                  size={48}
                  color="#EF4444"
                />
              </View>
              <AppText
                size="base"
                weight="semibold"
                className="text-gray-800 dark:text-gray-200 mb-2">
                Tracking Information Unavailable
              </AppText>
              <AppText size="sm" color="gray" className="text-center px-4 mb-2">
                {error?.message ||
                  'Unable to fetch tracking information at this time.'}
              </AppText>
              <View className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 mt-2 mx-4">
                <AppText size="xs" color="gray" className="text-center">
                  Please check your AWB number and try again later, or contact
                  support if the problem persists.
                </AppText>
              </View>
            </View>
          )}

          {/* Success State - Tracking Details */}
          {hasRequiredData && !isLoading && !isError && trackingData && (
            <View>
              {/* AWB Number */}
              <View className="mb-4">
                <AppText size="sm" color="gray" className="mb-1">
                  AWB Number:
                </AppText>
                <AppText
                  size="xl"
                  weight="bold"
                  className="text-gray-800 dark:text-gray-100">
                  {trackingData?.awbNo || awbNumber || 'N/A'}
                </AppText>
              </View>

              {/* Origin and Destination with Progress */}
              <View className="mb-5">
                <View className="flex-row items-center justify-between mb-3">
                  {/* Origin */}
                  <View className="items-center flex-1">
                    <View className="bg-green-100 dark:bg-green-900/30 rounded-full p-3 mb-2">
                      <AppIcon
                        type="ionicons"
                        name="business"
                        size={28}
                        color="#10b981"
                      />
                    </View>
                    <AppText size="xs" color="gray" className="mb-1">
                      Origin
                    </AppText>
                    <AppText
                      size="sm"
                      weight="semibold"
                      className="text-gray-800 dark:text-gray-200">
                      {trackingData?.origin || 'N/A'}
                    </AppText>
                  </View>

                  {/* Progress Bar */}
                  <View className="flex-1 mx-3">
                    <View className="items-center mb-2">
                      <View className="bg-green-500 px-3 py-1 rounded-full">
                        <AppText
                          size="xs"
                          weight="semibold"
                          className="text-white">
                          {trackingData?.status || 'In Transit'}
                        </AppText>
                      </View>
                    </View>
                    <View className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <View
                        className="h-full bg-yellow-500 rounded-full"
                        style={{width: '50%'}}
                      />
                    </View>
                    <View className="items-center mt-1">
                      <AppText size="xs" color="gray">
                        Updated On:
                      </AppText>
                      <AppText
                        size="xs"
                        weight="semibold"
                        className="text-gray-700 dark:text-gray-300">
                        {trackingData?.lastUpdated || 'N/A'}
                      </AppText>
                    </View>
                  </View>

                  {/* Destination */}
                  <View className="items-center flex-1">
                    <View className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-3 mb-2">
                      <AppIcon
                        type="ionicons"
                        name="storefront"
                        size={28}
                        color="#3b82f6"
                      />
                    </View>
                    <AppText size="xs" color="gray" className="mb-1">
                      Destination
                    </AppText>
                    <AppText
                      size="sm"
                      weight="semibold"
                      className="text-gray-800 dark:text-gray-200">
                      {trackingData?.destination || 'N/A'}
                    </AppText>
                  </View>
                </View>
              </View>

              {/* Details Section */}
              <View className="border-t border-gray-200 dark:border-gray-700 pt-4">
                {/* Transporter */}
                <DetailRow
                  icon="airplane"
                  label="Transporter:"
                  value={trackingData?.transporter || courierCompany || 'N/A'}
                  isDarkMode={isDarkMode}
                />

                {/* Pick-up Date */}
                <DetailRow
                  icon="calendar"
                  label="Pick-up Date:"
                  value={trackingData?.pickupDate || 'N/A'}
                  isDarkMode={isDarkMode}
                />

                {/* Consignee */}
                <DetailRow
                  icon="person"
                  label="Consignee:"
                  value={trackingData?.consignee || 'N/A'}
                  isDarkMode={isDarkMode}
                />

                {/* Weight */}
                <DetailRow
                  icon="cube"
                  label="Weight:"
                  value={trackingData?.weight || 'N/A'}
                  isDarkMode={isDarkMode}
                />

                {/* Estimated Delivery */}
                <DetailRow
                  icon="calendar-outline"
                  label="Estimated Delivery:"
                  value={trackingData?.estimatedDelivery || 'N/A'}
                  isDarkMode={isDarkMode}
                  isLast
                />
              </View>
            </View>
          )}
        </View>
      </ActionSheet>
    </View>
  );
};

export const showTrackStatusSheet = (payload: TrackStatusSheetPayload) => SheetManager.show('TrackStatusSheet', {payload});
export const hideTrackStatusSheet = () => SheetManager.hide('TrackStatusSheet');