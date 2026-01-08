import {View, FlatList, TouchableOpacity} from 'react-native';
import {useMemo, useCallback, useState} from 'react';
import MaterialTabBar from '../../../../components/MaterialTabBar';
import AppDatePicker, {DatePickerState} from '../../../../components/customs/AppDatePicker';
import moment from 'moment';
import {
  buildGroups,
  GroupAccordion,
  MonthRangeCard,
  FilterButton,
  ClaimListSkeleton,
  EmptyState,
} from './components';
import AppText from '../../../../components/customs/AppText';
import {showClaimFilterSheet} from './ClaimFilterSheet';
import type {ClaimFilterResult} from './ClaimFilterSheet';
import AppIcon from '../../../../components/customs/AppIcon';
import SearchableDropdown from '../../../../components/customs/SearchableDropdown';
import Skeleton from '../../../../components/skeleton/skeleton';
import {ASUS, screenWidth} from '../../../../utils/constant';
import {
  useClaimDashboardData,
  useGroupedClaimData,
  useT2PartnerList,
  useT3PartnerList,
  usePartnerTypeList,
  buildPills,
  removePillHelper,
} from '../../../../hooks/queries/claim';
import {useLoginStore} from '../../../../stores/useLoginStore';
import {useNavigation} from '@react-navigation/native';
import {AppNavigationProp} from '../../../../types/navigation';

type FilterData = {
  partnerType: string;
  schemeCategory: string;
  productLine: string;
  startMonth: string;
  endMonth: string;
};

const ClaimCodeWise = () => {
  const navigation = useNavigation<AppNavigationProp>();
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
  });

  const {
    data: claimData = [],
    isLoading,
    isError,
  } = useClaimDashboardData({
    mode: 'code',
    partnerType: filterData.partnerType,
    startMonth: filterData.startMonth,
    endMonth: filterData.endMonth,
  });
  const {data: partnerTypeList} = usePartnerTypeList();

  const {groupedData, allSchemeCategories, allProductLinesName} =
    useMemo(() => {
      if (!claimData.length)
        return {
          groupedData: [],
          allSchemeCategories: [],
          allProductLinesName: [],
        };
      return buildGroups(claimData as any);
    }, [claimData]);

  const schemeMap = useMemo(() => {
    const m = new Map<string, (typeof groupedData)[number]>();
    groupedData.forEach(g => m.set(g.Scheme_Category, g));
    return m;
  }, [groupedData]);

  const sortedFilteredData = useMemo(() => {
    const {schemeCategory, productLine} = filterData;
    if (!schemeCategory && !productLine) return groupedData;
    let targetGroups: typeof groupedData = groupedData;
    if (schemeCategory) {
      const g = schemeMap.get(schemeCategory);
      targetGroups = g ? [g] : [];
    }
    if (!productLine) return targetGroups;
    return targetGroups
      .map(g => {
        const months = g.Months.filter(
          m => m.Product_Line_Name === productLine,
        );
        if (months.length === 0) return null;
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
      month: {MonthYear: string};
      productLine: string;
      Product_Line_Name: string;
      type: 'processed' | 'underProcess';
    }) => {
      navigation.push('ClaimInfo', {
        ProductLine: params.productLine,
        Product_Line_Name: params.Product_Line_Name,
        type: params.type,
        YearMonth: params.month.MonthYear,
        SchemeCategory: params.scheme,
        PartnerType: filterData.partnerType,
      });
    },
    [navigation, filterData.partnerType],
  );

  const pills = useMemo(
    () => buildPills(filterData, null, {includePartnerType: true}),
    [filterData],
  );

  const removePill = useCallback(
    (key: string) => removePillHelper(key, {setFilterData}),
    [],
  );

  const isFilteredEmpty =
    claimData.length > 0 && sortedFilteredData.length === 0;
  const isApiEmpty = claimData.length === 0;

  return (
    <View className="flex-1 bg-lightBg-base dark:bg-darkBg-base px-3 pt-2">
      {!isLoading ? (<ClaimListSkeleton />) : isError ? (
        <View className="flex-1 items-center justify-center">
          <AppText>Failed to load claim data.</AppText>
        </View>
      ) : (
        <FlatList
          data={sortedFilteredData}
          keyExtractor={item => item.Scheme_Category}
          renderItem={({item}) => <GroupAccordion group={item} onNavigate={handleNavigate} />}
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

const PartnerWise = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const userInfo = useLoginStore(state => state.userInfo);
  const isPartnerUser = userInfo?.EMP_RoleId === ASUS.ROLE_ID.PARTNERS;
  const {data: partnerList, isLoading: partnerListLoading} = useT2PartnerList();
  const Date = {
    startMonth: moment().subtract(11, 'months').format('YYYYMM'),
    endMonth: moment().format('YYYYMM'),
  };
  const [selectedPartner, setSelectedPartner] = useState<string | null>(
    isPartnerUser ? userInfo?.EMP_Code : null,
  );
  const [filterData, setFilterData] = useState<Omit<FilterData, 'partnerType'>>(
    {
      schemeCategory: '',
      productLine: '',
      startMonth: Date.startMonth,
      endMonth: Date.endMonth,
    },
  );

  const {
    data: claimData = [],
    isLoading,
    isError,
  } = useClaimDashboardData({
    mode: 'partner',
    selectedPartner,
    startMonth: filterData.startMonth,
    endMonth: filterData.endMonth,
    roleIdOverride: ASUS.ROLE_ID.PARTNERS,
  });

  const {groupedData, allSchemeCategories, allProductLinesName} =
    useGroupedClaimData(
      selectedPartner ? claimData : [],
      filterData.schemeCategory,
      filterData.productLine,
      buildGroups,
    );

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
      month: {MonthYear: string};
      productLine: string;
      type: 'processed' | 'underProcess';
    }) => {
      const YearMonth = params.month.MonthYear;
      navigation.push('ClaimInfoPartner', {
        Product_Line: params.productLine,
        SchemeCategory: params.scheme,
        PartnerType: 'Channel',
        MonthAPI: moment(YearMonth, 'MMM-YYYY').format('YYYYMM'),
        partnerCode: selectedPartner || '',
        roleId: isPartnerUser ? ASUS.ROLE_ID.PARTNERS : userInfo?.EMP_RoleId,
        type: params.type,
      });
    },
    [navigation, userInfo?.EMP_Code],
  );

  const pills = useMemo(
    () =>
      buildPills(
        {
          schemeCategory: filterData.schemeCategory,
          productLine: filterData.productLine,
        },
        selectedPartner,
        {includeSelectedPartner: false},
      ),
    [selectedPartner, filterData.schemeCategory, filterData.productLine],
  );

  const removePill = useCallback(
    (key: string) => removePillHelper(key, {setFilterData, setSelectedPartner}),
    [],
  );

  const isApiEmpty = claimData.length === 0;
  const isFilteredEmpty = claimData.length > 0 && groupedData.length === 0;

  return (
    <View className="flex-1 bg-lightBg-base dark:bg-darkBg-base px-3 pt-2">
      {!isPartnerUser && (
        <View className="mb-3">
          {partnerListLoading ? (
            <Skeleton width={screenWidth - 24} height={44} borderRadius={8} />
          ) : (
            <SearchableDropdown
              data={partnerList || []}
              onSelect={item => setSelectedPartner(item.value)}
              placeholder={selectedPartner ? selectedPartner : 'Search Partner'}
              emptyText="No partners found"
              onClear={() => setSelectedPartner(null)}
            />
          )}
        </View>
      )}
      {!selectedPartner ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="items-center opacity-90">
            <AppIcon name="users" type="feather" size={54} color="#3b82f6" />
            <AppText
              weight="medium"
              className="mt-4 text-slate-700 dark:text-slate-200 text-center">
              Select a partner to view claim details
            </AppText>
            <AppText
              size="xs"
              className="mt-2 text-slate-500 dark:text-slate-400 text-center leading-5">
              Use the search box above to pick a partner and load their claim
              summary.
            </AppText>
          </View>
        </View>
      ) : isLoading ? (
        <ClaimListSkeleton />
      ) : isError ? (
        <View className="flex-1 items-center justify-center">
          <AppText>Failed to load claim data.</AppText>
        </View>
      ) : (
        <FlatList
          data={groupedData}
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
                      schemeCategory: filterData.schemeCategory,
                      productLine: filterData.productLine,
                      allSchemeCategories,
                      allProductLinesName,
                      includePartnerType: false,
                      onApply: res =>
                        setFilterData(prev => ({
                          ...prev,
                          schemeCategory: res.schemeCategory,
                          productLine: res.productLine,
                        })),
                      onReset: () =>
                        setFilterData(prev => ({
                          ...prev,
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

const GSTWise = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const userInfo = useLoginStore(state => state.userInfo);
  const {data: partnerList, isLoading: partnerListLoading} = useT3PartnerList();
  const Date = {
    startMonth: moment().subtract(11, 'months').format('YYYYMM'),
    endMonth: moment().format('YYYYMM'),
  };
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [filterData, setFilterData] = useState<Omit<FilterData, 'partnerType'>>(
    {
      schemeCategory: '',
      productLine: '',
      startMonth: Date.startMonth,
      endMonth: Date.endMonth,
    },
  );
  const {
    data: claimData = [],
    isLoading,
    isError,
  } = useClaimDashboardData({
    mode: 'partner',
    selectedPartner,
    startMonth: filterData.startMonth,
    endMonth: filterData.endMonth,
    roleIdOverride: ASUS.ROLE_ID.PARTNERS,
  });
  const {groupedData, allSchemeCategories, allProductLinesName} =
    useGroupedClaimData(
      selectedPartner ? claimData : [],
      filterData.schemeCategory,
      filterData.productLine,
      buildGroups,
    );
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
      // ajnsd
    },
    [navigation, userInfo?.EMP_Code],
  );
  const pills = useMemo(
    () =>
      buildPills(
        {
          schemeCategory: filterData.schemeCategory,
          productLine: filterData.productLine,
        },
        selectedPartner,
        {includeSelectedPartner: false},
      ),
    [selectedPartner, filterData.schemeCategory, filterData.productLine],
  );
  const removePill = useCallback(
    (key: string) => removePillHelper(key, {setFilterData, setSelectedPartner}),
    [],
  );
  const isApiEmpty = claimData.length === 0;
  const isFilteredEmpty = claimData.length > 0 && groupedData.length === 0;
  return (
    <View className="flex-1 bg-slate-50 px-3 pt-2">
      <View className="mb-3">
        {partnerListLoading ? (
          <Skeleton width={screenWidth - 24} height={44} borderRadius={8} />
        ) : (
          <SearchableDropdown
            data={partnerList || []}
            onSelect={item => setSelectedPartner(item.value)}
            placeholder={'Search GST Partner'}
            emptyText="No partners found"
            onClear={() => setSelectedPartner(null)}
          />
        )}
      </View>
      {!selectedPartner ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="items-center opacity-90">
            <AppIcon
              name="file-text"
              type="feather"
              size={54}
              color="#6366f1"
            />
            <AppText
              weight="medium"
              className="mt-4 text-slate-700 dark:text-slate-200 text-center">
              Select a GST partner to view claim details
            </AppText>
            <AppText
              size="xs"
              className="mt-2 text-slate-500 dark:text-slate-400 text-center leading-5">
              Use the search box above to pick a T3 partner and load their claim
              summary.
            </AppText>
          </View>
        </View>
      ) : isLoading ? (
        <ClaimListSkeleton />
      ) : isError ? (
        <View className="flex-1 items-center justify-center">
          <AppText>Failed to load claim data.</AppText>
        </View>
      ) : (
        <FlatList
          data={groupedData}
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
                      schemeCategory: filterData.schemeCategory,
                      productLine: filterData.productLine,
                      allSchemeCategories,
                      allProductLinesName,
                      includePartnerType: false,
                      onApply: res =>
                        setFilterData(prev => ({
                          ...prev,
                          schemeCategory: res.schemeCategory,
                          productLine: res.productLine,
                        })),
                      onReset: () =>
                        setFilterData(prev => ({
                          ...prev,
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
                        className="flex-row items-center bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-700 rounded-full pl-3 pr-2 py-1">
                        <AppText
                          size="xs"
                          weight="medium"
                          className="text-indigo-700 dark:text-indigo-300 mr-1">
                          {p.label}
                        </AppText>
                        <AppIcon
                          name="x"
                          type="feather"
                          size={14}
                          color="#4338ca"
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
  const userInfo = useLoginStore(state => state.userInfo);
  const isPartnerUser = userInfo?.EMP_RoleId === ASUS.ROLE_ID.PARTNERS;
  const isDistiUser = userInfo?.EMP_RoleId === ASUS.ROLE_ID.DISTRIBUTORS;

  const Tabs = useMemo(() => {
    if (isPartnerUser) {
      return [
        {
          name: 'Partner Wise',
          label: 'My Claims',
          component: <PartnerWise />,
        },
      ];
    }else if (isDistiUser) {
      return [
        {
          name: 'ClaimCode Wise',
          label: 'Partner Type',
          component: <ClaimCodeWise />,
        }
      ];
    }else{
      return [
        {
          name: 'ClaimCode Wise',
          label: 'Partner Type',
          component: <ClaimCodeWise />,
        },
        {
          name: 'Partner Wise',
          label: 'T2 Partner',
          component: <PartnerWise />,
        },
        {name: 'GST Wise', label: 'T3 Partners', component: <GSTWise />},
      ];
    }
  }, [isPartnerUser,isDistiUser]);

  return (
    <View className="flex-1 bg-lightBg-base dark:bg-darkBg-base">
      <MaterialTabBar tabs={Tabs} tabPadding={10} />
    </View>
  );
}