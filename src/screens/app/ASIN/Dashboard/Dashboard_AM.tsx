import {RefreshControl, ScrollView, TouchableOpacity, View} from 'react-native';
import React, {memo, useCallback, useMemo, useState} from 'react';
import MaterialTabBar from '../../../../components/MaterialTabBar';
import {AppColors} from '../../../../config/theme';
import {
  BannerComponentProps,
  HeaderProps,
  ProductCategoryData,
  SalesHeaderData,
  TargetVsAchievementProps,
} from '../../../../types/dashboard';
import Card from '../../../../components/Card';
import AppIcon from '../../../../components/customs/AppIcon';
import AppText from '../../../../components/customs/AppText';
import {CircularProgressBar} from '../../../../components/customs/AppChart';
import {
  convertToASINUnits,
  convertToTitleCase,
  getPastQuarters,
} from '../../../../utils/commonFunctios';
import {
  DashboardBannerSkeleton,
  DashboardSalesData,
  DashboardSkeleton,
  TargetVsAchievementSkeleton,
} from '../../../../components/skeleton/DashboardSkeleton';
import {
  useDashboardBanner,
  useDashboardDataAM,
} from '../../../../hooks/queries/dashboard';
import ImageSlider, {SwiperItem} from '../../../../components/ImageSlider';
import {
  calculatePercentage,
  ErrorDisplay,
  formatDisplayValue,
  getPerformanceColor,
} from './dashboardUtils';
import {DASHBOARD, screenWidth} from '../../../../utils/constant';
import AppDropdown, {
  AppDropdownItem,
} from '../../../../components/customs/AppDropdown';
import {MaterialTopTabScreenProps} from '@react-navigation/material-top-tabs';

const STATIC_DASHBOARD_TABS = [
  {name: 'Total', component: null, label: 'TOTAL'},
  {name: 'CHANNEL', component: null, label: 'CHANNEL'},
  {name: 'LFR', component: null, label: 'LFR'},
];

/**
 * Dashboard Header Component - Shows sales data and quarter selection
 */
const DashboardHeader: React.FC<HeaderProps> = ({
  selectedQuarter,
  setSelectedQuarter,
  quarters,
  salesData,
  tabName,
  isLoading,
  error,
  onRetry,
}) => {
  const percentage =
    salesData && salesData.Qty_Target
      ? calculatePercentage(salesData.Qty_Achieved, salesData.Qty_Target)
      : 0;

  const {bgColor, textColor} = getPerformanceColor(percentage);

  const displayTitle = tabName
    ? `${DASHBOARD.TABS.LFR === tabName ? tabName : convertToTitleCase(tabName)} Sales`
    : 'N/A Sales';

  if (error) {
    return (
      <View className="px-3 py-4 border-b border-gray-300">
        <ErrorDisplay
          title="Failed to Load Sales Data"
          message="Unable to retrieve sales information"
          onRetry={onRetry}
          showRetry={!!onRetry}
        />
      </View>
    );
  }

  return (
    <View className="flex-row justify-between px-3 py-4 border-b border-gray-300">
      {isLoading ? (
        <DashboardSalesData />
      ) : (
        <View>
          <AppText size="lg" weight="bold" color="text" className="capitalize">
            {displayTitle}
          </AppText>
          <View className="flex-row items-center">
            <AppText size="lg" weight="bold" color="primary" className="mr-1">
              {formatDisplayValue(salesData?.Qty_Achieved)}
            </AppText>
            <AppText size="sm" color="gray" className="mr-2">
              / {formatDisplayValue(salesData?.Qty_Target)}
            </AppText>
            <View className={`px-2 py-1 rounded-full ${bgColor}`}>
              <AppText size="xs" weight="semibold" color={textColor}>
                {percentage}%
              </AppText>
            </View>
          </View>
        </View>
      )}
      <View className="w-36">
        <AppDropdown
          data={quarters}
          selectedValue={selectedQuarter?.value || null}
          onSelect={setSelectedQuarter}
          mode="dropdown"
          placeholder="Select Quarter"
          style={{height: 36}}
        />
      </View>
    </View>
  );
};
/**
 * Banner Component - Shows promotional banners with error handling
 */
const BannerComponent: React.FC<BannerComponentProps> = ({error, onRetry}) => {
  const {data: banners, isLoading, error: queryError} = useDashboardBanner();

  const actualError = error || queryError;

  const handleBannerPress = useCallback((item: SwiperItem) => {
    console.log('Banner pressed:', item);
  }, []);

  if (actualError) {
    return (
      <View className="w-full items-center pt-4">
        <ErrorDisplay
          title="Failed to Load Banners"
          message="Unable to retrieve banner information"
          onRetry={onRetry}
          showRetry={!!onRetry}
        />
      </View>
    );
  }

  return (
    <View className="w-full items-center pt-4">
      {isLoading ? (
        <DashboardBannerSkeleton />
      ) : (
        <ImageSlider
          data={banners || []}
          width={screenWidth - 20}
          height={200}
          onPress={handleBannerPress}
          show={true}
          autoplay={true}
          autoplayTimeout={4}
          dotColor="#E5E7EB"
          activeDotColor="#3B82F6"
          resizeMode="cover"
        />
      )}
    </View>
  );
};
/**
 * Target vs Achievement Component - Shows POD wise and Sell Through performance
 */
const TargetVsAchievementComponent: React.FC<Omit<TargetVsAchievementProps, 'data'> & {data: ProductCategoryData[]}> = ({data, isLoading, error, onRetry}) => {
  const getProductConfig = useCallback(
    (category: string, index: number): {icon: string; color: string} => {
      const configs: Record<string, {icon: string; color: string}> = {
        NB: {icon: 'laptop', color: AppColors.utilColor1}, // Notebook/Laptop
        NR: {icon: 'monitor', color: AppColors.utilColor2}, // Network Router or Desktop Monitor
        AIO: {icon: 'monitor-speaker', color: AppColors.utilColor3}, // All-in-One PC
        DT: {icon: 'desktop-tower-monitor', color: AppColors.utilColor4}, // Desktop
        GDT: {icon: 'desktop-tower', color: AppColors.utilColor5}, // Gaming Desktop
        Creator: {icon: 'account-group', color: AppColors.utilColor6}, // Creator Laptops/Workstations
        ACCY: {icon: 'package-variant', color: AppColors.utilColor7}, // Accessories
        WEP: {icon: 'wifi', color: AppColors.utilColor8}, // Wireless/Network Equipment
      };
      return (
        configs[category] || {icon: 'package', color: AppColors.utilColor1}
      );
    },
    [],
  );

  const handleDistributorWisePress = useCallback(() => {
    console.log('Distributor Wise pressed');
  }, []);

  const handleSeeMorePress = useCallback(() => {
    console.log('See More pressed');
  }, []);

  const renderProductCard = useCallback(
    (item: ProductCategoryData, index: number, animationDelay: number = 0) => {
      const config = getProductConfig(item.Product_Category, index);

      return (
        <Card
          className="w-36 p-4 rounded-md"
          watermark
          key={`${item.Product_Category}-${index}`}>
          <View className="items-center">
            <View className="flex-row items-center gap-2 mb-3">
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
              duration={1000 + animationDelay}
            />

            <View className="mt-3 w-full flex-row items-center justify-between ">
              <View className="flex-1 items-start">
                <AppText size="xs" className="text-gray-400 ">
                  Achieved
                </AppText>
                <AppText size="sm" weight="semibold">
                  {convertToASINUnits(item.Achieved_Qty)}
                </AppText>
              </View>
            </View>
          </View>
        </Card>
      );
    },
    [getProductConfig],
  );

  const renderActionButtons = useCallback(
    () => (
      <View className="flex-row w-full justify-between px-3 mt-4">
        <TouchableOpacity
          className="py-1 flex-row items-center border-b border-blue-600"
          activeOpacity={0.7}
          onPress={handleDistributorWisePress}>
          <AppIcon name="users" type="feather" color="#2563eb" size={16} />
          <AppText size="sm" weight="medium" className="text-blue-600 ml-2">
            Distributor Wise
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity
          className="py-1 flex-row items-center border-b border-blue-600"
          activeOpacity={0.7}
          onPress={handleSeeMorePress}>
          <AppText size="sm" weight="medium" className="text-blue-600 mr-2">
            See More
          </AppText>
          <AppIcon
            name="arrow-right"
            type="feather"
            color="#2563eb"
            size={16}
          />
        </TouchableOpacity>
      </View>
    ),
    [handleDistributorWisePress, handleSeeMorePress],
  );

  if (error) 
    <View className="px-3">
      <ErrorDisplay
        title="Failed to Load Performance Data"
        message="Unable to retrieve target vs achievement information"
        onRetry={onRetry}
        showRetry={!!onRetry}
      />
    </View>;

  if (isLoading) return <TargetVsAchievementSkeleton />;

  return (
    <View className="">
      <AppText size="xl" color="gray" weight="bold" className="pl-3">
        Achievement
      </AppText>
      {/* POD Wise Section */}
      <View className="mt-3">
        <ScrollView
          horizontal
          contentContainerClassName="gap-3 py-2 px-3"
          className="mt-4"
          showsHorizontalScrollIndicator={false}>
          {data.map((item, index) =>
            renderProductCard(item, index, index * 100),
          )}
        </ScrollView>
        {renderActionButtons()}
      </View>
    </View>
  );
};

const DashboardContainer = memo(({route}: MaterialTopTabScreenProps<any>) => {
  const quarters = useMemo(() => getPastQuarters(), []);
  const [selectedQuarter, setSelectedQuarter] =
    useState<AppDropdownItem | null>(() => {
      const reversedQuarters = [...quarters].reverse();
      return reversedQuarters[0] || null;
    });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    data: dashboardData,
    isLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useDashboardDataAM(selectedQuarter?.value || '', route.name);

  // Process sales data
  const salesData: SalesHeaderData | undefined = useMemo(() => {
    const masterTabItem = dashboardData?.MasterTab?.find(
      (item: any) => item.Type === route.name,
    );
    return masterTabItem
      ? {
          Qty_Achieved: masterTabItem.Qty_Achieved || '0',
          Qty_Target: masterTabItem.Qty_Target || '0',
        }
      : undefined;
  }, [dashboardData?.MasterTab, route.name]);

  const handleRetry = useCallback(() => {
    refetchDashboard();
  }, [refetchDashboard]);

  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetchDashboard();
    } catch (error) {
      console.warn('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchDashboard]);
  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView
        contentContainerClassName="flex-grow pb-10 gap-5"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#3B82F6']} // Android
            tintColor="#3B82F6" // iOS
            title="Pull to refresh"
            titleColor="#6B7280"
          />
        }>
        <DashboardHeader
          selectedQuarter={selectedQuarter}
          setSelectedQuarter={setSelectedQuarter}
          quarters={quarters}
          salesData={salesData}
          tabName={route.name}
          isLoading={isLoading}
          error={dashboardError}
          onRetry={handleRetry}
        />

        <BannerComponent error={dashboardError} onRetry={handleRetry} />

        <TargetVsAchievementComponent
          data={dashboardData?.TRGTSummary}
          isLoading={isLoading}
          error={dashboardError}
          onRetry={handleRetry}
        />
      </ScrollView>
    </View>
  );
});

const Dashboard_AM = () => {
  const quarters = useMemo(() => getPastQuarters(), []);
  const {
    data: dashboardData,
    isLoading: isTabsLoading,
    error: tabsError,
  } = useDashboardDataAM([...quarters].reverse()[0].value || '', 'Total');

  const dashboardTabs = useMemo(() => {
    if (dashboardData?.MasterTab && Array.isArray(dashboardData.MasterTab)) {
      // Filter out any invalid tabs and create dynamic tabs
      const validTabs = dashboardData.MasterTab.filter(
        (tab: any) => tab?.Type && typeof tab.Type === 'string',
      ).map((tab: any) => ({
        name: tab.Type,
        component: DashboardContainer,
        label: tab.Type,
      }));

      // Return dynamic tabs if we have valid ones, otherwise fallback
      if (validTabs.length > 0) {
        return validTabs;
      }
    }

    // Fallback to static tabs if API data is not available or invalid
    return STATIC_DASHBOARD_TABS.map(tab => ({
      ...tab,
      component: DashboardContainer,
    }));
  }, [dashboardData?.MasterTab]);

  if (isTabsLoading) return <DashboardSkeleton />;

  // Show error state if tabs failed to load
  if (tabsError) {
    return (
      <View className="flex-1 bg-slate-50">
        <ErrorDisplay
          title="Failed to Load Dashboard"
          message="Unable to retrieve dashboard configuration"
          showRetry={false}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <MaterialTabBar
        tabs={dashboardTabs}
        initialRouteName="Total"
        tabPadding={10}
      />
    </View>
  );
};

export default Dashboard_AM;
