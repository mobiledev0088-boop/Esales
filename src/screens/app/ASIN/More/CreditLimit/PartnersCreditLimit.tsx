import {memo, useCallback, useMemo, useRef, useState} from 'react';
import {FlatList, View, TouchableOpacity, RefreshControl} from 'react-native';
import {useRoute, useNavigation} from '@react-navigation/native';
import {useQuery} from '@tanstack/react-query';
import AppLayout from '../../../../../components/layout/AppLayout';
import {useLoginStore} from '../../../../../stores/useLoginStore';
import {handleASINApiCall} from '../../../../../utils/handleApiCall';
import Card from '../../../../../components/Card';
import AppText from '../../../../../components/customs/AppText';
import AppIcon from '../../../../../components/customs/AppIcon';
import Skeleton from '../../../../../components/skeleton/skeleton';
import {screenWidth} from '../../../../../utils/constant';
import AppDropdown, {
  AppDropdownItem,
} from '../../../../../components/customs/AppDropdown';
import {convertToASINUnits} from '../../../../../utils/commonFunctions';

// -------------------- Types --------------------
interface PartnerDetails {
  Shop_Name: string;
  Partner_Type: string;
  Sub_Code?: string;
  Parent_Code?: string;
  Region?: string;
  Branch?: string;
  Credit_Validation?: string; // Yes / No
  Average_Sales_Of_Months?: number | string;
  Credit_Limit?: number | string;
  Average_Limit_Percent?: number | string; // number (0-100)
}

interface PartnerCreditApiResponse {
  DashboardData?: {
    Status: boolean;
    Message?: string;
    Datainfo?: {
      PartnerDetails?: PartnerDetails[];
    };
  };
}

// -------------------- Helpers --------------------
const clampPercent = (val: any): number => {
  const n = Number(val);
  if (!isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
};

// -------------------- Query Hook --------------------
const usePartnerCreditLimit = (distributorId?: string) => {
  const userInfo = useLoginStore(state => state.userInfo);
  const employeeCode = userInfo?.EMP_Code || '';
  const roleId = userInfo?.EMP_RoleId || '';
  return useQuery<PartnerDetails[], Error>({
    queryKey: ['partnerCreditLimit', employeeCode, roleId, distributorId],
    enabled: !!employeeCode && !!roleId && !!distributorId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const res: PartnerCreditApiResponse = await handleASINApiCall(
        '/Partner/GetCreditLimit_PartnerDetails',
        {
          employeeCode,
          RoleId: roleId,
          DistriCode: distributorId,
        },
      );
      const result = res?.DashboardData;
      if (!result?.Status)
        throw new Error(result?.Message || 'Failed to fetch partner data');
      return result?.Datainfo?.PartnerDetails || [];
    },
  });
};

// -------------------- UI Sub Components --------------------
const ProgressBar = memo(({percent}: {percent: number}) => {
  const p = clampPercent(percent);
  return (
    <View className="h-2 w-full bg-gray-200 dark:bg-darkBorder rounded-full overflow-hidden">
      <View
        className="h-full bg-[#009FFF] dark:bg-white"
        style={{width: `${p}%`}}
      />
    </View>
  );
});

const PartnerCard = memo(
  ({partner, onPress}: {partner: PartnerDetails; onPress: () => void}) => {
    const percent = clampPercent(partner?.Average_Limit_Percent);
    return (
      <Card className="rounded-lg px-0 py-3">
        <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
          {/* Header */}
          <View className="flex-row justify-between items-start px-4">
            <View className="flex-1 pr-3">
              <AppText
                size="lg"
                weight="extraBold"
                className="text-gray-900 dark:text-gray-100"
                numberOfLines={2}>
                {partner?.Shop_Name || 'N/A'}
              </AppText>
              <AppText
                size="xs"
                color="gray"
                weight="semibold"
                className="mt-0.5">
                ({partner?.Sub_Code || partner?.Parent_Code || '---'})
              </AppText>
            </View>
            <View className="bg-[#009FFF] dark:bg-white px-2.5 py-1 rounded self-start">
              <AppText
                size="xs"
                weight="semibold"
                color="white"
                className="dark:text-black">
                {partner?.Partner_Type || 'Type'}
              </AppText>
            </View>
          </View>
          {/* Location */}
          <View className="px-4 mt-1.5">
            <AppText size="xs" color="gray" numberOfLines={1}>
              {(partner?.Region || 'Unknown Region') +
                ' • ' +
                (partner?.Branch || 'Unknown Branch')}
            </AppText>
          </View>
          {/* Metrics */}
          <View className="h-px bg-gray-200 dark:bg-darkBorder my-3 mx-4" />
          <View className="flex-row justify-between px-2">
            <View className="items-center flex-1">
              <AppText size="xs" color="gray">
                Credit Sufficient
              </AppText>
              <AppText
                size="sm"
                weight="bold"
                className={
                  partner?.Credit_Validation === 'Yes'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }>
                {partner?.Credit_Validation || 'N/A'}
              </AppText>
            </View>
            <View className="items-center flex-1">
              <AppText size="xs" color="gray">
                Avg Sales (6m)
              </AppText>
              <AppText size="sm" weight="bold">
                {convertToASINUnits(Number(partner?.Average_Sales_Of_Months))}
              </AppText>
            </View>
            <View className="items-center flex-1">
              <AppText size="xs" color="gray">
                Credit Limit
              </AppText>
              <AppText size="sm" weight="bold">
                {convertToASINUnits(Number(partner?.Credit_Limit))}
              </AppText>
            </View>
          </View>
          <View className="h-px bg-gray-200 dark:bg-darkBorder my-3 mx-4" />
          {/* Progress */}
          <View className="px-4 mb-1">
            <View className="flex-row justify-between mb-1 items-center">
              <AppText size="xs" color="gray">
                % of Avg Sales to Credit Limit
              </AppText>
              <AppText
                size="xs"
                weight="semibold"
                className="text-gray-800 dark:text-gray-200">
                {percent}%
              </AppText>
            </View>
            <ProgressBar percent={percent} />
          </View>
        </TouchableOpacity>
      </Card>
    );
  },
);

// -------------------- Screen --------------------
export default function PartnersCreditLimit() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const distributorId: string | undefined = route?.params?.distributorId;
  const {data, isLoading, isError, error, refetch, isFetching} =
    usePartnerCreditLimit(distributorId);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [selectedPartnerCode, setSelectedPartnerCode] = useState<string | null>(null);
  const lastUpdatedRef = useRef<Date | null>(null);

  if (!isLoading && !isFetching) {
    lastUpdatedRef.current = new Date();
  }

  // Derive distinct partner types
  const partnerTypes = useMemo<AppDropdownItem[]>(() => {
    const set = new Set<string>();
    (data || []).forEach(p => p?.Partner_Type && set.add(p.Partner_Type));
    return Array.from(set).map(v => ({label: v, value: v}));
  }, [data]);

  const partnerSearchItems = useMemo<AppDropdownItem[]>(() => {
    const arr: AppDropdownItem[] = [];
    (data || []).forEach(p => {
      const code = p.Sub_Code || p.Parent_Code || '';
      if (code) {
        arr.push({ label: `${p.Shop_Name || 'Unnamed'} - ${code}`, value: code });
      }
    });
    const seen = new Set<string>();
    return arr.filter(i => (seen.has(i.value) ? false : (seen.add(i.value), true)));
  }, [data]);

  const filteredData = useMemo(() => {
    return (data || []).filter(p => {
      const matchesType = !typeFilter || p.Partner_Type === typeFilter;
      const code = p.Sub_Code || p.Parent_Code || '';
      const matchesPartner = !selectedPartnerCode || code === selectedPartnerCode;
      return matchesType && matchesPartner;
    });
  }, [data, typeFilter, selectedPartnerCode]);

  const handlePartnerPress = useCallback(
    (partner: PartnerDetails) => {
      navigation.push('PartnerCreditLimitDetails', {partner});
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({item}: {item: PartnerDetails}) => (
      <PartnerCard partner={item} onPress={() => handlePartnerPress(item)} />
    ),
    [handlePartnerPress],
  );
  const total = data?.length || 0;
  const filtered = filteredData?.length || 0;

  // --------------- Unified Status Handling ---------------
  const status: 'loading' | 'error' | 'empty' | 'success' = isLoading
    ? 'loading'
    : isError
    ? 'error'
    : (data?.length || 0) === 0
    ? 'empty'
    : 'success';

  const LoadingSection = () => (
    <View className="px-3 gap-3 pt-5">
      {Array.from({length: 5}).map((_, i) => (
        <Skeleton
          key={i}
          width={screenWidth - 24}
            height={140}
          borderRadius={12}
        />
      ))}
    </View>
  );

  const ErrorSection = () => (
    <View className="px-3 pt-6">
      <Card className="border border-red-200/60 dark:border-red-500/40 bg-red-50 dark:bg-red-500/10">
        <AppText size="sm" weight="semibold" color="error" className="mb-2">
          Unable to load partner data
        </AppText>
        <AppText size="xs" color="error" className="mb-3 opacity-80">
          {error?.message}
        </AppText>
        <TouchableOpacity
          onPress={() => refetch()}
          className="self-start px-3 py-1.5 rounded-lg bg-error dark:bg-error/80">
          <AppText size="xs" weight="semibold" color="white">
            Retry
          </AppText>
        </TouchableOpacity>
      </Card>
    </View>
  );

  const EmptySection = () => (
    <View className="flex-1 items-center justify-center py-24">
      <AppText size="sm" color="gray">
        No partner data available
      </AppText>
      <TouchableOpacity
        onPress={() => refetch()}
        className="mt-4 px-4 py-2 rounded-lg bg-primary dark:bg-primary-dark">
        <AppText size="xs" weight="semibold" color="white">
          Refresh
        </AppText>
      </TouchableOpacity>
    </View>
  );

  const Filters = () => (
    <>
      <View className="flex-row gap-3 px-3 mt-5">
        <View className="w-[40%]">
          <AppDropdown
            data={partnerTypes}
            mode="dropdown"
            label="Partner Type"
            placeholder="Select type"
            selectedValue={typeFilter}
            onSelect={item => setTypeFilter(item?.value || null)}
            allowClear
            needIndicator
          />
        </View>
        <View className="w-[56%]">
          <AppDropdown
            data={partnerSearchItems}
            mode="autocomplete"
            label="Partner"
            placeholder="Search partner"
            selectedValue={selectedPartnerCode}
            onSelect={item => setSelectedPartnerCode(item?.value || null)}
            allowClear
            needIndicator
          />
        </View>
      </View>
      <AppText size="xs" color="gray" className="mt-0.5 px-3 mb-2">
        Showing {filtered} of {total} partners
      </AppText>
    </>
  );

  const SuccessSection = () => (
    <>
      <Filters />
      <FlatList
        data={filteredData}
        keyExtractor={(item, idx) => (item.Sub_Code || item.Parent_Code || idx.toString())}
        renderItem={renderItem}
        contentContainerClassName="px-3 pb-10 gap-3"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={Boolean(isFetching && !isLoading)}
            onRefresh={() => refetch()}
            tintColor="#2563EB"
            colors={['#2563EB']}
          />
        }
        initialNumToRender={10}
        maxToRenderPerBatch={20}
        windowSize={10}
        removeClippedSubviews
      />
    </>
  );

  return (
    <AppLayout title="Partners" needBack needPadding={false} needScroll={false}>
      {status === 'loading' && <LoadingSection />}
      {status === 'error' && <ErrorSection />}
      {status === 'empty' && <EmptySection />}
      {status === 'success' && <SuccessSection />}
    </AppLayout>
  );
}
