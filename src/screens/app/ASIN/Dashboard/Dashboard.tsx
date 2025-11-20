import {useState, useMemo, useCallback, memo} from 'react';
import {View, TouchableOpacity, ScrollView, RefreshControl} from 'react-native';

import {MaterialTopTabScreenProps} from '@react-navigation/material-top-tabs';

import AppText from '../../../../components/customs/AppText';
import AppDropdown, {
  AppDropdownItem,
} from '../../../../components/customs/AppDropdown';
import AppIcon from '../../../../components/customs/AppIcon';
import {CircularProgressBar} from '../../../../components/customs/AppChart';
import Card from '../../../../components/Card';
import MaterialTabBar from '../../../../components/MaterialTabBar';
import CustomTabBar from '../../../../components/CustomTabBar';
import {
  ErrorDisplay,
  BannerComponent,
  ActivationPerformanceComponent,
} from './components';

import {
  DashboardSalesData,
  TargetVsAchievementSkeleton,
  ASEDataSkeleton,
  PartnerAnalyticsSkeleton,
  DashboardSkeleton,
} from '../../../../components/skeleton/DashboardSkeleton';

import {useDashboardData} from '../../../../hooks/queries/dashboard';

import {
  HeaderProps,
  TargetVsAchievementProps,
  ASEDataProps,
  PartnerAnalyticsProps,
  SalesHeaderData,
  TargetVsAchievementData,
  ASERelatedData,
  PartnerData,
  ProductCategoryData,
} from '../../../../types/dashboard';

import {
  convertToASINUnits,
  convertToTitleCase,
  getPastQuarters,
} from '../../../../utils/commonFunctions';
import {ASUS, DASHBOARD} from '../../../../utils/constant';
import {AppColors} from '../../../../config/theme';
import {
  calculatePercentage,
  getPerformanceColor,
  formatDisplayValue,
  getQuarterDateRangeFormated,
} from './dashboardUtils';
import {useLoginStore} from '../../../../stores/useLoginStore';
import clsx from 'clsx';
import {useNavigation} from '@react-navigation/native';
import {AppNavigationProp} from '../../../../types/navigation';
import moment from 'moment';
import useEmpStore from '../../../../stores/useEmpStore';

// Static fallback tabs to prevent recreation
const STATIC_DASHBOARD_TABS = [
  {name: 'Total', component: null, label: 'TOTAL'},
  {name: 'CHANNEL', component: null, label: 'CHANNEL'},
  {name: 'ESHOP', component: null, label: 'ESHOP'},
  {name: 'LFR', component: null, label: 'LFR'},
  {name: 'ONLINE', component: null, label: 'ONLINE'},
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
 * Target vs Achievement Component - Shows POD wise and Sell Through performance
 */
const TargetVsAchievementComponent: React.FC<TargetVsAchievementProps> = ({
  data,
  isLoading,
  error,
  onRetry,
  tabName,
  quarter,
}) => {
  const userInfo = useLoginStore(state => state.userInfo);
  const empInfo = useEmpStore(state => state.empInfo);
  const navigation = useNavigation<AppNavigationProp>();
  const getProductConfig = useCallback(
    (category: string): {icon: string; color: string} => {
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

  const handleDistributorWisePress = useCallback((wise:'POD' | 'SELL') => {
    navigation.push('TargetSummary', {
      masterTab: tabName,
      Quarter: quarter,
      button: 'disti',
      wise: wise
    });
  }, []);

  const handleSeeMorePress = useCallback((wise:'POD' | 'SELL') => {
    navigation.push('TargetSummary', {
      masterTab: tabName,
      Quarter: quarter,
      button: 'seemore',
      wise: wise

    });
  }, []);

  const renderProductCard = useCallback(
    (
      item: ProductCategoryData,
      index: number,
      animationDelay: number = 0,
      onPress?: (item: ProductCategoryData) => void,
    ) => {
      const config = getProductConfig(item.Product_Category);
      return (
        <TouchableOpacity
          disabled={!onPress}
          key={index}
          activeOpacity={0.7}
          onPress={() => onPress?.(item)}>
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
                duration={1000 + animationDelay}
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
  // Determine if Distributor Wise button should be shown
  const needDistributorAccess = ![
    ASUS.ROLE_ID.DISTRIBUTORS,
    ASUS.ROLE_ID.DISTI_HO,
    ASUS.ROLE_ID.LFR_HO,
  ].includes(userInfo?.EMP_RoleId as any);

  const renderActionButtons = useCallback(
    (wise:'POD' | 'SELL') => (
      <View
        className={clsx(
          'flex-row w-full px-3 mt-4',
          needDistributorAccess ? 'justify-between' : 'justify-end',
        )}>
        {needDistributorAccess && (
          <TouchableOpacity
            className="py-1 flex-row items-center border-b border-blue-600"
            activeOpacity={0.7}
            onPress={()=>handleDistributorWisePress(wise)}>
            <AppIcon name="users" type="feather" color="#2563eb" size={16} />
            <AppText size="sm" weight="medium" className="text-blue-600 ml-2">
              Distributor Wise
            </AppText>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          className="py-1 flex-row items-center border-b border-blue-600"
          activeOpacity={0.7}
          onPress={()=>handleSeeMorePress(wise)}>
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

  if (isLoading) {
    return <TargetVsAchievementSkeleton />;
  }

  const onPress = (item: any) => {
    // Block access for ACCY and WEP categories
    if (['ACCY', 'WEP'].includes(item.Product_Category)) return;

    const {startDate, endDate} = getQuarterDateRangeFormated(quarter);

    let dataToSend = {
      masterTab: tabName,
      StartDate: startDate,
      EndDate: endDate,
      Product_Category: item.Product_Category,
      Territory: '',
    };

    let validForManagers = [
      ASUS.ROLE_ID.BSM,
      ASUS.ROLE_ID.BPM,
      ASUS.ROLE_ID.CHANNEL_MARKETING,
      ASUS.ROLE_ID.RSM,
    ] as number[];

    if (validForManagers.includes(userInfo.EMP_RoleId)) {
      dataToSend = {
        ...dataToSend,
        masterTab: 'CHANNEL',
      };
    } else if (userInfo.EMP_RoleId == ASUS.ROLE_ID.TM) {
      dataToSend = {
        ...dataToSend,
        masterTab: 'CHANNEL',
        Territory: empInfo?.Territory_Name || '',
      };
    }
    navigation.push('ActPerformanceBranchWise', dataToSend);
  };

  return (
    <View className="">
      <AppText size="xl" color="gray" weight="bold" className="pl-3">
        Target / Achievement
      </AppText>

      {/* POD Wise Section */}
      <View className="mt-3">
        <View className="flex-row items-center pl-3 ">
          <View className="rounded-full bg-emerald-100 p-2">
            <AppIcon
              type="material-community"
              name="watermark"
              size={20}
              color="#10b981"
            />
          </View>
          <AppText size="md" color="gray" weight="semibold" className="pl-3">
            POD Wise
          </AppText>
        </View>

        <ScrollView
          horizontal
          contentContainerClassName="gap-3 py-2 px-3"
          className="mt-2"
          showsHorizontalScrollIndicator={false}>
          {data.PODwise.map((item, index) =>
            renderProductCard(item, index, index * 100),
          )}
        </ScrollView>
        {renderActionButtons('POD')}
      </View>

      {/* Sell Through Section */}
      <View className="mt-5">
        <View className="flex-row items-center pl-3">
          <View className="rounded-full bg-orange-100 p-2">
            <AppIcon
              type="material-community"
              name="chart-timeline-variant"
              size={20}
              color="#f97316"
            />
          </View>
          <AppText size="md" color="gray" weight="semibold" className="pl-3">
            Sell Through
          </AppText>
        </View>
        <ScrollView
          horizontal
          contentContainerClassName="gap-3 py-2 px-3"
          className="mt-2"
          showsHorizontalScrollIndicator={false}>
          {data.SellThru.map((item, index) =>
            renderProductCard(item, index, index * 100, onPress),
          )}
        </ScrollView>
        {renderActionButtons('SELL')}
      </View>
    </View>
  );
};
/**
 * ASE Data Component - Shows ASE related performance metrics
 */
const ASEDataComponent: React.FC<ASEDataProps> = ({
  totalData,
  channelData,
  lfrData,
  isLoading = false,
  error,
  onRetry,
  quarter,
  masterTab,
}) => {
  const userInfo = useLoginStore(state => state.userInfo);
  const navigation = useNavigation<AppNavigationProp>();
  const [activeTab, setActiveTab] = useState<string>('ASE Total');
  const renderMetricCard = useCallback(
    ({
      label,
      value,
      iconName,
    }: {
      label: string;
      value: number | string;
      iconName: string;
    }) => {
      return (
        <View className="rounded p-4 items-center">
          <AppIcon name={iconName} type="feather" color="#00a63e" size={24} />
          <AppText size="lg" weight="bold" color="text" className="mb-1">
            {formatDisplayValue(value)}
          </AppText>
          <AppText size="xs" weight="regular" className="text-gray-400">
            {label}
          </AppText>
        </View>
      );
    },
    [],
  );

  const renderHeadCountCard = useCallback(
    (headCount: string | number, onPress?: () => void) => (
      <TouchableOpacity
        className="rounded-lg p-4 items-center"
        activeOpacity={0.6}
        onPress={onPress || (() => console.log('Head Count pressed'))}>
        <AppIcon name="users" type="feather" color="#3B82F6" size={24} />
        <AppText
          size="lg"
          weight="bold"
          color="text"
          className="mb-1 text-[#3B82F6]">
          {formatDisplayValue(headCount)}
        </AppText>
        <AppText
          size="xs"
          weight="regular"
          className="underline text-[#3B82F6]">
          HEAD COUNT
        </AppText>
      </TouchableOpacity>
    ),
    [],
  );

  const ASETotalTab = useCallback(() => {
    return (
      <View>
        <View className="flex-row flex-wrap justify-between px-4">
          {renderMetricCard({
            label: 'HEAD COUNT',
            value: totalData.Head_Cnt,
            iconName: 'users',
          })}
          {renderMetricCard({
            label: 'TARGET',
            value: convertToASINUnits(Number(totalData.Target)),
            iconName: 'target',
          })}
          {renderMetricCard({
            label: 'SELL THRU',
            value: convertToASINUnits(Number(totalData.SellThru)),
            iconName: 'trending-up',
          })}
          {renderMetricCard({
            label: 'SELL OUT',
            value: convertToASINUnits(Number(totalData.SellOut)),
            iconName: 'shopping-cart',
          })}
        </View>
      </View>
    );
  }, [totalData, renderMetricCard]);

  const ASEChannelTab = useCallback(() => {
    const year = Number(quarter.slice(0, 4));
    const quarterNum = Number(quarter.slice(4));
    const currentMonth = moment().month() + 1; // month() is zero-based
    const lastMonthOfQuarter = quarterNum * 3;
    const MonthNum =
      currentMonth < lastMonthOfQuarter ? currentMonth : lastMonthOfQuarter;
    const onPress = () => {
      navigation.push('VerticalASE_HO', {
        Year: year.toString(),
        Month: MonthNum.toString(),
        AlpType: 'Channel',
      });
    };
    return (
      <View className="flex-row flex-wrap justify-between px-4">
        {renderHeadCountCard(channelData.Head_Cnt, onPress)}
        {renderMetricCard({
          label: 'TARGET',
          value: convertToASINUnits(Number(channelData.Target)),
          iconName: 'target',
        })}
        {renderMetricCard({
          label: 'SELL THRU',
          value: convertToASINUnits(Number(channelData.SellThru)),
          iconName: 'trending-up',
        })}
        {renderMetricCard({
          label: 'SELL OUT',
          value: convertToASINUnits(Number(channelData.SellOut)),
          iconName: 'shopping-cart',
        })}
      </View>
    );
  }, [channelData, renderHeadCountCard, renderMetricCard]);

  const ASELFRTab = useCallback(
    ({needHeader = true}: {needHeader: boolean}) => {
      const year = Number(quarter.slice(0, 4));
      const quarterNum = Number(quarter.slice(4));
      const currentMonth = moment().month() + 1; // month() is zero-based
      const lastMonthOfQuarter = quarterNum * 3;
      const MonthNum =
        currentMonth < lastMonthOfQuarter ? currentMonth : lastMonthOfQuarter;
      const onPress = () => {
        navigation.push('VerticalASE_HO', {
          Year: year.toString(),
          Month: MonthNum.toString(),
          AlpType: 'LFR',
        });
      };
      return (
        <View>
          <View className="flex-row flex-wrap justify-between px-4">
            {needHeader
              ? renderHeadCountCard(lfrData.Head_Cnt, onPress)
              : renderMetricCard({
                  label: 'HEAD COUNT',
                  value: lfrData.Head_Cnt,
                  iconName: 'users',
                })}
            {renderMetricCard({
              label: 'TARGET',
              value: convertToASINUnits(Number(lfrData.Target)),
              iconName: 'target',
            })}
            {renderMetricCard({
              label: 'SELL THRU',
              value: convertToASINUnits(Number(lfrData.SellThru)),
              iconName: 'trending-up',
            })}
            {renderMetricCard({
              label: 'SELL OUT',
              value: convertToASINUnits(Number(lfrData.SellOut)),
              iconName: 'shopping-cart',
            })}
          </View>
        </View>
      );
    },
    [lfrData, renderHeadCountCard, renderMetricCard],
  );

  if (error) {
    return (
      <View className="px-3">
        <ErrorDisplay
          title="Failed to Load ASE Data"
          message="Unable to retrieve ASE related information"
          onRetry={onRetry}
          showRetry={!!onRetry}
        />
      </View>
    );
  }

  if (isLoading) {
    return <ASEDataSkeleton />;
  }
  let tabs: any[] = [];
  if (userInfo?.EMP_RoleId === ASUS.ROLE_ID.LFR_HO) {
    tabs = [
      {
        name: 'ASE LFR',
        label: 'ASE LFR',
        // Need header=false for LFR HO single tab view
        component: <ASELFRTab needHeader={false} />,
      },
    ];
  } else {
    tabs = [
      {
        name: 'ASE Total',
        label: 'ASE Total',
        component: ASETotalTab,
      },
      {
        name: 'ASE Channel',
        label: 'ASE Channel',
        component: ASEChannelTab,
      },
      {
        name: 'ASE LFR',
        label: 'ASE LFR',
        component: ASELFRTab,
      },
    ];
  }
  const needSeeMore =
    activeTab === 'ASE Total' || userInfo?.EMP_RoleId === ASUS.ROLE_ID.LFR_HO;
  const year = Number(quarter.slice(0, 4));
  const quarterNum = Number(quarter.slice(4));
  const currentMonth = moment().month() + 1; // month() is zero-based
  const MonthNum = currentMonth < (quarterNum * 3) ? currentMonth : (quarterNum * 3);
  const onPress = () => {
    navigation.push('TargetSummaryAMBranch', {
      Year: year.toString(),
      Month: MonthNum.toString(),
      masterTab,
    });
  };
  return (
    <View className="px-3">
      <AppText size="xl" color="text" weight="bold" className="mb-2">
        ASE Related
      </AppText>
      <Card
        className="p-0 pt-3"
        needSeeMore={needSeeMore}
        seeMoreOnPress={onPress}>
        <CustomTabBar
          tabs={tabs}
          onTabChange={item => setActiveTab(item.name)}
        />
      </Card>
    </View>
  );
};
/**
 * Partner Analytics Component - Shows partner performance data
 */
const PartnerAnalyticsComponent: React.FC<PartnerAnalyticsProps> = ({
  data,
  isLoading = false,
  error,
  onRetry,
}) => {
  const calculatePartnerPercentage = useCallback((value: string): number => {
    if (!value || !value.includes('/')) return 0;
    const [achieved, target] = value.split('/').map(Number);
    return calculatePercentage(achieved, target);
  }, []);

  const UniquePartnerBilled = useMemo(() => {
    const partnerConfigs = [
      {
        key: 'ALP',
        title: 'ALP Partners',
        subtitle: 'Asus Loyal Partners',
        icon: 'users',
        color: '#10B981',
        bgColor: 'bg-green-100',
        showPercentage: true,
      },
      {
        key: 'AGP',
        title: 'AGP Partners',
        subtitle: 'Asus Growth Partners',
        icon: 'award',
        color: '#3B82F6',
        bgColor: 'bg-blue-100',
        showPercentage: true,
      },
      {
        key: 'NON_ALP',
        title: 'Non-ALP Partners',
        subtitle: 'Independent Partners',
        icon: 'user-x',
        color: '#F59E0B',
        bgColor: 'bg-orange-100',
        showPercentage: false,
      },
      {
        key: 'T3',
        title: 'T3 Partners',
        subtitle: 'Tier 3 Specialists',
        icon: 'star',
        color: '#8B5CF6',
        bgColor: 'bg-purple-100',
        showPercentage: false,
      },
    ];
    return (
      <View>
        {partnerConfigs.map((config, index) => {
          const value = data[config.key as keyof PartnerData];
          const [achieved, target] =
            config.showPercentage && value?.includes('/')
              ? value.split('/')
              : [value, null];
          const percentage = config.showPercentage
            ? calculatePartnerPercentage(value)
            : null;

          return (
            <View
              key={config.key}
              className={`flex-row items-center justify-between py-3 ${
                index < partnerConfigs.length - 1
                  ? 'border-b border-gray-100'
                  : ''
              }`}>
              <View className="flex-row items-center">
                <View
                  className={`w-10 h-10 ${config.bgColor} rounded-lg items-center justify-center mr-3`}>
                  <AppIcon
                    name={config.icon}
                    type="feather"
                    color={config.color}
                    size={18}
                  />
                </View>
                <View>
                  <AppText size="sm" weight="semibold" color="text">
                    {config.title}
                  </AppText>
                  <AppText size="xs" color="gray">
                    {config.subtitle}
                  </AppText>
                </View>
              </View>

              <View className="items-end">
                <View className="flex-row items-baseline">
                  <AppText size="lg" weight="bold" color="text">
                    {formatDisplayValue(achieved)}
                  </AppText>
                  {target && (
                    <AppText size="sm" color="gray" className="ml-1">
                      / {formatDisplayValue(target)}
                    </AppText>
                  )}
                </View>
                {percentage !== null && (
                  <AppText size="xs" color="success">
                    {percentage}% achieved
                  </AppText>
                )}
              </View>
            </View>
          );
        })}
      </View>
    );
  }, [data, calculatePartnerPercentage]);

  if (error) {
    return (
      <View className="px-3">
        <ErrorDisplay
          title="Failed to Load Partner Data"
          message="Unable to retrieve partner analytics information"
          onRetry={onRetry}
          showRetry={!!onRetry}
        />
      </View>
    );
  }

  if (isLoading) {
    return <PartnerAnalyticsSkeleton />;
  }

  return (
    <View className="px-3">
      <AppText size="xl" color="text" weight="bold" className="mb-2">
        Partner Analytics
      </AppText>
      <Card className="">
        <CustomTabBar
          tabs={[
            {
              name: 'Unique Partner Billed',
              label: 'Unique Partner Billed',
              // Pass the memoized element directly (it's a ReactNode, not a component type)
              component: UniquePartnerBilled,
            },
          ]}
        />
      </Card>
    </View>
  );
};
/**
 * Disti Sellout Qty Component - Shows sellout split With / Without SSN
 */
const DistiSelloutQtyComponent: React.FC<{
  data?: {WithSSN_Qty?: number; WithoutSSN_Qty?: number};
  isLoading?: boolean;
  error?: any;
  onRetry?: () => void;
}> = ({data, isLoading, error, onRetry}) => {
  const safeData = data || {WithSSN_Qty: 0, WithoutSSN_Qty: 0};
  const {WithSSN_Qty = 0, WithoutSSN_Qty = 0} = safeData;

  const {total, withPerc, withoutPerc} = useMemo(() => {
    const totalVal = (WithSSN_Qty || 0) + (WithoutSSN_Qty || 0);
    const wp = totalVal ? Math.round(((WithSSN_Qty || 0) / totalVal) * 100) : 0;
    const wop = totalVal ? 100 - wp : 0;
    return {total: totalVal, withPerc: wp, withoutPerc: wop};
  }, [WithSSN_Qty, WithoutSSN_Qty]);

  if (error) {
    return (
      <Card className="p-4">
        <ErrorDisplay
          title="Failed to Load Disti Sellout"
          message="Unable to retrieve distributor sellout quantities"
          onRetry={onRetry}
          showRetry={!!onRetry}
        />
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-4 gap-3">
        <View className="h-5 w-40 bg-gray-200 rounded" />
        <View className="h-3 w-full bg-gray-200 rounded" />
        <View className="h-3 w-full bg-gray-200 rounded" />
        <View className="h-3 w-1/2 bg-gray-200 rounded" />
      </Card>
    );
  }

  return (
    <Card className="p-4" watermark>
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <View className="w-9 h-9 rounded-full bg-blue-100 items-center justify-center mr-3">
            <AppIcon
              name="trending-up"
              type="feather"
              color="#2563EB"
              size={18}
            />
          </View>
          <View>
            <AppText size="md" weight="bold" color="text">
              Disti Sellout Qty
            </AppText>
            <AppText size="xs" color="gray">
              SSN vs Non-SSN Sellout
            </AppText>
          </View>
        </View>
        <View className="items-end">
          <AppText size="xs" color="gray" className="mb-0.5">
            Total
          </AppText>
          <AppText size="lg" weight="bold" color="text">
            {formatDisplayValue(total)}
          </AppText>
        </View>
      </View>

      {/* Stacked progress bar */}
      <View className="w-full h-3 rounded-full overflow-hidden bg-gray-200 flex-row mb-4">
        <View style={{flex: withPerc}} className="h-full bg-emerald-500" />
        <View style={{flex: withoutPerc}} className="h-full bg-orange-400" />
      </View>

      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="w-3 h-3 rounded-full bg-emerald-500 mr-2" />
            <AppText size="sm" weight="semibold" color="text">
              With SSN
            </AppText>
          </View>
          <View className="items-end">
            <AppText size="sm" weight="bold" color="text">
              {formatDisplayValue(WithSSN_Qty)}
            </AppText>
            <AppText size="xs" color="success">
              {withPerc}%
            </AppText>
          </View>
        </View>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="w-3 h-3 rounded-full bg-orange-400 mr-2" />
            <AppText size="sm" weight="semibold" color="text">
              Without SSN
            </AppText>
          </View>
          <View className="items-end">
            <AppText size="sm" weight="bold" color="text">
              {formatDisplayValue(WithoutSSN_Qty)}
            </AppText>
            <AppText size="xs" color="warning">
              {withoutPerc}%
            </AppText>
          </View>
        </View>
      </View>
    </Card>
  );
};
/**
 * Dashboard Container Component - Main dashboard logic and data management
 */
const DashboardContainer = memo(({route}: MaterialTopTabScreenProps<any>) => {
  const userInfo = useLoginStore(state => state.userInfo);
  const quarters = useMemo(() => getPastQuarters(), []);
  const [selectedQuarter, setSelectedQuarter] =
    useState<AppDropdownItem | null>(quarters[0] || null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    data: dashboardData,
    isLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useDashboardData(selectedQuarter?.value || '', route.name);

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

  const [acvTab, acvTabData] = useMemo(() => {
    const ORDER = ['Branch', 'ALP', 'Model', 'AGP', 'ASP', 'Disti'];
    const allTop5Objects = Object.keys(dashboardData || {}).filter(key =>
      key.startsWith('Top5'),
    );
    const acvTab = allTop5Objects
      .map(key => key.replace('Top5', ''))
      .sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
    const acvTabUnArray = allTop5Objects.map(key => ({
      [key]: dashboardData?.[key] || {},
    }));
    const acvTabUnManage = Object.assign(
      {},
      ...acvTabUnArray.filter(obj => {
        const value = Object.values(obj)[0];
        return value && Object.keys(value).length > 0; // keep only non-empty objects
      }),
    );
    const acvTabData = Object.keys(acvTabUnManage).reduce(
      (acc, key) => {
        acc[key] = acvTabUnManage[key].map((item: any) => ({
          ...item,
          name: item[`Top_5_${key.replace('Top5', '')}`],
          SO_Cnt: item.SO_Cnt || item.SellOut_Qty || '0',
        }));
        return acc;
      },
      {} as Record<string, any[]>,
    );
    return [acvTab, acvTabData];
  }, [dashboardData]);

  // Process ASE data
  const aseData: ASERelatedData = useMemo(
    () => ({
      total: dashboardData?.ISPRelated?.[0] || {},
      channel: dashboardData?.ISPRelatedChannel?.[0] || {},
      lfr: dashboardData?.ISPRelatedLFR?.[0] || {},
    }),
    [dashboardData],
  );

  // Process partner data
  const partnerData: PartnerData = useMemo(
    () =>
      dashboardData?.UniqueBilled?.[0] || {
        ALP: '',
        AGP: '',
        NON_ALP: '',
        T3: '',
      },
    [dashboardData?.UniqueBilled],
  );

  // Process disti sellout qty data
  const distiSelloutQtyData = useMemo(
    () => dashboardData?.DistiSelloutQty?.[0],
    [dashboardData?.DistiSelloutQty],
  );

  // Process target vs achievement data
  const targetVsAchievementData: TargetVsAchievementData = useMemo(
    () => ({
      PODwise: dashboardData?.TRGTSummarySellIn || [],
      SellThru: dashboardData?.TRGTSummary || [],
    }),
    [dashboardData?.TRGTSummary, dashboardData?.TRGTSummarySellIn],
  );

  // Error handling functions
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

        <BannerComponent />

        <TargetVsAchievementComponent
          data={targetVsAchievementData}
          isLoading={isLoading}
          error={dashboardError}
          onRetry={handleRetry}
          tabName={route.name}
          quarter={selectedQuarter?.value || ''}
        />
        <View className="px-3">
          <ActivationPerformanceComponent
            tabs={acvTab}
            data={acvTabData}
            isLoading={isLoading}
            error={dashboardError}
            onRetry={handleRetry}
            name={route.name}
            quarter={selectedQuarter?.value || ''}
          />
        </View>

        {['Total', 'CHANNEL', 'LFR'].includes(route.name) &&
          ![ASUS.ROLE_ID.DISTI_HO, ASUS.ROLE_ID.DISTRIBUTORS].includes(
            userInfo?.EMP_RoleId as any,
          ) && (
            <ASEDataComponent
              totalData={aseData.total}
              channelData={aseData.channel}
              lfrData={aseData.lfr}
              isLoading={isLoading}
              error={dashboardError}
              onRetry={handleRetry}
              quarter={selectedQuarter?.value || ''}
              masterTab={route.name}
            />
          )}

        {['Total', 'CHANNEL'].includes(route.name) &&
          ![ASUS.ROLE_ID.DISTI_HO, ASUS.ROLE_ID.DISTRIBUTORS].includes(
            userInfo?.EMP_RoleId as any,
          ) && (
            <PartnerAnalyticsComponent
              data={partnerData}
              isLoading={isLoading}
              error={dashboardError}
              onRetry={handleRetry}
            />
          )}
        {/* DistiSelloutQty */}
        {[ASUS.ROLE_ID.DISTI_HO, ASUS.ROLE_ID.DISTRIBUTORS].includes(
          userInfo?.EMP_RoleId as any,
        ) && (
          <View className="px-3">
            <DistiSelloutQtyComponent
              data={distiSelloutQtyData}
              isLoading={isLoading}
              error={dashboardError}
              onRetry={handleRetry}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
});

//Main Dashboard Component
export default function Dashboard() {
  const quarters = useMemo(() => getPastQuarters(), []);
  const userInfo = useLoginStore(state => state.userInfo);

  // Fetch dashboard data to get MasterTab for dynamic tabs
  const initialTab =
    userInfo?.EMP_RoleId === ASUS.ROLE_ID.LFR_HO ? 'LFR' : 'Total';
  const {
    data: dashboardData,
    isLoading: isTabsLoading,
    error: tabsError,
  } = useDashboardData(quarters[0]?.value || '', initialTab);

  // Generate tabs dynamically from API response
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

  // Show global loader while tabs are loading
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
        initialRouteName={dashboardTabs[0]?.name || 'Total'}
        tabPadding={10}
      />
    </View>
  );
}
