import {FlatList, Text, TouchableOpacity, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import AppLayout from '../../../../../components/layout/AppLayout';
import {useQuery} from '@tanstack/react-query';
import {handleAPACApiCall} from '../../../../../utils/handleApiCall';
import {useLoginStore} from '../../../../../stores/useLoginStore';
import {useUserStore} from '../../../../../stores/useUserStore';
import {useCallback, useMemo, useState} from 'react';
import moment from 'moment';
import AppIcon from '../../../../../components/customs/AppIcon';
import AppText from '../../../../../components/customs/AppText';
import FilterButton from '../../../../../components/FilterButton';
import AppDatePicker from '../../../../../components/customs/AppDatePicker';
import Card from '../../../../../components/Card';
import AppTabBar, {TabItem} from '../../../../../components/CustomTabBar';
import {ActivationPerformanceSkeleton} from '../../../../../components/skeleton/DashboardSkeleton';
import {
  ACTIVATION_ID_TO_DATA_KEY,
  DEFAULT_ACTIVATION_TABS,
  deriveInitialActiveId,
  getActivationTabData,
  getCurrentTabConfig,
  TAB_LABEL_TO_ID,
} from '../../Dashboard/dashboardUtils';
import {ActivationData, TableColumn} from '../../../../../types/dashboard';
import {
  convertToAPACUnits,
  getDaysBetween,
} from '../../../../../utils/commonFunctions';
import {AppDropdownItem} from '../../../../../components/customs/AppDropdown';
import AppInput from '../../../../../components/customs/AppInput';
import {AppNavigationProp} from '../../../../../types/navigation';
import clsx from 'clsx';
import { showActivationFilterSheet } from '../ActivationFilterSheet';

interface ActParams {
  masterTab: string;
  quarter: string;
  data: any;
}
interface ActFilter {
  branchName: string;
  AlpType: string;
  ModelName: string;
  TargetType: string;
  CPU_Type: string;
  PartnerName: string;
  StoreName: string;
}
interface ActDateRange {
  StartDate: string;
  EndDate: string;
}
interface ActPerformanceAPIResponse {
  [key: string]: any[];
}

const initialFilter: ActFilter = {
  branchName: '',
  AlpType: '',
  ModelName: '',
  TargetType: '',
  CPU_Type: '',
  PartnerName: '',
  StoreName: '',
};
const quarterStartDate = moment().startOf('quarter').format('YYYY-MM-DD');
const today = moment().format('YYYY-MM-DD');
const ITEMS_PER_BATCH = 10;

const useGetActPerformanceDetails = (
  filters: ActFilter,
  masterTab: string,
  dateRange: ActDateRange,
) => {
  const {EMP_Code: employeeCode = '', EMP_RoleId: employeeRole = ''} =
    useLoginStore(state => state.userInfo);
  const {Sync_Date: syncDate} = useUserStore(state => state.empInfo);
  const {
    AlpType,
    CPU_Type,
    ModelName,
    PartnerName,
    StoreName,
    TargetType,
    branchName,
  } = filters;
  const {StartDate, EndDate} = dateRange;
  const payload = {
    employeeCode: employeeCode,
    RoleID: employeeRole,
    masterTab: masterTab,
    sync_date: syncDate,
    page_name: 'Activation',
    StartDate,
    EndDate,
    branchName,
    AlpType,
    ModelName,
    TargetType,
    CPU_Type,
    PartnerName,
    StoreName,
  };
  return useQuery({
    queryKey: ['getActPerformanceDetails', ...Object.values(payload)],
    queryFn: async () => {
      const res = await handleAPACApiCall(
        '/Dashboard/GetDashboardActivationViewMoreFilterApplyNew',
        payload,
      );
      const result = res.DashboardData;
      if (!result?.Status) return [];
      return result.Datainfo;
    },
    select: (data: ActPerformanceAPIResponse) => {
      const transformData = buildActData(data);
      return transformData;
    },
  });
};

const buildActData = (data: ActPerformanceAPIResponse): [string[], Record<string, any[]>] => {
  if (!data) return [[], {}];
  const ORDER = ['Branch', 'ALP', 'Model', 'Disti'];
  const topKeys = Object.keys(data).filter(key =>
    key.toLowerCase().startsWith('top'),
  );
  let labels = topKeys
    .map(key => key.replace(/top5/i, ''))
    .sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
  const transformedData = topKeys.reduce(
    (acc, key) => {
      const items = data[key];
      if (items && Array.isArray(items) && items.length > 0) {
        const name =
          key === 'Top5Branch'
            ? 'Top_Branch_Territory'
            : `Top_${key.replace(/top5/i, '')}`;

        acc[key === 'TOP5ALP' ? 'Top5ALP' : key] = items.map((item: any) => ({
          ...item,
          name: key === 'Top5Partner' ? `${item[name]}` : item[name],
          SO_Cnt: item.SO_Cnt || item.SellOut_Qty || '0',
          Hit_Rate: item.Hit_Rate ? item.Hit_Rate.toFixed(2) : 0,
        }));
      }
      return acc;
    },
    {} as Record<string, any[]>,
  );

  return [labels, transformedData];
};

const buildTabItems = (
  labels: string[],
  data: any,
  visibleCounts: Record<string, number>,
  searchQueries: Record<string, string>,
  handleSearchChange: (tabId: string, query: string) => void,
  sortConfigs: Record<string, {key: string; direction: 'asc' | 'desc'} | null>,
  handleSort: (tabId: string, columnKey: string) => void,
): TabItem[] => {
  return labels.map(label => {
    const id = TAB_LABEL_TO_ID[label];
    const config = getCurrentTabConfig(id, true);
    const visibleCount = visibleCounts[id] || ITEMS_PER_BATCH;
    const searchQuery = searchQueries[id] || '';
    const sortConfig = sortConfigs[id] || null;

    let tabData = getActivationTabData(data, id);
    // Determine the display label based on branch filter
    let displayLabel = label === 'ALP' ? 'Partner' : label;
    return {
      label: displayLabel,
      name: id,
      component: (
        <View>
          <SearchBox
            value={searchQuery}
            onChangeText={text => handleSearchChange(id, text)}
            placeholder={`Search ${displayLabel}...`}
          />
          <TableHeader
            columns={config.columns}
            sortConfig={sortConfig}
            onSort={columnKey => handleSort(id, columnKey)}
          />
          <DataTable
            data={tabData}
            activeTab={id}
            columns={config.columns}
            visibleCount={visibleCount}
            searchQuery={searchQuery}
            sortConfig={sortConfig}
            onSort={columnKey => handleSort(id, columnKey)}
          />
        </View>
      ),
    } as TabItem;
  });
};

const SearchBox = ({
  value,
  onChangeText,
  placeholder = 'Search...',
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}) => (
  <View className="mt-2 mx-3 mb-2">
    <AppInput
      value={value}
      setValue={onChangeText}
      placeholder={placeholder}
      leftIcon="search"
      containerClassName=""
      showClearButton={true}
      onClear={() => onChangeText('')}
    />
  </View>
);

const TableHeader = ({
  columns,
  sortConfig,
  onSort,
}: {
  columns: TableColumn[];
  sortConfig: {key: string; direction: 'asc' | 'desc'} | null;
  onSort: (columnKey: string) => void;
}) => (
  <View className="bg-white border-b border-gray-200">
    <View className="flex-row items-center px-4 py-3">
      {columns.map(column => {
        const isActive = sortConfig?.key === column.key;
        const showIcon = isActive && sortConfig;

        return (
          <TouchableOpacity
            key={column.key}
            className={`${column.width} ${column.key === 'name' ? '' : 'items-center'}`}
            onPress={() => onSort(column.key)}
            activeOpacity={0.7}>
            <View className="flex-row items-center gap-1">
              <AppText
                size="sm"
                weight="semibold"
                color={isActive ? 'primary' : 'gray'}>
                {column.label}
              </AppText>
              {showIcon && (
                <AppIcon
                  name={
                    sortConfig.direction === 'asc' ? 'arrow-up' : 'arrow-down'
                  }
                  size={14}
                  color="#3B82F6"
                  type="ionicons"
                />
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

const DataTable = ({
  data,
  activeTab,
  columns,
  visibleCount,
  searchQuery = '',
  sortConfig,
  onSort,
}: {
  data: ActivationData[];
  activeTab: string;
  columns: TableColumn[];
  visibleCount: number;
  searchQuery?: string;
  sortConfig: {key: string; direction: 'asc' | 'desc'} | null;
  onSort: (columnKey: string) => void;
}) => {
  const navigation = useNavigation<AppNavigationProp>();
  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    const query = searchQuery.toLowerCase();
    return data.filter(item => {
      // Search across all column data
      return columns.some(column => {
        const value = String(item[column.dataKey] || '').toLowerCase();
        return value.includes(query);
      });
    });
  }, [data, searchQuery, columns]);

  // Sort data based on sortConfig
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    const sorted = [...filteredData].sort((a, b) => {
      const column = columns.find(col => col.key === sortConfig.key);
      if (!column) return 0;

      const aValue = a[column.dataKey];
      const bValue = b[column.dataKey];

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      // Determine if this is the name column (alphabetical sort)
      const isNameColumn = column.key === 'name';

      if (isNameColumn) {
        // Alphabetical sorting
        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();
        return sortConfig.direction === 'asc'
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
      } else {
        // Numerical sorting
        const aNum = Number(aValue) || 0;
        const bNum = Number(bValue) || 0;
        return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
      }
    });

    return sorted;
  }, [filteredData, sortConfig, columns]);

  const displayedData = useMemo(
    () => sortedData.slice(0, visibleCount),
    [sortedData, visibleCount],
  );

  const handlePress = useCallback(
    (name: string) => {
      let AGP_Code = name.match(/\(([^)]+)\)/)?.[1];
      console.log('Extracted AGP_Code:', AGP_Code);
      navigation.push('TargetPartnerDashboard', {partner: {AGP_Code}});
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({item, index}: {item: ActivationData; index: number}) => (
      <TableRow
        item={item}
        isLast={index === displayedData.length - 1}
        columns={columns}
        searchQuery={searchQuery}
        isAGPorALP={activeTab === 'agp' || activeTab === 'alp'}
        handlePress={handlePress}
      />
    ),
    [displayedData.length, columns, searchQuery, activeTab, handlePress],
  );

  const keyExtractor = useCallback(
    (item: ActivationData, index: number) =>
      `${activeTab}-${item.name}-${index}`,
    [activeTab],
  );

  if (!data || data.length === 0) {
    return (
      <View className="bg-white rounded-b-xl overflow-hidden py-8">
        <AppText className="text-center text-gray-500">
          No data available
        </AppText>
      </View>
    );
  }

  if (filteredData.length === 0) {
    return (
      <View className="bg-white rounded-b-xl overflow-hidden py-8">
        <AppText className="text-center text-gray-500">
          No results found for "{searchQuery}"
        </AppText>
      </View>
    );
  }

  return (
    <View className="bg-white dark:bg-gray-800 rounded-b-xl overflow-hidden">
      <TotalsRow columns={columns} data={sortedData} />
      <FlatList
        data={displayedData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        scrollEnabled={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={10}
      />
    </View>
  );
};

const TotalsRow = ({
  columns,
  data,
}: {
  columns: TableColumn[];
  data: ActivationData[];
}) => {
  // Calculate totals for numeric columns
  const columnTotals = useMemo(() => {
    return columns.reduce(
      (totals, column) => {
        if (column.key === 'name') {
          totals[column.key] = 'Total';
        }else if (column.key === 'h-rate') {
          const totalAct = data.reduce((acc, item) => {
            const value = Number(item['Act_Cnt']) || 0;
            return acc + value;
          }, 0);
          const totalNonAct = data.reduce((acc, item) => {
            const value = Number(item['NonAct_Cnt']) || 0;
            return acc + value;
          }, 0);  
          const hitRate = totalNonAct > 0 ? (totalAct / totalNonAct) * 100 : 0;
          totals[column.key] =  hitRate.toFixed(2);
        }else {
          const sum = data.reduce((acc, item) => {
            const value = Number(item[column.dataKey]) || 0;
            return acc + value;
          }, 0);
          totals[column.key] = sum;
        }
        return totals;
      },
      {} as Record<string, string | number>,
    );
  }, [columns, data]);

  return (
    <View className="flex-row items-center px-4 py-2.5 bg-blue-50 dark:bg-blue-900/30 border-y border-blue-200 dark:border-blue-700">
      {columns.map(column => (
        <View
          key={column.key}
          className={`${column.width} ${column.key === 'name' ? 'justify-start' : 'items-center'}`}>
          <AppText
            size="sm"
            weight="semibold"
            className={`${column.key === 'name' ? 'text-blue-800 dark:text-blue-200' : 'text-blue-700 dark:text-blue-300'}`}>
            {column.key === 'name'
              ? columnTotals[column.key]
              : convertToAPACUnits(Number(columnTotals[column.key]))}
            {column.key === 'h-rate' && '%'}
          </AppText>
        </View>
      ))}
    </View>
  );
};

const TableRow = ({
  item,
  isLast,
  columns,
  searchQuery = '',
  isAGPorALP,
  handlePress,
}: {
  item: ActivationData;
  isLast: boolean;
  columns: TableColumn[];
  searchQuery?: string;
  isAGPorALP: boolean;
  handlePress: (name: string) => void;
}) => (
  <TouchableOpacity
    disabled={!isAGPorALP}
    onPress={() => handlePress(item.name)}
    className={`flex-row items-center px-4 py-3 ${!isLast ? 'border-b border-gray-100' : ''}`}>
    {columns.map(column => {
      const text =   isAGPorALP && column.key === 'name' ? `${item[column.dataKey]}\n(${item?.ALP_Code})` :  String(item[column.dataKey] || '0');
      return (
        <View
          key={column.key}
          className={`${column.width} ${column.key === 'name' ? 'flex-row items-center' : 'items-center'}`}>
          <HighlightedText
            text={text}
            searchQuery={searchQuery}
            className={clsx(
              `text-sm ${column.key === 'name' ? 'font-manropeSemibold' : 'font-manropeBold'} ${column.colorType === 'primary' ? 'text-blue-600' : column.colorType === 'success' ? 'text-green-600' : column.colorType === 'warning' ? 'text-amber-600' : column.colorType === 'secondary' ? 'text-gray-600' : 'text-gray-800'} ${column.key === 'name' && isAGPorALP && 'text-primary underline'}`,
            )}
          />
        </View>
      );
    })}
  </TouchableOpacity>
);

const HighlightedText = ({
  text,
  searchQuery,
  className = '',
}: {
  text: string;
  searchQuery: string;
  className?: string;
}) => {
  if (!searchQuery || !text) {
    return (
      <AppText className={className}>
        {!Number.isNaN(Number(text))
          ? convertToAPACUnits(Number(text), true)
          : text}
      </AppText>
    );
  }

  const parts = text.toString().split(new RegExp(`(${searchQuery})`, 'gi'));

  return (
    <AppText className={className}>
      {parts.map((part, index) => {
        const isMatch = part.toLowerCase() === searchQuery.toLowerCase();
        return (
          <AppText
            key={index}
            className={isMatch ? 'bg-yellow-300 text-gray-900' : ''}>
            {part}
          </AppText>
        );
      })}
    </AppText>
  );
};

const DisclaimerNotice = () => (
  <View className="bg-red-50 rounded-xl p-3 mb-6 border border-red-600 mt-4">
    <View className="flex-row items-center mb-1 gap-1">
      <AppIcon
        type="ionicons"
        name="information-circle-outline"
        size={18}
        color="#DC2626"
        style={{marginTop: 3}}
      />
      <AppText size="md" weight="semibold" className="text-error">
        Disclaimer
      </AppText>
    </View>
    <AppText className="text-error leading-5 text-sm">
      Please Note that the activation of Serial Number may be delayed by up to 7
      days.
    </AppText>
  </View>
);

const DateRangeSelector = ({
  setIsVisible,
  dateRange,
}: {
  setIsVisible: (visible: boolean) => void;
  dateRange: ActDateRange;
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
              {dateRange.StartDate && dateRange.EndDate
                ? `${moment(dateRange.StartDate).format('MMM D, YYYY')} - ${moment(dateRange.EndDate).format('MMM D, YYYY')}`
                : 'Select a date range'}
            </AppText>
          </View>
        </View>
        <View className="bg-green-100 px-3 py-1.5 rounded-full">
          <AppText size="xs" weight="semibold" color="success">
            {dateRange.StartDate && dateRange.EndDate
              ? getDaysBetween(
                  moment(dateRange.StartDate).format('YYYY-MM-DD'),
                  moment(dateRange.EndDate).format('YYYY-MM-DD'),
                )
              : 0}{' '}
            days
          </AppText>
        </View>
      </View>
    </TouchableOpacity>
  </Card>
);

const ActivationPerformanceView = ({
  tabs,
  data,
  isLoading,
  dateRange,
  onDateRangeChange,
  onFilterPress,
  hasActiveFilters,
}: {
  tabs: string[];
  data: any;
  isLoading: boolean;
  dateRange: ActDateRange;
  onDateRangeChange: (startDate: Date, endDate: Date) => void;
  onFilterPress: () => void;
  hasActiveFilters?: boolean;
}) => {
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>(
    {},
  );
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>(
    {},
  );
  const [sortConfigs, setSortConfigs] = useState<
    Record<string, {key: string; direction: 'asc' | 'desc'} | null>
  >({});

  const providedTabs = useMemo(
    () => (tabs && tabs.length > 0 ? tabs : [...DEFAULT_ACTIVATION_TABS]),
    [tabs],
  );

  const initialActiveId = useMemo(
    () => deriveInitialActiveId(providedTabs, false),
    [providedTabs],
  );

  const maximumDate = useMemo(() => new Date(), []);
  const minimumDate = useMemo(() => moment().subtract(5, 'years').toDate(), []);

  // Initialize visible counts, search queries, and sort configs for all tabs on mount or data change
  useMemo(() => {
    const initialCounts: Record<string, number> = {};
    const initialQueries: Record<string, string> = {};
    const initialSorts: Record<
      string,
      {key: string; direction: 'asc' | 'desc'} | null
    > = {};
    providedTabs.forEach(label => {
      const id = TAB_LABEL_TO_ID[label];
      initialCounts[id] = ITEMS_PER_BATCH;
      initialQueries[id] = '';
      initialSorts[id] = null;
    });
    setVisibleCounts(initialCounts);
    setSearchQueries(initialQueries);
    setSortConfigs(initialSorts);
    setActiveTabId(initialActiveId);
  }, [data, providedTabs, initialActiveId]);

  // Handle search query change for a specific tab
  const handleSearchChange = useCallback((tabId: string, query: string) => {
    setSearchQueries(prev => ({
      ...prev,
      [tabId]: query,
    }));
  }, []);

  // Handle sort for a specific tab and column
  const handleSort = useCallback((tabId: string, columnKey: string) => {
    setSortConfigs(prev => {
      const currentSort = prev[tabId];

      // Toggle sort direction or set new sort column
      if (currentSort?.key === columnKey) {
        // Same column - toggle direction
        return {
          ...prev,
          [tabId]: {
            key: columnKey,
            direction: currentSort.direction === 'asc' ? 'desc' : 'asc',
          },
        };
      } else {
        // New column - default to ascending
        return {
          ...prev,
          [tabId]: {
            key: columnKey,
            direction: 'asc',
          },
        };
      }
    });
  }, []);

  const tabItems: TabItem[] = useMemo(
    () =>
      buildTabItems(
        providedTabs,
        data,
        visibleCounts,
        searchQueries,
        handleSearchChange,
        sortConfigs,
        handleSort,
      ),
    [
      providedTabs,
      data,
      visibleCounts,
      searchQueries,
      handleSearchChange,
      sortConfigs,
      handleSort,
    ],
  );

  // Get active tab data and calculate visibility states
  const activeTabData = useMemo(() => {
    if (!activeTabId) return [];
    const key = ACTIVATION_ID_TO_DATA_KEY[activeTabId];
    const rawData = data?.[key] || [];

    // Apply search filter if query exists
    const searchQuery = searchQueries[activeTabId] || '';
    const config = getCurrentTabConfig(activeTabId, false);

    let filteredData = rawData;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredData = rawData.filter((item: ActivationData) => {
        return config.columns.some(column => {
          const value = String(item[column.dataKey] || '').toLowerCase();
          return value.includes(query);
        });
      });
    }

    // Apply sorting if sort config exists
    const sortConfig = sortConfigs[activeTabId];
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a: ActivationData, b: ActivationData) => {
      const column = config.columns.find(col => col.key === sortConfig.key);
      if (!column) return 0;

      const aValue = a[column.dataKey];
      const bValue = b[column.dataKey];

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      // Determine if this is the name column (alphabetical sort)
      const isNameColumn = column.key === 'name';

      if (isNameColumn) {
        // Alphabetical sorting
        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();
        return sortConfig.direction === 'asc'
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
      } else {
        // Numerical sorting
        const aNum = Number(aValue) || 0;
        const bNum = Number(bValue) || 0;
        return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
      }
    });
  }, [data, activeTabId, searchQueries, sortConfigs]);

  const activeTabMaxItems = activeTabData.length;
  const activeTabVisibleCount = visibleCounts[activeTabId] || ITEMS_PER_BATCH;
  const hasMoreItems = activeTabVisibleCount < activeTabMaxItems;
  const isFullyExpanded =
    activeTabVisibleCount >= activeTabMaxItems &&
    activeTabMaxItems > ITEMS_PER_BATCH;

  // Handle tab change to track active tab
  const handleTabChange = useCallback((tab: TabItem) => {
    setActiveTabId(tab.name);
  }, []);

  // Handle load more or show less button click
  const handleToggleVisibility = useCallback(() => {
    if (!activeTabId) return;

    setVisibleCounts(prev => ({
      ...prev,
      [activeTabId]: isFullyExpanded
        ? ITEMS_PER_BATCH
        : (prev[activeTabId] || ITEMS_PER_BATCH) + ITEMS_PER_BATCH,
    }));
  }, [isFullyExpanded, activeTabId]);

  if (isLoading) return <ActivationPerformanceSkeleton />;
  return (
    <View className="py-3">
      <View className="flex-row gap-3 items-center">
        <View className="flex-1">
          <DateRangeSelector
            setIsVisible={setIsDatePickerVisible}
            dateRange={dateRange}
          />
        </View>
        <FilterButton
          onPress={onFilterPress}
          hasActiveFilters={hasActiveFilters}
        />
      </View>

      <AppDatePicker
        mode="dateRange"
        visible={isDatePickerVisible}
        onClose={() => setIsDatePickerVisible(false)}
        initialStartDate={moment(dateRange.StartDate).toDate()}
        initialEndDate={moment(dateRange.EndDate).toDate()}
        initialDate={maximumDate}
        maximumDate={maximumDate}
        minimumDate={minimumDate}
        onDateRangeSelect={(startDate, endDate) => {
          onDateRangeChange(startDate, endDate);
        }}
      />
      <Card
        className="p-1 border border-slate-200 dark:border-gray-700"
        needSeeMore={hasMoreItems || isFullyExpanded}
        seeMoreText={isFullyExpanded ? 'Show Less' : 'Load More'}
        seeMoreOnPress={handleToggleVisibility}
        noshadow>
        <View className="pt-3 overflow-hidden">
          {/* {territory && <TerritoryDisplay territory={territory} />} */}
          <AppTabBar
            tabs={tabItems}
            initialTabName={initialActiveId}
            onTabChange={handleTabChange}
          />
        </View>
      </Card>
    </View>
  );
};

export default function ActPerformanceATID() {
  const {params} = useRoute();
  const {masterTab} = params as ActParams;
  const [filters, setFilters] = useState<ActFilter>(initialFilter);
  const [dateRange, setDateRange] = useState<ActDateRange>({
    StartDate: quarterStartDate,
    EndDate: today,
  });
  const {data, isLoading, error} = useGetActPerformanceDetails(
    filters,
    masterTab,
    dateRange,
  );
  const [tabs, tabData] = (data as [string[], Record<string, any[]>]) || [[], {}];
  const handleDateRangeChange = () => {};

    const handleFilterPress = useCallback(() => {
      showActivationFilterSheet({
        masterTab,
        // territory: Territory, // Pass territory to hide branch filter if provided
        // Pass current filter values
        branches: filters.branchName.split(',').map(branch => branch.trim()), // Convert comma-separated string to array
        model: filters.ModelName.split(',').map(model => model.trim()),
        type: filters.TargetType.split(',').map(type => type.trim()),
        alp: filters.AlpType.split(',').map(alp => alp.trim()),
        cpu: filters.CPU_Type.split(',').map(cpu => cpu.trim()),
        PartnerName: filters.PartnerName.split(',').map(partner => partner.trim()),
        StoreName: filters.StoreName.split(',').map(store => store.trim()),
        onApply: appliedFilters => {
          setFilters({
            branchName: appliedFilters.branches.join(', '), // Convert array back to comma-separated string
            ModelName: appliedFilters.model.join(', '),
            TargetType: appliedFilters.type.join(', '),
            AlpType: appliedFilters.alp.join(', '),
            CPU_Type: appliedFilters.cpu.join(', '),
            PartnerName: appliedFilters?.PartnerName?.join(', ') || '',
            StoreName: appliedFilters?.StoreName?.join(', ') || '',
          });
        },
        onReset: () => {
          console.log('Reset filters');
          setFilters({
            branchName:  '', // Preserve territory branch if provided
            ModelName: '',
            TargetType: '',
            AlpType: '',
            CPU_Type: '',
            PartnerName: '',
            StoreName: '',
          });
        },
      });
    }, [masterTab, filters]);
  const hasActiveFilters = Object.values(filters).some(value => value);
  return (
    <AppLayout needBack title="Activation Performance" needPadding needScroll>
      <DisclaimerNotice />
      <ActivationPerformanceView
        tabs={tabs}
        data={tabData}
        isLoading={isLoading}
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        onFilterPress={handleFilterPress}
        hasActiveFilters={hasActiveFilters}
      />
    </AppLayout>
  );
}
