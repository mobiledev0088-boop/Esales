import {
  Linking,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import useQuarterHook from '../../../../../hooks/useQuarterHook';
import {memo, use, useCallback, useEffect, useMemo, useState} from 'react';
import {LogCacheAPI} from '../../../../../utils/handleApiCall';
import {
  useDashboardBannerAPAC,
  useDashboardDataAPAC,
} from '../../../../../hooks/queries/dashboard';
import {
  DashboardSalesData,
  DashboardSkeleton,
  TargetVsAchievementSkeleton,
} from '../../../../../components/skeleton/DashboardSkeleton';
import {ErrorDisplay} from '../../../ASIN/Dashboard/components';
import MaterialTabBar from '../../../../../components/MaterialTabBar';
import {useNavigation} from '@react-navigation/native';
import {AppNavigationProp} from '../../../../../types/navigation';
import {MaterialTopTabScreenProps} from '@react-navigation/material-top-tabs';
import {useLoginStore} from '../../../../../stores/useLoginStore';
import {
  HeaderProps,
  ProductCategoryData,
  SalesHeaderData,
} from '../../../../../types/dashboard';
import {useThemeStore} from '../../../../../stores/useThemeStore';
import {
  calculatePercentage,
  formatDisplayValue,
  getPerformanceColor,
} from '../../../ASIN/Dashboard/dashboardUtils';
import {
  convertToAPACUnits,
  convertToTitleCase,
  getProductConfig,
  showToast,
} from '../../../../../utils/commonFunctions';
import {ASUS, DASHBOARD, screenWidth} from '../../../../../utils/constant';
import AppText from '../../../../../components/customs/AppText';
import AppDropdown from '../../../../../components/customs/AppDropdown';
import ImageSlider from '../../../../../components/ImageSlider';
import Card from '../../../../../components/Card';
import AppIcon from '../../../../../components/customs/AppIcon';
import clsx from 'clsx';

interface TargetVsAchievementData {
  PODQty: ProductCategoryData[];
  PODRevenue: ProductCategoryData[];
  AGPSellIn: ProductCategoryData[];
  AGPSellOut: ProductCategoryData[];
}
interface TargetVsAchievementProps {
  data: TargetVsAchievementData;
  isLoading: boolean;
  error?: Error | null;
  onRetry?: () => void;
  tabName: string;
  quarter: string;
}

interface RetailerPerformanceProps {
    data: {
        PartnerType: string;
    }[];
    isLoading: boolean;
    error?: Error | null;
    onRetry?: () => void;
    tabName: string;
    quarter: string;
}

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
  const AppTheme = useThemeStore(state => state.AppTheme);
  const percentage =
    salesData && salesData.Qty_Target
      ? calculatePercentage(salesData.Qty_Achieved, salesData.Qty_Target)
      : 0;

  const {bgColor, textColor} = getPerformanceColor(
    percentage,
    AppTheme === 'dark',
  );

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
            <AppText size="lg" weight="bold" className="mr-1 text-[#007BE5]">
              {formatDisplayValue(salesData?.Qty_Achieved)}
            </AppText>
            <AppText size="sm" color="gray" className="mr-2">
              / {formatDisplayValue(salesData?.Qty_Target)}
            </AppText>
            {/* Green Base 0EA473.  Red BAse  EF4444.  */}
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

const BannerComponent = () => {
  const {data: banners} = useDashboardBannerAPAC();
  const navigation = useNavigation<AppNavigationProp>();

  const handleBannerPress = useCallback(
    (item: any) => {
      if (item.BannerURL_Link?.includes('Summary')) {
        //  Move To Scheme Summary Screen
      } else if (!item?.BannerURL_Link?.endsWith('pdf')) {
        console.log('Opening link:', item?.BannerURL_Link);
        if (!/^https?:\/\//i.test(item?.BannerURL_Link)) {
          showToast('Invalid link');
          return;
        }
        Linking.canOpenURL(item?.BannerURL_Link)
          .then(() => Linking.openURL(item?.BannerURL_Link))
          .catch(() => {
            showToast('Unable to open the link');
          });
      } else {
        navigation.push('Banners', {
          Banner_Group_SeqNum: item.Group_Sequence_No,
        });
      }
    },
    [navigation],
  );

  if (!banners || banners.length === 0) return null;

  return (
    <View className="w-full items-center pt-4">
      <ImageSlider
        data={banners || []}
        width={screenWidth - 20}
        height={200}
        onPress={item => handleBannerPress(item)}
        show={true}
        autoplay={true}
        autoplayTimeout={4}
        dotColor="#E5E7EB"
        activeDotColor={true ? '#007BE5' : '#3B82F6'}
        resizeMode="cover"
      />
    </View>
  );
};

const TargetVsAchievementComponent: React.FC<TargetVsAchievementProps> = ({
  data,
  isLoading,
  error,
  onRetry,
  tabName,
  quarter,
}) => {
  const userInfo = useLoginStore(state => state.userInfo);
  const navigation = useNavigation<AppNavigationProp>();
  const AppTheme = useThemeStore(state => state.AppTheme);
  const darkMode = AppTheme === 'dark';
  const {DIR_HOD_MAN, HO_EMPLOYEES, BSM, COUNTRY_HEAD, SA, RSM} = ASUS.ROLE_ID;
  const isEmpty =
    !data ||
    (data.PODQty.length === 0 &&
      data.PODRevenue.length === 0 &&
      data.AGPSellIn.length === 0 &&
      data.AGPSellOut.length === 0);

  const handleDistributorWisePress = useCallback(
    (buttonType: 'POD_Qty' | 'AGP_SellIn') => {
      navigation.push('TargetSummaryAPAC', {
        masterTab: tabName,
        YearQtr: quarter,
        buttonType: buttonType,
        navigationFrom: 'disti',
      });
    },
    [],
  );

  const handleSeeMorePress = useCallback(
    (buttonType: 'AGP_SellIn' | 'AGP_SellOut') => {
      navigation.push('TargetSummaryAPAC', {
        masterTab: tabName,
        YearQtr: quarter,
        buttonType: buttonType,
        navigationFrom: 'seemore',
      });
    },
    [],
  );

  const renderProductCard = useCallback(
    (
      item: ProductCategoryData,
      index: number,
      onPress?: (item: ProductCategoryData) => void,
    ) => {
      const config = getProductConfig(item.Product_Category);
      return (
        <TouchableOpacity
          disabled={!onPress}
          key={`${item.Product_Category}-${index}`}
          activeOpacity={0.7}
          onPress={() => onPress?.(item)}>
          <Card className="min-w-40 rounded-xl" watermark>
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
              <View className="py-2">
                <AppText size="lg" weight="bold" style={{color: config.color}}>
                  {`${item.Percent}%`}
                </AppText>
              </View>
              <View className="mt-3 flex-row items-center justify-between ">
                <View className="flex-1 items-start">
                  <AppText size="sm" className="text-gray-400 ">
                    Target
                  </AppText>
                  <AppText size="sm" weight="semibold">
                    {convertToAPACUnits(item.Target_Qty)}
                  </AppText>
                </View>
                <View className="flex-1 items-end">
                  <AppText size="xs" className="text-gray-400 ">
                    Achieved
                  </AppText>
                  <AppText size="sm" weight="semibold">
                    {convertToAPACUnits(item.Achieved_Qty)}
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

  // Determine if Distributor Wise button should be shown
  const needDistributorAccess = [
    DIR_HOD_MAN,
    HO_EMPLOYEES,
    COUNTRY_HEAD,
  ].includes(userInfo?.EMP_RoleId as any);

  const hasPODAccess = [DIR_HOD_MAN, HO_EMPLOYEES, COUNTRY_HEAD, SA].includes(
    userInfo?.EMP_RoleId as any,
  );
  const hasSellInAccess = [
    DIR_HOD_MAN,
    HO_EMPLOYEES,
    BSM,
    COUNTRY_HEAD,
    SA,
    RSM,
  ].includes(userInfo?.EMP_RoleId as any);

  const hasSellOutAccess = [
    DIR_HOD_MAN,
    HO_EMPLOYEES,
    COUNTRY_HEAD,
    SA,
    RSM,
  ].includes(userInfo?.EMP_RoleId as any);

  const renderActionButtons = useCallback(
    (buttonType: 'POD_Qty' | 'AGP_SellIn' | 'AGP_SellOut') => (
      <View
        className={clsx(
          'flex-row w-full px-3 mt-4',
          needDistributorAccess && buttonType !== 'AGP_SellOut'
            ? 'justify-between'
            : 'justify-end',
        )}>
        {needDistributorAccess && buttonType !== 'AGP_SellOut' && (
          <TouchableOpacity
            className="py-1 flex-row items-center border-b border-blue-600 dark:border-secondary-dark"
            activeOpacity={0.7}
            onPress={() => handleDistributorWisePress(buttonType)}>
            <AppIcon
              name="users"
              type="feather"
              color={darkMode ? '#ffffff' : '#2563eb'}
              size={16}
            />
            <AppText
              size="sm"
              weight="medium"
              className="text-secondary dark:text-white ml-2">
              Distributor Wise
            </AppText>
          </TouchableOpacity>
        )}

        {buttonType !== 'POD_Qty' && (
          <TouchableOpacity
            className="py-1 flex-row items-center border-b border-blue-600 dark:border-secondary-dark"
            activeOpacity={0.7}
            onPress={() => handleSeeMorePress(buttonType)}>
            <AppText
              size="sm"
              weight="medium"
              className="text-blue-600 dark:text-white mr-2">
              See More
            </AppText>
            <AppIcon
              name="arrow-right"
              type="feather"
              color={darkMode ? '#ffffff' : '#2563eb'}
              size={16}
            />
          </TouchableOpacity>
        )}
      </View>
    ),
    [handleDistributorWisePress, handleSeeMorePress],
  );

  if (isEmpty) {
    return (
      <View className="px-3 py-5 mt-10">
        <AppText
          size="lg"
          weight="extraBold"
          color="gray"
          className="text-center">
          No data available
        </AppText>
      </View>
    );
  }

  if (error) {
    return (
      <View className="px-3">
        <ErrorDisplay
          title="Failed to Load Performance Data"
          message="Unable to retrieve target vs achievement information"
          onRetry={onRetry}
          showRetry={!!onRetry}
        />
      </View>
    );
  }

  if (isLoading) return <TargetVsAchievementSkeleton />;

  return (
    <View className="">
      <AppText size="xl" weight="bold" className="pl-3">
        Target / Achievement
      </AppText>

      {hasPODAccess && (
        <View className="mt-3">
          <View className="flex-row items-center pl-3 ">
            <View className="rounded-full bg-emerald-100 p-2">
              <AppIcon
                type="fontAwesome"
                name="cubes"
                size={20}
                color="#10b981"
              />
            </View>
            <AppText size="md" color="gray" weight="semibold" className="pl-3">
              POD QTY
            </AppText>
          </View>

          <ScrollView
            horizontal
            contentContainerClassName="gap-3 py-2 px-3"
            className="mt-2"
            showsHorizontalScrollIndicator={false}>
            {data?.PODQty?.map((item, index) => renderProductCard(item, index))}
          </ScrollView>
          {renderActionButtons('POD_Qty')}
        </View>
      )}

      {/* POD Revenue Section */}
      {hasPODAccess && (
        <View className="mt-5">
          <View className="flex-row items-center pl-3">
            <View className="rounded-full bg-orange-100 p-2">
              <AppIcon
                type="materialIcons"
                name="attach-money"
                size={20}
                color="#f97316"
              />
            </View>
            <AppText size="md" color="gray" weight="semibold" className="pl-3">
              POD Revenue
            </AppText>
          </View>
          <ScrollView
            horizontal
            contentContainerClassName="gap-3 py-2 px-3"
            className="mt-2"
            showsHorizontalScrollIndicator={false}>
            {data?.PODRevenue?.map((item, index) =>
              renderProductCard(item, index),
            )}
          </ScrollView>
        </View>
      )}

      {/* SELL IN  Section */}
      {hasSellInAccess && (
        <View className="mt-5">
          <View className="flex-row items-center pl-3">
            <View className="rounded-full bg-violet-100 p-2">
              <AppIcon
                type="materialIcons"
                name="local-shipping"
                size={20}
                color="#8b5cf6"
              />
            </View>
            <AppText size="md" color="gray" weight="semibold" className="pl-3">
              AGP Sell In (T1 to AGP)
            </AppText>
          </View>
          <ScrollView
            horizontal
            contentContainerClassName="gap-3 py-2 px-3"
            className="mt-2"
            showsHorizontalScrollIndicator={false}>
            {data?.AGPSellIn?.map((item, index) =>
              renderProductCard(item, index),
            )}
          </ScrollView>
          {renderActionButtons('AGP_SellIn')}
        </View>
      )}

      {/* SELL OUT  Section */}
      {hasSellOutAccess && (
        <View className="mt-5">
          <View className="flex-row items-center pl-3">
            <View className="rounded-full bg-cyan-100 p-2">
              <AppIcon
                type="fontAwesome"
                name="shopping-cart"
                size={20}
                color="#06b6d4"
              />
            </View>
            <AppText size="md" color="gray" weight="semibold" className="pl-3">
              AGP Sell Out
            </AppText>
          </View>
          <ScrollView
            horizontal
            contentContainerClassName="gap-3 py-2 px-3"
            className="mt-2"
            showsHorizontalScrollIndicator={false}>
            {data?.AGPSellOut?.map((item, index) =>
              renderProductCard(item, index),
            )}
          </ScrollView>
          {renderActionButtons('AGP_SellOut')}
        </View>
      )}
    </View>
  );
};

const RetailerPerformance: React.FC<RetailerPerformanceProps> = ({
  data,
  isLoading,
  error,
  onRetry,
  tabName,
  quarter,
}) => {
  const AppTheme = useThemeStore(state => state.AppTheme);
  const darkMode = AppTheme === 'dark';
  const navigation = useNavigation<AppNavigationProp>();

  if (error) {
    return (
      <View className="mt-4 px-3">
        <View className="flex-row items-center mb-2">
          <View className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-1.5">
            <AppIcon type="materialIcons" name="store" size={16} color="#3b82f6" />
          </View>
          <AppText size="sm" weight="semibold" color="text" className="ml-2">
            Retailer Performance
          </AppText>
        </View>
        <ErrorDisplay
          title="Failed to Load Retailer Performance"
          message="Unable to retrieve retailer data"
          onRetry={onRetry}
          showRetry={!!onRetry}
        />
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="mt-4 px-3">
        <View className="flex-row items-center mb-2">
          <View className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-1.5">
            <AppIcon type="materialIcons" name="store" size={16} color="#3b82f6" />
          </View>
          <AppText size="sm" weight="semibold" color="text" className="ml-2">
            Retailer Performance
          </AppText>
        </View>
        <Card className="rounded-xl overflow-hidden">
          {[1, 2, 3].map((_, index) => (
            <View
              key={`skeleton-${index}`}
              className={clsx(
                'px-3 py-2 flex-row items-center',
                index !== 2 && 'border-b border-gray-100 dark:border-gray-800'
              )}>
              <View className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <View className="ml-2.5 flex-1">
                <View className="w-24 h-3.5 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
              </View>
              <View className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
            </View>
          ))}
        </Card>
      </View>
    );
  }

  if (!data || data.length === 0) {
    return (
      <View className="mt-4 px-3">
        <View className="flex-row items-center mb-2">
          <View className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-1.5">
            <AppIcon type="materialIcons" name="store" size={16} color="#3b82f6" />
          </View>
          <AppText size="sm" weight="semibold" color="text" className="ml-2">
            Retailer Performance
          </AppText>
        </View>
        <Card className="rounded-xl p-4">
          <View className="items-center py-2">
            <AppIcon 
              type="materialIcons" 
              name="store-mall-directory" 
              size={32} 
              color={darkMode ? '#6B7280' : '#9CA3AF'} 
            />
            <AppText
              size="sm"
              weight="medium"
              color="gray"
              className="text-center mt-2">
              No retailer data available
            </AppText>
          </View>
        </Card>
      </View>
    );
  }

  const handlePartnerPress = useCallback((partner: {PartnerType: string}) => {
    console.log('Partner pressed:', partner.PartnerType);
    navigation.push('TargetSummarySalesPerformance', {
      Year_Qtr:quarter,
      ALP: partner.PartnerType,
      masterTabType: tabName,
    });
  }, [navigation, tabName, quarter]);

  return (
    <View className="mt-4 px-3">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center">
          <View className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-1.5">
            <AppIcon type="materialIcons" name="store" size={16} color="#3b82f6" />
          </View>
          <AppText size="sm" weight="semibold" color="text" className="ml-2">
            Retailer Performance
          </AppText>
        </View>
        <AppText size="xs" color="gray" weight="medium">
          {data.length} {data.length === 1 ? 'Type' : 'Types'}
        </AppText>
      </View>
      
      <View className="flex-row flex-wrap gap-2">
        {data.map((partner, index) => (
          <TouchableOpacity
            key={`${partner.PartnerType}-${index}`}
            activeOpacity={0.7}
            onPress={() => handlePartnerPress(partner)}
            style={{width: (screenWidth - 32) / 2 - 4}}
            className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
            <View className="items-center">
              <View className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 items-center justify-center mb-2">
                <AppIcon
                  type="materialIcons"
                  name="business"
                  size={20}
                  color="#3b82f6"
                />
              </View>
              <AppText size="sm" weight="semibold" color="text" className="text-center">
                {partner.PartnerType}
              </AppText>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const DashboardContainer = memo(({route}: MaterialTopTabScreenProps<any>) => {
  const navigation = useNavigation<AppNavigationProp>();
  const {quarters, selectedQuarter, setSelectedQuarter} = useQuarterHook();
  const userInfo = useLoginStore(state => state.userInfo);
  const isPartner = ASUS.ROLE_ID.PARTNERS === userInfo?.EMP_RoleId;
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    data: dashboardData,
    isLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useDashboardDataAPAC(selectedQuarter?.value || '', route.name);

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

  const targetVsAchievementData: TargetVsAchievementData = useMemo(
    () => ({
      PODQty: dashboardData?.TrgtAchvt_PodQty || [],
      PODRevenue: dashboardData?.TrgtAchvt_PodRevenue || [],
      AGPSellIn: dashboardData?.TrgtAchvt_AGPSellIn || [],
      AGPSellOut: dashboardData?.TrgtAchvt_AGPSellout || [],
    }),
    [
      dashboardData?.TrgtAchvt_PodQty,
      dashboardData?.TrgtAchvt_PodRevenue,
      dashboardData?.TrgtAchvt_AGPSellIn,
      dashboardData?.TrgtAchvt_AGPSellout,
    ],
  );

  const retailerPerformanceData = useMemo(() => {
    return dashboardData?.PartnerType || [];
  }, [dashboardData?.PartnerType]);    

  const handleRetry = useCallback(() => {
    refetchDashboard();
  }, [refetchDashboard]);

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

  console.log('DashboardContainer data:', dashboardData);
  return (
    <View className="flex-1 bg-lightBg-base dark:bg-darkBg-base">
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

        <BannerComponent />

        <TargetVsAchievementComponent
          data={targetVsAchievementData}
          isLoading={isLoading}
          error={dashboardError}
          onRetry={handleRetry}
          tabName={route.name}
          quarter={selectedQuarter?.value || ''}
        />

        {!isPartner && (
          <RetailerPerformance
            data={retailerPerformanceData}
            isLoading={isLoading}
            error={dashboardError}
            onRetry={handleRetry}
            tabName={route.name}
            quarter={selectedQuarter?.value || ''}
          />
        )}
      </ScrollView>
    </View>
  );
});

export default function Dashboard() {
  const {selectedQuarter} = useQuarterHook();
  const initialTab = 'Total';

  //   useEffect(() => {
  //     LogCacheAPI('Dashboard API Log Cached');
  //   }, []);

  const {
    data: dashboardData,
    isLoading: isTabsLoading,
    error: tabsError,
    isError: isTabsError,
    refetch: refetchTabs,
  } = useDashboardDataAPAC(selectedQuarter?.value || '', initialTab);

  const dashboardTabs = useMemo(() => {
    if (dashboardData?.MasterTab && Array.isArray(dashboardData.MasterTab)) {
      const validTabs = dashboardData.MasterTab.filter(
        (tab: any) => tab?.Type && typeof tab.Type === 'string',
      ).map((tab: any) => ({
        name: tab.Type,
        component: DashboardContainer,
        label: tab.Type,
      }));
      return validTabs;
    }
    return [];
  }, [dashboardData?.MasterTab]);

  if (isTabsLoading) return <DashboardSkeleton />;

  if (tabsError) {
    return (
      <View className="flex-1 bg-slate-50">
        <ErrorDisplay
          title="Failed to Load Dashboard"
          message="Unable to retrieve dashboard configuration"
          showRetry={true}
          onRetry={refetchTabs}
        />
      </View>
    );
  }

  if (!dashboardTabs.length) {
    return (
      <View className="flex-1 bg-lightBg-base dark:bg-darkBg-base">
        <ErrorDisplay
          title="No Dashboard Tabs"
          message="No valid dashboard configuration available"
          showRetry={true}
          onRetry={refetchTabs}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-lightBg-base dark:bg-darkBg-base">
      <MaterialTabBar
        tabs={dashboardTabs}
        initialRouteName={dashboardTabs[0]?.name || initialTab}
        tabPadding={10}
      />
    </View>
  );
}
