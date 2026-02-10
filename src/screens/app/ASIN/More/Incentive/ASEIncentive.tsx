import React, {useCallback, useMemo, useState} from 'react';
import {View, TouchableOpacity, FlatList} from 'react-native';
import AppLayout from '../../../../../components/layout/AppLayout';
import {useQuery} from '@tanstack/react-query';
import {handleASINApiCall} from '../../../../../utils/handleApiCall';
import {useLoginStore} from '../../../../../stores/useLoginStore';
import AppDropdown, {AppDropdownItem} from '../../../../../components/customs/AppDropdown';
import {getPastMonths, convertToASINUnits} from '../../../../../utils/commonFunctions';
import Card from '../../../../../components/Card';
import AppText from '../../../../../components/customs/AppText';
import AppIcon from '../../../../../components/customs/AppIcon';
import Skeleton from '../../../../../components/skeleton/skeleton';
import {screenWidth} from '../../../../../utils/constant';
import { RouteProp, useRoute } from '@react-navigation/native';
import { AppNavigationParamList } from '../../../../../types/navigation';

// -------------------- Types --------------------
interface IncentiveItem {
  Dealer_Name?: string;
  First_Name?: string;
  Last_Name?: string;
  Final_Hit_Rate_Percentage?: string | number;
  Final_Incentive_Amount?: string | number;
  Slab_Amount?: string | number;
  Flat_Payout_Amount?: string | number;
  LMS_Sellout_Amount?: string | number;
  Gaming_DT_ACCY_IncentiveAmount?: string | number;
  Demo_Video_Record_Amount?: string | number;
  SmackDown_Activity_Amount?: string | number;
  Basic_Hit_Rate_Percentage?: string | number;
  Test_Result_Percentage?: string | number;
  Attendance_Percentage?: string | number;
  ALP_Demo_Execution_Percentage?: string | number;
  Months_TGT?: string | number;
  REGISTERED_QTY_Achievement?: string | number;
  Activation?: string | number;
}

interface IncentiveApiResponse {
  DashboardData?: {
    Status: boolean;
    Message?: string;
    Datainfo?: {
      ASE_Incentive?: IncentiveItem[];
    };
  };
}

// -------------------- Helpers --------------------
const toNumber = (v: any): number => {
  const n = Number(String(v).replace(/[^0-9.-]/g, ''));
  return isFinite(n) ? n : 0;
};

// -------------------- Query Hook --------------------
const useASEIncentive = (monthValue: string | undefined,diffCode?: string) => {
  const userInfo = useLoginStore(state => state.userInfo);
  const employeeCode = userInfo?.EMP_Code || '';
  return useQuery<IncentiveItem[] , Error>({
    queryKey: ['aseIncentive', employeeCode, monthValue, diffCode],
    enabled: !!employeeCode && !!monthValue,
    queryFn: async () => {
      const year = monthValue?.slice(0, 4) || '';
      const month = monthValue?.slice(4) || '';
      const res: IncentiveApiResponse = await handleASINApiCall(
        '/Dashboard/GetDashboardData_ASE_Incentive_MonthWise',
        {
          IChannelID: diffCode || employeeCode,
          Year: year,
          Month: month,
        },
      );
      const result = res?.DashboardData;
      if (!result?.Status)
        throw new Error(result?.Message || 'Failed to load incentive data');
      return result?.Datainfo?.ASE_Incentive || [];
    },
  });
};

// -------------------- UI Sub Components --------------------
const ProgressBar = ({percent}: {percent: number}) => {
  const p = Math.min(100, Math.max(0, percent));
  return (
    <View className="h-2 w-full bg-gray-200 dark:bg-darkBorder rounded-full overflow-hidden">
      <View
        className="h-full bg-[#2563eb] dark:bg-blue-400"
        style={{width: `${p}%`}}
      />
    </View>
  );
};

const Section = ({title, children}: {title: string; children: React.ReactNode}) => (
  <View className="mt-5">
    <AppText size="md" weight="extraBold" className="text-gray-800 dark:text-gray-100 mb-2">
      {title}
    </AppText>
    <View className="rounded-xl border border-gray-200 dark:border-darkBorder overflow-hidden">
      {children}
    </View>
  </View>
);

const RowItem = ({label, value}: {label: string; value: any}) => (
  <View className="flex-row justify-between px-4 py-3 border-b border-gray-100 dark:border-darkBorder bg-white/60 dark:bg-white/5">
    <AppText size="sm" color="gray" className="flex-1 pr-3" numberOfLines={2}>{label}</AppText>
    <AppText size="sm" weight="semibold" className="text-right text-gray-800 dark:text-gray-100">
      {String(value ?? '0')}
    </AppText>
  </View>
);

// -------------------- Screen --------------------
export default function ASEIncentive() {
  const {params} = useRoute<RouteProp<AppNavigationParamList, 'ASEIncentive'>>();
  const months = useMemo<AppDropdownItem[]>(() => getPastMonths(6), []);
  const [selectedMonth, setSelectedMonth] = useState<AppDropdownItem | null>(() => months[0] || null);
  const [showDetails, setShowDetails] = useState(true);

  const {data, isLoading, isError, refetch, error, isFetching} = useASEIncentive(
    selectedMonth?.value,
    params?.employeeCode
  );

  const incentive = data && data.length > 0 ? data[0] : undefined;
  const finalHit = toNumber(incentive?.Final_Hit_Rate_Percentage);

  const incentiveMetrics = useMemo(
    () => [
      {label: 'Slab Amount', value: incentive?.Slab_Amount},
      {label: 'Flat Payment Amount', value: incentive?.Flat_Payout_Amount},
      {label: 'LMS Sellout Amount', value: incentive?.LMS_Sellout_Amount},
      {
        label: 'Gaming DT ACCY Amount',
        value: incentive?.Gaming_DT_ACCY_IncentiveAmount,
      },
      {label: 'Demo Video Record Amount', value: incentive?.Demo_Video_Record_Amount},
      {label: 'SmackDown Amount', value: incentive?.SmackDown_Activity_Amount},
      {label: 'Final Incentive Amount', value: incentive?.Final_Incentive_Amount},
    ],
    [incentive],
  );

  const hitPercentageMetrics = useMemo(
    () => [
      {label: 'Basic Hit Rate', value: incentive?.Basic_Hit_Rate_Percentage},
      {label: 'Test Result', value: incentive?.Test_Result_Percentage},
      {label: 'Attendance', value: incentive?.Attendance_Percentage},
      {label: 'ALP Demo Execution', value: incentive?.ALP_Demo_Execution_Percentage},
      {label: 'Final Hit', value: incentive?.Final_Hit_Rate_Percentage},
    ],
    [incentive],
  );

  const targetVsAchMetrics = useMemo(
    () => [
      {label: 'Target', value: incentive?.Months_TGT},
      {label: 'Registered Qty (Achievement)', value: incentive?.REGISTERED_QTY_Achievement},
      {label: 'Activation', value: incentive?.Activation},
    ],
    [incentive],
  );

  const handleRetry = useCallback(() => refetch(), [refetch]);

  return (
    <AppLayout title="ASE Incentive" needBack needPadding needScroll={false}>
      {/* Month Selector */}
      <View className="px-3 pt-4">
        <AppDropdown
          data={months}
          mode="dropdown"
          placeholder="Select Month"
          onSelect={item => setSelectedMonth(item)}
          selectedValue={selectedMonth?.value || null}
          label="Month"
          allowClear
          zIndex={4000}
          dropDownContainerStyle={{zIndex: 5000}}
        />
      </View>

      {/* Loading State */}
      {isLoading && (
        <View className="px-3 mt-4 gap-4">
          <Skeleton width={screenWidth - 24} height={180} borderRadius={16} />
          <Skeleton width={screenWidth - 24} height={300} borderRadius={16} />
        </View>
      )}

      {/* Error State */}
      {!isLoading && isError && (
        <Card className="m-4 border border-red-300/60 dark:border-red-500/40 bg-red-50 dark:bg-red-500/10">
          <AppText size="sm" weight="bold" color="error" className="mb-1">
            Failed to load data
          </AppText>
          <AppText size="xs" color="error" className="opacity-80 mb-3">
            {error?.message}
          </AppText>
          <TouchableOpacity
            onPress={handleRetry}
            className="self-start px-4 py-2 rounded-lg bg-error">
            <AppText size="xs" weight="semibold" color="white">
              Retry
            </AppText>
          </TouchableOpacity>
        </Card>
      )}

      {/* Empty */}
      {!isLoading && !isError && !incentive && (
        <View className="px-3 py-14 items-center">
          <AppIcon name="database-off" type="material-community" size={40} color="#94a3b8" />
          <AppText size="sm" color="gray" className="mt-3">
            No incentive data available
          </AppText>
        </View>
      )}

      {!isLoading && !isError && incentive && (
        <FlatList
          data={[incentive]}
          keyExtractor={(_, i) => i.toString()}
          contentContainerClassName="px-3 pb-16"
          showsVerticalScrollIndicator={false}
          renderItem={() => (
            <View className='mt-5'>
              {/* Summary Card */}
              <Card className="border border-slate-200 dark:border-slate-800" noshadow>
                <View className="flex-row justify-between">
                  <View className="flex-1 pr-4">
                    <AppText size="lg" weight="extraBold" className="text-gray-900 dark:text-gray-100" numberOfLines={2}>
                      {incentive?.Dealer_Name || 'Dealer'}
                    </AppText>
                    <AppText size="xs" color="gray" className="mt-1" numberOfLines={2}>
                      ASE Name: {`${incentive?.First_Name || ''} ${incentive?.Last_Name || ''}`.trim() || 'N/A'}
                    </AppText>
                  </View>
                  <View className="items-end">
                    <AppIcon name="award" type="feather" size={40} color="#2563eb" />
                  </View>
                </View>
                <View className="h-px bg-gray-200 dark:bg-darkBorder my-4" />
                <View>
                  <AppText size="xs" color="gray" weight="semibold">
                    Final Hit Rate %
                  </AppText>
                  <View className="flex-row items-center mt-2">
                    <View className="flex-1 mr-3">
                      <ProgressBar percent={finalHit} />
                    </View>
                    <AppText size="sm" weight="extraBold" className="text-gray-900 dark:text-gray-100 w-12 text-right">
                      {finalHit || 0}%
                    </AppText>
                  </View>
                </View>
                <View className="mt-6">
                  <AppText size="xs" color="gray" weight="semibold">
                    Final Incentive Amount
                  </AppText>
                  <AppText size="3xl" weight="extraBold" className="text-gray-900 dark:text-gray-100 mt-1">
                    {convertToASINUnits(toNumber(incentive?.Final_Incentive_Amount), false, true)}
                  </AppText>
                </View>
                {/* <TouchableOpacity
                  onPress={() => setShowDetails(p => !p)}
                  className="flex-row items-center self-end mt-4">
                  <AppText size="xs" color="primary" weight="semibold" className="mr-1">
                    {showDetails ? 'Hide Details' : 'See Details'}
                  </AppText>
                  <AppIcon
                    name={showDetails ? 'chevron-up' : 'chevron-down'}
                    type="feather"
                    size={18}
                    color="#2563eb"
                  />
                </TouchableOpacity> */}
              </Card>

              {/* {showDetails && ( */}
                <View className="mt-6">
                  <Section title="Incentives">
                    {incentiveMetrics.map(m => (
                      <RowItem key={m.label} label={m.label} value={m.value} />
                    ))}
                  </Section>
                  <Section title="Hit % Information">
                    {hitPercentageMetrics.map(m => (
                      <RowItem key={m.label} label={m.label} value={m.value} />
                    ))}
                  </Section>
                  <Section title="Target vs Achievement">
                    {targetVsAchMetrics.map(m => (
                      <RowItem key={m.label} label={m.label} value={m.value} />
                    ))}
                  </Section>
                </View>
              {/* )} */}
            </View>
          )}
          refreshing={Boolean(isFetching && !isLoading)}
          onRefresh={() => refetch()}
        />
      )}
    </AppLayout>
  );
}
