import {FlatList, Text, TouchableOpacity, View} from 'react-native';
import AppLayout from '../../../../components/layout/AppLayout';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {AppNavigationProp} from '../../../../types/navigation';
import {memo, useCallback, useEffect, useMemo, useState} from 'react';
import AppDropdown, {AppDropdownItem} from '../../../../components/customs/AppDropdown';
import AppText from '../../../../components/customs/AppText';
import {convertToASINUnits} from '../../../../utils/commonFunctions';
import Card from '../../../../components/Card';
import Accordion from '../../../../components/Accordion';
import {BarChart, ruleTypes} from 'react-native-gifted-charts';
import {screenWidth} from '../../../../utils/constant';
import Skeleton from '../../../../components/skeleton/skeleton';

interface PartnerASEData {
  IchannelID: string;
  ASE_Name: string;
  Partner_Code: string;
  Partner_Name: string;
  Target_Qty: number;
  Sellout_Qty: number;
  Activaton_Qty: number;
  H_Rate: number;
}

type VerticalASE_HOParams = {
  aseData: PartnerASEData[];
};

type ChartBar = {
  label?: string;
  value: number;
  frontColor?: string;
  gradientColor?: string;
  spacing?: number;
};

// -------------------- Constants --------------------
const CHART_COLORS = {
  target: {front: '#3b82f6', gradient: '#60a5fa'},
  sellOut: {front: '#10b981', gradient: '#34d399'},
  eActivation: {front: '#f59e0b', gradient: '#fbbf24'},
  iActivation: {front: '#8b5cf6', gradient: '#a78bfa'},
} as const;

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
          value: parseNumber(partner.Sellout_Qty),
          frontColor: CHART_COLORS.sellOut.front,
          gradientColor: CHART_COLORS.sellOut.gradient,
        },
        {
          label: 'E-Act',
          value: parseNumber(partner.Activaton_Qty),
          frontColor: CHART_COLORS.eActivation.front,
          gradientColor: CHART_COLORS.eActivation.gradient,
        },
        {
          label: 'I-Act',
          value: parseNumber(partner.Activaton_Qty),
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
      const sellOut = parseNumber(partner.Sellout_Qty);
      if (target === 0) return 0;
      return Math.round((sellOut / target) * 100);
    }, [partner.Target_Qty, partner.Sellout_Qty]);

    const handlePress = useCallback(() => {
      console.log(
        'Navigating to TargetPartnerDashboard with AGP_Code:',
        partner,
      );
      if (partner.IchannelID) {
        let {IchannelID, ASE_Name} = partner;
        navigation.push('TargetASEDashboard', {
          partner: {IchannelID, ASE_Name},
        });
      } else {
        let AGP_Code = partner.Partner_Code;
        navigation.push('TargetPartnerDashboard', {partner: {AGP_Code}});
      }
    }, [partner.Partner_Name, navigation]);
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
            <View className="flex-1">
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
              {convertToASINUnits(parseNumber(partner.Sellout_Qty))}
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
              {convertToASINUnits(parseNumber(partner.Activaton_Qty))}
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
              {convertToASINUnits(parseNumber(partner.Activaton_Qty))}
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

const LoadingComponent = () => (
  <View className="flex-1">
    <View className="flex-row justify-between mb-3">
      <Skeleton width={screenWidth * 0.45} height={50} borderRadius={8} />
      <Skeleton width={screenWidth * 0.45} height={50} borderRadius={8} />
    </View>
    <View className="px-3">
      {[...Array(4)].map((_, i) => (
        <Skeleton
          key={i}
          width={screenWidth - 28}
          height={200}
          borderRadius={8}
        />
      ))}
    </View>
  </View>
);

export default function VerticalASE() {
  const navigation = useNavigation<AppNavigationProp>();
  const route = useRoute<RouteProp<{params: VerticalASE_HOParams}, 'params'>>();
  const {aseData = []} = route.params;

  // Filter and pagination states
  const [selectedPartner, setSelectedPartner] =
    useState<AppDropdownItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading delay for better UX
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  const partnerOptions = useMemo<AppDropdownItem[]>(() => {
      if (!aseData) return [];
      return Array.from(
        new Map(
          aseData.map((item: PartnerASEData) => [
            item.Partner_Code,
            {
              label: `${item.Partner_Name}`,
              value: item.Partner_Name,
            },
          ]),
        ).values(),
      ) as AppDropdownItem[];
    }, [aseData]);

  // Filter data based on selected partner (full dataset)
  const filteredFullData = useMemo(() => {
    if (!aseData) return [];
    if (!selectedPartner) return aseData;
    return aseData.filter(
      (item: PartnerASEData) => item.Partner_Name === selectedPartner.value,
    );
  }, [aseData, selectedPartner]);

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

  // Main render
  return (
    <AppLayout
      title="ASE Partner List"
      needPadding={false}
      needBack
      needScroll={false}>
      {isLoading ? (
        <LoadingComponent />
      ) : (
        <View className="flex-1 bg-lightBg-base dark:bg-darkBg-base">
          <View className="px-3 my-4">
            <AppDropdown
              data={partnerOptions}
              mode="autocomplete"
              placeholder="All Partners"
              selectedValue={selectedPartner?.value}
              onSelect={setSelectedPartner}
              allowClear
              onClear={() => setSelectedPartner(null)}
              searchPlaceholder="Search partner..."
            />
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
            ListEmptyComponent={
              <View>
                <AppText size="sm" color="gray" className="text-center mt-10">
                  No partners found for the selected filters.
                </AppText>
              </View>
            }
          />
        </View>
      )}
    </AppLayout>
  );
}
