import {
  FlatList,
  TouchableOpacity,
  View,
  useColorScheme,
  ScrollView,
} from 'react-native';
import moment from 'moment';
import AppLayout from '../../../../components/layout/AppLayout';
import {useRoute, useNavigation} from '@react-navigation/native';
import {memo, useCallback, useMemo, useState, useEffect} from 'react';
import AppText from '../../../../components/customs/AppText';
import AppIcon from '../../../../components/customs/AppIcon';
import Card from '../../../../components/Card';
import {AppNavigationProp} from '../../../../types/navigation';
import {AppColors} from '../../../../config/theme';
import ActionSheet, {
  SheetManager,
  useSheetPayload,
} from 'react-native-actions-sheet';
import {useQuery} from '@tanstack/react-query';
import {handleASINApiCall} from '../../../../utils/handleApiCall';
import AppDropdown, {
  AppDropdownItem,
} from '../../../../components/customs/AppDropdown';
import Skeleton from '../../../../components/skeleton/skeleton';
import {screenHeight, screenWidth} from '../../../../utils/constant';
import {useThemeStore} from '../../../../stores/useThemeStore';
import clsx from 'clsx';
import SheetIndicator from '../../../../components/SheetIndicator';

type PartnerTypes = {
  AGP_Code: string;
  AGP_Name: string;
  AGP_Or_T3: string;
  BranchName: string;
  DemoExecuted: number;
  PKIOSK_ROG_KIOSK: number;
  Pkiosk_Cnt: number;
  ROG_Kiosk_cnt: number;
  TotalCompulsoryDemo: number;
  PartnerName?: string;
  PartnerType?: string;
  PartnerCode?: string;
  Total_Demo_Count?: number;
  Inventory_Count?: number;
  Activation_count?: number;
};

type DemoSummaryItem = {
  YearQtr: string;
  Category: string;
  Series: string;
  DemoUnitModel: string;
  Serial_No: string | null;
  Invoice_Date: string | null;
  DemoExecutionDone: string;
  AGP_Code: string;
  AGP_Name: string;
  HubID: string | null;
  LastRegisteredDate: string | null;
  LastUnRegisteredDate: string | null;
  DurationDays: number;
};

type ModelItem = {
  name: string;
  total_demo: number;
  total_act: number;
  total_stock: number;
};

const useGetPartnerDemoSummary = (
  YearQtr: string,
  PartnerCode: string,
  enabled: boolean,
) => {
  const queryPayload = {
    YearQtr,
    PartnerCode,
  };

  return useQuery({
    queryKey: ['partnerDemoSummary', YearQtr, PartnerCode],
    queryFn: async () => {
      const response = await handleASINApiCall(
        '/DemoForm/GetResellerPartnerDemoSummaryAGP',
        queryPayload,
      );
      const result = response?.demoFormData;
      if (!result?.Status) {
        throw new Error('Failed to fetch partner demo summary');
      }
      return (result.Datainfo?.Table || []) as DemoSummaryItem[];
    },
    enabled: enabled && !!YearQtr && !!PartnerCode,
  });
};

const formatDate = (value: string | null) => {
  console.log('Formatting date value:', value);
  if (!value) return '—';
  const m = moment(value);
  return m.isValid() ? m.format('YYYY/MM/DD') : value;
};

const showPartnerDetailsSheet = (partner: PartnerTypes, yearQtr: string) => {
  SheetManager.show('PartnerDetailsSheet', {
    payload: {partner, yearQtr},
  });
};

const showDemoDetailsSheet = (demo: DemoSummaryItem) => {
  SheetManager.show('DemoDetailsSheet', {
    payload: {demo},
  });
};

const showDemoROISheet = (partner: PartnerTypes) => {
  SheetManager.show('DemoROISheet', {
    payload: {partner},
  });
};

export const PartnerDetailsSheet = () => {
  const payload = useSheetPayload('PartnerDetailsSheet');
  const {partner, yearQtr} = payload || {};

  const AppTheme = useThemeStore(state => state.AppTheme);
  const isDark = AppTheme === 'dark';

  // Track if sheet is open
  const [isSheetOpen, setIsSheetOpen] = useState(true);

  // Fetch demo summary data
  const {data, isLoading, error} = useGetPartnerDemoSummary(
    yearQtr || '',
    partner?.AGP_Code || '',
    isSheetOpen && !!partner && !!yearQtr,
  );

  // Filter states
  const [selectedCategory, setSelectedCategory] =
    useState<AppDropdownItem | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<AppDropdownItem | null>(
    null,
  );

  // Reset filters when sheet opens
  useEffect(() => {
    // Reset filters on mount
    setSelectedCategory(null);
    setSelectedStatus(null);
    setIsSheetOpen(true);

    return () => {
      setIsSheetOpen(false);
    };
  }, []);

  // Extract unique categories and statuses
  const {categories, statuses} = useMemo(() => {
    if (!data || data.length === 0) {
      return {categories: [], statuses: []};
    }

    const uniqueCategories = new Set<string>();
    const uniqueStatuses = new Set<string>();

    data.forEach(item => {
      if (item.Category) uniqueCategories.add(item.Category);
      if (item.DemoExecutionDone) uniqueStatuses.add(item.DemoExecutionDone);
    });

    return {
      categories: [
        ...Array.from(uniqueCategories)
          .sort()
          .map(cat => ({label: cat, value: cat})),
      ],
      statuses: [
        ...Array.from(uniqueStatuses)
          .sort()
          .map(status => ({label: status, value: status})),
      ],
    };
  }, [data]);

  // Filtered data
  const filteredData = useMemo(() => {
    if (!data) return [];

    return data.filter(item => {
      const categoryMatch =
        !selectedCategory?.value || item.Category === selectedCategory.value;
      const statusMatch =
        !selectedStatus?.value ||
        item.DemoExecutionDone === selectedStatus.value;
      return categoryMatch && statusMatch;
    });
  }, [data, selectedCategory, selectedStatus]);

  // Calculate shortfall
  const shortfall = useMemo(() => {
    if (!partner) return 0;
    const diff = partner.TotalCompulsoryDemo - partner.DemoExecuted;
    return diff >= 0 ? diff : 0;
  }, [partner]);

  // Render demo item
  const renderDemoItem = useCallback(
    ({item}: {item: DemoSummaryItem}) => {
      const isPending = item.DemoExecutionDone === 'Pending';
      return (
        <View className="mb-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          {/* Header */}
          <View className="flex-row items-start justify-between mb-3">
            <View className="flex-1">
              <AppText
                size="base"
                weight="bold"
                className="text-slate-800 dark:text-slate-100 mb-1"
                numberOfLines={1}>
                {item.Series}
              </AppText>
              <View className="flex-row items-center flex-wrap mt-1 gap-2">
                {/* Status Badge */}
                <View
                  className={`px-2.5 py-1 rounded-md ${
                    isPending
                      ? 'bg-amber-500/10 dark:bg-amber-500/20'
                      : 'bg-teal-500/10 dark:bg-teal-500/20'
                  }`}>
                  <AppText
                    size="xs"
                    weight="semibold"
                    className={
                      isPending
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-teal-600 dark:text-teal-400'
                    }>
                    {item.DemoExecutionDone}
                  </AppText>
                </View>
                {/* Category Badge */}
                <View className="bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-md">
                  <AppText
                    size="xs"
                    weight="medium"
                    className="text-slate-600 dark:text-slate-300"
                    numberOfLines={1}>
                    {item.Category}
                  </AppText>
                </View>
              </View>
            </View>
            <AppIcon
              name={isPending ? 'clock' : 'check-circle'}
              type="feather"
              size={20}
              color={isPending ? AppColors.warning : AppColors.success}
            />
          </View>

          {/* Minimal view for Pending */}
          {isPending ? (
            <View className="space-y-2">
              <View className="flex-row items-center">
                <AppIcon
                  name="box"
                  type="feather"
                  size={14}
                  color={isDark ? '#94A3B8' : '#64748B'}
                />
                <AppText
                  size="xs"
                  weight="medium"
                  className="text-slate-500 dark:text-slate-400 ml-2">
                  Model:
                </AppText>
                <AppText
                  size="xs"
                  weight="semibold"
                  className="text-slate-700 dark:text-slate-300 ml-1 flex-1"
                  numberOfLines={1}>
                  {item.DemoUnitModel}
                </AppText>
              </View>
            </View>
          ) : (
            /* Detailed grid for completed demos */
            <View>
              <View className="flex-row flex-wrap -mx-2">
                <View className="w-1/2 px-2 mb-3">
                  <AppText
                    size="xs"
                    weight="medium"
                    className="text-slate-500 dark:text-slate-400">
                    Model
                  </AppText>
                  <AppText
                    size="xs"
                    weight="semibold"
                    className="text-slate-700 dark:text-slate-300"
                    numberOfLines={1}>
                    {item.DemoUnitModel || '—'}
                  </AppText>
                </View>
                <View className="w-1/2 px-2 mb-3">
                  <AppText
                    size="xs"
                    weight="medium"
                    className="text-slate-500 dark:text-slate-400">
                    Serial No
                  </AppText>
                  <AppText
                    size="xs"
                    weight="semibold"
                    className="text-slate-700 dark:text-slate-300"
                    numberOfLines={1}>
                    {item.Serial_No || '—'}
                  </AppText>
                </View>
                <View className="w-1/2 px-2 mb-3">
                  <AppText
                    size="xs"
                    weight="medium"
                    className="text-slate-500 dark:text-slate-400">
                    Invoice Date
                  </AppText>
                  <AppText
                    size="xs"
                    weight="semibold"
                    className="text-slate-700 dark:text-slate-300"
                    numberOfLines={1}>
                    {formatDate(item.Invoice_Date)}
                  </AppText>
                </View>
                <View className="w-1/2 px-2 mb-3">
                  <AppText
                    size="xs"
                    weight="medium"
                    className="text-slate-500 dark:text-slate-400">
                    Duration (Days)
                  </AppText>
                  <AppText
                    size="xs"
                    weight="semibold"
                    className="text-slate-700 dark:text-slate-300"
                    numberOfLines={1}>
                    {item.DurationDays ?? '—'}
                  </AppText>
                </View>
                <View className="w-1/2 px-2 mb-3">
                  <AppText
                    size="xs"
                    weight="medium"
                    className="text-slate-500 dark:text-slate-400">
                    Last Registered
                  </AppText>
                  <AppText
                    size="xs"
                    weight="semibold"
                    className="text-slate-700 dark:text-slate-300"
                    numberOfLines={1}>
                    {formatDate(item.LastRegisteredDate)}
                  </AppText>
                </View>
                <View className="w-1/2 px-2 mb-3">
                  <AppText
                    size="xs"
                    weight="medium"
                    className="text-slate-500 dark:text-slate-400">
                    Last Unregistered
                  </AppText>
                  <AppText
                    size="xs"
                    weight="semibold"
                    className="text-slate-700 dark:text-slate-300"
                    numberOfLines={1}>
                    {formatDate(item.LastUnRegisteredDate)}
                  </AppText>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => showDemoDetailsSheet(item)}
                activeOpacity={0.7}
                className="mt-1 self-start flex-row items-center">
                <AppText
                  size="xs"
                  weight="semibold"
                  className="text-primary dark:text-primary-dark underline">
                  See Demo Details
                </AppText>
                <AppIcon
                  name="arrow-right"
                  type="feather"
                  size={14}
                  color={isDark ? AppColors.dark.primary : AppColors.primary}
                  style={{marginLeft: 4}}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      );
    },
    [isDark],
  );

  if (!partner) {
    return null;
  }
  // Removed debug log for cleaner production code
  return (
    <View>
      <ActionSheet
        id="PartnerDetailsSheet"
        useBottomSafeAreaPadding={true}
        containerStyle={{
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          height: screenHeight * 0.85,
        }}>
        <SheetIndicator />
        <View className="p-4 pb-3 border-b border-slate-200 dark:border-slate-700">
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1">
              <AppText
                size="xl"
                weight="bold"
                className="text-slate-800 dark:text-slate-100 mb-1">
                {partner.AGP_Name}
              </AppText>
              <View className="flex-row items-center flex-wrap gap-2">
                <View className="bg-primary/10 dark:bg-primary-dark/20 px-2.5 py-1 rounded-md">
                  <AppText
                    size="xs"
                    weight="semibold"
                    className="text-primary dark:text-primary-dark">
                    {partner.AGP_Or_T3}
                  </AppText>
                </View>
                <View className="bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-md">
                  <AppText
                    size="xs"
                    weight="medium"
                    className="text-slate-600 dark:text-slate-300">
                    Code: {partner.AGP_Code}
                  </AppText>
                </View>
              </View>
            </View>
          </View>

          {/* Summary Stats */}
          <View className="flex-row gap-2 mt-3">
            <View className="flex-1 bg-teal-50 dark:bg-teal-900/20 rounded-lg p-2">
              <AppText
                size="xs"
                weight="medium"
                className="text-teal-600 dark:text-teal-400 mb-0.5">
                Executed
              </AppText>
              <AppText
                size="lg"
                weight="bold"
                className="text-teal-600 dark:text-teal-400">
                {partner.DemoExecuted}
              </AppText>
            </View>
            <View className="flex-1 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2">
              <AppText
                size="xs"
                weight="medium"
                className="text-amber-600 dark:text-amber-400 mb-0.5">
                Shortfall
              </AppText>
              <AppText
                size="lg"
                weight="bold"
                className="text-amber-600 dark:text-amber-400">
                {shortfall}
              </AppText>
            </View>
            <View className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-2">
              <AppText
                size="xs"
                weight="medium"
                className="text-slate-600 dark:text-slate-300 mb-0.5">
                Total
              </AppText>
              <AppText
                size="lg"
                weight="bold"
                className="text-slate-800 dark:text-slate-100">
                {partner.TotalCompulsoryDemo}
              </AppText>
            </View>
          </View>
        </View>

        {/* Filters */}
        {!isLoading && data && data.length > 0 && (
          <View className="px-4 pt-3 pb-2">
            <AppText
              size="sm"
              weight="semibold"
              className="text-slate-700 dark:text-slate-300 mb-2">
              Filter Demo Units
            </AppText>
            <View className="flex-row gap-2">
              <View className="flex-1">
                <AppDropdown
                  data={categories}
                  selectedValue={selectedCategory?.value}
                  mode="dropdown"
                  placeholder="Category"
                  onSelect={setSelectedCategory}
                  allowClear
                  onClear={() => setSelectedCategory(null)}
                />
              </View>
              <View className="flex-1">
                <AppDropdown
                  data={statuses}
                  selectedValue={selectedStatus?.value}
                  mode="dropdown"
                  placeholder="Status"
                  onSelect={setSelectedStatus}
                  allowClear
                  onClear={() => setSelectedStatus(null)}
                />
              </View>
            </View>
          </View>
        )}

        {/* Content */}
        <View className="px-4">
          {isLoading ? (
            <View className="py-4">
              <Skeleton
                width={screenWidth * 0.8}
                height={100}
                borderRadius={8}
              />
              <Skeleton
                width={screenWidth * 0.8}
                height={100}
                borderRadius={8}
              />
              <Skeleton
                width={screenWidth * 0.8}
                height={100}
                borderRadius={8}
              />
            </View>
          ) : error ? (
            <View className="flex-1 items-center justify-center py-10">
              <AppIcon
                name="alert-circle"
                type="feather"
                size={48}
                color={AppColors.error}
              />
              <AppText
                size="base"
                weight="semibold"
                className="text-slate-600 dark:text-slate-400 mt-3 text-center">
                Failed to load demo data
              </AppText>
              <AppText
                size="sm"
                className="text-slate-500 dark:text-slate-500 mt-1 text-center px-4">
                Please try again later
              </AppText>
            </View>
          ) : filteredData.length === 0 ? (
            <View className="items-center justify-center py-10">
              <AppIcon
                name="inbox"
                type="feather"
                size={48}
                color={isDark ? '#64748B' : '#94A3B8'}
              />
              <AppText
                size="base"
                weight="semibold"
                className="text-slate-600 dark:text-slate-400 mt-3">
                No Demo Units Found
              </AppText>
              <AppText
                size="sm"
                className="text-slate-500 dark:text-slate-500 mt-1 text-center px-4">
                {data && data.length > 0
                  ? 'Try adjusting your filters'
                  : 'No demo data available for this partner'}
              </AppText>
            </View>
          ) : (
            <FlatList
              data={filteredData}
              renderItem={renderDemoItem}
              keyExtractor={(item, index) =>
                `${item.Category}-${item.Series}-${index}`
              }
              contentContainerStyle={{}}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <View className="mb-2">
                  <AppText
                    size="xs"
                    className="text-slate-500 dark:text-slate-400">
                    Showing {filteredData.length} of {data?.length || 0} demo
                    units
                  </AppText>
                </View>
              }
              ListFooterComponent={() => <View className="w-full h-80" />}
            />
          )}
        </View>
      </ActionSheet>
    </View>
  );
};

export const DemoDetailsSheet = () => {
  const payload = useSheetPayload('DemoDetailsSheet');
  const {demo} = payload || {};
  const AppTheme = useThemeStore(state => state.AppTheme);
  const isDark = AppTheme === 'dark';

  if (!demo) return null;

  const isPending = demo.DemoExecutionDone === 'Pending';

  return (
    <View>
      <ActionSheet
        id="DemoDetailsSheet"
        useBottomSafeAreaPadding={true}
        containerStyle={{
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          height: screenHeight * 0.75,
        }}>
        <SheetIndicator />
        <ScrollView
          contentContainerStyle={{padding: 16, paddingBottom: 64}}
          showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="mb-4">
            <AppText
              size="xl"
              weight="bold"
              className="text-slate-800 dark:text-slate-100 mb-1"
              numberOfLines={1}>
              {demo.Series}
            </AppText>
            <View className="flex-row flex-wrap gap-2 mt-1">
              <View
                className={`px-2.5 py-1 rounded-md ${
                  isPending
                    ? 'bg-amber-500/10 dark:bg-amber-500/20'
                    : 'bg-teal-500/10 dark:bg-teal-500/20'
                }`}>
                <AppText
                  size="xs"
                  weight="semibold"
                  className={
                    isPending
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-teal-600 dark:text-teal-400'
                  }>
                  {demo.DemoExecutionDone}
                </AppText>
              </View>
              <View className="bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-md">
                <AppText
                  size="xs"
                  weight="medium"
                  className="text-slate-600 dark:text-slate-300"
                  numberOfLines={1}>
                  {demo.Category}
                </AppText>
              </View>
            </View>
          </View>

          {/* Info Grid */}
          <View className="flex-row flex-wrap -mx-2">
            {[
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
              {label: 'Partner Code', value: demo.AGP_Code},
              {label: 'Partner Name', value: demo.AGP_Name},
            ].map((field, idx) => (
              <View className="w-1/2 px-2 mb-4" key={idx}>
                <AppText
                  size="xs"
                  weight="medium"
                  className="text-slate-500 dark:text-slate-400">
                  {field.label}
                </AppText>
                <AppText
                  size="xs"
                  weight="semibold"
                  className="text-slate-700 dark:text-slate-300"
                  numberOfLines={1}>
                  {field.value || '—'}
                </AppText>
              </View>
            ))}
          </View>

          {/* Footer Note */}
          <View className="mt-2">
            <AppText size="xs" className="text-slate-400 dark:text-slate-500">
              These details reflect the latest recorded demo execution metadata.
            </AppText>
          </View>
        </ScrollView>
      </ActionSheet>
    </View>
  );
};

export const DemoROISheet = () => {
  const payload = useSheetPayload('DemoROISheet');
  const {partner} = payload || {};
  const AppTheme = useThemeStore(state => state.AppTheme);
  const isDark = AppTheme === 'dark';

  // State for model filtering
  const [selectedModel, setSelectedModel] = useState<AppDropdownItem | null>(
    null,
  );

  // Reset filter when sheet opens
  useEffect(() => {
    setSelectedModel(null);
  }, []);

  // Extract models from partner
  const models: ModelItem[] = useMemo(() => {
    return partner?.model || [];
  }, [partner]);

  // Create dropdown items for models
  const modelDropdownItems = useMemo(
    () =>
      models.map(model => ({
        label: model.name,
        value: model.name,
      })),
    [models],
  );

  // Filter models based on selection
  const filteredModels = useMemo(
    () =>
      selectedModel?.value
        ? models.filter(model => model.name === selectedModel.value)
        : models,
    [models, selectedModel],
  );

  // Calculate totals
  const totals = useMemo(() => {
    return filteredModels.reduce(
      (acc, model) => ({
        demo: acc.demo + (model.total_demo || 0),
        activation: acc.activation + (model.total_act || 0),
        stock: acc.stock + (model.total_stock || 0),
      }),
      {demo: 0, activation: 0, stock: 0},
    );
  }, [filteredModels]);

  // Calculate ROI percentage
  const roiPercentage = useMemo(() => {
    if (totals.demo === 0) return 0;
    return ((totals.activation / totals.demo) * 100).toFixed(1);
  }, [totals]);

  // Render model row
  const renderModelRow = useCallback(
    (model: ModelItem, index: number) => {
      const isEven = index % 2 === 0;
      return (
        <View
          key={model.name}
          className={`flex-row items-center py-3 px-4 ${
            isEven
              ? 'bg-slate-50 dark:bg-slate-800/50'
              : 'bg-white dark:bg-slate-800'
          }`}>
          {/* Model Name */}
          <View className="flex-1">
            <AppText
              size="sm"
              weight="semibold"
              className="text-slate-800 dark:text-slate-100"
              numberOfLines={1}>
              {model.name}
            </AppText>
          </View>

          {/* Demo Count */}
          <View className="w-20 items-center">
            <AppText
              size="sm"
              weight="semibold"
              className="text-teal-600 dark:text-teal-400">
              {model.total_demo || 0}
            </AppText>
          </View>

          {/* Activation Count */}
          <View className="w-20 items-center">
            <AppText
              size="sm"
              weight="semibold"
              className="text-secondary dark:text-secondary-dark">
              {model.total_act || 0}
            </AppText>
          </View>

          {/* Stock Count */}
          <View className="w-20 items-center">
            <AppText
              size="sm"
              weight="semibold"
              className="text-warning dark:text-warning-dark">
              {model.total_stock || 0}
            </AppText>
          </View>
        </View>
      );
    },
    [isDark],
  );

  if (!partner) return null;

  return (
    <View>
      <ActionSheet
        id="DemoROISheet"
        useBottomSafeAreaPadding={true}
        containerStyle={{
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          height: screenHeight * 0.85,
        }}>
        <SheetIndicator />

        {/* Header Section */}
        <View className="p-4 pb-3 border-b border-slate-200 dark:border-slate-700">
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1">
              <AppText
                size="xl"
                weight="bold"
                className="text-slate-800 dark:text-slate-100 mb-1">
                {partner.PartnerName}
              </AppText>
              <View className="flex-row items-center flex-wrap gap-2 mt-1">
                <View className="bg-primary/10 dark:bg-primary-dark/20 px-2.5 py-1 rounded-md">
                  <AppText
                    size="xs"
                    weight="semibold"
                    className="text-primary dark:text-primary-dark">
                    {partner.PartnerType}
                  </AppText>
                </View>
                <View className="bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-md">
                  <AppText
                    size="xs"
                    weight="medium"
                    className="text-slate-600 dark:text-slate-300">
                    {partner.PartnerCode}
                  </AppText>
                </View>
              </View>
            </View>
          </View>

          {/* Branch Info */}
          <View className="flex-row items-center mt-2">
            <AppIcon
              name="map-pin"
              type="feather"
              size={14}
              color={isDark ? '#94A3B8' : '#64748B'}
            />
            <AppText
              size="sm"
              weight="medium"
              className="text-slate-600 dark:text-slate-400 ml-2">
              {partner.BranchName}
            </AppText>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{paddingBottom: 64}}
          showsVerticalScrollIndicator={false}>
          {/* Key Metrics Cards */}
          <View className="p-4">
            <View className="flex-row gap-2 mb-4">
              {/* Total Demo Card */}
              <View className="flex-1 bg-teal-50 dark:bg-teal-900/20 rounded-xl p-3 border border-teal-100 dark:border-teal-800">
                <View className="flex-row items-center justify-between mb-1">
                  <AppIcon
                    name="laptop-outline"
                    type="ionicons"
                    size={20}
                    color={AppColors.success}
                  />
                  <View className="bg-teal-600 dark:bg-teal-500 px-2 py-0.5 rounded-md">
                    <AppText size="xs" weight="bold" className="text-white">
                      {totals.demo}
                    </AppText>
                  </View>
                </View>
                <AppText
                  size="xs"
                  weight="medium"
                  className="text-teal-600 dark:text-teal-400">
                  Total Demos
                </AppText>
              </View>

              {/* Total Activation Card */}
              <View className="flex-1 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-100 dark:border-blue-800">
                <View className="flex-row items-center justify-between mb-1">
                  <AppIcon
                    name="trending-up"
                    type="feather"
                    size={20}
                    color={AppColors.secondary}
                  />
                  <View className="bg-blue-600 dark:bg-blue-500 px-2 py-0.5 rounded-md">
                    <AppText size="xs" weight="bold" className="text-white">
                      {totals.activation}
                    </AppText>
                  </View>
                </View>
                <AppText
                  size="xs"
                  weight="medium"
                  className="text-blue-600 dark:text-blue-400">
                  Activations
                </AppText>
              </View>

              {/* Total Stock Card */}
              <View className="flex-1 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 border border-amber-100 dark:border-amber-800">
                <View className="flex-row items-center justify-between mb-1">
                  <AppIcon
                    name="package"
                    type="feather"
                    size={20}
                    color={AppColors.warning}
                  />
                  <View className="bg-amber-600 dark:bg-amber-500 px-2 py-0.5 rounded-md">
                    <AppText size="xs" weight="bold" className="text-white">
                      {totals.stock}
                    </AppText>
                  </View>
                </View>
                <AppText
                  size="xs"
                  weight="medium"
                  className="text-amber-600 dark:text-amber-400">
                  Total Stock
                </AppText>
              </View>
            </View>

            {/* Model Filter */}
            {models.length > 0 && (
              <View className="mb-3">
                <AppText
                  size="sm"
                  weight="semibold"
                  className="text-slate-700 dark:text-slate-300 mb-2">
                  Filter by Model
                </AppText>
                <AppDropdown
                  data={modelDropdownItems}
                  selectedValue={selectedModel?.value}
                  mode="autocomplete"
                  placeholder="Search Series"
                  onSelect={setSelectedModel}
                  allowClear
                  onClear={() => setSelectedModel(null)}
                />
              </View>
            )}

            {/* Models Table */}
            <View className="mt-2">
              <View className="flex-row items-center justify-between mb-2">
                <AppText
                  size="base"
                  weight="bold"
                  className="text-slate-800 dark:text-slate-100">
                  Model Performance
                </AppText>
                <AppText
                  size="xs"
                  className="text-slate-500 dark:text-slate-400">
                  {filteredModels.length} of {models.length} models
                </AppText>
              </View>

              {filteredModels.length > 0 ? (
                <View className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  {/* Table Header */}
                  <View className="flex-row items-center bg-slate-100 dark:bg-slate-700 py-3 px-4">
                    <View className="flex-1">
                      <AppText
                        size="xs"
                        weight="bold"
                        className="text-slate-600 dark:text-slate-300">
                        MODEL
                      </AppText>
                    </View>
                    <View className="w-20 items-center">
                      <AppText
                        size="xs"
                        weight="bold"
                        className="text-teal-600 dark:text-teal-400">
                        DEMO
                      </AppText>
                    </View>
                    <View className="w-20 items-center">
                      <AppText
                        size="xs"
                        weight="bold"
                        className="text-blue-600 dark:text-blue-400">
                        ACT
                      </AppText>
                    </View>
                    <View className="w-20 items-center">
                      <AppText
                        size="xs"
                        weight="bold"
                        className="text-amber-600 dark:text-amber-400">
                        STOCK
                      </AppText>
                    </View>
                  </View>

                  {/* Table Body */}
                  {filteredModels.map((model, index) =>
                    renderModelRow(model, index),
                  )}

                  {/* Table Footer - Totals */}
                  {filteredModels.length > 1 && (
                    <View className="flex-row items-center bg-slate-100 dark:bg-slate-700 py-3 px-4 border-t border-slate-200 dark:border-slate-600">
                      <View className="flex-1">
                        <AppText
                          size="sm"
                          weight="bold"
                          className="text-slate-700 dark:text-slate-200">
                          TOTAL
                        </AppText>
                      </View>
                      <View className="w-20 items-center">
                        <AppText
                          size="sm"
                          weight="bold"
                          className="text-teal-600 dark:text-teal-400">
                          {totals.demo}
                        </AppText>
                      </View>
                      <View className="w-20 items-center">
                        <AppText
                          size="sm"
                          weight="bold"
                          className="text-blue-600 dark:text-blue-400">
                          {totals.activation}
                        </AppText>
                      </View>
                      <View className="w-20 items-center">
                        <AppText
                          size="sm"
                          weight="bold"
                          className="text-amber-600 dark:text-amber-400">
                          {totals.stock}
                        </AppText>
                      </View>
                    </View>
                  )}
                </View>
              ) : (
                <View className="items-center justify-center py-10 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <AppIcon
                    name="inbox"
                    type="feather"
                    size={48}
                    color={isDark ? '#64748B' : '#94A3B8'}
                  />
                  <AppText
                    size="base"
                    weight="semibold"
                    className="text-slate-600 dark:text-slate-400 mt-3">
                    No Models Found
                  </AppText>
                  <AppText
                    size="sm"
                    className="text-slate-500 dark:text-slate-500 mt-1">
                    Try adjusting your filter
                  </AppText>
                </View>
              )}
            </View>

            {/* Additional Info */}
            <View className="mt-4 bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
              <View className="flex-row items-start">
                <AppIcon
                  name="info"
                  type="feather"
                  size={16}
                  color={isDark ? '#94A3B8' : '#64748B'}
                  style={{marginTop: 2}}
                />
                <AppText
                  size="xs"
                  className="text-slate-600 dark:text-slate-400 ml-2 flex-1">
                  This data reflects the current inventory, demo executions, and
                  activation metrics for this partner.
                </AppText>
              </View>
            </View>
          </View>
        </ScrollView>
      </ActionSheet>
    </View>
  );
};

const PartnerCard = memo<{
  item: PartnerTypes;
  onPressDetails: (partner: PartnerTypes) => void;
  onPressView: (partner: PartnerTypes) => void;
  isROI?: boolean;
}>(({item, onPressDetails, onPressView, isROI}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Calculate shortfall
  const shortfall = useMemo(() => {
    const diff = item.TotalCompulsoryDemo - item.DemoExecuted;
    return diff >= 0 ? diff : 0;
  }, [item.TotalCompulsoryDemo, item.DemoExecuted]);

  return (
    <Card className="mb-4 mx-0">
      {/* Partner Name - Primary Information */}
      <View className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                onPress={() => onPressDetails(item)}
                activeOpacity={0.7}
                className="flex-row items-center w-10/12 ">
                <AppText
                  size="md"
                  weight="bold"
                  className="text-secondary dark:text-secondary-dark mb-1 underline">
                  {item.AGP_Name || item?.PartnerName || '—-'}
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onPressView(item)}
                activeOpacity={0.7}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <AppIcon
                  name="eye"
                  type="feather"
                  size={20}
                  color={
                    isDark ? AppColors.dark.secondary : AppColors.secondary
                  }
                />
              </TouchableOpacity>
            </View>
            <View className="flex-row items-center mt-1">
              <View className="bg-primary/10 dark:bg-primary-dark/20 px-2.5 py-1 rounded-md">
                <AppText
                  size="xs"
                  weight="semibold"
                  className="text-primary dark:text-primary-dark">
                  {item.AGP_Or_T3 || item?.PartnerType || '—-'}
                </AppText>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Partner Details - All in One Row */}
      <View className="flex-row items-center justify-between">
        {/* Partner Code */}
        <View className={clsx('items-center', isROI ? 'w-1/4' : 'w-1/3')}>
          <View className="w-10 h-10 bg-secondary/10 dark:bg-secondary-dark/20 rounded-lg items-center justify-center mb-2">
            <AppIcon
              name="barcode"
              type="material-community"
              size={20}
              color={isDark ? AppColors.dark.secondary : AppColors.secondary}
            />
          </View>
          <AppText
            size="xs"
            weight="medium"
            className="text-gray-500 dark:text-gray-400 mb-1 text-center">
            Partner Code
          </AppText>
          <AppText
            size="sm"
            weight="semibold"
            className="text-text dark:text-text-dark text-center">
            {item.AGP_Code || item?.PartnerCode || '—-'}
          </AppText>
        </View>
        {isROI ? (
          <View className="w-3/4 flex-row items-center justify-between">
            {/* Total Demo */}
            <View className="w-1/3 items-center border-l border-r border-gray-200 dark:border-gray-700">
              <View className="w-10 h-10 bg-success/10 dark:bg-success/20 rounded-lg items-center justify-center mb-2">
                <AppIcon
                  name="laptop-outline"
                  type="ionicons"
                  size={20}
                  color={AppColors.success}
                />
              </View>
              <AppText
                size="xs"
                weight="medium"
                className="text-gray-500 dark:text-gray-400 mb-1 text-center">
                Total Demo
              </AppText>
              <AppText
                size="lg"
                weight="bold"
                className="text-success dark:text-success text-center">
                {item.Total_Demo_Count}
              </AppText>
            </View>
            {/* Total Active */}
            <View className="w-1/3 items-center border-l border-r border-gray-200 dark:border-gray-700">
              <View className="w-10 h-10 bg-secondary/10 dark:bg-secondary-dark/20 rounded-lg items-center justify-center mb-2">
                <AppIcon
                  name="trending-up"
                  type="feather"
                  size={20}
                  color={AppColors.secondary}
                />
              </View>
              <AppText
                size="xs"
                weight="medium"
                className="text-gray-500 dark:text-gray-400 mb-1 text-center">
                Total Active
              </AppText>
              <AppText
                size="lg"
                weight="bold"
                className="text-secondary dark:text-secondary text-center">
                {item.Activation_count}
              </AppText>
            </View>
            {/* Total Stock */}
            <View className="w-1/3 items-center">
              <View className="w-10 h-10 bg-warning/10 dark:bg-warning/20 rounded-lg items-center justify-center mb-2">
                <AppIcon
                  name="percent"
                  type="feather"
                  size={20}
                  color={AppColors[isDark ? 'dark' : 'light'].warning}
                />
              </View>
              <AppText
                size="xs"
                weight="medium"
                className="text-gray-500 dark:text-gray-400 mb-1 text-center">
                Total Stock
              </AppText>
              <AppText
                size="lg"
                weight="bold"
                className="text-warning dark:text-warning"
                style={{textAlign: 'center'}}>
                {item.Inventory_Count}
              </AppText>
            </View>
          </View>
        ) : (
          <View className="w-2/3 flex-row items-center justify-between">
            {/* Demo Executed */}
            <View className="w-1/2 items-center border-l border-r border-gray-200 dark:border-gray-700">
              <View className="w-10 h-10 bg-success/10 dark:bg-success/20 rounded-lg items-center justify-center mb-2">
                <AppIcon
                  name="check-circle-outline"
                  type="material-community"
                  size={20}
                  color={AppColors.success}
                />
              </View>
              <AppText
                size="xs"
                weight="medium"
                className="text-gray-500 dark:text-gray-400 mb-1 text-center">
                Demo Executed
              </AppText>
              <AppText
                size="lg"
                weight="bold"
                className="text-success dark:text-success text-center">
                {item.DemoExecuted}
              </AppText>
            </View>
            {/* Shortfall */}
            <View className="w-1/2 items-center">
              <View
                className={`w-10 h-10 ${
                  shortfall > 0
                    ? 'bg-warning/10 dark:bg-warning/20'
                    : 'bg-gray-100 dark:bg-gray-800'
                } rounded-lg items-center justify-center mb-2`}>
                <AppIcon
                  name="alert-circle-outline"
                  type="material-community"
                  size={20}
                  color={
                    shortfall > 0
                      ? AppColors.warning
                      : isDark
                        ? '#6B7280'
                        : '#9CA3AF'
                  }
                />
              </View>
              <AppText
                size="xs"
                weight="medium"
                className="text-gray-500 dark:text-gray-400 mb-1 text-center">
                Shortfall
              </AppText>
              <AppText
                size="lg"
                weight="bold"
                className={
                  shortfall > 0
                    ? 'text-warning dark:text-warning'
                    : 'text-gray-400 dark:text-gray-500'
                }
                style={{textAlign: 'center'}}>
                {shortfall}
              </AppText>
            </View>
          </View>
        )}
      </View>
    </Card>
  );
});

export default function DemoPartners() {
  const {params} = useRoute();
  const navigation = useNavigation<AppNavigationProp>();
  const {
    partners,
    yearQtr,
    isROI = false,
  } = params as {
    partners: PartnerTypes[];
    yearQtr: string;
    isROI?: boolean;
  };

  // Partner selection state for filtering
  const [selectedPartner, setSelectedPartner] =
    useState<AppDropdownItem | null>(null);

  // Dropdown items derived from partners
  const partnerDropdownItems = useMemo(
    () =>
      (partners || []).map(p => ({
        label: `${p.AGP_Name || p?.PartnerName || '—-'} (${p.AGP_Code || p?.PartnerCode || '—-'})`,
        value: p.AGP_Code || p?.PartnerCode || '—-',
      })),
    [partners],
  );

  // Filter partners based on selection
  const filteredPartners = useMemo(
    () =>
      selectedPartner?.value
        ? partners.filter(
            p =>
              (p.AGP_Code || p?.PartnerCode || '—-') === selectedPartner.value,
          )
        : partners,
    [partners, selectedPartner],
  );

  // Handle navigation to partner details
  const handlePartnerDetails = useCallback(
    (partner: PartnerTypes) => {
      navigation.push('TargetPartnerDashboard', {partner});
    },
    [navigation],
  );

  // Handle view partner details in ActionSheet
  const handleViewPartner = useCallback(
    (partner: PartnerTypes) => {
      if (isROI) {
        showDemoROISheet(partner);
      } else {
        showPartnerDetailsSheet(partner, yearQtr || '');
      }
    },
    [yearQtr],
  );

  // Render item with memoization
  const renderPartnerItem = useCallback(
    ({item}: {item: PartnerTypes}) => (
      <PartnerCard
        item={item}
        onPressDetails={handlePartnerDetails}
        onPressView={handleViewPartner}
        isROI={isROI}
      />
    ),
    [handlePartnerDetails, handleViewPartner],
  );

  // Key extractor for FlatList
  const keyExtractor = useCallback((_: any, idx: number) => idx.toString(), []);

  // Empty state component
  const renderEmptyComponent = useCallback(() => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
      <View className="flex-1 items-center justify-center py-20">
        <AppIcon
          name="alert-circle-outline"
          type="material-community"
          size={64}
          color={isDark ? '#4B5563' : '#9CA3AF'}
        />
        <AppText
          size="lg"
          weight="semibold"
          className="text-gray-500 dark:text-gray-400 mb-2 mt-4">
          No Partners Found
        </AppText>
        <AppText
          size="sm"
          weight="regular"
          className="text-gray-400 dark:text-gray-500 text-center px-8">
          There are no partners available to display at the moment.
        </AppText>
      </View>
    );
  }, []);

  // List header with summary
  const renderListHeader = useCallback(() => {
    const totalDemosExecuted =
      filteredPartners?.reduce(
        (sum, partner) => sum + partner.DemoExecuted,
        0,
      ) || 0;
    const totalShortfall =
      filteredPartners?.reduce((sum, partner) => {
        const diff = partner.TotalCompulsoryDemo - partner.DemoExecuted;
        return sum + (diff >= 0 ? diff : 0);
      }, 0) || 0;
    const totalDemo = isROI
      ? filteredPartners?.reduce(
          (sum, partner) => sum + (partner.Total_Demo_Count || 0),
          0,
        )
      : 0;
    const totalActive = isROI
      ? filteredPartners?.reduce(
          (sum, partner) => sum + (partner.Activation_count || 0),
          0,
        )
      : 0;
    const totalStock = isROI
      ? filteredPartners?.reduce(
          (sum, partner) => sum + (partner.Inventory_Count || 0),
          0,
        )
      : 0;

    return (
      <View className="mb-4">
        <Card className="mb-3 mx-0">
          <View className="pb-3 border-b border-slate-100 dark:border-slate-700">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View className="w-8 h-8 rounded-full bg-primary/10 dark:bg-primary-dark/20 items-center justify-center">
                  <AppIcon
                    name="bar-chart-2"
                    type="feather"
                    size={16}
                    color={AppColors.primary}
                  />
                </View>
                <AppText
                  size="base"
                  weight="semibold"
                  className="text-slate-800 dark:text-slate-100">
                  Overall Summary
                </AppText>
              </View>
            </View>
            <AppText
              size="xs"
              className="text-slate-400 dark:text-slate-500 mt-1">
              Aggregated data across all partners
            </AppText>
          </View>

          {/* Demo Metrics */}
          {isROI ? (
            <View className="flex-row justify-around mt-4">
              <View className="flex-1 items-center">
                <View className="w-12 h-12 rounded-xl bg-teal-500 items-center justify-center mb-2 shadow-sm">
                  <AppIcon
                    name="laptop-outline"
                    type="ionicons"
                    size={20}
                    color="white"
                  />
                </View>
                <AppText
                  size="xs"
                  weight="medium"
                  numberOfLines={2}
                  className="text-center leading-tight text-teal-600 dark:text-teal-400">
                  Total Demos
                </AppText>
                <AppText
                  size="lg"
                  weight="semibold"
                  className="mt-1 text-teal-600 dark:text-teal-400">
                  {totalDemo}
                </AppText>
              </View>

              <View className="w-px bg-slate-100 dark:bg-slate-700 mx-3" />

              <View className="flex-1 items-center">
                <View
                  className={`w-12 h-12 rounded-xl items-center justify-center mb-2 shadow-sm bg-secondary`}>
                  <AppIcon
                    name="trending-up"
                    type="feather"
                    size={20}
                    color="white"
                  />
                </View>
                <AppText
                  size="xs"
                  weight="medium"
                  numberOfLines={2}
                  className={`text-center leading-tight text-secondary dark:text-secondary-dark`}>
                  Total Active
                </AppText>
                <AppText
                  size="lg"
                  weight="semibold"
                  className={`mt-1 text-secondary dark:text-secondary-dark`}>
                  {totalActive}
                </AppText>
              </View>

              <View className="w-px bg-slate-100 dark:bg-slate-700 mx-3" />

              <View className="flex-1 items-center">
                <View
                  className={`w-12 h-12 rounded-xl items-center justify-center mb-2 shadow-sm bg-warning`}>
                  <AppIcon
                    name="percent"
                    type="feather"
                    size={20}
                    color="white"
                  />
                </View>
                <AppText
                  size="xs"
                  weight="medium"
                  numberOfLines={2}
                  className={`text-center leading-tight text-warning dark:text-warning-dark`}>
                  Total Stock
                </AppText>
                <AppText
                  size="lg"
                  weight="semibold"
                  className={`mt-1 text-warning dark:text-warning-dark`}>
                  {totalStock}
                </AppText>
              </View>
            </View>
          ) : (
            <View className="flex-row justify-around mt-4">
              <View className="flex-1 items-center">
                <View className="w-12 h-12 rounded-xl bg-teal-500 items-center justify-center mb-2 shadow-sm">
                  <AppIcon
                    name="check-circle"
                    type="feather"
                    size={20}
                    color="white"
                  />
                </View>
                <AppText
                  size="xs"
                  weight="medium"
                  numberOfLines={2}
                  className="text-center leading-tight text-teal-600 dark:text-teal-400">
                  Demos Executed
                </AppText>
                <AppText
                  size="lg"
                  weight="semibold"
                  className="mt-1 text-teal-600 dark:text-teal-400">
                  {totalDemosExecuted}
                </AppText>
              </View>

              <View className="w-px bg-slate-100 dark:bg-slate-700 mx-3" />

              <View className="flex-1 items-center">
                <View
                  className={`w-12 h-12 rounded-xl items-center justify-center mb-2 shadow-sm ${
                    totalShortfall > 0
                      ? 'bg-amber-500'
                      : 'bg-slate-300 dark:bg-slate-600'
                  }`}>
                  <AppIcon
                    name="alert-circle"
                    type="feather"
                    size={20}
                    color="white"
                  />
                </View>
                <AppText
                  size="xs"
                  weight="medium"
                  numberOfLines={2}
                  className={`text-center leading-tight ${
                    totalShortfall > 0
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}>
                  Shortfall
                </AppText>
                <AppText
                  size="lg"
                  weight="semibold"
                  className={`mt-1 ${
                    totalShortfall > 0
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}>
                  {totalShortfall}
                </AppText>
              </View>
            </View>
          )}
        </Card>
      </View>
    );
  }, [filteredPartners]);

  return (
    <AppLayout title="Demo Partners" needBack>
      <View className="my-3 px-3">
        <AppDropdown
          label="Select Partner"
          data={partnerDropdownItems}
          selectedValue={selectedPartner?.value}
          mode="dropdown"
          placeholder="All Partners"
          onSelect={setSelectedPartner}
          allowClear
          onClear={() => setSelectedPartner(null)}
        />
      </View>
      <FlatList
        data={filteredPartners}
        renderItem={renderPartnerItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 24,
        }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={15}
        windowSize={5}
      />
    </AppLayout>
  );
}
