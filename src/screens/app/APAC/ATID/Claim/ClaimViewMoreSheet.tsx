import {
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import ActionSheet, {SheetManager} from 'react-native-actions-sheet';
import {useThemeStore} from '../../../../../stores/useThemeStore';
import {useClaimMasterDataViewMore} from '../../../../../hooks/queries/claim';
import AppText from '../../../../../components/customs/AppText';
import AppIcon from '../../../../../components/customs/AppIcon';
import {AppColors} from '../../../../../config/theme';
import {memo, useCallback, useMemo} from 'react';
import moment from 'moment';
import {convertToAPACUnits} from '../../../../../utils/commonFunctions';
import Skeleton from '../../../../../components/skeleton/skeleton';
import {screenHeight, screenWidth} from '../../../../../utils/constant';
import AppButton from '../../../../../components/customs/AppButton';

export interface ClaimFilterPayload {
  ClaimCode: string;
  BranchName: string;
  ClaimStatus: string;
  masterTab: string;
  YearQtr: string;
}

export interface claimDetails {
  AfterTaxAmt: number;
  Application_No: string;
  BranchName: string;
  Claim_Code: string;
  Claim_EndDate: string;
  Claim_StartDate: string;
  Claim_Status: string;
  Disti_Code: string | null;
  India_Status: string;
  PreTaxAmt: number;
  Scheme_Category: string;
  Partner_Name: string;
}

// Memoized Header Component
const SheetHeader = memo(
  ({
    onClose,
    isDarkMode,
    claimCode,
  }: {
    onClose: () => void;
    isDarkMode: boolean;
    claimCode: string;
  }) => (
    <View className="flex-row justify-between items-center px-5 py-4 border-b border-gray-200 dark:border-gray-700">
      <View className="flex-1">
        <AppText size="xl" weight="bold" className="mb-1">
          Claim Details
        </AppText>
        <AppText size="sm" color="gray" className="opacity-70">
          {claimCode}
        </AppText>
      </View>
      <TouchableOpacity
        onPress={onClose}
        className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center"
        activeOpacity={0.7}>
        <AppIcon
          name="x"
          type="feather"
          size={20}
          color={isDarkMode ? '#9ca3af' : '#4b5563'}
        />
      </TouchableOpacity>
    </View>
  ),
);

// Memoized Status Badge Component - Compact Version
const StatusBadge = memo(
  ({status, indiaStatus}: {status: string; indiaStatus: string}) => {
    const isDarkMode = useThemeStore(state => state.AppTheme === 'dark');

    const statusConfig = useMemo(() => {
      if (status === 'Closed') {
        return {
          bg: 'bg-green-100 dark:bg-green-900/30',
          text: 'text-green-700 dark:text-green-400',
          icon: 'check-circle',
          iconColor: isDarkMode ? '#4ade80' : '#15803d',
        };
      } else if (status === 'Open') {
        return {
          bg: 'bg-blue-100 dark:bg-blue-900/30',
          text: 'text-blue-700 dark:text-blue-400',
          icon: 'clock',
          iconColor: isDarkMode ? '#60a5fa' : '#1e40af',
        };
      } else {
        return {
          bg: 'bg-yellow-100 dark:bg-yellow-900/30',
          text: 'text-yellow-700 dark:text-yellow-400',
          icon: 'alert-circle',
          iconColor: isDarkMode ? '#facc15' : '#a16207',
        };
      }
    }, [status, isDarkMode]);

    return (
      <View className="flex-col items-end">
        <View
          className={`${statusConfig.bg} flex-row items-center px-2 py-1 rounded-md`}>
          <AppIcon
            name={statusConfig.icon}
            type="feather"
            size={12}
            color={statusConfig.iconColor}
          />
          <AppText
            size="xs"
            weight="semibold"
            className={`${statusConfig.text} ml-1`}>
            {status}
          </AppText>
        </View>
        {indiaStatus && (
          <AppText size="xs" color="gray" className="mt-0.5 opacity-60">
            {indiaStatus}
          </AppText>
        )}
      </View>
    );
  },
);

const ClaimCard = memo(({item, index}: {item: claimDetails; index: number}) => {
  const formatDate = useCallback((date: string) => {
    return date ? moment(date, 'YYYY/MM/DD').format('DD-MM-YYYY') : 'N/A';
  }, []);

  return (
    <View className="px-4 py-1.5">
      <View className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-700">
                  <View className='flex-1 mb-2 pb-2 border-b border-gray-100 dark:border-gray-700'>
            <AppText size="xs" color="gray" className="opacity-60">
              Partner_Name.
            </AppText>
            <AppText size="sm" weight="bold">
              {item.Partner_Name}
            </AppText>

          </View>
        <View className="flex-row justify-between items-start mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">
          <View className="flex-1">
            <AppText size="xs" color="gray" className="opacity-60">
              App No.
            </AppText>
            <AppText size="sm" weight="bold">
              {item.Application_No}
            </AppText>
          </View>
          <StatusBadge
            status={item.Claim_Status}
            indiaStatus={item.India_Status}
          />
        </View>
        <View className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2 mb-2">
          <View className="flex-row justify-between items-center mb-1">
            <AppText size="sm" color="gray" className="opacity-70">
              Pre-Tax
            </AppText>
            <AppText weight="bold" color="primary">
              {convertToAPACUnits(item.PreTaxAmt, true, true)}
            </AppText>
          </View>
          <View className="flex-row justify-between items-center">
            <AppText size="sm" color="gray" className="opacity-70">
              After-Tax
            </AppText>
            <AppText weight="bold" color="success">
              {convertToAPACUnits(item.AfterTaxAmt, true, true)}
            </AppText>
          </View>
        </View>
        <View className="flex-row flex-wrap -mx-1">
          <View className="w-1/2 px-1 mb-1.5">
            <AppText size="sm" color="gray" className="opacity-60 mb-0.5">
              Branch
            </AppText>
            <AppText weight="medium">{item.BranchName}</AppText>
          </View>
          <View className="w-1/2 px-1 mb-1.5">
            <AppText size="sm" color="gray" className="opacity-60 mb-0.5">
              Claim Code
            </AppText>
            <AppText weight="medium">{item.Claim_Code}</AppText>
          </View>
          <View className="w-1/2 px-1 mb-1.5">
            <AppText size="sm" color="gray" className="opacity-60 mb-0.5">
              Category
            </AppText>
            <AppText weight="medium">{item.Scheme_Category}</AppText>
          </View>
          <View className="w-1/2 px-1 mb-1.5">
            <AppText size="sm" color="gray" className="opacity-60 mb-0.5">
              Disti Name
            </AppText>
            <AppText weight="medium">{item.Disti_Code || 'N/A'}</AppText>
          </View>
          <View className="w-1/2 px-1">
            <AppText size="sm" color="gray" className="opacity-60 mb-0.5">
              Start Date
            </AppText>
            <AppText weight="medium">
              {formatDate(item.Claim_StartDate)}
            </AppText>
          </View>
          <View className="w-1/2 px-1">
            <AppText size="sm" color="gray" className="opacity-60 mb-0.5">
              End Date
            </AppText>
            <AppText weight="medium">{formatDate(item.Claim_EndDate)}</AppText>
          </View>
        </View>
      </View>
    </View>
  );
});

// Loading State with Skeletons
const LoadingState = memo(() => (
  <View className="py-2 px-3 gap-2">
    {[...Array(5)].map((_, idx) => (
      <Skeleton
        key={idx}
        width={screenWidth - 24}
        height={100}
        borderRadius={12}
      />
    ))}
  </View>
));

// Error Component
const ErrorState = memo(
  ({message, onPress}: {message: string; onPress: () => void}) => (
    <View className="justify-center items-center py-20 px-6">
      <View className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full items-center justify-center mb-4">
        <AppIcon name="alert-circle" type="feather" size={32} color="#ef4444" />
      </View>
      <AppText
        size="base"
        weight="semibold"
        color="error"
        className="mb-2 text-center">
        Unable to Load Data
      </AppText>
      <AppText size="sm" color="gray" className="text-center opacity-70">
        {message || 'Something went wrong. Please try again.'}
      </AppText>
      <AppButton
        title="Retry"
        onPress={onPress}
        className="mt-4 px-6 rounded-md"
      />
    </View>
  ),
);

// Empty State Component
const EmptyState = memo(() => (
  <View className="justify-center items-center py-20 px-6">
    <View className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full items-center justify-center mb-4">
      <AppIcon name="inbox" type="feather" size={32} color="#9ca3af" />
    </View>
    <AppText size="base" weight="semibold" className="mb-2 text-center">
      No Claim Details Found
    </AppText>
    <AppText size="sm" color="gray" className="text-center opacity-70">
      There are no claim details available for this selection.
    </AppText>
  </View>
));

// Item Separator Component
const ItemSeparator = memo(() => <View className="h-3" />);

// Main Sheet Component
export default function ClaimViewMoreSheet({
  payload,
}: {
  payload: ClaimFilterPayload;
}) {
  console.log('ClaimViewMoreSheet Payload:', payload); // Debug log for payload
  const {data, isLoading, isError, error, refetch} =
    useClaimMasterDataViewMore(payload);
  const isDarkMode = useThemeStore(state => state.AppTheme === 'dark');

  const handleClose = useCallback(() => {
    hideClaimViewMoreSheet();
  }, []);

  const renderItem = useCallback(
    ({item, index}: {item: claimDetails; index: number}) => (
      <ClaimCard item={item} index={index} />
    ),
    [],
  );

  const keyExtractor = useCallback(
    (item: claimDetails, index: number) =>
      `${item.Application_No}-${item.Claim_Code}-${index}`,
    [],
  );

  const ListHeaderComponent = useMemo(
    () => (
      <SheetHeader
        onClose={handleClose}
        isDarkMode={isDarkMode}
        claimCode={payload.ClaimCode}
      />
    ),
    [handleClose, isDarkMode, payload.ClaimCode],
  );

  const renderContent = () => {
    if (isLoading) {
      return <LoadingState />;
    }
    if (isError) {
      return (
        <ErrorState
          message={error?.message || 'Failed to load claim details'}
          onPress={refetch}
        />
      );
    }
    console.log('Claim Details Data:', data); // Debug log for data structure
    if (!data || data.length === 0) {
      return <EmptyState />;
    }
    return (
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ItemSeparatorComponent={ItemSeparator}
        showsVerticalScrollIndicator={false}
        style={{maxHeight: screenHeight * 0.7}}
        contentContainerStyle={{paddingTop: 8, paddingBottom: 16}}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        getItemLayout={(data, index) => ({
          length: 450,
          offset: 450 * index,
          index,
        })}
      />
    );
  };

  return (
    <View>
      <ActionSheet
        id="ClaimViewMoreSheet"
        useBottomSafeAreaPadding
        keyboardHandlerEnabled={false}
        gestureEnabled={false}
        containerStyle={{
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
        }}>
        {ListHeaderComponent}
        {renderContent()}
      </ActionSheet>
    </View>
  );
}

export const showClaimViewMoreSheet = (props: ClaimFilterPayload) =>
  SheetManager.show('ClaimViewMoreSheet', {payload: props});
export const hideClaimViewMoreSheet = () =>
  SheetManager.hide('ClaimViewMoreSheet');
