import {RefreshControl, ScrollView, View, Pressable} from 'react-native';
import {useCallback, useMemo, useState} from 'react';
import AppIcon from '../../../../components/customs/AppIcon';
import AppText from '../../../../components/customs/AppText';
import Card from '../../../../components/Card';
import AppDropdown, {
  AppDropdownItem,
} from '../../../../components/customs/AppDropdown';
import {getPastQuarters} from '../../../../utils/commonFunctions';
import {useDashboardData, useGetSubCodeData} from '../../../../hooks/queries/dashboard';
import {
  ActivationPerformanceComponent,
  BannerComponent,
  TargetAchievementCard,
} from './components';
import {PartnerAnalyticsSkeleton} from '../../../../components/skeleton/DashboardSkeleton';
import AppTabBar from '../../../../components/CustomTabBar';
import useEmpStore from '../../../../stores/useEmpStore';
import {ASUS} from '../../../../utils/constant';


// Map an array to a standardized top-N shape
const mapTopFive = (
  items: any[] | undefined,
  limit: number,
  nameKey: string,
) =>
  items?.length
    ? items.slice(0, limit).map(item => ({...item, name: item[nameKey]}))
    : [];

// Enhanced Universal Progress Component
interface DataItem {
  label: string;
  value: number;
  isTotal?: boolean;
}

interface UniqueBilledItem {
  T3_Type: string;
  Unique_Partner_Billing: number;
}

interface SelloutQtyItem {
  T3_Type: string;
  Sellout_Qty: number;
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
  centerIconBg?: string;
  centerIconColor?: string;
}

const UniversalProgressComponent: React.FC<UniversalProgressComponentProps> = ({
  data,
  title,
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

  const getProgressWidth = (value: number) =>
    total ? Math.round((value / total) * 100) : 0; // % width

  return (
    <View className="p-4 space-y-4">
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
              </AppText>
            </View>
            <View className="bg-gray-200 h-2 rounded-full overflow-hidden">
              <View
                className={`h-full rounded-full ${getProgressColor(index)}`}
                style={{width: `${getProgressWidth(item.value)}%`}}
              />
            </View>
            <AppText size="xs" className="text-slate-500 text-right">
              {getProgressWidth(item.value)}% of total
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
  }));
  return (
    <UniversalProgressComponent
      data={transformedData}
      title="Sellout"
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
  isSubCodeSelected
}: {
  dashboardData: any;
  isLoading: boolean;
  partnerType?: string | null;
  isSubCodeSelected: boolean;
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

  const nonAwpTabs= [
    {
      name: 'Sellout',
      label: 'Sellout',
      component: () => <SelloutComponent data={dashboardData?.Sellout} />,
    },
  ];

  if (!isSubCodeSelected) {
    nonAwpTabs.push({
      name: 'Inventory',
      label: 'Inventory',
      component: () => <InventoryComponent data={dashboardData?.Inventory} />,
    });
  }

  return nonAwpTabs;
}, [dashboardData, isAWP, isSubCodeSelected]);

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

export default function Dashboard_Partner() {
  const quarters = useMemo(getPastQuarters, []); // Static quarter list
  const empInfo = useEmpStore(s => s.empInfo);
  const [selectedQuarter, setSelectedQuarter] =
    useState<AppDropdownItem | null>(quarters[0] || null);
  const [selectedSubCode, setSelectedSubCode] = useState<AppDropdownItem | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch dashboard data for selected quarter
  const {
    data: dashboardData,
    isLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useDashboardData(selectedQuarter?.value || '', 'Total', selectedSubCode?.value || '');

  const {data: subCodeData,isLoading: isLoadingSubCode} = useGetSubCodeData();

  // Target vs Achievement summary
  const achievementData = useMemo(
    () => ({
      target: dashboardData?.TRGTSummary?.[0]?.Qty_Target || 0,
      achievement: dashboardData?.TRGTSummary?.[0]?.Achieved_Qty || 0,
    }),
    [dashboardData],
  );

  // Activation data grouping (Top models & AGP for AWP)
  const activationDataObj = useMemo(
    () => ({
      Top5Model: mapTopFive(dashboardData?.Top5Model, 5, 'Top_5_Model'),
      ...(empInfo?.EMP_Type === ASUS.PARTNER_TYPE.T2.AWP && {
        Top5AGP: mapTopFive(dashboardData?.Top5AGP, 5, 'Top_5_AGP'),
      }),
    }),
    [dashboardData, empInfo?.EMP_Type],
  );

  // Tabs for activation performance component
  const activeTabsArray = useMemo(
    () =>
      empInfo?.EMP_Type === ASUS.PARTNER_TYPE.T2.AWP
        ? ['Models', 'AGP']
        : ['Models'],
    [empInfo?.EMP_Type],
  );

  // Pull-to-refresh handler
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
      className="flex-1 bg-slate-100 px-3"
      contentContainerClassName="flex-grow pb-10 gap-5 pt-3"
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
      <BannerComponent />
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

      {empInfo?.IsParentCode && (
        <View className="mt-1">
          <AppDropdown
            data={subCodeData || []}
            selectedValue={selectedSubCode?.value || null}
            onSelect={setSelectedSubCode}
            mode="dropdown"
            placeholder={isLoadingSubCode ? 'Loading...' : 'Select Sub Code'}
            zIndex={1000}
          />
          {selectedSubCode?.value && (
            <View className="mt-3">
              <View className="flex-row items-center flex-wrap gap-2">
                <View className="flex-row items-center bg-blue-50 border border-blue-200 rounded-full px-3 py-1 max-w-[72%]">
                  <AppText
                    size="xs"
                    weight="semibold"
                    className="text-blue-700"
                  >
                    Sub Code:
                  </AppText>
                  <AppText
                    size="xs"
                    weight="bold"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    className="text-blue-900 ml-1 flex-shrink"
                    style={{maxWidth: '65%'}}
                  >
                    {selectedSubCode.label}
                  </AppText>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Clear selected sub code"
                    onPress={() => setSelectedSubCode(null)}
                    hitSlop={8}
                    className="ml-2">
                    <AppIcon name="x" type="feather" size={14} color="#1E3A8A" />
                  </Pressable>
                </View>
                <AppText size="xs" className="text-slate-500 flex-shrink" numberOfLines={2}>
                  Showing performance data below for the selected Sub Code. Clear to view Parent Code data.
                </AppText>
              </View>
            </View>
          )}
        </View>
      )}
      {/* SubCode selection info ends */}

      {/*  */}
      {isDataEmpty ? (
        <NoDataAvailable />
      ) : (
        <>
        {/* {selectedSubCode?.value && <AppText size='sm' weight='semibold' className='text-slate-700'>SubCode Data</AppText>} */}
          <TargetAchievementCard
            target={achievementData.target}
            achievement={achievementData.achievement}
            isLoading={isLoading}
            monthlyData={dashboardData?.TRGTSummaryMonth}
          />
          <ActivationPerformanceComponent
            data={activationDataObj}
            isLoading={isLoading}
            error={dashboardError}
            onRetry={refetchDashboard}
            name="Total"
            tabs={activeTabsArray}
          />
          <PartnerAnalytics
            dashboardData={dashboardData}
            isLoading={isLoading}
            partnerType={empInfo?.EMP_Type}
            isSubCodeSelected={!!selectedSubCode?.value}
          />
        </>
      )}
    </ScrollView>
  );
}
