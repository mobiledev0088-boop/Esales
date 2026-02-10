import {FlatList, TouchableOpacity, View} from 'react-native';
import {memo, useCallback, useMemo, useState} from 'react';
import AppLayout from '../../../../components/layout/AppLayout';
import {DataStateView} from '../../../../components/DataStateView';
import {useNavigation, useRoute} from '@react-navigation/native';
import {AppNavigationProp} from '../../../../types/navigation';
import useQuarterHook from '../../../../hooks/useQuarterHook';
import {handleASINApiCall} from '../../../../utils/handleApiCall';
import {useLoginStore} from '../../../../stores/useLoginStore';
import {useQuery} from '@tanstack/react-query';
import Skeleton from '../../../../components/skeleton/skeleton';
import {screenWidth} from '../../../../utils/constant';
import {
  convertSnakeCaseToSentence,
  convertToASINUnits,
} from '../../../../utils/commonFunctions';
import AppText from '../../../../components/customs/AppText';
import AppDropdown, {
  AppDropdownItem,
} from '../../../../components/customs/AppDropdown';
import Card from '../../../../components/Card';
import Accordion from '../../../../components/Accordion';
import {BarChart, ruleTypes} from 'react-native-gifted-charts';

interface TSPartnerParams {
  Year_Qtr: string;
  AlpType: string;
  Branch: string;
}

interface PartnerData {
  BranchName: string;
  Partner_Name: string;
  Partner_Code: string;
  Activation_Qty: number;
  NonActivation_Qty: number;
  SellOut_Qty: number;
  SellThru_Qty: number;
  Target_Qty: number;
  isParent: null | any;
}

type ChartBar = {
  label?: string;
  value: number;
  frontColor?: string;
  gradientColor?: string;
  spacing?: number;
};

const CHART_COLORS = {
  target: {front: '#3b82f6', gradient: '#60a5fa'},
  sellOut: {front: '#10b981', gradient: '#34d399'},
  sellThru: {front: '#f97316', gradient: '#fb923c'},
  Activation: {front: '#f59e0b', gradient: '#fbbf24'},
  NActivation: {front: '#8b5cf6', gradient: '#a78bfa'},
} as const;

const partnerTypes = [
  {
    label: 'Parent Code',
    value: 'parentcode',
  },
  {
    label: 'Sub Code',
    value: 'subcode',
  },
];

const useGetTrgtVsAchvPartnerTypeWise = (
  YearQtr: string,
  AlpType: string,
  BranchName: string,
) => {
  const {EMP_Code: employeeCode = '', EMP_RoleId: RoleId = ''} = useLoginStore(
    state => state.userInfo,
  );
  const payload = {
    employeeCode,
    RoleId,
    YearQtr,
    AlpType,
    BranchName,
  };
  return useQuery({
    queryKey: ['TrgtVsAchvPartnerTypeWise', [...Object.values(payload)]],
    queryFn: async () => {
      const response = await handleASINApiCall(
        '/TrgtVsAchvDetail/GetTrgtVsAchvPartnerTypeWise_Branch',
        payload,
      );
      const result = response?.DashboardData;
      if (!result?.Status) {
        throw new Error('Failed to fetch activation data');
      }
      return result.Datainfo?.PartnerList || [];
    },
  });
};

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

const QuantityChart = memo(
  ({partner, handlePress}: {partner: PartnerData; handlePress: () => void}) => {
    const chartData: ChartBar[] = useMemo(() => {
      const data: ChartBar[] = [
        {
          label: 'Target',
          value: partner.Target_Qty,
          frontColor: CHART_COLORS.target.front,
          gradientColor: CHART_COLORS.target.gradient,
        },
        {
          label: 'Sell Thru',
          value: partner.SellThru_Qty,
          frontColor: CHART_COLORS.sellThru.front,
          gradientColor: CHART_COLORS.sellThru.gradient,
        },
        {
          label: 'Sell Out',
          value: partner.SellOut_Qty,
          frontColor: CHART_COLORS.sellOut.front,
          gradientColor: CHART_COLORS.sellOut.gradient,
        },
        {
          label: 'Act',
          value: partner.Activation_Qty,
          frontColor: CHART_COLORS.Activation.front,
          gradientColor: CHART_COLORS.Activation.gradient,
        },
        {
          label: 'Non-Act',
          value: partner.NonActivation_Qty,
          frontColor: CHART_COLORS.NActivation.front,
          gradientColor: CHART_COLORS.NActivation.gradient,
        },
      ];
      return data;
    }, [partner]);

    console.log('chartData', chartData);

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

const PartnerCard = memo(
  ({
    partner,
    navigation,
  }: {
    partner: PartnerData;
    navigation: AppNavigationProp;
  }) => {
    // Calculate achievement for quick display
    const achievementPercent = useMemo(() => {
      const target = partner.Target_Qty;
      const sellOut = partner.SellOut_Qty;
      if (target === 0) return 0;
      return Math.round((sellOut / target) * 100);
    }, [partner.Target_Qty, partner.SellOut_Qty]);

    const handlePress = useCallback(() => {
      let AGP_Code = partner.Partner_Code;
      console.log('Navigating with AGP_Code:', AGP_Code);
      navigation.push('TargetPartnerDashboard', {partner: {AGP_Code}});
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
                Partner Name
              </AppText>
              <AppText size="sm" weight="bold" numberOfLines={1}>
                {partner.Partner_Name || 'N/A'}
              </AppText>
            </View>
          </View>

          {/* Second row */}
          <View className="flex-row">
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
              {convertToASINUnits(partner.Target_Qty)}
            </AppText>
          </View>
          <View className="flex-1">
            <AppText size="xs" color="gray">
              Sell Out
            </AppText>
            <AppText size="xs" weight="semibold" className="mt-0.5 text-green-500">
              {convertToASINUnits(partner.SellOut_Qty)}
            </AppText>
          </View>
          <View className="flex-1">
            <AppText size="xs" color="gray">
              Sell Thru
            </AppText>
            <AppText size="xs" weight="semibold" className="mt-0.5 text-orange-500">
              {convertToASINUnits(partner.SellThru_Qty)}
            </AppText>
          </View>
          <View className="flex-1">
            <AppText size="xs" color="gray">
              Act
            </AppText>
            <AppText size="xs" weight="semibold" className="mt-0.5 text-blue-500">
              {convertToASINUnits(partner.Activation_Qty)}
            </AppText>
          </View>
          <View className="flex-1">
            <AppText size="xs" color="gray">
              Non-Act
            </AppText>
            <AppText size="xs" weight="semibold" className="mt-0.5 text-red-500">
              {convertToASINUnits(partner.NonActivation_Qty)}
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

export default function TargetSummaryPartner() {
  const navigation = useNavigation<AppNavigationProp>();
  const route = useRoute();
  const {Year_Qtr, AlpType, Branch} = route.params as TSPartnerParams;
  const {quarters, selectedQuarter, setSelectedQuarter} =
    useQuarterHook(Year_Qtr);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPartnerType, setSelectedPartnerType] =
    useState<AppDropdownItem | null>(null);

  const {
    data: partnerData,
    isLoading,
    isError,
    refetch,
  } = useGetTrgtVsAchvPartnerTypeWise(Year_Qtr, AlpType, Branch);
  console.log('partnerASEData', partnerData);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const filteredFullData = useMemo(() => {
    if (!partnerData?.length) return partnerData ?? [];
    const type = selectedPartnerType?.value;
    if (!type) return partnerData;
    const shouldHaveParent = type === 'parentcode';
    return partnerData.filter((item: PartnerData) =>
      shouldHaveParent ? item.isParent !== null : item.isParent === null,
    );
  }, [partnerData, selectedPartnerType?.value]);

  const renderItem = useCallback(
    ({item}: {item: PartnerData}) => (
      <PartnerCard partner={item} navigation={navigation} />
    ),
    [],
  );
  const renderLoadingSkeleton = useCallback(
    () => (
      <View className="flex-1">
        <View className="flex-row justify-between mb-3">
          <Skeleton width={screenWidth * 0.45} height={50} borderRadius={8} />
          <Skeleton width={screenWidth * 0.45} height={50} borderRadius={8} />
        </View>
        {[...Array(10)].map((_, i) => (
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

  const keyExtractor = useCallback(
    (item: PartnerData, index: number) => `${item.Partner_Code}_${index}`,
    [],
  );

  return (
    <AppLayout
      title="Target Partner Wise"
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
          <View className="px-3 py-3 bg-white dark:bg-darkCard border-b border-gray-200 dark:border-darkBorder">
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
            <View className="flex-row gap-2">
              <View className="flex-[5]">
                <AppDropdown
                  data={partnerTypes}
                  mode="dropdown"
                  placeholder="Partners"
                  selectedValue={selectedPartnerType?.value}
                  onSelect={setSelectedPartnerType}
                />
              </View>
              <View className="flex-[3]">
                <AppDropdown
                  data={quarters}
                  mode="dropdown"
                  placeholder="Select Quarter"
                  selectedValue={selectedQuarter?.value}
                  onSelect={setSelectedQuarter}
                />
              </View>
            </View>
            <View className="mt-2 flex-row justify-between items-center"></View>
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
