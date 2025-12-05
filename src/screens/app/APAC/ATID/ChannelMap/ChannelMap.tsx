import {useCallback, useMemo, useState, memo} from 'react';
import {TouchableOpacity, View, FlatList, RefreshControl} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import {twMerge} from 'tailwind-merge';
import {
  showChannelMapFilterSheet,
  ChannelMapFilterResult,
} from './ChannelMapFilterSheet';
import {useLoginStore} from '../../../../../stores/useLoginStore';
import {handleAPACApiCall} from '../../../../../utils/handleApiCall';
import Skeleton from '../../../../../components/skeleton/skeleton';
import {screenWidth} from '../../../../../utils/constant';
import Card from '../../../../../components/Card';
import AppIcon from '../../../../../components/customs/AppIcon';
import AppText from '../../../../../components/customs/AppText';
import Accordion from '../../../../../components/Accordion';
import {convertToAPACUnits} from '../../../../../utils/commonFunctions';
import { FilterButton } from '../../../ASIN/Claim/components';
import { AppNavigationProp } from '../../../../../types/navigation';
import { useNavigation } from '@react-navigation/native';
import { AppColors } from '../../../../../config/theme';
import { useThemeStore } from '../../../../../stores/useThemeStore';

interface ChannelMapData {
  ACM_BranchName: string;
  ACM_Partner_Type: string;
  ACM_Gst_No: string;
  ACM_CompanyName: string;
  ACT: number;
  Inventory: number;
  SI: number;
  Hit_Rate: number | null;
}

interface GroupedBranchData {
  branch: string;
  territories: ChannelMapData[];
  total_partners: number;
}

export const STAT_PALETTE = [
  {tint: 'text-green-600', iconBg: 'bg-green-500', icon: 'git-branch'},
  {tint: 'text-blue-600', iconBg: 'bg-blue-500', icon: 'users'},
] as const;

const useGetChannelMapData = () => {
  const {EMP_Code: employeeCode = '', EMP_RoleId: RoleId = ''} = useLoginStore(
    state => state.userInfo,
  );

  return useQuery({
    queryKey: ['channelMapData', employeeCode, RoleId],
    queryFn: async (): Promise<ChannelMapData[]> => {
      const res = await handleAPACApiCall('/Information/GetChannelMapInfo', {
        employeeCode,
        RoleId,
      });
      const result = res?.DashboardData;

      if (!result?.Status) {
        console.error('API returned status false:', result);
        throw new Error('Failed to fetch channel map data');
      }

      return result.Datainfo?.Channelmap_Info || [];
    }
  });
};

const groupByBranch = (data: ChannelMapData[]): GroupedBranchData[] => {
  const grouped = data.reduce(
    (acc, item) => {
      const branch = item.ACM_BranchName;
      if (!acc[branch]) {
        acc[branch] = [];
      }
      acc[branch].push(item);
      return acc;
    },
    {} as Record<string, ChannelMapData[]>,
  );

  return Object.entries(grouped)
    .map(([branch, territories]) => ({
      branch,
      territories,
      total_partners: territories.length,
    }))
    .sort((a, b) => b.total_partners - a.total_partners); // Sort by partner count
};

const BranchCard = memo(
  ({item}: {item: GroupedBranchData}) => {
    const navigation = useNavigation<AppNavigationProp>()
    const [isExpanded, setIsExpanded] = useState(false);
    const [visibleCount, setVisibleCount] = useState(5);
    const isDarkTheme = useThemeStore(state=>state.AppTheme === 'dark');

    const visibleTerritories = useMemo(
      () => item.territories.slice(0, visibleCount),
      [item.territories, visibleCount],
    );

    const hasMore = visibleCount < item.territories.length;
    const showLoadMoreButton = item.territories.length > 5;

    const handleToggleExpand = useCallback(() => {
      setIsExpanded(prev => !prev);
    }, []);

    const handleLoadMore = useCallback(() => {
      const newCount = Math.min(visibleCount + 10, item.territories.length);
      setVisibleCount(newCount);
    }, [visibleCount, item.territories.length]);

    const handleSeeLess = useCallback(() => {
      setVisibleCount(5);
    }, []);

    // Calculate total metrics
    const totals = useMemo(() => {
      return item.territories.reduce(
        (acc, territory) => ({
          ACT: acc.ACT + territory.ACT,
          SI: acc.SI + territory.SI,
          INV: acc.INV + territory.Inventory,
          RR: acc.RR + (territory.Hit_Rate || 0),
        }),
        {ACT: 0, SI: 0, INV: 0, RR: 0},
      );
    }, [item.territories]);

    const AccordionHeader = (
      <View className="py-3 flex-1">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View className="w-9 h-9 rounded-xl bg-blue-100 items-center justify-center mr-3">
              <AppIcon
                name="map-pin"
                type="feather"
                size={18}
                color="#2563EB"
              />
            </View>
            <View className="flex-1">
              <AppText
                size="lg"
                weight="bold"
                className="text-slate-900 dark:text-slate-100 mb-0.5"
                numberOfLines={1}>
                {item.branch}
              </AppText>
            </View>
          </View>

          <View className="flex-row items-center bg-slate-100/80 dark:bg-slate-700/80 px-3 py-1 rounded-full">
            <AppText
              size="xs"
              weight="medium"
              className="text-[10px] text-slate-400 ml-1">
              Partners:{' '}
            </AppText>
            <AppText
              size="md"
              weight="bold"
              className="text-[10px] text-slate-700">
              {item.total_partners}
            </AppText>
          </View>
        </View>

        {/* Summary Metrics */}
        <View className="flex-row gap-2 rounded-xl  mt-3">
          <MetricBadge
            label="ACT"
            value={convertToAPACUnits(totals.ACT)}
            color="emerald"
          />
          <MetricBadge
            label="SI"
            value={convertToAPACUnits(totals.SI)}
            color="rose"
          />
          <MetricBadge
            label="INV"
            value={convertToAPACUnits(totals.INV)}
            color="blue"
          />
          <MetricBadge
            label="RR"
            value={Math.round(totals.RR / item.territories.length)}
            color="amber"
          />
        </View>
      </View>
    );

    return (
      <Card className="p-0 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <Accordion
          header={AccordionHeader}
          isOpen={isExpanded}
          onToggle={handleToggleExpand}
          duration={300}
          containerClassName=""
          headerClassName="py-0"
          contentClassName=""
          needBottomBorder={false}
          needShadow={false}
          arrowSize={20}>
          <View className="border-t border-slate-300 dark:border-slate-700">
            {visibleTerritories.map((territory, idx) => (
              <TerritoryRow
                key={`${territory.ACM_CompanyName}-${idx}`}
                territory={territory}
                isLast={idx === visibleTerritories.length - 1 && !hasMore}
                navigation={navigation}
                isDarkTheme={isDarkTheme}
              />
            ))}

            {/* Load More / See Less Buttons */}
            {showLoadMoreButton && (
              <View className="border-t border-slate-100 dark:border-slate-800">
                {hasMore ? (
                  <TouchableOpacity
                    onPress={handleLoadMore}
                    activeOpacity={0.7}
                    className="py-3 bg-slate-50 dark:bg-slate-800/50">
                    <View className="flex-row items-center justify-center">
                      <AppIcon
                        name="chevron-down"
                        type="feather"
                        size={16}
                        color="#3B82F6"
                      />
                      <AppText
                        size="sm"
                        weight="semibold"
                        className="text-blue-600 dark:text-blue-400 ml-2">
                        Load More ({item.territories.length - visibleCount}{' '}
                        remaining)
                      </AppText>
                    </View>
                  </TouchableOpacity>
                ) : (
                  visibleCount > 5 && (
                    <TouchableOpacity
                      onPress={handleSeeLess}
                      activeOpacity={0.7}
                      className="py-3 bg-slate-50 dark:bg-slate-800/50">
                      <View className="flex-row items-center justify-center">
                        <AppIcon
                          name="chevron-up"
                          type="feather"
                          size={16}
                          color="#3B82F6"
                        />
                        <AppText
                          size="sm"
                          weight="semibold"
                          className="text-blue-600 dark:text-blue-400 ml-2">
                          Show Less
                        </AppText>
                      </View>
                    </TouchableOpacity>
                  )
                )}
              </View>
            )}
          </View>
        </Accordion>
      </Card>
    );
  },
);

const TerritoryRow = memo(
  ({territory, isLast,navigation,isDarkTheme}: {territory: ChannelMapData; isLast: boolean, navigation: AppNavigationProp, isDarkTheme: boolean}) => {
    return (
      <TouchableOpacity
      onPress={()=>navigation.push('ChannelMapDealerInfo',{Dealer_Data:territory})}
        className={twMerge(
          'px-4 py-4 border-b border-slate-100 dark:border-slate-800',
          isLast && 'border-b-0',
        )}>
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-1 mr-3">
            <AppText
              size="base"
              weight="semibold"
              className="text-slate-800 dark:text-slate-100 mb-1"
              numberOfLines={2}>
              {territory.ACM_CompanyName}
            </AppText>
            <View className="flex-row items-center">
              <View className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md mr-2">
                <AppText
                  size="xs"
                  weight="medium"
                  className="text-slate-600 dark:text-slate-400">
                  {territory.ACM_Partner_Type || 'N/A'}
                </AppText>
              </View>
              {territory.ACM_Gst_No && (
                <View className="flex-row items-center">
                  <AppIcon
                    name="file-text"
                    type="feather"
                    size={10}
                    color="#94A3B8"
                  />
                  <AppText
                    size="xs"
                    className="text-slate-500 dark:text-slate-400 ml-1"
                    numberOfLines={1}>
                    GST: {territory.ACM_Gst_No}
                  </AppText>
                </View>
              )}
            </View>
          </View>

          <View
            className="bg-slate-100 dark:bg-slate-700 rounded-full p-2">
            <AppIcon
              name="chevron-right"
              type="feather"
              size={18}
              color={isDarkTheme ? AppColors.dark.text : "#64748B"}
            />
          </View>
        </View>

        {/* Metrics Grid */}
        <View className="flex-row gap-2">
          <MetricCard label="ACT" value={territory.ACT} color="emerald" />
          <MetricCard label="SI" value={territory.SI} color="rose" />
          <MetricCard label="INV" value={territory.Inventory} color="blue" />
          <MetricCard
            label="RR"
            value={territory.Hit_Rate || 0}
            color="amber"
          />
        </View>
      </TouchableOpacity>
    );
  },
);

const MetricBadge = memo(
  ({
    label,
    value,
    color,
  }: {
    label: string;
    value: number | string;
    color: 'emerald' | 'rose' | 'blue' | 'amber';
  }) => {
    const colorClasses = {
      emerald: {
        text: 'text-emerald-700 dark:text-emerald-400',
      },
      rose: {
        text: 'text-rose-700 dark:text-rose-400',
      },
      blue: {
        text: 'text-blue-700 dark:text-blue-400',
      },
      amber: {
        text: 'text-amber-700 dark:text-amber-400',
      },
    };

    const classes = colorClasses[color];

    return (
      <View className={twMerge('flex-1 rounded-xl p-2')}>
        <AppText
          size="xs"
          weight="medium"
          className={twMerge(
            'uppercase tracking-wide text-center mb-0.5',
            classes.text,
          )}>
          {label}
        </AppText>
        <AppText
          size="lg"
          weight="bold"
          className={twMerge('text-center', classes.text)}>
          {value}
        </AppText>
      </View>
    );
  },
);

const MetricCard = memo(
  ({
    label,
    value,
    color,
  }: {
    label: string;
    value: number;
    color: 'emerald' | 'rose' | 'blue' | 'amber';
  }) => {
    const colorConfig = {
      emerald: {
        text: 'text-emerald-600 dark:text-emerald-400',
        labelText: 'text-emerald-600 dark:text-emerald-500',
      },
      rose: {
        text: 'text-rose-600 dark:text-rose-400',
        labelText: 'text-rose-600 dark:text-rose-500',
      },
      blue: {
        text: 'text-blue-600 dark:text-blue-400',
        labelText: 'text-blue-600 dark:text-blue-500',
      },
      amber: {
        text: 'text-amber-600 dark:text-amber-400',
        labelText: 'text-amber-600 dark:text-amber-500',
      },
    };

    const config = colorConfig[color];

    return (
      <View className="flex-1 p-2">
        <View className="flex-row items-center justify-between mb-1">
          <AppText
            size="xs"
            weight="semibold"
            className={twMerge('uppercase tracking-wide', config.labelText)}>
            {label}
          </AppText>
        </View>
        <AppText size="xl" weight="bold" className={config.text}>
          {value}
        </AppText>
      </View>
    );
  },
);

const ChannelMapSkeleton = memo(() => {
  return (
    <View className="flex-1 bg-lightBg-base dark:bg-darkBg-base px-3 pt-5">
      {Array.from({length: 5}).map((_, i) => (
        <View key={i} className="mb-4">
          <Skeleton width={screenWidth - 24} height={140} borderRadius={12} />
        </View>
      ))}
    </View>
  );
});

export default function ChannelMap() {
  const {
    data: channelMapData,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useGetChannelMapData();

  // Filter state
  const [filters, setFilters] = useState<ChannelMapFilterResult>({
    branchName: null,
    partnerType: null,
    partnerName: null,
  });

  // Extract unique filter options from API data
  const filterOptions = useMemo(() => {
    if (!channelMapData) return {branches: [], partnerTypes: [], partnerNames: []};

    const branches = Array.from(
      new Set(channelMapData.map(item => item.ACM_BranchName)),
    )
      .filter(Boolean)
      .sort()
      .map(branch => ({label: branch, value: branch}));

    const partnerTypes = Array.from(
      new Set(channelMapData.map(item => item.ACM_Partner_Type)),
    )
      .filter(Boolean)
      .sort()
      .map(type => ({label: type, value: type}));

    const partnerNames = Array.from(
      new Set(channelMapData.map(item => item.ACM_CompanyName)),
    )
      .filter(Boolean)
      .sort()
      .map(name => ({label: name, value: name}));

    return {branches, partnerTypes, partnerNames};
  }, [channelMapData]);

  // Apply filters to the data
  const filteredChannelMapData = useMemo(() => {
    if (!channelMapData) return [];

    return channelMapData.filter(item => {
      if (filters.branchName && item.ACM_BranchName !== filters.branchName) {
        return false;
      }
      if (filters.partnerType && item.ACM_Partner_Type !== filters.partnerType) {
        return false;
      }
      if (filters.partnerName && item.ACM_CompanyName !== filters.partnerName) {
        return false;
      }
      return true;
    });
  }, [channelMapData, filters]);

  const groupedData = useMemo(
    () => (filteredChannelMapData ? groupByBranch(filteredChannelMapData) : []),
    [filteredChannelMapData],
  );

  const totalPartners = useMemo(
    () => groupedData.reduce((sum, branch) => sum + branch.total_partners, 0),
    [groupedData],
  );

  const totalBranches = groupedData.length;

  // Active filter count
  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter(v => v !== null && v !== '').length;
  }, [filters]);

  // Filter handlers
  const handleApplyFilters = useCallback((newFilters: ChannelMapFilterResult) => {
    setFilters(newFilters);
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({
      branchName: null,
      partnerType: null,
      partnerName: null,
    });
  }, []);

  const handleOpenFilterSheet = useCallback(() => {
    showChannelMapFilterSheet({
      branchName: filters.branchName,
      partnerType: filters.partnerType,
      partnerName: filters.partnerName,
      branches: filterOptions.branches,
      partnerTypes: filterOptions.partnerTypes,
      partnerNames: filterOptions.partnerNames,
      onApply: handleApplyFilters,
      onReset: handleResetFilters,
    });
  }, [filters, filterOptions, handleApplyFilters, handleResetFilters]);

  const renderHeader = useCallback(() => {
    const isDarkTheme = useThemeStore(state=>state.AppTheme === 'dark');
    return (
      <View className="mb-4">
        <Card className="mb-4">
          <View className="mb-4">
            <AppText
              size="lg"
              weight="bold"
              className="text-slate-900 dark:text-white mb-1">
              Summary Channel Map
            </AppText>
          </View>
          <View className="flex-row justify-around">
            <View className="items-center">
              <View
                className={twMerge(
                  'w-12 h-12 rounded-xl items-center justify-center mb-2',
                  STAT_PALETTE[0].iconBg,
                )}>
                <AppIcon
                  name={STAT_PALETTE[0].icon}
                  type="feather"
                  size={22}
                  color="white"
                />
              </View>
              <AppText
                size="xs"
                weight="medium"
                className={twMerge(
                  'uppercase tracking-wide',
                  STAT_PALETTE[0].tint,
                )}>
                Total Branches
              </AppText>
              <AppText
                size="2xl"
                weight="semibold"
                className={twMerge('leading-tight', STAT_PALETTE[0].tint)}>
                {totalBranches}
              </AppText>
            </View>
            <View className="items-center">
              <View
                className={twMerge(
                  'w-12 h-12 rounded-xl items-center justify-center mb-2',
                  STAT_PALETTE[1].iconBg,
                )}>
                <AppIcon
                  name={STAT_PALETTE[1].icon}
                  type="feather"
                  size={22}
                  color="white"
                />
              </View>
              <AppText
                size="xs"
                weight="medium"
                className={twMerge(
                  'uppercase tracking-wide',
                  STAT_PALETTE[1].tint,
                )}>
                Total Partners
              </AppText>
              <AppText
                size="2xl"
                weight="semibold"
                className={twMerge('leading-tight', STAT_PALETTE[1].tint)}>
                {totalPartners}
              </AppText>
            </View>
          </View>
        </Card>
        <View className="flex-row items-center justify-between">
          <AppText
            size="base"
            weight="bold"
            className="text-slate-800 dark:text-slate-100 uppercase tracking-wide">
            Branch Details
          </AppText>
          {/* <FilterButton
            onPress={handleOpenFilterSheet}
          /> */}
          <TouchableOpacity
            onPress={handleOpenFilterSheet}
            activeOpacity={0.7}
            className="flex-row items-center bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-500 px-3 py-3 rounded-lg">
            <AppIcon
             type="material-community"
          name="tune-variant"
              size={18}
              color={isDarkTheme ? AppColors.dark.text : "#64748B"}
            />
            {activeFilterCount > 0 && (
              <View className="bg-primary dark:bg-primary-dark rounded-full w-2 h-2 absolute top-1 right-1"/>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [totalBranches, totalPartners, handleOpenFilterSheet, activeFilterCount]);

  const renderItem = useCallback(
    ({item, index}: {item: GroupedBranchData; index: number}) => {
      return <BranchCard key={index} item={item} />;
    },
    [],
  );

  const keyExtractor = useCallback(
    (item: GroupedBranchData, index: number) => `${item.branch}-${index}`,
    [],
  );

  if (isLoading) return <ChannelMapSkeleton />;

  if (isError) {
    return (
      <View className="flex-1 bg-lightBg-base dark:bg-darkBg-base justify-center items-center px-6">
        <View className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-6 items-center">
          <View className="bg-red-100 dark:bg-red-800/30 rounded-full p-4 mb-4">
            <AppIcon
              name="alert-circle"
              type="feather"
              size={32}
              color="#EF4444"
            />
          </View>
          <AppText
            size="lg"
            weight="bold"
            className="text-slate-800 dark:text-slate-100 mb-2 text-center">
            Failed to Load Data
          </AppText>
          <AppText
            size="sm"
            className="text-slate-600 dark:text-slate-400 text-center mb-4">
            Unable to fetch channel map information
          </AppText>
          <TouchableOpacity
            onPress={() => refetch()}
            className="bg-blue-600 px-6 py-3 rounded-xl">
            <AppText size="sm" weight="semibold" className="text-white">
              Try Again
            </AppText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-lightBg-base dark:bg-darkBg-base">
      <FlatList
        data={groupedData}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ItemSeparatorComponent={() => <View className="h-3" />}
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-6 pt-5 px-3"
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={['#3B82F6']}
            tintColor="#3B82F6"
          />
        }
      />
    </View>
  );
}