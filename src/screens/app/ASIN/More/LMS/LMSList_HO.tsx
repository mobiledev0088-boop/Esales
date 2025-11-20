import {View, FlatList, TouchableOpacity, RefreshControl} from 'react-native';
import {useCallback, useEffect, useMemo, useState} from 'react';
import AppLayout from '../../../../../components/layout/AppLayout';
import AppDropdown, { AppDropdownItem} from '../../../../../components/customs/AppDropdown';
import {getPastQuarters} from '../../../../../utils/commonFunctions';
import Card from '../../../../../components/Card';
import AppText from '../../../../../components/customs/AppText';
import AppIcon from '../../../../../components/customs/AppIcon';
import Accordion from '../../../../../components/Accordion';
import Skeleton from '../../../../../components/skeleton/skeleton';
import { useLoginStore } from '../../../../../stores/useLoginStore';
import { handleASINApiCall } from '../../../../../utils/handleApiCall';
import { useQuery } from '@tanstack/react-query';
import { screenWidth, screenHeight } from '../../../../../utils/constant';
import ActionSheet, { SheetManager, useSheetPayload } from 'react-native-actions-sheet';
import { AppColors } from '../../../../../config/theme';

type TotalType = {TotalAGPRequest: number; TotalQtyRequested: number};

type BranchDetail = {
  AWPCode: string;
  AWPName: string;
  BranchName: string;
  AGPRequestCnt: number;
  QtyRequestCnt: number;
};

type MergedBranch = {
  branch: string;
  totalAGP: number;
  totalQty: number;
  awps: BranchDetail[];
};

type BranchExplorerProps = {
  rawData: BranchDetail[];
  isLoading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  quarters: AppDropdownItem[];
  selectedQuarter: AppDropdownItem | null;
  onSelectQuarter: (item: AppDropdownItem | null) => void;
  error: unknown;
};

type AGPItem = {
  AGPCode: string;
  AGPName: string;
  RequestedModel: string;
  RequestedQuantity: number;
};

type BranchPayload = {
  awp: {
    AWPCode: string;
    AWPName: string;
    BranchName: string;
    AGPRequestCnt?: number;
    QtyRequestCnt?: number;
  } | null;
  yearQtr: string;
};

// API hooks
const useGetLMSDataList = (YearQTR: string) => {
  const {EMP_Code: Code = '', EMP_RoleId: RoleId = ''} = useLoginStore(
    state => state.userInfo,
  );

  return useQuery<BranchDetail[]>({
    queryKey: ['getLMSInfoList', Code, RoleId, YearQTR],
    queryFn: async () => {
      const response = await handleASINApiCall('/LMS/GetLMS_InfoList', {
        Code,
        RoleId,
        YearQTR,
      });
      const result = response?.DashboardData;
      if (!result?.Status) {
        throw new Error('Failed to fetch LMS list');
      }
      return (result.Datainfo?.BranchWiseDetails || []) as BranchDetail[];
    },
    enabled: !!Code && !!RoleId && !!YearQTR,
  });
};

const useGetLMSAGPList = (
  Code: string,
  YearQTR: string,
  enabled: boolean,
) => {
  return useQuery<AGPItem[]>({
    queryKey: ['getLMSAGPList', Code, YearQTR],
    queryFn: async () => {
      const response = await handleASINApiCall('/LMS/GetLMS_InfoListDetails', {
        Code,
        YearQTR,
      });
      const result = response?.DashboardData;
      if (!result?.Status) {
        throw new Error('Failed to fetch AGP list');
      }
      return (result.Datainfo?.AGPList || []) as AGPItem[];
    },
    enabled: enabled && !!Code && !!YearQTR,
  });
};

// Helper Function 
export const showLMSBranchDetailsSheet = (
  awp: BranchPayload['awp'],
  yearQtr: string,
) => {
  if (!awp) return;
  SheetManager.show('LMSBranchDetailsSheet', {
    payload: {awp, yearQtr},
  });
};

// Components
const SummarySection: React.FC<{
  total: TotalType[];
  branches: BranchDetail[];
}> = ({total, branches}) => {
  const stats = useMemo(() => {
    const totalAGP = total?.[0]?.TotalAGPRequest || 0;
    const totalQty = total?.[0]?.TotalQtyRequested || 0;
    return {totalAGP, totalQty};
  }, [total, branches]);

  return (
    <Card className="mb-3 p-0">
      <View className="pb-3 border-b border-slate-100 pt-4 px-3">
        <View className="flex-row items-center gap-2 justify-between">
          <View className="flex-row items-center gap-2">
            <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center">
              <AppIcon
                name="bar-chart-2"
                type="feather"
                size={16}
                color="#0066FF"
              />
            </View>
            <AppText size="base" weight="semibold" className="text-slate-800">
              AGP Overview
            </AppText>
          </View> 
        </View>
        <AppText size="xs" className="text-slate-400 mt-1">
          Aggregated request metrics
        </AppText>
      </View>
      {/* Metrics */}
      <View className="flex-row justify-around mt-4 px-3 pb-4">
        <View className="flex-1 items-center">
          <View className="w-12 h-12 rounded-xl bg-violet-500 items-center justify-center mb-2 shadow-sm">
            <AppIcon name="layers" type="feather" size={20} color="white" />
          </View>
          <AppText
            size="xs"
            weight="medium"
            numberOfLines={2}
            className="text-center leading-tight text-violet-600">
            Total AGP Requests
          </AppText>
          <AppText size="lg" weight="bold" className="mt-1 text-violet-600">
            {stats.totalAGP}
          </AppText>
        </View>
        <View className="w-px bg-slate-100 mx-3" />
        <View className="flex-1 items-center">
          <View className="w-12 h-12 rounded-xl bg-teal-500 items-center justify-center mb-2 shadow-sm">
            <AppIcon name="package" type="feather" size={20} color="white" />
          </View>
          <AppText
            size="xs"
            weight="medium"
            numberOfLines={2}
            className="text-center leading-tight text-teal-600">
            Total Qty Requested
          </AppText>
          <AppText size="lg" weight="bold" className="mt-1 text-teal-600">
            {stats.totalQty}
          </AppText>
        </View>
      </View>
    </Card>
  );
};

const BranchExplorer: React.FC<BranchExplorerProps> = ({
  rawData,
  isLoading,
  refreshing,
  onRefresh,
  quarters,
  selectedQuarter,
  onSelectQuarter,
  error,
}) => {

  const merged = useMemo<MergedBranch[]>(() => {
    const map = new Map<string, MergedBranch>();
    rawData.forEach(item => {
      const key = item.BranchName;
      if (!map.has(key)) {
        map.set(key, {branch: key, totalAGP: 0, totalQty: 0, awps: []});
      }
      const ref = map.get(key)!;
      ref.totalAGP += item.AGPRequestCnt;
      ref.totalQty += item.QtyRequestCnt;
      ref.awps.push(item);
    });
    const arr = Array.from(map.values());
    arr.sort((a, b) => a.branch.localeCompare(b.branch));
    return arr;
  }, [rawData]);

  const handleSelect = useCallback(
    (item: BranchDetail) => {
      showLMSBranchDetailsSheet(item, selectedQuarter?.value || '');
    },
    [selectedQuarter?.value],
  );

  const renderBranch = useCallback(
    ({item}: {item: MergedBranch}) => (
      <BranchCardUI item={item} onSelect={handleSelect} />
    ),
    [handleSelect],
  );

  // Total counts derived here for header summary
  const totalCount: TotalType[] = useMemo(() => {
    if (!rawData.length) {
      return [{TotalAGPRequest: 0, TotalQtyRequested: 0}];
    }
    const agg = rawData.reduce(
      (acc, cur) => {
        acc.TotalAGPRequest += cur.AGPRequestCnt || 0;
        acc.TotalQtyRequested += cur.QtyRequestCnt || 0;
        return acc;
      },
      {TotalAGPRequest: 0, TotalQtyRequested: 0},
    );
    return [agg];
  }, [rawData]);

  const branchCount = useMemo(() => rawData.reduce((set, cur) => set.add(cur.BranchName), new Set<string>()).size, [rawData]);

  const listHeader = (
    <View>
      <View className="w-36 self-end mb-5">
        <AppDropdown
          data={quarters}
          selectedValue={selectedQuarter?.value || null}
          onSelect={onSelectQuarter}
          mode="dropdown"
          placeholder="Select Quarter"
          style={{height: 36}}
        />
      </View>
      {!!error && (
        <Card className="p-4 mb-3 bg-red-50">
          <AppText size="sm" weight="semibold" className="text-red-600">
            {String((error as any)?.message || 'Failed to load data')}
          </AppText>
        </Card>
      )}
      <SummarySection total={totalCount} branches={rawData} />
      {/* Branches list header */}
      <View className="flex-row items-center justify-between mb-2 mt-2">
        <AppText size="base" weight="semibold" className="text-slate-800">
          Branches
        </AppText>
        <AppText size="xs" weight="medium" className="text-slate-500">
          {branchCount} total
        </AppText>
      </View>
    </View>
  );
  const loadingSkeleton = (
            <View className='px-3'>
          <View className="mb-5 self-end">
            <Skeleton width={120} height={35} />
          </View>
          <Skeleton width={screenWidth -24} height={150} />
          <View className='gap-4 mt-5'>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} width={screenWidth -24} height={80} />
          ))}
          </View>
        </View>
  )

  return (
    <View className="flex-1">
      {isLoading ? loadingSkeleton: (
        <FlatList
          data={merged}
          keyExtractor={i => i.branch}
          renderItem={renderBranch}
          ListHeaderComponent={listHeader}
          contentContainerStyle={{paddingBottom: 140, paddingHorizontal: 12}}
          ListEmptyComponent={
            <Card className="p-6 mt-6 items-center">
              <AppText weight="bold">No branches</AppText>
              <AppText size="sm" className="text-gray-500 mt-1">
                Adjust search or filters.
              </AppText>
            </Card>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0066FF" />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const BranchCardUI: React.FC<{
  item: MergedBranch;
  onSelect: (a: BranchDetail) => void;
}> = ({item, onSelect}) => {
  const header = (
    <View className="flex-1 flex-row items-start gap-2">
      <AppIcon
      name='map-marker-radius'
      type='material-community'
      size={20}
      color="#101010"
      style={{marginTop: 4}}
      />
      <View className="pr-3">
        <AppText weight="semibold" size="md" numberOfLines={1} className="tracking-tight">
          {item.branch.replace(/_/g, ' ')}
        </AppText>
        <AppText size="xs" className="text-slate-400 mt-0.5" numberOfLines={1}>
          {item.awps.length} AWP Partner{item.awps.length > 1 ? 's' : ''}
        </AppText>
      </View>
    </View>
  );

  return (
    <Accordion
      header={header}
      containerClassName="bg-white dark:bg-gray-900 rounded-lg px-4 py-3 mb-3 border border-slate-200 dark:border-slate-700 "
      headerClassName="px-0 "
      contentClassName="px-0"
      needBottomBorder={false}
      arrowSize={20}
    >
      {/* Table Header */}
      <View className="flex-row items-center py-2 px-2 bg-slate-50 dark:bg-slate-800 rounded mb-2 mt-3">
        <AppText size="xs" weight="medium" className="w-[60%] text-slate-500">AWP Name</AppText>
        <AppText size="xs" weight="medium" className="w-[15%]  text-slate-500">Qty</AppText>
        <AppText size="xs" weight="medium" className="w-[15%]  text-slate-500">AGP</AppText>
        <AppText size="xs" weight="medium" className="w-[10%]  text-slate-500">View</AppText>
      </View>
      {item.awps.map((a, idx) => (
        <View
          key={a.AWPCode}
          className={`flex-row items-center py-2 px-2 border-b border-slate-100 dark:border-slate-700 ${idx === item.awps.length - 1 ? 'last:border-b-0' : ''}`}
        >
          <View className="w-[60%] pr-3">
            <AppText size="sm" weight="medium">{a.AWPName}</AppText>
            <AppText size="xs" className="text-slate-400">{a.AWPCode}</AppText>
          </View>
          <View className="w-[30%] flex-row items-center">
            <View className="w-1/2 ">
              <AppText size="sm" weight="semibold" className='ml-1'>{a.QtyRequestCnt}</AppText>
            </View>
            <View className="w-1/2">
              <AppText size="sm" weight="semibold" className='ml-1'>{a.AGPRequestCnt}</AppText>
            </View>
          </View>
          <View className="w-[10%] items-end">
            <TouchableOpacity
              onPress={() => onSelect(a)}
              accessibilityLabel="View details"
              className="w-8 h-8 rounded-md bg-blue-50 dark:bg-blue-900/30 items-center justify-center">
              <AppIcon name="eye" type="feather" size={16} color="#1d4ed8" />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </Accordion>
  );
};

export const LMSBranchDetailsSheet: React.FC = () => {
  const payload = useSheetPayload('LMSBranchDetailsSheet') as BranchPayload | undefined;
  const awp = payload?.awp || null;
  const yearQtr = payload?.yearQtr || '';

  const [isSheetOpen, setIsSheetOpen] = useState(true);
  useEffect(() => {
    setIsSheetOpen(true);
    return () => setIsSheetOpen(false);
  }, []);

  const {data, isLoading, error} = useGetLMSAGPList(
    awp?.AWPCode || '',
    yearQtr,
    isSheetOpen && !!awp && !!yearQtr,
  );

  console.log('LMSBranchDetailsSheet data:', data);

  const [selectedModel, setSelectedModel] = useState<AppDropdownItem | null>(null);
  useEffect(() => {
    setSelectedModel(null);
  }, [awp?.AWPCode]);

  const modelItems = useMemo<AppDropdownItem[]>(() => {
    if (!data || data.length === 0) return [];
    const unique = Array.from(new Set(data.map(i => i.RequestedModel).filter(Boolean)));
    return unique.sort().map(m => ({label: m, value: m}));
  }, [data]);

  const filteredList = useMemo(() => {
    if (!data) return [];
    if (!selectedModel?.value) return data;
    return data.filter(i => i.RequestedModel === selectedModel.value);
  }, [data, selectedModel]);

  const renderItem = useCallback(
    ({item}: {item: AGPItem}) => (
      <Card className="mb-3 p-0">
        <View className="p-3">
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1 pr-3">
              <AppText size="base" weight="bold" numberOfLines={1} className="text-slate-800">
                {item.AGPName}
              </AppText>
              <AppText size="xs" weight="medium" numberOfLines={1} className="text-slate-400 mt-0.5">
                {item.AGPCode}
              </AppText>
            </View>
            <View className="items-end">
              <View className="px-2 py-1 rounded-md bg-primary/10">
                <AppText size="xs" weight="semibold" className="text-primary">
                  Qty: {item.RequestedQuantity}
                </AppText>
              </View>
            </View>
          </View>
          <View className="mt-1 flex-row items-center">
            <AppIcon name="cpu" type="feather" size={14} color="#64748B" />
            <AppText size="xs" weight="medium" className="text-slate-500 ml-2">
              Model:
            </AppText>
            <AppText size="xs" weight="semibold" className="text-slate-700 ml-1 flex-1" numberOfLines={1}>
              {item.RequestedModel || '—'}
            </AppText>
          </View>
        </View>
      </Card>
    ),
    [],
  );

  if (!awp) return null;

  return (
    <View>
      <ActionSheet
        id="LMSBranchDetailsSheet"
        useBottomSafeAreaPadding
        containerStyle={{
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          backgroundColor: '#ffffff',
          height: screenHeight * 0.75,
        }}>
        <View className="p-4 pb-3 border-b border-slate-200">
          <AppText size="xl" weight="bold" className="text-slate-800" numberOfLines={1}>
            {awp.AWPName}
          </AppText>
          <View className="flex-row flex-wrap gap-2 mt-2">
            <View className="bg-primary/10 px-2.5 py-1 rounded-md">
              <AppText size="xs" weight="semibold" className="text-primary">
                {awp.AWPCode}
              </AppText>
            </View>
            <View className="bg-slate-100 px-2.5 py-1 rounded-md">
              <AppText size="xs" weight="medium" className="text-slate-600" numberOfLines={1}>
                Branch: {awp.BranchName.replace(/_/g, ' ')}
              </AppText>
            </View>
            {!!awp.QtyRequestCnt && (
              <View className="bg-teal-50 px-2.5 py-1 rounded-md">
                <AppText size="xs" weight="medium" className="text-teal-600">
                  Qty Req: {awp.QtyRequestCnt}
                </AppText>
              </View>
            )}
            {!!awp.AGPRequestCnt && (
              <View className="bg-violet-50 px-2.5 py-1 rounded-md">
                <AppText size="xs" weight="medium" className="text-violet-600">
                  AGP Req: {awp.AGPRequestCnt}
                </AppText>
              </View>
            )}
          </View>
        </View>
        {!isLoading && data && data.length > 0 && (
          <View className="px-4 pt-3 pb-2">
            <AppText size="sm" weight="semibold" className="text-slate-700 mb-2">
              Select the Model
            </AppText>
            <AppDropdown
              data={modelItems}
              selectedValue={selectedModel?.value}
              mode="dropdown"
              placeholder="All Models"
              onSelect={setSelectedModel}
              allowClear
              onClear={() => setSelectedModel(null)}
            />
          </View>
        )}
        <View className="">
          {isLoading ? (
            <View className="py-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} width={screenWidth * 0.85} height={100} borderRadius={12} />
              ))}
            </View>
          ) : error ? (
            <View className="items-center justify-center py-10">
              <AppIcon name="alert-circle" type="feather" size={48} color={AppColors.error} />
              <AppText size="base" weight="semibold" className="text-slate-600 mt-3 text-center">
                {(error as any)?.message || 'Failed to load data'}
              </AppText>
            </View>
          ) : filteredList.length === 0 ? (
            <View className="items-center justify-center py-10">
              <AppIcon name="inbox" type="feather" size={48} color="#94A3B8" />
              <AppText size="base" weight="semibold" className="text-slate-600 mt-3">
                No AGP Entries
              </AppText>
              <AppText size="xs" className="text-slate-500 mt-1">
                {data && data.length > 0 ? 'Try selecting a different model' : 'No data available'}
              </AppText>
            </View>
          ) : (
            <FlatList
              data={filteredList}
              renderItem={renderItem}
              keyExtractor={(item, idx) => `${item.AGPCode}-${idx}`}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <View className="mb-2">
                  <AppText size="xs" className="text-slate-500">
                    Showing {filteredList.length} of {data?.length || 0} entries
                  </AppText>
                </View>
              }
              ListFooterComponent={<View className="h-64" />}
              contentContainerStyle={{paddingBottom: 140, paddingHorizontal:16}}
            />
          )}
        </View>
      </ActionSheet>
    </View>
  );
};

// Main Screen Component
export default function LMSList_HO() {
  const quarters = useMemo(() => getPastQuarters(), []);
  const [selectedQuarter, setSelectedQuarter] = useState<AppDropdownItem | null>(quarters[0] || null);
  const YearQTR = selectedQuarter?.value ?? '';
  const {data: branchData = [], isLoading, error, refetch, isFetching} = useGetLMSDataList(YearQTR);

  return (
    <AppLayout title="LMS List" needBack>
      <View className="flex-1 pt-5 pb-3">
        <BranchExplorer
          rawData={branchData}
          isLoading={isLoading}
          refreshing={isFetching && !isLoading}
          onRefresh={refetch}
          quarters={quarters}
          selectedQuarter={selectedQuarter}
          onSelectQuarter={item => setSelectedQuarter(item)}
          error={error}
        />
      </View>
    </AppLayout>
  );
};