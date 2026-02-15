import {FlatList, Pressable, View, RefreshControl} from 'react-native';
import {useLoginStore} from '../../../../../stores/useLoginStore';
import {handleAPACApiCall} from '../../../../../utils/handleApiCall';
import {useInfiniteQuery} from '@tanstack/react-query';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import RNCB from '@react-native-clipboard/clipboard';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import AppIcon from '../../../../../components/customs/AppIcon';
import AppText from '../../../../../components/customs/AppText';
import {TabHeader} from '../../../ASIN/WOD/components';
import Skeleton from '../../../../../components/skeleton/skeleton';
import SchemeSkeleton from '../../../../../components/skeleton/SchemesSkeleton';
import {ASUS, screenWidth} from '../../../../../utils/constant';
import {showToast} from '../../../../../utils/commonFunctions';
import moment from 'moment';
import Card from '../../../../../components/Card';
import AppButton from '../../../../../components/customs/AppButton';
import {downloadFile} from '../../../../../utils/services';
import ProgramSearch from './ProgramSearch';
import {showProgramFilterSheet} from './ProgramFilterSheet';
import FilterButton from '../../../../../components/FilterButton';

type SchemeCategory = typeof ONGOING | typeof LAPSED;

interface Scheme {
  Claim_Code: string;
  Start_Date: string;
  End_Date: string;
  Claim_name: string;
  Program_Period: string;
  Uploaded_By?: string;
  Uploaded_On?: string;
  File_Path?: string;
  Partner_Type?: string;
  Scheme_Year?: string;
  Scheme_Category?: string;
  Scheme_YearQtr?: string;
  Scheme_Month?: number;
  ActivatedTillDate?: number;
  ActivatedWithinPeriod?: number;
  Product_Category?: string;
}

interface PaginationEnvelope {
  ongoing?: Scheme[];
  lapsed?: Scheme[];
  hasMore: boolean;
  __page: number;
}

interface ModelSchemesByCategory {
  ongoing: Scheme[];
  lapsed: Scheme[];
}

interface SchemeCardProps {
  scheme: Scheme;
  category: SchemeCategory;
  onDownload?: (s: string) => void;
}
// Constants
const TabIndex = {
  ONGOING: 0, // Active
  EXPIRED: 2, // Lapsed
} as const;
const [ONGOING, LAPSED] = ['ongoing', 'lapsed'] as const;
const LIMIT = 10 as const;
const SCROLL_THRESHOLD = 350;
// Helper functions
function safeFormatDate(dateStr?: string, format = 'DD MMM, YYYY') {
  if (!dateStr) return '—';
  const m = moment(dateStr);
  return m.isValid() ? m.format(format) : '—';
}

function dedupeSchemes(schemes: Scheme[]): Scheme[] {
  const seen = new Set<string>();
  const output: Scheme[] = [];
  for (const s of schemes) {
    const code = s?.Claim_Code;
    if (!code || !seen.has(code)) {
      if (code) seen.add(code);
      output.push(s);
    }
  }
  return output;
}

function formatCountdown(msRemaining: number): string {
  if (msRemaining <= 0) return 'Ending now';
  const totalSec = Math.floor(msRemaining / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${d}d ${h}h ${m}m ${s.toString().padStart(2, '0')}s`;
}

// API Calls
const fetchOngoingSchemes = async (
  roleId: number,
  empCode: string,
  page: number,
) => {
  console.log('Fetching ongoing schemes, page:', page);
  const res = await handleAPACApiCall('/Information/GetAllSchemeInfo', {
    employeeCode: empCode,
    RoleId: roleId,
    OngoingSchemePageNumber: page,
    HistoricSchemePageNumber: 1, // keep constant
    RowPerPage: LIMIT,
  });

  const result = res?.DashboardData;
  if (!result?.Status) {
    throw new Error(result?.Message || 'Failed to fetch ongoing schemes');
  }

  return {
    ongoing: result?.Datainfo?.Scheme_Info_Ongoing ?? [],
    hasMore: (result?.Datainfo?.Scheme_Info_Ongoing ?? []).length >= LIMIT,
    pp: result?.Datainfo?.Table2 ?? [], // keep pp data here for first load
    __page: page,
  };
};

const fetchHistoricSchemes = async (
  roleId: number,
  empCode: string,
  page: number,
) => {
  const res = await handleAPACApiCall('/Information/GetAllSchemeInfo', {
    employeeCode: empCode,
    RoleId: roleId,
    OngoingSchemePageNumber: 1, // keep constant
    HistoricSchemePageNumber: page,
    RowPerPage: LIMIT,
  });

  const result = res?.DashboardData;
  if (!result?.Status) {
    throw new Error(result?.Message || 'Failed to fetch historic schemes');
  }

  return {
    lapsed: result?.Datainfo?.Scheme_Info_Historic ?? [],
    hasMore: (result?.Datainfo?.Scheme_Info_Historic ?? []).length >= LIMIT,
    __page: page,
  };
};

const CountdownBadge: React.FC<{endDate: string; category: SchemeCategory}> = ({
  endDate,
  category,
}) => {
  const endTs = useMemo(() => {
    const date = new Date(endDate);
    if (isNaN(date.getTime())) return null;
    date.setHours(23, 59, 59, 999);
    return date.getTime();
  }, [endDate]);
  const [now, setNow] = useState(Date.now());
  const isLapsed = category === LAPSED || (endTs ? endTs <= now : false);
  useEffect(() => {
    if (!endTs || isLapsed) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [endTs, isLapsed]);
  const label = !endTs
    ? '—'
    : isLapsed
      ? 'Event Ended'
      : `Event ends in ${formatCountdown(endTs - now)}`;
  return (
    <View className="mt-2 self-start flex-row items-center px-2 py-1 rounded-full bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700">
      <AppIcon
        type="feather"
        name={isLapsed ? 'alert-circle' : 'clock'}
        size={14}
        color={isLapsed ? '#dc2626' : '#b91c1c'}
      />
      <AppText
        size="sm"
        weight="semibold"
        className={`ml-1 ${isLapsed ? 'text-red-600 dark:text-red-300' : 'text-red-700 dark:text-red-300'}`}>
        {label}
      </AppText>
    </View>
  );
};

const InfoRow: React.FC<{
  label: string;
  value: string;
  icon?: {type: any; name: string};
  trailingAction?: () => React.ReactNode;
  valueClassName?: string;
}> = ({label, value, icon, trailingAction, valueClassName}) => (
  <View className="flex-row items-center py-2 border-b border-slate-100 last:border-b-0 dark:border-slate-700">
    <View className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-700 items-center justify-center mr-3">
      {icon && (
        <AppIcon
          type={icon.type as any}
          // @ts-ignore
          name={icon.name}
          size={15}
          color="#475569"
        />
      )}
    </View>
    <View className="flex-1 pr-2">
      <AppText size="xs" className="text-slate-400" numberOfLines={1}>
        {label}
      </AppText>
      <AppText
        size="sm"
        weight="medium"
        className={`text-slate-700 dark:text-slate-200 ${valueClassName ?? ''}`}>
        {value}
      </AppText>
    </View>
    {trailingAction && trailingAction()}
  </View>
);

const AnimatedFAB: React.FC<{
  visible: boolean;
  animatedValue: any;
  onPress: () => void;
}> = ({visible, animatedValue, onPress}) => {
  const style = useAnimatedStyle(() => {
    const translateY = interpolate(
      animatedValue.value,
      [0, 1],
      [40, 0],
      Extrapolation.CLAMP,
    );
    const opacity = animatedValue.value;
    const scale = interpolate(
      animatedValue.value,
      [0, 1],
      [0.85, 1],
      Extrapolation.CLAMP,
    );
    return {opacity, transform: [{translateY}, {scale}]};
  }, []);

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[{position: 'absolute', bottom: 24, right: 20}, style]}>
      <Pressable
        onPress={onPress}
        className="rounded-full bg-primary w-14 h-14 items-center justify-center ">
        <AppIcon type="feather" name="arrow-up" size={24} color="#fff" />
      </Pressable>
    </Animated.View>
  );
};

const SchemeCardInner: React.FC<SchemeCardProps> = ({
  scheme,
  category,
  onDownload,
}) => {
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const copyClaim = useCallback(() => {
    if (!scheme?.Claim_Code) {
      showToast('No claim code');
      return;
    }
    try {
      RNCB.setString(scheme.Claim_Code);
      setCopied(true);
      showToast('Claim code copied');
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.log('Clipboard error', e);
      showToast('Clipboard not available');
    }
  }, [scheme?.Claim_Code]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const period = `${safeFormatDate(scheme?.Start_Date)} - ${safeFormatDate(scheme?.End_Date)}`;

  const handleDownloadPress = useCallback(() => {
    if (!onDownload) return;
    onDownload(scheme?.File_Path || '');
  }, [onDownload, scheme?.File_Path]);

  return (
    <Card className="mb-5 p-4 rounded-lg bg-white dark:bg-darkBg-surface">
      <View className="mb-3">
        <AppText
          size="md"
          weight="semibold"
          className="text-heading dark:text-heading-dark"
          numberOfLines={2}>
          {scheme?.Claim_name || 'Untitled Scheme'}
        </AppText>
        {!!scheme?.End_Date && (
          <CountdownBadge endDate={scheme.End_Date} category={category} />
        )}
      </View>

      <View className="mt-1">
        <InfoRow
          icon={{type: 'feather', name: 'tag'}}
          label="Claim Code"
          value={scheme?.Claim_Code || '—'}
          trailingAction={() => (
            <Pressable
              onPress={copyClaim}
              className={`ml-2 flex-row items-center px-2.5 py-1 rounded-full border ${copied ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700' : 'bg-slate-50 dark:bg-slate-600/60 border-slate-200 dark:border-slate-500'}`}>
              <AppIcon
                type="feather"
                name={copied ? 'check' : 'copy'}
                size={14}
                color={copied ? '#2563eb' : '#475569'}
              />
              <AppText
                size="xs"
                weight="medium"
                className={`ml-1 ${copied ? 'text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-200'}`}>
                {copied ? 'Copied' : 'Copy'}
              </AppText>
            </Pressable>
          )}
        />
        <InfoRow
          icon={{type: 'feather', name: 'calendar'}}
          label="Event Period"
          value={period || '—'}
        />
      </View>

      <AppButton
        title="Download Scheme"
        onPress={handleDownloadPress}
        iconName="download"
        className="mt-5 rounded-lg bg-primary"
        size="sm"
        weight="semibold"
        noLoading
      />
    </Card>
  );
};

export default function Program() {
  const flatListRef = useRef<FlatList<Scheme>>(null);
  const userInfo = useLoginStore(state => state.userInfo);
  const roleId = Number(userInfo?.EMP_RoleId ?? 0);

  const [modelLoading, setModelLoading] = useState(false);
  const [modelSchemes, setModelSchemes] = useState<ModelSchemesByCategory>({
    ongoing: [],
    lapsed: [],
  });
  const [modelSearchActive, setModelSearchActive] = useState(false);
  const [selectedModelName, setSelectedModelName] = useState<string>('');
  const [modelTabIndex, setModelTabIndex] = useState(0); // 0 = ongoing, 1 = lapsed
  const [activeTabidx, setActiveTabidx] = useState<number>(TabIndex.ONGOING);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const fabVisible = useSharedValue(0);
  
  // Filter state
  const [selectedFilters, setSelectedFilters] = useState<{
    Months?: any[];
    'Product Lines'?: string[];
  }>({});

  const keyExtractor = useCallback(
    (item: Scheme, index: number) =>
      item?.Claim_Code || `${activeTabidx}-${index}`,
    [activeTabidx],
  );

  // Fetch ongoing + initial PP list
  const {
    data: ongoingData,
    fetchNextPage: fetchNextOngoing,
    hasNextPage: hasMoreOngoing,
    isFetchingNextPage: fetchingOngoing,
    isLoading: loadingOngoing,
    refetch: onRefreshOngoing,
  } = useInfiniteQuery<PaginationEnvelope>({
    queryKey: ['schemes-ongoing', userInfo?.EMP_Code, roleId],
    initialPageParam: 1,
    queryFn: ({pageParam}) =>
      fetchOngoingSchemes(
        roleId,
        userInfo?.EMP_Code ?? '',
        Number(pageParam || 1),
      ),
    getNextPageParam: lastPage =>
      lastPage?.hasMore ? (lastPage.__page ?? 1) + 1 : undefined,
  });

  const {
    data: historicData,
    fetchNextPage: fetchNextHistoric,
    hasNextPage: hasMoreHistoric,
    isFetchingNextPage: fetchingHistoric,
    isLoading: loadingHistoric,
    refetch: onRefreshHistoric,
  } = useInfiniteQuery<PaginationEnvelope>({
    queryKey: ['schemes-historic', userInfo?.EMP_Code, roleId],
    initialPageParam: 1,
    queryFn: ({pageParam}) =>
      fetchHistoricSchemes(
        roleId,
        userInfo?.EMP_Code ?? '',
        Number(pageParam || 1),
      ),
    getNextPageParam: lastPage =>
      lastPage?.hasMore ? (lastPage.__page ?? 1) + 1 : undefined,
  });

  const ongoingList = useMemo(() => {
    const arr =
      (ongoingData as any)?.pages?.flatMap(
        (p: PaginationEnvelope) => p?.ongoing ?? [],
      ) ?? [];
    return dedupeSchemes(arr as Scheme[]);
  }, [ongoingData]);

  const historicList = useMemo(() => {
    const arr =
      (historicData as any)?.pages?.flatMap(
        (p: PaginationEnvelope) => p?.lapsed ?? [],
      ) ?? [];
    return dedupeSchemes(arr as Scheme[]);
  }, [historicData]);

  // Dynamic product lines extracted from scheme data
  const dynamicProductLines = useMemo(() => {
    const productCategories = new Set<string>();

    // Extract from ongoing schemes
    ongoingList.forEach(scheme => {
      if (scheme?.Product_Category) {
        productCategories.add(scheme.Product_Category);
      }
    });

    // Extract from lapsed schemes
    historicList.forEach(scheme => {
      if (scheme?.Product_Category) {
        productCategories.add(scheme.Product_Category);
      }
    });

    // Extract from model schemes when in model search mode
    if (modelSearchActive) {
      modelSchemes.ongoing.forEach(scheme => {
        if (scheme?.Product_Category) {
          productCategories.add(scheme.Product_Category);
        }
      });
      modelSchemes.lapsed.forEach(scheme => {
        if (scheme?.Product_Category) {
          productCategories.add(scheme.Product_Category);
        }
      });
    }

    return Array.from(productCategories).sort();
  }, [ongoingList, historicList, modelSchemes, modelSearchActive]);

  // Filter function for scheme data
  const filterSchemeData = useCallback((data: Scheme[], filters: any) => {
    if (!data || data.length === 0) return data;
    if (!filters || Object.keys(filters).length === 0) return data;

    return data.filter(item => {
      // Check month filters
      if (filters.Months && filters.Months.length > 0) {
        const matchesMonth = filters.Months.some((monthFilter: any) => {
          // Get the comparison value (could be string or object with value property)
          const compareValue =
            typeof monthFilter === 'object' && monthFilter.value
              ? monthFilter.value
              : monthFilter;

          // Direct comparison with Scheme_Month field
          return item?.Scheme_Month === compareValue;
        });

        if (!matchesMonth) return false;
      }

      // Check product line filters
      if (filters['Product Lines'] && filters['Product Lines'].length > 0) {
        const matchesProductLine = filters['Product Lines'].some(
          (productFilter: any) => {
            // Get the comparison value
            const compareValue =
              typeof productFilter === 'object' && productFilter.value
                ? productFilter.value
                : productFilter;

            // Check against Product_Category field
            return item?.Product_Category === compareValue;
          },
        );

        if (!matchesProductLine) return false;
      }

      return true;
    });
  }, []);

  // Filtered data using useMemo for performance
  const filteredOngoingList = useMemo(() => {
    return filterSchemeData(ongoingList, selectedFilters);
  }, [ongoingList, selectedFilters, filterSchemeData]);

  const filteredHistoricList = useMemo(() => {
    return filterSchemeData(historicList, selectedFilters);
  }, [historicList, selectedFilters, filterSchemeData]);

  const filteredModelOngoing = useMemo(() => {
    return filterSchemeData(modelSchemes.ongoing, selectedFilters);
  }, [modelSchemes.ongoing, selectedFilters, filterSchemeData]);

  const filteredModelLapsed = useMemo(() => {
    return filterSchemeData(modelSchemes.lapsed, selectedFilters);
  }, [modelSchemes.lapsed, selectedFilters, filterSchemeData]);

  // Calculate total active filters
  const getTotalActiveFilters = useMemo(() => {
    if (!selectedFilters || Object.keys(selectedFilters).length === 0) return 0;

    return Object.values(selectedFilters).reduce((total, filterArray) => {
      return total + (Array.isArray(filterArray) ? filterArray.length : 0);
    }, 0);
  }, [selectedFilters]);

  // Toggle filter modal
  const toggleFilterModal = useCallback(() => {
    showProgramFilterSheet({
      selectedFilters,
      onFiltersChange: setSelectedFilters,
      dynamicProductLines,
      hasModelSelected: modelSearchActive,
    });
  }, [selectedFilters, dynamicProductLines, modelSearchActive]);

  // const handleEndReached = useCallback(() => {
  //   if (hasMore && !loadingMore) loadNext?.();
  // }, [hasMore, loadingMore, loadNext]);

  const {selectedData, hasMore, loadingMore, loadNext, onRefresh} =
    useMemo(() => {
      if (modelSearchActive) {
        const selectedModelData =
          modelTabIndex === 0 ? filteredModelOngoing : filteredModelLapsed;
        return {
          selectedData: selectedModelData,
          hasMore: false,
          loadingMore: modelLoading,
          loadNext: () => {},
          onRefresh: () => {},
        } as const;
      } else if (activeTabidx === TabIndex.ONGOING) {
        return {
          selectedData: filteredOngoingList,
          hasMore: !!hasMoreOngoing,
          loadingMore: fetchingOngoing,
          loadNext: fetchNextOngoing,
          onRefresh: onRefreshOngoing,
        } as const;
      } else {
        return {
          selectedData: filteredHistoricList,
          hasMore: !!hasMoreHistoric,
          loadingMore: fetchingHistoric,
          loadNext: fetchNextHistoric,
          onRefresh: onRefreshHistoric,
        } as const;
      }
    }, [
      activeTabidx,
      filteredOngoingList,
      hasMoreOngoing,
      fetchingOngoing,
      fetchNextOngoing,
      filteredHistoricList,
      hasMoreHistoric,
      fetchingHistoric,
      fetchNextHistoric,
      onRefreshOngoing,
      onRefreshHistoric,
      modelSearchActive,
      filteredModelOngoing,
      filteredModelLapsed,
      modelLoading,
      modelTabIndex,
    ]);

  const handleScroll = useCallback(
    (e: any) => {
      const y = e?.nativeEvent?.contentOffset?.y ?? 0;
      const shouldShow = y > SCROLL_THRESHOLD;
      if (shouldShow !== showScrollTop) {
        setShowScrollTop(shouldShow);
        fabVisible.value = withTiming(shouldShow ? 1 : 0, {
          duration: 260,
          easing: Easing.out(Easing.cubic),
        });
      }
    },
    [showScrollTop, fabVisible],
  );

  const ListHeader = useMemo(
    () => (
      <View className="pb-3">
        <View className="flex-row items-center pl-1 pt-4 mb-1">
          <View className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-900/40 items-center justify-center mr-2">
            <AppIcon type="feather" name="layers" size={18} color="#7c3aed" />
          </View>
          <AppText
            size="lg"
            weight="bold"
            className="text-heading dark:text-heading-dark">
            {modelSearchActive && selectedModelName
              ? `Program - ${selectedModelName}`
              : 'Programs'}
          </AppText>
        </View>
        {modelSearchActive ? (
          <TabHeader
            tabs={[
              `${userInfo?.EMP_CountryID === ASUS.COUNTRIES.ATID ? 'Sedang Berlangsung' : 'Ongoing'} (${filteredModelOngoing.length})`,
              `${userInfo?.EMP_CountryID === ASUS.COUNTRIES.ATID ? 'Bekas' : 'Lapsed'} (${filteredModelLapsed.length})`,
            ]}
            activeIndex={modelTabIndex}
            onChange={setModelTabIndex}
          />
        ) : (
          <TabHeader
            tabs={[
              `${userInfo?.EMP_CountryID === ASUS.COUNTRIES.ATID ? 'Sedang Berlangsung ' : 'Ongoing'} (${filteredOngoingList.length})`,
              `${userInfo?.EMP_CountryID === ASUS.COUNTRIES.ATID ? 'Bekas ' : 'Lapsed'} (${filteredHistoricList.length})`,
            ]}
            activeIndex={activeTabidx}
            onChange={setActiveTabidx}
          />
        )}
      </View>
    ),
    [
      activeTabidx,
      setActiveTabidx,
      filteredHistoricList.length,
      filteredOngoingList.length,
      modelSearchActive,
      selectedModelName,
      filteredModelOngoing.length,
      filteredModelLapsed.length,
      modelTabIndex,
      userInfo?.EMP_CountryID,
    ],
  );
  const scrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({offset: 0, animated: true});
  }, []);

  const currentCategory = activeTabidx === TabIndex.ONGOING ? ONGOING : LAPSED;
  const searchCategory: SchemeCategory = modelTabIndex === 0 ? ONGOING : LAPSED;
  const handleDownload = useCallback(async (url: string) => {
    if (!url) {
      showToast('File not available');
      return;
    }
    const fileName = url.split('/').pop() || 'Scheme_File';
    try {
      showToast('Downloading file...');
      await downloadFile({
        url: url,
        fileName: fileName,
        autoOpen: true,
      });
    } catch (e) {
      console.log('Open URL error', e);
      showToast('Unable to open link');
    }
  }, []);

  const renderItem = useCallback(
    ({item}: {item: Scheme}) => (
      <SchemeCardInner
        scheme={item}
        category={modelSearchActive ? searchCategory : currentCategory}
        onDownload={handleDownload}
      />
    ),
    [currentCategory, handleDownload, modelSearchActive, searchCategory],
  );

  const EmptyList = useMemo(() => {
    const label = modelSearchActive
      ? 'No programs found for selected model'
      : activeTabidx === TabIndex.ONGOING
        ? 'No ongoing programs available'
        : 'No lapsed programs available';
    return (
      <View className="items-center justify-center py-16">
        <View className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 items-center justify-center mb-3">
          <AppIcon type="feather" name="box" size={20} color="#64748b" />
        </View>
        <AppText size="sm" className="text-slate-500 dark:text-slate-300">
          {label}
        </AppText>
      </View>
    );
  }, [modelSearchActive, activeTabidx]);

  const showSkeleton =
    modelLoading ||
    (loadingOngoing && !ongoingList.length) ||
    (loadingHistoric && !historicList.length);

  if (showSkeleton) return <SchemeSkeleton />;

  console.log('Rendering Program with', selectedData);

  return (
    <View className="flex-1 bg-lightBg-base dark:bg-darkBg-base">
      {/* Search and Filter Header */}
      <View className="flex-row items-center px-3 pt-3 pb-2 border-b border-slate-200 dark:border-slate-700">
        <View className="flex-1 mr-2">
          <ProgramSearch
            selectedModelName={selectedModelName}
            onModelLoading={setModelLoading}
            onModelSchemes={(schemesByCategory, modelName) => {
              setModelSchemes(schemesByCategory);
              setModelSearchActive(true);
              setSelectedModelName(modelName);
              setModelTabIndex(0); // Reset to ongoing tab when new model is selected
            }}
            onClearSearch={() => {
              setModelSearchActive(false);
              setModelSchemes({ongoing: [], lapsed: []});
              setSelectedModelName('');
              setModelLoading(false);
              setModelTabIndex(0);
            }}
          />
        </View>
        
        {/* Filter Button */}
        <FilterButton
          onPress={toggleFilterModal}
          hasActiveFilters={getTotalActiveFilters > 0}
          // iconSize={}
          containerClassName='p-3'
        />
      </View>

      <FlatList
        ref={flatListRef}
        data={selectedData}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        // onEndReached={handleEndReached}
        onEndReachedThreshold={0.2}
        onScroll={handleScroll}
        scrollEventThrottle={32}
        // ListFooterComponent={ListFooter}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={EmptyList}
        contentContainerClassName="px-3"
        refreshControl={
          <RefreshControl
            refreshing={
              modelSearchActive
                ? modelLoading
                : activeTabidx === TabIndex.ONGOING
                  ? !!loadingOngoing
                  : activeTabidx === TabIndex.EXPIRED
                    ? !!loadingHistoric
                    : !!loadingOngoing
            }
            onRefresh={modelSearchActive ? () => {} : onRefresh}
          />
        }
        removeClippedSubviews
        initialNumToRender={6}
        windowSize={11}
      />
      <AnimatedFAB
        visible={showScrollTop}
        animatedValue={fabVisible}
        onPress={scrollToTop}
      />
    </View>
  );
}
