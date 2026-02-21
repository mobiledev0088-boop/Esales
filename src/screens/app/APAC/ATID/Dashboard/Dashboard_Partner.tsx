import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
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
import {useUserStore} from '../../../../../stores/useUserStore';
import {
  LinearProgressBar,
  CircularProgressBar,
} from '../../../../../components/customs/AppChart';
import {
  applyOpacityHex,
  convertToAPACUnits,
  getProductConfig,
} from '../../../../../utils/commonFunctions';
import moment from 'moment';

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
  Month_No: number; // Month number (1-12)
  Qty_Target: number; // Target
  Achieved_Qty: number; // ST (Sell Through)
  Percent_Contri: number; // SO (Sell Out)
  target_type?: string; // Product Line
}

interface TargetAchievementData {
  Product_Category: string;
  Achieved_Qty: number;
  Target_Qty: number;
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
// Helper to color percentages consistently
const getPctColor = (p: number) =>
  p >= 100
    ? 'bg-emerald-500'
    : p >= 80
      ? 'bg-blue-500'
      : p >= 50
        ? 'bg-amber-500'
        : 'bg-rose-500';

// Text color variant (paired with bar color)
const getPctTextColor = (p: number) =>
  p >= 100
    ? 'text-emerald-600'
    : p >= 80
      ? 'text-blue-600'
      : p >= 50
        ? 'text-amber-600'
        : 'text-rose-600';

// Modern Monthly Data tiles (matches ASIN UI)
const MonthlyDataTiles = ({data}: {data: MonthlyPerformanceItem[]}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView | null>(null);

  const processed = useMemo(
    () =>
      (data || []).map(m => {
        const tgt = m.Qty_Target || 0;
        const buyIn = m.Achieved_Qty || 0;
        const so = m.Percent_Contri || 0;
        const stPct = tgt ? Math.round((buyIn / tgt) * 100) : 0;
        const soPct = tgt ? Math.round((so / tgt) * 100) : 0;
        return {
          month: m.Month_Name,
          tgt,
          buyIn,
          so,
          stPct,
          soPct,
        };
      }),
    [data],
  );

  if (!processed.length) {
    return (
      <View className="px-1 py-3">
        <AppText size="sm" color="gray" className="text-center">
          No monthly data available
        </AppText>
      </View>
    );
  }

  // Scroll to current month (within active quarter) on mount/update
  useEffect(() => {
    if (!processed.length || !scrollViewRef.current) {
      return;
    }
    const today = moment();
    const renderedOrder = [...processed];
    const index = renderedOrder.findIndex(item =>
      moment(item.month, ['MMMM YYYY', 'MMM YYYY']).isSame(today, 'month'),
    );
    if (index > 0) {
      // Each tile is treated as ~110px height in paging calculations
      scrollViewRef.current.scrollTo({y: index * 110, animated: false});
      setCurrentIndex(index);
    }
  }, [processed]);

  return (
    <View className="flex-row items-center h-36">
      <ScrollView
        ref={scrollViewRef}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        style={{maxHeight: 110}}
        contentContainerClassName="gap-2"
        nestedScrollEnabled={true}
        onScroll={event => {
          const offsetY = event.nativeEvent.contentOffset.y;
          const index = Math.round(offsetY / 110);
          setCurrentIndex(index);
        }}
        scrollEventThrottle={16}>
        {processed.map(item => (
          <View
            key={item.month}
            style={{width: screenWidth * 0.55}}
            className="p-4 py-6 rounded bg-lightBg-surface border border-slate-200 dark:bg-darkBg-surface dark:border-slate-700 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <AppText weight="semibold" className="text-slate-800" size="sm">
                {item.month}
              </AppText>
              <View className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700">
                <AppText size="xs" weight="semibold" className="text-slate-500">
                  TGT {convertToAPACUnits(item.tgt)}
                </AppText>
              </View>
            </View>

            {/* Single progress representation */}
            <View className="mb-3 gap-2">
              <View>
                <View className="flex-row justify-between mb-1">
                  <AppText size="xs" className="text-slate-500">
                    Buy In - {convertToAPACUnits(item.buyIn)}
                  </AppText>
                  <AppText
                    size="xs"
                    weight="bold"
                    className={getPctTextColor(item.stPct)}>
                    {item.stPct}%
                  </AppText>
                </View>
                <View className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <View
                    className={`h-full ${getPctColor(item.stPct)} rounded-full`}
                    style={{width: `${Math.min(item.stPct, 100)}%`}}
                  />
                </View>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
      <View className="justify-center gap-1">
        {processed.map((item, index) => (
          <View
            key={item.month}
            className={`bg-gray-300 rounded-full mx-1 ${index === currentIndex ? 'w-2 h-4' : 'w-2 h-2'}`}
          />
        ))}
      </View>
    </View>
  );
};

export const TargetAchievementCard = ({
  data,
  monthlyData,
  isLoading = false,
}: TargetAchievementProps) => {
  const [selectedProductLine, setSelectedProductLine] = useState<string>('NB');

  // Extract unique product lines from target achievement data
  const productLines = useMemo(() => {
    const uniqueLines = Array.from(
      new Set((data || []).map((item: TargetAchievementData) => item.Product_Category).filter(Boolean))
    ) as string[];
    return uniqueLines.map(line => ({label: line, value: line}));
  }, [data]);

  // Set default to 'NB' if available, otherwise first product line
  useEffect(() => {
    if (productLines.length > 0 && !selectedProductLine) {
      const nbLine = productLines.find(pl => pl.value === 'NB');
      const defaultValue = nbLine?.value || productLines[0]?.value || '';
      setSelectedProductLine(defaultValue);
    }
  }, [productLines, selectedProductLine]);

  // Filter target/achievement data by selected product line
  const filteredTargetData = useMemo(() => {
    if (!selectedProductLine || !data) return null;
    return data.find((item: TargetAchievementData) => item.Product_Category === selectedProductLine);
  }, [data, selectedProductLine]);

  // Filter monthly data by selected product line
  const filteredMonthlyData = useMemo(() => {
    if (!selectedProductLine) return monthlyData || [];
    return (monthlyData || []).filter(
      (item: MonthlyPerformanceItem) => item.target_type === selectedProductLine
    );
  }, [monthlyData, selectedProductLine]);

  const target = filteredTargetData?.Target_Qty || 0;
  const achievement = filteredTargetData?.Achieved_Qty || 0;
  const percentage = target ? Math.round((achievement / target) * 100) : 0;

  const getTheme = () => {
    if (percentage >= 90)
      return {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
        icon: 'check-circle',
        iconColor: '#10b981',
        progressBg: 'bg-emerald-500',
      };
    if (percentage >= 60)
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        icon: 'trending-up',
        iconColor: '#3b82f6',
        progressBg: 'bg-blue-500',
      };
    return {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-700',
      icon: 'target',
      iconColor: '#f97316',
      progressBg: 'bg-orange-500',
    };
  };

  const theme = getTheme();
  
  if (isLoading) return <TargetAchievementSkeleton />;
  
  return (
    <Card
      className=" border border-slate-200 dark:border-slate-700"
      noshadow>
      {/* Product Line Filter at Top */}
      {productLines.length > 1 && (
        <View className="border-b border-gray-200 pb-3 mb-3">
          <AppText size="xs" weight="semibold" className="text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">
            Filter by Product Line
          </AppText>
          <AppDropdown
            data={productLines}
            selectedValue={selectedProductLine}
            onSelect={(item) => {
              if (item?.value) {
                setSelectedProductLine(item.value);
              }
            }}
            mode="dropdown"
            placeholder="Select Product Line"
            style={{zIndex: 1000}}
          />
        </View>
      )}
      
      <View className="flex-row items-center border-b border-gray-200 pb-2">
        <View
          className={`w-10 h-10 rounded-xl ${theme.bg} items-center justify-center`}>
          <AppIcon
            name={theme.icon}
            type="feather"
            size={20}
            color={theme.iconColor}
          />
        </View>
        <AppText weight="extraBold" className="text-lg text-gray-800 ml-3">
          Quarterly Performance
        </AppText>
      </View>
      <View className="flex-row items-center ">
        <View className="items-center my-3">
          <CircularProgressBar
            progress={percentage}
            progressColor={'#10b981'}
            size={100}
            strokeWidth={10}
            duration={1000}
          />
          <AppText
            size="xs"
            className="text-gray-500 mt-3 self-start mb-1 ml-4">
            ACH / TGT
          </AppText>
          <View className="items-end flex-row">
            <AppText size="lg" weight="bold">
              {convertToAPACUnits(achievement)}
            </AppText>
            <AppText size="md" className="text-gray-500">
              {' '}
              / {convertToAPACUnits(target)}
            </AppText>
          </View>
        </View>
        <View className="w-px bg-gray-200 mx-3 border-1 h-full mt-3" />
        {filteredMonthlyData && filteredMonthlyData.length > 0 && (
          <MonthlyDataTiles data={filteredMonthlyData} />
        )}
      </View>
    </Card>
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
  const empInfo = useUserStore(state => state.empInfo);

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
  console.log('Fetched Dashboard Data:', dashboardData);

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
      <View className="px-3 border-b border-slate-300 pb-4">
        {DifferentEmployeeCode && (
          // <View className="p-3 mb-3 items-center">
          <View className="bg-primary/10 border border-primary/30 rounded-lg px-4 py-2 mb-3 items-center">
            <AppText weight="semibold" className="text-md text-primary ">
               {DifferntEmployeeName || DifferentEmployeeCode}
            </AppText>
          </View>
        )}
      <View className="mb-2 flex-row items-center justify-between">
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
      </View>

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
