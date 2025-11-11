import {memo, useCallback, useMemo, useRef} from 'react';
import {FlatList, TouchableOpacity, View, RefreshControl} from 'react-native';
import AppLayout from '../../../../../components/layout/AppLayout';
import {useQuery} from '@tanstack/react-query';
import {handleASINApiCall} from '../../../../../utils/handleApiCall';
import {useLoginStore} from '../../../../../stores/useLoginStore';
import {useNavigation} from '@react-navigation/native';
import AppText from '../../../../../components/customs/AppText';
import Card from '../../../../../components/Card';
import AppIcon from '../../../../../components/customs/AppIcon';
import Skeleton from '../../../../../components/skeleton/skeleton';
import {screenWidth} from '../../../../../utils/constant';
import { AppNavigationProp } from '../../../../../types/navigation';

interface DistributorSummary {
  Distributor_Code: string;
  Distributor_Name: string;
  No_of_ALP_Aligned: number | string;
  Credit_Limit_Shared: number | string;
  Credit_Limit_Sufficient: number | string;
  Credit_Limit_Insufficient: number | string;
  No_Credit_Limit: number | string;
  Pending_Information: number | string;
}

interface CreditLimitApiResponse {
  DashboardData?: {
    Status: boolean;
    Message?: string;
    Datainfo?: {
      SummaryDetails?: DistributorSummary[];
    };
  };
}

const STATUS = {
  SUFFICIENT: 'Sufficient',
  INSUFFICIENT: 'Insufficient',
  NO_CREDIT: 'No Credit',
  PENDING: 'Pending',
} as const;

const STATUS_STYLES: Record<
  string,
  {
    label: string;
    color: string;
    key: keyof DistributorSummary;
    icon: string;
    circle?: boolean;
  }
> = {
  [STATUS.SUFFICIENT]: {
    label: STATUS.SUFFICIENT,
    color: '#10b981',
    key: 'Credit_Limit_Sufficient',
    icon: 'check',
    circle: true,
  },
  [STATUS.INSUFFICIENT]: {
    label: STATUS.INSUFFICIENT,
    color: '#ef4444',
    key: 'Credit_Limit_Insufficient',
    icon: 'remove',
    circle: true,
  },
  [STATUS.NO_CREDIT]: {
    label: STATUS.NO_CREDIT,
    color: '#6b7280',
    key: 'No_Credit_Limit',
    icon: 'minus',
    circle: true,
  },
  [STATUS.PENDING]: {
    label: STATUS.PENDING,
    color: '#f59e0b',
    key: 'Pending_Information',
    icon: 'clock-o',
  },
};

// -------------------- Query Hook --------------------
const useDistributorCreditSummary = () => {
  const userInfo = useLoginStore(state => state.userInfo);
  const employeeCode = userInfo?.EMP_Code || '';
  const roleId = userInfo?.EMP_RoleId || '';
  return useQuery<DistributorSummary[], Error>({
    queryKey: ['creditLimitSummary', employeeCode, roleId],
    enabled: !!employeeCode && !!roleId,
    queryFn: async () => {
      const res: CreditLimitApiResponse = await handleASINApiCall(
        '/Partner/GetASIN_Partner_Credit_Limit_GetDistributorSummary',
        {
          employeeCode,
          RoleId: roleId,
        },
      );
      const result = res?.DashboardData;
      if (!result?.Status)
        throw new Error(result?.Message || 'Failed to load credit limit');
      return result?.Datainfo?.SummaryDetails || [];
    }
  });
};

// -------------------- Presentational Components --------------------
const StatusGrid = memo(({item}: {item: DistributorSummary}) => {
  const rows = useMemo(
    () =>
      Object.values(STATUS_STYLES).map(cfg => ({...cfg, value: item[cfg.key]})),
    [item],
  );
  return (
    <View className="flex-row flex-wrap mt-3 px-3">
      {rows.map(status => (
        <View key={status.label} className="w-[48%] m-[1%]">
          <View className="flex-row items-center">
            {status.circle ? (
              <View
                className="w-5 h-5 rounded-full items-center justify-center mr-2"
                style={{borderWidth: 2, borderColor: status.color}}>
                <AppIcon
                  name={status.icon}
                  type="fontAwesome"
                  size={10}
                  color={status.color}
                />
              </View>
            ) : (
              <AppIcon
                name={status.icon}
                type="fontAwesome"
                size={18}
                color={status.color}
                style={{marginRight: 8}}
              />
            )}
            <AppText size="sm" color="gray" className="mr-1" weight="regular">
              {status.label}:
            </AppText>
            <AppText size="md" weight="bold" style={{color: status.color}}>
              {status.value}
            </AppText>
          </View>
        </View>
      ))}
    </View>
  );
});

const DistributorCard = memo(
  ({
    item,
    onPress,
  }: {
    item: DistributorSummary;
    onPress: (d: DistributorSummary) => void;
  }) => {
    return (
      <Card className="px-0 rounded-md">
        <TouchableOpacity activeOpacity={0.7} onPress={() => onPress(item)}>
          <AppText
            size="xl"
            weight="semibold"
            className="text-gray-800 dark:text-gray-100 pl-3">
            {item.Distributor_Name}
          </AppText>
          <View className="flex-row items-center mt-1 pb-2 px-3 border-b border-gray-300 dark:border-darkBorder">
            <AppText color="gray" className="mr-3">
              Aligned:{' '}
              <AppText weight="semibold" className="text-text dark:text-white">
                {item.No_of_ALP_Aligned}
              </AppText>
            </AppText>
            <AppText color="gray" className="text-gray-400 dark:text-gray-500">
              |
            </AppText>
            <AppText color="gray" className="ml-3">
              Shared:{' '}
              <AppText weight="semibold" className="text-text dark:text-white">
                {item.Credit_Limit_Shared}
              </AppText>
            </AppText>
          </View>
          <StatusGrid item={item} />
        </TouchableOpacity>
      </Card>
    );
  },
);

export default function CreditLimit() {
  const {data, isLoading, isError, refetch, error, isFetching} =
    useDistributorCreditSummary();
  const navigation = useNavigation<AppNavigationProp>();
  const lastUpdatedRef = useRef<Date | null>(null);

  if (!isLoading && !isFetching) {
    lastUpdatedRef.current = new Date();
  }

  const handlePress = useCallback(
    (item: DistributorSummary) => {
      navigation.push('PartnersCreditLimit', {distributorId: item.Distributor_Code,});
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({item}: {item: DistributorSummary}) => (
      <DistributorCard item={item} onPress={handlePress} />
    ),
    [handlePress],
  );

  return (
    <AppLayout title="Credit Limit" needBack needPadding needScroll={false}>
      {isLoading ? (
        <View className="px-3 gap-3 pt-3">
          <Skeleton width={screenWidth - 24} height={120} borderRadius={8} />
          <Skeleton width={screenWidth - 24} height={120} borderRadius={8} />
          <Skeleton width={screenWidth - 24} height={120} borderRadius={8} />
          <Skeleton width={screenWidth - 24} height={120} borderRadius={8} />
          <Skeleton width={screenWidth - 24} height={120} borderRadius={8} />
          <Skeleton width={screenWidth - 24} height={120} borderRadius={8} />
          <Skeleton width={screenWidth - 24} height={120} borderRadius={8} />
        </View>
      ) : (
        isError && (
          <Card className="my-4 border border-red-200/60 dark:border-red-500/40 bg-red-50 dark:bg-red-500/10">
            <AppText size="sm" weight="semibold" color="error" className="mb-2">
              Unable to load data
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
        )
      )}
      {!isLoading && !isError && (!data || data.length === 0) && (
        <View className="flex-1 items-center justify-center py-20">
          <AppText size="sm" color="gray">
            No distributor credit data found
          </AppText>
        </View>
      )}
      {/* Heading */}
      <FlatList
        data={data}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderItem}
        contentContainerStyle={{paddingBottom: 32}}
        showsVerticalScrollIndicator={false}
        contentContainerClassName="gap-3 px-3 pt-5"
        refreshControl={
          <RefreshControl
            refreshing={Boolean(isFetching && !isLoading)}
            onRefresh={() => refetch()}
            tintColor="#2563EB"
            colors={['#2563EB']}
          />
        }
      />
    </AppLayout>
  );
}
