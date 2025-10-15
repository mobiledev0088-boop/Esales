import {useMemo, memo, useState, useCallback} from 'react';
import {View, FlatList, RefreshControl} from 'react-native';
import AppLayout from '../../../../components/layout/AppLayout';
import Card from '../../../../components/Card';
import AppText from '../../../../components/customs/AppText';
import AppIcon from '../../../../components/customs/AppIcon';
import {convertToASINUnits} from '../../../../utils/commonFunctions';
import AppDropdown, {AppDropdownItem} from '../../../../components/customs/AppDropdown';
import {RouteProp, useRoute} from '@react-navigation/native';
import {AppNavigationParamList} from '../../../../types/navigation';
import {useQuery} from '@tanstack/react-query';
import {useLoginStore} from '../../../../stores/useLoginStore';
import {handleASINApiCall} from '../../../../utils/handleApiCall';
import Skeleton from '../../../../components/skeleton/skeleton';
import {screenWidth} from '../../../../utils/constant';
import moment from 'moment';

type ClaimDashboardItem = {
  PartnerName: string;
  PartnerCode: string;
  ApplicationNo: string;
  PartnerType: string;
  FinalAmt: number;
  Tax_Amt: number;
  After_Tax_FinalAmt: number;
  DistiMailTime: string;
  DistiCN_No: string;
  ParentCode: string;
  SubCode: string | null;
  DistiCN_Date: string;
};

const useClaimApplicationData = (
  SchemeCategory: string,
  ProductLine: string,
  YearMonth: string,
  PartnerType: string,
  ApplicationNo: string,
) => {
  const MonthAPI = YearMonth
    ? moment(YearMonth, 'MMM-YYYY').format('YYYYMM')
    : '';
  const userInfo = useLoginStore((state: any) => state.userInfo);
  const employeeCode = userInfo?.EMP_Code || '';
  const roleId = userInfo?.EMP_RoleId || '';

  return useQuery<ClaimDashboardItem[]>({
    queryKey: [
      'getClaimApplicationData',
      employeeCode,
      roleId,
      SchemeCategory,
      ProductLine,
      MonthAPI,
      PartnerType,
      ApplicationNo,
    ],
    queryFn: async () => {
      const dataToSend = {
        UserName: employeeCode,
        RoleID: roleId,
        SchemeCategory,
        ProductLine,
        YearMonth: MonthAPI ? MonthAPI : '',
        PartnerType,
        ApplicationNo,
      };
      const res = await handleASINApiCall(
        '/ClaimMaster/GetClaimDashboardApplicationNoWise',
        dataToSend,
      );
      const result = res.DashboardData;
      if (!result?.Status) return [];
      return result.Datainfo?.ClaimDashboardDetailsApplicationNoWise || [];
    },
  });
};

const ClaimCard: React.FC<{item: ClaimDashboardItem}> = memo(({item}) => {
  return (
    <Card className="rounded-md ">
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1 pr-2">
          <AppText
            weight="semibold"
            size="md"
            className="text-gray-900 dark:text-gray-100"
            numberOfLines={2}>
            {item.PartnerName}
          </AppText>
          <AppText size="xs" color="gray" className="mt-0.5">
            Partner Code: {item.PartnerCode}
          </AppText>
        </View>
        <View
          className={`flex-row items-center px-2 py-1 rounded bg-indigo-100 dark:bg-indigo-900/40`}>
          <AppText
            size="xs"
            weight="medium"
            className="text-slate-800 dark:text-slate-200">
            {item.PartnerType || 'N/A'}
          </AppText>
        </View>
      </View>
      <View className="flex-row mt-2">
        <View className="flex-1 pr-3 justify-between">
          <View className="flex-row items-center mb-3">
            <AppIcon
              name="file-text"
              type="feather"
              size={16}
              color="#64748b"
              style={{marginRight: 6}}
            />
            <View className="flex-row items-center flex-wrap">
              <AppText size="xs" color="gray" weight="medium" className="mr-1">
                Application No:
              </AppText>
              <AppText size="sm" weight="semibold">
                {item.ApplicationNo}
              </AppText>
            </View>
          </View>
          <View className="flex-row items-center">
            <AppIcon
              name="credit-card"
              type="feather"
              size={16}
              color="#1d4ed8"
              style={{marginRight: 6}}
            />
            <View className="flex-row items-center flex-wrap">
              <AppText size="xs" color="gray" weight="medium" className="mr-1">
                Net Payable:
              </AppText>
              <AppText
                size="sm"
                weight="semibold"
                className="text-primary dark:text-primary-dark">
                {convertToASINUnits(item.After_Tax_FinalAmt)}
              </AppText>
            </View>
          </View>
        </View>
        {/* Right Column: CN Date + Sub Code */}
        <View className="flex-1 pl-3 justify-between">
          <View className="flex-row items-center mb-3">
            <AppIcon
              name="calendar"
              type="feather"
              size={16}
              color="#6366f1"
              style={{marginRight: 6}}
            />
            <View className="flex-row items-center flex-wrap">
              <AppText size="xs" color="gray" weight="medium" className="mr-1">
                CN Date:
              </AppText>
              <AppText size="sm" weight="regular">
                {item.DistiCN_Date}
              </AppText>
            </View>
          </View>
          {item.SubCode && (
            <View className="flex-row items-center">
              <AppIcon
                name="git-branch"
                type="feather"
                size={16}
                color="#64748b"
                style={{marginRight: 6}}
              />
              <View className="flex-row items-center flex-wrap">
                <AppText
                  size="xs"
                  color="gray"
                  weight="medium"
                  className="mr-1">
                  Sub Code:
                </AppText>
                <AppText size="sm" weight="medium">
                  {item.SubCode ?? '—--'}
                </AppText>
              </View>
            </View>
          )}
        </View>
      </View>
    </Card>
  );
});

const SkeletonCard = () => (
  <View className="gap-3">
    <Skeleton width={screenWidth - 24} height={100} borderRadius={8} />
    <Skeleton width={screenWidth - 24} height={100} borderRadius={8} />
    <Skeleton width={screenWidth - 24} height={100} borderRadius={8} />
    <Skeleton width={screenWidth - 24} height={100} borderRadius={8} />
  </View>
);

export default function ClaimApplicationDetails() {
  const {params} = useRoute<RouteProp<AppNavigationParamList, 'ClaimApplicationDetails'>>();
  const {
    Amount_Props,
    ApplicationNo,
    ClaimStatus,
    Claim_Code,
    Distributor,
    MonthAPI,
    PartnerType,
    Product_Line,
    SchemeCategory,
    Scheme_Month,
    caseId,
  } = params;

  const {
    data: claimData = [],
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useClaimApplicationData(
    SchemeCategory,
    Product_Line,
    Scheme_Month,
    PartnerType,
    ApplicationNo,
  );

  const F = (v?: string | null) => (v && v.trim() !== '' ? v : '—');

  const partnerDropdownItems: AppDropdownItem[] = useMemo(
    () =>
      claimData.map(p => ({
        label: `${p.PartnerName} (${p.PartnerCode})`,
        value: p.PartnerCode,
      })),
    [claimData],
  );

  const [selectedPartner, setSelectedPartner] =
    useState<AppDropdownItem | null>(null);

  const filteredData = useMemo(() => {
    if (!selectedPartner) return claimData;
    const found = claimData.find(p => p.PartnerCode === selectedPartner.value);
    return found ? [found] : claimData.slice(0, 1);
  }, [selectedPartner, claimData]);

  const totalPartners = useMemo(() => claimData.length, [claimData]);

  const summaryFields: {label: string; value: string | null; full?: boolean}[] =
    [
      {label: 'Claim Code', value: Claim_Code, full: true},
      {label: 'Application No', value: ApplicationNo},
      {label: 'Distributor', value: Distributor},
      {label: 'Scheme Month', value: Scheme_Month},
      {label: 'Scheme Category', value: SchemeCategory},
      {label: 'Product Line', value: Product_Line},
      {label: 'Partner Type', value: PartnerType},
      {label: 'Total Partners', value: String(totalPartners)},
      {label: 'Month API', value: MonthAPI},
      {label: 'Case ID', value: caseId},
      {label: 'Claim Status', value: ClaimStatus},
      {label: 'Amount', value: Amount_Props},
    ];

  const summaryCard = (
    <View className="mb-4">
      <AppText weight="bold" size="md" className="mb-2">
        Application Summary
      </AppText>
      <Card className="">
        <View className="flex-row flex-wrap -mx-2">
          {summaryFields.map((f, idx) => (
            <View
              key={idx}
              className={`${f.full ? 'w-full' : 'w-1/2'} px-2 mb-3`}>
              <AppText
                size="xs"
                color="gray"
                weight="medium"
                className="mb-0.5">
                {f.label}
              </AppText>
              <AppText
                size="sm"
                weight="semibold"
                numberOfLines={f.label === 'Distributor' ? 2 : 1}
                className={
                  f.label === 'Amount'
                    ? 'text-primary dark:text-primary-dark'
                    : ''
                }>
                {f.label === 'Amount'
                  ? convertToASINUnits(Number(F(f.value)), true)
                  : F(f.value)}
              </AppText>
            </View>
          ))}
        </View>
      </Card>
    </View>
  );

  const renderItem = ({item}: {item: ClaimDashboardItem}) => <ClaimCard item={item} />;
  const keyExtractor = useCallback(
    (item: ClaimDashboardItem) => item.PartnerCode + '-' + item.ApplicationNo,
    [],
  );

  const showDropdown = claimData.length > 3;
  return (
    <AppLayout title="Claim Application Details" needBack>
      {isError && (
        <Card className="mb-4 p-4">
          <View className="flex-row items-center mb-2">
            <AppIcon
              name="alert-triangle"
              type="feather"
              size={18}
              color="#dc2626"
              style={{marginRight: 6}}
            />
            <AppText
              size="sm"
              weight="semibold"
              className="text-red-600 dark:text-red-400">
              Failed to load claim data
            </AppText>
          </View>
          <AppText size="xs" color="gray">
            Pull to retry.
          </AppText>
        </Card>
      )}
      {showDropdown && (
        <View className="px-3 mt-3 mb-2">
          <AppDropdown
            data={partnerDropdownItems}
            mode="autocomplete"
            label="Select Partner"
            selectedValue={selectedPartner?.value}
            onSelect={item => setSelectedPartner(item)}
            placeholder="Filter partner"
            allowClear
            listHeight={250}
          />
        </View>
      )}
      <FlatList
        data={filteredData}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={summaryCard}
        contentContainerClassName="px-3 pb-20 pt-4"
        initialNumToRender={10}
        maxToRenderPerBatch={20}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View className="h-3" />}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
          />
        }
        ListEmptyComponent={
          isLoading ? <SkeletonCard />
          : (
            <Card className="items-center justify-center py-10 mt-4">
              <AppIcon
                name="inbox"
                type="feather"
                size={40}
                color="#94a3b8"
                style={{marginBottom: 12}}
              />
              <AppText size="md" weight="semibold" color="gray">
                No claim records found
              </AppText>
            </Card>
          )
        }
        ListFooterComponent={
          !isLoading && filteredData.length !== 0 && !isError ? (
            <View className="py-10">
              <AppText size="sm" color="gray" className="text-center">
                No more claims to load
              </AppText>
            </View>
          ) : null
        }
      />
    </AppLayout>
  );
}
