import {useCallback, useMemo, useState} from 'react';
import {
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import {SheetManager} from 'react-native-actions-sheet';
import {showToast} from '../../../../../utils/commonFunctions';
import AppText from '../../../../../components/customs/AppText';
import FAB from '../../../../../components/FAB';
import {useInfiniteQuery} from '@tanstack/react-query';
import {useLoginStore} from '../../../../../stores/useLoginStore';
import {useUserStore} from '../../../../../stores/useUserStore';
import {handleASINApiCall} from '../../../../../utils/handleApiCall';
import AppInput from '../../../../../components/customs/AppInput';
import AppIcon from '../../../../../components/customs/AppIcon';
import {AppColors} from '../../../../../config/theme';
import {ASUS, screenWidth} from '../../../../../utils/constant';
import Skeleton from '../../../../../components/skeleton/skeleton';
import {AppNavigationProp} from '../../../../../types/navigation';
import {useNavigation} from '@react-navigation/native';
import {RollingFunnelItem} from './components';
import {RollingFunnelData, RollingFunnelFilter} from './types';
import {showRollingFilterSheet} from './RollingFilterSheet';

// constant
const ROWPERPAGE = 20;

const initialFliter: RollingFunnelFilter = {
  selectedFunneltype: '',
  searchedItem: '',
  qtySortValue: '',
  selectedStage: null,
  selectedProductLine: null,
  selectedBSMname: '',
  selectedAMname: '',
  selectedCradStartDate: '',
  selectedCradEndDate: '',
};
// api hook
const useGetRollingFunnelData = (filter: RollingFunnelFilter) => {
  const {EMP_Code: EmpCode = ''} = useLoginStore(state => state.userInfo);
  const empInfo = useUserStore(state => state.empInfo);

  const {
    selectedFunneltype = '',
    searchedItem = '',
    qtySortValue = '',
    selectedStage = '',
    selectedProductLine = '',
    selectedBSMname = '',
    selectedAMname = '',
    selectedCradStartDate = '',
    selectedCradEndDate = '',
  } = filter;

  return useInfiniteQuery({
    queryKey: [
      'rollingFunnelData',
      EmpCode,
      selectedFunneltype,
      searchedItem,
      qtySortValue,
      selectedStage,
      selectedProductLine,
      selectedBSMname,
      selectedAMname,
      selectedCradStartDate,
      selectedCradEndDate,
      empInfo?.Sync_Date,
    ],
    enabled: Boolean(EmpCode),
    initialPageParam: 1,
    queryFn: async ({pageParam}) => {
      const payload = {
        EmpCode,
        FunnelType: selectedFunneltype,
        GenericValue: searchedItem,
        QtySort: qtySortValue,
        Stage: selectedStage?.toString() || '',
        ProductLine: selectedProductLine?.toString() || '',
        BSMname: selectedBSMname,
        AMname: selectedAMname,
        CRADStartDate: selectedCradStartDate,
        CRADEndDate: selectedCradEndDate,
        PageNumber: pageParam,
        RowPerPage: ROWPERPAGE,
        sync_date: empInfo?.Sync_Date,
      };

      const response = await handleASINApiCall(
        '/RollingFunnel/GetRollingFunnel_Search',
        payload,
      );
      const result = response?.DashboardData;
      if (!result?.Status) {
        throw new Error(
          result?.Message || 'Failed to fetch Rolling Funnel data',
        );
      }
      return result?.Datainfo?.RollingFunnelData ?? [];
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage?.length === ROWPERPAGE ? allPages.length + 1 : undefined;
    },
  });
};
// components
const ListHeader = ({count}: {count: number}) => {
  return (
    <View className="pb-2 mt-4">
      <AppText
        size="sm"
        weight="medium"
        className="text-gray-600 dark:text-gray-400">
        Records showing: {count}
      </AppText>
    </View>
  );
};

const ListFooter = ({
  isLoadingMore,
  hasMore,
}: {
  isLoadingMore: boolean;
  hasMore: boolean;
}) => {
  if (isLoadingMore) {
    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="small" color={AppColors.primary} />
        <AppText size="sm" className="text-gray-500 dark:text-gray-400 mt-2">
          Loading more...
        </AppText>
      </View>
    );
  }

  if (!hasMore) {
    return (
      <View className="py-4 items-center">
        <AppText
          size="sm"
          weight="medium"
          className="text-gray-600 dark:text-gray-400">
          You've reached the end
        </AppText>
      </View>
    );
  }

  return null;
};

export default function RollingFunnel() {
  const userInfo = useLoginStore(state => state.userInfo);
  const navigation = useNavigation<AppNavigationProp>();
  const isBSMorACM = [ASUS.ROLE_ID.BSM, ASUS.ROLE_ID.ACM, ASUS.ROLE_ID.HO_EMPLOYEES].includes(userInfo?.EMP_RoleId as any);

  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<RollingFunnelFilter>(initialFliter);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetRollingFunnelData(filter);

  const items = useMemo(() => data?.pages?.flatMap(page => page) ?? [], [data]);

  // Swipe action handlers
  const handleEdit = useCallback(
    (item: RollingFunnelData) => {
      SheetManager.show('ConfirmationSheet', {
        payload: {
          title: 'Edit Rolling Funnel',
          message: `Do you want to edit the Rolling Funnel for ${item.End_Customer}?`,
          confirmText: 'Edit',
          cancelText: 'Cancel',
          onConfirm: () => {
            // Navigate to edit screen with item data
            navigation.push('AddRollingFunnel' as any, {editData: item} as any);
            showToast('Opening edit screen...');
          },
        },
      });
    },
    [navigation],
  );

  const handleClose = useCallback((item: RollingFunnelData) => {
    SheetManager.show('ClosingDetailsSheet', {
      payload: {
        item,
        onSubmit: () => {
          console.log('Submitting closing details:', {item});
        },
      },
    });
  }, []);

  const renderItem = useCallback(
    ({item, index}: {item: RollingFunnelData; index: number}) => {
      return (
        <RollingFunnelItem
          item={item}
          index={index}
          onEdit={handleEdit}
          onClose={handleClose}
        />
      );
    },
    [handleEdit, handleClose],
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const onLoadMore = useCallback(() => {
    if (!isFetchingNextPage && hasNextPage) {
      fetchNextPage();
    }
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  const renderContent = () => {
    // Loading state
    if (isLoading) {
      return (
        <>
          <View className="flex-row px-3 gap-3 mt-5">
            <Skeleton width={screenWidth * 0.75} height={50} />
            <Skeleton width={screenWidth * 0.15} height={50} />
          </View>
          <View className="px-3">
            {[...Array(7)].map((_, i) => (
              <Skeleton key={i} width={screenWidth - 24} height={100} />
            ))}
          </View>
        </>
      );
    }

    // Error state
    if (isError) {
      return (
        <>
          <View className="px-3 flex-row items-center mb-4">
            <AppInput
              value={searchText}
              setValue={setSearchText}
              placeholder="Search by Customer..."
              leftIcon="search"
              variant="border"
              size="md"
              containerClassName="w-10/12 bg-white"
            />
            <TouchableOpacity
              activeOpacity={0.6}
              className="items-center justify-center rounded border border-slate-300 bg-white px-4 ml-2 h-[46px]">
              <AppIcon
                type="material-community"
                name="tune-variant"
                size={22}
                color={AppColors.primary}
              />
            </TouchableOpacity>
          </View>
          <View className="flex-1 items-center justify-center px-6">
            <View className="items-center mb-6">
              <View className="w-24 h-24 rounded-full bg-red-100 dark:bg-red-900/30 items-center justify-center mb-4">
                <AppIcon
                  type="material-community"
                  name="alert-circle-outline"
                  size={48}
                  color="#ef4444"
                />
              </View>
              <AppText
                size="xl"
                weight="bold"
                className="text-gray-900 dark:text-white text-center mb-2">
                Oops! Something went wrong
              </AppText>
              <AppText
                size="sm"
                className="text-gray-600 dark:text-gray-400 text-center mb-4">
                {error?.message || 'Unable to load rolling funnel data'}
              </AppText>
            </View>
            <TouchableOpacity
              onPress={() => refetch()}
              activeOpacity={0.7}
              className="bg-primary px-8 py-3 rounded-lg flex-row items-center gap-2">
              <AppIcon
                type="material-community"
                name="refresh"
                size={20}
                color="white"
              />
              <AppText size="base" weight="semibold" className="text-white">
                Try Again
              </AppText>
            </TouchableOpacity>
          </View>
        </>
      );
    }

    // Empty state
    if (items.length === 0) {
      return (
        <>
          <View className="px-3 flex-row items-center mb-4">
            <AppInput
              value={searchText}
              setValue={setSearchText}
              placeholder="Search by Customer..."
              leftIcon="search"
              variant="border"
              size="md"
              containerClassName="w-10/12 bg-white"
            />
            <TouchableOpacity
              activeOpacity={0.6}
              className="items-center justify-center rounded border border-slate-300 bg-white px-4 ml-2 h-[46px]">
              <AppIcon
                type="material-community"
                name="tune-variant"
                size={22}
                color={AppColors.primary}
              />
            </TouchableOpacity>
          </View>
          <View className="flex-1 items-center justify-center px-6">
            <View className="items-center">
              <View className="w-32 h-32 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center mb-6">
                <AppIcon
                  type="material-community"
                  name="file-document-outline"
                  size={64}
                  color={AppColors.primary}
                />
              </View>
              <AppText
                size="xl"
                weight="bold"
                className="text-gray-900 dark:text-white text-center mb-2">
                No Rolling Funnel Data
              </AppText>
              <AppText
                size="sm"
                className="text-gray-600 dark:text-gray-400 text-center">
                {searchText
                  ? 'No results found for your search'
                  : 'Start by adding a new rolling funnel entry'}
              </AppText>
            </View>
          </View>
        </>
      );
    }

    // Success state with data
    return (
      <>
        <View className="px-3 flex-row items-center">
          <AppInput
            value={searchText}
            setValue={setSearchText}
            placeholder="Search by Customer..."
            leftIcon="search"
            variant="border"
            size="md"
            containerClassName="w-10/12 bg-white"
            onSubmitEditing={() => {
              setFilter(prev => ({...prev, searchedItem: searchText}));
            }}
          />
          {/* Filter Button */}
          <TouchableOpacity
            activeOpacity={0.6}
            className="items-center justify-center rounded border border-slate-300 bg-white px-4 ml-2 h-[46px]"
            onPress={() => {
              // Open filter sheet with current selections and handlers
              showRollingFilterSheet({
                quantity: filter.qtySortValue || null,
                funnelType: filter.selectedFunneltype || null,
                stage: (filter.selectedStage as any) || null,
                productLine: (filter.selectedProductLine as any) || null,
                cradStartDate:
                  filter.selectedCradStartDate
                    ? new Date(filter.selectedCradStartDate)
                    : null,
                cradEndDate:
                  filter.selectedCradEndDate
                    ? new Date(filter.selectedCradEndDate)
                    : null,
                bsm: filter.selectedBSMname || null,
                am: filter.selectedAMname || null,
                onApply: res => {
                  // Map sheet result to RollingFunnelFilter and trigger refetch via state change
                  setFilter(prev => ({
                    ...prev,
                    qtySortValue: res.quantity ?? '',
                    selectedFunneltype: res.funnelType ?? '',
                    selectedStage: res.stage ? Number(res.stage) : null,
                    selectedProductLine: res.productLine ? Number(res.productLine) : null,
                    selectedCradStartDate: res.cradStartDate
                      ? new Date(res.cradStartDate).toISOString().slice(0, 10)
                      : '',
                    selectedCradEndDate: res.cradEndDate
                      ? new Date(res.cradEndDate).toISOString().slice(0, 10)
                      : '',
                    selectedBSMname: res.bsm ?? '',
                    selectedAMname: res.am ?? '',
                  }));
                },
                onReset: () => {
                  setFilter(prev => ({
                    ...prev,
                    qtySortValue: '',
                    selectedFunneltype: '',
                    selectedStage: null,
                    selectedProductLine: null,
                    selectedCradStartDate: '',
                    selectedCradEndDate: '',
                    selectedBSMname: '',
                    selectedAMname: '',
                  }));
                },
              });
            }}>
            <AppIcon
              type="material-community"
              name="tune-variant"
              size={22}
              color={AppColors.primary}
            />
          </TouchableOpacity>
        </View>

        <FlatList
          data={items}
          keyExtractor={(item, index) =>
            `${item.Opportunity_Number ?? item.End_Customer ?? 'row'}-${index}`
          }
          renderItem={renderItem}
          ListHeaderComponent={<ListHeader count={items.length} />}
          ListFooterComponent={
            <ListFooter
              isLoadingMore={isFetchingNextPage}
              hasMore={hasNextPage ?? false}
            />
          }
          contentContainerStyle={{
            paddingHorizontal: 12,
            paddingBottom: 32,
          }}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onEndReachedThreshold={0.4}
          onEndReached={onLoadMore}
          removeClippedSubviews
          initialNumToRender={10}
          windowSize={5}
          showsVerticalScrollIndicator={false}
        />
      </>
    );
  };

  return (
    <View className="flex-1 bg-lightBg-base pt-4">
      {renderContent()}
      {isBSMorACM && !isLoading && (
        <FAB onPress={() => navigation.push('AddRollingFunnel')} />
      )}
    </View>
  );
}
