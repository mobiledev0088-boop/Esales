import {FlatList, TouchableOpacity, View, useColorScheme} from 'react-native';
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
import AppDropdown, {AppDropdownItem} from '../../../../components/customs/AppDropdown';
import Skeleton from '../../../../components/skeleton/skeleton';
import {screenHeight, screenWidth} from '../../../../utils/constant';
import {useThemeStore} from '../../../../stores/useThemeStore';

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

// Hook to fetch partner demo summary
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

// Memoized Partner Card Component for optimal performance
const PartnerCard = memo<{
  item: PartnerTypes;
  onPressDetails: (partner: PartnerTypes) => void;
  onPressView: (partner: PartnerTypes) => void;
}>(({item, onPressDetails, onPressView}) => {
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
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => onPressDetails(item)}
                activeOpacity={0.7}
                className="flex-row items-center flex-shrink">
                <AppText
                  size="xl"
                  weight="bold"
                  className="text-secondary dark:text-secondary-dark mb-1 underline">
                  {item.AGP_Name}
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onPressView(item)}
                activeOpacity={0.7}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                className="ml-2">
                <AppIcon
                  name="eye"
                  type="feather"
                  size={20}
                  color={isDark ? AppColors.dark.secondary : AppColors.secondary}
                />
              </TouchableOpacity>
            </View>
            <View className="flex-row items-center mt-1">
              <View className="bg-primary/10 dark:bg-primary-dark/20 px-2.5 py-1 rounded-md">
                <AppText
                  size="xs"
                  weight="semibold"
                  className="text-primary dark:text-primary-dark">
                  {item.AGP_Or_T3}
                </AppText>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Partner Details - All in One Row */}
      <View className="flex-row items-center justify-between">
        {/* Partner Code */}
        <View className="flex-1 items-center">
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
            {item.AGP_Code}
          </AppText>
        </View>

        {/* Demo Executed */}
        <View className="flex-1 items-center border-l border-r border-gray-200 dark:border-gray-700">
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
        <View className="flex-1 items-center">
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
    </Card>
  );
});

// Helper function to show the partner details sheet
const showPartnerDetailsSheet = (partner: PartnerTypes, yearQtr: string) => {
  SheetManager.show('PartnerDetailsSheet', {
    payload: {partner, yearQtr},
  });
};

// Partner Details Sheet Component
export const PartnerDetailsSheet: React.FC = () => {
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
  const [selectedStatus, setSelectedStatus] =
    useState<AppDropdownItem | null>(null);

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
        {label: 'All Categories', value: ''},
        ...Array.from(uniqueCategories)
          .sort()
          .map(cat => ({label: cat, value: cat})),
      ],
      statuses: [
        {label: 'All Statuses', value: ''},
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
          <View className="flex-row items-start justify-between mb-3">
            <View className="flex-1">
              <AppText
                size="base"
                weight="bold"
                className="text-slate-800 dark:text-slate-100 mb-1">
                {item.Series}
              </AppText>
              <View className="flex-row items-center mt-1">
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
              </View>
            </View>
            <AppIcon
              name={isPending ? 'clock' : 'check-circle'}
              type="feather"
              size={20}
              color={isPending ? AppColors.warning : AppColors.success}
            />
          </View>

          <View className="space-y-2">
            <View className="flex-row items-center">
              <AppIcon
                name="tag"
                type="feather"
                size={14}
                color={isDark ? '#94A3B8' : '#64748B'}
              />
              <AppText
                size="xs"
                weight="medium"
                className="text-slate-500 dark:text-slate-400 ml-2">
                Category:
              </AppText>
              <AppText
                size="xs"
                weight="semibold"
                className="text-slate-700 dark:text-slate-300 ml-1">
                {item.Category}
              </AppText>
            </View>

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
        </View>
      );
    },
    [isDark],
  );

  if (!partner) {
    return null;
  }

  return (
    <View>
    <ActionSheet
      id="PartnerDetailsSheet"
      useBottomSafeAreaPadding
      gestureEnabled={false}
      containerStyle={{
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        height: screenHeight * 0.85,
      }}>
      <View>
        {/* Header with Partner Info */}
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
              />
            </View>
            <View className="flex-1">
              <AppDropdown
                data={statuses}
                selectedValue={selectedStatus?.value}
                mode="dropdown"
                placeholder="Status"
                onSelect={setSelectedStatus}
              />
            </View>
          </View>
        </View>
      )}

      {/* Content */}
      <View className="px-4">
        {isLoading ? (
          <View className="py-4">
            <Skeleton width={screenWidth * 0.8} height={100} borderRadius={8} />
            <Skeleton width={screenWidth * 0.8} height={100} borderRadius={8} />
            <Skeleton width={screenWidth * 0.8} height={100} borderRadius={8} />
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
            contentContainerStyle={{paddingTop: 8, paddingBottom: 16}}
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
          />
        )}
      </View>
      </View>
    </ActionSheet>
    </View>
  );
};

export default function DemoPartners() {
  const {params} = useRoute();
  const navigation = useNavigation<AppNavigationProp>();
  const {partners, yearQtr} = params as {
    partners: PartnerTypes[];
    yearQtr: string;
  };

  // Handle navigation to partner details
  const handlePartnerDetails = useCallback(
    (partner: PartnerTypes) => {
      // TODO: Navigate to Partner Details screen when it's implemented
      // For now, you can add navigation logic here
      console.log('Navigate to details for partner:', partner.AGP_Code);
      // navigation.push('DemoPartnerDetails', { partner });
    },
    [navigation],
  );

  // Handle view partner details in ActionSheet
  const handleViewPartner = useCallback((partner: PartnerTypes) => {
    showPartnerDetailsSheet(partner, yearQtr || '');
  }, [yearQtr]);

  // Render item with memoization
  const renderPartnerItem = useCallback(
    ({item}: {item: PartnerTypes}) => (
      <PartnerCard
        item={item}
        onPressDetails={handlePartnerDetails}
        onPressView={handleViewPartner}
      />
    ),
    [handlePartnerDetails, handleViewPartner],
  );

  // Key extractor for FlatList
  const keyExtractor = useCallback(
    (item: PartnerTypes) => item.AGP_Code,
    [],
  );

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
      partners?.reduce((sum, partner) => sum + partner.DemoExecuted, 0) || 0;
    const totalShortfall =
      partners?.reduce((sum, partner) => {
        const diff = partner.TotalCompulsoryDemo - partner.DemoExecuted;
        return sum + (diff >= 0 ? diff : 0);
      }, 0) || 0;

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
        </Card>
      </View>
    );
  }, [partners]);

  return (
    <AppLayout title="Demo Partners" needBack>
      <FlatList
        data={partners}
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
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={true}
        updateCellsBatchingPeriod={50}
      />
    </AppLayout>
  );
}