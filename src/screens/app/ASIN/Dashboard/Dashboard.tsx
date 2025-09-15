import {useState, useMemo, useCallback, memo} from 'react';
import {View, TouchableOpacity, ScrollView, RefreshControl} from 'react-native';

import {MaterialTopTabScreenProps} from '@react-navigation/material-top-tabs';
import moment from 'moment';

import AppText from '../../../../components/customs/AppText';
import AppDropdown, {
  AppDropdownItem,
} from '../../../../components/customs/AppDropdown';
import AppIcon from '../../../../components/customs/AppIcon';
import AppDatePicker, {
  DatePickerState,
} from '../../../../components/customs/AppDatePicker';
import {CircularProgressBar} from '../../../../components/customs/AppChart';
import Card from '../../../../components/Card';
import ImageSlider, {SwiperItem} from '../../../../components/ImageSlider';
import MaterialTabBar from '../../../../components/MaterialTabBar';
import CustomTabBar from '../../../../components/CustomTabBar';
import { ErrorDisplay } from './dashboardUtils';

import {
  DashboardBannerSkeleton,
  DashboardSalesData,
  TargetVsAchievementSkeleton,
  ActivationPerformanceSkeleton,
  ASEDataSkeleton,
  PartnerAnalyticsSkeleton,
  DashboardSkeleton,
} from '../../../../components/skeleton/DashboardSkeleton';

import {
  useDashboardActivationData,
  useDashboardBanner,
  useDashboardData,
} from '../../../../hooks/queries/dashboard';

import {
  HeaderProps,
  BannerComponentProps,
  TargetVsAchievementProps,
  ActivationPerformanceProps,
  ASEDataProps,
  PartnerAnalyticsProps,
  SalesHeaderData,
  TargetVsAchievementData,
  ActivationPerformanceData,
  ASERelatedData,
  PartnerData,
  ProductCategoryData,
  ActivationData,
  TableColumn,
  TabConfig,
  ErrorDisplayProps,
} from '../../../../types/dashboard';

import {
  convertToASINUnits,
  convertToTitleCase,
  getPastQuarters,
} from '../../../../utils/commonFunctios';
import {DASHBOARD, screenWidth} from '../../../../utils/constant';
import {AppColors} from '../../../../config/theme';
import {
  calculatePercentage,
  getPerformanceColor,
  formatDisplayValue,
} from './dashboardUtils';

// helper functions and constants
const BASE_COLUMNS: TableColumn[] = [
  {
    key: 'name',
    label: 'Name',
    width: 'flex-1',
    dataKey: 'name',
    colorType: 'text',
  },
];
const COMMON_COLUMNS: TableColumn[] = [
  {
    key: 'act',
    label: 'ACT',
    width: 'w-16',
    dataKey: 'Act_Cnt',
    colorType: 'success',
  },
  {
    key: 'nAct',
    label: 'N-ACT',
    width: 'w-20',
    dataKey: 'NonAct_Cnt',
    colorType: 'error',
  },
];

const TAB_CONFIGS: TabConfig[] = [
  {
    id: 'branch',
    label: 'Branch',
    columns: [
      ...BASE_COLUMNS,
      {
        key: 'pod',
        label: 'POD',
        width: 'w-16',
        dataKey: 'POD_Cnt',
        colorType: 'text',
      },
      {
        key: 'st',
        label: 'ST',
        width: 'w-16',
        dataKey: 'ST_Cnt',
        colorType: 'primary',
      },
      ...COMMON_COLUMNS,
    ],
  },
  {
    id: 'alp',
    label: 'ALP',
    columns: [
      ...BASE_COLUMNS,
      {
        key: 'st',
        label: 'ST',
        width: 'w-16',
        dataKey: 'ST_Cnt',
        colorType: 'primary',
      },
      {
        key: 'so',
        label: 'SO',
        width: 'w-16',
        dataKey: 'SO_Cnt',
        colorType: 'secondary',
      },
      ...COMMON_COLUMNS,
    ],
  },
  {
    id: 'models',
    label: 'Models',
    columns: [
      ...BASE_COLUMNS,
      {
        key: 'st',
        label: 'ST',
        width: 'w-16',
        dataKey: 'ST_Cnt',
        colorType: 'primary',
      },
      {
        key: 'so',
        label: 'SO',
        width: 'w-16',
        dataKey: 'SO_Cnt',
        colorType: 'secondary',
      },
      ...COMMON_COLUMNS,
    ],
  },
  {
    id: 'agp',
    label: 'AGP',
    columns: [
      ...BASE_COLUMNS,
      {
        key: 'so',
        label: 'SO',
        width: 'w-16',
        dataKey: 'SO_Cnt',
        colorType: 'secondary',
      },
      ...COMMON_COLUMNS,
    ],
  },
  {
    id: 'asp',
    label: 'ASP',
    columns: [
      ...BASE_COLUMNS,
      {
        key: 'so',
        label: 'SO',
        width: 'w-16',
        dataKey: 'SO_Cnt',
        colorType: 'secondary',
      },
      ...COMMON_COLUMNS,
    ],
  },
  {
    id: 'disti',
    label: 'Disti',
    columns: [
      ...BASE_COLUMNS,
      {
        key: 'pod',
        label: 'POD',
        width: 'w-16',
        dataKey: 'POD_Cnt',
        colorType: 'text',
      },
      {
        key: 'st',
        label: 'ST',
        width: 'w-16',
        dataKey: 'ST_Cnt',
        colorType: 'primary',
      },
      ...COMMON_COLUMNS,
    ],
  },
];

const getCurrentTabConfig = (tabId: string): TabConfig => {
  return TAB_CONFIGS.find(config => config.id === tabId) || TAB_CONFIGS[0];
};

// Static fallback tabs to prevent recreation
const STATIC_DASHBOARD_TABS = [
  {name: 'Total', component: null, label: 'TOTAL'},
  {name: 'CHANNEL', component: null, label: 'CHANNEL'},
  {name: 'ESHOP', component: null, label: 'ESHOP'},
  {name: 'LFR', component: null, label: 'LFR'},
  {name: 'ONLINE', component: null, label: 'ONLINE'},
];
const getDaysBetween = (start: string, end: string): number => {
  const startDate = moment(start);
  const endDate = moment(end);
  return endDate.diff(startDate, 'days');
};

const DateRangeCard = ({
  setIsVisible,
  dateRange,
}: {
  setIsVisible: (visible: boolean) => void;
  dateRange: DatePickerState;
}) => (
  <Card className="mb-3 rounded-2xl p-0">
    <TouchableOpacity className="p-4" onPress={() => setIsVisible(true)}>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center mr-3">
            <AppIcon
              name="calendar"
              size={16}
              color="#3B82F6"
              type="ionicons"
            />
          </View>
          <View>
            <AppText size="xs" color="gray" className="mb-0.5">
              Date Range
            </AppText>
            <AppText size="sm" color="text" weight="semibold">
              {dateRange.start && dateRange.end
                ? `${moment(dateRange.start).format('MMM D, YYYY')} - ${moment(dateRange.end).format('MMM D, YYYY')} ${dateRange.end instanceof Date && dateRange.end === moment().toDate() ? '(Today)' : ''}`
                : 'Select a date range'}
            </AppText>
          </View>
        </View>
        <View className="bg-green-100 px-3 py-1.5 rounded-full">
          <AppText size="xs" weight="semibold" color="success">
            {dateRange.start && dateRange.end
              ? getDaysBetween(
                  moment(dateRange.start).format('YYYY-MM-DD'),
                  moment(dateRange.end).format('YYYY-MM-DD'),
                )
              : 0}{' '}
            days
          </AppText>
        </View>
      </View>
    </TouchableOpacity>
  </Card>
);

const TableHeader = ({columns}: {columns: TableColumn[]}) => (
  <View className="bg-white border-b border-gray-200">
    <View className="flex-row items-center px-4 py-3">
      {columns.map(column => (
        <View
          key={column.key}
          className={`${column.width} ${column.key === 'name' ? '' : 'items-center'}`}>
          <AppText size="sm" weight="semibold" color="gray">
            {column.label}
          </AppText>
        </View>
      ))}
    </View>
  </View>
);

const TabButton = ({
  tab,
  isActive,
  onPress,
}: {
  tab: TabConfig;
  isActive: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    key={tab.id}
    className={`px-4 py-2 rounded-full ${isActive ? 'bg-[#3B82F6]' : 'bg-gray-100'}`}
    activeOpacity={0.7}
    onPress={onPress}>
    <AppText size="sm" weight="medium" color={isActive ? 'white' : 'gray'}>
      {tab.label}
    </AppText>
  </TouchableOpacity>
);

const TableRow = ({
  item,
  isLast,
  columns,
}: {
  item: ActivationData;
  isLast: boolean;
  columns: TableColumn[];
}) => (
  <View
    className={`flex-row items-center px-4 py-3 ${!isLast ? 'border-b border-gray-100' : ''}`}>
    {columns.map(column => (
      <View
        key={column.key}
        className={`${column.width} ${column.key === 'name' ? 'flex-row items-center' : 'items-center'}`}>
        <AppText
          size="sm"
          weight={column.key === 'name' ? 'semibold' : 'bold'}
          color={column.colorType}>
          {item[column.dataKey] || '0'}
        </AppText>
      </View>
    ))}
  </View>
);

const DataTable = ({
  data,
  activeTab,
  columns,
}: {
  data: ActivationData[];
  activeTab: string;
  columns: TableColumn[];
}) => (
  <View className="bg-white rounded-b-xl overflow-hidden">
    {data.map((item, index) => (
      <TableRow
        key={`${activeTab}-${item.name}-${index}`}
        item={item}
        isLast={index === data.length - 1}
        columns={columns}
      />
    ))}
  </View>
);

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
const TargetVsAchievementComponent: React.FC<TargetVsAchievementProps> = ({
  data,
  isLoading,
  error,
  onRetry,
}) => {
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
              <View className="flex-1 items-end">
                <AppText size="xs" className="text-gray-400 ">
                  Target
                </AppText>
                <AppText size="sm" weight="semibold">
                  {convertToASINUnits(item.Target_Qty)}
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

  return (
    <View className="">
      <AppText size="xl" color="gray" weight="bold" className="pl-3">
        Achievement / Target
      </AppText>

      {/* POD Wise Section */}
      <View className="mt-3">
        <AppText size="md" color="gray" weight="semibold" className="pl-3">
          POD Wise
        </AppText>
        <ScrollView
          horizontal
          contentContainerClassName="gap-3 py-2 px-3"
          className="mt-4"
          showsHorizontalScrollIndicator={false}>
          {data.PODwise.map((item, index) =>
            renderProductCard(item, index, index * 100),
          )}
        </ScrollView>
        {renderActionButtons()}
      </View>

      {/* Sell Through Section */}
      <View className="mt-3">
        <AppText size="md" color="gray" weight="semibold" className="pl-3">
          Sell Through
        </AppText>
        <ScrollView
          horizontal
          contentContainerClassName="gap-3 py-2 px-3"
          className="mt-4"
          showsHorizontalScrollIndicator={false}>
          {data.SellThru.map((item, index) =>
            renderProductCard(item, index, 0),
          )}
        </ScrollView>
        {renderActionButtons()}
      </View>
    </View>
  );
};
/**
 * Activation Performance Component - Shows top 5 performance data with tabs
 */
const ActivationPerformanceComponent: React.FC<ActivationPerformanceProps> = ({
  data,
  isLoading,
  error,
  onRetry,
  name
}) => {
  const {mutate, data: activationData, isPending: isMutationLoading, reset} = useDashboardActivationData();
  const [activeTab, setActiveTab] = useState<string>(TAB_CONFIGS[0].id);
  const [isVisible, setIsVisible] = useState(false);
  const [dateRange, setDateRange] = useState<DatePickerState>({
    start: moment().startOf('quarter').toDate(),
    end: moment().toDate(),
  });
  const maximumDate = useMemo(() => new Date(), []);
  const minimumDate = useMemo(() => moment().subtract(5, 'years').toDate(), []);

  // Get current tab configuration
  const currentTabConfig = useMemo(
    () => getCurrentTabConfig(activeTab),
    [activeTab],
  );

  // Get data based on active tab - prioritize activationData if available, otherwise use default data
  const getTabData = useCallback(
    (tabId: string): ActivationData[] => {
      // Use activationData if available (from date range selection), otherwise use default data
      const sourceData = activationData || data;
      
      switch (tabId) {
        case 'branch':
          return sourceData.Top5Branch || [];
        case 'alp':
          return sourceData.Top5ALP || [];
        case 'models':
          return sourceData.Top5Model || [];
        case 'agp':
          return sourceData.Top5AGP || [];
        case 'asp':
          return sourceData.Top5ASP || [];
        case 'disti':
          return sourceData.Top5Disti || [];
        default:
          return [];
      }
    },
    [data, activationData],
  );

  const currentData = useMemo(
    () => getTabData(activeTab),
    [activeTab, getTabData],
  );

  const handleTabPress = useCallback((tabId: string) => {
    setActiveTab(tabId);
  }, []);

  const handleActivationDataFetch = useCallback(
    (startDate?: Date, endDate?: Date) => {
      if (startDate && endDate) {
        const formattedStartDate = moment(startDate).format('YYYY-MM-DD');
        const formattedEndDate = moment(endDate).format('YYYY-MM-DD');
        mutate({
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          masterTab: name
        });
      }
    },
    [mutate, name],
  );

  const handleClearFilter = useCallback(() => {
    reset(); // Clear the mutation data
    setDateRange({ start: undefined, end: undefined }); // Clear the date range
  }, [reset]);

  if (error) {
    return (
      <View className="px-3 py-3">
        <ErrorDisplay
          title="Failed to Load Activation Data"
          message="Unable to retrieve activation performance information"
          onRetry={onRetry}
          showRetry={!!onRetry}
        />
      </View>
    );
  }

  if (isLoading || isMutationLoading) {
    return <ActivationPerformanceSkeleton />;
  }

  return (
    <View className="px-3 py-3">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <AppText size="xl" weight="semibold" color="text">
            Activation Performance
          </AppText>
          {activationData && (
            <View className="flex-row items-center ml-2">
              <View className="px-2 py-1 bg-green-100 rounded-full">
                <AppText size="xs" weight="medium" className="text-green-700">
                  Filtered
                </AppText>
              </View>
              <TouchableOpacity
                className="ml-2 p-1 bg-gray-100 rounded-full"
                onPress={handleClearFilter}
                activeOpacity={0.7}>
                <AppIcon name="x" type="feather" color="#6B7280" size={14} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
      <DateRangeCard setIsVisible={setIsVisible} dateRange={dateRange} />
      <AppDatePicker
        mode="dateRange"
        visible={isVisible}
        onClose={() => setIsVisible(false)}
        initialStartDate={dateRange.start}
        initialEndDate={dateRange.end}
        initialDate={maximumDate}
        maximumDate={maximumDate}
        minimumDate={minimumDate}
        onDateRangeSelect={(startDate, endDate) => {
          setDateRange({start: startDate, end: endDate});
          handleActivationDataFetch(startDate, endDate);
        }}
      />
      <Card className="p-0" needSeeMore needSeeMoreIcon>
        <View className="flex-row w-full justify-between py-3 bg-white px-3 rounded-t-xl border-b border-gray-200">
          {TAB_CONFIGS.map(tab => (
            <TabButton
              key={tab.id}
              tab={tab}
              isActive={activeTab === tab.id}
              onPress={() => handleTabPress(tab.id)}
            />
          ))}
        </View>

        <TableHeader columns={currentTabConfig.columns} />
        <DataTable
          data={currentData}
          activeTab={activeTab}
          columns={currentTabConfig.columns}
        />
      </Card>
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
}) => {
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
          {renderHeadCountCard(totalData.Head_Cnt)}
          {renderMetricCard({
            label: 'TARGET',
            value: totalData.Target,
            iconName: 'target',
          })}
          {renderMetricCard({
            label: 'SELL THRU',
            value: totalData.SellThru,
            iconName: 'trending-up',
          })}
          {renderMetricCard({
            label: 'SELL OUT',
            value: totalData.SellOut,
            iconName: 'shopping-cart',
          })}
        </View>
        <View className="flex-row justify-end mt-3 pb-4 px-4">
          <TouchableOpacity
            className="border border-blue-200 px-4 py-2 rounded-lg bg-blue-100"
            activeOpacity={0.6}>
            <AppText size="xs" weight="medium" className="text-gray-600">
              View Details
            </AppText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [totalData, renderHeadCountCard, renderMetricCard]);

  const ASEChannelTab = useCallback(() => {
    return (
      <View className="flex-row flex-wrap justify-between px-4">
        {renderHeadCountCard(channelData.Head_Cnt)}
        {renderMetricCard({
          label: 'TARGET',
          value: channelData.Target,
          iconName: 'target',
        })}
        {renderMetricCard({
          label: 'SELL THRU',
          value: channelData.SellThru,
          iconName: 'trending-up',
        })}
        {renderMetricCard({
          label: 'SELL OUT',
          value: channelData.SellOut,
          iconName: 'shopping-cart',
        })}
      </View>
    );
  }, [channelData, renderHeadCountCard, renderMetricCard]);

  const ASELFRTab = useCallback(() => {
    return (
      <View className="flex-row flex-wrap justify-between px-4">
        {renderHeadCountCard(lfrData.Head_Cnt)}
        {renderMetricCard({
          label: 'TARGET',
          value: lfrData.Target,
          iconName: 'target',
        })}
        {renderMetricCard({
          label: 'SELL THRU',
          value: lfrData.SellThru,
          iconName: 'trending-up',
        })}
        {renderMetricCard({
          label: 'SELL OUT',
          value: lfrData.SellOut,
          iconName: 'shopping-cart',
        })}
      </View>
    );
  }, [lfrData, renderHeadCountCard, renderMetricCard]);

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

  return (
    <View className="px-3">
      <AppText size="xl" color="text" weight="bold" className="mb-2">
        ASE Related
      </AppText>
      <Card className="p-0 pt-3">
        <CustomTabBar
          tabs={['ASE Total', 'ASE Channel', 'ASE LFR']}
          tabComponents={[ASETotalTab, ASEChannelTab, ASELFRTab]}
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

  const renderPartnerRow = useCallback(() => {
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
          tabs={['Unique Partner Billed']}
          tabComponents={[renderPartnerRow]}
        />
      </Card>
    </View>
  );
};
/**
 * Dashboard Container Component - Main dashboard logic and data management
 */
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

  // Process activation performance data
  const activationPerformanceData: ActivationPerformanceData = useMemo(
    () => ({
      Top5AGP:
        dashboardData?.Top5AGP?.map((item: any) => ({
          ...item,
          name: item.Top_5_AGP,
          SO_Cnt: item.SO_Cnt || item.SellOut_Qty || '0',
        })) || [],
      Top5ALP:
        dashboardData?.Top5ALP?.map((item: any) => ({
          ...item,
          name: item.Top_5_ALP,
          SO_Cnt: item.SO_Cnt || item.SellOut_Qty || '0',
        })) || [],
      Top5ASP:
        dashboardData?.Top5ASP?.map((item: any) => ({
          ...item,
          name: item.Top_5_ASP,
          SO_Cnt: item.SO_Cnt || item.SellOut_Qty || '0',
        })) || [],
      Top5Branch:
        dashboardData?.Top5Branch?.map((item: any) => ({
          ...item,
          name: item.Top_5_Branch,
        })) || [],
      Top5Disti:
        dashboardData?.Top5Disti?.map((item: any) => ({
          ...item,
          name: item.Top_5_Disti,
        })) || [],
      Top5Model:
        dashboardData?.Top5Model?.map((item: any) => ({
          ...item,
          name: item.Top_5_Model,
          SO_Cnt: item.SO_Cnt || item.SellOut_Qty || '0',
        })) || [],
    }),
    [dashboardData],
  );

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
  console.log('Dashboard Rendered:', route.name, selectedQuarter?.value);
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
          data={targetVsAchievementData}
          isLoading={isLoading}
          error={dashboardError}
          onRetry={handleRetry}
        />

        <ActivationPerformanceComponent
          data={activationPerformanceData}
          isLoading={isLoading}
          error={dashboardError}
          onRetry={handleRetry}
          name={route.name}
        />

        {['Total', 'CHANNEL', 'LFR'].includes(route.name) && (
          <ASEDataComponent
            totalData={aseData.total}
            channelData={aseData.channel}
            lfrData={aseData.lfr}
            isLoading={isLoading}
            error={dashboardError}
            onRetry={handleRetry}
          />
        )}

        {['Total', 'CHANNEL'].includes(route.name) && (
          <PartnerAnalyticsComponent
            data={partnerData}
            isLoading={isLoading}
            error={dashboardError}
            onRetry={handleRetry}
          />
        )}
      </ScrollView>
    </View>
  );
});

//Main Dashboard Component
const Dashboard: React.FC = () => {
  const quarters = useMemo(() => getPastQuarters(), []);
  const [selectedQuarter, setSelectedQuarter] =
    useState<AppDropdownItem | null>(() => {
      const reversedQuarters = [...quarters].reverse();
      return reversedQuarters[0] || null;
    });

  // Fetch dashboard data to get MasterTab for dynamic tabs
  const {
    data: dashboardData,
    isLoading: isTabsLoading,
    error: tabsError,
  } = useDashboardData(selectedQuarter?.value || '', 'Total'); // Use 'Total' as default to get all tabs

  // Generate tabs dynamically from API response
  const dashboardTabs = useMemo(() => {
    if (dashboardData?.MasterTab && Array.isArray(dashboardData.MasterTab)) {
      // Filter out any invalid tabs and create dynamic tabs
      const validTabs = dashboardData.MasterTab
        .filter((tab: any) => tab?.Type && typeof tab.Type === 'string')
        .map((tab: any) => ({
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
};

export default Dashboard;
