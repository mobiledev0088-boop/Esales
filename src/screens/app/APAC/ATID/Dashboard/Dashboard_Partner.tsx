import {useCallback, useMemo, useState} from 'react';
import {RefreshControl, ScrollView, View} from 'react-native';
import AppText from '../../../../../components/customs/AppText';
import AppDropdown from '../../../../../components/customs/AppDropdown';
import {useDashboardDataAPAC} from '../../../../../hooks/queries/dashboard';
import useQuarterHook from '../../../../../hooks/useQuarterHook';
import AppIcon from '../../../../../components/customs/AppIcon';
import {ActivationPerformanceComponent} from '../../../ASIN/Dashboard/components';
import Card from '../../../../../components/Card';
import AppTabBar from '../../../../../components/CustomTabBar';
import {
  PartnerAnalyticsSkeleton,
  TargetAchievementSkeleton,
} from '../../../../../components/skeleton/DashboardSkeleton';
import {ASUS, screenWidth} from '../../../../../utils/constant';
import {useLoginStore} from '../../../../../stores/useLoginStore';
import useEmpStore from '../../../../../stores/useEmpStore';
import {LinearProgressBar} from '../../../../../components/customs/AppChart';
import {
  applyOpacityHex,
  convertToAPACUnits,
  getProductConfig,
} from '../../../../../utils/commonFunctions';

interface DataItem {
  label: string;
  value: number;
  isTotal?: boolean;
  Target_Qty?: number;
}

interface UniqueBilledItem {
  T3_Type: string;
  Unique_Partner_Billing: number;
}

interface SelloutQtyItem {
  T3_Type: string;
  Sellout_Qty: number;
  Target_Qty?: number;
}

interface TargetAndAchievementItem {
  T3_Header: string;
  T3_Vale: number;
}

interface PartnersBillingComponentProps {
  data?: UniqueBilledItem[];
}

interface SelloutQuantityComponentProps {
  data?: SelloutQtyItem[];
}

interface AchievementsProps {
  data?: TargetAndAchievementItem[];
}

interface UniversalProgressComponentProps {
  data: DataItem[];
  title: string;
  unit?: string;
  total?: number;
  noHeader?: boolean;
  centerIconBg?: string;
  centerIconColor?: string;
}

interface TargetAchievementProps {
  data: any;
  monthlyData: any;
  isLoading: boolean;
}

interface MonthlyPerformanceItem {
  Month_Name: string; // e.g. "July 2025" or "Jul 2025"
  Qty_Target: number; // Target
  Achieved_Qty: number; // ST (Sell Through)
  Percent_Contri: number; // % Contribution
}

const mapTopFive = (
  items: any[] | undefined,
  limit: number,
  nameKey: string,
) =>
  items?.length
    ? items.slice(0, limit).map(item => ({...item, name: item[nameKey]}))
    : [];

const NoDataAvailable = () => (
  <View className="items-center justify-center p-8 bg-slate-100">
    <View className="w-24 h-24 rounded-full bg-gray-200 items-center justify-center mb-4">
      <AppIcon name="inbox" type="feather" size={40} color="#9CA3AF" />
    </View>
    <AppText size="lg" weight="bold" className="text-gray-600 mb-1">
      No Data Available
    </AppText>
    <AppText className="text-gray-400 text-center">
      There is no data to display for the selected quarter.
    </AppText>
  </View>
);

const UniversalProgressComponent: React.FC<UniversalProgressComponentProps> = ({
  data,
  title,
  noHeader = false,
  unit = '',
  total = 0,
  centerIconBg = 'bg-blue-100',
  centerIconColor = '#3B82F6',
}) => {
  // Filter out total rows & sort desc by value
  const filteredData = useMemo(
    () => data.filter(d => !d.isTotal).sort((a, b) => b.value - a.value),
    [data],
  );

  const getProgressColor = (index: number) => {
    const colors = [
      'bg-blue-500',
      'bg-sky-400',
      'bg-teal-500',
      'bg-indigo-500',
      'bg-emerald-500',
      'bg-orange-300',
    ];
    return colors[index % colors.length];
  }; // Cycles defined palette

  const getProgressWidth = (value: number, Total?: number) =>
    total
      ? Math.round((value / (Total !== undefined ? Total : total)) * 100)
      : 0; // % width

  return (
    <View className="p-4 space-y-4">
      {!noHeader && (
        <View className="items-center mb-3">
          <View
            className={`w-20 h-20 rounded-full ${centerIconBg} items-center justify-center mb-2`}>
            <AppText size="xl" weight="bold" style={{color: centerIconColor}}>
              {total}
            </AppText>
          </View>
          <AppText size="sm" weight="semibold" className="text-slate-600">
            {title}
          </AppText>
        </View>
      )}
      <View className="gap-1">
        {filteredData.map((item, index) => (
          <View key={item.label} className="">
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center gap-1">
                <View
                  className={`w-3 h-3 rounded-full ${getProgressColor(index)}`}
                />
                <AppText size="sm" weight="semibold" className="text-slate-700">
                  {item.label || 'Others'}
                </AppText>
              </View>
              <AppText size="sm" weight="bold" className="text-slate-800">
                {item.value.toLocaleString()}
                {''}
                {unit}
                {item.Target_Qty ? ` (${item.Target_Qty})` : ''}
              </AppText>
            </View>
            <View className="bg-gray-200 h-2 rounded-full overflow-hidden">
              <View
                className={`h-full rounded-full ${getProgressColor(index)}`}
                style={{
                  width: `${getProgressWidth(item.value, item.Target_Qty)}%`,
                }}
              />
            </View>
            <AppText size="xs" className="text-slate-500 text-right">
              {getProgressWidth(item.value, item.Target_Qty)}% of total
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
};

const PartnersBillingComponent: React.FC<PartnersBillingComponentProps> = ({
  data = [],
}) => {
  if (!data.length) return <NoDataAvailable />; // Guard empty
  const total =
    data.find(d => d.T3_Type === 'Total')?.Unique_Partner_Billing || 0;
  const transformedData: DataItem[] = data.map(item => ({
    label: item.T3_Type,
    value: item.Unique_Partner_Billing,
    isTotal: item.T3_Type === 'Total',
  }));
  return (
    <UniversalProgressComponent
      data={transformedData}
      title="Total Partners Billing"
      centerIconBg="bg-blue-100"
      centerIconColor="#3B82F6"
      total={total}
    />
  );
};

const SelloutQuantityComponent: React.FC<SelloutQuantityComponentProps> = ({
  data = [],
}) => {
  if (!data.length) return <NoDataAvailable />;
  const total = data.find(d => d.T3_Type === 'Total')?.Sellout_Qty || 0;
  const transformedData: DataItem[] = data.map(item => ({
    label: item.T3_Type || 'Others',
    value: item.Sellout_Qty,
    isTotal: item.T3_Type === 'Total',
  }));
  return (
    <UniversalProgressComponent
      data={transformedData}
      title="Sellout Quantity"
      unit="Units"
      centerIconBg="bg-indigo-100"
      centerIconColor="#4F46E5"
      total={total}
    />
  );
};

const Achievements: React.FC<AchievementsProps> = ({data = []}) => {
  if (!data.length)
    return (
      <View className="p-4 items-center py-8">
        <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-3">
          <AppIcon name="target" type="feather" size={20} color="#6B7280" />
        </View>
        <AppText size="md" weight="semibold" className="text-gray-500 mb-1">
          No Achievements Yet
        </AppText>
        <AppText size="sm" className="text-gray-400 text-center">
          Keep working towards your targets!
        </AppText>
      </View>
    );
  return (
    <View className="p-4">
      <View className="gap-3">
        {data.map((a, idx) => (
          <View
            key={idx}
            className="bg-white rounded-lg border border-gray-200 p-3 flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-emerald-100 items-center justify-center mr-3">
              <AppIcon name="award" type="feather" size={14} color="#10B981" />
            </View>
            <AppText
              size="sm"
              weight="semibold"
              className="text-slate-700 flex-1">
              {a.T3_Header}
            </AppText>
            <View className="bg-emerald-100 rounded-full w-8 h-8 items-center justify-center">
              <AppText size="sm" weight="bold" className="text-emerald-500">
                {a.T3_Vale.toLocaleString()}
              </AppText>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const SelloutComponent: React.FC<{data?: any[]}> = ({data = []}) => {
  if (!data.length) return <NoDataAvailable />;
  const total = data.reduce((sum, item) => sum + item.Sellout_Qty, 0);
  const transformedData: DataItem[] = data.map(item => ({
    label: item.Product_Category,
    value: item.Sellout_Qty,
    Target_Qty: item?.Target_Qty,
  }));
  return (
    <UniversalProgressComponent
      data={transformedData}
      title="Sellout"
      noHeader
      unit="units"
      centerIconBg="bg-indigo-100"
      centerIconColor="#4F46E5"
      total={total}
    />
  );
};

const InventoryComponent: React.FC<{data?: any[]}> = ({data = []}) => {
  if (!data.length) return <NoDataAvailable />;
  const total = data.reduce((sum, item) => sum + item.Inventory_Qty, 0);
  const transformedData: DataItem[] = data.map(item => ({
    label: item.Product_Category,
    value: item.Inventory_Qty,
  }));
  return (
    <UniversalProgressComponent
      data={transformedData}
      title="Inventory"
      unit="units"
      centerIconBg="bg-green-100"
      centerIconColor="#10B981"
      total={total}
    />
  );
};

const PartnerAnalytics = ({
  dashboardData,
  isLoading,
  partnerType,
}: {
  dashboardData: any;
  isLoading: boolean;
  partnerType?: string | null;
}) => {
  if (isLoading) return <PartnerAnalyticsSkeleton />; // Skeleton while loading
  const isAWP = partnerType === ASUS.PARTNER_TYPE.T2.AWP;
  const tabs = useMemo(() => {
    if (isAWP) {
      return [
        {
          name: 'Partners Billing',
          label: 'Partners Billing',
          component: () => (
            <PartnersBillingComponent data={dashboardData?.UniqueBilled} />
          ),
        },
        {
          name: 'SO Quantity',
          label: 'SO Quantity',
          component: () => (
            <SelloutQuantityComponent data={dashboardData?.SelloutQty} />
          ),
        },
        {
          name: 'Achievements',
          label: 'Achievements',
          component: () => (
            <Achievements data={dashboardData?.TargetAndAchievement} />
          ),
        },
      ];
    }

    const nonAwpTabs = [
      {
        name: 'Sellout',
        label: 'Sellout',
        component: () => <SelloutComponent data={dashboardData?.Sellout} />,
      },
      {
        name: 'Inventory',
        label: 'Inventory',
        component: () => <InventoryComponent data={dashboardData?.Inventory} />,
      },
    ];

    return nonAwpTabs;
  }, [dashboardData, isAWP]);

  return (
    <Card className="p-0">
      <View className="pt-3">
        <View className="flex-row items-center px-4 pb-3 mb-3 border-b border-gray-200">
          <View className="w-9 h-9 rounded-full bg-blue-100 items-center justify-center mr-3">
            <AppIcon name="users" type="feather" size={18} color="#3B82F6" />
          </View>
          <AppText
            size="md"
            weight="bold"
            className="text-slate-800"
            numberOfLines={1}>
            Partner Performance Analytics
          </AppText>
        </View>
      </View>
      <AppTabBar tabs={tabs} />
    </Card>
  );
};
const getProgressColor = (p: number) =>
  p >= 100
    ? '#10B981' // Emerald
    : p >= 80
      ? '#3B82F6' // Blue
      : p >= 50
        ? '#F59E0B' // Amber
        : '#EF4444'; // Rose

const getProgressBgColor = (p: number) =>
  p >= 100
    ? '#D1FAE5' // Emerald light
    : p >= 80
      ? '#DBEAFE' // Blue light
      : p >= 50
        ? '#FEF3C7' // Amber light
        : '#FEE2E2'; // Rose light

const formatMonthYear = (monthStr: string) => {
  try {
    // Parse various date formats
    const date = new Date(monthStr);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      });
    }
    // Fallback: return original if parsing fails
    return monthStr;
  } catch {
    return monthStr;
  }
};

const MonthlyDataTiles = ({data}: {data: MonthlyPerformanceItem[]}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const processed = useMemo(
    () =>
      (data || []).map(m => {
        const tgt = m.Qty_Target || 0;
        const st = m.Achieved_Qty || 0;
        const so = m.Percent_Contri || 0;
        const stPct = tgt ? Math.round((st / tgt) * 100) : 0;
        const soPct = tgt ? Math.round((so / tgt) * 100) : 0;
        return {
          month: formatMonthYear(m.Month_Name),
          tgt,
          st,
          so,
          stPct,
          soPct,
        };
      }),
    [data],
  );

  if (!processed.length) {
    return (
      <View className="px-5 py-6 border-t border-slate-200 dark:border-slate-700">
        <View className="items-center">
          <View className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 items-center justify-center mb-2">
            <AppIcon name="calendar" type="feather" size={20} color="#94A3B8" />
          </View>
          <AppText size="sm" className="text-slate-500 dark:text-slate-400">
            No monthly data available
          </AppText>
        </View>
      </View>
    );
  }

  const cardWidth = screenWidth * 0.85;
  const cardGap = 12;

  return (
    <View className="border-t border-slate-200 dark:border-slate-700">
      {/* Section Header */}
      <View className="px-5 pt-5 pb-3 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 items-center justify-center mr-2">
            <AppIcon name="calendar" type="feather" size={16} color="#6366F1" />
          </View>
          <AppText
            size="md"
            weight="bold"
            className="text-slate-800 dark:text-slate-100">
            Monthly Performance
          </AppText>
        </View>
        <View className="bg-slate-100 dark:bg-slate-700 rounded-full px-2.5 py-1">
          <AppText
            size="xs"
            weight="semibold"
            className="text-slate-600 dark:text-slate-300">
            {currentIndex + 1}/{processed.length}
          </AppText>
        </View>
      </View>

      {/* Scrollable Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{paddingHorizontal: 20, paddingBottom: 20}}
        snapToInterval={cardWidth + cardGap}
        decelerationRate="fast"
        pagingEnabled={false}
        onScroll={event => {
          const offsetX = event.nativeEvent.contentOffset.x;
          const index = Math.round(offsetX / (cardWidth + cardGap));
          setCurrentIndex(Math.max(0, Math.min(index, processed.length - 1)));
        }}
        scrollEventThrottle={16}>
        {processed
          .map((item, idx) => {
            return (
              <View
                key={`${item.month}-${idx}`}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-lg mr-3"
                style={{width: cardWidth}}>
                {/* Card Header */}
                <View className="px-5 pt-4 pb-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-700 dark:to-slate-600">
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center">
                      <View className="w-10 h-10 rounded-xl bg-white dark:bg-slate-600 items-center justify-center mr-3 shadow-sm">
                        <AppText
                          size="lg"
                          weight="bold"
                          className="text-indigo-600 dark:text-indigo-400">
                          {item.month.split(' ')[0].substring(0, 3)}
                        </AppText>
                      </View>
                      <View>
                        <AppText
                          weight="bold"
                          className="text-slate-800 dark:text-slate-100"
                          size="md">
                          {item.month}
                        </AppText>
                        <AppText
                          size="xs"
                          className="text-slate-500 dark:text-slate-400">
                          Performance Report
                        </AppText>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Target Badge */}
                <View className="px-5 py-3 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <AppIcon
                        name="target"
                        type="feather"
                        size={14}
                        color="#64748B"
                      />
                      <AppText
                        size="xs"
                        className="text-slate-600 dark:text-slate-300 ml-2 uppercase tracking-wide">
                        Target
                      </AppText>
                    </View>
                    <AppText
                      size="md"
                      weight="bold"
                      className="text-slate-800 dark:text-slate-100">
                      {convertToAPACUnits(item.tgt)}
                    </AppText>
                  </View>
                </View>

                {/* Progress Sections */}
                <View className="px-5 py-4 gap-4">
                  <View>
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center flex-1">
                        <View
                          className="w-2 h-2 rounded-full mr-2"
                          style={{
                            backgroundColor: getProgressColor(item.stPct),
                          }}
                        />
                        <AppText
                          size="sm"
                          weight="semibold"
                          className="text-slate-700 dark:text-slate-200">
                          Sell Through (ST)
                        </AppText>
                      </View>
                      <View
                        className="rounded-full px-2.5 py-1"
                        style={{
                          backgroundColor: getProgressBgColor(item.stPct),
                        }}>
                        <AppText
                          size="xs"
                          weight="bold"
                          style={{color: getProgressColor(item.stPct)}}>
                          {item.stPct}%
                        </AppText>
                      </View>
                    </View>

                    <View className="mb-2">
                      <View className="h-3 rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden">
                        <View
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(item.stPct, 100)}%`,
                            backgroundColor: getProgressColor(item.stPct),
                          }}
                        />
                      </View>
                    </View>

                    <AppText
                      size="xs"
                      className="text-slate-500 dark:text-slate-400">
                      {convertToAPACUnits(item.st)} of{' '}
                      {convertToAPACUnits(item.tgt)} units
                    </AppText>
                  </View>
                </View>
              </View>
            );
          })
          .reverse()}
      </ScrollView>

      {/* Pagination Dots */}
      {processed.length > 1 && (
        <View className="flex-row justify-center pb-5 gap-1.5">
          {processed.map((_, idx) => (
            <View
              key={idx}
              className="rounded-full transition-all"
              style={{
                width: currentIndex === idx ? 20 : 6,
                height: 6,
                backgroundColor: currentIndex === idx ? '#6366F1' : '#CBD5E1',
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export const TargetAchievementCard = ({
  data,
  monthlyData,
  isLoading = false,
}: TargetAchievementProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const cardWidth = screenWidth - 56;
  const cardGap = 12;

  if (isLoading) return <TargetAchievementSkeleton />;
  return (
    <View className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
      {/* Header with Gradient Background */}
      <View className="px-5 pt-5 pb-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-slate-800 dark:to-slate-700">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View
              className="w-11 h-11 rounded-2xl bg-emerald-500 items-center justify-center shadow-lg"
              style={{
                shadowColor: '#10B981',
                shadowOffset: {width: 0, height: 4},
                shadowOpacity: 0.3,
                shadowRadius: 8,
              }}>
              <AppIcon name="target" type="feather" size={20} color="#FFFFFF" />
            </View>
            <View className="ml-3 flex-1">
              <AppText
                size="lg"
                weight="bold"
                className="text-slate-800 dark:text-slate-100"
                numberOfLines={1}>
                Target & Achievement
              </AppText>
              <AppText
                size="xs"
                className="text-slate-500 dark:text-slate-400 mt-0.5">
                Performance Overview
              </AppText>
            </View>
          </View>
          {/* <View className="bg-white dark:bg-slate-700 rounded-full px-3 py-1.5 shadow-sm">
            <AppText
              size="xs"
              weight="semibold"
              className="text-emerald-600 dark:text-emerald-400">
              {currentIndex?.value + 1}/{data?.length || 0}
            </AppText>
          </View> */}
        </View>
      </View>

      {/* Scrollable Cards */}
      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{paddingHorizontal: 16, paddingVertical: 5}}
        snapToInterval={cardWidth + cardGap}
        decelerationRate="fast"
        pagingEnabled={false}
        onScroll={e => {
          const offsetX = e.nativeEvent.contentOffset.x;
          const index = Math.round(offsetX / (cardWidth + cardGap));
          setCurrentIndex(Math.max(0, Math.min(index, (data?.length || 1) - 1)));
        }}
        scrollEventThrottle={16}>
        {!data || data.length === 0 ? (
          <View style={{width: screenWidth - 24}}>
            <NoDataAvailable />
          </View>
        ) : (
          data.map((item: any, index: number) => {
            const achievement = item?.Achieved_Qty || 0;
            const target = item?.Target_Qty || 1;
            const percentage = Math.min(
              Math.round((achievement / target) * 100),
              100,
            );
            const config = getProductConfig(index);
            return (
              <View
                className="bg-white dark:bg-slate-800 rounded-2xl mr-3 shadow-md border border-slate-100 dark:border-slate-700 overflow-hidden"
                key={index}
                style={{width: cardWidth}}>
                {/* Category Header with Icon */}
                <View
                  className="px-5 pt-3 pb-2"
                  style={{
                    backgroundColor: applyOpacityHex(config.color, 0.08),
                  }}>
                  <View className="flex-row items-center mb-3 gap-3">
                    <View
                      className="w-14 h-14 rounded-2xl items-center justify-center shadow-lg"
                      style={{
                        backgroundColor: config.color,
                        shadowColor: config.color,
                        shadowOffset: {width: 0, height: 4},
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                      }}>
                      <AppIcon
                        name={config.icon}
                        type="material-community"
                        size={26}
                        color="#FFFFFF"
                      />
                    </View>
                    <AppText
                      weight="bold"
                      className="text-xl text-slate-800 dark:text-slate-100 mb-1">
                      {item?.Product_Category}
                    </AppText>
                  </View>
                </View>
                {/* Stats Section */}
                <View className="px-5 py-4">
                  <View className="flex-row items-end mb-4">
                    <View className="flex-1">
                      <AppText className="text-xs text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
                        Achievement
                      </AppText>
                      <AppText
                        className="text-3xl font-bold"
                        style={{color: config.color}}>
                        {convertToAPACUnits(achievement)}
                      </AppText>
                    </View>
                    <View className="items-end flex-1">
                      <AppText className="text-xs text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
                        Target
                      </AppText>
                      <AppText className="text-2xl font-semibold text-slate-600 dark:text-slate-300">
                        {convertToAPACUnits(target)}
                      </AppText>
                    </View>
                  </View>
                  {/* Progress Section */}
                  <View className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-3">
                    <View className="flex-row items-center justify-between mb-3">
                      <AppText
                        size="xs"
                        weight="semibold"
                        className="text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                        Progress
                      </AppText>
                    </View>

                    <LinearProgressBar
                      progress={percentage}
                      progressColor={config.color}
                      width={screenWidth - 120}
                      height={20}
                      duration={1000}
                    />
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Pagination Dots */}
      {data && data.length > 1 && (
        <View className="flex-row justify-center py-4 gap-1.5">
          {data.map((_:any, idx:number) => (
            <View
              key={idx}
              className="rounded-full"
              style={{
                width: currentIndex === idx ? 20 : 6,
                height: 6,
                backgroundColor: currentIndex === idx ? '#10B981' : '#CBD5E1',
              }}
            />
          ))}
        </View>
      )}

      <MonthlyDataTiles data={monthlyData} />
    </View>
  );
};

export default function Dashboard_Partner({
  DifferentEmployeeCode,
  DifferntEmployeeName,
  noAnalytics,
}: {
  DifferentEmployeeCode?: string;
  DifferntEmployeeName?: string;
  noAnalytics?: boolean;
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const {quarters, selectedQuarter, setSelectedQuarter} = useQuarterHook();
  const userInfo = useLoginStore(state => state.userInfo);
  const empInfo = useEmpStore(state => state.empInfo);

  const {
    data: dashboardData,
    isLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useDashboardDataAPAC(
    selectedQuarter?.value || '',
    'Total',
    '',
    DifferentEmployeeCode,
  );

  const activeTabsArray = useMemo(
    () =>
      empInfo?.EMP_Type === ASUS.PARTNER_TYPE.T2.AWP
        ? ['Model', 'AGP']
        : ['Model'],
    [empInfo?.EMP_Type],
  );
  const activationDataObj = useMemo(
    () => ({
      Top5Model: mapTopFive(dashboardData?.Top5Model, 5, 'Top_5_Model'),
      ...(empInfo?.EMP_Type === ASUS.PARTNER_TYPE.T2.AWP && {
        Top5AGP: mapTopFive(dashboardData?.Top5AGP, 5, 'Top_5_AGP'),
      }),
    }),
    [dashboardData, empInfo?.EMP_Type],
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetchDashboard();
    } catch (e) {
      console.warn('Refresh failed:', e);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchDashboard]);

  const isDataEmpty = !isLoading && !dashboardData;
  return (
    <ScrollView
      className="flex-1 bg-lightBg-base dark:bg-darkBg-base"
      contentContainerClassName="flex-grow pb-10 gap-5 pt-3 px-3"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={['#3B82F6']}
          tintColor="#3B82F6"
          title="Pull to refresh"
          titleColor="#6B7280"
        />
      }>
      <View className="mb-2 flex-row items-center justify-between px-3 border-b border-slate-300 pb-4">
        <View>
          <AppText weight="semibold" className="text-md  text-slate-700">
            Partner Dashboard
          </AppText>
          <AppText className="text-sm text-slate-400 mt-0.5">
            {selectedQuarter?.label || 'Select Quarter'}
          </AppText>
        </View>
        <View style={{width: 150}}>
          <AppDropdown
            data={quarters}
            selectedValue={selectedQuarter?.value || null}
            onSelect={setSelectedQuarter}
            mode="dropdown"
            placeholder="Quarter"
            style={{zIndex: 2000}}
          />
        </View>
      </View>
      {DifferentEmployeeCode && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <AppText className="text-yellow-800 text-sm">
            Viewing dashboard for Partner:{' '}
            {DifferntEmployeeName || DifferentEmployeeCode}
          </AppText>
        </Card>
      )}

      {isDataEmpty ? (
        <NoDataAvailable />
      ) : (
        <>
          <TargetAchievementCard
            data={dashboardData?.TRGTSummaryPartner}
            isLoading={isLoading}
            monthlyData={dashboardData?.PartnerType}
          />
          <ActivationPerformanceComponent
            tabs={activeTabsArray}
            data={activationDataObj}
            isLoading={isLoading}
            error={dashboardError}
            onRetry={refetchDashboard}
            name="Total"
            quarter={selectedQuarter?.value || ''}
          />
          {!noAnalytics && (
            <PartnerAnalytics
              dashboardData={dashboardData}
              isLoading={isLoading}
              partnerType={userInfo?.EMP_Type}
            />
          )}
        </>
      )}
    </ScrollView>
  );
}
