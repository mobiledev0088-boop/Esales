import {View, FlatList, TouchableOpacity} from 'react-native';
import {memo, useMemo, useState} from 'react';
import AppLayout from '../../../../../components/layout/AppLayout';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useQuery} from '@tanstack/react-query';
import {handleAPACApiCall} from '../../../../../utils/handleApiCall';
import {
  formatUnique,
  convertToAPACUnits,
} from '../../../../../utils/commonFunctions';
import useQuarterHook from '../../../../../hooks/useQuarterHook';
import AppDropdown, {
  AppDropdownItem,
} from '../../../../../components/customs/AppDropdown';
import {DataStateView} from '../../../../../components/DataStateView';
import Skeleton from '../../../../../components/skeleton/skeleton';
import {screenWidth} from '../../../../../utils/constant';
import Card from '../../../../../components/Card';
import AppText from '../../../../../components/customs/AppText';
import {CircularProgressBar} from '../../../../../components/customs/AppChart';
import AppIcon from '../../../../../components/customs/AppIcon';
import {AppColors} from '../../../../../config/theme';
import { AppNavigationParamList, AppNavigationProp } from '../../../../../types/navigation';

interface DealerHitRateData {
  Achieved_Qty: number;
  Partner_Code: string;
  Partner_Name: string;
  Partner_Type: string;
  Percent: number;
  Target_Qty: number;
}

interface DropdownOption {
  label: string;
  value: string;
}

// API Hook
const useGetDealerHitRateData = (branchName: string, YearQtr: string) => {
  const payload = {branchName, YearQtr};
  return useQuery({
    queryKey: ['DealerHitRateData', payload],
    queryFn: async () => {
      const res = await handleAPACApiCall(
        'TrgtVsAchvDetail/GetBranchwise_Partner_Sellin_Revenue',
        payload,
      );
      if (!res?.DashboardData?.Status) throw new Error('Failed to fetch data');
      const {Datainfo} = res.DashboardData;
      return Datainfo.Branchwise_AGP_Sellin_Revenue;
    },
    select: data => {
      return {
        dealerHitrateData: data as DealerHitRateData[],
        partnerType: formatUnique(data, 'Partner_Type'),
      };
    },
  });
};

// Dealer Card Component
const DealerCard = memo(
  ({
    dealer,
    handlePress,
  }: {
    dealer: DealerHitRateData;
    handlePress: (params: any) => void;
  }) => {
    const isOverAchieved = dealer.Percent >= 100;
    const progressColor = isOverAchieved
      ? AppColors.success
      : AppColors.utilColor2;
    const payload = {
      roleId: 6,
      empCode: dealer.Partner_Code,
      empType: dealer.Partner_Type,
      partnerName: dealer.Partner_Name,
    };
    return (
      <TouchableOpacity onPress={() => handlePress(payload)}>
        <Card className="mb-3">
          <View className="flex-row items-center justify-between">
            {/* Left Section - Dealer Info */}
            <View className="flex-1 mr-3">
              <View className="flex-row items-center mb-1">
                <AppIcon
                  name="account-circle"
                  size={16}
                  color={AppColors.utilColor2}
                  type="material-community"
                />
                <AppText
                  size="sm"
                  weight="bold"
                  className="ml-1 flex-1 text-gray-800 dark:text-gray-100"
                  numberOfLines={1}>
                  {dealer.Partner_Name}
                </AppText>
              </View>

              <View className="flex-row items-center mb-2">
                <AppIcon
                  name="tag"
                  size={12}
                  color={AppColors.utilColor4}
                  type="feather"
                />
                <AppText
                  size="xs"
                  weight="medium"
                  className="ml-1 text-gray-600 dark:text-gray-400">
                  {dealer.Partner_Code}
                </AppText>
                <View className="w-1 h-1 rounded-full bg-gray-400 mx-2" />
                <AppText
                  size="xs"
                  weight="medium"
                  className="text-gray-600 dark:text-gray-400">
                  {dealer.Partner_Type}
                </AppText>
              </View>

              {/* Stats Row */}
              <View className="flex-row items-center justify-between pr-2">
                <View>
                  <AppText
                    size="xs"
                    className="text-gray-500 dark:text-gray-400">
                    Target
                  </AppText>
                  <AppText
                    size="sm"
                    weight="semibold"
                    className="text-gray-800 dark:text-gray-100">
                    {convertToAPACUnits(dealer.Target_Qty)}
                  </AppText>
                </View>
                <View>
                  <AppText
                    size="xs"
                    className="text-gray-500 dark:text-gray-400">
                    Achieved
                  </AppText>
                  <AppText
                    size="sm"
                    weight="semibold"
                    className="text-gray-800 dark:text-gray-100">
                    {convertToAPACUnits(dealer.Achieved_Qty)}
                  </AppText>
                </View>
              </View>
            </View>

            {/* Right Section - Progress Circle */}
            <View className="items-center">
              <CircularProgressBar
                progress={dealer.Percent || 0}
                progressColor={progressColor}
                size={70}
                strokeWidth={6}
              />
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  },
);

// Summary Stats Component
const SummaryStats = memo(
  ({totalDealers, avgHitRate}: {totalDealers: number; avgHitRate: number}) => {
    return (
      <Card className="mb-4 border border-slate-200 dark:border-slate-700">
        <View className="flex-row justify-around">
          <AppText
            size="md"
            weight="bold"
            className="mb-2 text-gray-800 dark:text-gray-100 w-full">
            Summary Statistics
          </AppText>
        </View>
        <View className="flex-row justify-around items-center py-4 space-x-4">
          <View className="items-center">
            <AppIcon
              name="account-group"
              size={24}
              color={AppColors.utilColor2}
              type="material-community"
            />
            <AppText
              size="xl"
              weight="bold"
              className="mt-1 text-gray-800 dark:text-gray-100">
              {totalDealers}
            </AppText>
            <AppText size="xs" className="text-gray-500 dark:text-gray-400">
              Total Dealers
            </AppText>
          </View>

          <View className="w-px h-full bg-gray-200 dark:bg-gray-700" />

          <View className="items-center">
            <AppIcon
              name="trending-up"
              size={24}
              color={avgHitRate >= 100 ? AppColors.success : AppColors.warning}
              type="feather"
            />
            <AppText
              size="xl"
              weight="bold"
              className="mt-1 text-gray-800 dark:text-gray-100">
              {avgHitRate.toFixed(1)}%
            </AppText>
            <AppText size="xs" className="text-gray-500 dark:text-gray-400">
              Avg Hit Rate
            </AppText>
          </View>
        </View>
      </Card>
    );
  },
);

// Loading Skeleton
const LoadingSkeleton = memo(() => (
  <View>
    <Skeleton width={screenWidth - 32} height={60} />
    {[1, 2, 3, 4, 5].map(i => (
      <Skeleton key={i} width={screenWidth - 32} height={140} />
    ))}
  </View>
));

export default function DealerHitRate() {
  const {params} = useRoute();
  const {BranchName} = params as {BranchName: string};
  const {quarters, selectedQuarter, setSelectedQuarter} = useQuarterHook();
  const navigation = useNavigation<AppNavigationProp>();

  const [selectedPartnerType, setSelectedPartnerType] =
    useState<AppDropdownItem | null>(null);

  const {data, isLoading, isError, refetch} = useGetDealerHitRateData(
    BranchName,
    selectedQuarter?.value || '',
  );

  const handlePress = (payload: any) => {navigation.push('TargetPartnerDashboard', {partner: payload})}

  // Filter and search logic
  const {filteredData, summary} = useMemo(() => {
    if (!data?.dealerHitrateData) {
      return {filteredData: [], summary: {totalDealers: 0, avgHitRate: 0}};
    }

    let filtered = data.dealerHitrateData;

    // Apply partner type filter
    if (selectedPartnerType?.value) {
      filtered = filtered.filter(
        d => d.Partner_Type === selectedPartnerType?.value,
      );
    }

    // Calculate summary
    const totalDealers = filtered.length;
    const avgHitRate =
      totalDealers > 0
        ? filtered.reduce((sum, d) => sum + (d.Percent || 0), 0) / totalDealers
        : 0;

    // Sort by percentage (descending)
    filtered = [...filtered].sort(
      (a, b) => (b.Percent || 0) - (a.Percent || 0),
    );

    return {
      filteredData: filtered,
      summary: {totalDealers, avgHitRate},
    };
  }, [data?.dealerHitrateData, selectedPartnerType]);

  const partnerTypes: DropdownOption[] = data?.partnerType || [];
  const renderDealerCard = ({item}: {item: DealerHitRateData}) => (
    <DealerCard dealer={item} handlePress={handlePress} />
  );
  return (
    <AppLayout title="Dealer Hit Rate" needBack needPadding>
      <View className="w-full my-4 flex-row justify-between items-center">
        {isLoading ? (
          <Skeleton
            width={screenWidth * 0.65 - 14}
            height={45}
            borderRadius={8}
          />
        ) : (
          <AppDropdown
            mode="dropdown"
            data={partnerTypes}
            selectedValue={selectedPartnerType?.value}
            onSelect={setSelectedPartnerType}
            placeholder="Select Partner Type"
            style={{width: '65%'}}
          />
        )}
        <View className="w-[30%]">
          <AppDropdown
            mode="dropdown"
            data={quarters}
            selectedValue={selectedQuarter?.value}
            onSelect={setSelectedQuarter}
            placeholder="Select Quarter"
          />
        </View>
      </View>

      <DataStateView
        isLoading={isLoading}
        isError={isError}
        isEmpty={!data?.dealerHitrateData.length && !isLoading}
        onRetry={refetch}
        LoadingComponent={<LoadingSkeleton />}>
        {/* Summary Stats */}
        {filteredData.length > 0 && (
          <SummaryStats
            totalDealers={summary.totalDealers}
            avgHitRate={summary.avgHitRate}
          />
        )}
        <FlatList
          data={filteredData}
          keyExtractor={item => item.Partner_Code}
          renderItem={renderDealerCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{paddingBottom: 20}}
        />
      </DataStateView>
    </AppLayout>
  );
}
