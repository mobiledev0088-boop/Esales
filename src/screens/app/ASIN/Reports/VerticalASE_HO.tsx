import {memo, useMemo, useState, useCallback} from 'react';
import {View, FlatList, TouchableOpacity} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import {useRoute, RouteProp, useNavigation} from '@react-navigation/native';
import {BarChart, ruleTypes} from 'react-native-gifted-charts';
import AppLayout from '../../../../components/layout/AppLayout';
import Card from '../../../../components/Card';
import AppText from '../../../../components/customs/AppText';
import AppDropdown, {
  AppDropdownItem,
} from '../../../../components/customs/AppDropdown';
import Accordion from '../../../../components/Accordion';
import {useLoginStore} from '../../../../stores/useLoginStore';
import {handleASINApiCall} from '../../../../utils/handleApiCall';
import {
  convertSnakeCaseToSentence,
  convertToASINUnits,
  getPastMonths,
} from '../../../../utils/commonFunctions';
import {screenWidth} from '../../../../utils/constant';
import Skeleton from '../../../../components/skeleton/skeleton';
import {DataStateView} from '../../../../components/DataStateView';
import {AppNavigationProp} from '../../../../types/navigation';

// -------------------- Constants --------------------
const CHART_COLORS = {
  target: {front: '#3b82f6', gradient: '#60a5fa'},
  sellOut: {front: '#10b981', gradient: '#34d399'},
  eActivation: {front: '#f59e0b', gradient: '#fbbf24'},
  iActivation: {front: '#8b5cf6', gradient: '#a78bfa'},
} as const;

// -------------------- Types --------------------
type VerticalASE_HOParams = {
  Year: string;
  Month: string;
  AlpType: string;
  Branch?: string;
};
interface PartnerASEData {
  IchannelID: string;
  ASE_Name: string;
  Partner_Code: string;
  Partner_Name: string;
  Target_Qty: number;
  SellOut_Qty: number;
  EActivation_Qty: number;
  IActivation_Qty: number;
}

type ChartBar = {
  label?: string;
  value: number;
  frontColor?: string;
  gradientColor?: string;
  spacing?: number;
};

const API_ENDPOINT = {
  PartnerTypeWise:
    '/TrgtVsAchvDetail/GetTrgtVsAchvPartnerTypeWiseASE_HO_MonthWise',
  branchWise:
    '/TrgtVsAchvDetail/GetTrgtVsAchvPartnerTypeWiseASE_Branch_MonthWise',
};

// -------------------- API Hook --------------------
const useGetTrgtVsAchvPartnerTypeWise = (
  YearQtr: string,
  AlpType: string,
  branchName?: string,
) => {
  const {EMP_Code: employeeCode = '', EMP_RoleId: RoleId = ''} = useLoginStore(
    state => state.userInfo,
  );
  const end_point = branchName
    ? API_ENDPOINT.branchWise
    : API_ENDPOINT.PartnerTypeWise;
  console.log('Fetching VerticalASE_HO with params:', {end_point, branchName});
  return useQuery({
    queryKey: [
      'getTrgtVsAchvPartnerTypeWise',
      employeeCode,
      RoleId,
      YearQtr,
      AlpType,
      branchName,
    ],
    queryFn: async () => {
      const response = await handleASINApiCall(end_point, {
        employeeCode,
        RoleId,
        YearQtr,
        AlpType,
        branchName,
      });
      const result = response?.DashboardData;
      if (!result?.Status) {
        throw new Error('Failed to fetch activation data');
      }
      return result.Datainfo?.PartnerList || [];
    },
  });
};

// -------------------- Helpers --------------------
const parseNumber = (value: unknown): number => {
  if (value === null || value === undefined || value === '' || value === '-')
    return 0;
  const num = Number(String(value).replace(/[,\s]/g, ''));
  return isFinite(num) ? num : 0;
};

// Compute nice axis values for clean chart visualization
const computeAxisMetrics = (values: number[]) => {
  const maxRaw = Math.max(0, ...values);
  if (maxRaw === 0) {
    return {maxValue: 1, stepValue: 1, noOfSections: 1};
  }

  const targetSections = 5;
  const roughStep = maxRaw / targetSections;
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const leading = roughStep / magnitude;
  let niceLeading: number;
  if (leading <= 1) niceLeading = 1;
  else if (leading <= 2) niceLeading = 2;
  else if (leading <= 2.5) niceLeading = 2.5;
  else if (leading <= 5) niceLeading = 5;
  else niceLeading = 10;
  let stepValue = niceLeading * magnitude;

  let maxValue = stepValue * targetSections;
  while (maxValue < maxRaw) {
    maxValue += stepValue;
  }
  const noOfSections = Math.round(maxValue / stepValue);
  return {maxValue, stepValue, noOfSections};
};

// -------------------- Components --------------------

// Quantity metrics chart component
const QuantityChart = memo(
  ({
    partner,
    handlePress,
  }: {
    partner: PartnerASEData;
    handlePress: () => void;
  }) => {
    const chartData: ChartBar[] = useMemo(() => {
      const data: ChartBar[] = [
        {
          label: 'Target',
          value: parseNumber(partner.Target_Qty),
          frontColor: CHART_COLORS.target.front,
          gradientColor: CHART_COLORS.target.gradient,
        },
        {
          label: 'SellOut',
          value: parseNumber(partner.SellOut_Qty),
          frontColor: CHART_COLORS.sellOut.front,
          gradientColor: CHART_COLORS.sellOut.gradient,
        },
        {
          label: 'E-Act',
          value: parseNumber(partner.EActivation_Qty),
          frontColor: CHART_COLORS.eActivation.front,
          gradientColor: CHART_COLORS.eActivation.gradient,
        },
        {
          label: 'I-Act',
          value: parseNumber(partner.IActivation_Qty),
          frontColor: CHART_COLORS.iActivation.front,
          gradientColor: CHART_COLORS.iActivation.gradient,
        },
      ];
      return data;
    }, [partner]);

    const axis = useMemo(() => {
      const values = chartData.map(b => b.value).filter(v => v > 0);
      return computeAxisMetrics(values.length ? values : [0]);
    }, [chartData]);

    // Generate y-axis labels
    const yAxisLabelTexts = useMemo(() => {
      const labels: string[] = [];
      for (let i = 0; i <= axis.noOfSections; i++) {
        labels.push(convertToASINUnits(Math.round((axis.stepValue || 1) * i)));
      }
      return labels;
    }, [axis.noOfSections, axis.stepValue]);

    return (
      <View className="mt-2">
        {/* Compact bar chart with proper spacing */}
        <BarChart
          data={chartData}
          barWidth={28}
          spacing={45}
          initialSpacing={16}
          width={screenWidth * 0.67}
          barBorderRadius={4}
          showGradient
          yAxisThickness={0}
          xAxisType={ruleTypes.DASHED}
          xAxisColor={'lightgray'}
          stepValue={axis.stepValue}
          noOfSections={axis.noOfSections}
          maxValue={axis.maxValue}
          labelWidth={50}
          yAxisLabelTexts={yAxisLabelTexts}
          yAxisTextStyle={{fontSize: 9, color: 'gray'}}
          xAxisLabelTextStyle={{
            fontSize: 10,
            color: 'gray',
            marginTop: 4,
            marginRight: 15,
            fontWeight: '800',
          }}
          height={150}
        />
        <TouchableOpacity className="mt-2 items-end" onPress={handlePress}>
          <AppText className="underline" color="primary" weight="bold">
            See More
          </AppText>
        </TouchableOpacity>
      </View>
    );
  },
);

// Optimized partner card component with proper memoization
const PartnerCard = memo(
  ({
    partner,
    navigation,
  }: {
    partner: PartnerASEData;
    navigation: AppNavigationProp;
  }) => {
    // Calculate achievement for quick display
    const achievementPercent = useMemo(() => {
      const target = parseNumber(partner.Target_Qty);
      const sellOut = parseNumber(partner.SellOut_Qty);
      if (target === 0) return 0;
      return Math.round((sellOut / target) * 100);
    }, [partner.Target_Qty, partner.SellOut_Qty]);

    const handlePress = useCallback(() => {
      let AGP_Code = partner.Partner_Code;
      console.log('Navigating with AGP_Code:', AGP_Code);
      navigation.navigate('TargetPartnerDashboard', {partner: {AGP_Code}});
    }, [partner.Partner_Code, navigation]);
    return (
      <Card className="mb-3">
        {/* Partner name header */}
        <View className="">
          <AppText
            size="base"
            weight="bold"
            className="text-gray-900 dark:text-gray-100">
            {partner.Partner_Name || 'N/A'}
          </AppText>
        </View>

        {/* Grid layout - 2 rows x 2 columns */}
        <View className="py-3">
          {/* First row */}
          <View className="flex-row mb-3">
            <View className="flex-1 pr-2">
              <AppText size="xs" color="gray" className="mb-1">
                Partner Code
              </AppText>
              <AppText size="sm" weight="bold" numberOfLines={1}>
                {partner.Partner_Code || 'N/A'}
              </AppText>
            </View>
            <View className="flex-1 pl-2">
              <AppText size="xs" color="gray" className="mb-1">
                ASE Name
              </AppText>
              <AppText size="sm" weight="bold" numberOfLines={1}>
                {partner.ASE_Name || 'N/A'}
              </AppText>
            </View>
          </View>

          {/* Second row */}
          <View className="flex-row">
            <View className="flex-1 pr-2">
              <AppText size="xs" color="gray" className="mb-1">
                Channel ID
              </AppText>
              <AppText size="sm" weight="bold" numberOfLines={1}>
                {partner.IchannelID || 'N/A'}
              </AppText>
            </View>
            <View className="flex-1 pl-2">
              <AppText size="xs" color="gray" className="mb-1">
                Achievement
              </AppText>
              <AppText
                size="sm"
                weight="bold"
                numberOfLines={1}
                className={
                  achievementPercent >= 100
                    ? 'text-green-600'
                    : 'text-orange-600'
                }>
                {achievementPercent}%
              </AppText>
            </View>
          </View>
        </View>

        {/* Compact metrics grid */}
        <View className="pb-2 flex-row justify-between bg-white dark:bg-darkCard">
          <View className="flex-1">
            <AppText size="xs" color="gray">
              Target
            </AppText>
            <AppText size="xs" weight="semibold" className="mt-0.5">
              {convertToASINUnits(parseNumber(partner.Target_Qty))}
            </AppText>
          </View>
          <View className="flex-1">
            <AppText size="xs" color="gray">
              SellOut
            </AppText>
            <AppText
              size="xs"
              weight="semibold"
              className="mt-0.5 text-green-600">
              {convertToASINUnits(parseNumber(partner.SellOut_Qty))}
            </AppText>
          </View>
          <View className="flex-1">
            <AppText size="xs" color="gray">
              E-Act
            </AppText>
            <AppText
              size="xs"
              weight="semibold"
              className="mt-0.5 text-orange-600">
              {convertToASINUnits(parseNumber(partner.EActivation_Qty))}
            </AppText>
          </View>
          <View className="flex-1">
            <AppText size="xs" color="gray">
              I-Act
            </AppText>
            <AppText
              size="xs"
              weight="semibold"
              className="mt-0.5 text-purple-600">
              {convertToASINUnits(parseNumber(partner.IActivation_Qty))}
            </AppText>
          </View>
        </View>

        {/* Collapsible chart section - minimal header */}
        <Accordion
          header={
            <AppText
              size="xs"
              weight="semibold"
              className="text-gray-600 dark:text-gray-400">
              View Chart
            </AppText>
          }
          containerClassName="border-t border-gray-100 dark:border-darkBorder"
          headerClassName="py-1.5"
          contentClassName="pb-2"
          needBottomBorder={false}
          needShadow={false}
          arrowSize={18}
          initialOpening={false}>
          <QuantityChart partner={partner} handlePress={handlePress} />
        </Accordion>
      </Card>
    );
  },
);

// -------------------- Main Component --------------------
export default function VerticalASE_HO() {
  const navigation = useNavigation<AppNavigationProp>();
  const route = useRoute<RouteProp<{params: VerticalASE_HOParams}, 'params'>>();
  const {Year, Month, AlpType, Branch} = route.params;
  const YearQtr = `${Year}${Month}`;

  // Generate month options
  const monthOptions = useMemo<AppDropdownItem[]>(
    () => getPastMonths(6, false, YearQtr),
    [YearQtr],
  );

  // Filter and pagination states
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<AppDropdownItem | null>(
    monthOptions[0],
  );
  const [refreshing, setRefreshing] = useState(false);

  // Fetch data
  const {
    data: partnerASEData,
    isLoading,
    isError,
    refetch,
  } = useGetTrgtVsAchvPartnerTypeWise(
    selectedMonth?.value || YearQtr,
    AlpType,
    Branch,
  );

  // Generate partner dropdown options
  const partnerOptions = useMemo<AppDropdownItem[]>(() => {
    if (!partnerASEData) return [];
    return Array.from(
      new Map(
        partnerASEData.map((item: PartnerASEData) => [
          item.Partner_Code,
          {
            label: `${item.Partner_Name} (${item.Partner_Code})`,
            value: item.Partner_Code,
          },
        ]),
      ).values(),
    ) as AppDropdownItem[];
  }, [partnerASEData]);

  // Filter data based on selected partner (full dataset)
  const filteredFullData = useMemo(() => {
    if (!partnerASEData) return [];
    if (!selectedPartner) return partnerASEData;
    return partnerASEData.filter(
      (item: PartnerASEData) => item.Partner_Code === selectedPartner,
    );
  }, [partnerASEData, selectedPartner]);

  // Pull to refresh handler - resets pagination
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Optimized render item with useCallback
  const renderItem = useCallback(
    ({item}: {item: PartnerASEData}) => (
      <PartnerCard partner={item} navigation={navigation} />
    ),
    [],
  );

  // Optimized key extractor
  const keyExtractor = useCallback(
    (item: PartnerASEData, index: number) =>
      `${item.Partner_Code}_${item.IchannelID}_${index}`,
    [],
  );

  // Loading skeleton
  const renderLoadingSkeleton = useCallback(
    () => (
      <View className="flex-1">
        <View className="flex-row justify-between mb-3">
          <Skeleton width={screenWidth * 0.45} height={50} borderRadius={8} />
          <Skeleton width={screenWidth * 0.45} height={50} borderRadius={8} />
        </View>
        {[...Array(4)].map((_, i) => (
          <Skeleton
            key={i}
            width={screenWidth - 28}
            height={200}
            borderRadius={8}
          />
        ))}
      </View>
    ),
    [],
  );

  // Main render
  return (
    <AppLayout
      title="ASE Partner List"
      needPadding={false}
      needBack
      needScroll={false}>
      <DataStateView
        isLoading={isLoading}
        isError={isError}
        onRetry={onRefresh}
        LoadingComponent={renderLoadingSkeleton()}
        isEmpty={!isLoading && filteredFullData.length === 0}>
        <View className="flex-1 bg-gray-50 dark:bg-darkBg">
          {/* Filter section - only show when data is loaded */}
          <View className="px-3 py-3 bg-white dark:bg-darkCard border-b border-gray-200 dark:border-darkBorder">
            {!!Branch && (
              <View className="mb-3 rounded-lg border border-gray-200 dark:border-darkBorder bg-gray-50/80 dark:bg-darkBg px-3 py-2">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 mr-2">
                    <AppText size="xs" color="gray" className="mb-0.5">
                      Branch
                    </AppText>
                    <AppText
                      size="sm"
                      weight="semibold"
                      numberOfLines={2}
                      className="text-gray-900 dark:text-gray-100">
                      {convertSnakeCaseToSentence(Branch)}
                    </AppText>
                  </View>
                  <View className="w-px h-8 bg-gray-200 dark:bg-darkBorder" />
                  <View className="flex-1 ml-2">
                    <AppText size="xs" color="gray" className="mb-0.5">
                      ALP Type
                    </AppText>
                    <AppText
                      size="sm"
                      weight="semibold"
                      numberOfLines={2}
                      className="text-gray-900 dark:text-gray-100">
                      {convertSnakeCaseToSentence(AlpType)}
                    </AppText>
                  </View>
                </View>
              </View>
            )}
            <View className="flex-row gap-2">
              <View className="flex-[5]">
                <AppDropdown
                  data={partnerOptions}
                  mode="autocomplete"
                  placeholder="All Partners"
                  selectedValue={selectedPartner}
                  onSelect={item => setSelectedPartner(item?.value || null)}
                  allowClear
                  onClear={() => setSelectedPartner(null)}
                  searchPlaceholder="Search partner..."
                />
              </View>
              <View className="flex-[3]">
                <AppDropdown
                  data={monthOptions}
                  mode="dropdown"
                  placeholder="Select Month"
                  selectedValue={selectedMonth?.value}
                  onSelect={setSelectedMonth}
                />
              </View>
            </View>
            <View className="mt-2 flex-row justify-between items-center">
              <AppText size="xs" color="gray">
                Total {filteredFullData.length} partners
                {selectedPartner &&
                  ` (filtered from ${partnerASEData.length} total)`}
              </AppText>
            </View>
          </View>

          {/* Partner list with pagination and optimized performance */}
          <FlatList
            data={filteredFullData}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={{padding: 12, paddingBottom: 16}}
            showsVerticalScrollIndicator={false}
            initialNumToRender={20}
            maxToRenderPerBatch={20}
            windowSize={7}
            removeClippedSubviews={true}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        </View>
      </DataStateView>
    </AppLayout>
  );
}
