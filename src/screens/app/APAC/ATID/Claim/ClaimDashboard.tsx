import {
  FlatList,
  TouchableOpacity,
  ListRenderItem,
  View,
  ActivityIndicator,
} from 'react-native';
import {useMemo, useState, memo, useCallback} from 'react';
import MaterialTabBar from '../../../../../components/MaterialTabBar';
import {
  useClaimDashboardDataAPAC,
  useClaimMasterDataViewMore,
} from '../../../../../hooks/queries/claim';
import useQuarterHook from '../../../../../hooks/useQuarterHook';
import Skeleton from '../../../../../components/skeleton/skeleton';
import AppText from '../../../../../components/customs/AppText';
import AppDropdown from '../../../../../components/customs/AppDropdown';
import AppModal from '../../../../../components/customs/AppModal';
import {useThemeStore} from '../../../../../stores/useThemeStore';
import {ClaimDataSkeleton} from '../../../ASIN/Claim/components';
import {getPerformanceColor} from '../../../ASIN/Dashboard/dashboardUtils';
import Card from '../../../../../components/Card';
import Accordion from '../../../../../components/Accordion';
import AppIcon from '../../../../../components/customs/AppIcon';
import {AppColors} from '../../../../../config/theme';
import {convertToAPACUnits} from '../../../../../utils/commonFunctions';
import {
  BranchClaimSectionProps,
  BranchItemProps,
  ClaimHeaderProps,
  ClaimInfoBranchWise,
  ClaimInfoListProps,
  ClaimItemCardProps,
  MasterTab,
  SummaryMetricsProps,
} from './claim';
import {showClaimFilterSheet, ClaimFilterResult} from './ClaimFilterSheet';

const ITEMS_PER_PAGE = 10;

const CLAIM_STATUS = {
  CN_UNDER_PROCESS: 'CN is under Asus process',
  CN_PASSED_DISTI: 'CN is passed to Disti',
};

const getStatusColor = (status: string, isDarkTheme: boolean) => {
  if (status === CLAIM_STATUS.CN_PASSED_DISTI) {
    return {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-700 dark:text-green-400',
      icon: 'check-circle',
      iconColor: isDarkTheme ? '#4ade80' : '#15803d',
      borderColor: 'border-green-500 dark:border-green-400',
    };
  } else {
    return {
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      text: 'text-yellow-700 dark:text-yellow-400',
      icon: 'clock',
      iconColor: isDarkTheme ? '#facc15' : '#a16207',
      borderColor: 'border-yellow-500 dark:border-yellow-400',
    };
  }
};

const ClaimHeader = memo<ClaimHeaderProps>(
  ({
    data,
    isLoading,
    tabName,
    isDarkTheme,
    quarters,
    selectedQuarter,
    setSelectedQuarter,
  }) => {
    const percentage = useMemo(
      () =>
        data?.Total_Claim
          ? Math.round(
              (Number(data.Closed_Claim) / Number(data.Total_Claim)) * 100,
            )
          : 0,
      [data?.Total_Claim, data?.Closed_Claim],
    );

    const {bgColor, textColor} = useMemo(
      () => getPerformanceColor(percentage, isDarkTheme),
      [percentage, isDarkTheme],
    );

    const displayTitle = useMemo(() => `${tabName} Closed Claims`, [tabName]);

    const countDataSkeleton = () => (
      <View>
        <Skeleton width={80} height={25} borderRadius={8} />
        <Skeleton width={120} height={25} borderRadius={8} />
      </View>
    );

    return (
      <View className="flex-row justify-between items-start px-3 pt-4 pb-3 border-b border-gray-200 dark:border-gray-700">
        {isLoading ? (
          countDataSkeleton()
        ) : (
          <View className="flex-1 mr-3">
            <AppText
              size="lg"
              weight="bold"
              color="text"
              className="capitalize mb-2">
              {displayTitle}
            </AppText>
            <View className="flex-row items-center">
              <AppText size="lg" weight="bold" className="mr-1 text-[#007BE5]">
                {data?.Closed_Claim}
              </AppText>
              <AppText size="sm" color="gray" className="mr-2">
                / {data?.Total_Claim}
              </AppText>
              <View className={`px-2 py-1 rounded-full ${bgColor}`}>
                <AppText size="xs" weight="semibold" color={textColor}>
                  {percentage}%
                </AppText>
              </View>
            </View>
          </View>
        )}
        <View className="w-36">
          <AppDropdown
            data={quarters}
            selectedValue={selectedQuarter?.value || null}
            onSelect={setSelectedQuarter}
            mode="dropdown"
            placeholder="Select Quarter"
            style={{height: 36}}
          />
        </View>
      </View>
    );
  },
);

const ClaimItemCard = memo<ClaimItemCardProps>(
  ({item, isDarkTheme}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [shouldFetch, setShouldFetch] = useState(false);

    const statusInfo = useMemo(
      () => getStatusColor(item.India_Status, isDarkTheme),
      [item.India_Status, isDarkTheme],
    );

    const formattedAmount = useMemo(
      () => convertToAPACUnits(item.ClaimAmount, true, true),
      [item.ClaimAmount],
    );

    const {data: claimDetails, isLoading: isLoadingDetails} =
      useClaimMasterDataViewMore({
        ClaimCode: item.Claim_Code,
        BranchName: item.BranchName,
        ClaimStatus: item.India_Status,
        masterTab: 'Closed',
        YearQtr: '',
        enabled: shouldFetch,
      });

    const handleViewDetails = useCallback(() => {
      setShouldFetch(true);
      setIsModalOpen(true);
    }, []);

    const handleCloseModal = useCallback(() => {
      setIsModalOpen(false);
    }, []);

    const renderModalContent = () => {
      if (isLoadingDetails) {
        return (
          <View className="py-12 items-center justify-center">
            <ActivityIndicator size="large" color={AppColors.primary} />
            <AppText size="sm" color="gray" className="mt-4">
              Loading claim details...
            </AppText>
          </View>
        );
      }

      if (!claimDetails) {
        return (
          <View className="py-8 items-center">
            <AppIcon
              type="feather"
              name="alert-circle"
              size={48}
              color={isDarkTheme ? '#9ca3af' : '#6b7280'}
            />
            <AppText size="base" color="gray" className="mt-4">
              No details available
            </AppText>
          </View>
        );
      }

      return (
        <View className="py-2">
          <AppText size="lg" weight="bold" color="text" className="mb-4">
            Claim Details
          </AppText>

          {/* Claim Code */}
          <View className="mb-4">
            <AppText size="xs" color="gray" className="mb-1">
              Claim Code
            </AppText>
            <AppText size="base" weight="semibold" color="text">
              {item.Claim_Code}
            </AppText>
          </View>

          {/* Display all fields from claimDetails */}
          {Object.entries(claimDetails).map(([key, value]) => {
            if (typeof value === 'object' || value === null) return null;
            return (
              <View key={key} className="mb-4">
                <AppText size="xs" color="gray" className="mb-1">
                  {key.replace(/_/g, ' ')}
                </AppText>
                <AppText size="base" weight="semibold" color="text">
                  {String(value)}
                </AppText>
              </View>
            );
          })}
        </View>
      );
    };

    return (
      <>
        <Card
          className="mb-3 border border-slate-300 dark:border-slate-700"
          noshadow>
          {/* Claim Code and Amount */}
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-1">
              <AppText size="xs" color="gray" className="mb-1">
                Claim Code
              </AppText>
              <AppText size="base" weight="bold" color="text">
                {item.Claim_Code}
              </AppText>
            </View>
            <View className="items-end">
              <AppText size="xs" color="gray" className="mb-1">
                Amount
              </AppText>
              <AppText size="lg" weight="bold" className="text-[#007BE5]">
                {formattedAmount}
              </AppText>
            </View>
          </View>

          {/* Divider */}
          <View className="border-t border-gray-200 dark:border-gray-700 my-3" />

          {/* Scheme Category and Product ID */}
          <View className="flex-row justify-between mb-3">
            <View className="flex-1 mr-3">
              <AppText size="xs" color="gray" className="mb-1">
                Scheme Category
              </AppText>
              <AppText size="sm" weight="semibold" color="text">
                {item.Scheme_Category}
              </AppText>
            </View>

            {item.Product_ID && (
              <View className="flex-1">
                <AppText size="xs" color="gray" className="mb-1">
                  Product ID
                </AppText>
                <AppText size="sm" weight="semibold" color="text">
                  {item.Product_ID}
                </AppText>
              </View>
            )}
          </View>

          {/* Status */}
          <View className="flex-row justify-between items-center">
            {/* View Details Button */}
            <TouchableOpacity onPress={handleViewDetails} activeOpacity={0.7}>
              <AppText
                size="sm"
                weight="extraBold"
                color="secondary"
                className="underline">
                View Details
              </AppText>
            </TouchableOpacity>
            <View
              className={`px-3 py-1.5 rounded-lg ${statusInfo.bg} flex-row items-center`}>
              <AppIcon
                type="feather"
                name={statusInfo.icon}
                size={14}
                color={statusInfo.iconColor}
              />
              <AppText
                size="sm"
                weight="semibold"
                className={`ml-1.5 ${statusInfo.text}`}>
                {item.India_Status}
              </AppText>
            </View>
          </View>
        </Card>

        {/* Modal */}
        <AppModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          modalWidth="90%"
          scrollEnabled={true}
          showCloseButton={true}
          animationType="slide">
          {renderModalContent()}
        </AppModal>
      </>
    );
  },
  (prevProps, nextProps) =>
    prevProps.item.Claim_Code === nextProps.item.Claim_Code &&
    prevProps.isDarkTheme === nextProps.isDarkTheme,
);

const BranchClaimSection = memo<BranchClaimSectionProps>(
  ({branchName, claims, isDarkTheme}) => {
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
    const claimsByStatus = useMemo(() => {
      const groups = {
        closed: 0,
        pending: 0,
        total: claims.length,
        totalAmount: 0,
      };
      claims.forEach(claim => {
        const status = claim.India_Status;
        if (status === CLAIM_STATUS.CN_PASSED_DISTI) {
          groups.closed++;
        } else if (status === CLAIM_STATUS.CN_UNDER_PROCESS) {
          groups.pending++;
        }
        groups.totalAmount += claim.ClaimAmount;
      });
      return groups;
    }, [claims]);

    const visibleClaims = useMemo(
      () => claims.slice(0, visibleCount),
      [claims, visibleCount],
    );

    const hasMore = claims.length > visibleCount;
    const isAtEnd = visibleCount >= claims.length;
    const canCollapse = visibleCount > ITEMS_PER_PAGE && isAtEnd;

    const handleSeeMore = useCallback(() => {
      setVisibleCount(prev => Math.min(prev + ITEMS_PER_PAGE, claims.length));
    }, [claims.length]);

    const handleSeeLess = useCallback(() => {
      setVisibleCount(ITEMS_PER_PAGE);
    }, []);

    const renderItem: ListRenderItem<ClaimInfoBranchWise> = useCallback(
      ({item}) => <ClaimItemCard item={item} isDarkTheme={isDarkTheme} />,
      [isDarkTheme],
    );

    const keyExtractor = useCallback(
      (item: ClaimInfoBranchWise, index: number) =>
        `${item.Claim_Code}_${index}`,
      [],
    );

    const ListFooterComponent = useCallback(() => {
      if (!hasMore && !canCollapse) return null;

      return (
        <View className="mt-2 mb-3">
          {hasMore && (
            <TouchableOpacity
              onPress={handleSeeMore}
              activeOpacity={0.7}
              className="py-3 px-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <View className="flex-row items-center justify-center">
                <AppIcon
                  type="feather"
                  name="chevron-down"
                  size={18}
                  color={isDarkTheme ? '#60a5fa' : '#1e40af'}
                />
                <AppText
                  size="sm"
                  weight="semibold"
                  className="ml-2 text-blue-600 dark:text-blue-400">
                  See More ({claims.length - visibleCount} remaining)
                </AppText>
              </View>
            </TouchableOpacity>
          )}
          {canCollapse && (
            <TouchableOpacity
              onPress={handleSeeLess}
              activeOpacity={0.7}
              className="py-3 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 mt-2">
              <View className="flex-row items-center justify-center">
                <AppIcon
                  type="feather"
                  name="chevron-up"
                  size={18}
                  color={isDarkTheme ? '#9ca3af' : '#6b7280'}
                />
                <AppText
                  size="sm"
                  weight="semibold"
                  className="ml-2"
                  color="gray">
                  See Less
                </AppText>
              </View>
            </TouchableOpacity>
          )}
        </View>
      );
    }, [
      hasMore,
      canCollapse,
      handleSeeMore,
      handleSeeLess,
      claims.length,
      visibleCount,
      isDarkTheme,
    ]);

    const renderHeader = useCallback(
      () => (
        <View className="flex-1 flex-row justify-between items-center pr-2">
          <View className="flex-1">
            <View className="flex-row items-center mb-1">
              <AppIcon
                type="feather"
                name="map-pin"
                size={18}
                color={
                  isDarkTheme ? AppColors.dark.primary : AppColors.light.primary
                }
              />
              <AppText size="base" weight="bold" color="text" className="ml-2">
                {branchName}
              </AppText>
            </View>
            <View className="flex-row items-center ml-7">
              <AppText size="xs" color="gray">
                {claimsByStatus.total} Claims
              </AppText>
              <View className="w-1 h-1 rounded-full bg-gray-400 mx-2" />
              <AppText size="xs" className="text-green-600 dark:text-green-400">
                {claimsByStatus.closed} Closed
              </AppText>
              <View className="w-1 h-1 rounded-full bg-gray-400 mx-2" />
              <AppText
                size="xs"
                className="text-yellow-600 dark:text-yellow-400">
                {claimsByStatus.pending} Pending
              </AppText>
            </View>
          </View>
          <View className="items-end">
            <AppText size="xs" weight="medium" color="gray" className="mb-1">
              Total
            </AppText>
            <AppText size="base" weight="bold" className="text-[#007BE5]">
              {convertToAPACUnits(claimsByStatus.totalAmount, true, true)}
            </AppText>
          </View>
        </View>
      ),
      [branchName, claimsByStatus, isDarkTheme],
    );

    return (
      <Accordion
        header={renderHeader()}
        initialOpening={false}
        containerClassName="mb-2 rounded-xl bg-lightBg-surface dark:bg-darkBg-surface py-1"
        headerClassName="px-2 py-3"
        contentClassName="px-0"
        needBottomBorder={false}
        needShadow>
        <View className="px-3 py-3">
          <FlatList
            data={visibleClaims}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            maxToRenderPerBatch={10}
            initialNumToRender={10}
            windowSize={5}
            ListFooterComponent={ListFooterComponent}
            scrollEnabled={false}
          />
        </View>
      </Accordion>
    );
  },
);

const SummaryMetrics = memo<SummaryMetricsProps>(
  ({branchData, isDarkTheme}) => {
    const metrics = useMemo(() => {
      const totals = {
        totalClaims: 0,
        closedClaims: 0,
        pendingClaims: 0,
        totalAmount: 0,
        branches: branchData.length,
      };

      branchData.forEach(branch => {
        branch.claims.forEach(claim => {
          totals.totalClaims++;
          totals.totalAmount += claim.ClaimAmount || 0;
          const status = claim.India_Status;
          if (status === CLAIM_STATUS.CN_PASSED_DISTI) {
            totals.closedClaims++;
          } else if (status === CLAIM_STATUS.CN_UNDER_PROCESS) {
            totals.pendingClaims++;
          }
        });
      });

      return totals;
    }, [branchData]);
    return (
      <Card className="mb-3">
        <AppText size="base" weight="bold" color="text" className="mb-4">
          Overall Summary
        </AppText>
        <View className="flex-row justify-between mb-4">
          <View className="flex-1 items-center">
            <View className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/30 items-center justify-center mb-2">
              <AppIcon
                type="feather"
                name="file-text"
                size={22}
                color={isDarkTheme ? '#60a5fa' : '#1e40af'}
              />
            </View>
            <AppText size="xs" color="gray" className="-mb-1">
              Total Claims
            </AppText>
            <AppText size="2xl" weight="bold" color="text">
              {metrics.totalClaims}
            </AppText>
          </View>
          {/* Closed Claims */}
          <View className="flex-1 items-center">
            <View className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 items-center justify-center mb-2">
              <AppIcon
                type="feather"
                name="check-circle"
                size={22}
                color={isDarkTheme ? '#4ade80' : '#15803d'}
              />
            </View>
            <AppText size="xs" color="gray" className="-mb-1">
              Closed
            </AppText>
            <AppText
              size="2xl"
              weight="bold"
              className="text-green-600 dark:text-green-400">
              {metrics.closedClaims}
            </AppText>
          </View>
          {/* Pending Claims */}
          <View className="flex-1 items-center">
            <View className="w-14 h-14 rounded-full bg-yellow-100 dark:bg-yellow-900/30 items-center justify-center mb-2">
              <AppIcon
                type="feather"
                name="clock"
                size={22}
                color={isDarkTheme ? '#facc15' : '#a16207'}
              />
            </View>
            <AppText size="xs" color="gray" className="-mb-1">
              Pending
            </AppText>
            <AppText
              size="2xl"
              weight="bold"
              className="text-yellow-600 dark:text-yellow-400">
              {metrics.pendingClaims}
            </AppText>
          </View>
        </View>
        {/* Total Amount */}
        <View className="border-t border-gray-200 dark:border-gray-700 pt-3">
          <View className="flex-row justify-between items-center">
            <AppText size="sm" color="gray">
              Total Claim Amount
            </AppText>
            <AppText size="xl" weight="bold" className="text-[#007BE5]">
              {convertToAPACUnits(metrics.totalAmount, true, true)}
            </AppText>
          </View>
        </View>
      </Card>
    );
  },
);

const ClaimInfoList = memo<ClaimInfoListProps>(({tabName}) => {
  const {quarters, selectedQuarter, setSelectedQuarter} = useQuarterHook();
  const isDarkTheme = useThemeStore(state => state.AppTheme === 'dark');

  const [filters, setFilters] = useState<ClaimFilterResult>({
    productLine: '',
    claimCode: '',
    schemeCategory: '',
    sortBy: null,
  });

  const {data, isLoading} = useClaimDashboardDataAPAC({
    YearQtr: selectedQuarter?.value,
    masterTab: tabName,
  });

  const selectedTabData = useMemo<MasterTab | null>(() => {
    if (!data?.MasterTab || !Array.isArray(data.MasterTab)) return null;
    return data.MasterTab.find(tab => tab.Header_Type === tabName) ?? null;
  }, [data?.MasterTab, tabName]);

  // Extract unique filter options from data
  const filterOptions = useMemo(() => {
    if (!data?.ClaimInfoBranchWise) {
      return {
        productLines: [],
        claimCodes: [],
        schemeCategories: [],
      };
    }

    const allClaims = Object.values(
      data.ClaimInfoBranchWise,
    ).flat() as ClaimInfoBranchWise[];

    const productLinesSet = new Set<string>();
    const claimCodesSet = new Set<string>();
    const schemeCategoriesSet = new Set<string>();

    allClaims.forEach(claim => {
      if (claim.Product_ID) productLinesSet.add(claim.Product_ID);
      if (claim.Claim_Code) claimCodesSet.add(claim.Claim_Code);
      if (claim.scheme_category_dropdown)
        schemeCategoriesSet.add(claim.scheme_category_dropdown);
    });

    return {
      productLines: Array.from(productLinesSet).sort(),
      claimCodes: Array.from(claimCodesSet).sort(),
      schemeCategories: Array.from(schemeCategoriesSet).sort(),
    };
  }, [data?.ClaimInfoBranchWise]);

  // Apply filters and sorting to branch data
  const branchData = useMemo(() => {
    if (!data?.ClaimInfoBranchWise) return [];

    const branches = Object.entries(data.ClaimInfoBranchWise).map(
      ([branch, claims]) => {
        let filteredClaims = claims as ClaimInfoBranchWise[];

        // Apply filters
        if (filters.productLine) {
          filteredClaims = filteredClaims.filter(
            claim => claim.Product_ID === filters.productLine,
          );
        }
        if (filters.claimCode) {
          filteredClaims = filteredClaims.filter(
            claim => claim.Claim_Code === filters.claimCode,
          );
        }
        if (filters.schemeCategory) {
          filteredClaims = filteredClaims.filter(
            claim => claim.scheme_category_dropdown === filters.schemeCategory,
          );
        }

        // Apply sorting
        if (filters.sortBy) {
          filteredClaims = [...filteredClaims].sort((a, b) => {
            const amountA = a.ClaimAmount || 0;
            const amountB = b.ClaimAmount || 0;
            return filters.sortBy === 'high-to-low'
              ? amountB - amountA
              : amountA - amountB;
          });
        }

        return {
          branchName: branch,
          claims: filteredClaims,
        };
      },
    );

    // Filter out branches with no claims after filtering
    return branches.filter(branch => branch.claims.length > 0);
  }, [data?.ClaimInfoBranchWise, filters]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.productLine) count++;
    if (filters.claimCode) count++;
    if (filters.schemeCategory) count++;
    if (filters.sortBy) count++;
    return count;
  }, [filters]);

  const renderEmptyState = useCallback(
    () => (
      <View className="flex-1 items-center justify-center py-12">
        <AppIcon
          type="feather"
          name="inbox"
          size={64}
          color={isDarkTheme ? '#9ca3af' : '#6b7280'}
        />
        <AppText size="lg" color="gray" className="mt-4">
          No Claims Found
        </AppText>
        <AppText size="sm" color="gray" className="mt-2 text-center px-8">
          {activeFilterCount > 0
            ? 'No claims match the selected filters'
            : 'There are no claims available for the selected period'}
        </AppText>
        {activeFilterCount > 0 && (
          <TouchableOpacity
            onPress={() =>
              setFilters({
                productLine: '',
                claimCode: '',
                schemeCategory: '',
                sortBy: null,
              })
            }
            className="mt-4 px-6 py-2 bg-blue-500 dark:bg-blue-600 rounded-lg">
            <AppText size="sm" weight="semibold" className="text-white">
              Clear Filters
            </AppText>
          </TouchableOpacity>
        )}
      </View>
    ),
    [isDarkTheme, activeFilterCount],
  );

  const renderBranchItem: ListRenderItem<BranchItemProps['item']> = useCallback(
    ({item}) => (
      <BranchClaimSection
        branchName={item.branchName}
        claims={item.claims}
        isDarkTheme={isDarkTheme}
      />
    ),
    [isDarkTheme],
  );

  const branchKeyExtractor = useCallback(
    (item: BranchItemProps['item'], index: number) =>
      `${item.branchName}_${index}`,
    [],
  );

  const handleOpenFilterSheet = useCallback(() => {
    showClaimFilterSheet({
      productLine: filters.productLine,
      claimCode: filters.claimCode,
      schemeCategory: filters.schemeCategory,
      sortBy: filters.sortBy,
      allProductLines: filterOptions.productLines,
      allClaimCodes: filterOptions.claimCodes,
      allSchemeCategories: filterOptions.schemeCategories,
      onApply: result => {
        setFilters(result);
      },
      onReset: () => {
        setFilters({
          productLine: '',
          claimCode: '',
          schemeCategory: '',
          sortBy: null,
        });
      },
    });
  }, [filters, filterOptions]);

  const ListHeaderComponent = useCallback(
    () =>
      branchData.length > 0 || activeFilterCount > 0 ? (
        <>
          <View className="flex-row justify-end px-3 gap-2 mb-4">
            {/* Download Button */}
            <TouchableOpacity
              // onPress={handleDownload}
              activeOpacity={0.7}
              className="w-[40%] flex-row items-center justify-center bg-primary dark:bg-darkBg-surface border border-gray-200 dark:border-gray-700 px-3 py-2 rounded-lg">
              <AppIcon
                type="feather"
                name="download"
                size={16}
                color={isDarkTheme ? '#000' : '#fff'}
              />
              <AppText
                size="sm"
                weight="extraBold"
                color="white"
                className="ml-1.5">
                Upcoming Claims
              </AppText>
            </TouchableOpacity>

            {/* Filter Button */}
            <TouchableOpacity
              onPress={handleOpenFilterSheet}
              activeOpacity={0.4}
              className="relative flex-row items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-lightBg-surface dark:bg-darkBg-surface px-4 shadow-sm ml-2 h-[45] w-[51]">
              <AppIcon
                type="material-community"
                name="tune-variant"
                size={22}
                color={AppColors.primary}
              />
              {activeFilterCount > 0 && (
                <View className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full items-center justify-center">
                  <AppText size="xs" weight="bold" className="text-white">
                    {activeFilterCount}
                  </AppText>
                </View>
              )}
            </TouchableOpacity>
          </View>
          {branchData.length > 0 && (
            <>
              <SummaryMetrics
                branchData={branchData}
                isDarkTheme={isDarkTheme}
              />
              <View className="mb-3 px-1">
                <View className="flex-row items-center">
                  <View className="w-1 h-5 bg-[#007BE5] dark:bg-[#0066CC] rounded-full mr-2" />
                  <AppText size="base" weight="bold" color="text">
                    Total Branches:
                  </AppText>
                  <View className="ml-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-full">
                    <AppText
                      size="base"
                      weight="bold"
                      className="text-[#007BE5] dark:text-[#60a5fa]">
                      {branchData.length}
                    </AppText>
                  </View>
                </View>
              </View>
            </>
          )}
        </>
      ) : null,
    [branchData, isDarkTheme, activeFilterCount, handleOpenFilterSheet],
  );

  const renderLoadingSkeleton = useCallback(
    () => (
      <View className="px-3 mt-3">
        <View className="mb-3">
          <Skeleton width={350} height={120} borderRadius={12} />
        </View>
        <View className="mb-3">
          <Skeleton width={350} height={120} borderRadius={12} />
        </View>
        <Skeleton width={350} height={120} borderRadius={12} />
      </View>
    ),
    [],
  );

  return (
    <View className="flex-1 bg-lightBg-base dark:bg-darkBg-base">
      <ClaimHeader
        data={selectedTabData}
        isLoading={isLoading}
        tabName={tabName}
        isDarkTheme={isDarkTheme}
        quarters={quarters}
        selectedQuarter={selectedQuarter}
        setSelectedQuarter={setSelectedQuarter}
      />
      {isLoading ? (
        renderLoadingSkeleton()
      ) : branchData.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={branchData}
          renderItem={renderBranchItem}
          keyExtractor={branchKeyExtractor}
          ListHeaderComponent={ListHeaderComponent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{paddingVertical: 12, paddingHorizontal: 12}}
          maxToRenderPerBatch={5}
          initialNumToRender={5}
          windowSize={5}
        />
      )}
    </View>
  );
});

export default function ClaimDashboard() {
  const {selectedQuarter} = useQuarterHook();

  const {data, isLoading} = useClaimDashboardDataAPAC({
    YearQtr: selectedQuarter?.value,
    masterTab: 'Total',
  });

  const tabs = useMemo(() => {
    if (!data?.MasterTab || !Array.isArray(data.MasterTab)) return [];

    return data.MasterTab.map(tab => ({
      label: tab.Header_Type,
      name: tab.Header_Type,
      component: <ClaimInfoList tabName={tab.Header_Type} />,
    }));
  }, [data?.MasterTab]);

  return (
    <View className="flex-1 bg-lightBg-base dark:bg-darkBg-base">
      {isLoading ? <ClaimDataSkeleton /> : <MaterialTabBar tabs={tabs} />}
    </View>
  );
}
