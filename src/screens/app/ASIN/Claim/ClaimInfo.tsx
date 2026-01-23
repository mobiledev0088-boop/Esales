import {useCallback, useMemo, useState, useRef, useEffect, memo} from 'react';
import {FlatList, View, TouchableOpacity} from 'react-native';
import {useRoute, useNavigation} from '@react-navigation/native';
import AppLayout from '../../../../components/layout/AppLayout';
import Card from '../../../../components/Card';
import AppText from '../../../../components/customs/AppText';
import AppIcon from '../../../../components/customs/AppIcon';
import Accordion from '../../../../components/Accordion';
import {convertToASINUnits, showToast} from '../../../../utils/commonFunctions';
import RNCB from '@react-native-clipboard/clipboard';
import {twMerge} from 'tailwind-merge';
import {useLoginStore} from '../../../../stores/useLoginStore';
import {useQuery} from '@tanstack/react-query';
import moment from 'moment';
import {handleASINApiCall} from '../../../../utils/handleApiCall';
import {AppNavigationProp} from '../../../../types/navigation';
import {ClaimDataSkeleton} from './components';
import AppDropdown, {
  AppDropdownItem,
} from '../../../../components/customs/AppDropdown';

type RouteParams = {
  SchemeCategory: string;
  ProductLine: string;
  Product_Line_Name: string;
  YearMonth: string;
  PartnerType: string;
  type: 'processed' | 'underProcess';
};

interface ClaimCaseItem {
  claimcode: string;
  caseId: string;
  application_count: number;
  Status: string;
  total_amount: number;
}

interface ClaimApplicationItem {
  claimcode: string;
  caseId: string;
  Distributor: string;
  ClaimStatus: string;
  ApplicationNo: string;
  DistiCN_Date: string | null;
  PartnerCode: number;
  PreTaxAmount: number;
  After_Tax_FinalAmt: number;
}

interface ClaimDataResponse {
  ClaimDashboardDetailsApplicationNoWise: ClaimApplicationItem[];
  ClaimDashboardDetailsCaseIdWise: ClaimCaseItem[];
}

const useGetClaimData = (
  SchemeCategory: string,
  ProductLine: string,
  YearMonth: string,
  PartnerType: string,
) => {
  const MonthAPI = YearMonth
    ? moment(YearMonth, 'MMM-YYYY').format('YYYYMM')
    : '';

  const userInfo = useLoginStore((state: any) => state.userInfo);
  const employeeCode = userInfo?.EMP_Code || '';
  const roleId = userInfo?.EMP_RoleId || '';
  return useQuery({
    queryKey: [
      'getClaimData',
      employeeCode,
      roleId,
      SchemeCategory,
      ProductLine,
      MonthAPI,
      PartnerType,
    ],
    queryFn: async () => {
      const dataToSend = {
        employeeCode: employeeCode,
        RoleId: roleId,
        SchemeCategory,
        ProductLine,
        PartnerType,
        YearMonth: MonthAPI,
        SelectedClaimCode: null,
      };
      const res = await handleASINApiCall(
        '/ClaimMaster/GetClaimDashboardCaseIdWise',
        dataToSend,
      );
      const result = res.DashboardData;
      if (!result?.Status) {
        return {
          ClaimDashboardDetailsApplicationNoWise: [],
          ClaimDashboardDetailsCaseIdWise: [],
        };
      } else {
        return {
          ClaimDashboardDetailsApplicationNoWise:
            result.Datainfo?.ClaimDashboardDetailsApplicationNoWise,
          ClaimDashboardDetailsCaseIdWise:
            result.Datainfo?.ClaimDashboardDetailsCaseIdWise,
        };
      }
    },
  });
};

const PROCESSED_CLAIM_STATUS = 'CN is passed to Disti' as const;

const MetaItem: React.FC<{
  icon: string;
  label: string;
  value: string | number;
  color?: string; // icon color
  valueClassName?: string; // optional class for value text color
}> = ({icon, label, value, color, valueClassName}) => (
  <View className="flex-row items-center mr-4 mb-2">
    <View className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 items-center justify-center mr-2">
      <AppIcon
        name={icon}
        type="feather"
        size={14}
        color={color || '#374151'}
      />
    </View>
    <View>
      <AppText
        size="xs"
        className="text-gray-500 dark:text-gray-400"
        weight="medium">
        {label}
      </AppText>
      <AppText size="sm" weight="bold" className={valueClassName}>
        {value}
      </AppText>
    </View>
  </View>
);

export default function ClaimInfo() {
   const navigation = useNavigation<AppNavigationProp>();
  const {params} = useRoute();
  const {
    SchemeCategory,
    ProductLine,
    Product_Line_Name,
    YearMonth,
    PartnerType,
    type,
  } = params as RouteParams;

  // Fetch claim data
  const {data, isLoading, isError, refetch} = useGetClaimData(
    SchemeCategory,
    ProductLine,
    YearMonth,
    PartnerType,
  );

  type StatusFilter = 'all' | 'processed' | 'underProcess';
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(type);

  const apiCaseData: ClaimCaseItem[] = data?.ClaimDashboardDetailsCaseIdWise || [];
  const apiApplicationData: ClaimApplicationItem[] = data?.ClaimDashboardDetailsApplicationNoWise || [];

  const classification = useMemo(() => {
    const childrenGrouped: Record<string, ClaimApplicationItem[]> = {};
    for (const child of apiApplicationData) {
      (childrenGrouped[child.caseId] ||= []).push(child);
    }

    const caseProcessedMap: Record<string, boolean> = {};
    const processedCases: ClaimCaseItem[] = [];
    const underProcessCases: ClaimCaseItem[] = [];
    let processedCount = 0;
    let processedTotal = 0;
    let underProcessCount = 0;
    let underProcessTotal = 0;

    for (const caseItem of apiCaseData) {
      const children = childrenGrouped[caseItem.caseId] || [];
      const isProcessed =
        !!children.length &&
        children.every(c => c.ClaimStatus === PROCESSED_CLAIM_STATUS);
      caseProcessedMap[caseItem.caseId] = isProcessed;
      if (isProcessed) {
        processedCases.push(caseItem);
        processedCount++;
        processedTotal += caseItem.total_amount;
      } else {
        underProcessCases.push(caseItem);
        underProcessCount++;
        underProcessTotal += caseItem.total_amount;
      }
    }

    return {
      childrenGrouped,
      caseProcessedMap,
      processedCases,
      underProcessCases,
      stats: {
        processedCount,
        processedTotal,
        underProcessCount,
        underProcessTotal,
      },
    } as const;
  }, [apiApplicationData, apiCaseData]);

  const [selectedClaimCode, setSelectedClaimCode] = useState<AppDropdownItem | null>(null);
  const claimCodeOptions: AppDropdownItem[] = useMemo(() => {
    const unique = new Set<string>();
    for (const c of apiCaseData) if (c.claimcode) unique.add(c.claimcode);
    return Array.from(unique).map(code => ({label: code, value: code}));
  }, [apiCaseData]);

  const filteredCaseData = useMemo(() => {
    let base: ClaimCaseItem[];
    if (statusFilter === 'processed') base = classification.processedCases;
    else if (statusFilter === 'underProcess')
      base = classification.underProcessCases;
    else base = apiCaseData;

    if (!selectedClaimCode) return base;
    return base.filter(c => c.claimcode === selectedClaimCode.value);
  }, [statusFilter, classification, apiCaseData, selectedClaimCode]);

  const allStats = classification.stats;

  const SummaryParamsSection = () => {
    const summaryChips: {label: string; value: string; icon: string}[] = [
      {label: 'Scheme', value: SchemeCategory, icon: 'layers'},
      {label: 'Product Line', value: Product_Line_Name, icon: 'package'},
      {label: 'Month / Year', value: YearMonth, icon: 'calendar'},
      {label: 'Partner Type', value: PartnerType, icon: 'users'},
    ];

    return (
      <View>
        {/* Status Filter Segmented Control */}
        <View className="flex-row items-center justify-between mt-2 mb-3 px-1">
          {[
            {key: 'all' as StatusFilter, label: 'All'},
            {key: 'processed' as StatusFilter, label: 'Processed'},
            {key: 'underProcess' as StatusFilter, label: 'Under Process'},
          ].map(opt => {
            const active = statusFilter === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                activeOpacity={0.8}
                onPress={() => setStatusFilter(opt.key)}
                className={twMerge(
                  'flex-1 mx-1 py-2 rounded-xl border items-center justify-center',
                  'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
                  active && 'bg-primary border-primary',
                )}>
                <AppText
                  size="xs"
                  weight={active ? 'bold' : 'semibold'}
                  className={twMerge(
                    'text-gray-600 dark:text-gray-300',
                    active && 'text-white',
                  )}
                  numberOfLines={1}>
                  {opt.label}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>
        <View className="flex-row items-center gap-2 my-3 mt-5">
          <View className="p-1.5 rounded-full bg-indigo-100 dark:bg-emerald-900/40">
            <AppIcon
              name={'chart-timeline-variant'}
              size={22}
              color={'#4f46e5'}
              type="material-community"
            />
          </View>
          <AppText size="md" weight="bold" color="text">
            Scheme Summary
          </AppText>
        </View>

        <Card>
          <View className="flex-row flex-wrap -mx-1 mb-2">
            {summaryChips.map(chip => (
              <View key={chip.label} className="w-1/2 px-1 mb-2">
                <View className="flex-row items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                  <View className="w-7 h-7 rounded-md bg-primary/5 items-center justify-center mr-2">
                    <AppIcon
                      name={chip.icon}
                      type="feather"
                      size={15}
                      color="#2563eb"
                    />
                  </View>
                  <View className="flex-1">
                    <AppText
                      size="xs"
                      weight="medium"
                      className="text-gray-500 dark:text-gray-400 mb-0.5"
                      numberOfLines={1}>
                      {chip.label}
                    </AppText>
                    <AppText size="xs" weight="semibold" numberOfLines={1}>
                      {chip.value || '-'}
                    </AppText>
                  </View>
                </View>
              </View>
            ))}
          </View>
          <View className="flex-row -mx-1 mt-1">
            <View className="flex-1 mx-1 p-3 rounded-lg bg-success/10 border border-success/30">
              <View className="flex-row items-center justify-between mb-1">
                <AppText size="xs" weight="medium" className="text-success">
                  Processed
                </AppText>
                <AppIcon
                  name="check-circle"
                  type="feather"
                  size={14}
                  color="#16a34a"
                />
              </View>
              <View className="flex-row items-end justify-between">
                <AppText size="lg" weight="bold" className="mr-2">
                  {allStats.processedCount}
                </AppText>
                <AppText
                  size="xs"
                  className="text-gray-500 dark:text-gray-400"
                  numberOfLines={2}>
                  {convertToASINUnits(allStats.processedTotal, true)}
                </AppText>
              </View>
            </View>
            <View className="flex-1 mx-1 p-3 rounded-lg bg-warning/10 border border-warning/30">
              <View className="flex-row items-center justify-between mb-1">
                <AppText size="xs" weight="medium" className="text-warning">
                  Under Process
                </AppText>
                <AppIcon
                  name="clock"
                  type="feather"
                  size={14}
                  color="#d97706"
                />
              </View>
              <View className="flex-row items-end justify-between">
                <AppText size="lg" weight="bold" className="mr-2">
                  {allStats.underProcessCount}
                </AppText>
                <AppText
                  size="xs"
                  className="text-gray-500 dark:text-gray-400"
                  numberOfLines={2}>
                  {convertToASINUnits(allStats.underProcessTotal, true)}
                </AppText>
              </View>
            </View>
          </View>
        </Card>

        <View className="flex-row items-center gap-2 my-3">
          <View className="p-1.5 rounded-full bg-sky-100  dark:bg-emerald-900/40">
            <AppIcon
              name={'file-document-outline'}
              size={22}
              color={'#0284c7'}
              type="material-community"
            />
          </View>
          <AppText size="md" weight="bold" color="text">
            Claim Details
          </AppText>
        </View>
      </View>
    );
  };

  const ChildCard: React.FC<{
    item: ClaimApplicationItem;
    index: number;
    last: boolean;
  }> = memo(({item, last}) => {
    const isClaimPassed = item.ClaimStatus === PROCESSED_CLAIM_STATUS;
    const statusColor = isClaimPassed ? 'text-success' : 'text-warning';
    const handlePress = () =>
      navigation.push('ClaimApplicationDetails', {
        Amount_Props: item.After_Tax_FinalAmt.toString(),
        Claim_Code: item.claimcode,
        ApplicationNo: item.ApplicationNo,
        caseId: item.caseId,
        ClaimStatus: item.ClaimStatus,
        Distributor: item.Distributor,
        MonthAPI: moment(YearMonth, 'MMM-YYYY').format('YYYYMM'),
        PartnerType: PartnerType,
        SchemeCategory: SchemeCategory,
        Product_Line: ProductLine,
        Scheme_Month: YearMonth,
        Status_data: '',
      });

    return (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={isClaimPassed ? handlePress : undefined}
        className={twMerge(
          'p-3 rounded-md border border-gray-200 dark:border-gray-700  mx-1',
          !last && 'mb-3',
        )}>
        <View className="flex-row mb-2 items-start">
          <View className="flex-1 pr-3">
            <AppText
              size="sm"
              weight="semibold"
              className="mb-1"
              numberOfLines={2}>
              {item.Distributor || '-'}
            </AppText>
          </View>
          {isClaimPassed && (
            <View className="p-1 rounded-full bg-gray-100 dark:bg-gray-700 ">
              <AppIcon
                name="chevron-right"
                type="feather"
                size={20}
                color="#9ca3af"
              />
            </View>
          )}
        </View>
        <View className="flex-row flex-wrap">
          <View className="w-1/3 mb-3 pr-2">
            <AppText
              size="xs"
              className="text-gray-500 dark:text-gray-400"
              weight="medium">
              Amount
            </AppText>
            <AppText size="xs" weight="semibold">
              {convertToASINUnits(item.After_Tax_FinalAmt)}
            </AppText>
          </View>
          <View className="w-1/3 mb-3 pr-2">
            <AppText
              size="xs"
              className="text-gray-500 dark:text-gray-400"
              weight="medium">
              Application No
            </AppText>
            <AppText size="xs" weight="semibold" numberOfLines={1}>
              {item.ApplicationNo}
            </AppText>
          </View>
          <View className="w-1/3 mb-3 pr-2">
            <AppText
              size="xs"
              className="text-gray-500 dark:text-gray-400"
              weight="medium">
              Total
            </AppText>
            <AppText size="xs" weight="semibold" numberOfLines={1}>
              {item.PartnerCode}
            </AppText>
          </View>
          <View className="w-1/3 mb-1 pr-2">
            <AppText
              size="xs"
              className="text-gray-500 dark:text-gray-400"
              weight="medium">
              CN Date
            </AppText>
            <AppText size="xs" weight="semibold">
              {item.DistiCN_Date ?? '-'}
            </AppText>
          </View>
          <View className="w-1/3 mb-1 pr-2">
            <AppText
              size="xs"
              className="text-gray-500 dark:text-gray-400"
              weight="medium">
              Status
            </AppText>
            <AppText
              size="xs"
              weight="bold"
              numberOfLines={1}
              className={twMerge(statusColor)}>
              {item.ClaimStatus}
            </AppText>
          </View>
        </View>
      </TouchableOpacity>
    );
  });

  const ParentCard: React.FC<{item: ClaimCaseItem}> = memo(({item}) => {
    const children = classification.childrenGrouped[item.caseId] || [];

    const {processed, underProcess} = useMemo(() => {
      return children.reduce<{processed: number; underProcess: number}>(
        (acc, ch) => {
          if (ch.ClaimStatus === PROCESSED_CLAIM_STATUS) acc.processed += 1;
          else acc.underProcess += 1;
          return acc;
        },
        {processed: 0, underProcess: 0},
      );
    }, [children]);

    const [copied, setCopied] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleCopy = useCallback(() => {
      try {
        RNCB.setString(item.caseId);
        setCopied(true);
        showToast('Case ID copied');

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setCopied(false), 1500);
      } catch {
        showToast('Clipboard not available');
      }
    }, [item.caseId]);

    useEffect(() => {
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }, []);

    const Header = (
      <View className="w-[96%]">
        <AppText
          size="md"
          weight="bold"
          className="mb-2 text-heading dark:text-heading-dark"
          numberOfLines={3}>
          {item.claimcode}
        </AppText>

        <TouchableOpacity
          onPress={handleCopy}
          activeOpacity={0.7}
          className="flex-row items-center mb-2 w-1/3">
          <AppText
            size="xs"
            weight="medium"
            className="text-gray-500 dark:text-gray-400 mr-1">
            Case ID:
          </AppText>
          <AppText size="xs" weight="semibold" className="mr-1">
            {item.caseId}
          </AppText>
          <AppIcon
            name={copied ? 'check' : 'copy'}
            type="feather"
            size={14}
            color={copied ? '#16a34a' : '#64748b'}
          />
        </TouchableOpacity>

        <View className="flex-row flex-wrap mt-1">
          <MetaItem
            icon="trending-up"
            label="Total Amount"
            value={convertToASINUnits(item.total_amount, false, true)}
            valueClassName="text-primary"
          />
          <MetaItem
            icon="check-circle"
            label="Processed"
            value={processed}
            valueClassName="text-success"
          />
          <MetaItem
            icon="clock"
            label="Under Process"
            value={underProcess}
            valueClassName="text-warning"
          />
        </View>
      </View>
    );

    return (
      <Card className="rounded py-3 px-1">
        <Accordion
          header={Header}
          initialOpening={false}
          needBottomBorder={false}
          duration={200}>
          <View className="mt-1">
            {children.length ? (
              <FlatList
                scrollEnabled={false}
                data={children}
                keyExtractor={c => c.ApplicationNo}
                renderItem={({item: child, index}) => (
                  <ChildCard
                    item={child}
                    index={index}
                    last={index === children.length - 1}
                  />
                )}
                ItemSeparatorComponent={() => <View className="h-3" />}
              />
            ) : (
              <View className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800">
                <AppText
                  size="xs"
                  weight="medium"
                  className="text-gray-500 dark:text-gray-400">
                  No applications found.
                </AppText>
              </View>
            )}
          </View>
        </Accordion>
      </Card>
    );
  });

  const renderParent = useCallback(
    ({item}: {item: ClaimCaseItem}) => <ParentCard item={item} />,
    [classification],
  );

  return (
    <AppLayout title="Claim Information" needBack>
      {isError && (
        <View className="p-4">
          <AppText size="sm" weight="medium" className="text-error mb-2">
            Failed to load data.
          </AppText>
          <TouchableOpacity
            onPress={() => refetch()}
            className="px-3 py-2 bg-primary rounded-md self-start">
            <AppText size="xs" weight="semibold" className="text-white">
              Retry
            </AppText>
          </TouchableOpacity>
        </View>
      )}
      <View className="flex-row gap-3 px-3 mt-4">
        <AppDropdown
          label="Select Claim Code"
          data={claimCodeOptions}
          mode="dropdown"
          allowClear
          placeholder="Choose claim code"
          selectedValue={selectedClaimCode?.value || null}
          onSelect={item => setSelectedClaimCode(item)}
          onClear={() => setSelectedClaimCode(null)}
        />
      </View>
      <FlatList
        data={filteredCaseData}
        keyExtractor={(item: any, index) => item?.caseId || `sk-${index}`}
        ListHeaderComponent={<SummaryParamsSection />}
        ListEmptyComponent={isLoading ? <ClaimDataSkeleton /> : null}
        renderItem={renderParent}
        ItemSeparatorComponent={() => <View className="h-3" />}
        contentContainerClassName="pb-8 pt-2 px-2"
        showsVerticalScrollIndicator={false}
        initialNumToRender={15}
        maxToRenderPerBatch={20}
      />
    </AppLayout>
  );
}
