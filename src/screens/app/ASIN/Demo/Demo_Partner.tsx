import {FlatList, ScrollView, TouchableOpacity, View} from 'react-native';
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
import {showDemoPartnerFilterSheet} from './Demo_Partner_Filter_Sheet';
import FilterButton from '../../../../components/FilterButton';
import { AppColors } from '../../../../config/theme';

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
  ALP_Remark?: string | null;
  ALP_Status?: string | null;
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
  onPress?: () => void;
}

const useGetPartnerDemoData = (
  YearQtr: string,
  childrenCode?: string,
  DifferentEmployeeCode?: string,
) => {
  const {EMP_Code} = useLoginStore(state => state.userInfo);
  const employeeCode = childrenCode || DifferentEmployeeCode || EMP_Code || '';
  const enabled = Boolean(employeeCode && YearQtr);
  return useQuery({
    queryKey: ['partnerDemoData', employeeCode, YearQtr, DifferentEmployeeCode],
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
const useGetSubCode = (hasSubCode: boolean) => {
  const {EMP_Code: employeeCode = ''} = useLoginStore(state => state.userInfo);
  return useQuery({
    queryKey: ['subCodes', employeeCode],
    queryFn: async () => {
      const response = await handleASINApiCall('/DemoForm/GetSubcode_List', {
        employeeCode,
      });
      console.log('Sub Codes Response:', response);
      const result = response?.demoFormData;
      if (!result?.Status) {
        throw new Error('Failed to fetch sub codes');
      }
      return result?.Datainfo?.Subcode_List;
    },
    enabled: hasSubCode,
    select: data => {
      return (
        data?.map((item: any) => ({
          label: item?.PartnerName,
          value: item?.PartnerCode,
        })) || []
      );
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
        <Skeleton key={i} height={40} width={screenWidth * 0.44} />
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

const usePartnerDemoLogic = (
  childrenCode?: string,
  DifferentEmployeeCode?: string,
) => {
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
    childrenCode,
    DifferentEmployeeCode,
  );

  // Local filter state
  const [selectedCategory, setSelectedCategory] =
    useState<AppDropdownItem | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<AppDropdownItem | null>(
    null,
  );
  const [selectedUnitModel, setSelectedUnitModel] =
    useState<AppDropdownItem | null>(null);
  const [selectedDemoType, setSelectedDemoType] =
    useState<AppDropdownItem | null>(null);

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
    if (selectedDemoType) {
      if (selectedDemoType.value === 'bonus') {
        filtered = filtered.filter(d => d.IsBonusCompulsory === 'Yes');
      } else if (selectedDemoType.value === 'no-penalty') {
        filtered = filtered.filter(d => d.IsPenaltyCompulsary === 'Yes');
      }
    }
    return filtered;
  }, [
    demoData,
    selectedCategory,
    selectedStatus,
    selectedUnitModel,
    selectedDemoType,
  ]);

  // Derived options
  const unitModelOptions = useMemo(() => {
    if (!sections) return [] as AppDropdownItem[];
    const models = new Set<string>();
    sections.forEach(demo => {
      if (demo.DemoUnitModel) models.add(demo.DemoUnitModel);
    });
    return Array.from(models).map(m => ({label: m, value: m}));
  }, [sections]);

  const statusOptions = useMemo(() => {
    if (!sections) return [] as AppDropdownItem[];
    const statuses = new Set<string>();
    sections.forEach(demo => {
      if (demo.DemoExecutionDone) statuses.add(demo.DemoExecutionDone);
    });
    return Array.from(statuses).map(s => ({label: s, value: s}));
  }, [sections]);

  const categoryOptions = useMemo(() => {
    if (!demoData) return [] as AppDropdownItem[];
    const categories = new Set<string>();
    demoData.forEach(demo => {
      if (demo.Category) categories.add(demo.Category);
    });
    return Array.from(categories).map(c => ({label: c, value: c}));
  }, [demoData]);

  const demoTypeOptions = useMemo(
    () => [
      {label: 'Bonus', value: 'bonus'},
      {label: 'No Penalty', value: 'no-penalty'},
    ],
    [],
  );

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
    selectedDemoType,
    setSelectedDemoType,

    unitModelOptions,
    statusOptions,
    categoryOptions,
    demoTypeOptions,
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
  ({iconName, iconColor, bgClass, label, value, valueColorClass, onPress}) => {
    const baseLabelColor = valueColorClass.replace('700', '600');
    return (
      <TouchableOpacity
        disabled={!onPress}
        onPress={onPress}
        className={`flex-1 items-center justify-center rounded-lg px-5 py-1 ${bgClass} `}>
        {/* <View
          className={`w-14 h-14 rounded-full ${bgClass} items-center justify-center mb-2`}>
          <AppIcon type="feather" name={iconName} size={26} color={iconColor} />
        </View> */}
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
      </TouchableOpacity>
    );
  },
);

const DemoItem: React.FC<{row: PartnerDemoData; filter?: any}> = memo(
  ({row, filter}) => {
    console.log('Rendering DemoItem for Series:', filter);
    const statusColors = getStatusColors(row.DemoExecutionDone);
    const normalizedStatus = row.DemoExecutionDone?.trim().toLowerCase() || '';
    const isDoneStatus = normalizedStatus.includes('done');
    const isBonusCompulsory = filter?.value
      ? row.IsBonusCompulsory === 'Yes' && filter?.value === 'bonus'
      : row.IsBonusCompulsory === 'Yes';
    const isPenaltyCompulsory = filter?.value
      ? row.IsPenaltyCompulsary === 'Yes' && filter?.value === 'no-penalty'
      : row.IsPenaltyCompulsary === 'Yes';
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
              {row.Series || '-'}
            </AppText>
            <View className="flex-row mt-2">
              <View className="bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-md ">
                <AppText
                  size="xs"
                  weight="medium"
                  className="text-slate-600 dark:text-slate-300"
                  numberOfLines={1}>
                  {row.Category}
                  {'  '}
                  {isBonusCompulsory && (
                    <AppText
                      size="xs"
                      weight="medium"
                      className="text-blue-600 dark:text-blue-300">
                      [Bonus]
                    </AppText>
                  )}
                  {'  '}
                  {isPenaltyCompulsory && (
                    <AppText
                      size="xs"
                      weight="medium"
                      className="text-blue-600 dark:text-blue-300">
                      [No Penalty]
                    </AppText>
                  )}
                </AppText>
              </View>
            </View>
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
        <View className="flex-row flex-wrap mt-2 ">
          <InfoPair
            label="Model"
            value={row.DemoUnitModel}
            containerClassName="w-1/2 pr-2 "
          />
          {row.Serial_No && (
            <InfoPair
              label="Serial No"
              value={row.Serial_No}
              containerClassName="w-1/2"
            />
          )}
        </View>
        {isDoneStatus && (
          <View className="flex-row flex-wrap mt-1">
            <InfoPair
              label="Invoice Date"
              value={moment(row.Invoice_Date).format('YYYY/MM/DD')}
              containerClassName="w-1/2  mt-2"
            />
            <InfoPair
              label="Duration Days"
              value={
                row.DurationDays !== null ? String(row.DurationDays) : null
              }
              containerClassName="w-1/2  mt-2"
            />
            <InfoPair
              label="Last Registered"
              value={formatDate(row.LastRegisteredDate)}
              containerClassName="w-1/2  mt-2"
            />
            <InfoPair
              label="Last Unregistered"
              value={formatDate(row.LastUnRegisteredDate)}
              containerClassName="w-1/2 mt-2"
            />
            {row?.ALP_Remark && (
              <InfoPair
                label="ALP Remark"
                value={row.ALP_Remark}
                containerClassName="w-1/2 mt-2"
              />
            )}
            {row?.ALP_Status && (
              <InfoPair
                label="ALP Status"
                value={row.ALP_Status}
                containerClassName="w-1/2 mt-2"
              />
            )}
            <InfoPair
              label="Hub ID"
              value={row.HubID}
              containerClassName="w-1/2 mt-2"
            />
            <TouchableOpacity
              onPress={handleSeeMore}
              activeOpacity={0.7}
              className="mt-3 ml-1 w-full items-start flex-row">
              <AppText
                size="sm"
                weight="semibold"
                className="underline mr-2 text-primary dark:text-secondary-dark">
                See Demo Details
              </AppText>
              <AppIcon
                name="arrow-right"
                type="feather"
                size={14}
                color= {AppColors?.primary}
                style={{marginLeft: 4}}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  },
);

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
    selectedDemoType,
    setSelectedDemoType,
    unitModelOptions,
    categoryOptions,
    statusOptions,
    demoTypeOptions,
    sections,
    totalItems,
  } = logic;

  const getColors = useCallback((status: string | null) => {
    return getStatusColors(status);
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategory) count++;
    if (selectedUnitModel) count++;
    if (selectedStatus) count++;
    if (selectedDemoType) count++;
    return count;
  }, [selectedCategory, selectedUnitModel, selectedStatus, selectedDemoType]);

  const handleOpenFilterSheet = useCallback(() => {
    showDemoPartnerFilterSheet({
      filters: {
        category: selectedCategory?.value || '',
        unitModel: selectedUnitModel?.value || '',
        status: selectedStatus?.value || '',
        demoType: selectedDemoType?.value || '',
      },
      options: {
        categoryOptions,
        unitModelOptions,
        statusOptions,
        demoTypeOptions,
      },
      onApply: filters => {
        setSelectedCategory(
          filters.category
            ? {label: filters.category, value: filters.category}
            : null,
        );
        setSelectedUnitModel(
          filters.unitModel
            ? {label: filters.unitModel, value: filters.unitModel}
            : null,
        );
        setSelectedStatus(
          filters.status
            ? {label: filters.status, value: filters.status}
            : null,
        );
        if (filters.demoType) {
          const demoTypeOption = demoTypeOptions.find(
            opt => opt.value === filters.demoType,
          );
          setSelectedDemoType(demoTypeOption || null);
        } else {
          setSelectedDemoType(null);
        }
      },
      onReset: () => {
        setSelectedCategory(null);
        setSelectedUnitModel(null);
        setSelectedStatus(null);
        setSelectedDemoType(null);
      },
    });
  }, [
    selectedCategory,
    selectedUnitModel,
    selectedStatus,
    selectedDemoType,
    categoryOptions,
    unitModelOptions,
    statusOptions,
    demoTypeOptions,
    setSelectedCategory,
    setSelectedUnitModel,
    setSelectedStatus,
    setSelectedDemoType,
  ]);

  const selectedFilters = useMemo(() => {
    const filters = [];
    if (selectedCategory)
      filters.push({label: 'Category', value: selectedCategory.label});
    if (selectedUnitModel)
      filters.push({label: 'Unit Model', value: selectedUnitModel.label});
    if (selectedStatus)
      filters.push({label: 'Status', value: selectedStatus.label});
    if (selectedDemoType)
      filters.push({label: 'Demo Type', value: selectedDemoType.label});
    return filters;
  }, [selectedCategory, selectedUnitModel, selectedStatus, selectedDemoType]);

  return (
    <View className="mb-5">
      <View className="flex-row mb-4 gap-3 items-center justify-end">
        <View className="w-40">
          <AppDropdown
            mode="dropdown"
            data={quarters}
            selectedValue={selectedQuarter?.value}
            onSelect={setSelectedQuarter}
            placeholder="Quarter"
            zIndex={2900}
          />
        </View>
        {/* <TouchableOpacity
          onPress={handleOpenFilterSheet}
          activeOpacity={0.7}
          className="bg-primary dark:bg-primary-dark px-4 py-3 rounded-lg flex-row items-center justify-center">
          <AppIcon name="filter" type="feather" size={18} color="#FFFFFF" />
          {activeFilterCount > 0 && (
            <View className="ml-2 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full">
              <AppText size="xs" weight="semibold" className="text-primary dark:text-white">
                {activeFilterCount}
              </AppText>
            </View>
          )}
        </TouchableOpacity> */}
        <FilterButton
          onPress={handleOpenFilterSheet}
          needBorder
          noShadow
          hasActiveFilters={activeFilterCount > 0}
        />
      </View>
      {selectedFilters.length > 0 && (
        <View className="mb-4">
          <AppText
            size="xs"
            weight="medium"
            className="text-slate-600 dark:text-slate-400 mb-2 px-1">
            Selected Filters
          </AppText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{paddingHorizontal: 4}}>
            <View className="flex-row gap-2">
              {selectedFilters.map((filter, index) => (
                <View
                  key={index}
                  className="flex-row items-center bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-full border border-blue-200 dark:border-blue-700">
                  <AppText
                    size="xs"
                    weight="medium"
                    className="text-blue-700 dark:text-blue-300">
                    {filter.label}:{' '}
                  </AppText>
                  <AppText
                    size="xs"
                    weight="semibold"
                    className="text-blue-800 dark:text-blue-200">
                    {filter.value}
                  </AppText>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}
      <View className="p-5 rounded-2xl bg-lightBg-surface dark:bg-darkBg-surface border border-slate-200 dark:border-slate-700">
        <AppText size="md" weight="semibold" className="text-slate-800 mb-4">
          Summary
        </AppText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-x-10">
          {/* <View className="flex-row items-center gap-x-8"> */}
          <View className="flex-row items-center flex-1 ">
            <StatMetric
              // onPress={() => setSelectedStatus(status)}
              iconName={getColors('total').iconName}
              iconColor={getColors('total').iconColor}
              bgClass={`${getColors('total').container}`}
              label={'Total'}
              value={sections?.length || 0}
              valueColorClass={getColors('total').text}
            />
          </View>
          {statusOptions.map((status, idx) => {
            return (
              <View
                className="flex-row items-center flex-1 "
                key={status.value}>
                <StatMetric
                  // onPress={() => setSelectedStatus(status)}
                  iconName={getColors(status.value).iconName}
                  iconColor={getColors(status.value).iconColor}
                  bgClass={`${getColors(status.value).container} `}
                  label={status.label}
                  value={
                    status.value && !!sections
                      ? sections?.filter(
                          s => s.DemoExecutionDone === status.value,
                        ).length
                      : 0
                  }
                  valueColorClass={getColors(status.value).text}
                />
              </View>
            );
          })}
        </ScrollView>
        {/* </View> */}
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

const EmptyComponent = () => (
  <View className="flex-1 items-center justify-center">
    <AppIcon name="inbox" size={48} color="#9CA3AF" type="fontAwesome" />
    <AppText size="md" className="text-center">
      No data available to display.
    </AppText>
  </View>
);
const SelectSubCodesEmptyComponent = () => (
  <View className="flex-1 items-center mt-20 px-4">
    <AppIcon name="info" size={48} color="#3B82F6" type="feather" />
    <AppText size="md" className="text-center">
      Select a Sub code to view demo data.
    </AppText>
  </View>
);

export default function Demo_Partner({
  DifferentEmployeeCode,
}: {
  DifferentEmployeeCode?: string;
}) {
  const navigation = useNavigation<AppNavigationProp>();
  const {IsParentCode} = useUserStore(state => state.empInfo);
  const [childrenCode, setChildrenCode] = useState('');
  const checkIsParent = DifferentEmployeeCode ? false : IsParentCode;
  const {
    data,
    isLoading: isSubCodeLoading,
    isError: isSubCodeError,
  } = useGetSubCode(!!checkIsParent);
  const logic = usePartnerDemoLogic(childrenCode, DifferentEmployeeCode);
  const {
    sections,
    isLoading,
    isError,
    refetch,
    isRefetching,
    demoData,
    selectedDemoType,
  } = logic;
  console.log(
    'Partner Demo Data :',
    demoData?.filter(d => d.IsBonusCompulsory === 'Yes'),
  ); // Debug log to check data
  console.log('Selected Demo Type:', selectedDemoType); // Debug log to check selected demo type

  const groupKeyExtractor = useCallback(
    (_: any, index: number) => index.toString(),
    [],
  );
  const renderGroup = useCallback(
    ({item}: {item: any}) => <DemoItem row={item} filter={selectedDemoType} />,
    [selectedDemoType],
  );
  const handlePress = () => navigation.push('UploadDemoData');
  return (
    <View className="flex-1 bg-lightBg-base dark:bg-darkBg-base">
      {checkIsParent && (
        <AppDropdown
          mode="dropdown"
          data={data || []}
          selectedValue={childrenCode}
          onSelect={item => setChildrenCode(item?.value || '')}
          placeholder={isSubCodeLoading ? 'Loading...' : 'Select Child Code'}
          zIndex={4000}
          allowClear
          onClear={() => setChildrenCode('')}
          style={{padding: 12}}
        />
      )}
      <DataStateView
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        LoadingComponent={<LoaderView />}>
        <FlatList
          data={sections}
          keyExtractor={groupKeyExtractor}
          renderItem={renderGroup}
          ListHeaderComponent={<FiltersSummaryHeader logic={logic} />}
          ListEmptyComponent={
            <View>
              <AppText
                size="md"
                weight="medium"
                className="text-slate-600 text-center mt-10">
                No demo data found matching the selected criteria.
              </AppText>
            </View>
          }
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
      </DataStateView>
      {checkIsParent && <FAB onPress={handlePress} />}
    </View>
  );
}
