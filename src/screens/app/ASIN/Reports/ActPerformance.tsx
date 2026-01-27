import {FlatList, TouchableOpacity, View} from 'react-native';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import AppLayout from '../../../../components/layout/AppLayout';
import AppIcon from '../../../../components/customs/AppIcon';
import AppText from '../../../../components/customs/AppText';
import AppDropdown, {
  AppDropdownItem,
} from '../../../../components/customs/AppDropdown';
import Card from '../../../../components/Card';
import AppTabBar, {TabItem} from '../../../../components/CustomTabBar';
import {ActivationData, TableColumn} from '../../../../types/dashboard';
import {convertToASINUnits} from '../../../../utils/commonFunctions';
import {useNavigation, useRoute} from '@react-navigation/native';
import {AppNavigationProp} from '../../../../types/navigation';
import {
  ACTIVATION_ID_TO_DATA_KEY,
  getActivationTabData,
  getCurrentTabConfig,
  TAB_LABEL_TO_ID,
} from '../Dashboard/dashboardUtils';

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

const ITEMS_PER_BATCH = 10;

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
  isAGPorALP,
  handlePress,
}: {
  item: ActivationData;
  isLast: boolean;
  columns: TableColumn[];
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
        <AppText>{String(item[column.dataKey] || '0')}</AppText>
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
  sortConfig,
  onSort,
  needNavigation,
}: {
  data: ActivationData[];
  activeTab: string;
  columns: TableColumn[];
  visibleCount: number;
  sortConfig: {key: string; direction: 'asc' | 'desc'} | null;
  onSort: (columnKey: string) => void;
  needNavigation: boolean;
}) => {
  const navigation = useNavigation<AppNavigationProp>();

  // Sort data based on sortConfig
  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    const sorted = [...data].sort((a, b) => {
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
  }, [data, sortConfig, columns]);

  const displayedData = useMemo(
    () => sortedData.slice(0, visibleCount),
    [sortedData, visibleCount],
  );

  const handlePress = useCallback(
    (name: string) => {
      if (!needNavigation) return;
      let AGP_Code = name.match(/\(([^)]+)\)/)?.[1];
      console.log('Extracted AGP_Code:', AGP_Code);
      navigation.navigate('TargetPartnerDashboard', {partner: {AGP_Code}});
    },
    [navigation, needNavigation],
  );

  const renderItem = useCallback(
    ({item, index}: {item: ActivationData; index: number}) => (
      <TableRow
        item={item}
        isLast={index === displayedData.length - 1}
        columns={columns}
        isAGPorALP={activeTab === 'agp' || activeTab === 'alp'}
        handlePress={handlePress}
      />
    ),
    [displayedData.length, columns, activeTab, handlePress],
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

const buildTabItems = (
  labels: string[],
  data: any,
  visibleCounts: Record<string, number>,
  sortConfigs: Record<string, {key: string; direction: 'asc' | 'desc'} | null>,
  handleSort: (tabId: string, columnKey: string) => void,
  needNavigation: boolean,
  filters: Record<string, string | null>,
): TabItem[] => {
  return labels.map(label => {
    const id = TAB_LABEL_TO_ID[label];
    const config = getCurrentTabConfig(id, false);
    const visibleCount = visibleCounts[id] || 10;
    const sortConfig = sortConfigs[id] || null;

    let tabData = getActivationTabData(data, id);
    
    // Apply filter if one is selected for this tab
    const selectedFilter = filters[id];
    if (selectedFilter && tabData) {
      tabData = tabData.filter(
        (item: ActivationData) =>
          String(item.name ?? '').toLowerCase() ===
          String(selectedFilter).toLowerCase(),
      );
    }
    
    // Determine the display label based on branch filter
    let displayLabel = label;
    return {
      label: displayLabel,
      name: id,
      component: (
        <View>
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
            sortConfig={sortConfig}
            onSort={columnKey => handleSort(id, columnKey)}
            needNavigation={needNavigation}
          />
        </View>
      ),
    } as TabItem;
  });
};

const ActivationPerformanceView = ({
  tabs,
  data,
  needNavigation,
}: {
  tabs: string[];
  data: any;
  needNavigation: boolean;
}) => {
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>(
    {},
  );
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [sortConfigs, setSortConfigs] = useState<
    Record<string, {key: string; direction: 'asc' | 'desc'} | null>
  >({});
  const [filters, setFilters] = useState<Record<string, string | null>>({});

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

  const handleTabChange = useCallback((tab: TabItem) => {
    setActiveTabId(tab.name);
  }, []);

  const providedTabs = useMemo(
    () => (tabs && tabs.length > 0 ? tabs : ['']),
    [tabs],
  ) as any;

  const tabItems: TabItem[] = useMemo(
    () =>
      buildTabItems(
        providedTabs,
        data,
        visibleCounts,
        sortConfigs,
        handleSort,
        needNavigation,
        filters,
      ),
    [
      providedTabs,
      data,
      visibleCounts,
      sortConfigs,
      handleSort,
      needNavigation,
      filters,
    ],
  );

  // Get the current tab's data (filtered if applicable) to calculate max items
  const activeTabData = useMemo(() => {
    if (!activeTabId) return [];
    let tabData = getActivationTabData(data, activeTabId) || [];
    
    // Apply filter if selected
    const selectedFilter = filters[activeTabId];
    if (selectedFilter) {
      tabData = tabData.filter(
        (item: ActivationData) =>
          String(item.name ?? '').toLowerCase() ===
          String(selectedFilter).toLowerCase(),
      );
    }
    
    return tabData;
  }, [data, activeTabId, filters]);

  const activeTabMaxItems = activeTabData.length;
  const activeTabVisibleCount = visibleCounts[activeTabId] || 10;
  const hasMoreItems = activeTabVisibleCount < activeTabMaxItems;
  const isFullyExpanded =
    activeTabVisibleCount >= activeTabMaxItems && activeTabMaxItems > 10;

  const handleToggleVisibility = useCallback(() => {
    if (!activeTabId) return;
    setVisibleCounts(prev => ({
      ...prev,
      [activeTabId]: isFullyExpanded
        ? ITEMS_PER_BATCH
        : (prev[activeTabId] || ITEMS_PER_BATCH) + ITEMS_PER_BATCH,
    }));
  }, [isFullyExpanded, activeTabId]);

  const initialActiveId =
    tabItems && tabItems.length > 0 ? tabItems[0]?.name : '';

  // Ensure activeTabId is initialized to the first tab
  useEffect(() => {
    if (!activeTabId && initialActiveId) {
      setActiveTabId(initialActiveId);
    }
  }, [activeTabId, initialActiveId]);

  const activeTabLabel = useMemo(() => {
    if (!activeTabId) return '';
    const match = tabs.find(label => TAB_LABEL_TO_ID[label] === activeTabId);
    return match || '';
  }, [tabs, activeTabId]);

  const dropdownOptions = useMemo(() => {
    if (!activeTabId) return [];
    const tabData = getActivationTabData(data, activeTabId) || [];

    const seen = new Set<string>();
    return tabData.reduce((acc: AppDropdownItem[], item: ActivationData) => {
      const name = String(item.name ?? '').trim();
      if (!name || seen.has(name.toLowerCase())) return acc;
      seen.add(name.toLowerCase());
      acc.push({label: name, value: name});
      return acc;
    }, []);
  }, [data, activeTabId]);

  const handleFilterChange = useCallback(
    (item: AppDropdownItem | null) => {
      console.log('Filter changed:', item,activeTabId);
      if (!activeTabId) return;
      setFilters(prev => ({
        ...prev,
        [activeTabId]: item?.value || null,
      }));
      // Reset visible count for current tab when filter changes
      setVisibleCounts(prev => ({
        ...prev,
        [activeTabId]: ITEMS_PER_BATCH,
      }));
    },
    [activeTabId],
  );
  return (
    <View className="pb-5">
      <AppDropdown
        data={dropdownOptions}
        onSelect={handleFilterChange}
        selectedValue={filters[activeTabId] || null}
        placeholder={
          activeTabLabel ? `Select ${activeTabLabel} name` : 'Select name'
        }
        mode="autocomplete"
        allowClear
        onClear={() => handleFilterChange(null)}
        style={{marginBottom: 10}}
      />
      <Card
        className="p-1 border border-slate-200 dark:border-gray-700"
        noshadow
        needSeeMore={hasMoreItems || isFullyExpanded}
        seeMoreText={isFullyExpanded ? 'Show Less' : 'Load More'}
        seeMoreOnPress={handleToggleVisibility}>
        <View className="pt-3 overflow-hidden">
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

export default function ActPerformance() {
  const route = useRoute();
  const params = route.params as Record<string, any>;
  const fromPartnerScreen = params?.fromPartnerScreen || false;
  const [tabLabels, transformedData] = useMemo(() => {
    const ORDER = ['Branch', 'ALP', 'Model', 'AGP', 'ASP', 'Disti'];

    if (!params) return [[], {}];

    const topKeys = Object.keys(params).filter(key =>
      key.toLowerCase().startsWith('top'),
    );

    const labels = topKeys
      .map(key => key.replace(/top5/i, ''))
      .sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));

    const transformedData = topKeys.reduce(
      (acc, key) => {
        const items = params[key];
        if (items && Array.isArray(items) && items.length > 0) {
          acc[key === 'TOP5ALP' ? 'Top5ALP' : key] = items.map((item: any) => ({
            ...item,
            name:
              key === 'Top5Branch'
                ? item['Top_Branch_Territory']
                : key === 'Top5AGP'
                  ? `${item[`Top_5_${key.replace(/top5/i, '')}`]} \n-(${item.AGP_Code || 'N/A'})`
                  : key === 'TOP5ALP'
                    ? `${item[`Top_5_${key.replace(/top5/i, '')}`]} \n-(${item.ALP_Code || 'N/A'})`
                    : item[`Top_5_${key.replace(/top5/i, '')}`],
            SO_Cnt: item.SO_Cnt || item.SellOut_Qty || '0',
          }));
        }
        return acc;
      },
      {} as Record<string, any[]>,
    );
    return [labels, transformedData];
  }, [params]);
  return (
    <AppLayout title="Activation Performance" needBack needScroll>
      <View className="flex-1 px-3">
        <DisclaimerNotice />
        <ActivationPerformanceView
          data={transformedData}
          tabs={tabLabels}
          needNavigation={fromPartnerScreen}
        />
      </View>
    </AppLayout>
  );
}
