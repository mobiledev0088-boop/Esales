import {FlatList, Pressable, View} from 'react-native';
import AppLayout from '../../../../../components/layout/AppLayout';
import Skeleton from '../../../../../components/skeleton/skeleton';
import {memo, useCallback, useMemo, useState} from 'react';
import {screenWidth} from '../../../../../utils/constant';
import {AppColors} from '../../../../../config/theme';
import {useThemeStore} from '../../../../../stores/useThemeStore';
import AppIcon, {IconType} from '../../../../../components/customs/AppIcon';
import AppText from '../../../../../components/customs/AppText';
import {useNavigation} from '@react-navigation/native';
import {APIResponse, AppNavigationProp} from '../../../../../types/navigation';
import {getPastQuarters} from '../../../../../utils/commonFunctions';
import AppDropdown, {
  AppDropdownItem,
} from '../../../../../components/customs/AppDropdown';
import {useLoginStore} from '../../../../../stores/useLoginStore';
import {useQuery} from '@tanstack/react-query';
import {handleASINApiCall} from '../../../../../utils/handleApiCall';
import Card from '../../../../../components/Card';
import Accordion from '../../../../../components/Accordion';
import moment from 'moment';

interface ChannelFriendlyDataItem {
  APCAE_Id: number;
  Received_Date: string;
  Branch_Name: string;
  Branch_Head: string;
  Territory_Name: string;
  Territory_Manager: string;
  Partner_Type: string;
  Parent_Code: string;
  Parent_Name: string;
  Sub_Code: string;
  SubCode_Name: string;
  T3_Partner_Name: string;
  End_Cust_Invoice_Date: string;
  Serial_No: string;
  Model_Name: string;
  Activation_status: string;
  Activation_Date: string;
  Online_SRP: string;
  eTailer_Name: string;
  Seller_ASIN_Code: string;
  Seller_Name: string;
  T2_Invoice_Copy: string;
  Photo_Copy: string;
  Screenshot_Copy: string;
  T3_Invoice_Copy: string;
  BoxSrNo_Copy: string;
  ALP_Team_Status: any;
  ALP_Team_Special_Approval_Status: any;
  Claim_Team_Status: any;
  isEdited: boolean;
}

interface ChannelFriendlyClaimsDetail {
  SSN_Download_ALP_Team: ChannelFriendlyDataItem[];
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

interface ClaimItemProps {
  item: ChannelFriendlyDataItem;
  onPress: () => void;
}

interface BranchSectionProps {
  branchName: string;
  items: ChannelFriendlyDataItem[];
  showAll: boolean;
  onToggleShowAll: () => void;
  onItemPress: (item: ChannelFriendlyDataItem) => void;
}

type GroupedDataByBranch = Record<string, ChannelFriendlyDataItem[]>;

// Constants
const ITEMS_PER_PAGE = 5 as const;

// Query Key - Export for use in other screens
export const CHANNEL_FRIENDLY_QUERY_KEY = 'channelFriendlySummaryALP';

// Custom Hooks
const usePartnerOptions = (
  data: ChannelFriendlyDataItem[],
): AppDropdownItem[] => {
  return useMemo(() => {
    if (!data || data.length === 0) return [];

    const uniquePartners = Array.from(
      new Set(data.map(item => item.Parent_Name).filter(Boolean)),
    );

    return uniquePartners
      .sort((a, b) => a.localeCompare(b))
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

    return data.filter(item => item.Parent_Name === selectedPartner.value);
  }, [data, selectedPartner]);
};

const useGroupedByBranch = (
  filteredData: ChannelFriendlyDataItem[],
): GroupedDataByBranch => {
  return useMemo(() => {
    if (!filteredData || filteredData.length === 0) return {};

    const groups: GroupedDataByBranch = {};

    filteredData.forEach(item => {
      const branchName = item.Branch_Name || 'Unknown Branch';

      if (!groups[branchName]) {
        groups[branchName] = [];
      }
      groups[branchName].push(item);
    });

    // Sort groups by branch name
    return Object.keys(groups)
      .sort()
      .reduce((acc, key) => {
        acc[key] = groups[key];
        return acc;
      }, {} as GroupedDataByBranch);
  }, [filteredData]);
};

// Data Fetching Hook - Export for use in other screens
export const useGetChannelFriendlySummary = (YearQtr: string) => {
  const userInfo = useLoginStore(state => state.userInfo);
  const UserName = userInfo?.EMP_Code || '';
  const RoleId = userInfo?.EMP_RoleId || '';

  return useQuery({
    queryKey: [CHANNEL_FRIENDLY_QUERY_KEY, YearQtr, UserName, RoleId],
    queryFn: async () => {
      const response = (await handleASINApiCall(
        '/ChannelFriendlyClaims/GetChannelFriendlyClaims_SSN_Download_ALP_Team',
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
      return result.Datainfo?.SSN_Download_ALP_Team || [];
    },
  });
};

const ClaimItem: React.FC<ClaimItemProps> = memo(({item, onPress}) => {
  const {AppTheme} = useThemeStore();
  const theme = AppColors[AppTheme || 'light'];

  // Memoize formatted date
  const formattedDate = useMemo(
    () =>
      item.Received_Date
        ? moment(item.Received_Date).format('DD-MMM-YYYY')
        : 'N/A',
    [item.Received_Date],
  );

  return (
    <Pressable onPress={onPress} className="mb-3">
      <Card className="bg-slate-50">
        {/* Header Section */}
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-1 pr-3">
            <AppText
              size="base"
              weight="bold"
              numberOfLines={2}
              style={{color: theme.heading, marginBottom: 4}}>
              {item.Parent_Name || 'Unknown Partner'}
            </AppText>
            <View className="flex-row items-center mt-1">
              <AppIcon
                name="business"
                type="ionicons"
                size={12}
                color={theme.text}
                style={{opacity: 0.5}}
              />
              <AppText
                size="xs"
                style={{color: theme.text, opacity: 0.6, marginLeft: 4}}>
                {item.Parent_Code || 'N/A'}
              </AppText>
            </View>
          </View>
          <AppIcon
            name="chevron-forward-circle"
            type="ionicons"
            size={24}
            color={theme.primary}
          />
        </View>

        {/* Divider */}
        <View
          className="h-[1px] mb-3"
          style={{backgroundColor: theme.border, opacity: 0.3}}
        />

        {/* Info Grid */}
        <View className="gap-2.5">
          {/* Model Name */}
          {item.Model_Name && (
            <View className="flex-row items-start">
              <View className="w-7 items-center pt-0.5">
                <AppIcon
                  name="phone-portrait"
                  type="ionicons"
                  size={14}
                  color={theme.primary}
                  style={{opacity: 0.7}}
                />
              </View>
              <View className="flex-1">
                <AppText
                  size="xs"
                  style={{color: theme.text, opacity: 0.6, marginBottom: 2}}>
                  Model
                </AppText>
                <AppText size="sm" weight="medium" style={{color: theme.text}}>
                  {item.Model_Name}
                </AppText>
              </View>
            </View>
          )}

          {/* Serial Number */}
          {item.Serial_No && (
            <View className="flex-row items-start">
              <View className="w-7 items-center pt-0.5">
                <AppIcon
                  name="barcode"
                  type="ionicons"
                  size={14}
                  color={theme.primary}
                  style={{opacity: 0.7}}
                />
              </View>
              <View className="flex-1">
                <AppText
                  size="xs"
                  style={{color: theme.text, opacity: 0.6, marginBottom: 2}}>
                  Serial Number
                </AppText>
                <AppText
                  size="sm"
                  weight="medium"
                  style={{color: theme.text}}
                  className="font-mono">
                  {item.Serial_No}
                </AppText>
              </View>
            </View>
          )}

          {/* Received Date */}
          {item.Received_Date && (
            <View className="flex-row items-start">
              <View className="w-7 items-center pt-0.5">
                <AppIcon
                  name="calendar"
                  type="ionicons"
                  size={14}
                  color={theme.primary}
                  style={{opacity: 0.7}}
                />
              </View>
              <View className="flex-1">
                <AppText
                  size="xs"
                  style={{color: theme.text, opacity: 0.6, marginBottom: 2}}>
                  T2 Invoice Date
                </AppText>
                <AppText size="sm" weight="medium" style={{color: theme.text}}>
                  {formattedDate}
                </AppText>
              </View>
            </View>
          )}

          {/* eTailer & Seller */}
          {item.eTailer_Name && (
            <View className="flex-row items-start">
              <View className="w-7 items-center pt-0.5">
                <AppIcon
                  name="storefront"
                  type="ionicons"
                  size={14}
                  color={theme.primary}
                  style={{opacity: 0.7}}
                />
              </View>
              <View className="flex-1">
                <AppText
                  size="xs"
                  style={{color: theme.text, opacity: 0.6, marginBottom: 2}}>
                  eTailer & Seller Name
                </AppText>
                <AppText size="sm" weight="medium" style={{color: theme.text}}>
                  {`${item.eTailer_Name} | ${item.Seller_Name}`}
                </AppText>
              </View>
            </View>
          )}
          <View className="flex-row items-start">
            <View className="w-7 items-center pt-0.5">
              <AppIcon
                name="tag"
                type="materialIcons"
                size={14}
                color={theme.primary}
                style={{opacity: 0.7}}
              />
            </View>
            <View className="flex-1">
              <AppText
                size="xs"
                style={{color: theme.text, opacity: 0.6, marginBottom: 2}}>
                Claim Status
              </AppText>
              <AppText
                size="sm"
                weight="bold"
                color={item.ALP_Team_Status ? 'success' : 'secondary'}>
                {item.ALP_Team_Status || 'To Check'}
              </AppText>
            </View>
          </View>
        </View>
      </Card>
    </Pressable>
  );
});

const BranchSection: React.FC<BranchSectionProps> = memo(
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

    const formattedBranchName = useMemo(() => {
      return branchName?.replace(/_/g, ' ') || 'Unknown Branch';
    }, [branchName]);

    // Render item callback for FlatList
    const renderClaimItem = useCallback(
      ({item, index}: {item: ChannelFriendlyDataItem; index: number}) => (
        <ClaimItem
          key={`${item.APCAE_Id}-${index}`}
          item={item}
          onPress={() => onItemPress(item)}
        />
      ),
      [onItemPress],
    );

    // Key extractor for FlatList
    const keyExtractor = useCallback(
      (item: ChannelFriendlyDataItem, index: number) =>
        `${item.APCAE_Id}-${index}`,
      [],
    );

    // Footer component for "Show More" button
    const ListFooterComponent = useCallback(() => {
      if (!hasMoreItems) return null;

      return (
        <Pressable
          onPress={onToggleShowAll}
          className="mt-2 py-3.5 rounded-xl items-center"
          style={{
            backgroundColor: theme.primary + '08',
            borderWidth: 1.5,
            borderColor: theme.primary + '30',
            borderStyle: 'dashed',
          }}>
          <View className="flex-row items-center gap-2">
            <AppIcon
              name={showAll ? 'chevron-up' : 'chevron-down'}
              type="ionicons"
              size={18}
              color={theme.primary}
            />
            <AppText size="sm" weight="bold" style={{color: theme.primary}}>
              {showAll
                ? 'Show Less'
                : `Show ${remainingCount} More ${
                    remainingCount === 1 ? 'Claim' : 'Claims'
                  }`}
            </AppText>
          </View>
        </Pressable>
      );
    }, [hasMoreItems, showAll, remainingCount, onToggleShowAll, theme.primary]);

    return (
      <View className="mb-3">
        <Accordion
          headerClassName="px-3 py-5"
          containerClassName="bg-white rounded-lg"
          needShadow
          needBottomBorder={false}
          header={
            <View>
              <View className="flex-row items-center mb-1">
                <AppText
                  size="base"
                  weight="bold"
                  style={{color: theme.heading}}>
                  {formattedBranchName}
                </AppText>
              </View>
              <View className="flex-row items-center">
                <View className="flex-row items-center">
                  <AppIcon
                    name="file-document"
                    type="material-community"
                    size={16}
                    color={theme.border}
                  />
                  <AppText size="xs" color="gray">
                    {items.length} {items.length === 1 ? 'Claim' : 'Claims'}
                  </AppText>
                </View>
              </View>
            </View>
          }>
          <View className="px-3 py-3">
            <FlatList
              data={displayedItems}
              renderItem={renderClaimItem}
              keyExtractor={keyExtractor}
              removeClippedSubviews={true}
              maxToRenderPerBatch={5}
              windowSize={5}
              initialNumToRender={5}
              scrollEnabled={false}
              ListFooterComponent={ListFooterComponent}
            />
          </View>
        </Accordion>
      </View>
    );
  }
);

const LoadingSkeleton = memo(() => {
  return (
    <View className="px-3 gap-4 mt-3">
      <View className="flex-row items-center justify-between mb-2">
        <Skeleton width={screenWidth / 2 + 20} height={50} />
        <Skeleton width={screenWidth / 3} height={50} />
      </View>
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

export default function ChannelFriendlyClaimListALP() {
  const {AppTheme} = useThemeStore();
  const theme = AppColors[AppTheme || 'light'];
  const navigation = useNavigation<AppNavigationProp>();

  // State management
  const [selectedPartner, setSelectedPartner] =
    useState<AppDropdownItem | null>(null);
  const [showAllItems, setShowAllItems] = useState<Record<string, boolean>>({});

  const quarters = useMemo(() => getPastQuarters(), []);
  const [selectedQuarter, setSelectedQuarter] = useState<AppDropdownItem>(
    quarters[0],
  );

  // Fetch data
  const {
    data: channelFriendlyClaimsDetail,
    isLoading,
    isError,
  } = useGetChannelFriendlySummary(
    selectedQuarter?.value || quarters[0]?.value,
  );

  // Process data with custom hooks
  const partnerOptions = usePartnerOptions(channelFriendlyClaimsDetail || []);
  const filteredData = useFilteredData(
    channelFriendlyClaimsDetail || [],
    selectedPartner,
  );
  const groupedByBranch = useGroupedByBranch(filteredData);

  // Event handlers
  const handleToggleShowAll = useCallback((branchName: string) => {
    setShowAllItems(prev => ({
      ...prev,
      [branchName]: !prev[branchName],
    }));
  }, []);

  const handleItemPress = useCallback(
    (item: ChannelFriendlyDataItem) => {
      navigation.push('ChannelFriendlyClaimViewALP', {
        data: item,
        yearQTR: selectedQuarter?.value,
      });
    },
    [navigation, selectedQuarter?.value],
  );

  const handleClearFilter = useCallback(() => {
    setSelectedPartner(null);
  }, []);

  const branchData = useMemo(() => {
    return Object.keys(groupedByBranch).map(branchName => ({
      branchName,
      items: groupedByBranch[branchName],
    }));
  }, [groupedByBranch]);

  const hasData = branchData.length > 0;

  // Render branch section callback for FlatList
  const renderBranchSection = useCallback(
    ({
      item,
    }: {
      item: {branchName: string; items: ChannelFriendlyDataItem[]};
    }) => (
      <BranchSection
        branchName={item.branchName}
        items={item.items}
        showAll={showAllItems[item.branchName] || false}
        onToggleShowAll={() => handleToggleShowAll(item.branchName)}
        onItemPress={handleItemPress}
      />
    ),
    [showAllItems, handleToggleShowAll, handleItemPress],
  );

  // Key extractor for branch FlatList
  const branchKeyExtractor = useCallback(
    (item: {branchName: string; items: ChannelFriendlyDataItem[]}) =>
      item.branchName,
    [],
  );

  // Header component for summary
  const ListHeaderComponent = useCallback(() => {
    if (!hasData) return null;

    return (
      <View className="mb-4">
        <Card>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{backgroundColor: theme.primary + '15'}}>
                <AppIcon
                  name="stats-chart"
                  type="ionicons"
                  size={20}
                  color={theme.primary}
                />
              </View>
              <View>
                <AppText
                  size="xs"
                  style={{color: theme.text, opacity: 0.6, marginBottom: 2}}>
                  Total Statistics
                </AppText>
                <AppText
                  size="sm"
                  weight="semibold"
                  style={{color: theme.text}}>
                  {branchData.length}{' '}
                  {branchData.length === 1 ? 'Branch' : 'Branches'}
                </AppText>
              </View>
            </View>
            <View className="items-end">
              <AppText
                size="xs"
                style={{color: theme.text, opacity: 0.6, marginBottom: 2}}>
                Total Claims
              </AppText>
              <AppText size="xl" weight="bold" style={{color: theme.primary}}>
                {filteredData.length}
              </AppText>
            </View>
          </View>
        </Card>
      </View>
    );
  }, [hasData, branchData.length, filteredData.length, theme]);

  // Empty component
  const ListEmptyComponent = useCallback(
    () => (
      <EmptyState
        message={
          selectedPartner
            ? 'No claims found for the selected partner'
            : 'No claims available for the selected quarter'
        }
      />
    ),
    [selectedPartner],
  );

  return (
    <AppLayout title="Channel Friendly Claim " needBack>
      {isLoading ? (
        <LoadingSkeleton />
      ) : isError ? (
        <ErrorState />
      ) : !channelFriendlyClaimsDetail ? (
        <ErrorState message="No data available at this time" />
      ) : (
        <View className="flex-1">
          {/* Filter Section */}
          <View className="px-3 py-3 flex-row items-end justify-between">
            <View style={{width: '65%'}}>
              <AppDropdown
                data={partnerOptions}
                onSelect={setSelectedPartner}
                selectedValue={selectedPartner?.value || null}
                mode="autocomplete"
                placeholder={'Filter by Partner Name'}
                label={'Filters'}
                allowClear
                onClear={handleClearFilter}
                searchPlaceholder={'Search partner...'}
                zIndex={5000}
              />
            </View>
            <View style={{width: '32%'}}>
              <AppDropdown
                mode="dropdown"
                data={quarters}
                onSelect={item => setSelectedQuarter(item as any)}
                selectedValue={selectedQuarter?.value || null}
                placeholder={'Quarterly Filter'}
              />
            </View>
          </View>

          {/* Content Section with Optimized FlatList */}
          <FlatList
            data={branchData}
            renderItem={renderBranchSection}
            keyExtractor={branchKeyExtractor}
            ListHeaderComponent={ListHeaderComponent}
            ListEmptyComponent={ListEmptyComponent}
            contentContainerStyle={{paddingHorizontal: 12, paddingBottom: 20}}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            maxToRenderPerBatch={3}
            windowSize={5}
            initialNumToRender={3}
            updateCellsBatchingPeriod={50}
          />
        </View>
      )}
    </AppLayout>
  );
}
