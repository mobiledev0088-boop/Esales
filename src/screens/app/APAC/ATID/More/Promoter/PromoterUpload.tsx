import {memo, useCallback, useMemo, useRef, useState} from 'react';
import {FlatList, TouchableOpacity, View, Animated} from 'react-native';
import {useMutation, useQuery} from '@tanstack/react-query';
import {useNavigation, useRoute} from '@react-navigation/native';
import moment from 'moment';

import AppLayout from '../../../../../../components/layout/AppLayout';
import AppIcon from '../../../../../../components/customs/AppIcon';
import AppText from '../../../../../../components/customs/AppText';
import AppInput from '../../../../../../components/customs/AppInput';
import AppButton from '../../../../../../components/customs/AppButton';
import AppDatePicker from '../../../../../../components/customs/AppDatePicker';
import Card from '../../../../../../components/Card';
import Accordion from '../../../../../../components/Accordion';
import Skeleton from '../../../../../../components/skeleton/skeleton';
import BarcodeScanner from '../../../../../../components/BarcodeScanner';
import {FilterButton} from '../../../../ASIN/Claim/components';
import {
  showPromoterFilterSheet,
  PromoterFilterResult,
} from './PromoterFilterSheet';

import {useThemeStore} from '../../../../../../stores/useThemeStore';
import {useLoginStore} from '../../../../../../stores/useLoginStore';
import {queryClient} from '../../../../../../stores/providers/QueryProvider';

import {handleAPACApiCall} from '../../../../../../utils/handleApiCall';
import {formatUnique, showToast} from '../../../../../../utils/commonFunctions';
import {screenWidth} from '../../../../../../utils/constant';
import {AppColors} from '../../../../../../config/theme';

import useQuarterHook from '../../../../../../hooks/useQuarterHook';
import AppDropdown, {
  AppDropdownItem,
} from '../../../../../../components/customs/AppDropdown';
import { AppNavigationProp } from '../../../../../../types/navigation';

// INTERFACES
interface SelloutInfo {
  Employee_Code: string;
  Promter_Name: string;
  Sellout_category: string;
  Serial_count: number;
  selloutToCompanyId: string | null;
}

interface DateRangeState {
  start: Date;
  end: Date;
}

interface MonthRangeCardProps {
  range: {start: Date | undefined; end: Date | undefined};
  onPress: () => void;
}

interface SelloutInfoCardProps {
  item: SelloutInfo;
}

interface SaveSerialNumberData {
  serialNumber: string;
  SelloutType: string;
  CompanyId?: string;
}

interface RouteParams {
  type: 'e' | 'w' | 'o';
}

interface FilterState {
  promoter: string | null;
  sort: string | null;
}

// CUSTOM HOOKS
const useGetSelloutInfo = (
  YearQtr: string,
  StartDate: string,
  EndDate: string,
) => {
  const {EMP_Code: employeeCode} = useLoginStore(state => state.userInfo);
  const dataToSend = {employeeCode, YearQtr, StartDate, EndDate};

  return useQuery<SelloutInfo[]>({
    queryKey: ['partnerTypeList', employeeCode, YearQtr, StartDate, EndDate],
    queryFn: async () => {
      const res = await handleAPACApiCall(
        '/Information/GetSelloutSerialNoInfoNew',
        dataToSend,
      );
      const result = res.DashboardData;
      if (!result?.Status) return [];
      return result?.Datainfo?.Sellout_Info || [];
    },
  });
};

const useSaveSerialNumber = () => {
  const {EMP_Code: employeeCode, EMP_CountryID: Country} = useLoginStore(
    state => state.userInfo,
  );

  return useMutation({
    mutationKey: ['saveSerialNumber'],
    mutationFn: async (data: SaveSerialNumberData) => {
      const dataToSend = {
        employeeCode,
        Country,
        Serial_No: data.serialNumber,
        SelloutType: data.SelloutType,
        CompanyId: data?.CompanyId || '',
      };
      const res = await handleAPACApiCall(
        '/Information/SaveSerialNoInfo_new',
        dataToSend,
        {},
        true,
      );
      return res;
    },
    onSuccess: data => {
      if (data?.DashboardData?.Status) {
        queryClient.invalidateQueries({queryKey: ['partnerTypeList']});
        showToast('Serial number saved successfully');
      }
    },
    onError: error => {
      console.error('Error saving serial number:', error);
    },
  });
};

const useGetCompanyIds = () => {
  const {EMP_Code: employeeCode} = useLoginStore(state => state.userInfo);
  return useQuery<AppDropdownItem[]>({
    queryKey: ['companyIds', employeeCode],
    queryFn: async () => {
      const res = await handleAPACApiCall('/Information/GetCompanyIdInfo', {
        employeeCode,
      });
      const result = res.DashboardData;
      if (result?.Status) {
        return result?.Datainfo?.Company_Info || [];
      }
      return [];
    },
    select: data => formatUnique(data, 'Company_Id'),
  });
};

// SUB COMPONENTS
const SelloutInfoCard = memo(({item, onPress}: SelloutInfoCardProps & {onPress: (item: SelloutInfo) => void}) => {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={() => onPress(item)}>
      <Card className="mb-3 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Promoter header section */}
        <View className="flex-row items-center mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
          <View className="w-12 h-12 rounded-full items-center justify-center bg-blue-50 dark:bg-[#1E3A8A] mr-3">
            <AppIcon name="person" type="ionicons" size={24} color="#2563EB" />
          </View>
          <View className="flex-1">
            <AppText
              size="base"
              weight="bold"
              className="text-gray-800 dark:text-gray-100"
              numberOfLines={1}>
              {item.Promter_Name}
            </AppText>
            <AppText
              size="xs"
              className="text-gray-500 dark:text-gray-400 mt-0.5">
              Code: {item.Employee_Code}
            </AppText>
          </View>
          <View className="p-1 rounded-full bg-lightBg-base">
            <AppIcon
              name="chevron-forward"
              type="ionicons"
              size={20}
              color="#9CA3AF"
              style={{left: 1}}
            />
          </View>
        </View>

        {/* Promoter details section */}
        <View className="space-y-2.5">
          <View className="flex-row items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-800">
            <View className="flex-row items-center flex-1">
              <AppIcon name="list" type="ionicons" size={18} color="#6B7280" />
              <AppText
                size="sm"
                className="text-gray-600 dark:text-gray-400 ml-2">
                Serial Count
              </AppText>
            </View>
            <View className="px-3 py-1 rounded-full bg-blue-100 dark:bg-[#1E3A8A]">
              <AppText
                size="sm"
                weight="bold"
                className="text-blue-700 dark:text-blue-300">
                {item.Serial_count}
              </AppText>
            </View>
          </View>

          {/* Company ID section (optional) */}
          {item.selloutToCompanyId && (
            <View className="flex-row items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <View className="flex-row items-center flex-1">
                <AppIcon
                  name="business"
                  type="ionicons"
                  size={18}
                  color="#6B7280"
                />
                <AppText
                  size="sm"
                  className="text-gray-600 dark:text-gray-400 ml-2">
                  Company ID
                </AppText>
              </View>
              <AppText
                size="sm"
                weight="semibold"
                className="text-gray-800 dark:text-gray-100"
                numberOfLines={1}>
                {item.selloutToCompanyId}
              </AppText>
            </View>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
});

const MonthRangeCard = memo(({range, onPress}: MonthRangeCardProps) => {
  const hasRange = range.start && range.end;
  const monthDiff = hasRange
    ? moment(range.end).diff(moment(range.start), 'days') + 1
    : 0;
  const formatted = hasRange
    ? `${moment(range.start).format('MMM YYYY')} – ${moment(range.end).format('MMM YYYY')}`
    : 'Select month range';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="flex-1 flex-row items-center w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-lightBg-surface dark:bg-darkBg-surface px-4 py-2.5 gap-3 ">
      <View className="w-11 h-11 rounded-xl items-center justify-center bg-blue-50 dark:bg-[#1E3A8A]">
        <AppIcon
          name="calendar"
          type="ionicons"
          size={22}
          color={hasRange ? '#2563EB' : '#6B7280'}
        />
      </View>
      <View className="flex-1">
        <AppText
          size="xs"
          weight="semibold"
          className="text-gray-500 dark:text-gray-400 tracking-wide">
          MONTH RANGE
        </AppText>
        <AppText
          size="sm"
          weight="semibold"
          className={`${hasRange ? 'text-gray-800 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}`}
          numberOfLines={1}>
          {formatted}
        </AppText>
      </View>
      {hasRange && (
        <View className="ml-2">
          <View className="px-2.5 py-1 rounded-full bg-green-50 dark:bg-[#064E3B] border border-green-200 dark:border-green-600">
            <AppText
              size="xs"
              weight="semibold"
              className="text-green-700 dark:text-green-300 leading-none tracking-tight">
              {monthDiff} Days
            </AppText>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
});

const PromoterSkeleton = () => (
  <View className="flex-1 bg-lightBg-base dark:bg-darkBg-base">
    <View className="gap-3 mt-4">
      <Skeleton width={screenWidth - 24} height={200} />
      <Skeleton width={100} height={25} />
      <Skeleton width={screenWidth - 24} height={70} />
      <Skeleton width={screenWidth - 24} height={60} />
    </View>
    <View className="gap-3">
      {[1, 2, 3].map(index => (
        <Skeleton key={index} width={screenWidth - 24} height={100} />
      ))}
    </View>
  </View>
);

// MAIN COMPONENT
export default function PromoterUpload() {
  // ========== Route & Theme ==========
  const navigation = useNavigation<AppNavigationProp>();
  const {params} = useRoute();
  const {type} = params as RouteParams;
  const isDarkTheme = useThemeStore(state => state.AppTheme === 'dark');

  // ========== Date & Quarter Setup ==========
  const {quarters} = useQuarterHook();
  const YearQtr = quarters[0].value;
  const [monthRange, setMonthRange] = useState<DateRangeState>({
    start: moment().subtract(1, 'months').toDate(),
    end: moment().toDate(),
  });

  // Format dates for API calls
  const {startDate, endDate} = useMemo(
    () => ({
      startDate: moment(monthRange.start).format('DD/MM/YYYY'),
      endDate: moment(monthRange.end).format('DD/MM/YYYY'),
    }),
    [monthRange.start, monthRange.end],
  );

  // ========== State Management ==========
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [monthRangeVisible, setMonthRangeVisible] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] =
    useState<AppDropdownItem | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    promoter: null,
    sort: null,
  });

  // FlatList ref for scrolling
  const flatListRef = useRef<FlatList>(null);

  // ========== API Hooks ==========
  const {data, isLoading, isError, refetch} = useGetSelloutInfo(
    YearQtr,
    startDate,
    endDate,
  );
  const {
    data: companyIds,
    isLoading: isCompanyIdsLoading,
    error,
  } = useGetCompanyIds();
  const {mutate} = useSaveSerialNumber();

  // ========== Computed Data ==========
  const uniquePromoters = useMemo(() => {
    if (!data) return [];
    const uniqueMap = new Map<string, string>();
    data.forEach(item => {
      if (!uniqueMap.has(item.Employee_Code)) {
        uniqueMap.set(item.Employee_Code, item.Promter_Name);
      }
    });
    return Array.from(uniqueMap, ([value, label]) => ({label, value}));
  }, [data]);

  // Filter and sort data based on selected filters
  const filteredData = useMemo(() => {
    if (!data) return [];

    // Apply promoter filter
    let result = data;
    if (filters.promoter) {
      result = result.filter(item => item.Employee_Code === filters.promoter);
    }

    // Apply sorting
    if (filters.sort) {
      result = [...result].sort((a, b) => {
        if (filters.sort === 'quantity_asc') {
          return a.Serial_count - b.Serial_count;
        } else if (filters.sort === 'quantity_desc') {
          return b.Serial_count - a.Serial_count;
        }
        return 0;
      });
    }

    return result;
  }, [data, filters]);

  // ========== Event Handlers ==========
  const handleSubmit = useCallback(() => {
    if (!searchValue.trim()) return;
    mutate({
      serialNumber: searchValue.trim(),
      SelloutType: type,
      CompanyId: selectedCompany?.value,
    });
  }, [searchValue, type, mutate, selectedCompany]);

  const handleBarcodeScanned = useCallback((code: string) => {
    setSearchValue(code);
    setIsScannerOpen(false);
  }, []);

  const handleDateRangeSelect = useCallback((start: Date, end: Date) => {
    setMonthRange({start, end});
    setMonthRangeVisible(false);
  }, []);

  const handleSearchClear = useCallback(() => {
    setSearchValue('');
  }, []);

  const handleFilterPress = useCallback(() => {
    showPromoterFilterSheet({
      promoters: uniquePromoters,
      selectedPromoter: filters.promoter,
      selectedSort: filters.sort,
      onApply: (result: PromoterFilterResult) => {
        setFilters({
          promoter: result.promoter,
          sort: result.sort,
        });
      },
      onReset: () => {
        setFilters({promoter: null, sort: null});
      },
    });
  }, [uniquePromoters, filters]);

  const handleClearFilters = useCallback(() => {
    setFilters({promoter: null, sort: null});
  }, []);

  const handleScroll = useCallback((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    // Show FAB when scrolled down more than 300 pixels
    setShowScrollToTop(offsetY > 300);
  }, []);

  const handlePress = useCallback((item: SelloutInfo) => {
    navigation.push('SelloutInfo',{type:type, PartnerCode: item.Employee_Code, Year_Qtr:YearQtr, StartDate:startDate, EndDate:endDate})
  }, []);

  const scrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({offset: 0, animated: true});
  }, []);

  const renderItem = useCallback(
    ({item}: {item: SelloutInfo}) => <SelloutInfoCard item={item} onPress={handlePress} />,
    [],
  );

  const renderHeader = useCallback(
    () =>
      !isLoading && (
        <View>
          {/* Sellout Information Header */}
          <AppText size="lg" weight="bold">
            Sellout Information
          </AppText>

          {/* Date Range & Filter Controls */}
          <View className="flex-row items-center mt-3">
            <MonthRangeCard
              range={monthRange}
              onPress={() => setMonthRangeVisible(true)}
            />
            <FilterButton onPress={handleFilterPress} />
          </View>

          {/* Active filters display */}
          {(filters.promoter || filters.sort) && (
            <View className="flex-row items-center flex-wrap gap-2 mt-3">
              {filters.promoter && (
                <View className="flex-row items-center bg-blue-50 dark:bg-blue-900/40 px-3 py-1.5 rounded-full">
                  <AppText
                    size="xs"
                    className="text-blue-700 dark:text-blue-300 mr-2">
                    Promoter:{' '}
                    {
                      uniquePromoters.find(p => p.value === filters.promoter)
                        ?.label
                    }
                  </AppText>
                  <TouchableOpacity
                    onPress={() =>
                      setFilters(prev => ({...prev, promoter: null}))
                    }>
                    <AppIcon
                      name="close-circle"
                      type="ionicons"
                      size={16}
                      color="#2563EB"
                    />
                  </TouchableOpacity>
                </View>
              )}
              {filters.sort && (
                <View className="flex-row items-center bg-blue-50 dark:bg-blue-900/40 px-3 py-1.5 rounded-full">
                  <AppText
                    size="xs"
                    className="text-blue-700 dark:text-blue-300 mr-2">
                    {filters.sort === 'quantity_asc'
                      ? 'Low to High'
                      : 'High to Low'}
                  </AppText>
                  <TouchableOpacity
                    onPress={() => setFilters(prev => ({...prev, sort: null}))}>
                    <AppIcon
                      name="close-circle"
                      type="ionicons"
                      size={16}
                      color="#2563EB"
                    />
                  </TouchableOpacity>
                </View>
              )}
              <TouchableOpacity onPress={handleClearFilters}>
                <AppText
                  size="xs"
                  className="text-blue-600 dark:text-blue-400 underline">
                  Clear all
                </AppText>
              </TouchableOpacity>
            </View>
          )}

          {/* Record count display */}
          {filteredData.length > 0 && (
            <AppText
              size="xs"
              className="text-gray-500 dark:text-gray-400 mb-1 mt-3">
              {filteredData.length}{' '}
              {filteredData.length === 1 ? 'record' : 'records'} found
              {(filters.promoter || filters.sort) && ' (filtered)'}
            </AppText>
          )}
        </View>
      ),
    [
      isLoading,
      searchValue,
      isDarkTheme,
      monthRange,
      filteredData.length,
      filters,
      uniquePromoters,
      handleSubmit,
      handleSearchClear,
      handleFilterPress,
      handleClearFilters,
    ],
  );

  const renderError = useCallback(
    () => (
      <Card className="items-center justify-center py-16 rounded-xl">
        <View className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/20 items-center justify-center mb-4">
          <AppIcon
            name="alert-circle"
            type="ionicons"
            size={48}
            color="#EF4444"
          />
        </View>
        <AppText
          size="lg"
          weight="bold"
          className="text-gray-800 dark:text-gray-100 mb-2">
          Failed to load data
        </AppText>
        <AppText
          size="sm"
          className="text-gray-500 dark:text-gray-400 text-center px-8 mb-4">
          Something went wrong while fetching the data. Please try again.
        </AppText>
        <TouchableOpacity
          onPress={() => refetch()}
          className="px-6 py-2.5 bg-blue-600 rounded-lg"
          activeOpacity={0.8}>
          <AppText size="sm" weight="semibold" className="text-white">
            Retry
          </AppText>
        </TouchableOpacity>
      </Card>
    ),
    [refetch],
  );

  const renderEmpty = useCallback(
    () => (
      <Card className="items-center justify-center py-16 rounded-xl">
        <View className="w-20 h-20 rounded-full bg-gray-50 dark:bg-gray-800 items-center justify-center mb-4">
          <AppIcon
            name="document-text-outline"
            type="ionicons"
            size={48}
            color="#6B7280"
          />
        </View>
        <AppText
          size="lg"
          weight="bold"
          className="text-gray-800 dark:text-gray-100 mb-2">
          No records found
        </AppText>
        <AppText
          size="sm"
          className="text-gray-500 dark:text-gray-400 text-center px-8">
          Try adjusting your date range or filter settings to see results.
        </AppText>
      </Card>
    ),
    [],
  );
  const title =
  type === 'e'
    ? 'End-User Sellout'
    : type === 'w'
    ? 'Dealer Sellout (Dis.)'
    : 'Dealer Sellout (No Dis.)';
  return (
    <AppLayout needBack needPadding title={title}>
      {/* Loading State */}
      {isLoading && <PromoterSkeleton />}

      {/* Serial Number Upload Section */}
      {!isLoading && (
        <Accordion
          containerClassName="bg-lightBg-surface dark:bg-darkBg-surface rounded-xl mb-5 border border-gray-200 dark:border-gray-700 px-4 pt-3 mt-4"
          //   contentClassName={`${isDropdownOpen ? 'pb-4' : 'pb-0'}`}
          header={
            <View className="mb-3 right-2">
              <AppText
                size="lg"
                weight="bold"
                className="text-gray-800 dark:text-gray-100">
                Upload Serial Number
              </AppText>
            </View>
          }
          needBottomBorder={false}
          initialOpening={true}>
          <>
            {type !== 'e' && (
              <View className="mb-2">
                <AppDropdown
                  mode="autocomplete"
                  label="Select Company ID"
                  placeholder={
                    isCompanyIdsLoading
                      ? 'Loading Company IDs...'
                      : 'Select Company ID'
                  }
                  disabled={isCompanyIdsLoading || !!error}
                  data={companyIds || []}
                  selectedValue={selectedCompany?.value}
                  onSelect={item => {
                    // No-op since selection is not stored
                    setIsDropdownOpen(prev => !prev);
                    setSelectedCompany(item);
                  }}
                  onOpenChange={() => setIsDropdownOpen(prev => !prev)}
                  required
                />
              </View>
            )}
            <AppInput
              label="Serial Number"
              value={searchValue}
              setValue={setSearchValue}
              placeholder="Enter or scan serial number"
              leftIcon="search"
              rightIconTsx={
                <View className="flex-row items-center">
                  <TouchableOpacity
                    onPress={() => setIsScannerOpen(true)}
                    className="px-3 py-2 rounded-lg flex-row items-center mr-2"
                    style={{
                      backgroundColor: isDarkTheme
                        ? AppColors.dark.primary
                        : '#EBF4FF',
                    }}
                    activeOpacity={0.7}>
                    <AppIcon
                      type="materialIcons"
                      name="qr-code-scanner"
                      size={18}
                      color="#2563EB"
                    />
                  </TouchableOpacity>
                </View>
              }
              onClear={handleSearchClear}
            />
            <View className="w-full mt-4 mb-5">
              <AppButton
                title="Submit"
                onPress={handleSubmit}
                disabled={!searchValue.trim()}
                className="rounded-xl py-2.5 bg-green-700"
                weight="semibold"
              />
            </View>
            {isDropdownOpen && <View className="h-20" />}
          </>
        </Accordion>
      )}
      {/* Error State */}
      {isError && !isLoading && renderError()}

      {/* Main Content - Sellout Information List */}
      {!isLoading && !isError && (
        <FlatList
          ref={flatListRef}
          data={filteredData}
          keyExtractor={(item, index) => `${item.Employee_Code}-${index}`}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{paddingBottom: 100}}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={10}
          removeClippedSubviews
          onScroll={handleScroll}
          scrollEventThrottle={16}
        />
      )}

      {/* Date Range Picker Modal */}
      <AppDatePicker
        mode="dateRange"
        visible={monthRangeVisible}
        onClose={() => setMonthRangeVisible(false)}
        initialStartDate={monthRange.start}
        initialEndDate={monthRange.end}
        minMonthYear={{month: 1, year: 2022}}
        maxMonthYear={{month: moment().month() + 1, year: moment().year()}}
        onDateRangeSelect={handleDateRangeSelect}
      />

      {/* Barcode Scanner Modal */}
      {isScannerOpen && (
        <BarcodeScanner
          onCodeScanned={handleBarcodeScanned}
          scanType="barcode"
          isScannerOpen={isScannerOpen}
          closeScanner={() => setIsScannerOpen(false)}
        />
      )}

      {/* Scroll to Top FAB */}
      {showScrollToTop && (
        <TouchableOpacity
          onPress={scrollToTop}
          activeOpacity={0.8}
          className="absolute bottom-8 right-6 w-14 h-14 bg-primary dark:bg-primary-dark rounded-full shadow-lg items-center justify-center">
          <AppIcon type="ionicons" name="arrow-up" size={24} color="white" />
        </TouchableOpacity>
      )}
    </AppLayout>
  );
}