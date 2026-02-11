import {Pressable, RefreshControl, ScrollView, View} from 'react-native';
import React, {useState, useCallback, memo, useMemo} from 'react';
import {useQuery} from '@tanstack/react-query';
import AppLayout from '../../../../../components/layout/AppLayout';
import AppText from '../../../../../components/customs/AppText';
import Card from '../../../../../components/Card';
import AppDropdown, {
  AppDropdownItem,
} from '../../../../../components/customs/AppDropdown';
import {AppColors} from '../../../../../config/theme';
import {useThemeStore} from '../../../../../stores/useThemeStore';
import {handleASINApiCall} from '../../../../../utils/handleApiCall';
import {APIResponse, AppNavigationProp} from '../../../../../types/navigation';
import {useLoginStore} from '../../../../../stores/useLoginStore';
import AppIcon, {IconType} from '../../../../../components/customs/AppIcon';
import Accordion from '../../../../../components/Accordion';
import Skeleton from '../../../../../components/skeleton/skeleton';
import {screenWidth} from '../../../../../utils/constant';
import {getPastQuarters} from '../../../../../utils/commonFunctions';
import { useNavigation } from '@react-navigation/native';

interface ChannelFriendlyDataItem {
  BranchName: string;
  Partner_Code: string;
  Partner_Name: string;
  Total_SSN_Cnt: number;
  Waiting_for_Reviewer_Cnt: number;
  Under_Process_Cnt: number;
  CN_Under_Process_Cnt: number;
  Rejected_Cnt: number;
}

interface ChannelFriendlySummary {
  Total_SSN_Cnt: number;
  Waiting_for_Reviewer_Cnt: number;
  Under_Process_Cnt: number;
  CN_Under_Process_Cnt: number;
  Rejected_Cnt: number;
}

interface ChannelFriendlyClaimsDetail {
  Summary: ChannelFriendlySummary[];
  PartnerWise: ChannelFriendlyDataItem[];
}

interface SummaryCardProps {
  title: string;
  count?: number;
  color: string;
  icon: string;
  iconType: IconType;
  legend?: string;
}

interface BranchAccordionProps {
  branchName: string;
  items: ChannelFriendlyDataItem[];
  showAll: boolean;
  onToggleShowAll: () => void;
  onItemPress: (item: ChannelFriendlyDataItem) => void;
}

interface PartnerListItemProps {
  item: ChannelFriendlyDataItem;
  onPress: () => void;
  isLast?: boolean;
}

interface MetricChipProps {
  label: string;
  value: number;
  color: string;
}

interface ErrorStateProps {
  message?: string;
  retry?: () => void;
}

interface EmptyStateProps {
  message?: string;
  icon?: string;
  iconType?: IconType;
}

type GroupedDataByBranch = Record<string, ChannelFriendlyDataItem[]>;

// Constants
const ITEMS_PER_PAGE = 5 as const;

const SUMMARY_METRICS = [
  {
    key: 'Waiting_for_Reviewer_Cnt' as const,
    title: 'Waiting for Reviewer',
    legend: 'WR',
    color: AppColors.warning,
    icon: 'hourglass-outline',
    iconType: 'ionicons' as const,
  },
  {
    key: 'Under_Process_Cnt' as const,
    title: 'Under Review',
    legend: 'UR',
    color: AppColors.utilColor2,
    icon: 'sync',
    iconType: 'ionicons' as const,
  },
  {
    key: 'CN_Under_Process_Cnt' as const,
    title: 'CN Under Process',
    legend: 'UP',
    color: AppColors.utilColor1,
    icon: 'checkmark-circle',
    iconType: 'ionicons' as const,
  },
  {
    key: 'Rejected_Cnt' as const,
    title: 'Rejected',
    legend: 'Rejected',
    color: AppColors.error,
    icon: 'close-circle',
    iconType: 'ionicons' as const,
  },
] as const;

const METRIC_CHIP_CONFIG = [
  {
    key: 'Under_Process_Cnt' as const,
    label: 'UR',
    color: AppColors.utilColor2,
  },
  {
    key: 'CN_Under_Process_Cnt' as const,
    label: 'UP',
    color: AppColors.utilColor1,
  },
  {
    key: 'Waiting_for_Reviewer_Cnt' as const,
    label: 'WR',
    color: AppColors.warning,
  },
  {
    key: 'Rejected_Cnt' as const,
    label: 'Rejected',
    color: AppColors.error,
  },
] as const;

const FILTER_CONFIG = {
  PARTNER_WIDTH: '65%',
  TIME_WIDTH: '32%',
  PARTNER_Z_INDEX: 5000,
  PARTNER_PLACEHOLDER: 'Filter by Partner Name',
  PARTNER_SEARCH_PLACEHOLDER: 'Search partner...',
  TIME_PLACEHOLDER: 'Quarterly',
  FILTER_LABEL: 'Filters',
} as const;

// Custom Hooks
const usePartnerOptions = (
  data: ChannelFriendlyDataItem[],
): AppDropdownItem[] => {
  return useMemo(() => {
    if (!data || data.length === 0) return [];

    const uniquePartners = Array.from(
      new Set(data.map(item => item.Partner_Name)),
    );

    return uniquePartners
      .filter(Boolean) // Remove any null/undefined values
      .sort((a, b) => a.localeCompare(b)) // Sort alphabetically
      .map(partner => ({
        label: partner,
        value: partner,
      }));
  }, [data]);
};
const useFilteredData = (
  data: ChannelFriendlyDataItem[],
  selectedPartner: AppDropdownItem | null,
): ChannelFriendlyDataItem[] => {
  return useMemo(() => {
    if (!data || data.length === 0) return [];
    if (!selectedPartner) return data;

    return data.filter(item => item.Partner_Name === selectedPartner.value);
  }, [data, selectedPartner]);
};
const useGroupedByBranch = (
  filteredData: ChannelFriendlyDataItem[],
): GroupedDataByBranch => {
  return useMemo(() => {
    if (!filteredData || filteredData.length === 0) return {};

    const groups: GroupedDataByBranch = {};

    filteredData.forEach(item => {
      if (!item.BranchName) return; // Skip items without branch name

      if (!groups[item.BranchName]) {
        groups[item.BranchName] = [];
      }
      groups[item.BranchName].push(item);
    });

    return groups;
  }, [filteredData]);
};
const useChannelFriendlyData = (
  data: ChannelFriendlyDataItem[],
  selectedPartner: AppDropdownItem | null,
) => {
  const partnerOptions = usePartnerOptions(data);
  const filteredData = useFilteredData(data, selectedPartner);
  const groupedByBranch = useGroupedByBranch(filteredData);

  return {
    partnerOptions,
    filteredData,
    groupedByBranch,
    hasData: Object.keys(groupedByBranch).length > 0,
    branchCount: Object.keys(groupedByBranch).length,
  };
};

// Data Fetching Hook
const useGetChannelFriendlySummary = (YearQtr: string) => {
  const userInfo = useLoginStore(state => state.userInfo);
  const UserName = userInfo?.EMP_Code || '';
  const RoleId = userInfo?.EMP_RoleId || '';

  return useQuery({
    queryKey: ['channelFriendlySummary', YearQtr, UserName, RoleId],
    queryFn: async () => {
      const response = (await handleASINApiCall(
        '/ChannelFriendlyClaims/GetChannelFriendlyClaims_Detail',
        {
          UserName,
          RoleId,
          YearQtr,
        },
      )) as APIResponse<ChannelFriendlyClaimsDetail>;

      const result = response.DashboardData;
      if (!result?.Status) {
        throw new Error('Failed to fetch data');
      }
      return result.Datainfo;
    },
  });
};

// Components
const SummaryCard: React.FC<SummaryCardProps> = memo(
  ({title, count, color, icon, iconType, legend}) => {
    const {AppTheme} = useThemeStore();
    const theme = AppColors[AppTheme || 'light'];

    return (
      <View className="w-1/4 items-center">
        <View className="flex-row items-start justify-between mb-1">
          <View
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{backgroundColor: color + '20'}}>
            <AppIcon name={icon} type={iconType} size={22} color={color} />
          </View>
        </View>
        <AppText size="xl" weight="bold" style={{color, marginBottom: 2}}>
          {count !== undefined && count !== null
            ? count.toLocaleString()
            : 'N/A'}
        </AppText>
        <View className="items-center">
          <AppText
            size="sm"
            weight="semibold"
            className="text-center h-10"
            style={{color: theme.text, opacity: 0.8}}>
            {title}
          </AppText>
          {legend && (
            <View
              className="mt-1 px-2 py-0.5 rounded"
              style={{backgroundColor: color + '10'}}>
              <AppText
                size="sm"
                weight="bold"
                className="text-center"
                style={{color: color}}>
                {legend}
              </AppText>
            </View>
          )}
        </View>
      </View>
    );
  },
);
const BranchAccordion: React.FC<BranchAccordionProps> = memo(
  ({branchName, items, showAll, onToggleShowAll, onItemPress}) => {
    const {AppTheme} = useThemeStore();
    const theme = AppColors[AppTheme || 'light'];

    const {displayedItems, hasMoreItems, remainingCount} = useMemo(() => {
      const displayed = showAll ? items : items.slice(0, ITEMS_PER_PAGE);
      const hasMore = items.length > ITEMS_PER_PAGE;
      const remaining = items.length - ITEMS_PER_PAGE;

      return {
        displayedItems: displayed,
        hasMoreItems: hasMore,
        remainingCount: remaining,
      };
    }, [showAll, items]);

    // Format branch name by replacing underscores with spaces
    const formattedBranchName = useMemo(() => {
      return branchName?.replace(/_/g, ' ') || 'Unknown Branch';
    }, [branchName]);

    return (
      <Accordion
        headerClassName="px-3 py-5"
        containerClassName="bg-white rounded-lg"
        needShadow
        needBottomBorder={false}
        header={
          <View className="pr-3">
            <AppText
              size="base"
              weight="bold"
              style={{color: theme.heading, marginBottom: 4}}>
              {formattedBranchName}
            </AppText>
            <View className="flex-row items-center">
              <AppIcon
                name="business-outline"
                type="ionicons"
                size={12}
                color={theme.text}
                style={{opacity: 0.6}}
              />
              <AppText
                size="xs"
                style={{color: theme.text, opacity: 0.6, marginLeft: 4}}>
                {items.length} {items.length === 1 ? 'Partner' : 'Partners'}
              </AppText>
            </View>
          </View>
        }>
        <View className="px-3 py-3">
          {displayedItems.map((item, index) => (
            <PartnerListItem
              key={`${item.Partner_Code}-${index}`}
              item={item}
              onPress={() => onItemPress(item)}
              isLast={
                index === displayedItems.length - 1 &&
                (!hasMoreItems || showAll)
              }
            />
          ))}

          {/* See More / See Less Button */}
          {hasMoreItems && (
            <Pressable
              onPress={onToggleShowAll}
              className="mt-2 py-3 rounded-lg border border-primary items-center">
              <View className="flex-row items-center gap-2">
                <AppText
                  size="sm"
                  weight="semibold"
                  style={{color: theme.primary}}>
                  {showAll ? 'Show Less' : `Show ${remainingCount} More`}
                </AppText>
              </View>
            </Pressable>
          )}
        </View>
      </Accordion>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.branchName === nextProps.branchName &&
      prevProps.items === nextProps.items &&
      prevProps.showAll === nextProps.showAll &&
      prevProps.onToggleShowAll === nextProps.onToggleShowAll &&
      prevProps.onItemPress === nextProps.onItemPress
    );
  },
);

const PartnerListItem: React.FC<PartnerListItemProps> = memo(
  ({item, onPress}) => {
    const {AppTheme} = useThemeStore();
    const theme = AppColors[AppTheme || 'light'];

    return (
      <Pressable
        onPress={onPress}
        className="py-3 px-3 rounded-lg bg-slate-50 flex-row items-center justify-between mb-2">
        <View>
          {/* Header Row */}
          <View className="mb-3">
            <View className="pr-3">
              <AppText
                size="md"
                weight="semibold"
                style={{color: theme.heading}}>
                {item.Partner_Name || 'Unknown Partner'}
              </AppText>
              <View className="flex-row items-center">
                <AppIcon
                  name="barcode-outline"
                  type="ionicons"
                  size={12}
                  color={theme.text}
                  style={{opacity: 0.5}}
                />
                <AppText
                  size="xs"
                  style={{color: theme.text, opacity: 0.6, marginLeft: 4}}>
                  {item.Partner_Code || 'N/A'}
                </AppText>
              </View>
            </View>
          </View>

          {/* Metrics Row */}
          <View className="flex-row flex-wrap gap-2">
            {METRIC_CHIP_CONFIG.map(config => {
              const value = item[config.key];
              if (value > 0) {
                return (
                  <MetricChip
                    key={config.key}
                    label={config.label}
                    value={value}
                    color={config.color}
                  />
                );
              }
              return null;
            })}
          </View>
        </View>
        <AppIcon
          name="chevron-forward"
          type="ionicons"
          size={18}
          color={theme.primary}
        />
      </Pressable>
    );
  },
);
const MetricChip: React.FC<MetricChipProps> = memo(({label, value, color}) => {
  return (
    <View
      className="px-2.5 py-1 rounded-md"
      style={{
        backgroundColor: color + '15',
        borderWidth: 1,
        borderColor: color + '25',
      }}>
      <AppText size="sm" style={{color}}>
        {label}: <AppText weight="semibold">{value}</AppText>
      </AppText>
    </View>
  );
});

const LoadingSkeleton: React.FC = memo(() => {
  return (
    <View className="px-3 gap-4 mt-3">
      <View className="flex-row items-center justify-between mb-2">
        <Skeleton width={(screenWidth / 2) +20} height={50} />
        <Skeleton width={(screenWidth / 3)} height={50} />
      </View>
      <Skeleton width={screenWidth - 20} height={200} borderRadius={8} />
      <View className="mt-5">
        {Array.from({length: 5}).map((_, index) => (
          <Skeleton
            key={`skeleton-${index}`}
            width={screenWidth - 14}
            height={100}
            borderRadius={8}
          />
        ))}
      </View>
    </View>
  );
});

const ErrorState: React.FC<ErrorStateProps> = memo(
  ({message = 'Failed to load data. Please try again.'}) => {
    const {AppTheme} = useThemeStore();
    const theme = AppColors[AppTheme || 'light'];

    return (
      <View className="flex-1 items-center justify-center px-6">
        <AppIcon
          name="alert-circle-outline"
          type="ionicons"
          size={64}
          color={theme.error || AppColors.error}
        />
        <AppText
          size="lg"
          weight="semibold"
          className="mt-4 text-center"
          style={{color: theme.text}}>
          Oops! Something went wrong
        </AppText>
        <AppText
          size="sm"
          className="mt-2 text-center"
          style={{color: theme.text, opacity: 0.7}}>
          {message}
        </AppText>
      </View>
    );
  },
);

const EmptyState: React.FC<EmptyStateProps> = memo(
  ({
    message = 'No data available for the selected filter',
    icon = 'search-off',
    iconType = 'materialIcons',
  }) => {
    const {AppTheme} = useThemeStore();
    const theme = AppColors[AppTheme || 'light'];

    return (
      <View className="py-10 items-center">
        <AppIcon
          name={icon}
          type={iconType}
          size={48}
          color={theme.text}
          style={{opacity: 0.3}}
        />
        <AppText color="gray" size="base" className="mt-3">
          {message}
        </AppText>
      </View>
    );
  },
);

// Main Component
export default function ChannelFriendlyClaimListHO() {
  const {AppTheme} = useThemeStore();
  const theme = AppColors[AppTheme || 'light'];
    const navigation = useNavigation<AppNavigationProp>();

  const quarters = useMemo(() => getPastQuarters(), []);
  const [selectedQuarter, setSelectedQuarter] = useState<AppDropdownItem>(quarters[0]);

  // Fetch data
  const {
    data: channelFriendlyClaimsDetail,
    isLoading,
    isError,
    refetch,
  } = useGetChannelFriendlySummary(
    selectedQuarter?.value || quarters[0]?.value,
  );

  // Extract data with null safety
  const data = channelFriendlyClaimsDetail?.PartnerWise || [];
  const summary = channelFriendlyClaimsDetail?.Summary?.[0];

  // State management
  const [selectedPartner, setSelectedPartner] =
    useState<AppDropdownItem | null>(null);
  const [showAllItems, setShowAllItems] = useState<Record<string, boolean>>({});
  const [refreshing, setRefreshing] = useState(false);

  // Use custom hook for data processing
  const {partnerOptions, groupedByBranch, hasData, branchCount} =
    useChannelFriendlyData(data, selectedPartner);

  // Memoized callbacks to prevent unnecessary re-renders
  const toggleShowAll = useCallback((branchName: string) => {
    setShowAllItems(prev => ({
      ...prev,
      [branchName]: !prev[branchName],
    }));
  }, []);

  const handlePartnerPress = useCallback((item: ChannelFriendlyDataItem) => {
    navigation.push('ChannelFriendlyPartnerClaimInfo', {
      partnerCode: item.Partner_Code,
      yearQTR: selectedQuarter?.value,
    });
  }, []);

  const handleClearFilter = useCallback(() => {
    setSelectedPartner(null);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  return (
    <AppLayout title="Channel Friendly Claims" needBack>
      {isLoading ? (
        <LoadingSkeleton />
      ) : isError ? (
        <ErrorState />
      ) : !channelFriendlyClaimsDetail || !summary ? (
        <ErrorState message="No data available at this time" />
      ) : (
        <View className="flex-1">
          <View className="px-3 py-3 flex-row items-end justify-between">
            <View style={{width: FILTER_CONFIG.PARTNER_WIDTH}}>
              <AppDropdown
                data={partnerOptions}
                onSelect={setSelectedPartner}
                selectedValue={selectedPartner?.value || null}
                mode="autocomplete"
                placeholder={FILTER_CONFIG.PARTNER_PLACEHOLDER}
                label={FILTER_CONFIG.FILTER_LABEL}
                allowClear
                onClear={handleClearFilter}
                searchPlaceholder={FILTER_CONFIG.PARTNER_SEARCH_PLACEHOLDER}
                zIndex={FILTER_CONFIG.PARTNER_Z_INDEX}
              />
            </View>
            <View style={{width: FILTER_CONFIG.TIME_WIDTH}}>
              <AppDropdown
                mode="dropdown"
                data={quarters}
                onSelect={(item) => setSelectedQuarter(item as any)}
                selectedValue={selectedQuarter?.value || null}
                placeholder={FILTER_CONFIG.TIME_PLACEHOLDER}
              />
            </View>
          </View>
          <ScrollView
            className="flex-1"
            contentContainerStyle={{paddingBottom: 20}}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              />
            }
            >
            {/* Summary Section */}
            <View className="px-4 pt-5 pb-4">
              <AppText
                size="xl"
                weight="bold"
                className="mb-4"
                style={{color: theme.heading}}>
                Summary
              </AppText>
              <Card className="px-0">
                <View className="px-4">
                  <AppText
                    size="md"
                    weight="bold"
                    style={{color: theme.heading}}>
                    {`Total Claims: ${summary.Total_SSN_Cnt?.toLocaleString() || 'N/A'}`}
                  </AppText>
                </View>
                <View
                  className="my-2 mb-4"
                  style={{
                    borderBottomColor: theme.border,
                    borderBottomWidth: 0.5,
                  }}
                />
                <View className="flex-row flex-wrap gap-y-6">
                  {SUMMARY_METRICS.map(metric => (
                    <SummaryCard
                      key={metric.key}
                      title={metric.title}
                      legend={metric.legend}
                      count={summary[metric.key]}
                      color={metric.color}
                      icon={metric.icon}
                      iconType={metric.iconType}
                    />
                  ))}
                </View>
              </Card>
            </View>

            {/* Branch-wise Claims Section */}
            <View className="px-4 pt-2">
              {/* Section Heading */}
              <View className="mb-4 flex-row items-center justify-between">
                <View>
                  <AppText
                    size="lg"
                    weight="bold"
                    style={{color: theme.heading}}>
                    Branch-wise Claims
                  </AppText>
                  <AppText size="xs" color="gray" className="mt-1">
                    {branchCount} {branchCount === 1 ? 'Branch' : 'Branches'}
                  </AppText>
                </View>
              </View>

              {!hasData ? (
                <EmptyState />
              ) : (
                <View className="gap-3">
                  {Object.entries(groupedByBranch).map(
                    ([branchName, items]) => (
                      <BranchAccordion
                        key={branchName}
                        branchName={branchName}
                        items={items}
                        showAll={showAllItems[branchName] || false}
                        onToggleShowAll={() => toggleShowAll(branchName)}
                        onItemPress={handlePartnerPress}
                      />
                    ),
                  )}
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      )}
    </AppLayout>
  );
}
