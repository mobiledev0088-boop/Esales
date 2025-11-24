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
import useEmpStore from '../../../../../stores/useEmpStore';
import {handleASINApiCall} from '../../../../../utils/handleApiCall';
import AppInput from '../../../../../components/customs/AppInput';
import AppIcon from '../../../../../components/customs/AppIcon';
import {AppColors} from '../../../../../config/theme';
import {ASUS, screenWidth} from '../../../../../utils/constant';
import Skeleton from '../../../../../components/skeleton/skeleton';
import { AppNavigationProp } from '../../../../../types/navigation';
import { useNavigation } from '@react-navigation/native';
import RollingFunnelItem from './RollingFunnelItem';
import {RollingFunnelData, RollingFunnelFilter} from './types';

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
  const empInfo = useEmpStore(state => state.empInfo);

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
  const isBSMorAM = [ASUS.ROLE_ID.BSM, ASUS.ROLE_ID.AM].includes(userInfo?.EMP_RoleId as any);

  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<RollingFunnelFilter>(initialFliter);

  const {
    data,
    isLoading,
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
          message: `Do you want to edit the opportunity for ${item.End_Customer}?`,
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

  const handleDelete = useCallback((item: RollingFunnelData) => {
    SheetManager.show('ConfirmationSheet', {
      payload: {
        title: 'Delete Rolling Funnel',
        message: `Are you sure you want to delete the opportunity for ${item.End_Customer}?`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        onConfirm: () => {
          // TODO: Implement delete API call
          showToast(`Deleting ${item.Opportunity_Number}...`);
          // Add your delete mutation here
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
          onDelete={handleDelete}
        />
      );
    },
    [handleEdit, handleDelete],
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

  if (isLoading) {
    return (
      <View className="flex-1 bg-lightBg-base">
        <View className="flex-row px-3 gap-3 mt-5">
          <Skeleton width={screenWidth * 0.75} height={50} />
          <Skeleton width={screenWidth * 0.15} height={50} />
        </View>
        <View className="px-3">
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} width={screenWidth - 24} height={100} />
          ))}
        </View>
      </View>
    );
  }
  return (
    <View className="flex-1 bg-lightBg-base pt-4">
      <View className="px-3 flex-row items-center">
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

      {/* List */}
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
      {isBSMorAM && <FAB onPress={() => navigation.push('AddRollingFunnel')} />}
    </View>
  );
}
