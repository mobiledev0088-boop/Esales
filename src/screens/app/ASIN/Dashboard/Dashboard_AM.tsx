import {
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
  FlatList,
  ListRenderItem,
} from 'react-native';
import React, {memo, useCallback, useEffect, useMemo, useState} from 'react';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import MaterialTabBar from '../../../../components/MaterialTabBar';
import {AppColors} from '../../../../config/theme';
import {
  HeaderProps,
  ProductCategoryData,
  SalesHeaderData,
  TargetVsAchievementProps,
} from '../../../../types/dashboard';
import Card from '../../../../components/Card';
import AppIcon from '../../../../components/customs/AppIcon';
import AppText from '../../../../components/customs/AppText';
import {
  convertToASINUnits,
  convertToCapitalized,
  convertToTitleCase,
  getPastMonths,
  getProductConfig,
} from '../../../../utils/commonFunctions';
import {
  ActivationPerformanceSkeleton,
  DashboardSalesData,
  DashboardSkeleton,
  TargetVsAchievementSkeleton,
} from '../../../../components/skeleton/DashboardSkeleton';
import {useDashboardDataAM} from '../../../../hooks/queries/dashboard';
import {formatDisplayValue} from './dashboardUtils';
import {DASHBOARD} from '../../../../utils/constant';
import AppDropdown, {
  AppDropdownItem,
} from '../../../../components/customs/AppDropdown';
import {MaterialTopTabScreenProps} from '@react-navigation/material-top-tabs';
import {AppTextColorType} from '../../../../types/customs';
import AppInput from '../../../../components/customs/AppInput';
import {BannerComponent, ErrorDisplay} from './components';
import AppTabBar from '../../../../components/CustomTabBar';
import useQuarterHook from '../../../../hooks/useQuarterHook';
import {useUserStore} from '../../../../stores/useUserStore';
import {useNavigation} from '@react-navigation/native';
import {AppNavigationProp} from '../../../../types/navigation';

interface ActivationData {
  Series: string;
  Sellout_Qty?: string | number;
  IActivaton_Qty?: string | number;
  EActivaton_Qty?: string | number;
  GAP_Qty: string | number;
}
interface ColumnConfig {
  key: string;
  label: string;
  widthClass: string; // Tailwind width or flex
  dataKey: keyof ActivationData;
  align?: 'left' | 'center' | 'right';
  colorType: AppTextColorType;
  isNumeric?: boolean; // used for sorting type inference
}
interface ActivationPerformanceComponentProps {
  data?: ActivationData[];
  isLoading: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

interface DataTableProps {
  data: ActivationData[];
  columns: ColumnConfig[];
}

interface ASEDATAProps {
  aseDataTotal: {
    Target_Qty: number;
    Sellout_Qty: number;
    Achieved_Qty: number;
    H_Rate: number;
  };
  list: {
    IchannelID: string;
    ASE_Name: string;
    Partner_Name: string;
    Target_Qty: number;
    Sellout_Qty: number;
    Achieved_Qty: number;
    H_Rate: number;
  }[];
}

const STATIC_DASHBOARD_TABS = [
  {name: 'Total', component: null, label: 'TOTAL'},
  {name: 'CHANNEL', component: null, label: 'CHANNEL'},
  {name: 'LFR', component: null, label: 'LFR'},
];

const ACTIVATION_COLUMNS: ColumnConfig[] = [
  {
    key: 'name',
    label: 'Name',
    widthClass: 'flex-1',
    dataKey: 'Series',
    align: 'left',
    colorType: 'text',
    isNumeric: false,
  },
  {
    key: 'so',
    label: 'SO',
    widthClass: 'w-16',
    dataKey: 'Sellout_Qty',
    align: 'center',
    colorType: 'primary',
    isNumeric: true,
  },
  {
    key: 'i-act',
    label: 'I-ACT',
    widthClass: 'w-16',
    dataKey: 'IActivaton_Qty',
    align: 'center',
    colorType: 'secondary',
    isNumeric: true,
  },
  {
    key: 'e-act',
    label: 'E-ACT',
    widthClass: 'w-16',
    dataKey: 'EActivaton_Qty',
    align: 'center',
    colorType: 'success',
    isNumeric: true,
  },
  {
    key: 'gap',
    label: 'GAP',
    widthClass: 'w-16',
    dataKey: 'GAP_Qty',
    align: 'center',
    colorType: 'error',
    isNumeric: true,
  },
];

interface TableHeaderProps {
  columns: ColumnConfig[];
  sortKey?: string;
  sortDirection?: 'asc' | 'desc' | null;
  onToggleSort?: (col: ColumnConfig) => void;
}

const TableHeader = memo(
  ({columns, sortKey, sortDirection, onToggleSort}: TableHeaderProps) => (
    <View className="border-b border-gray-200">
      <View className="flex-row items-center px-4 py-2.5">
        {columns.map(col => {
          const isSorted = sortKey === col.key;
          const direction = isSorted ? sortDirection : null;
          const iconColor = direction ? '#2563eb' : '#94A3B8';
          return (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`${col.label} column header`}
              accessibilityHint={`Press to sort by ${col.label}`}
              activeOpacity={0.7}
              key={col.key}
              onPress={() => onToggleSort && onToggleSort(col)}
              className={`${col.widthClass} ${col.align === 'center' ? 'items-center' : ''} flex-row`}>
              <AppText
                size="sm"
                weight="semibold"
                color="gray"
                className={`${isSorted ? 'text-blue-600' : ''} mr-0.5`}>
                {col.label}
              </AppText>
              {direction ? (
                <AppIcon
                  name={direction === 'asc' ? 'arrow-up' : 'arrow-down'}
                  type="feather"
                  size={13}
                  color={iconColor}
                />
              ) : (
                <View className="flex-col items-center justify-center ml-0.5 ">
                  <AppIcon
                    name="chevron-up"
                    type="feather"
                    size={10}
                    color={iconColor}
                    style={{marginBottom: -3}}
                  />
                  <AppIcon
                    name="chevron-down"
                    type="feather"
                    size={10}
                    color={iconColor}
                  />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  ),
);

const HighlightedText = ({
  text,
  highlight,
}: {
  text: string;
  highlight: string;
}) => {
  const safeText = text && text !== '0' ? text : '-';
  if (!highlight) {
    return (
      <AppText size="base" weight="semibold" color="text" numberOfLines={1}>
        {safeText}
      </AppText>
    );
  }
  const lower = text.toLowerCase();
  const h = highlight.toLowerCase();
  const matchIndex = lower.indexOf(h);
  if (matchIndex === -1) {
    return (
      <AppText size="base" weight="semibold" color="text" numberOfLines={1}>
        {safeText}
      </AppText>
    );
  }
  const before = text.slice(0, matchIndex);
  const match = text.slice(matchIndex, matchIndex + h.length);
  const after = text.slice(matchIndex + h.length);
  return (
    <AppText
      size="base"
      weight="semibold"
      color="text"
      numberOfLines={1}
      className="text-[14px]">
      {before}
      <AppText
        size="base"
        weight="semibold"
        color="text"
        className="bg-amber-200 text-slate-700">
        {match}
      </AppText>
      {after}
    </AppText>
  );
};

const DataTable = memo(
  ({
    data,
    columns,
    searchTerm = '',
    sortKey,
    sortDirection,
    onToggleSort,
  }: DataTableProps & {
    searchTerm?: string;
    sortKey?: string;
    sortDirection?: 'asc' | 'desc' | null;
    onToggleSort?: (col: ColumnConfig) => void;
  }) => {
    const keyExtractor = useCallback(
      (item: ActivationData, index: number) =>
        `${item.Series || 'row'}-${index}`,
      [],
    );

    const renderItem: ListRenderItem<ActivationData> = useCallback(
      ({item, index}) => (
        <View
          className={`flex-row items-center px-4 py-2.5 ${index !== data.length - 1 ? 'border-b border-gray-100' : ''}`}>
          {columns.map((col: ColumnConfig) => {
            const raw = item[col.dataKey];
            let value: string;
            if (col.key === 'name') {
              value = raw === null || raw === undefined ? '' : String(raw);
            } else {
              value =
                raw === null || raw === undefined || raw === ''
                  ? '0'
                  : String(raw);
            }
            const display =
              col.key === 'name' ? value : convertToASINUnits(Number(value));
            return (
              <View
                key={col.key}
                className={`${col.widthClass} ${col.align === 'center' ? 'items-center' : ''}`}>
                {col.key === 'name' ? (
                  <HighlightedText text={display} highlight={searchTerm} />
                ) : (
                  <AppText
                    size="base"
                    weight={'bold'}
                    color={col.colorType}
                    numberOfLines={1}>
                    {display}
                  </AppText>
                )}
              </View>
            );
          })}
        </View>
      ),
      [columns, data.length, searchTerm],
    );

    const getItemLayout = useCallback(
      (_: any, index: number) => ({length: 44, offset: 44 * index, index}),
      [],
    );

    if (!data || data.length === 0) {
      return (
        <View className="px-4 py-6 items-center">
          <AppText size="sm" color="gray">
            No activation data
          </AppText>
        </View>
      );
    }

    return (
      <View className="rounded-b-xl overflow-hidden">
        <FlatList
          data={data}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          getItemLayout={getItemLayout}
          initialNumToRender={8}
          windowSize={5}
          removeClippedSubviews
          showsVerticalScrollIndicator={false}
          bounces={false}
          scrollEnabled={false}
          ListHeaderComponent={
            <TableHeader
              columns={columns}
              sortKey={sortKey}
              sortDirection={sortDirection}
              onToggleSort={onToggleSort}
            />
          }
        />
      </View>
    );
  },
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
        />
      </View>
    </View>
  );
};
/**
 * Target vs Achievement Component - Shows POD wise and Sell Through performance
 */
const TargetVsAchievementComponent: React.FC<
  Omit<TargetVsAchievementProps, 'data'> & {data: ProductCategoryData[]}
> = ({data = [], isLoading, error, onRetry}) => {
  const handleSeeMorePress = useCallback(() => {
    console.log('See More pressed');
  }, []);

  const renderProductCard = useCallback(
    (item: ProductCategoryData, index: number) => {
      const config = getProductConfig(item.Product_Category);
      const achieved = Number(item.Achieved_Qty) || 0;
      return (
        <Card
          className="w-40 bg-white" // compact card
          watermark
          key={`${item.Product_Category}-${index}`}>
          <View className="flex-row items-center gap-3 mb-3">
            <View
              className="w-10 h-10 rounded-xl items-center justify-center"
              style={{backgroundColor: config.color + '1A'}}>
              <AppIcon
                name={config.icon}
                size={22}
                color={config.color}
                type="material-community"
              />
            </View>
            <AppText
              size="sm"
              weight="semibold"
              className="text-slate-700 flex-1"
              numberOfLines={1}>
              {item.Product_Category}
            </AppText>
          </View>
          <AppText
            size="xl"
            weight="bold"
            className="text-slate-900"
            numberOfLines={1}>
            {convertToASINUnits(achieved)}
          </AppText>
          <AppText size="xs" className="text-slate-400 mt-0.5">
            Units Sold
          </AppText>
        </Card>
      );
    },
    [],
  );

  if (error)
    return (
      <View className="px-3">
        <ErrorDisplay
          title="Failed to Load Performance Data"
          message="Unable to retrieve achievement information"
          onRetry={onRetry}
          showRetry={!!onRetry}
        />
      </View>
    );

  if (isLoading) return <TargetVsAchievementSkeleton />;

  return (
    <View>
      <View className="px-3 mb-1 flex-row items-center">
        <View className="w-8 h-8 rounded-lg bg-emerald-100 items-center justify-center mr-2">
          <AppIcon name="grid" type="feather" size={16} color="#059669" />
        </View>
        <View className="flex-1">
          <AppText size="lg" color="text" weight="bold">
            Sales by Category
          </AppText>
          <AppText size="xs" color="gray" className="mt-0.5">
            Category wise units sold
          </AppText>
        </View>
      </View>
      <View className="mt-3">
        <ScrollView
          horizontal
          contentContainerClassName="gap-4 py-2 px-3"
          className="mt-2"
          showsHorizontalScrollIndicator={false}>
          {data.map((item, index) => renderProductCard(item, index))}
        </ScrollView>
        <View className="flex-row w-full justify-end px-3 mt-4">
          <TouchableOpacity
            className="py-1 flex-row items-center border-b border-secondary"
            activeOpacity={0.7}
            onPress={handleSeeMorePress}>
            <AppText size="sm" weight="medium" className="text-secondary mr-2">
              See More
            </AppText>
            <AppIcon
              name="arrow-right"
              type="feather"
              color={AppColors.secondary}
              size={16}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
/**
 * Activation Performance Component - Shows activation performance table with search and sorting
 */
export const ActivationPerformanceComponent: React.FC<
  ActivationPerformanceComponentProps
> = ({data = [], isLoading, error, onRetry}) => {
  const [isExpand, setIsExpand] = useState(false);
  const [search, setSearch] = useState(''); // immediate value
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showSearch, setShowSearch] = useState(true);
  const handleChangeSearch = useCallback((text: string) => setSearch(text), []);
  const handleClearSearch = useCallback(() => setSearch(''), []);
  const toggleSearchVisibility = useCallback(() => setShowSearch(s => !s), []);
  const toggleExpand = useCallback(() => setIsExpand(p => !p), []);
  // Debounce effect
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search.trim()), 320);
    return () => clearTimeout(id);
  }, [search]);

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{
    key?: string;
    direction?: 'asc' | 'desc' | null;
  }>({});
  const handleToggleSort = useCallback((col: ColumnConfig) => {
    setSortConfig(prev => {
      if (prev.key !== col.key) return {key: col.key, direction: 'desc'}; // start with desc (higher first)
      if (prev.direction === 'desc') return {key: col.key, direction: 'asc'};
      if (prev.direction === 'asc') return {key: undefined, direction: null};
      return {key: col.key, direction: 'desc'};
    });
  }, []);

  const sanitizedData = useMemo(() => {
    if (!data) return [] as ActivationData[];
    return data.filter(item => {
      const name = (item.Series || '').toString().trim();
      if (!name) return false; // drop empty name rows
      // drop rows where all numeric fields are 0/empty (except GAP which might be negative/positive)
      const numericKeys: (keyof ActivationData)[] = [
        'Sellout_Qty',
        'IActivaton_Qty',
        'EActivaton_Qty',
      ];
      const allZero = numericKeys.every(k => {
        const v = item[k];
        return v === undefined || v === null || Number(v) === 0;
      });
      const gap = Number(item.GAP_Qty || 0);
      if (allZero && gap === 0) return false;
      return true;
    });
  }, [data]);

  const processedData = useMemo(() => {
    const base = debouncedSearch
      ? sanitizedData.filter(item =>
          item.Series?.toLowerCase().includes(debouncedSearch.toLowerCase()),
        )
      : sanitizedData;
    let list = [...base];
    if (sortConfig.key && sortConfig.direction) {
      const column = ACTIVATION_COLUMNS.find(c => c.key === sortConfig.key);
      if (column) {
        list.sort((a, b) => {
          const avRaw = a[column.dataKey];
          const bvRaw = b[column.dataKey];
          const av = column.isNumeric
            ? Number(avRaw || 0)
            : String(avRaw || '').toLowerCase();
          const bv = column.isNumeric
            ? Number(bvRaw || 0)
            : String(bvRaw || '').toLowerCase();
          if (av === bv) return 0;
          return sortConfig.direction === 'asc'
            ? av > bv
              ? 1
              : -1
            : av < bv
              ? 1
              : -1;
        });
      }
    }
    return !isExpand && list.length > 5 ? list.slice(0, 5) : list;
  }, [sanitizedData, debouncedSearch, isExpand, sortConfig]);

  const totalFiltered = useMemo(
    () =>
      debouncedSearch
        ? sanitizedData.filter(i =>
            i.Series?.toLowerCase().includes(debouncedSearch.toLowerCase()),
          ).length
        : sanitizedData.length,
    [sanitizedData, debouncedSearch],
  );

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
  if (isLoading) {
    return <ActivationPerformanceSkeleton />;
  }
  const noMatches = debouncedSearch.length > 0 && totalFiltered === 0;

  const TopModelsTab = () => {
    return (
      <View className="overflow-hidden rounded-xl">
        <View className="flex-col px-4 pt-3 pb-2">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <AppText size="xs" color="gray">
                Showing {processedData.length} of {totalFiltered}
                {debouncedSearch ? ' (filtered)' : ''}
              </AppText>
            </View>
            <TouchableOpacity
              onPress={toggleSearchVisibility}
              className="flex-row items-center px-2 py-1 rounded-full bg-slate-100 active:opacity-70">
              <AppIcon
                name={showSearch ? 'x' : 'search'}
                type="feather"
                size={14}
                color="#334155"
              />
              <AppText size="xs" color="gray" className="ml-1">
                {showSearch ? 'Hide' : 'Search'}
              </AppText>
            </TouchableOpacity>
          </View>
          {showSearch && (
            <View className="mt-2">
              <AppInput
                value={search}
                setValue={handleChangeSearch}
                placeholder="Search model name"
                returnKeyType="search"
                variant="pill"
                size="sm"
                leftIcon="search"
                inputContainerClassName="bg-slate-100 px-1.5 "
              />
            </View>
          )}
        </View>
        {noMatches ? (
          <View className="px-4 py-6 items-center bg-white">
            <AppText size="sm" color="gray">
              No matches for '{debouncedSearch}'
            </AppText>
            <TouchableOpacity
              onPress={handleClearSearch}
              className="mt-2 px-3 py-1 rounded-full bg-blue-600">
              <AppText size="xs" weight="semibold" className="text-white">
                Clear Search
              </AppText>
            </TouchableOpacity>
          </View>
        ) : (
          <DataTable
            data={processedData}
            columns={ACTIVATION_COLUMNS}
            searchTerm={debouncedSearch}
            sortKey={sortConfig.key}
            sortDirection={sortConfig.direction || null}
            onToggleSort={handleToggleSort}
          />
        )}
      </View>
    );
  };

  return (
    <View className="px-3 py-3">
      {/* Header Hierarchy */}
      <View className="mb-3">
        <View className="flex-row items-center mb-1">
          <View className="w-8 h-8 rounded-lg bg-blue-100 items-center justify-center mr-2">
            <AppIcon
              name="trending-up"
              type="feather"
              size={16}
              color="#2563eb"
            />
          </View>
          <AppText size="lg" weight="bold" color="text">
            Activation Performance
          </AppText>
        </View>
        <AppText size="xs" color="gray" className="pl-10" numberOfLines={2}>
          Top models performance snapshot (sell-out & activation mix)
        </AppText>
      </View>
      <Card
        className="p-0 pt-5"
        needSeeMore
        seeMoreOnPress={toggleExpand}
        seeMoreText={isExpand ? 'See Less' : 'See More'}>
        <AppTabBar
          tabs={[
            {
              name: 'Top Models',
              label: 'Top Models',
              component: <TopModelsTab />,
            },
          ]}
        />
      </Card>
    </View>
  );
};
/**
 * ASE Performance Component - Shows ASE performance KPIs Need to Integrate real data
 */
const ASEPerformanceComponent: React.FC<ASEDATAProps> = ({
  aseDataTotal,
  list,
}) => {
  const navigation = useNavigation<AppNavigationProp>();
  const KPIItem = useCallback(
    ({
      label,
      value,
      icon,
      iconBg,
      iconColor,
    }: {
      label: string;
      value: number;
      icon: string;
      iconBg: string;
      iconColor: string;
    }) => (
      <View className="items-center">
        <View
          className="w-10 h-10 rounded-xl items-center justify-center"
          style={{backgroundColor: iconBg}}>
          <AppIcon name={icon} type="feather" size={22} color={iconColor} />
        </View>
        <AppText size="lg" weight="bold" color="text" className="mb-1">
          {formatDisplayValue(value)}
        </AppText>
        <AppText size="xs" weight="regular" className="text-gray-400">
          {label}
        </AppText>
      </View>
    ),
    [],
  );

  const kpis = useMemo(
    () => [
      {
        label: 'Total Target',
        value: aseDataTotal?.Target_Qty,
        icon: 'target',
        iconBg: '#dbeafe',
        iconColor: '#1d4ed8',
      },
      {
        label: 'Total Sellout',
        value: aseDataTotal?.Sellout_Qty,
        icon: 'shopping-cart',
        iconBg: '#e0f2fe',
        iconColor: '#0369a1',
      },
      {
        label: 'Total Activation',
        value: aseDataTotal?.Achieved_Qty,
        icon: 'zap',
        iconBg: '#fae8ff',
        iconColor: '#a21caf',
      },
      {
        label: 'Overall Hit Rate',
        value: aseDataTotal?.H_Rate,
        icon: 'percent',
        iconBg: '#dcfce7',
        iconColor: '#047857',
      },
    ],
    [aseDataTotal],
  );

  return (
    <View className="px-3 py-3">
      <View className="mb-3">
        <View className="flex-row items-center mb-1">
          <View className="w-8 h-8 rounded-lg bg-blue-100 items-center justify-center mr-2">
            <AppIcon
              name="bar-chart-2"
              type="feather"
              size={16}
              color="#2563eb"
            />
          </View>
          <AppText size="lg" weight="bold" color="text">
            ASE Performance
          </AppText>
        </View>
        <AppText size="xs" color="gray" className="pl-10" numberOfLines={2}>
          ASE performance snapshot (sell-out & activation mix)
        </AppText>
      </View>
      <Card
        className="flex-row justify-around flex-wrap"
        needSeeMore
        needSeeMoreIcon
        seeMoreOnPress={() =>
          navigation.navigate('VerticalASE', {aseData: list})
        }>
        {kpis.map(k => (
          <KPIItem key={k.label} {...k} />
        ))}
      </Card>
    </View>
  );
};
/**
 * Dashboard Container - Main container for each dashboard tab
 */
const DashboardContainer = memo(({route}: MaterialTopTabScreenProps<any>) => {
  const pastMonths = useMemo(() => getPastMonths(6), []);
  const [selectedMonth, setSelectedMonth] = useState<AppDropdownItem | null>(
    () => {
      const reversedMonths = [...pastMonths];
      return reversedMonths[0] || null;
    },
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    data: dashboardData,
    isLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useDashboardDataAM(selectedMonth?.value || '', route.name);

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

  const aseDataTotal = useMemo(() => {
    // Assuming TOP5ASE is an array of ASE performance data sum all of the data
    const aseItem = dashboardData?.TOP5ASE?.reduce(
      (acc: any, item: any) => {
        acc.Target_Qty =
          (Number(acc.Target_Qty) || 0) + (Number(item.Target_Qty) || 0);
        acc.Sellout_Qty =
          (Number(acc.Sellout_Qty) || 0) + (Number(item.Sellout_Qty) || 0);
        acc.Activaton_Qty =
          (Number(acc.Activaton_Qty) || 0) + (Number(item.Activaton_Qty) || 0);
        acc.H_Rate = (Number(acc.H_Rate) || 0) + (Number(item.H_Rate) || 0);
        return acc;
      },
      {Target_Qty: 0, Sellout_Qty: 0, Activaton_Qty: 0, H_Rate: 0},
    );
    return aseItem;
  }, [dashboardData?.TOP5ASE]);

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
      <KeyboardAwareScrollView
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={60}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{flexGrow: 1, paddingBottom: 40, gap: 20}}
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
        <DashboardHeader
          selectedQuarter={selectedMonth}
          setSelectedQuarter={setSelectedMonth}
          quarters={pastMonths}
          salesData={salesData}
          tabName={route.name}
          isLoading={isLoading}
          error={dashboardError}
          onRetry={handleRetry}
        />

        <BannerComponent />

        <TargetVsAchievementComponent
          data={dashboardData?.TRGTSummary}
          isLoading={isLoading}
          error={dashboardError}
          onRetry={handleRetry}
          quarter={selectedMonth?.label || ''}
          tabName={route.name}
        />

        <ActivationPerformanceComponent
          data={dashboardData?.Top5Model}
          isLoading={isLoading}
          error={dashboardError}
          onRetry={handleRetry}
        />

        <ASEPerformanceComponent
          aseDataTotal={aseDataTotal}
          list={dashboardData?.TOP5ASE || []}
        />
      </KeyboardAwareScrollView>
    </View>
  );
});

export default function Dashboard_AM() {
  const {Year_Qtr} = useUserStore(state => state.empInfo);
  const {selectedQuarter} = useQuarterHook(Year_Qtr);
  const {
    data: dashboardData,
    isLoading: isTabsLoading,
    error: tabsError,
    refetch: handleRetry,
  } = useDashboardDataAM(selectedQuarter?.value || '', 'Total');

  const dashboardTabs = useMemo(() => {
    if (dashboardData?.MasterTab && Array.isArray(dashboardData.MasterTab)) {
      // Filter out any invalid tabs and create dynamic tabs
      const validTabs = dashboardData.MasterTab.filter(
        (tab: any) => tab?.Type && typeof tab.Type === 'string',
      ).map((tab: any) => ({
        name: tab.Type,
        component: DashboardContainer,
        label: convertToCapitalized(tab.Type),
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
          showRetry
          onRetry={handleRetry}
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
}
