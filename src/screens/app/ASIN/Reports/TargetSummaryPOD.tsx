import {View, FlatList, TouchableOpacity, ScrollView} from 'react-native';
import {useMemo, useState, useCallback} from 'react';
import AppLayout from '../../../../components/layout/AppLayout';
import AppDropdown, {
  AppDropdownItem,
} from '../../../../components/customs/AppDropdown';
import AppText from '../../../../components/customs/AppText';
import AppIcon from '../../../../components/customs/AppIcon';
import Card from '../../../../components/Card';
import Accordion from '../../../../components/Accordion';
import {CircularProgressBar} from '../../../../components/customs/AppChart';
import {
  getPastQuarters,
  convertToASINUnits,
} from '../../../../utils/commonFunctions';
import {AppColors} from '../../../../config/theme';
import {useQuery} from '@tanstack/react-query';
import {handleASINApiCall} from '../../../../utils/handleApiCall';
import {useLoginStore} from '../../../../stores/useLoginStore';
import {useRoute} from '@react-navigation/native';
import {ProductCategoryData} from '../../../../types/dashboard';
import {screenWidth} from '../../../../utils/constant';
import Skeleton from '../../../../components/skeleton/skeleton';

// Type definitions for better type safety
type ProductItem = {
  Sequence_No: number;
  Loc_Branch: string;
  Territory?: string;
  Product_Category: string;
  Achieved_Qty: number;
  Target_Qty: number;
  Percent: number;
};

type GroupedData = {
  branchName: string;
  territoryName?: string;
  products: ProductItem[];
  totalAchieved: number;
  totalTarget: number;
};

type ViewMode = 'branch' | 'territory';

const useGetTrgtVsAchvDetail = (
  YearQtr: string,
  masterTab: string,
  tab: 'seemore' | 'disti',
) => {
  const {EMP_Code: employeeCode = '', EMP_RoleId: RoleId = ''} = useLoginStore(
    state => state.userInfo,
  );
  const payload = {
    employeeCode,
    RoleId,
    YearQtr,
    masterTab,
  };
  const apiEndpoint =
    tab === 'disti'
      ? '/TrgtVsAchvDetail/GetTrgtVsAchvDetail_PODWise_Disti'
      : '/TrgtVsAchvDetail/GetTrgtVsAchvDetail_PODWise';
  return useQuery({
    queryKey: ['getTrgtVsAchvDetail', ...Object.values(payload)],
    queryFn: async () => {
      const response = await handleASINApiCall(apiEndpoint, payload);
      const result = response?.DashboardData;
      if (!result?.Status) {
        throw new Error('Failed to fetch activation data');
      }
      return result.Datainfo?.ProductCategory || [];
    },
  });
};

const useGetTrgtVsAchvDetailTT = (
  YearQtr: string,
  masterTab: string,
  BranchName: string,
  enabled: boolean,
) => {
  const {EMP_Code: employeeCode = '', EMP_RoleId: RoleId = ''} = useLoginStore(
    state => state.userInfo,
  );
  const payload = {
    employeeCode,
    RoleId,
    YearQtr,
    masterTab,
    BranchName,
  };
  return useQuery({
    queryKey: ['getTrgtVsAchvDetailTT', ...Object.values(payload)],
    queryFn: async () => {
      const response = await handleASINApiCall(
        '/TrgtVsAchvDetail/GetTrgtVsAchvTerritorywiseSellin',
        payload,
      );
      const result = response?.DashboardData;
      if (!result?.Status) {
        throw new Error('Failed to fetch activation data');
      }
      return result.Datainfo?.ProductCategory || [];
    },
    enabled: enabled && !!BranchName, // Only fetch when enabled and BranchName exists
  });
};

export default function TargetSummaryPOD() {
  const {params} = useRoute();
  const {Quarter, masterTab, tab} = params as {
    Quarter: string;
    masterTab: string;
    tab: 'seemore' | 'disti';
  };
  const quarter = useMemo(() => getPastQuarters(), []);
  const foundQuarter = quarter.find(q => q.value === Quarter);
  const [selectedQuarter, setSelectedQuarter] =
    useState<AppDropdownItem | null>(foundQuarter || null);
  const [viewMode, setViewMode] = useState<ViewMode>('branch');
  const [selectedBranch, setSelectedBranch] = useState<string>('');

  // Only fetch branch data
  const {data: branchData, isLoading: isBranchLoading} = useGetTrgtVsAchvDetail(
    selectedQuarter?.value || '',
    masterTab,
    tab,
  );

  // Only fetch territory data when in territory mode and branch is selected
  const {data: territoryData, isLoading: isTerritoryLoading} =
    useGetTrgtVsAchvDetailTT(
      selectedQuarter?.value || '',
      masterTab,
      selectedBranch,
      viewMode === 'territory', // Only fetch when in territory mode
    );

  // Determine current data and loading state
  const demoData = viewMode === 'branch' ? branchData : territoryData;
  const isLoading =
    viewMode === 'branch' ? isBranchLoading : isTerritoryLoading;

  // Handle view territory press
  const handleViewTerritory = useCallback((branchName: string) => {
    setSelectedBranch(branchName);
    setViewMode('territory');
  }, []);

  // Handle back to branch view - optimized with instant state update
  const handleBackToBranch = useCallback(() => {
    // Update view mode first for instant UI feedback
    setViewMode('branch');
    // Clear selected branch after a minimal delay to prevent query cancellation issues
    setTimeout(() => setSelectedBranch(''), 0);
  }, []);

  // Group data by Loc_Branch or Territory based on view mode
  const groupedData = useMemo<GroupedData[]>(() => {
    if (!demoData) return [];

    const groups = demoData.reduce(
      (acc: Record<string, GroupedData>, item: ProductItem) => {
        const key =
          viewMode === 'branch' ? item.Loc_Branch : item.Territory || '';
        if (!key) return acc;

        if (!acc[key]) {
          acc[key] = {
            branchName: viewMode === 'branch' ? key : item.Loc_Branch,
            territoryName: viewMode === 'territory' ? key : undefined,
            products: [],
            totalAchieved: 0,
            totalTarget: 0,
          };
        }

        acc[key].products.push(item);

        // Exclude specific categories from totals
        if (
          item.Product_Category !== 'ACCY' &&
          item.Product_Category !== 'WEP' &&
          item.Product_Category !== 'OLED'
        ) {
          acc[key].totalAchieved += item.Achieved_Qty;
          acc[key].totalTarget += item.Target_Qty;
        }

        return acc;
      },
      {} as Record<string, GroupedData>,
    );

    return Object.values(groups);
  }, [demoData, viewMode]);

  // Get product icon and color config based on category
  const getProductConfig = useCallback(
    (category: string): {icon: string; color: string} => {
      const configs: Record<string, {icon: string; color: string}> = {
        NB: {icon: 'laptop', color: AppColors.utilColor1},
        NR: {icon: 'monitor', color: AppColors.utilColor2},
        AIO: {icon: 'monitor-speaker', color: AppColors.utilColor3},
        DT: {icon: 'desktop-tower-monitor', color: AppColors.utilColor4},
        GDT: {icon: 'desktop-tower', color: AppColors.utilColor5},
        NX: {icon: 'cube-outline', color: AppColors.utilColor6},
        LM: {icon: 'book-open-variant', color: AppColors.utilColor7},
        WEP: {icon: 'wifi', color: AppColors.utilColor8},
        ACCY: {icon: 'package-variant', color: AppColors.utilColor9},
      };
      return (
        configs[category] || {icon: 'package', color: AppColors.utilColor1}
      );
    },
    [],
  );

  const renderProductCard = useCallback(
    (item: ProductCategoryData, index: number) => {
      const config = getProductConfig(item.Product_Category);
      return (
        <TouchableOpacity disabled key={index} activeOpacity={0.7}>
          <Card
            className="min-w-40 rounded-md"
            watermark
            key={`${item.Product_Category}-${index}`}>
            <View className="items-center">
              <View className="flex-row items-center gap-2 mb-1">
                <AppIcon
                  name={config.icon}
                  size={18}
                  color={config.color}
                  type="material-community"
                />
                <AppText size="base" weight="bold" color="text">
                  {item.Product_Category}
                </AppText>
              </View>
              <CircularProgressBar
                progress={item.Percent || 0}
                progressColor={config.color}
                size={70}
                strokeWidth={6}
              />
              <View className="mt-3 flex-row items-center justify-between ">
                <View className="flex-1 items-start">
                  <AppText size="sm" className="text-gray-400 ">
                    Target
                  </AppText>
                  <AppText size="sm" weight="semibold">
                    {convertToASINUnits(item.Target_Qty, true)}
                  </AppText>
                </View>
                <View className="flex-1 items-end">
                  <AppText size="xs" className="text-gray-400 ">
                    Achieved
                  </AppText>
                  <AppText size="sm" weight="semibold">
                    {convertToASINUnits(item.Achieved_Qty, true)}
                  </AppText>
                </View>
              </View>
            </View>
          </Card>
        </TouchableOpacity>
      );
    },
    [getProductConfig],
  );

  // Render each branch/territory group as an accordion section
  const renderItem = useCallback(
    ({item}: {item: GroupedData}) => {
      const achievementPercent =
        item.totalTarget > 0
          ? Math.round((item.totalAchieved / item.totalTarget) * 100)
          : 0;
      const isOverAchieved = achievementPercent >= 100;
      const displayName = item.territoryName || item.branchName;
      const iconName =
        viewMode === 'branch' ? 'office-building' : 'map-marker-radius';

      // Custom accordion header
      const accordionHeader = (
        <View className="flex-row items-center justify-between flex-1 pt-4 pb-2">
          <View className="flex-1">
            {/* Name with Icon */}
            <View className="flex-row items-center gap-3 mb-3">
              <View className="rounded-lg p-2.5 bg-primary/10">
                <AppIcon
                  name={iconName}
                  size={22}
                  color={AppColors.primary}
                  type="material-community"
                />
              </View>
              <View className="flex-1">
                <AppText
                  size="base"
                  weight="bold"
                  color="text"
                  numberOfLines={1}>
                  {displayName}
                </AppText>
                <AppText size="xs" className="text-gray-500 mt-0.5">
                  {item.products.length} Products
                </AppText>
              </View>
              {/* Achievement Badge */}
              <View
                className={`px-3 py-1.5 rounded-full ${isOverAchieved ? 'bg-green-50' : 'bg-blue-50'}`}>
                <AppText
                  size="xs"
                  weight="bold"
                  className={
                    isOverAchieved ? 'text-green-600' : 'text-blue-600'
                  }>
                  {achievementPercent}%
                </AppText>
              </View>
            </View>

            {/* Summary Stats */}
            <View className="flex-row items-center gap-8 mb-2">
              <View className="flex-1">
                <AppText size="xs" className="text-gray-400 mb-1">
                  Target
                </AppText>
                <AppText size="base" weight="bold" color="text">
                  {convertToASINUnits(item.totalTarget, true)}
                </AppText>
              </View>
              <View className="flex-1">
                <AppText size="xs" className="text-gray-400 mb-1">
                  Achieved
                </AppText>
                <AppText size="base" weight="bold" className="text-green-600">
                  {convertToASINUnits(item.totalAchieved, true)}
                </AppText>
              </View>
            </View>

            {/* Overall Progress Bar */}
            <View className="mt-2">
              <View className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <View
                  className={`h-full rounded-full ${isOverAchieved ? 'bg-green-500' : 'bg-blue-500'}`}
                  style={{
                    width: `${Math.min(achievementPercent, 100)}%`,
                  }}
                />
              </View>
            </View>
          </View>
        </View>
      );

      return (
        <View className="mb-3">
          <Accordion
            header={accordionHeader}
            needBottomBorder={false}
            containerClassName="bg-white overflow-hidden rounded-md border border-gray-200">
            {/* Horizontal ScrollView for Product Cards */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                gap: 14,
                paddingTop: 14,
                paddingBottom: 16,
                paddingHorizontal: 14,
              }}>
              {item.products.map((product, index) =>
                renderProductCard(product, index),
              )}
            </ScrollView>

            {/* View Territory Button - Only show in branch view and seemore tab */}
            {tab === 'seemore' && viewMode === 'branch' && (
              <TouchableOpacity
                className="self-end mb-4 mr-4"
                onPress={() => handleViewTerritory(item.branchName)}>
                <View className="flex-row items-center gap-1">
                  <AppText className="underline" color="primary" weight="bold">
                    View Territory Performance
                  </AppText>
                  <AppIcon
                    name="chevron-right"
                    size={16}
                    color={AppColors.primary}
                    type="material-community"
                  />
                </View>
              </TouchableOpacity>
            )}
          </Accordion>
        </View>
      );
    },
    [renderProductCard, viewMode, tab, handleViewTerritory],
  );

  const keyExtractor = useCallback(
    (item: GroupedData) =>
      `${viewMode}-${item.territoryName || item.branchName}`,
    [viewMode],
  );

  const renderHeaderComponent = useCallback(
    () => (
      <View className="mb-4">
        {/* Back to Branch Button - Show in territory view */}
        {viewMode === 'territory' && (
          <TouchableOpacity
            onPress={handleBackToBranch}
            className="flex-row items-center gap-2 mb-3 self-start">
            <AppIcon
              name="arrow-left"
              size={20}
              color={AppColors.primary}
              type="material-community"
            />
            <AppText color="primary" weight="semibold">
              Back to Branches
            </AppText>
          </TouchableOpacity>
        )}

        <AppText size="lg" weight="bold" color="text" className="mb-1">
          {viewMode === 'branch'
            ? 'Distributor Performance Summary'
            : `Territory Performance - ${selectedBranch}`}
        </AppText>
        <AppText size="sm" className="text-gray-500">
          {groupedData.length}{' '}
          {viewMode === 'branch' ? 'Distributors' : 'Territories'} •{' '}
          {selectedQuarter?.label || 'All Time'}
        </AppText>
      </View>
    ),
    [
      groupedData.length,
      selectedQuarter,
      viewMode,
      selectedBranch,
      handleBackToBranch,
    ],
  );

  const renderLoadingSkeleton = useCallback(
    () => (
      <View>
        {/* Header Skeleton */}
        <View className="mb-4 self-end">
          <Skeleton width={120} height={30} borderRadius={6} />
        </View>
        <View className="mb-3">
          <Skeleton width={200} height={30} borderRadius={6} />
          <Skeleton width={100} height={20} borderRadius={6} />
        </View>
        {Array.from({length: 3}).map((_, index) => (
          <Skeleton
            key={index}
            width={screenWidth - 24}
            height={100}
            borderRadius={12}
          />
        ))}
      </View>
    ),
    [],
  );

  return (
    <AppLayout title="Target / Achievement" needBack needPadding>
      <View className="w-36 self-end mt-2 mb-4">
        <AppDropdown
          mode="dropdown"
          data={quarter}
          selectedValue={selectedQuarter?.value}
          onSelect={setSelectedQuarter}
        />
      </View>

      <FlatList
        data={groupedData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        extraData={viewMode}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom: 20}}
        maxToRenderPerBatch={16}
        windowSize={10}
        initialNumToRender={10}
        ListHeaderComponent={!isLoading ? renderHeaderComponent : null}
        ListEmptyComponent={
          isLoading ? (
            renderLoadingSkeleton()
          ) : (
            <View className="items-center justify-center mt-32">
              <View className="rounded-full p-4 bg-gray-100 mb-4">
                <AppIcon
                  name="database-off"
                  size={40}
                  color="#9CA3AF"
                  type="material-community"
                />
              </View>
              <AppText
                size="base"
                weight="semibold"
                className="text-gray-600 mb-2">
                No Data Available
              </AppText>
              <AppText size="sm" className="text-gray-400 text-center px-8">
                There's no performance data for the selected quarter.
              </AppText>
            </View>
          )
        }
      />
    </AppLayout>
  );
}
