import {FlatList, TouchableOpacity, View} from 'react-native';
import {useCallback, useMemo, useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {useNavigation, useRoute} from '@react-navigation/native';
import moment from 'moment';
import AppLayout from '../../../../components/layout/AppLayout';
import AppIcon from '../../../../components/customs/AppIcon';
import AppText from '../../../../components/customs/AppText';
import AppInput from '../../../../components/customs/AppInput';
import AppDatePicker, {DatePickerState} from '../../../../components/customs/AppDatePicker';
import Card from '../../../../components/Card';
import AppTabBar, {TabItem} from '../../../../components/CustomTabBar';
import {ActivationPerformanceSkeleton} from '../../../../components/skeleton/DashboardSkeleton';
import {
  convertToASINUnits,
  getDaysBetween,
  isEmptyData,
} from '../../../../utils/commonFunctions';
import {handleASINApiCall} from '../../../../utils/handleApiCall';
import {useLoginStore} from '../../../../stores/useLoginStore';
import {ActivationData, TableColumn} from '../../../../types/dashboard';
import {
  DEFAULT_ACTIVATION_TABS,
  getCurrentTabConfig,
  getActivationTabData,
  TAB_LABEL_TO_ID,
  deriveInitialActiveId,
  ACTIVATION_ID_TO_DATA_KEY,
} from '../Dashboard/dashboardUtils';
import {showActivationFilterSheet} from './ActivationFilterSheet';
import AppDropdown, {
  AppDropdownItem,
} from '../../../../components/customs/AppDropdown';
import clsx from 'clsx';
import {AppNavigationProp} from '../../../../types/navigation';
import { ASUS } from '../../../../utils/constant';
import { Watermark } from '../../../../components/Watermark';

const ITEMS_PER_BATCH = 10;
interface ApiParams {
  masterTab: string;
  StartDate: Date;
  EndDate: Date;
  branchName?: string;
  AlpType?: string;
  ModelName?: string;
  TargetType?: string;
  CPU_Type?: string;
  GPU_Type?: string;
}

// Custom hook to fetch activation performance data
const useFetchActivationData = (params: ApiParams) => {
  const {EMP_Code: employeeCode = '', EMP_RoleId: RoleId = ''} = useLoginStore(
    state => state.userInfo,
  );

  const queryPayload = {
    employeeCode,
    RoleId,
    masterTab: params.masterTab,
    StartDate: params.StartDate,
    EndDate: params.EndDate,
    branchName: params.branchName || '',
    AlpType: params.AlpType || '',
    ModelName: params.ModelName || '',
    TargetType: params.TargetType || '',
    CPU_Type: params.CPU_Type || '',
    GPU_Type: params.GPU_Type || '',
  };

  return useQuery({
    queryKey: ['dashboardActivationViewMore', ...Object.values(queryPayload)],
    queryFn: async () => {
      const response = await handleASINApiCall(
        '/Dashboard/GetDashboardActivationViewMoreFilterApply_GPU',
        queryPayload,
      );
      const result = response?.DashboardData;
      if (!result?.Status) {
        throw new Error('Failed to fetch activation data');
      }
      return result.Datainfo || [];
    },
  });
};

// Disclaimer notice component
const DisclaimerNotice = () => (
  <View className="bg-red-50 rounded-xl p-3 mb-6 shadow-sm border border-red-600 mt-4">
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

// Table header with column labels and sorting
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

// Individual table row with data
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
    {columns.map(column => (
      <View
        key={column.key}
        className={`${column.width} ${column.key === 'name' ? 'flex-row items-center' : 'items-center'}`}>
        <HighlightedText
          text={String(item[column.dataKey] || '0')}
          searchQuery={searchQuery}
          className={clsx(
            `text-sm ${column.key === 'name' ? 'font-manropeSemibold' : 'font-manropeBold'} ${column.colorType === 'primary' ? 'text-blue-600' : column.colorType === 'success' ? 'text-green-600' : column.colorType === 'warning' ? 'text-amber-600' : column.colorType === 'secondary' ? 'text-gray-600' : 'text-gray-800'} ${column.key === 'name' && isAGPorALP && 'text-primary underline'}`,
          )}
        />
      </View>
    ))}
  </TouchableOpacity>
);

// Totals row component to display column sums
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
        } else {
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
              : convertToASINUnits(Number(columnTotals[column.key]), true)}
          </AppText>
        </View>
      ))}
    </View>
  );
};

// Optimized data table with FlatList and pagination
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
      navigation.navigate('TargetPartnerDashboard', {partner: {AGP_Code}});
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

// Date range selector card
const DateRangeSelector = ({
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
                ? `${moment(dateRange.start).format('MMM D, YYYY')} - ${moment(dateRange.end).format('MMM D, YYYY')}`
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

// Filter button card
const FilterButton = ({
  onPress,
  hasActiveFilters,
}: {
  onPress: () => void;
  hasActiveFilters?: boolean;
}) => (
  <Card className="mb-3 rounded p-0">
    <TouchableOpacity className="p-5" onPress={onPress}>
      <View className="items-center justify-center relative">
        <AppIcon
          name="tune-variant"
          size={20}
          color="#3B82F6"
          type="material-community"
        />
        {hasActiveFilters && (
          <View className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
        )}
      </View>
    </TouchableOpacity>
  </Card>
);

// Territory display component
const TerritoryDisplay = ({territory}: {territory: string}) => (
  <View className="mb-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
    <View className="flex-row items-center">
      <View className="w-10 h-10 bg-blue-500 rounded-full items-center justify-center mr-3">
        <AppIcon name="location" size={20} color="#FFFFFF" type="ionicons" />
      </View>
      <View className="flex-1">
        <AppText
          size="xs"
          className="text-blue-600 dark:text-blue-400 mb-1"
          weight="medium">
          Territory
        </AppText>
        <AppText
          size="lg"
          weight="bold"
          className="text-blue-800 dark:text-blue-200">
          {territory}
        </AppText>
      </View>
      <View className="bg-blue-100 dark:bg-blue-800 px-3 py-1.5 rounded-full">
        <AppText
          size="xs"
          weight="semibold"
          className="text-blue-700 dark:text-blue-300">
          Active
        </AppText>
      </View>
    </View>
  </View>
);

// Highlighted text component for search matches
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
          ? convertToASINUnits(Number(text), true)
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

// Search box component
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

// Build tab items with table components
const buildTabItems = (
  labels: string[],
  data: any,
  visibleCounts: Record<string, number>,
  searchQueries: Record<string, string>,
  handleSearchChange: (tabId: string, query: string) => void,
  sortConfigs: Record<string, {key: string; direction: 'asc' | 'desc'} | null>,
  handleSort: (tabId: string, columnKey: string) => void,
  selectedBranches: string[],
  cseName: AppDropdownItem | null,
  partnerType: AppDropdownItem | null,
): TabItem[] => {
  return labels.map(label => {
    const id = TAB_LABEL_TO_ID[label];
    const config = getCurrentTabConfig(id, false);
    const visibleCount = visibleCounts[id] || ITEMS_PER_BATCH;
    const searchQuery = searchQueries[id] || '';
    const sortConfig = sortConfigs[id] || null;

    let tabData = getActivationTabData(data, id);
    // Determine the display label based on branch filter
    let displayLabel = label;
    if (id === 'branch' && selectedBranches.length === 1) {
      // If exactly one branch is selected, show the branch name as the tab label
      displayLabel = selectedBranches[0];
    }
    if (id === 'agp') {
      if (cseName?.value) {
        tabData = tabData.filter(
          (item: ActivationData) => item.CSE_Name === cseName.value,
        );
      } else if (partnerType?.value) {
        tabData = tabData.filter(
          (item: ActivationData) => item.Partner_Type === partnerType.value,
        );
      }
    }
    return {
      label: displayLabel,
      name: id,
      component: (
        <View>
          <SearchBox
            value={searchQuery}
            onChangeText={text => handleSearchChange(id, text)}
            placeholder={`Search ${label}...`}
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
          <Watermark verticalCount={2} rowGap={200} />
        </View>
      ),
    } as TabItem;
  });
};

// Main activation performance view component
const ActivationPerformanceView = ({
  tabs,
  data,
  isLoading,
  dateRange,
  onDateRangeChange,
  onFilterPress,
  hasActiveFilters,
  selectedBranches,
  territory,
  cseList,
  partnerTypeList,
}: {
  tabs: string[];
  data: any;
  isLoading: boolean;
  dateRange: DatePickerState;
  onDateRangeChange: (startDate: Date, endDate: Date) => void;
  onFilterPress: () => void;
  hasActiveFilters?: boolean;
  selectedBranches: string[];
  territory?: string;
  cseList: {label: string; value: string}[];
  partnerTypeList: {label: string; value: string}[];
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
  const [cseName, setCseName] = useState<AppDropdownItem | null>(null);
  const [partnerType, setPartnerType] = useState<AppDropdownItem | null>({
    label: 'AGP',
    value: 'AGP',
  });

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
        selectedBranches,
        cseName,
        partnerType,
      ),
    [
      providedTabs,
      data,
      visibleCounts,
      searchQueries,
      selectedBranches,
      handleSearchChange,
      sortConfigs,
      handleSort,
      partnerType,
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
      {activeTabId === 'agp' && (
        <View className="flex-row justify-between items-center my-3">
          <AppDropdown
            mode="autocomplete"
            data={cseList}
            placeholder="Select CSE"
            onSelect={setCseName}
            selectedValue={cseName?.value}
            style={{width: '59%'}}
            allowClear
            onClear={() => setCseName(null)}
          />
          <AppDropdown
            mode="dropdown"
            data={partnerTypeList}
            placeholder="Select Type"
            onSelect={setPartnerType}
            selectedValue={partnerType?.value}
            style={{width: '40%'}}
          />
        </View>
      )}

      <AppDatePicker
        mode="dateRange"
        visible={isDatePickerVisible}
        onClose={() => setIsDatePickerVisible(false)}
        initialStartDate={dateRange.start}
        initialEndDate={dateRange.end}
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
          {territory && <TerritoryDisplay territory={territory} />}
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

// Main screen component
export default function ActPerformanceBranchWise() {
  const route = useRoute<any>();
  const {
    masterTab,
    StartDate,
    EndDate,
    Product_Category = '',
    Territory = '',
  } = route.params || {};
  const userInfo = useLoginStore(state => state.userInfo);
    const {BSM, BPM} = ASUS.ROLE_ID
    const isBranchManager = useMemo(() => {
      return [BSM,BPM].includes(userInfo?.EMP_RoleId as any);
    }, [userInfo?.EMP_RoleId]);

  // Date range state management
  const [dateRange, setDateRange] = useState<DatePickerState>({
    start: StartDate
      ? new Date(StartDate)
      : moment().startOf('quarter').toDate(),
    end: EndDate ? new Date(EndDate) : moment().toDate(),
  });

  // Filter state management
  const [filters, setFilters] = useState<{
    branches: string[];
    model: string[];
    type: string[];
    alp: string[];
    cpu: string[];
    gpu: string[];
  }>({
    branches: Territory ? [Territory] : [],
    model: [],
    type: Product_Category?.length ? [Product_Category] : [],
    alp: [],
    cpu: [],
    gpu: [],
  });

  const {data, isLoading} = useFetchActivationData({
    masterTab,
    StartDate: dateRange.start || moment().startOf('quarter').toDate(),
    EndDate: dateRange.end || moment().toDate(),
    branchName: filters.branches.join(','),
    AlpType: filters.alp.join(','),
    ModelName: filters.model.join(','),
    TargetType: filters.type.join(','),
    CPU_Type: filters.cpu.join(','),
    GPU_Type: filters.gpu.join(','),
  });

  // Transform and filter data for tabs
  const [tabLabels, transformedData] = useMemo(() => {
    const ORDER = ['Branch', 'ALP', 'Model', 'AGP', 'ASP', 'Disti'];

    if (!data) return [[], {}];

    const topKeys = Object.keys(data).filter(key =>
      key.toLowerCase().startsWith('top'),
    );

    let labels = topKeys
      .map(key => key.replace(/top5/i, ''))
      .sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));

       if (isBranchManager) {
      labels = ['Territory', ...labels.filter(tab => tab !== 'Branch')];
    }

    const transformedData = topKeys.reduce(
      (acc, key) => {
        const items = data[key];
        if (items && Array.isArray(items) && items.length > 0) {
          const name =  key === 'Top5Branch' ?
            'Top_Branch_Territory' : key === 'Top5AGP' ?
              `Top_${key.replace(/top5/i, '')}` :
              key === 'TOP5ALP' ?
                `Top_${key.replace(/top5/i, '')}` :
                `Top_${key.replace(/top5/i, '')}`;

          acc[key === 'TOP5ALP' ? 'Top5ALP' : key] = items.map((item: any) => ({
            ...item,
            name: item[name],
            SO_Cnt: item.SO_Cnt || item.SellOut_Qty || '0',
          }));
        }
        return acc;
      },
      {} as Record<string, any[]>,
    );
    return [labels, transformedData];
  }, [data, isBranchManager]);

  const CSEList = useMemo(() => {
    const branchData = transformedData['Top5AGP'] || [];
    const cseSet = new Set<string>();
    branchData.forEach(item => {
      if (item.CSE_Name) {
        cseSet.add(item.CSE_Name);
      }
    });
    return Array.from(cseSet).map(name => ({label: name, value: name}));
  }, [data]);

  const PartnerTypeList = useMemo(() => {
    const branchData = transformedData['Top5AGP'] || [];
    const partnerTypeSet = new Set<string>();
    branchData.forEach(item => {
      if (item.Partner_Type) {
        let type = isEmptyData(item.Partner_Type) ? 'T3' : item.Partner_Type;
        partnerTypeSet.add(type);
      }
    });
    return Array.from(partnerTypeSet).map(name => ({label: name, value: name}));
  }, [data]);

  // Handle date range change and refetch data
  const handleDateRangeChange = useCallback(
    (startDate: Date, endDate: Date) => {
      setDateRange({start: startDate, end: endDate});
    },
    [],
  );

  // Handle filter button press
  const handleFilterPress = useCallback(() => {
    showActivationFilterSheet({
      masterTab,
      territory: Territory, // Pass territory to hide branch filter if provided
      // Pass current filter values
      branches: filters.branches,
      model: filters.model,
      type: filters.type,
      alp: filters.alp,
      cpu: filters.cpu,
      gpu: filters.gpu,
      onApply: appliedFilters => {
        setFilters({
          branches: appliedFilters.branches,
          model: appliedFilters.model,
          type: appliedFilters.type,
          alp: appliedFilters.alp,
          cpu: appliedFilters.cpu,
          gpu: appliedFilters.gpu,
        });
      },
      onReset: () => {
        console.log('Reset filters');
        setFilters({
          branches: Territory ? [Territory] : [], // Preserve territory branch if provided
          model: [],
          type: [],
          alp: [],
          cpu: [],
          gpu: [],
        });
      },
    });
  }, [masterTab, filters, Territory]);

  // Check if any filters are active (exclude territory branch from count)
  const hasActiveFilters = useMemo(() => {
    const branchFilterActive = Territory
      ? filters.branches.length > 1 ||
        (filters.branches.length === 1 && filters.branches[0] !== Territory)
      : filters.branches.length > 0;

    return (
      branchFilterActive ||
      filters.model.length > 0 ||
      filters.type.length > 0 ||
      filters.alp.length > 0 ||
      filters.cpu.length > 0 ||
      filters.gpu.length > 0
    );
  }, [filters, Territory]);

  return (
    <AppLayout title="Activation Performance" needBack needPadding needScroll>
      <DisclaimerNotice />
      <ActivationPerformanceView
        tabs={tabLabels}
        data={transformedData}
        isLoading={isLoading}
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        onFilterPress={handleFilterPress}
        hasActiveFilters={hasActiveFilters}
        selectedBranches={filters.branches}
        territory={Territory}
        cseList={CSEList}
        partnerTypeList={PartnerTypeList}
      />
    </AppLayout>
  );
}