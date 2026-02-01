import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react';
import {FlatList, RefreshControl, View, Pressable} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import {showToast} from '../../../../utils/commonFunctions';
import AppLayout from '../../../../components/layout/AppLayout';
import Card from '../../../../components/Card';
import AppText from '../../../../components/customs/AppText';
import AppIcon from '../../../../components/customs/AppIcon';
import AppDropdown, {
  AppDropdownItem,
} from '../../../../components/customs/AppDropdown';
import Skeleton from '../../../../components/skeleton/skeleton';
import {convertToASINUnits} from '../../../../utils/commonFunctions';
import {screenWidth} from '../../../../utils/constant';
import {DataStateView} from '../../../../components/DataStateView';
import {useMutation, useQuery} from '@tanstack/react-query';
import {useLoginStore} from '../../../../stores/useLoginStore';
import {handleASINApiCall} from '../../../../utils/handleApiCall';
import {useRoute} from '@react-navigation/native';
import moment from 'moment';

interface ClaimPartnerCaseItem {
  claimcode: string;
  caseId: string;
  ApplicationNo: string;
  PartnerCode: string;
  PartnerName: string;
  PartnerType: string;
  FinalAmt: number;
  Tax_Amt: number;
  After_Tax_FinalAmt: number;
  DistiMailTime: string | null;
  DistiCN_No: string;
  ParentCode: string;
  SubCode: string | null;
  DistiCN_Date: string | null;
  IndiaStatus: string;
  Distributor: string;
  Status: string; // Display status label
  isSeemore: boolean; // legacy flag (?) retained until backend clarifies
  isClaimEligible: boolean; // Added to indicate claim eligibility
}
interface RelatedFilterToggleProps {
  active: boolean;
  onToggle: () => void;
}
interface PartnerClaimCardProps {
  item: ClaimPartnerCaseItem;
  handleSendMail: (item: {
    caseId: string;
    ApplicationNo: string;
    PartnerCode: string;
  }) => void;
}

const usePartnerCaseIdData = (
  SchemeCategory: string,
  Product_Line: boolean,
  MonthAPI?: string,
) => {
  const {EMP_Code, EMP_RoleId} = useLoginStore(state => state.userInfo);

  const dataToSend = {
    PartnerCode: EMP_Code,
    RoleID: EMP_RoleId,
    SchemeCategory: SchemeCategory ? SchemeCategory : '',
    ProductLine: Product_Line ? Product_Line : '',
    YearMonth: MonthAPI ? MonthAPI : '',
    SelectedClaimCode: null,
  };
  return useQuery({
    queryKey: ['claimforPartner', ...Object.values(dataToSend)],
    queryFn: async () => {
      const response = await handleASINApiCall(
        '/ClaimMaster/GetClaimDashboardCaseIdWiseForPartner',
        dataToSend,
      );
      const result = response?.DashboardData;
      if (!result?.Status) {
        throw new Error('Failed to fetch activation data');
      }
      const table = result?.Datainfo
        ?.ClaimDashboardPartnerDetailsCaseIdWise as ClaimPartnerCaseItem[];
      return table;
    },
    select: data => {
      if (!data?.length) return [];
      return data.map(item => ({
        ...item,
        isClaimEligible:
          item.After_Tax_FinalAmt !== 0 ||
          item.FinalAmt !== 0 ||
          item.Tax_Amt !== 0,
      }));
    },
  });
};

const useSendEmailMutation = () => {
  const {EMP_Code, EMP_RoleId} = useLoginStore(state => state.userInfo);
  return useMutation({
    mutationFn: async (selectedClaimData: {
      caseId: string;
      ApplicationNo: string;
      PartnerCode: string;
    }) => {
      const dataToSend = {
        CaseId: selectedClaimData?.caseId,
        ApplicationNo: selectedClaimData?.ApplicationNo,
        PartnerCode: selectedClaimData?.PartnerCode,
        employeeCode: EMP_Code || '',
        RoleID: EMP_RoleId || '',
      };
      const res = await handleASINApiCall(
        'ClaimMaster/GetClaimDashboardApplicationNoAndCaseIdWiseForPartnerEmail',
        dataToSend,
        {},
        true,
      );
      const result = res.DashboardData;
      if (!result.Status) {
        throw new Error(result.Message || 'Failed to send claim email');
      }
    },
    onSettled: (data, error) => {
      if (data) {
        showToast('Claim email sent successfully');
      } else if (error) {
        showToast(
          error instanceof Error ? error.message : 'Failed to send claim email',
        );
      }
    },
  });
};
const safe = (v: any) => (v === null || v === undefined || v === '' ? '—' : v);
const useCopyFlag = () => {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const trigger = useCallback(() => {
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 1500);
  }, []);
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);
  return {copied, trigger};
};

const SkeletonList = () => (
  <View className="px-3 mt-4">
    {Array.from({length: 6}).map((_, idx) => (
      <Skeleton
        key={idx}
        width={screenWidth - 24}
        height={90}
        borderRadius={12}
      />
    ))}
  </View>
);

const EmptyState = () => (
  <Card className="items-center justify-center py-10 mt-6">
    <AppIcon
      name="inbox"
      type="feather"
      size={40}
      color="#94a3b8"
      style={{marginBottom: 12}}
    />
    <AppText size="md" weight="semibold" color="gray">
      No partner claim records
    </AppText>
    <AppText size="xs" color="gray" className="mt-1">
      Try refreshing or check back later.
    </AppText>
  </Card>
);

const ErrorState: React.FC<{onRetry: () => void}> = ({onRetry}) => (
  <Card className="mb-4 p-4 mt-3">
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
        Failed to load partner claim data
      </AppText>
    </View>
    <AppText size="xs" color="gray" className="mb-3">
      Pull down to retry or tap below.
    </AppText>
    <View className="flex-row">
      <View className="px-3 py-2 rounded-md bg-primary">
        <AppText
          size="xs"
          weight="semibold"
          className="text-white"
          onPress={onRetry}>
          Retry
        </AppText>
      </View>
    </View>
  </Card>
);

const RelatedFilterToggle: React.FC<RelatedFilterToggleProps> = memo(
  ({active, onToggle}) => (
    <Pressable
      onPress={onToggle}
      hitSlop={8}
      className={`flex-row items-center rounded-md px-3 py-2 active:opacity-80 border ${
        active
          ? 'bg-primary/10 border-primary/40 dark:border-primary/50'
          : 'bg-gray-100 dark:bg-gray-700 border-transparent'
      }`}>
      <AppIcon
        name={active ? 'check-square' : 'square'}
        type="feather"
        size={16}
        color={active ? '#2563eb' : '#64748b'}
        style={{marginRight: 6}}
      />
      <AppText
        size="xs"
        weight="semibold"
        className={
          active ? 'text-primary' : 'text-gray-700 dark:text-gray-200'
        }>
        Related to me
      </AppText>
    </Pressable>
  ),
);

const PartnerClaimCard: React.FC<PartnerClaimCardProps> = memo(
  ({item, handleSendMail}) => {
    const {copied: copiedCase, trigger: triggerCaseCopied} = useCopyFlag();
    const {copied: copiedClaim, trigger: triggerClaimCopied} = useCopyFlag();

    const isSuccess =
      (item.Status || '').toLowerCase() === 'cn is passed to disti';
    const formattedCNDate = item.DistiCN_Date
      ? item.DistiCN_Date.split('T')[0]
      : '—';
    const afterTaxAmt = convertToASINUnits(
      item.After_Tax_FinalAmt,
      false,
      true,
    );
    const subCodePresent = !!item.SubCode;

    const copy = useCallback(
      (val: string, label: string, flagTrigger: () => void) => {
        if (!val) return;
        try {
          Clipboard.setString(val);
          showToast(`${label} copied`);
          flagTrigger();
        } catch (e) {
          console.log('Clipboard copy failed', e);
        }
      },
      [],
    );

    const StatusPill = useMemo(
      () => (
        <View
          className={`px-2 py-1 rounded-full flex-row items-center ${
            isSuccess
              ? 'bg-green-100 dark:bg-green-900/30'
              : 'bg-amber-100 dark:bg-amber-900/30'
          }`}>
          <AppIcon
            name={isSuccess ? 'check-circle' : 'info'}
            type="feather"
            size={14}
            color={isSuccess ? '#15803d' : '#b45309'}
            style={{marginRight: 4}}
          />
          <AppText
            size="xs"
            weight="semibold"
            className={
              isSuccess
                ? 'text-green-800 dark:text-green-300'
                : 'text-amber-700 dark:text-amber-300'
            }>
            {safe(item.Status)}
          </AppText>
        </View>
      ),
      [isSuccess, item.Status],
    );

    return (
      <Card className="border border-slate-200 dark:border-slate-800" noshadow>
        {/* Claim Code */}
        <View className="mb-3">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-4">
              <Pressable
                onPress={() =>
                  copy(item.claimcode, 'Claim Code', triggerClaimCopied)
                }
                hitSlop={6}
                className="flex-row items-start">
                <AppText
                  weight="semibold"
                  size="sm"
                  className="text-gray-900 dark:text-gray-50 leading-snug mr-2">
                  {safe(item.claimcode)}
                </AppText>
                <AppIcon
                  name={copiedClaim ? 'check' : 'copy'}
                  type="feather"
                  size={14}
                  color={copiedClaim ? '#16a34a' : '#64748b'}
                />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Grid Fields */}
        <View className="pt-2 border-t border-dashed border-gray-200 dark:border-gray-700">
          <View className="flex-row flex-wrap -mr-3 mt-3">
            {/* Case ID */}
            <View className="w-full mb-3 pr-3">
              <AppText
                size="xs"
                color="gray"
                weight="medium"
                className="uppercase tracking-wide mb-0.5">
                Case ID
              </AppText>
              <View className="flex-row items-center">
                <AppText
                  size="sm"
                  weight="semibold"
                  className="text-gray-800 dark:text-gray-100 mr-2">
                  {safe(item.caseId)}
                </AppText>
                <Pressable
                  onPress={() =>
                    copy(item.caseId, 'Case ID', triggerCaseCopied)
                  }
                  hitSlop={8}
                  className="px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-700 active:opacity-70 flex-row items-center">
                  <AppIcon
                    name={copiedCase ? 'check' : 'copy'}
                    type="feather"
                    size={14}
                    color={copiedCase ? '#16a34a' : '#475569'}
                  />
                </Pressable>
              </View>
            </View>

            {/* Partner Name */}
            <View className="w-1/2 mb-3 pr-3">
              <AppText
                size="xs"
                color="gray"
                weight="medium"
                className="uppercase tracking-wide mb-0.5">
                Partner Name
              </AppText>
              <AppText
                size="sm"
                weight="semibold"
                className="text-gray-800 dark:text-gray-100"
                numberOfLines={2}>
                {safe(item.PartnerName)}
              </AppText>
            </View>

            {/* Partner Type */}
            <View className="w-1/2 mb-3 pr-3">
              <AppText
                size="xs"
                color="gray"
                weight="medium"
                className="uppercase tracking-wide mb-0.5">
                Partner Type
              </AppText>
              <AppText
                size="sm"
                weight="semibold"
                className="text-gray-800 dark:text-gray-100">
                {safe(item.PartnerType)}
              </AppText>
            </View>

            {/* Partner Code */}
            <View className="w-1/2 mb-3 pr-3">
              <AppText
                size="xs"
                color="gray"
                weight="medium"
                className="uppercase tracking-wide mb-0.5">
                Partner Code
              </AppText>
              <AppText
                size="sm"
                weight="semibold"
                className="text-gray-800 dark:text-gray-100">
                {safe(item.PartnerCode)}
              </AppText>
            </View>

            {/* Sub Code */}
            {subCodePresent && (
              <View className="w-1/2 mb-3 pr-3">
                <AppText
                  size="xs"
                  color="gray"
                  weight="medium"
                  className="uppercase tracking-wide mb-0.5">
                  Sub Code
                </AppText>
                <AppText
                  size="sm"
                  weight="semibold"
                  className="text-gray-800 dark:text-gray-100">
                  {safe(item.SubCode)}
                </AppText>
              </View>
            )}

            {/* Distributor */}
            <View className="w-1/2 mb-3 pr-3">
              <AppText
                size="xs"
                color="gray"
                weight="medium"
                className="uppercase tracking-wide mb-0.5">
                Distributor
              </AppText>
              <AppText
                size="sm"
                weight="semibold"
                className="text-gray-800 dark:text-gray-100"
                numberOfLines={3}>
                {safe(item.Distributor)}
              </AppText>
            </View>

            {/* CN Date */}
            <View className="w-1/2 mb-3 pr-3">
              <AppText
                size="xs"
                color="gray"
                weight="medium"
                className="uppercase tracking-wide mb-0.5">
                CN Date
              </AppText>
              <AppText
                size="sm"
                weight="semibold"
                className="text-gray-800 dark:text-gray-100">
                {formattedCNDate}
              </AppText>
            </View>

            {/* After Tax Amount */}
            <View className="w-1/2 mb-3 pr-3">
              <AppText
                size="xs"
                color="gray"
                weight="medium"
                className="uppercase tracking-wide mb-0.5">
                After Tax Amount
              </AppText>
              <AppText
                size="sm"
                weight="bold"
                className="text-primary dark:text-primary-dark">
                {afterTaxAmt}
              </AppText>
            </View>

            {/* Status */}
            <View className="w-1/2 mb-3 pr-3">
              <AppText
                size="xs"
                color="gray"
                weight="medium"
                className="uppercase tracking-wide mb-0.5">
                Status
              </AppText>
              {StatusPill}
            </View>
          </View>
        </View>

        {/* Actions */}
        {item?.isClaimEligible && (
          <View className="mt-4 pt-4 border-t border-dashed border-gray-200 dark:border-gray-700 flex-row justify-end space-x-3">
            <Pressable
              onPress={() => handleSendMail(item)}
              className="flex-row items-center px-3 py-2 rounded-md bg-primary/90 active:opacity-80">
              <AppIcon
                name="mail"
                type="feather"
                size={14}
                color="#ffffff"
                style={{marginRight: 6}}
              />
              <AppText size="xs" weight="semibold" className="text-white">
                Send Mail
              </AppText>
            </Pressable>
          </View>
        )}
      </Card>
    );
  },
);

export default function ClaimInfoPartner() {
  const {params} = useRoute();
  const {SchemeCategory, Product_Line, MonthAPI} = params as any;
  const {
    data: claimData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = usePartnerCaseIdData(SchemeCategory, Product_Line, MonthAPI);

  const {mutate} = useSendEmailMutation();

  const [showOnlyEligible, setShowOnlyEligible] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<AppDropdownItem | null>(
    null,
  );

  // Filtering: treat any non-zero financial field as "related" (business rule placeholder)
  const filteredData = useMemo(() => {
    if (!claimData?.length) return [];

    let filtered = claimData;

    // Filter by eligibility
    if (showOnlyEligible) {
      filtered = filtered.filter(
        item => item.After_Tax_FinalAmt || item.FinalAmt || item.Tax_Amt,
      );
    }

    // Filter by selected claim
    if (selectedClaim) {
      filtered = filtered.filter(
        item => item.claimcode === selectedClaim.value,
      );
    }

    return filtered;
  }, [claimData, showOnlyEligible, selectedClaim]);

  const claimOption = useMemo(() => {
    if (!claimData?.length) return [];

    const options = claimData.map(item => ({
      label:
        item.claimcode?.length > 42
          ? `${item.claimcode.slice(0, 42)}...`
          : item.claimcode,
      value: item.claimcode,
    }));

    return options;
  }, [claimData]);

  const keyExtractor = useCallback(
    (item: ClaimPartnerCaseItem) => item.caseId + '-' + item.ApplicationNo,
    [],
  );
  const renderItem = useCallback(
    ({item}: {item: ClaimPartnerCaseItem}) => (
      <PartnerClaimCard item={item} handleSendMail={item => mutate(item)} />
    ),
    [],
  );
  const toggleFilter = useCallback(() => setShowOnlyEligible(p => !p), []);

  return (
    <AppLayout title="Partner Claim Info" needBack>
      <DataStateView
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        isEmpty={!isLoading && filteredData.length === 0}
        LoadingComponent={<SkeletonList />}
        ErrorComponent={<ErrorState onRetry={refetch} />}
        EmptyComponent={<EmptyState />}>
        <View className="mb-4 pt-4 px-3">
          {/* Filter Params Card */}
          <Card className="mb-4">
            <View className="flex-row flex-wrap -mr-3">
              {SchemeCategory && (
                <View className="w-1/2 mb-3 pr-3">
                  <AppText
                    size="xs"
                    color="gray"
                    weight="medium"
                    className="uppercase tracking-wide mb-1">
                    Scheme Category
                  </AppText>
                  <AppText
                    size="sm"
                    weight="semibold"
                    className="text-gray-800 dark:text-gray-100">
                    {SchemeCategory}
                  </AppText>
                </View>
              )}

              {Product_Line && (
                <View className="w-1/2 mb-3 pr-3">
                  <AppText
                    size="xs"
                    color="gray"
                    weight="medium"
                    className="uppercase tracking-wide mb-1">
                    Product Line
                  </AppText>
                  <AppText
                    size="sm"
                    weight="semibold"
                    className="text-gray-800 dark:text-gray-100">
                    {Product_Line}
                  </AppText>
                </View>
              )}

              {MonthAPI && (
                <View className="w-1/2 mb-3 pr-3">
                  <AppText
                    size="xs"
                    color="gray"
                    weight="medium"
                    className="uppercase tracking-wide mb-1">
                    Period
                  </AppText>
                  <AppText
                    size="sm"
                    weight="semibold"
                    className="text-gray-800 dark:text-gray-100">
                    {moment(MonthAPI, 'YYYYMM').format('MMM YYYY')}
                  </AppText>
                </View>
              )}

              <View className="w-1/2 mb-3 pr-3">
                <AppText
                  size="xs"
                  color="gray"
                  weight="medium"
                  className="uppercase tracking-wide mb-1">
                  Total Records
                </AppText>
                <AppText
                  size="sm"
                  weight="bold"
                  className="text-primary dark:text-primary-dark">
                  {claimData?.length || 0}
                </AppText>
              </View>
            </View>
          </Card>

          {/* Claim Dropdown Filter */}
          {claimOption.length > 1 && (
            <View className="mb-4">
              <AppDropdown
                mode="autocomplete"
                label="Filter by Claim Code"
                data={claimOption}
                selectedValue={selectedClaim?.value}
                onSelect={setSelectedClaim}
                placeholder="Select a claim code"
                allowClear
                onClear={() => setSelectedClaim(null)}
              />
            </View>
          )}

          {/* Header with Toggle */}
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <AppText
                size="sm"
                weight="bold"
                className="text-gray-700 dark:text-gray-200">
                Results ({filteredData.length})
              </AppText>
              <AppText size="xs" color="gray" className="mt-0.5">
                {showOnlyEligible ? 'Related to me' : 'All records'}
                {selectedClaim ? ' • Filtered by claim' : ''}
              </AppText>
            </View>
            <RelatedFilterToggle
              active={showOnlyEligible}
              onToggle={toggleFilter}
            />
          </View>
        </View>
        <FlatList
          data={filteredData}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerClassName="px-3 pb-20"
          ItemSeparatorComponent={() => <View className="h-3" />}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          ListFooterComponent={
            !isLoading && filteredData.length > 0 ? (
              <View className="py-10">
                <AppText size="xs" color="gray" className="text-center">
                  End of partner claim list
                </AppText>
              </View>
            ) : null
          }
          showsVerticalScrollIndicator={false}
        />
      </DataStateView>
    </AppLayout>
  );
}
