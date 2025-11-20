import moment from 'moment';
import {useCallback, useMemo, useState} from 'react';
import {
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Clipboard,
} from 'react-native';
import {showToast} from '../../../../../utils/commonFunctions';
import Accordion from '../../../../../components/Accordion';
import AppText from '../../../../../components/customs/AppText';
import FAB from '../../../../../components/FAB';
import {useInfiniteQuery} from '@tanstack/react-query';
import {useLoginStore} from '../../../../../stores/useLoginStore';
import useEmpStore from '../../../../../stores/useEmpStore';
import {handleASINApiCall} from '../../../../../utils/handleApiCall';
import AppInput from '../../../../../components/customs/AppInput';
import AppIcon, {IconType} from '../../../../../components/customs/AppIcon';
import {AppColors} from '../../../../../config/theme';
import {ASUS, screenWidth} from '../../../../../utils/constant';
import Skeleton from '../../../../../components/skeleton/skeleton';
import {useThemeStore} from '../../../../../stores/useThemeStore';

interface RollingFunnelFilter {
  selectedFunneltype?: string;
  searchedItem?: string;
  qtySortValue?: string;
  selectedStage?: number | null;
  selectedProductLine?: number | null;
  selectedBSMname?: string;
  selectedAMname?: string;
  selectedCradStartDate?: string;
  selectedCradEndDate?: string;
}

interface RollingFunnelData {
  Funnel_Type: string;
  End_Customer: string;
  End_Customer_CompanyID: string | null;
  Quantity: number;
  Direct_Account: string;
  Indirect_Account: string;
  Product_Line: string;
  Model_Name: string;
  CRAD_Date: string;
  Stage: string;
  Opportunity_Number: string;
  Last_Update_Opportunity_Date: string;
}

interface RowType {
  icon: string;
  iconType: IconType;
  label: string;
  value: string;
  color?: string;
  copy?: boolean;
}

const ROWPERPAGE = 20;

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

const InfoGrid = ({data}: {data: RowType[]}) => {
  return (
    <View className="flex-1 p-4 bg-white dark:bg-darkBg-surface">
      <View className="flex-row flex-wrap justify-between">
        {data.map((item, index) => (
          <View key={index} className="w-[48%] mb-4">
            <InfoRow
              icon={item.icon}
              iconType={item.iconType}
              label={item.label}
              value={item.value || 'N/A'}
              color={item.color}
              copy={item.copy}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

const InfoRow = ({icon, iconType, label, value, color, copy}: RowType) => {
  const appTheme = useThemeStore(state => state.AppTheme);

  const handleCopy = () => {
    if (value) {
      Clipboard.setString(value);
      showToast(`${label} copied to clipboard`);
    }
  };

  return (
    <View className="flex-row items-center py-2">
      <View className="w-8 items-center mr-3">
        <AppIcon
          type={iconType}
          name={icon}
          size={18}
          color={AppColors[appTheme].text}
        />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center mb-1">
          <AppText size="sm" className="text-gray-600 dark:text-gray-400">
            {label}
          </AppText>
          {copy && (
            <TouchableOpacity
              onPress={handleCopy}
              activeOpacity={0.7}
              className="ml-2"
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <AppIcon
                type="material-community"
                name="content-copy"
                size={14}
                color="#6B7280"
              />
            </TouchableOpacity>
          )}
        </View>
        <AppText
          size="base"
          weight="medium"
          style={color ? {color} : undefined}
          className={!color ? "text-gray-900 dark:text-gray-100" : ""}>
          {value}
        </AppText>
      </View>
    </View>
  );
};

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
  const isBSMorAM = [ASUS.ROLE_ID.BSM, ASUS.ROLE_ID.AM].includes(
    userInfo?.EMP_RoleId as any,
  );

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

  const renderItem = useCallback(
    ({item, index}: {item: RollingFunnelData; index: number}) => {
      
      return (
        <Accordion
          key={index}
          header={
            <View className="flex-1">
              {/* Customer Name with Icon */}
              <View className="flex-row items-start mb-4">
                <View className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 items-center justify-center mt-1 mr-3">
                  <AppIcon
                    type="material-community"
                    name="account"
                    size={20}
                    color={AppColors.primary}
                  />
                </View>
                <View className="flex-1">
                  <AppText
                    weight="bold"
                    size="lg"
                    className="text-gray-900 dark:text-gray-100">
                    {item.End_Customer}
                  </AppText>
                </View>
              </View>

              {/* Info Grid */}
              <View className="flex-row items-center justify-between ">
                {/* Quantity */}
                <View className="">
                  <View className="flex-row items-center mb-1">
                    <AppIcon
                      type="material-community"
                      name="cube-outline"
                      size={14}
                      color="#6B7280"
                    />
                    <AppText
                      size="xs"
                      className="text-gray-500 dark:text-gray-400 ml-1">
                      Quantity
                    </AppText>
                  </View>
                  <AppText
                    weight="semibold"
                    size="base"
                    className="text-gray-900 dark:text-white">
                    {item.Quantity}
                  </AppText>
                </View>

                {/* Funnel Type */}
                <View className="">
                  <View className="flex-row items-center mb-1">
                    <AppIcon
                      type="material-community"
                      name="filter-variant"
                      size={14}
                      color="#6B7280"
                    />
                    <AppText
                      size="xs"
                      className="text-gray-500 dark:text-gray-400 ml-1">
                      Funnel
                    </AppText>
                  </View>
                  <AppText
                    weight="semibold"
                    size="sm"
                    numberOfLines={1}
                    className="text-gray-900 dark:text-white">
                    {item.Funnel_Type || 'N/A'}
                  </AppText>
                </View>

                {/* Last Update Date */}
                <View className="">
                  <View className="flex-row items-center mb-1">
                    <AppIcon
                      type="material-community"
                      name="clock-outline"
                      size={14}
                      color="#6B7280"
                    />
                    <AppText
                      size="xs"
                      className="text-gray-500 dark:text-gray-400 ml-1">
                      Updated
                    </AppText>
                  </View>
                  <AppText
                    weight="semibold"
                    size="sm"
                    numberOfLines={1}
                    className="text-gray-900 dark:text-white">
                    {item.Last_Update_Opportunity_Date &&
                    moment(item.Last_Update_Opportunity_Date).isValid()
                      ? moment(item.Last_Update_Opportunity_Date).format(
                          'DD-MMM-YY',
                        )
                      : 'N/A'}
                  </AppText>
                </View>
              </View>
            </View>
          }
          containerClassName="mb-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-darkBg-surface shadow-sm"
          headerClassName='py-3 '
          needBottomBorder={false}
          >
          <View className="border-t border-gray-200 mt-3">
            <InfoGrid
              data={[
                {
                  iconType: 'material-community',
                  icon: 'account-circle',
                  label: 'Customer',
                  value: item.End_Customer,
                },
                {
                  icon: 'briefcase',
                  iconType: 'feather',
                  label: 'Customer Company ID',
                  value: item.End_Customer_CompanyID || '',
                },
                {
                  icon: 'account-tie',
                  iconType: 'material-community',
                  label: 'Direct Account',
                  value: item.Direct_Account,
                },
                {
                  icon: 'account-group',
                  iconType: 'material-community',
                  label: 'Indirect Account',
                  value: item.Indirect_Account,
                },
                {
                  icon: 'package-variant',
                  iconType: 'material-community',
                  label: 'Product Line',
                  value: item.Product_Line,
                  color: AppColors.primary,
                },
                {
                  icon: 'tag',
                  iconType: 'feather',
                  label: 'Model Name',
                  value: item.Model_Name,
                },
                {
                  icon: 'clipboard-text',
                  iconType: 'material-community',
                  label: 'Opportunity Number',
                  value: item.Opportunity_Number,
                  copy: true,
                  color: '#2563EB',
                },
                {
                  icon: 'progress-check',
                  iconType: 'material-community',
                  label: 'Stage',
                  value: item.Stage,
                  color: '#059669',
                  copy: true,
                },
                {
                  icon: 'calendar-clock',
                  iconType: 'material-community',
                  label: 'CRAD Date',
                  value:
                    item.CRAD_Date && moment(item.CRAD_Date).isValid()
                      ? moment(item.CRAD_Date).format('DD-MMM-YYYY')
                      : '',
                },
              ]}
            />
          </View>
        </Accordion>
      );
    },
    [],
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
      {isBSMorAM && <FAB onPress={() => {}} />}
    </View>
  );
}
