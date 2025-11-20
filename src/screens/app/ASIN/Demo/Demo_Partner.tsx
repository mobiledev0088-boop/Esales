import FAB from '../../../../components/FAB';
import useQuarterHook from '../../../../hooks/useQuarterHook';
import AppDropdown, {
  AppDropdownItem,
} from '../../../../components/customs/AppDropdown';
import {
  View,
  FlatList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import Accordion from '../../../../components/Accordion';
import AppText from '../../../../components/customs/AppText';
import AppIcon from '../../../../components/customs/AppIcon';
import {useNavigation} from '@react-navigation/native';
import {AppNavigationProp} from '../../../../types/navigation';
import {useQuery} from '@tanstack/react-query';
import {handleASINApiCall} from '../../../../utils/handleApiCall';
import {useLoginStore} from '../../../../stores/useLoginStore';
import {ASUS, screenHeight, screenWidth} from '../../../../utils/constant';
import {memo, useCallback, useMemo, useState} from 'react';
import ActionSheet, {
  SheetManager,
  useSheetPayload,
} from 'react-native-actions-sheet';
import moment from 'moment';
import Skeleton from '../../../../components/skeleton/skeleton';
import useEmpStore from '../../../../stores/useEmpStore';

// ===== Types & Interfaces ==========
interface PartnerDemoData {
  YearQtr: string;
  AGP_Code: string;
  AGP_Name: string | null;
  ALPType: string | null;
  Category: string | null;
  Series: string | null;
  DemoUnitModel: string | null;
  Serial_No: string | null;
  Invoice_Date: string | null;
  DemoExecutionDone: string | null;
  IsCompulsory: string | null;
  IsPenaltyCompulsary: string | null;
  IsBonusCompulsory: string | null;
  HubID: string | null;
  LastRegisteredDate: string | null;
  LastUnRegisteredDate: string | null;
  DurationDays: number | null;
}

interface PartnerDemoSummary {
  categories: AppDropdownItem[];
  demoStatuses: AppDropdownItem[];
  groupedData: Record<string, PartnerDemoData[]>;
}

interface StatMetricProps {
  iconName: string;
  iconColor: string;
  bgClass: string;
  label: string;
  value: number;
  valueColorClass: string;
}

interface InfoPairProps {
  label: string;
  value: string | null | undefined;
  containerClassName?: string;
  labelClassName?: string;
  valueClassName?: string;
}

interface DemoHubType {
  Demo_Hub_Date: string;
  Hours: string;
}

// ===== Constants =====================
const getStatusColors = (status: string | null) => {
  const base = {container: 'bg-slate-200', text: 'text-slate-700'};
  if (!status) return base;
  const normalized = status.trim().toLowerCase();
  if (/(^|\b)pending(s)?\b/.test(normalized)) {
    return {container: 'bg-amber-100', text: 'text-amber-700'}; // Pending => Yellow
  }
  if (/(^|\b)(done|complete|completed)\b/.test(normalized)) {
    return {container: 'bg-emerald-100', text: 'text-emerald-700'}; // Done/Complete => Green
  }
  if (/(progress|running)/.test(normalized)) {
    return {container: 'bg-blue-100', text: 'text-blue-700'};
  }
  if (/(failed|fail|cancel|canceled|cancelled|error)/.test(normalized)) {
    return {container: 'bg-rose-100', text: 'text-rose-700'};
  }
  return base;
};

// ===== Utility Functions ========
const formatDate = (value: string | null) => {
  if (!value) return '—';
  return moment(value).isValid() ? moment(value).format('YYYY-MM-DD') : value;
};
// ===== API Hooks  ========

const useGetSubCode = (hasSubCode:boolean) => {
    const { EMP_Code:employeeCode='' } = useLoginStore(state => state.userInfo);
    return useQuery({
        queryKey: ['subCodes',employeeCode],
        queryFn: async () => {
            const response = await handleASINApiCall(
                '/DemoForm/GetChildCodes',
                {employeeCode}
            );
            const result = response?.demoFormData;
            if (!result?.Status) {
                throw new Error('Failed to fetch sub codes');
            }
            return result?.Datainfo?.Subcode_List;
        },
        enabled: hasSubCode,
        select : () => {

        }
    })
}
const useGetPartnerDemoData = (YearQtr: string, hasChildCode: boolean, childrenCode?: string) => {
  const {EMP_Code } = useLoginStore(state => state.userInfo);
  const employeeCode = childrenCode || EMP_Code || '';
  //   the employeeCode should be Parent Other wise no data will be fetched
  const enabled = Boolean(employeeCode && YearQtr) && !hasChildCode;
  return useQuery({
    queryKey: ['partnerDemoData', employeeCode, YearQtr],
    enabled,
    queryFn: async () => {
      const response = await handleASINApiCall(
        '/DemoForm/GetPartnerDemoSummary',
        {employeeCode, YearQtr},
      );
      const result = response?.demoFormData;
      if (!result?.Status) {
        throw new Error('Failed to fetch activation data');
      }
      const table = result?.Datainfo?.Table;
      return table;
    },
    select: (data: PartnerDemoData[]): PartnerDemoSummary => {
      const categorySet = new Set<string>();
      const statusSet = new Set<string>();
      const groupedData: Record<string, PartnerDemoData[]> = {};
      data.forEach(item => {
        if (item.Category) categorySet.add(item.Category);
        if (item.DemoExecutionDone) statusSet.add(item.DemoExecutionDone);
        const key = item.AGP_Name || item.AGP_Code || 'UNKNOWN';
        if (!groupedData[key]) groupedData[key] = [];
        groupedData[key].push(item);
      });
      const categories = Array.from(categorySet)
        .sort()
        .map(v => ({label: v, value: v}));
      const demoStatuses = Array.from(statusSet)
        .sort()
        .map(v => ({label: v, value: v}));
      return {categories, demoStatuses, groupedData};
    },
  });
};

const useGetDemoHubDetails = (Serial_No: string, YearQtr: string) => {
  return useQuery({
    queryKey: ['demoHubDetails', Serial_No, YearQtr],
    queryFn: async () => {
      const response = await handleASINApiCall(
        '/DemoForm/GetPartnerDemoSummaryHubInfo',
        {Serial_No, YearQtr},
      );
      const result = response?.demoFormData;
      if (!result?.Status) {
        throw new Error('Failed to fetch demo hub data');
      }
      const table = result?.Datainfo?.HubInfo;
      return (table || []) as DemoHubType[];
    },
    enabled: Boolean(Serial_No && YearQtr),
  });
};

// ===== Logic Hook ========
const usePartnerDemoLogic = (childrenCode?: string) => {
  const navigation = useNavigation<AppNavigationProp>();
  const empInfo = useEmpStore(state => state.empInfo);
  const IsAWP = empInfo?.EMP_Type === ASUS.PARTNER_TYPE.T2.AWP;
  const {quarters, selectedQuarter, setSelectedQuarter} = useQuarterHook();

  // Remote data
  const {
    data: demoData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useGetPartnerDemoData(selectedQuarter?.value || '', !!(empInfo?.IsParentCode), childrenCode);

  // Local filter state
  const [selectedCategory, setSelectedCategory] = useState<AppDropdownItem | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<AppDropdownItem | null>(null);
  const [selectedAgp, setSelectedAgp] = useState<AppDropdownItem | null>(null);

  // Accordion open group tracking
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  // Derived options
  const agpOptions = useMemo(() => {
    if (!demoData?.groupedData) return [] as AppDropdownItem[];
    return Object.keys(demoData.groupedData)
      .sort()
      .map(k => ({label: k, value: k}));
  }, [demoData]);

  // Filter and group data
  const sections = useMemo(() => {
    if (!demoData?.groupedData)
      return [] as {key: string; items: PartnerDemoData[]; count: number}[];
    return Object.entries(demoData.groupedData).reduce(
      (acc, [key, items]) => {
        if (selectedAgp && selectedAgp.value !== key) return acc;
        const filteredItems = items.filter(it => {
          if (selectedCategory && it.Category !== selectedCategory.value)
            return false;
          if (selectedStatus && it.DemoExecutionDone !== selectedStatus.value)
            return false;
          return true;
        });
        if (filteredItems.length)
          acc.push({key, items: filteredItems, count: filteredItems.length});
        return acc;
      },
      [] as {key: string; items: PartnerDemoData[]; count: number}[],
    );
  }, [demoData, selectedCategory, selectedStatus, selectedAgp]);

  const totalItems = useMemo(
    () => sections.reduce((sum, s) => sum + s.count, 0),
    [sections],
  );

  const toggleGroup = useCallback((key: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const handleNavigate = useCallback(
    () => navigation.push('UploadDemoData'),
    [navigation],
  );

  return {
    // Remote
    demoData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
    // Filters
    quarters,
    selectedQuarter,
    setSelectedQuarter,
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
    selectedAgp,
    setSelectedAgp,
    agpOptions,
    // Grouped data
    sections,
    totalItems,
    // Accordion
    openGroups,
    toggleGroup,
    // Misc
    IsAWP,
    IsParent: !!empInfo?.IsParentCode,
    handleNavigate,
  };
};

// ===== UI Components ========
const StatMetric: React.FC<StatMetricProps> = memo(
  ({iconName, iconColor, bgClass, label, value, valueColorClass}) => {
    const baseLabelColor = valueColorClass.replace('700', '600');
    return (
      <View className="flex-1 items-center">
        <View
          className={`w-14 h-14 rounded-full ${bgClass} items-center justify-center mb-2`}>
          <AppIcon type="feather" name={iconName} size={26} color={iconColor} />
        </View>
        <AppText
          size="sm"
          weight="medium"
          className={`${baseLabelColor} mb-1 text-center`}>
          {label}
        </AppText>
        <AppText
          size="2xl"
          weight="semibold"
          className={`${valueColorClass} text-center`}
          numberOfLines={1}>
          {value}
        </AppText>
      </View>
    );
  },
);

const InfoPair: React.FC<InfoPairProps> = memo(
  ({
    label,
    value,
    containerClassName = '',
    labelClassName = '',
    valueClassName = '',
  }) => {
    return (
      <View className={containerClassName}>
        <AppText
          size="xs"
          weight="medium"
          className={`text-slate-500 mb-1 ${labelClassName}`}>
          {label}
        </AppText>
        <AppText
          size="sm"
          weight="semibold"
          className={`text-slate-900 ${valueClassName}`}>
          {value || '-'}
        </AppText>
      </View>
    );
  },
);

const DemoItem: React.FC<{row: PartnerDemoData}> = memo(({row}) => {
  const statusColors = getStatusColors(row.DemoExecutionDone);
  const normalizedStatus = row.DemoExecutionDone?.trim().toLowerCase() || '';
  const isDoneStatus = /(done)/.test(normalizedStatus);
  const handleSeeMore = useCallback(() => {
    SheetManager.show('PartnerDemoDetailsSheet', {payload: {demo: row}});
  }, [row]);
  return (
    <View className="px-4 py-3 border-t border-slate-100 bg-white">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-1 pr-3">
          <AppText
            size="base"
            weight="semibold"
            className="text-slate-900"
            numberOfLines={1}>
            {row.DemoUnitModel || '-'}
          </AppText>
        </View>
        <View
          className={`px-2 py-[2px] rounded-full ${statusColors.container}`}>
          <AppText
            size="sm"
            weight="medium"
            className={statusColors.text}
            numberOfLines={1}>
            {row.DemoExecutionDone || 'Status N/A'}
          </AppText>
        </View>
      </View>
      <View className="flex-row flex-wrap mb-1">
        <InfoPair
          label="Category"
          value={row.Category}
          containerClassName="w-1/2 pr-2 mb-2"
        />
        <InfoPair
          label="Series"
          value={row.Series}
          containerClassName="w-1/2 pl-2 mb-2"
        />
      </View>
      {isDoneStatus && (
        <View className="flex-row flex-wrap mt-1">
          <InfoPair
            label="Hub ID"
            value={row.HubID}
            containerClassName="w-1/2 pr-2 mt-1"
          />
          <InfoPair
            label="Duration Days"
            value={row.DurationDays !== null ? String(row.DurationDays) : null}
            containerClassName="w-1/2 pl-2 mt-1"
          />
          <InfoPair
            label="Last Registered"
            value={formatDate(row.LastRegisteredDate)}
            containerClassName="w-1/2 pr-2 mt-2"
          />
          <InfoPair
            label="Serial No"
            value={row.Serial_No}
            containerClassName="w-1/2 pl-2 mt-2"
          />
          <TouchableOpacity
            onPress={handleSeeMore}
            activeOpacity={0.7}
            className="mt-3 ml-1 w-full items-end">
            <AppText
              size="sm"
              weight="semibold"
              color="primary"
              className=" underline mr-2">
              See More Demo Details
            </AppText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

export const PartnerDemoDetailsSheet: React.FC = () => {
  const payload = useSheetPayload('PartnerDemoDetailsSheet');
  const {demo} = payload || ({} as {demo?: PartnerDemoData});

  // Fetch Demo Hub Details
  const {
    data: hubData,
    isLoading: isLoadingHub,
    isError: isErrorHub,
  } = useGetDemoHubDetails(demo?.Serial_No || '', demo?.YearQtr || '');

  if (!demo) return null;
  const isPending = /(pending)/i.test(demo.DemoExecutionDone || '');

  return (
    <View>
      <ActionSheet
        id="PartnerDemoDetailsSheet"
        useBottomSafeAreaPadding
        containerStyle={{
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          backgroundColor: '#ffffff',
          height: screenHeight * 0.8,
        }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{padding: 16, paddingBottom: 48}}>
          {/* Header Section */}
          <View className="mb-4">
            <AppText
              size="lg"
              weight="bold"
              className="text-slate-800 mb-1"
              numberOfLines={1}>
              {demo.DemoUnitModel || 'Demo Unit'}
            </AppText>
            <View className="flex-row flex-wrap gap-2 mt-1">
              <View
                className={`px-2.5 py-1 rounded-md ${isPending ? 'bg-amber-500/10' : 'bg-emerald-500/10'}`}>
                <AppText
                  size="xs"
                  weight="semibold"
                  className={isPending ? 'text-amber-600' : 'text-emerald-600'}>
                  {demo.DemoExecutionDone || 'Status N/A'}
                </AppText>
              </View>
              {demo.Category && (
                <View className="bg-slate-100 px-2.5 py-1 rounded-md">
                  <AppText
                    size="xs"
                    weight="medium"
                    className="text-slate-600"
                    numberOfLines={1}>
                    {demo.Category}
                  </AppText>
                </View>
              )}
            </View>
          </View>

          {/* Demo Details Section */}
          <View className="flex-row flex-wrap -mx-2 mb-4">
            {[
              {label: 'Series', value: demo.Series},
              {label: 'Model', value: demo.DemoUnitModel},
              {label: 'Serial No', value: demo.Serial_No},
              {label: 'Invoice Date', value: formatDate(demo.Invoice_Date)},
              {label: 'Duration (Days)', value: demo.DurationDays?.toString()},
              {label: 'Year Qtr', value: demo.YearQtr},
              {label: 'Hub ID', value: demo.HubID},
              {
                label: 'Last Registered',
                value: formatDate(demo.LastRegisteredDate),
              },
              {
                label: 'Last Unregistered',
                value: formatDate(demo.LastUnRegisteredDate),
              },
            ].map((f, idx) => (
              <View key={idx} className="w-1/2 px-2 mb-4">
                <AppText size="xs" weight="medium" className="text-slate-500">
                  {f.label}
                </AppText>
                <AppText
                  size="xs"
                  weight="semibold"
                  className="text-slate-700"
                  numberOfLines={1}>
                  {f.value || '—'}
                </AppText>
              </View>
            ))}
          </View>

          {/* Divider */}
          <View className="h-px bg-slate-200 my-4" />

          {/* Demo Hub Details Section */}
          <View className="mb-3">
            <View className="flex-row items-center mb-3">
              <AppIcon type="feather" name="clock" size={18} color="#64748b" />
              <AppText
                size="md"
                weight="semibold"
                className="text-slate-800 ml-2">
                Demo Hub Activity
              </AppText>
            </View>

            {/* Loading State */}
            {isLoadingHub && (
              <View className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <View key={i} className="bg-slate-50 rounded-xl p-4 mb-3">
                    <View className="mb-2">
                      <Skeleton height={16} width={120} />
                    </View>
                    <Skeleton height={14} width={80} />
                  </View>
                ))}
              </View>
            )}

            {/* Error State */}
            {!isLoadingHub && isErrorHub && (
              <View className="bg-rose-50 rounded-xl p-4 items-center">
                <AppIcon
                  type="feather"
                  name="alert-circle"
                  size={20}
                  color="#dc2626"
                />
                <AppText
                  size="xs"
                  weight="medium"
                  className="text-rose-600 mt-2">
                  Failed to load hub details
                </AppText>
              </View>
            )}

            {/* Empty State */}
            {!isLoadingHub &&
              !isErrorHub &&
              (!hubData || hubData.length === 0) && (
                <View className="bg-slate-50 rounded-xl p-6 items-center">
                  <AppIcon
                    type="feather"
                    name="inbox"
                    size={24}
                    color="#94a3b8"
                  />
                  <AppText
                    size="xs"
                    weight="medium"
                    className="text-slate-500 mt-2">
                    No hub activity recorded
                  </AppText>
                </View>
              )}

            {/* Data State */}
            {!isLoadingHub && !isErrorHub && hubData && hubData.length > 0 && (
              <View className="gap-y-5">
                {hubData.map((hub, index) => (
                  <View
                    key={index}
                    className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center flex-1">
                        <View className="bg-blue-100 rounded-full p-2 mr-3">
                          <AppIcon
                            type="feather"
                            name="calendar"
                            size={16}
                            color="#3b82f6"
                          />
                        </View>
                        <View className="flex-1">
                          <AppText
                            size="xs"
                            weight="medium"
                            className="text-slate-500 mb-0.5">
                            Hub Date
                          </AppText>
                          <AppText
                            size="sm"
                            weight="semibold"
                            className="text-slate-800"
                            numberOfLines={1}>
                            {formatDate(hub.Demo_Hub_Date)}
                          </AppText>
                        </View>
                      </View>
                      <View className="ml-3">
                        <View className="bg-indigo-100 px-3 py-1.5 rounded-full">
                          <View className="flex-row items-center">
                            <AppIcon
                              type="feather"
                              name="clock"
                              size={12}
                              color="#4f46e5"
                            />
                            <AppText
                              size="xs"
                              weight="bold"
                              className="text-indigo-700 ml-1">
                              {hub.Hours || '0'} hrs
                            </AppText>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Footer Note */}
          <View className="mt-4">
            <AppText size="xs" className="text-slate-400 text-center">
              Detailed execution metadata for this demo unit.
            </AppText>
          </View>
        </ScrollView>
      </ActionSheet>
    </View>
  );
};

const FiltersSummaryHeader: React.FC<{
  logic: ReturnType<typeof usePartnerDemoLogic>;
}> = memo(({logic}) => {
  const {
    demoData,
    quarters,
    selectedQuarter,
    setSelectedQuarter,
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
    selectedAgp,
    setSelectedAgp,
    agpOptions,
    sections,
    totalItems,
  } = logic;
  return (
    <View className="mb-5">
      <View className="flex-row mb-4">
        <View className="pr-2" style={{flex: 0.65}}>
          <AppDropdown
            mode="dropdown"
            data={demoData?.categories || []}
            selectedValue={selectedCategory?.value}
            onSelect={setSelectedCategory}
            placeholder="Category"
            zIndex={3000}
            allowClear
            onClear={() => setSelectedCategory(null)}
          />
        </View>
        <View className="pl-2" style={{flex: 0.35}}>
          <AppDropdown
            mode="dropdown"
            data={quarters}
            selectedValue={selectedQuarter?.value}
            onSelect={setSelectedQuarter}
            placeholder="Quarter"
            zIndex={2900}
          />
        </View>
      </View>
      <View className="flex-row mb-4">
        <View className="pr-2" style={{flex: 0.65}}>
          <AppDropdown
            mode="autocomplete"
            data={agpOptions}
            selectedValue={selectedAgp?.value}
            onSelect={setSelectedAgp}
            placeholder="AGP Name"
            searchPlaceholder="Search AGP..."
            zIndex={2800}
            allowClear
            onClear={() => setSelectedAgp(null)}
          />
        </View>
        <View className="pl-2" style={{flex: 0.35}}>
          <AppDropdown
            mode="dropdown"
            data={demoData?.demoStatuses || []}
            selectedValue={selectedStatus?.value}
            onSelect={setSelectedStatus}
            placeholder="Status"
            zIndex={2700}
            allowClear
            onClear={() => setSelectedStatus(null)}
          />
        </View>
      </View>
      <View className="p-5 rounded-2xl bg-white border border-slate-200">
        <AppText size="md" weight="semibold" className="text-slate-800 mb-4">
          Summary
        </AppText>
        <View className="flex-row items-center gap-x-8">
          <StatMetric
            iconName="users"
            iconColor="#059669"
            bgClass="bg-emerald-100"
            label="Total AGP"
            value={sections.length}
            valueColorClass="text-emerald-700"
          />
          <View className="w-px self-stretch bg-slate-200" />
          <StatMetric
            iconName="layers"
            iconColor="#4338ca"
            bgClass="bg-indigo-100"
            label="Total Demo Items"
            value={totalItems}
            valueColorClass="text-indigo-700"
          />
        </View>
      </View>
      <AppText
        size="md"
        weight="semibold"
        className="text-slate-700 mt-4 mb-2 px-1">
        AGP Demo
      </AppText>
    </View>
  );
});

const GroupAccordion: React.FC<{
  item: {key: string; items: PartnerDemoData[]; count: number};
  isOpen: boolean;
  onToggle: () => void;
}> = memo(({item, isOpen, onToggle}) => {
  return (
    <Accordion
      header={
        <View className="flex-1 py-1">
          <AppText
            size="md"
            weight="semibold"
            className="text-slate-800"
            numberOfLines={1}>
            {item.key}
          </AppText>
          <AppText
            size="sm"
            weight="medium"
            className="mt-1 text-slate-600"
            numberOfLines={1}>
            Demo Items: {item.count}
          </AppText>
        </View>
      }
      isOpen={isOpen}
      onToggle={onToggle}
      containerClassName="bg-white rounded-xl mb-4"
      headerClassName="py-3 px-4"
      contentClassName="px-0"
      needBottomBorder={false}
      needShadow
      arrowSize={22}>
      {isOpen && (
        <FlatList
          data={item.items}
          keyExtractor={(d, idx) =>
            (d.Serial_No ||
              d.DemoUnitModel ||
              d.Invoice_Date ||
              idx.toString()) +
            '_' +
            idx
          }
          renderItem={({item: row}) => <DemoItem row={row} />}
          initialNumToRender={10}
          maxToRenderPerBatch={20}
          windowSize={7}
          removeClippedSubviews
          showsVerticalScrollIndicator={false}
        />
      )}
    </Accordion>
  );
});

const LoaderView = memo(() => (
  <View className="flex-1">
    <View className="flex-row flex-wrap gap-4">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} height={40} width={screenWidth * 0.45} />
      ))}
    </View>
    <Skeleton height={200} width={screenWidth - 24} />
    <View className="h-5" />
    {[...Array(5)].map((_, i) => (
      <Skeleton key={i} height={100} width={screenWidth - 24} />
    ))}
  </View>
));

const ErrorView: React.FC<{message?: string; onRetry?: () => void}> = memo(
  ({message, onRetry}) => (
    <View className="flex-1 items-center justify-center px-6">
      <AppText size="sm" weight="semibold" className="text-rose-600 mb-2">
        {message || 'Something went wrong'}
      </AppText>
      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          activeOpacity={0.75}
          className="px-4 py-2 bg-rose-600 rounded-full">
          <AppText size="sm" weight="semibold" className="text-white">
            Retry
          </AppText>
        </TouchableOpacity>
      )}
    </View>
  ),
);

const EmptyView = memo(() => (
  <View className="flex-1 items-center justify-center">
    <AppText size="sm" weight="regular" className="text-slate-500">
      No demo data found
    </AppText>
  </View>
));

// ================= Main Component =======================
export default function Demo_Partner() {
  const empInfo = useEmpStore(state => state.empInfo);
  const {data: subCodes, isLoading: isLoadingChildren} = useGetSubCode(!!(empInfo?.IsParentCode)) 
  const [selectedChildren, setSelectedChildren] = useState<AppDropdownItem | null>(null);
  const logic = usePartnerDemoLogic(selectedChildren?.value);
  const {
    IsAWP,
    handleNavigate,
    isLoading,
    sections,
    openGroups,
    toggleGroup,
    isError,
    error,
    refetch,
    isRefetching,
  } = logic;

  const renderGroup = useCallback(
    ({
      item,
    }: {
      item: {key: string; items: PartnerDemoData[]; count: number};
    }) => {
      return (
        <GroupAccordion
          item={item}
          isOpen={openGroups.has(item.key)}
          onToggle={() => toggleGroup(item.key)}
        />
      );
    },
    [openGroups, toggleGroup],
  );
  const groupKeyExtractor = useCallback((i: {key: string}) => i.key, []);

  return (
    <View className="flex-1 bg-lightBg-base px-3 pt-5">
      <View className="flex-1">
        {isLoading && <LoaderView />}
        {!isLoading && isError && (
          <ErrorView message={(error as any)?.message} onRetry={refetch} />
        )}
        {!isLoading && !isError && !sections.length && <EmptyView />}
        {!isLoading && !isError && sections.length > 0 && (
          <FlatList
            data={sections}
            keyExtractor={groupKeyExtractor}
            renderItem={renderGroup}
            ListHeaderComponent={<FiltersSummaryHeader logic={logic} />}
            initialNumToRender={8}
            maxToRenderPerBatch={12}
            windowSize={10}
            removeClippedSubviews
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{paddingBottom: 90}}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
            }
          />
        )}
      </View>
      {!IsAWP && <FAB onPress={handleNavigate} />}
      <PartnerDemoDetailsSheet />
    </View>
  );
}
