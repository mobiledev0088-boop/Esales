import {
  FlatList,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import {use, useCallback, useMemo, useState} from 'react';
import MaterialTabBar from '../../../../components/MaterialTabBar';
import AppDropdown, {
  AppDropdownItem,
} from '../../../../components/customs/AppDropdown';
import {
  formatUnique,
  getPastQuarters,
  isEmptyData,
} from '../../../../utils/commonFunctions';
import {
  DemoItemLFR,
  DemoItemRetailer,
  DemoItemROI,
  ResellerFilterType,
  transformDemoData,
  transformDemoDataLFR,
  transformDemoDataRetailer,
  transformDemoDataROI,
  TransformedBranchRes,
  TransformedBranchRet,
  TransformedBranchROI,
} from './utils';
import {
  BranchCard,
  BranchCardLFR,
  BranchCardRet,
  BranchCardROI,
  DemoSkeleton,
  StatsHeader,
  // StatsHeaderRetailer,
  StatsHeaderROI,
  SummaryOverView,
} from './components';
import {
  useGetDemoCategories,
  useGetDemoCategoriesLFR,
  useGetDemoCategoriesRet,
  useGetDemoDataLFR,
  useGetDemoDataROI,
  useGetDemoDataReseller,
  useGetDemoDataRetailer,
} from '../../../../hooks/queries/demo';
import FilterButton from '../../../../components/FilterButton';
import {showDemoFilterSheet} from './DemoFilterSheet';
import {DataStateView} from '../../../../components/DataStateView';
import {useLoginStore} from '../../../../stores/useLoginStore';
import {ASUS} from '../../../../utils/constant';
import {useThemeStore} from '../../../../stores/useThemeStore';
import AppText from '../../../../components/customs/AppText';
import {useDemoFilterStore} from '../../../../stores/useDemoFilterStore';
import { calculatePercentage } from '../Dashboard/dashboardUtils';

const Reseller = () => {
  const quarters = useMemo(() => getPastQuarters(), []);
  const isDarkMode = useThemeStore(state => state.AppTheme === 'dark');
  const [selectedQuarter, setSelectedQuarter] =
    useState<AppDropdownItem | null>(quarters?.[0] ?? null);
  const [selectedPartnerName, setSelectedPartnerName] =
    useState<AppDropdownItem | null>(null);
  
  // Use Zustand store for Reseller filters
  const filters = useDemoFilterStore(state => state.resellerFilters);
  const setFilters = useDemoFilterStore(state => state.setResellerFilters);
  const resetFilters = useDemoFilterStore(state => state.resetResellerFilters);
  const {EMP_RoleId: role_id} = useLoginStore(state => state.userInfo);
  const {LFR_HO, ONLINE_HO, AM, TM, SALES_REPS} = ASUS.ROLE_ID;
  const noTerritoryButton = [LFR_HO, ONLINE_HO, AM, TM, SALES_REPS].includes(
    role_id as any,
  );

  const {data, isLoading, error, refetch} = useGetDemoDataReseller(
    selectedQuarter?.value ?? '',
    filters.category,
    filters.pKiosk,
    filters.rogKiosk,
  );
  const {data: categoriesData, refetch: refetchCategories} =
    useGetDemoCategories(selectedQuarter?.value || '');

  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredData = useMemo(() => {
    if (!data)
      return {
        DemoDetailsList: [],
        PartnerCount: [],
      };
    let temp = data.DemoDetailsList;
    if (selectedPartnerName?.value) {
      temp = temp.filter(
        (item: any) => item.AGP_Name.trim() === selectedPartnerName.value,
      );
    }
    console.log('filters.partnerType', filters.partnerType);
    // Handle multi-select partner type filtering
    if (filters.partnerType && filters.partnerType.length > 0) {
      temp = temp.filter(
        (item: any) => filters.partnerType.includes(item.AGP_Or_T3.trim()),
      );
    }
    console.log('filteredData', temp);
    return {
      DemoDetailsList: temp,
      PartnerCount: data.PartnerCount,
    };
  }, [data, selectedPartnerName?.value, filters.partnerType]);

  const transformedData = useMemo(() => {
    if (!filteredData) return [];
    return transformDemoData(filteredData);
  }, [filteredData]);

  const PartnerNameList = useMemo(() => {
    if (!transformedData.length) return [];
    const namesSet = new Set<string>();
    transformedData.forEach(branch => {
      branch.partners.forEach(partner => {
        if (partner.AGP_Name && partner.AGP_Name.trim()) {
          namesSet.add(partner.AGP_Name.trim());
        }
      });
    });
    return Array.from(namesSet)
      .sort()
      .map(name => ({
        label: name,
        value: name,
      }));
  }, [transformedData]);

  const PartnerTypeList = useMemo(() => {
    if (!data?.DemoDetailsList?.length) return [];
    const filter = formatUnique(data.DemoDetailsList, 'AGP_Or_T3').sort(
      (a, b) => a.label.localeCompare(b.label),
    );
    return filter;
  }, [data]);

  const summaryData = useMemo(() => {
    if (!transformedData || transformedData.length === 0) {
      return {
        at_least_single_demo: 0,
        demo_100: 0,
        total_partners: 0,
        pending: 0,
        awp_partners: 0,
      };
    }

    return transformedData.reduce(
      (acc, branch) => ({
        at_least_single_demo:
          acc.at_least_single_demo + branch.at_least_single_demo,
        demo_100: acc.demo_100 + branch.demo_100,
        pending: acc.pending + branch.pending,
        total_partners: acc.total_partners + branch.partner_count,
        awp_partners: acc.awp_partners + branch.awp_Count,
      }),
      {
        at_least_single_demo: 0,
        demo_100: 0,
        total_partners: 0,
        pending: 0,
        awp_partners: 0,
      },
    );
  }, [transformedData]);

  const renderBranch = useCallback(
    ({item}: {item: TransformedBranchRes}) => {
      return (
        <BranchCard
          item={item}
          summaryData={summaryData}
          yearQtr={selectedQuarter?.value || ''}
          category={filters.category || 'All'}
          premiumKiosk={filters.pKiosk ?? null}
          rogKiosk={filters.rogKiosk ?? null}
          partnerType={filters.partnerType.length > 0 ? filters.partnerType.join(', ') : null}
          noTerritoryButton={noTerritoryButton}
          isDarkMode={isDarkMode}
        />
      );
    },
    [summaryData, selectedQuarter, filters, noTerritoryButton, isDarkMode],
  );

  const stats = useMemo(
    () =>
      [
        {
          label: 'Single Demo',
          value: summaryData.at_least_single_demo,
          icon: 'laptop-outline',
          iconType: 'ionicons',
          name: 'lap_icon',
        },
        {
          label: '100% Demo',
          value: summaryData.demo_100,
          icon: 'percent',
          iconType: 'feather',
          name: 'perc_icon',
        },
        {
          label: 'Pending',
          value:
            summaryData.total_partners -
            summaryData.demo_100 -
            summaryData.at_least_single_demo,
          icon: 'pause-circle',
          iconType: 'feather',
          name: 'pause_icon',
        },
      ] as any,
    [summaryData],
  );

  // Build pills from active filters
  const pills = useMemo(() => {
    const pillsArray: { key: string; label: string }[] = [];
    
    try {
      // Add category pill if set and not 'All'
      if (filters.category && filters.category !== 'All') {
        pillsArray.push({ 
          key: 'category', 
          label: filters.category 
        });
      }
      
      // Add pKiosk pill if set
      if (filters.pKiosk !== null && filters.pKiosk !== undefined) {
        pillsArray.push({ 
          key: 'pKiosk', 
          label: `P-Kiosk: ${filters.pKiosk}` 
        });
      }
      
      // Add rogKiosk pill if set
      if (filters.rogKiosk !== null && filters.rogKiosk !== undefined) {
        pillsArray.push({ 
          key: 'rogKiosk', 
          label: `ROG-Kiosk: ${filters.rogKiosk}` 
        });
      }
      
      // Add partnerType pill if set (multi-select support)
      if (filters.partnerType && filters.partnerType.length > 0) {
        pillsArray.push({ 
          key: 'partnerType', 
          label: filters.partnerType.join(', ')
        });
      }
      
      // Add selected partner pill if set
      if (selectedPartnerName?.value && selectedPartnerName?.label) {
        pillsArray.push({ 
          key: 'partnerName', 
          label: selectedPartnerName.label 
        });
      }
    } catch (error) {
      console.error('Error building pills:', error);
    }
    
    return pillsArray;
  }, [filters.category, filters.pKiosk, filters.rogKiosk, filters.partnerType, selectedPartnerName]);

  const handleFilter = useCallback(() => {
    const arr = Array.from({length: 6}, (_, i) => ({
      label: String(i),
      value: i,
    }));
    showDemoFilterSheet({
      filters: {
        ...filters,
      },
      data: {
        category: categoriesData,
        pKiosk: arr,
        rogKiosk: arr,
        partnerType: PartnerTypeList,
      },
      compulsory: ['category'],
      multiSelect: ['partnerType'], // Enable multi-select for partner type
      loading: false,
      onApply: appliedFilters => {
        setFilters({
          category: String(appliedFilters.category) || 'All',
          pKiosk: !isEmptyData(appliedFilters.pKiosk)
            ? Number(appliedFilters.pKiosk)
            : null,
          rogKiosk: !isEmptyData(appliedFilters.rogKiosk)
            ? Number(appliedFilters.rogKiosk)
            : null,
          partnerType: Array.isArray(appliedFilters.partnerType)
            ? appliedFilters.partnerType as string[]
            : [],
        });
      },
      onReset: () => {
        console.log('reset filters');
        resetFilters();
      },
    });
  }, [filters, categoriesData, PartnerNameList, PartnerTypeList]);

  const keyExtractor = useCallback((item: TransformedBranchRes) => item.id, []);
  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    try {
      refetch();
      refetchCategories();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch, refetchCategories]);
  const isError = !!error && transformedData.length === 0;
  const isEmpty = !isLoading && !error && transformedData.length === 0;
  return (
    <ScrollView
      className="flex-1 bg-lightBg-base dark:bg-darkBg-base"
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }>
      <View className="flex-row justify-end gap-x-2 px-3 pt-2 mb-1 ">
        <AppDropdown
          mode="dropdown"
          data={quarters}
          selectedValue={selectedQuarter?.value}
          onSelect={setSelectedQuarter}
          placeholder="Select Quarter"
          zIndex={1000}
          style={{width: 125}}
        />
        <FilterButton
          onPress={handleFilter}
          containerClassName="p-3 border border-[#ccc] dark:border-[#444] rounded-lg "
          noShadow
          hasActiveFilters={Object.values(filters).some(
            val => val !== null && val !== '',
          )}
        />
      </View>
      {pills.length > 0 && (
        <View className="flex-row flex-wrap mb-3 px-3 -mx-1 items-center">
          <AppText>Selected Filters: </AppText>
          <ScrollView horizontal>
          {pills.map(p => (
            <View key={p.key} className="px-1 py-1">
              <TouchableOpacity
                activeOpacity={0.7}
                className="flex-row items-center bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700 rounded-full pl-3 pr-2 py-1">
                <AppText
                  size="xs"
                  weight="medium"
                  className="text-blue-700 dark:text-blue-300 mr-1">
                  {p.label}
                </AppText>
              </TouchableOpacity>
            </View>
          ))}
          </ScrollView>
        </View>
      )}
      <View className="px-3 pt-2 mb-3">
        <AppDropdown
          mode="autocomplete"
          data={PartnerNameList}
          selectedValue={selectedPartnerName?.value}
          onSelect={setSelectedPartnerName}
          placeholder="Select Partner Name"
          allowClear
          onClear={() => setSelectedPartnerName(null)}
          zIndex={900}
        />
      </View>
      <DataStateView
        isLoading={isLoading}
        isError={isError}
        isEmpty={isEmpty}
        onRetry={handleRetry}
        LoadingComponent={<DemoSkeleton />}>
        <FlatList
          data={transformedData}
          renderItem={renderBranch}
          keyExtractor={keyExtractor}
          contentContainerClassName="pb-10 px-3"
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <StatsHeader
              stats={stats}
              counts={{
                awp_count: summaryData.awp_partners,
                total_partners: summaryData.total_partners,
              }}
            />
          }
          scrollEnabled={false}
        />
      </DataStateView>
    </ScrollView>
  );
};

const Retailer = () => {
  const quarters = useMemo(() => getPastQuarters(), []);
  const [selectedQuarter, setSelectedQuarter] =
    useState<AppDropdownItem | null>(quarters[0]);
  const [selectedPartnerName, setSelectedPartnerName] =
    useState<AppDropdownItem | null>(null);

  // Use Zustand store for Retailer filters
  const filters = useDemoFilterStore(state => state.retailerFilters);
  const setFilters = useDemoFilterStore(state => state.setRetailerFilters);
  const resetFilters = useDemoFilterStore(state => state.resetRetailerFilters);

  const {EMP_RoleId: role_id} = useLoginStore(state => state.userInfo);
  const {LFR_HO, ONLINE_HO, AM, TM, SALES_REPS} = ASUS.ROLE_ID;
  const noTerritoryButton = [LFR_HO, ONLINE_HO, AM, TM, SALES_REPS].includes(
    role_id as any,
  );

  const {data, isLoading, error, refetch} = useGetDemoDataRetailer(
    selectedQuarter?.value || '',
    filters.category,
    filters.compulsory,
  );
  const {
    data: categoriesData,
    isLoading: isCategoriesLoading,
    refetch: refetchCategories,
  } = useGetDemoCategoriesRet(selectedQuarter?.value || '');

  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredData = useMemo(() => {
    if (!data) return null;
    let temp = data;
    if (selectedPartnerName?.value) {
      temp = temp.filter(
        (item: DemoItemRetailer) =>
          item.PartnerName === selectedPartnerName.value,
      );
    }
    // Handle multi-select partner type filtering
    if (filters.partnerType && filters.partnerType.length > 0) {
      return temp.filter(
        (item: DemoItemRetailer) => filters.partnerType.includes(item.PartnerType),
      );
    }
    return temp;
  }, [data, filters.partnerType, selectedPartnerName?.value]);

  const transformedData = useMemo(() => {
    if (filteredData) {
      return transformDemoDataRetailer(filteredData, {
        groupType: 'branch',
        labelKey: 'state',
      });
    } else {
      return [];
    }
  }, [filteredData]);

  const summaryData = useMemo(() => {
    if (!transformedData || transformedData.length === 0) {
      return {
        at_least_single_demo: 0,
        at_80_demo: 0,
        demo_100: 0,
        pending: 0,
        total_partners: 0,
      };
    }
    return transformedData.reduce(
      (acc, branch) => ({
        at_least_single_demo:
          acc.at_least_single_demo + branch.at_least_single_demo,
        at_80_demo: acc.at_80_demo + (branch.at_80_demo || 0),
        demo_100: acc.demo_100 + branch.demo_100,
        pending: acc.pending + branch.pending,
        total_partners: acc.total_partners + branch.partner_count,
      }),
      {
        at_least_single_demo: 0,
        at_80_demo: 0,
        demo_100: 0,
        pending: 0,
        total_partners: 0,
      },
    );
  }, [transformedData]);

  const renderBranch = useCallback(
    ({item}: {item: TransformedBranchRet}) => (
      <BranchCardRet
        item={item}
        summaryData={summaryData}
        yearQtr={selectedQuarter?.value || ''}
        partnerType={filters.partnerType.length > 0 ? filters.partnerType.join(', ') : null}
        category={filters.category || 'All'}
        IsCompulsory={filters.compulsory || ''}
        noTerritoryButton={noTerritoryButton}
      />
    ),
    [summaryData, selectedQuarter, filters, noTerritoryButton],
  );

  const partnerNameList = useMemo(() => {
    if (!transformedData.length) return [];
    const namesSet = new Set<string>();
    transformedData.forEach(branch => {
      branch.partners.forEach(partner => {
        if (partner.PartnerName && partner.PartnerName.trim()) {
          namesSet.add(partner.PartnerName.trim());
        }
      });
    });
    return Array.from(namesSet)
      .sort()
      .map(name => ({
        label: name,
        value: name,
      }));
  }, [transformedData]);

  const partnerTypeList = useMemo(() => {
    if (!data?.length) return [];
    const filter = formatUnique(data, 'PartnerType').sort((a, b) =>
      a.label.localeCompare(b.label),
    );
    return filter;
  }, [data]);

  const keyExtractor = useCallback((it: TransformedBranchRet) => it.id, []);

  const stats = useMemo(() => {
    return [
      {
        label: 'Single Demo',
        value: summaryData.at_least_single_demo,
        percentage: calculatePercentage(summaryData.at_least_single_demo, summaryData.total_partners),
        totalStores: summaryData.total_partners,
        icon: 'laptop-outline',
        iconType: 'ionicons',
        name: 'lap_icon',
      },
      {
        label: '80% Demo',
        value: summaryData.at_80_demo,
        percentage: calculatePercentage(summaryData.at_80_demo, summaryData.total_partners),
        totalStores: summaryData.total_partners,
        icon: 'trending-up',
        iconType: 'feather',
        name: 'grow_icon',
      },
      {
        label: '100% Demo',
        value: summaryData.demo_100,
        percentage: calculatePercentage(summaryData.demo_100, summaryData.total_partners),
        totalStores: summaryData.total_partners,
        icon: 'percent',
        iconType: 'feather',
        name: 'perc_icon',
      },
      // {
      //   label: 'ACT',
      //   value: '501',
      //   percentage: '22127',
      //   totalStores: summaryData.total_partners,
      //   icon: 'percent',
      //   iconType: 'feather',
      //   name: 'perc_icon',
      // },
      // {
      //   label: 'Stock',
      //   percentage: '25553',
      //   value: '501',
      //   totalStores: summaryData.total_partners,
      //   icon: 'percent',
      //   iconType: 'feather',
      //   name: 'perc_icon',
      // },
      {
        label: 'Pending',
        value:
          summaryData.total_partners -
          summaryData.demo_100 -
          summaryData.at_80_demo -
          summaryData.at_least_single_demo,
        icon: 'pause-circle',
        iconType: 'feather',
        name: 'pause_icon',
      },
    ] as any;
  }, [summaryData]);

  // Build pills from active filters
  const pills = useMemo(() => {
    const pillsArray: { key: string; label: string }[] = [];
    
    try {
      // Add category pill if set and not 'All'
      if (filters.category && filters.category !== 'All') {
        pillsArray.push({ 
          key: 'category', 
          label: filters.category 
        });
      }
      
      // Add compulsory pill if set
      if (filters.compulsory) {
        const compulsoryLabel = filters.compulsory === 'bonus' ? 'Bonus' : 'No Penalty';
        pillsArray.push({ 
          key: 'compulsory', 
          label: compulsoryLabel 
        });
      }
      
      // Add partnerType pill if set (multi-select support)
      if (filters.partnerType && filters.partnerType.length > 0) {
        pillsArray.push({ 
          key: 'partnerType', 
          label: filters.partnerType.join(', ')
        });
      }
      
      // Add selected partner pill if set
      if (selectedPartnerName?.value && selectedPartnerName?.label) {
        pillsArray.push({ 
          key: 'partnerName', 
          label: selectedPartnerName.label 
        });
      }
    } catch (error) {
      console.error('Error building pills:', error);
    }
    
    return pillsArray;
  }, [filters.category, filters.compulsory, filters.partnerType, selectedPartnerName]);

  const handleFilter = useCallback(() => {
    showDemoFilterSheet({
      filters: {...filters},
      data: {
        category: categoriesData,
        compulsory: [
          {label: 'Bonus', value: 'bonus'},
          {label: 'No Penalty', value: 'nopenalty'},
        ],
        partnerType: partnerTypeList,
      },
      compulsory: ['category', 'compulsory'],
      multiSelect: ['partnerType'], // Enable multi-select for partner type
      loading: isCategoriesLoading,
      onApply: appliedFilters => {
        setFilters({
          category: String(appliedFilters?.category) || 'All',
          compulsory: String(appliedFilters?.compulsory) || 'bonus', // nopenalty
          partnerType: Array.isArray(appliedFilters?.partnerType)
            ? appliedFilters.partnerType as string[]
            : [],
        });
      },
      onReset: () => {
        resetFilters();
      },
    });
  }, [filters, partnerTypeList]);
  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    try {
      refetch();
      refetchCategories();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch, refetchCategories]);
  const isError = !!error && transformedData.length === 0;
  const isEmpty = !isLoading && !error && transformedData.length === 0;
  return (
    <ScrollView
      className="flex-1 bg-lightBg-base dark:bg-darkBg-base"
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }>
      <View className="flex-row justify-end gap-x-2 px-3 pt-2 mb-1">
        <AppDropdown
          mode="dropdown"
          data={quarters}
          selectedValue={selectedQuarter?.value}
          onSelect={setSelectedQuarter}
          placeholder="Select Quarter"
          zIndex={1000}
          style={{width: 125}}
        />
        <FilterButton
          onPress={handleFilter}
          containerClassName="p-3 border border-[#ccc] dark:border-[#444] rounded-lg "
          noShadow
          hasActiveFilters={Object.values(filters).some(
            val => val !== null && val !== '',
          )}
        />
      </View>
      {pills.length > 0 && (
        <View className="flex-row flex-wrap mb-3 px-3 -mx-1 items-center">
           <AppText>Selected Filters: </AppText>
          <ScrollView horizontal>
          {pills.map(p => (
            <View key={p.key} className="px-1 py-1">
              <TouchableOpacity
                activeOpacity={0.7}
                className="flex-row items-center bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700 rounded-full pl-3 pr-2 py-1">
                <AppText
                  size="xs"
                  weight="medium"
                  className="text-blue-700 dark:text-blue-300 mr-1">
                  {p.label}
                </AppText>
              </TouchableOpacity>
            </View>
          ))}
          </ScrollView>
        </View>
      )}
      <View className="px-3 ">
        <AppDropdown
          mode="autocomplete"
          data={partnerNameList}
          selectedValue={selectedPartnerName?.value}
          onSelect={setSelectedPartnerName}
          placeholder="Select Partner Name"
          allowClear
          onClear={() => setSelectedPartnerName(null)}
          zIndex={900}
        />
      </View>
      {(isEmpty || isError) && (
        <View className="px-3">
          <SummaryOverView />
        </View>
      )}
      <DataStateView
        isLoading={isLoading}
        isError={isError}
        isEmpty={isEmpty}
        onRetry={handleRetry}
        LoadingComponent={<DemoSkeleton />}>
        <FlatList
          data={transformedData}
          keyExtractor={keyExtractor}
          renderItem={renderBranch}
          contentContainerClassName="pt-5 pb-10 px-3"
          showsVerticalScrollIndicator={false}
          maxToRenderPerBatch={16}
          ListHeaderComponent={
            <StatsHeader
              stats={stats}
              counts={{
                awp_count: null,
                total_partners: summaryData.total_partners,
              }}
              isRetailer={true}
            />
          }
          scrollEnabled={false}
        />
      </DataStateView>
    </ScrollView>
  );
};

const LFR = () => {
  const quarters = useMemo(() => getPastQuarters(), []);
  const [selectedQuarter, setSelectedQuarter] =
    useState<AppDropdownItem | null>(quarters[0]);
  const [selectedPartnerName, setSelectedPartnerName] =
    useState<AppDropdownItem | null>(null);

  // Use Zustand store for LFR filters
  const filters = useDemoFilterStore(state => state.lfrFilters);
  const setFilters = useDemoFilterStore(state => state.setLFRFilters);
  const resetFilters = useDemoFilterStore(state => state.resetLFRFilters);
  const {data, isLoading, error, refetch} = useGetDemoDataLFR(
    selectedQuarter?.value || '',
    filters?.category,
  );

  const {
    data: categoriesData,
    isLoading: isCategoriesLoading,
    refetch: refetchCategories,
  } = useGetDemoCategoriesLFR(selectedQuarter?.value || '');

  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredData = useMemo(() => {
    if (!data) return null;
    let temp = data;
    if (selectedPartnerName?.value) {
      return temp.filter(
        (item: DemoItemLFR) => item.PartnerName === selectedPartnerName.value,
      );
    }
    // Handle multi-select LFR type filtering
    if (filters.lfrType && filters.lfrType.length > 0) {
      return temp.filter(
        (item: DemoItemLFR) => filters.lfrType.includes(item.PartnerType),
      );
    }
    return temp;
  }, [data, filters.lfrType, selectedPartnerName?.value]);

  const transformedData = useMemo(() => {
    if (filteredData) {
      return transformDemoDataLFR(filteredData);
    } else {
      return [];
    }
  }, [filteredData]);

  const summaryData = useMemo(() => {
    if (!transformedData || transformedData.length === 0) {
      return {
        at_least_single_demo: 0,
        at_80_demo: 0,
        demo_100: 0,
        pending: 0,
        total_partners: 0,
      };
    }
    return transformedData.reduce(
      (acc, branch) => ({
        at_least_single_demo:
          acc.at_least_single_demo + branch.at_least_single_demo,
        at_80_demo: acc.at_80_demo + (branch.at_80_demo || 0),
        demo_100: acc.demo_100 + branch.demo_100,
        pending: acc.pending + branch.pending,
        total_partners: acc.total_partners + branch.partner_count,
      }),
      {
        at_least_single_demo: 0,
        at_80_demo: 0,
        demo_100: 0,
        pending: 0,
        total_partners: 0,
      },
    );
  }, [transformedData]);

  const partnerNameList = useMemo(() => {
    if (!transformedData.length) return [];
    const namesSet = new Set<string>();
    transformedData.forEach(branch => {
      branch.partners.forEach(partner => {
        if (partner.PartnerName && partner.PartnerName.trim()) {
          namesSet.add(partner.PartnerName.trim());
        }
      });
    });
    return Array.from(namesSet)
      .sort()
      .map(name => ({
        label: name,
        value: name,
      }));
  }, [transformedData]);

  const partnerTypeList = useMemo(() => {
    if (!data?.length) return [];
    const filter = formatUnique(data, 'PartnerType').sort((a, b) =>
      a.label.localeCompare(b.label),
    );
    return filter;
  }, [data]);

  const renderBranch = useCallback(
    ({item}: {item: TransformedBranchRet}) => (
      <BranchCardLFR
        item={item}
        summaryData={summaryData}
        yearQtr={selectedQuarter?.value || ''}
      />
    ),
    [summaryData, selectedQuarter, filters],
  );

  const keyExtractor = useCallback((it: TransformedBranchRet) => it.id, []);

  const stats = useMemo(() => {
    return [
      {
        label: 'Single Demo',
        value: summaryData.at_least_single_demo,
        icon: 'laptop-outline',
        iconType: 'ionicons',
        name: 'lap_icon',
      },
      {
        label: '80% Demo',
        value: summaryData.at_80_demo,
        icon: 'trending-up',
        iconType: 'feather',
        name: 'grow_icon',
      },
      {
        label: '100% Demo',
        value: summaryData.demo_100,
        icon: 'percent',
        iconType: 'feather',
        name: 'perc_icon',
      },
      {
        label: 'Pending',
        value:
          summaryData.total_partners -
          summaryData.demo_100 -
          summaryData.at_80_demo -
          summaryData.at_least_single_demo,
        icon: 'pause-circle',
        iconType: 'feather',
        name: 'pause_icon',
      },
    ] as any;
  }, [summaryData]);

  // Build pills from active filters
  const pills = useMemo(() => {
    const pillsArray: { key: string; label: string }[] = [];
    
    try {
      // Add lfrType pill if set and not 'All' (multi-select support)
      if (filters.lfrType && filters.lfrType.length > 0) {
        pillsArray.push({ 
          key: 'lfrType', 
          label: filters.lfrType.join(', ')
        });
      }
      
      // Add category pill if set and not 'All'
      if (filters.category && filters.category !== 'All') {
        pillsArray.push({ 
          key: 'category', 
          label: filters.category 
        });
      }
      
      // Add selected partner pill if set
      if (selectedPartnerName?.value && selectedPartnerName?.label) {
        pillsArray.push({ 
          key: 'partnerName', 
          label: selectedPartnerName.label 
        });
      }
    } catch (error) {
      console.error('Error building pills:', error);
    }
    
    return pillsArray;
  }, [filters.lfrType, filters.category, selectedPartnerName]);

  const handleFilter = useCallback(() => {
    showDemoFilterSheet({
      filters: {
        category: filters.category,
        lfrType: filters.lfrType,
      },
      data: {
        category: categoriesData,
        lfrType: partnerTypeList,
      },
      loading: false,
      compulsory: ['category'],
      multiSelect: ['lfrType'], // Enable multi-select for LFR type
      onApply: appliedFilters => {
        setFilters({
          lfrType: Array.isArray(appliedFilters?.lfrType)
            ? appliedFilters.lfrType as string[]
            : [],
          category: String(appliedFilters?.category) || 'All',
          partnerName: filters.partnerName,
        });
      },
      onReset: () => {
        resetFilters();
      },
    });
  }, [filters, partnerTypeList]);
  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    try {
      refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);
  const isError = !!error && transformedData.length === 0;
  const isEmpty = !isLoading && !error && transformedData.length === 0;

  return (
    <ScrollView
      className="flex-1 bg-lightBg-base dark:bg-darkBg-base"
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }>
      <View className="flex-row justify-end gap-x-2 px-3 pt-2 mb-1">
        <AppDropdown
          mode="dropdown"
          data={quarters}
          selectedValue={selectedQuarter?.value}
          onSelect={setSelectedQuarter}
          placeholder="Select Quarter"
          zIndex={1000}
          style={{width: 125}}
        />
        <FilterButton
          onPress={handleFilter}
          containerClassName="p-3 border border-[#ccc] dark:border-[#444] rounded-lg "
          noShadow
          hasActiveFilters={Object.values(filters).some(
            val => val !== null && val !== '',
          )}
        />
      </View>
      {pills.length > 0 && (
        <View className="flex-row flex-wrap mb-3 px-3 items-center">
           <AppText>Selected Filters: </AppText>
          <ScrollView horizontal> 
          {pills.map(p => (
            <View key={p.key} className="px-1 py-1">
              <TouchableOpacity
                activeOpacity={0.7}
                className="flex-row items-center bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700 rounded-full pl-3 pr-2 py-1">
                <AppText
                  size="xs"
                  weight="medium"
                  className="text-blue-700 dark:text-blue-300 mr-1">
                  {p.label}
                </AppText>
              </TouchableOpacity>
            </View>
          ))}
          </ScrollView>
        </View>
      )}
      <View className="flex-1 px-3">
        <AppDropdown
          mode="autocomplete"
          data={partnerNameList}
          selectedValue={selectedPartnerName?.value}
          onSelect={setSelectedPartnerName}
          placeholder="Select Partner Name"
          allowClear
          onClear={() => setSelectedPartnerName(null)}
          zIndex={900}
        />
      </View>
      <DataStateView
        isLoading={isLoading}
        isError={isError}
        isEmpty={isEmpty}
        onRetry={handleRetry}
        LoadingComponent={<DemoSkeleton />}>
        <FlatList
          data={transformedData}
          keyExtractor={keyExtractor}
          renderItem={renderBranch}
          contentContainerClassName="pt-5 pb-10 px-3"
          showsVerticalScrollIndicator={false}
          maxToRenderPerBatch={16}
          ListHeaderComponent={
            <StatsHeader
              stats={stats}
              counts={{
                awp_count: null,
                total_partners: summaryData.total_partners,
              }}
            />
          }
          scrollEnabled={false}
        />
      </DataStateView>
    </ScrollView>
  );
};

const ROI = () => {
  const quarters = useMemo(() => getPastQuarters(), []);
  const [selectedQuarter, setSelectedQuarter] =
    useState<AppDropdownItem | null>(quarters[0]);
  const [selectedPartnerName, setSelectedPartnerName] =
    useState<AppDropdownItem | null>(null);
  
  // Use Zustand store for ROI filters
  const filters = useDemoFilterStore(state => state.roiFilters);
  const setFilters = useDemoFilterStore(state => state.setROIFilters);
  const resetFilters = useDemoFilterStore(state => state.resetROIFilters);

  const {data, isLoading, error, refetch} = useGetDemoDataROI(
    selectedQuarter?.value || '',
    filters.category,
  );

  const {data: categoriesData, isLoading: isCategoriesLoading} =
    useGetDemoCategoriesRet(selectedQuarter?.value || '');
  const ROI_Details = data?.ROI_Details || [];
  const Table1 = data?.Table1 || [];

  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredData = useMemo(() => {
    if (!ROI_Details) return null;
    if (selectedPartnerName?.value) {
      return ROI_Details.filter(
        (item: DemoItemROI) => item.PartnerName === selectedPartnerName.value,
      );
    }
    // Handle multi-select partner type filtering
    if (filters.partnerType && filters.partnerType.length > 0) {
      return ROI_Details.filter(
        (item: DemoItemROI) => filters.partnerType.includes(item.PartnerType),
      );
    }
    return ROI_Details;
  }, [ROI_Details, filters.partnerType, selectedPartnerName?.value]);

  const transformedData = useMemo(() => {
    if (filteredData?.length) {
      return transformDemoDataROI(filteredData, Table1);
    } else {
      return [];
    }
  }, [filteredData, Table1]);

  const summaryData = useMemo(() => {
    if (!transformedData || transformedData.length === 0) {
      return {
        total_demo: 0,
        out_of_demo: 0,
        total_act: 0,
        out_of_act: 0,
        total_stock: 0,
        out_of_stock: 0,
        total_partners: 0,
      };
    }
    return transformedData.reduce(
      (acc, branch) => ({
        total_demo: acc.total_demo + branch.total_demo,
        out_of_demo: acc.out_of_demo + branch.out_of_demo,
        total_act: acc.total_act + branch.total_act,
        out_of_act: acc.out_of_act + branch.out_of_act,
        total_stock: acc.total_stock + branch.total_stock,
        out_of_stock: acc.out_of_stock + branch.out_of_stock,
        total_partners: acc.total_partners + branch.partner_count,
      }),
      {
        total_demo: 0,
        out_of_demo: 0,
        total_act: 0,
        out_of_act: 0,
        total_stock: 0,
        out_of_stock: 0,
        total_partners: 0,
      },
    );
  }, [transformedData]);

  const partnerNameList = useMemo(() => {
    if (!transformedData.length) return [];
    const namesSet = new Set<string>();
    transformedData.forEach(branch => {
      branch.partners.forEach(partner => {
        if (partner.PartnerName && partner.PartnerName.trim()) {
          namesSet.add(partner.PartnerName.trim());
        }
      });
    });
    return Array.from(namesSet)
      .sort()
      .map(name => ({
        label: name,
        value: name,
      }));
  }, [transformedData]);

  const partnerTypeList = useMemo(() => {
    if (!data?.ROI_Details?.length) return [];
    const filter = formatUnique(data?.ROI_Details, 'PartnerType').sort((a, b) =>
      a.label.localeCompare(b.label),
    );
    return filter;
  }, [data]);

  const seriesList = useMemo(() => {
    if (!data?.ROI_Details?.length) return [];
    const filter = formatUnique(data?.ROI_Details, 'Model_Series').sort(
      (a, b) => a.label.localeCompare(b.label),
    );
    return filter;
  }, [data]);

  const renderBranch = useCallback(
    ({item}: {item: TransformedBranchROI}) => (
      <BranchCardROI
        item={item}
        summaryData={summaryData}
        yearQtr={selectedQuarter?.value || ''}
      />
    ),
    [summaryData, selectedQuarter, filters],
  );
  const keyExtractor = useCallback((item: TransformedBranchROI) => item.id, []);

  // Build pills from active filters
  const pills = useMemo(() => {
    const pillsArray: { key: string; label: string }[] = [];
    
    try {
      // Add category pill if set and not 'All'
      if (filters.category && filters.category !== 'All') {
        pillsArray.push({ 
          key: 'category', 
          label: filters.category 
        });
      }
      
      // Add series pill if set
      if (filters.series) {
        pillsArray.push({ 
          key: 'series', 
          label: filters.series 
        });
      }
      
      // Add partnerType pill if set (multi-select support)
      if (filters.partnerType && filters.partnerType.length > 0) {
        pillsArray.push({ 
          key: 'partnerType', 
          label: filters.partnerType.join(', ')
        });
      }
      
      // Add selected partner pill if set
      if (selectedPartnerName?.value && selectedPartnerName?.label) {
        pillsArray.push({ 
          key: 'partnerName', 
          label: selectedPartnerName.label 
        });
      }
    } catch (error) {
      console.error('Error building pills:', error);
    }
    
    return pillsArray;
  }, [filters.category, filters.series, filters.partnerType, selectedPartnerName]);

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    try {
      refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  const handleFilter = useCallback(() => {
    showDemoFilterSheet({
      filters: {...filters},
      data: {
        category: categoriesData,
        series: seriesList,
        partnerType: partnerTypeList,
      },
      compulsory: ['category'],
      multiSelect: ['partnerType'], // Enable multi-select for partner type
      loading: isCategoriesLoading,
      onApply: appliedFilters => {
        setFilters({
          category: String(appliedFilters?.category) || 'All',
          series: String(appliedFilters?.series) || '',
          partnerType: Array.isArray(appliedFilters?.partnerType)
            ? appliedFilters.partnerType as string[]
            : [],
        });
      },
      onReset: () => {
        resetFilters();
      },
    });
  }, [
    filters,
    partnerTypeList,
    isCategoriesLoading,
    seriesList,
    categoriesData,
  ]);
  const isError = !!error && transformedData.length === 0;
  const isEmpty = !isLoading && !error && transformedData.length === 0;

  return (
    <ScrollView
      className="flex-1 bg-lightBg-base dark:bg-darkBg-base"
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }>
      <View className="flex-row justify-end gap-x-2 px-3 pt-2 mb-1 ">
        <AppDropdown
          mode="dropdown"
          data={quarters}
          selectedValue={selectedQuarter?.value}
          onSelect={setSelectedQuarter}
          placeholder="Select Quarter"
          zIndex={1000}
          style={{width: 125}}
        />
        <FilterButton
          onPress={handleFilter}
          containerClassName="p-3 border border-[#ccc] dark:border-[#e2e8f0] rounded-lg "
          noShadow
          hasActiveFilters={Object.values(filters).some(
            val => val !== null && val !== '',
          )}
        />
      </View>
      {pills.length > 0 && (
        <View className="flex-row flex-wrap mb-3 px-3 -mx-1 items-center">
           <AppText>Selected Filters: </AppText>
          <ScrollView horizontal>
          {pills.map(p => (
            <View key={p.key} className="px-1 py-1">
              <TouchableOpacity
                activeOpacity={0.7}
                className="flex-row items-center bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700 rounded-full pl-3 pr-2 py-1">
                <AppText
                  size="xs"
                  weight="medium"
                  className="text-blue-700 dark:text-blue-300 mr-1">
                  {p.label}
                </AppText>
              </TouchableOpacity>
            </View>
          ))}
          </ScrollView>
        </View>
      )}
      <View className="flex-1 px-3">
        <AppDropdown
          mode="autocomplete"
          data={partnerNameList}
          selectedValue={selectedPartnerName?.value}
          onSelect={setSelectedPartnerName}
          placeholder="Select Partner Name"
          allowClear
          onClear={() => setSelectedPartnerName(null)}
          zIndex={999}
        />
      </View>
      <DataStateView
        isLoading={isLoading}
        isError={isError}
        isEmpty={isEmpty}
        onRetry={handleRetry}
        LoadingComponent={<DemoSkeleton />}>
        <FlatList
          data={transformedData}
          keyExtractor={keyExtractor}
          renderItem={renderBranch}
          contentContainerClassName="pt-5 pb-10 px-3"
          showsVerticalScrollIndicator={false}
          maxToRenderPerBatch={16}
          ListHeaderComponent={
            <StatsHeaderROI
              stats={summaryData}
              counts={{
                total_partners: summaryData.total_partners,
              }}
            />
          }
          scrollEnabled={false}
        />
      </DataStateView>
    </ScrollView>
  );
};

const TAB_CONFIG = {
  retailer: {label: 'Retailer', name: 'retailer', component: Retailer},
  reseller: {label: 'Reseller', name: 'reseller', component: Reseller},
  lfr: {label: 'LFR', name: 'lfr', component: LFR},
  roi: {label: 'ROI', name: 'roi', component: ROI},
} as const;

const ROLE_TABS = {
  AM: ['retailer', 'lfr'], // T
  LFR: ['lfr'],
  TM: ['reseller', 'retailer', 'roi'], // T
  CSE: ['reseller'], // T
  DEFAULT: ['reseller', 'retailer', 'lfr', 'roi'], // B
} as const;

export default function Demo() {
  // useGetSummaryOverviewData(); // Preload summary data
  const {EMP_RoleId: role_id} = useLoginStore(state => state.userInfo);
  const {LFR_HO, ONLINE_HO, AM, TM, SALES_REPS} = ASUS.ROLE_ID;
  const [isLFR, isAM, isTM, isCSE] = [
    role_id === LFR_HO || role_id === ONLINE_HO,
    role_id === AM,
    role_id === TM,
    role_id === SALES_REPS,
  ];

  const tabs = useMemo(() => {
    const resolveRole = () => {
      if (isAM) return 'AM';
      if (isLFR) return 'LFR';
      if (isTM) return 'TM';
      if (isCSE) return 'CSE';
      return 'DEFAULT';
    };
    const roleKey = resolveRole();
    return ROLE_TABS[roleKey].map(key => TAB_CONFIG[key]);
  }, [isAM, isLFR, isTM, isCSE]);

  return (
    <View className="flex-1 bg-lightBg-base dark:bg-darkBg-base">
      <MaterialTabBar tabs={tabs} initialRouteName={tabs[0].name} />
    </View>
  );
}