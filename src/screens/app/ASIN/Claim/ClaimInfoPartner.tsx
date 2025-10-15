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
import Skeleton from '../../../../components/skeleton/skeleton';
import {convertToASINUnits} from '../../../../utils/commonFunctions';
import {screenWidth} from '../../../../utils/constant';

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
}
interface RelatedFilterToggleProps {
  active: boolean;
  onToggle: () => void;
}
interface PartnerClaimCardProps {
  item: ClaimPartnerCaseItem;
}
const MOCK_PARTNER_CASES: ClaimPartnerCaseItem[] = [
  {
    claimcode:
      '[NB202409112]_26_Sep_to_06_Oct_Sep Diwali Sale_Activation Support_ALP_Creator',
    caseId: 'C24988645',
    ApplicationNo: 'CIN24A00020',
    PartnerCode: 'ASIN001016',
    PartnerName: 'Silver Systems',
    PartnerType: 'MFR',
    FinalAmt: 21372.0,
    Tax_Amt: 887.76,
    After_Tax_FinalAmt: 22259.76,
    DistiMailTime: '2024-11-26T19:44:33.31',
    DistiCN_No: '2202525545',
    ParentCode: 'ASIN001016',
    SubCode: 'ASIN001016A',
    DistiCN_Date: '2024-11-22T00:00:00',
    IndiaStatus: 'CN is passed to Disti',
    Distributor: 'RASHI PERIPHERALS PVT LTD',
    Status: 'CN is passed to Disti',
    isSeemore: false,
  },
  {
    claimcode:
      '[NB202409125]_26_SEP_to_06_Oct_Diwali_Wave1_Activation Support_ALP_Multi_Models',
    caseId: 'C24989582',
    ApplicationNo: 'CIN24A00134',
    PartnerCode: 'ASIN001016',
    PartnerName: 'Silver Systems',
    PartnerType: 'MFR',
    FinalAmt: 7284.0,
    Tax_Amt: 1311.12,
    After_Tax_FinalAmt: 8595.12,
    DistiMailTime: '2024-11-26T19:46:03.563',
    DistiCN_No: '1.50075e+009',
    ParentCode: 'ASIN001016',
    SubCode: null,
    DistiCN_Date: '2024-11-20T00:00:00',
    IndiaStatus: 'CN is passed to Disti',
    Distributor: 'REDINGTON INDIA LIMITED',
    Status: 'CN is passed to Disti',
    isSeemore: false,
  },
  {
    claimcode:
      '[NB20241027]_9_Oct_to_17_Oct_Diwali Sale Wave 2 Activation Support _ALP_Creator',
    caseId: 'C24A93388',
    ApplicationNo: 'CIN24A00751',
    PartnerCode: 'ASIN001016',
    PartnerName: 'Silver Systems',
    PartnerType: 'MFR',
    FinalAmt: 24660.0,
    Tax_Amt: 0.0,
    After_Tax_FinalAmt: 24660.0,
    DistiMailTime: '2024-11-29T20:46:31.323',
    DistiCN_No: '2202525641',
    ParentCode: 'ASIN001016',
    SubCode: null,
    DistiCN_Date: '2024-12-09T00:00:00',
    IndiaStatus: 'CN is passed to Disti',
    Distributor: 'RASHI PERIPHERALS PVT LTD',
    Status: 'CN is passed to Disti',
    isSeemore: false,
  },
  {
    claimcode:
      '[NB20241040]_09_OCT_to_17_Oct_Diwali_Wave2_Activation Support_ALP_Multi_Models',
    caseId: 'C24A95956',
    ApplicationNo: 'CIN24A00945',
    PartnerCode: 'ASIN001016',
    PartnerName: 'Silver Systems',
    PartnerType: 'MFR',
    FinalAmt: 4047.0,
    Tax_Amt: 728.46,
    After_Tax_FinalAmt: 4775.46,
    DistiMailTime: '2024-11-29T20:51:42.05',
    DistiCN_No: '2202525662',
    ParentCode: 'ASIN001016',
    SubCode: null,
    DistiCN_Date: '2024-12-09T00:00:00',
    IndiaStatus: 'CN is passed to Disti',
    Distributor: 'RASHI PERIPHERALS PVT LTD',
    Status: 'CN is passed to Disti',
    isSeemore: false,
  },
  {
    claimcode:
      '[NB20241040]_09_OCT_to_17_Oct_Diwali_Wave2_Activation Support_ALP_Multi_Models',
    caseId: 'C24A95956',
    ApplicationNo: 'CIN24A00947',
    PartnerCode: 'ASIN001016',
    PartnerName: 'Silver Systems',
    PartnerType: 'MFR',
    FinalAmt: 22661.0,
    Tax_Amt: 4078.98,
    After_Tax_FinalAmt: 26739.98,
    DistiMailTime: '2024-11-29T20:53:31.09',
    DistiCN_No: '1.50075e+009',
    ParentCode: 'ASIN001016',
    SubCode: null,
    DistiCN_Date: '2024-12-16T00:00:00',
    IndiaStatus: 'CN is passed to Disti',
    Distributor: 'REDINGTON INDIA LIMITED',
    Status: 'CN is passed to Disti',
    isSeemore: false,
  },
];
const usePartnerCaseIdData = () => {
  const [data, setData] = useState<ClaimPartnerCaseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Initial load mock
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled) return;
      try {
        setData(MOCK_PARTNER_CASES);
        setIsError(false);
      } catch {
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    }, 500); // delay to show skeleton state
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  // Refresh simulation
  const refetch = useCallback(() => {
    setIsError(false);
    setRefreshing(true);
    const timer = setTimeout(() => {
      try {
        setData(MOCK_PARTNER_CASES);
        setIsError(false);
      } catch {
        setIsError(true);
      } finally {
        setRefreshing(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  return {data, isLoading, isError, refreshing, refetch};
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
const PartnerClaimCard: React.FC<PartnerClaimCardProps> = memo(({item}) => {
  const {copied: copiedCase, trigger: triggerCaseCopied} = useCopyFlag();
  const {copied: copiedClaim, trigger: triggerClaimCopied} = useCopyFlag();

  const isSuccess =
    (item.Status || '').toLowerCase() === 'cn is passed to disti';
  const formattedCNDate = item.DistiCN_Date
    ? item.DistiCN_Date.split('T')[0]
    : '—';
  const afterTaxAmt = convertToASINUnits(item.After_Tax_FinalAmt, false, true);
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

  const handleSendMail = useCallback(() => {
    // Placeholder: integrate share / mailto / API send
    console.log('Send Mail pressed for case', item.caseId);
  }, [item.caseId]);

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
    <Card>
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
                onPress={() => copy(item.caseId, 'Case ID', triggerCaseCopied)}
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
      <View className="mt-4 pt-4 border-t border-dashed border-gray-200 dark:border-gray-700 flex-row justify-end space-x-3">
        <Pressable
          onPress={handleSendMail}
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
    </Card>
  );
});
export default function ClaimInfoPartner() {
  const {data, isLoading, isError, refreshing, refetch} =
    usePartnerCaseIdData();
  const [showOnlyEligible, setShowOnlyEligible] = useState(false);

  // Filtering: treat any non-zero financial field as "related" (business rule placeholder)
  const filteredData = useMemo(
    () =>
      showOnlyEligible
        ? data.filter(
            item => item.After_Tax_FinalAmt || item.FinalAmt || item.Tax_Amt,
          )
        : data,
    [data, showOnlyEligible],
  );

  const keyExtractor = useCallback(
    (item: ClaimPartnerCaseItem) => item.caseId + '-' + item.ApplicationNo,
    [],
  );
  const renderItem = useCallback(
    ({item}: {item: ClaimPartnerCaseItem}) => <PartnerClaimCard item={item} />,
    [],
  );
  const toggleFilter = useCallback(() => setShowOnlyEligible(p => !p), []);

  return (
    <AppLayout title="Partner Claim Info" needBack>
      {isError && <ErrorState onRetry={refetch} />}
      <FlatList
        data={filteredData}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerClassName="px-3 pb-20 pt-4"
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListEmptyComponent={isLoading ? <SkeletonList /> : <EmptyState />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refetch} />
        }
        ListHeaderComponent={
          <View className="mb-4">
            <View className="flex-row items-center justify-between mt-1">
              <View className="flex-1 pr-3">
                <AppText
                  size="sm"
                  weight="bold"
                  className="text-gray-700 dark:text-gray-200 mr-2">
                  Partner Claims
                </AppText>
                <AppText size="xs" color="gray" className="mt-0.5">
                  {showOnlyEligible ? 'Related to me' : 'All records'}
                </AppText>
              </View>
              <RelatedFilterToggle
                active={showOnlyEligible}
                onToggle={toggleFilter}
              />
            </View>
          </View>
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
      />
    </AppLayout>
  );
}