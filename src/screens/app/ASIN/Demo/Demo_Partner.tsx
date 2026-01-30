import {FlatList, TouchableOpacity, View} from 'react-native';
import React, {memo, useCallback, useMemo, useState} from 'react';
import {DataStateView} from '../../../../components/DataStateView';
import {useLoginStore} from '../../../../stores/useLoginStore';
import {useQuery} from '@tanstack/react-query';
import {handleASINApiCall} from '../../../../utils/handleApiCall';
import useQuarterHook from '../../../../hooks/useQuarterHook';
import {useUserStore} from '../../../../stores/useUserStore';
import Skeleton from '../../../../components/skeleton/skeleton';
import {screenWidth} from '../../../../utils/constant';
import {SheetManager} from 'react-native-actions-sheet';
import {RefreshControl} from 'react-native-gesture-handler';
import FAB from '../../../../components/FAB';
import {useNavigation} from '@react-navigation/native';
import {AppNavigationProp} from '../../../../types/navigation';
import AppText from '../../../../components/customs/AppText';
import moment from 'moment';
import AppDropdown, {
  AppDropdownItem,
} from '../../../../components/customs/AppDropdown';
import AppIcon from '../../../../components/customs/AppIcon';
import {Watermark} from '../../../../components/Watermark';

interface PartnerDemoData {
  YearQtr: string;
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
interface InfoPairProps {
  label: string;
  value: string | null | undefined;
  containerClassName?: string;
  labelClassName?: string;
  valueClassName?: string;
}
interface StatMetricProps {
  iconName: string;
  iconColor: string;
  bgClass: string;
  label: string;
  value: number;
  valueColorClass: string;
}

const useGetPartnerDemoData = (
  YearQtr: string,
  hasChildCode: boolean,
  childrenCode?: string,
) => {
  const {EMP_Code, EMP_Type} = useLoginStore(state => state.userInfo);
  const employeeCode = childrenCode || EMP_Code || '';

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
      const table = result?.Datainfo?.Table as PartnerDemoData[];
      return table;
    },
  });
};

const getStatusColors = (status: string | null) => {
  const base = {
    container: 'bg-slate-200 dark:bg-slate-700',
    text: 'text-slate-700 dark:text-slate-300',
    iconColor: '#6b7280',
    iconName: 'info',
  };
  if (!status) return base;
  const normalized = status.trim().toLowerCase();
  if (/(^|\b)pending(s)?\b/.test(normalized)) {
    return {
      container: 'bg-yellow-100 dark:bg-yellow-900',
      text: 'text-yellow-700 dark:text-yellow-300',
      iconColor: '#f59e0b',
      iconName: 'clock',
    };
  }
  if (/(^|\b)(done|complete|completed)\b/.test(normalized)) {
    return {
      container: 'bg-emerald-100 dark:bg-emerald-900',
      text: 'text-emerald-700 dark:text-emerald-300',
      iconColor: '#16a34a',
      iconName: 'check-circle',
    };
  }
  if (/(progress|running)/.test(normalized)) {
    return {
      container: 'bg-blue-100 dark:bg-blue-900',
      text: 'text-blue-700 dark:text-blue-300',
      iconColor: '#3b82f6',
      iconName: 'loader',
    };
  }
  if (/(failed|fail|cancel|canceled|cancelled|error)/.test(normalized)) {
    return {
      container: 'bg-rose-100 dark:bg-rose-900',
      text: 'text-rose-700 dark:text-rose-300',
      iconColor: '#dc2626',
      iconName: 'x-circle',
    };
  }
  return base;
};

const LoaderView = memo(() => (
  <View className="flex-1 bg-lightBg-base dark:bg-darkBg-base px-3">
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

const formatDate = (value: string | null) => {
  if (!value) return '—';
  return moment(value).isValid() ? moment(value).format('YYYY-MM-DD') : value;
};

const usePartnerDemoLogic = (childrenCode?: string) => {
  const empInfo = useUserStore(state => state.empInfo);
  const {quarters, selectedQuarter, setSelectedQuarter} = useQuarterHook();

  // Remote data
  const {
    data: demoData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useGetPartnerDemoData(
    selectedQuarter?.value || '',
    !!empInfo?.IsParentCode,
    childrenCode,
  );

  // Local filter state
  const [selectedCategory, setSelectedCategory] =
    useState<AppDropdownItem | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<AppDropdownItem | null>(
    null,
  );
  const [selectedUnitModel, setSelectedUnitModel] =
    useState<AppDropdownItem | null>(null);

  // Derived options
  const unitModelOptions = useMemo(() => {
    if (!demoData) return [] as AppDropdownItem[];
    const models = new Set<string>();
    demoData.forEach(demo => {
      if (demo.DemoUnitModel) models.add(demo.DemoUnitModel);
    });
    return Array.from(models).map(m => ({label: m, value: m}));
  }, [demoData]);

  const statusOptions = useMemo(() => {
    if (!demoData) return [] as AppDropdownItem[];
    const statuses = new Set<string>();
    demoData.forEach(demo => {
      if (demo.DemoExecutionDone) statuses.add(demo.DemoExecutionDone);
    });
    return Array.from(statuses).map(s => ({label: s, value: s}));
  }, [demoData]);

  const categoryOptions = useMemo(() => {
    if (!demoData) return [] as AppDropdownItem[];
    const categories = new Set<string>();
    demoData.forEach(demo => {
      if (demo.Category) categories.add(demo.Category);
    });
    return Array.from(categories).map(c => ({label: c, value: c}));
  }, [demoData]);

  // Filter and group data
  const sections = useMemo(() => {
    if (!demoData) return [];
    let filtered = demoData;
    if (selectedCategory) {
      filtered = filtered.filter(d => d.Category === selectedCategory.value);
    }
    if (selectedStatus) {
      filtered = filtered.filter(
        d => d.DemoExecutionDone === selectedStatus.value,
      );
    }
    if (selectedUnitModel) {
      filtered = filtered.filter(
        d => d.DemoUnitModel === selectedUnitModel.value,
      );
    }
    return filtered;
  }, [demoData, selectedCategory, selectedStatus, selectedUnitModel]);

  const totalItems = demoData?.length || 0;

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
    selectedUnitModel,
    setSelectedUnitModel,

    unitModelOptions,
    statusOptions,
    categoryOptions,
    // Grouped data
    sections,
    totalItems,
    IsParent: !!empInfo?.IsParentCode,
  };
};

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

const DemoItem: React.FC<{row: PartnerDemoData}> = memo(({row}) => {
  const statusColors = getStatusColors(row.DemoExecutionDone);
  const normalizedStatus = row.DemoExecutionDone?.trim().toLowerCase() || '';
  const isDoneStatus = /(done)/.test(normalizedStatus);
  const handleSeeMore = useCallback(() => {
    SheetManager.show('PartnerDemoDetailsSheet', {payload: {demo: row}});
  }, [row]);

  return (
    <View className="px-4 py-3 border border-slate-200 dark:border-slate-700 bg-lightBg-surface dark:bg-darkBg-surface rounded-lg">
      <Watermark />
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
              className="underline mr-2 text-primary dark:text-white">
              See More Demo Details
            </AppText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

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
    selectedUnitModel,
    setSelectedUnitModel,
    unitModelOptions,
    categoryOptions,
    statusOptions,
    sections,
    totalItems,
  } = logic;

  const getColors = useCallback((status: string | null) => {
    return getStatusColors(status);
  }, []);
  return (
    <View className="mb-5">
      <View className="flex-row mb-4">
        <View className="pr-2" style={{flex: 0.65}}>
          <AppDropdown
            mode="dropdown"
            data={categoryOptions}
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
            data={unitModelOptions}
            selectedValue={selectedUnitModel?.value}
            onSelect={setSelectedUnitModel}
            placeholder="Unit Model"
            searchPlaceholder="Search Unit Model..."
            zIndex={2800}
            allowClear
            onClear={() => setSelectedUnitModel(null)}
          />
        </View>
        <View className="pl-2" style={{flex: 0.35}}>
          <AppDropdown
            mode="dropdown"
            data={statusOptions}
            selectedValue={selectedStatus?.value}
            onSelect={setSelectedStatus}
            placeholder="Status"
            zIndex={2700}
            allowClear
            onClear={() => setSelectedStatus(null)}
          />
        </View>
      </View>
      <View className="p-5 rounded-2xl bg-lightBg-surface dark:bg-darkBg-surface border border-slate-200 dark:border-slate-700">
        <AppText size="md" weight="semibold" className="text-slate-800 mb-4">
          Summary
        </AppText>
        <View className="flex-row items-center gap-x-8">
          {statusOptions.map((status, idx) => {
            return (
              <View className="flex-row items-center flex-1" key={status.value}>
                <StatMetric
                  iconName={getColors(status.value).iconName}
                  iconColor={getColors(status.value).iconColor}
                  bgClass={`${getColors(status.value).container} `}
                  label={status.label}
                  value={
                    status.value && !!demoData
                      ? demoData?.filter(
                          s => s.DemoExecutionDone === status.value,
                        ).length
                      : 0
                  }
                  valueColorClass={getColors(status.value).text}
                />
              </View>
            );
          })}
        </View>
      </View>
      <View className="flex-row items-center justify-between">
        <AppText
          size="md"
          weight="semibold"
          className="text-slate-700 dark:text-slate-300 mt-4 mb-2 px-1">
          Unit Model Demo
        </AppText>
        <AppText>
          ({sections.length} out of {totalItems} units)
        </AppText>
      </View>
    </View>
  );
});

export default function Demo_Partner() {
  const navigation = useNavigation<AppNavigationProp>();
  const childrenCode = '';
  const logic = usePartnerDemoLogic(childrenCode);
  const {sections, isLoading, isError, refetch, isRefetching} = logic;

  const groupKeyExtractor = useCallback(
    (_: any, index: number) => index.toString(),
    [],
  );
  const renderGroup = useCallback(
    ({item}: {item: any}) => <DemoItem row={item} />,
    [],
  );
  const handlePress = () => navigation.push('UploadDemoData');

  return (
    <View className="flex-1 bg-lightBg-base dark:bg-darkBg-base">
      <DataStateView
        isLoading={isLoading}
        isError={isError}
        isEmpty={!sections?.length}
        onRetry={refetch}
        LoadingComponent={<LoaderView />}>
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
          contentContainerStyle={{
            paddingBottom: 90,
            paddingHorizontal: 14,
            paddingTop: 10,
          }}
          ItemSeparatorComponent={() => <View className="h-4" />}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
        />
        <FAB onPress={handlePress} />
      </DataStateView>
    </View>
  );
}
