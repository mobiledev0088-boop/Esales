import {View, FlatList, TouchableOpacity} from 'react-native';
import {useMemo, useCallback, useState} from 'react';
import MaterialTabBar from '../../../../components/MaterialTabBar';
import AppDatePicker, {
  DatePickerState,
} from '../../../../components/customs/AppDatePicker';
import moment from 'moment';
import {
  buildGroups,
  GroupAccordion,
  MonthRangeCard,
  FilterButton,
  ClaimListSkeleton,
  EmptyState,
} from './components';
import {useQuery} from '@tanstack/react-query';
import {handleASINApiCall} from '../../../../utils/handleApiCall';
import {useLoginStore} from '../../../../stores/useLoginStore';
import {ASUS, screenWidth} from '../../../../utils/constant';
import AppText from '../../../../components/customs/AppText';
import {showClaimFilterSheet} from './ClaimFilterSheet';
import type {ClaimFilterResult} from './ClaimFilterSheet'; // sorting types removed
import AppIcon from '../../../../components/customs/AppIcon';
import SearchableDropdown from '../../../../components/customs/SearchableDropdown';
import Skeleton from '../../../../components/skeleton/skeleton';

type FilterData = {
  partnerType: string;
  schemeCategory: string;
  productLine: string;
  startMonth: string;
  endMonth: string;
};

const useClaimData = (filterData: FilterData) => {
  const userInfo = useLoginStore(state => state.userInfo);
  const employeeCode = userInfo?.EMP_Code || '';
  const roleId = userInfo?.EMP_RoleId || '';
  return useQuery<any[]>({
    queryKey: [
      'claimDashboard',
      employeeCode,
      roleId,
      filterData.startMonth,
      filterData.endMonth,
      filterData.partnerType,
    ],
    queryFn: async () => {
      const res = await handleASINApiCall(
        '/ClaimMaster/GetClaimDashboardDetails',
        {
          employeeCode: employeeCode,
          RoleId: roleId,
          PartnerType:
            roleId === ASUS.ROLE_ID.PARTNERS ? null : filterData.partnerType,
          SchemeCategory: 'ALL',
          ProductLine: 'ALL',
          StartYearMonth: filterData.startMonth,
          EndYearMonth: filterData.endMonth,
        },
      );
      const result = res.DashboardData;
      if (!result?.Status) return [];
      return result?.Datainfo?.ClaimDashboardDetails || [];
    },
    // Optimization: keep previous data during transitions & reduce refetch noise
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
};

const usePartnerTypeList = () => {
  const userInfo = useLoginStore(state => state.userInfo);
  const employeeCode = userInfo?.EMP_Code || '';
  const roleId = userInfo?.EMP_RoleId || '';
  return useQuery({
    queryKey: ['partnerTypeList', employeeCode, roleId],
    queryFn: async () => {
      const res = await handleASINApiCall(
        '/ClaimMaster/GetClaimDashboardDropdownLists',
        {
          employeeCode: employeeCode,
          RoleId: roleId,
        },
      );
      const result = res.DashboardData;
      if (!result?.Status) return [];
      const rawPartnerType: {PartnerType: string}[] = result?.Datainfo
        ?.PartnerType || [{PartnerType: 'Channel'}];
      const uniquePartnerType = Array.from(
        new Set(rawPartnerType.map(item => item.PartnerType)),
      );
      return uniquePartnerType;
    },
  });
};

const usePartnerList = () => {
  const userInfo = useLoginStore(state => state.userInfo);
  const employeeCode = userInfo?.EMP_Code || '';
  const roleId = userInfo?.EMP_RoleId || '';
  return useQuery<{label:string,value:string}[]>({
    queryKey: ['partnerList', employeeCode, roleId],
    queryFn: async () => {
      const res = await handleASINApiCall(
        '/Information/GetALPList',
        {
          employeeCode,
          RoleId: roleId,
        },
      );
      const result = res.DashboardData;
      if (!result?.Status) return [];
      const rawPartnerType: {PM_Name:string; PM_Code:string}[] = result?.Datainfo?.ALP_List || [];
      // Ensure uniqueness by PM_Code
      const uniqueMap = new Map<string, {label:string; value:string}>();
      rawPartnerType.forEach(item => {
        if (!uniqueMap.has(item.PM_Code)) {
          uniqueMap.set(item.PM_Code, {label: item.PM_Name, value: item.PM_Code});
        }
      });
      return Array.from(uniqueMap.values());
    },
  });
};

const ClaimCodeWise = () => {
  const Date = {
    startMonth: moment().subtract(11, 'months').format('YYYYMM'),
    endMonth: moment().format('YYYYMM'),
  };

  const [filterData, setFilterData] = useState<FilterData>({
    partnerType: 'Channel',
    schemeCategory: '',
    productLine: '',
    startMonth: Date.startMonth,
    endMonth: Date.endMonth,
    // sortField: null,
    // sortDirection: 'asc',
  });

  const {data: claimData = [], isLoading, isError} = useClaimData(filterData);
  const {data: partnerTypeList} = usePartnerTypeList();

  const {groupedData, allSchemeCategories, allProductLinesName} =
    useMemo(() => {
      if (!claimData.length) {
        return {
          groupedData: [],
          allSchemeCategories: [],
          allProductLinesName: [],
        };
      }
      return buildGroups(claimData as any);
    }, [claimData]);

  // Build quick lookup maps to avoid repeated filtering work when filters change
  const schemeMap = useMemo(() => {
    const m = new Map<string, (typeof groupedData)[number]>();
    groupedData.forEach(g => m.set(g.Scheme_Category, g));
    return m;
  }, [groupedData]);

  const sortedFilteredData = useMemo(() => {
    // Fast path: no scheme/product filters -> return original reference (prevents FlatList re-renders)
    const {schemeCategory, productLine} = filterData;
    if (!schemeCategory && !productLine) return groupedData;

    let targetGroups: typeof groupedData = groupedData;
    if (schemeCategory) {
      const g = schemeMap.get(schemeCategory);
      targetGroups = g ? [g] : [];
    }

    if (!productLine) return targetGroups; // only scheme filter applied

    // product line filter path: build minimal transformed groups
    return targetGroups
      .map(g => {
        const months = g.Months.filter(
          m => m.Product_Line_Name === productLine,
        );
        if (months.length === 0) return null;
        // compute totals quickly
        let total = 0,
          processed = 0,
          under_Processed = 0;
        for (let i = 0; i < months.length; i++) {
          const m = months[i];
          total += m.total;
          processed += m.processed;
          under_Processed += m.under_Processed;
        }
        return {
          ...g,
          Months: months,
          Totals: {total, processed, under_Processed},
        };
      })
      .filter(Boolean) as typeof groupedData;
  }, [
    groupedData,
    filterData.schemeCategory,
    filterData.productLine,
    schemeMap,
  ]);

  const [monthRangeVisible, setMonthRangeVisible] = useState(false);
  const [monthRange, setMonthRange] = useState<DatePickerState>(() => {
    const start = moment(filterData.startMonth, 'YYYYMM')
      .startOf('month')
      .toDate();
    const end = moment(filterData.endMonth, 'YYYYMM').endOf('month').toDate();
    return {start, end};
  });

  const handleDateRangeSelect = useCallback((start: Date, end: Date) => {
    const normStart = moment(start).startOf('month').toDate();
    const normEnd = moment(end).endOf('month').toDate();
    setMonthRange({start: normStart, end: normEnd});
    setMonthRangeVisible(false);
    const startMonth = moment(normStart).format('YYYYMM');
    const endMonth = moment(normEnd).format('YYYYMM');
    setFilterData(prev =>
      prev.startMonth === startMonth && prev.endMonth === endMonth
        ? prev
        : {...prev, startMonth, endMonth},
    );
  }, []);

  const handleNavigate = useCallback(
    (params: {
      scheme: string;
      month: string;
      productLine: string;
      type: 'processed' | 'underProcess';
    }) => {
      console.log('Navigate to Claims', params);
    },
    [],
  );

  const pills = useMemo(() => {
    const arr: {key: string; label: string}[] = [];
    const {partnerType, schemeCategory, productLine} = filterData;
    if (partnerType && partnerType !== 'Channel')
      arr.push({key: 'partnerType', label: partnerType});
    if (schemeCategory)
      arr.push({key: 'schemeCategory', label: schemeCategory});
    if (productLine) arr.push({key: 'productLine', label: productLine});
    return arr;
  }, [
    filterData.partnerType,
    filterData.schemeCategory,
    filterData.productLine,
  ]);

  const removePill = useCallback((key: string) => {
    setFilterData(prev => {
      switch (key) {
        case 'partnerType':
          return prev.partnerType === 'Channel'
            ? prev
            : {...prev, partnerType: 'Channel'};
        case 'schemeCategory':
          return !prev.schemeCategory ? prev : {...prev, schemeCategory: ''};
        case 'productLine':
          return !prev.productLine ? prev : {...prev, productLine: ''};
        default:
          return prev;
      }
    });
  }, []);
  const isFilteredEmpty =
    claimData.length > 0 && sortedFilteredData.length === 0;
  const isApiEmpty = claimData.length === 0;
  return (
    <View className="flex-1 bg-slate-50 px-3 pt-2">
      {isLoading ? (
        <ClaimListSkeleton />
      ) : isError ? (
        <View className="flex-1 items-center justify-center">
          <AppText>Failed to load claim data.</AppText>
        </View>
      ) : (
        <FlatList
          data={sortedFilteredData}
          keyExtractor={item => item.Scheme_Category}
          renderItem={({item}) => (
            <GroupAccordion group={item} onNavigate={handleNavigate} />
          )}
          contentContainerStyle={{paddingBottom: 24, rowGap: 16}}
          ListHeaderComponent={
            <View>
              <View className="flex-row items-center mb-3">
                <MonthRangeCard
                  range={monthRange}
                  onPress={() => setMonthRangeVisible(true)}
                />
                <FilterButton
                  onPress={() =>
                    showClaimFilterSheet({
                      partnerType: filterData.partnerType,
                      schemeCategory: filterData.schemeCategory,
                      productLine: filterData.productLine,
                      allSchemeCategories,
                      allProductLinesName,
                      allPartnerTypeList: partnerTypeList || ['Channel'],
                      onApply: (res: ClaimFilterResult) =>
                        setFilterData(prev => ({
                          ...prev,
                          partnerType: res.partnerType,
                          schemeCategory: res.schemeCategory,
                          productLine: res.productLine,
                        })),
                      onReset: () =>
                        setFilterData(prev => ({
                          ...prev,
                          partnerType: 'Channel',
                          schemeCategory: '',
                          productLine: '',
                        })),
                    })
                  }
                />
              </View>
              {pills.length > 0 && (
                <View className="flex-row flex-wrap mb-3 -mx-1">
                  {pills.map(p => (
                    <View key={p.key} className="px-1 py-1">
                      <TouchableOpacity
                        onPress={() => removePill(p.key)}
                        activeOpacity={0.7}
                        className="flex-row items-center bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700 rounded-full pl-3 pr-2 py-1">
                        <AppText
                          size="xs"
                          weight="medium"
                          className="text-blue-700 dark:text-blue-300 mr-1">
                          {p.label}
                        </AppText>
                        <AppIcon
                          name="x"
                          type="feather"
                          size={14}
                          color="#1d4ed8"
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          }
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          windowSize={20}
          maxToRenderPerBatch={10}
          removeClippedSubviews
          ListEmptyComponent={
            <EmptyState
              variant={isApiEmpty ? 'no-data' : 'no-results'}
              onResetFilters={
                isFilteredEmpty
                  ? () =>
                      setFilterData(prev => ({
                        ...prev,
                        partnerType: 'Channel',
                        schemeCategory: '',
                        productLine: '',
                      }))
                  : undefined
              }
              onChangeDateRange={
                isApiEmpty ? () => setMonthRangeVisible(true) : undefined
              }
            />
          }
        />
      )}
      <AppDatePicker
        mode="month"
        visible={monthRangeVisible}
        onClose={() => setMonthRangeVisible(false)}
        initialStartDate={monthRange.start}
        initialEndDate={monthRange.end}
        minMonthYear={{month: 1, year: 2022}}
        maxMonthYear={{month: moment().month() + 1, year: moment().year()}}
        onDateRangeSelect={handleDateRangeSelect}
      />
    </View>
  );
};

export default function Claim() {
  return (
    <View className="flex-1 bg-slate-50">
      <MaterialTabBar
        tabs={[
          {
            name: 'ClaimCode Wise',
            label: 'ClaimCode Wise',
            component: <ClaimCodeWise />,
          },
          {
            name: 'Partner Wise',
            label: 'Partner Wise',
            component: <PartnerWise />,
          },
          {name: 'GST Wise', label: 'GST Wise', component: <GSTWise />},
        ]}
        tabPadding={10}
      />
    </View>
  );
}

const PartnerWise = () => {
  const {data: partnerTypeList,isLoading} = usePartnerList();

  if(isLoading){
    <View className='px-3 pt-5'>
      <Skeleton width={screenWidth-24} height={44} borderRadius={8}/>
    </View>
  }
  return <View className="flex-1 bg-slate-50 px-3 pt-5">
    {/* Here Create */}
    <SearchableDropdown
    data={partnerTypeList || []}
    onSelect={item => console.log('Selected item:', item)}
    placeholder="Search Partner"
    emptyText="No partners found"
    />
  </View>;
};

const GSTWise = () => (
  <View>
    <AppText>GST Wise</AppText>
  </View>
);
