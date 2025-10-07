import {memo, useMemo, useState} from 'react';
import {View} from 'react-native';
import {useRoute} from '@react-navigation/native';
import AppLayout from '../../../../../components/layout/AppLayout';
import Card from '../../../../../components/Card';
import AppText from '../../../../../components/customs/AppText';
import {BarChart, ruleTypes} from 'react-native-gifted-charts';
import {convertToASINUnits} from '../../../../../utils/commonFunctios';
// (Removed unused screenWidth import)

// -------------------- Types --------------------
interface PartnerDetails {
  Shop_Name: string;
  Partner_Type: string;
  Sub_Code?: string;
  Parent_Code?: string;
  Region?: string;
  Branch?: string;
  Territory?: string;
  Remark?: string;
  Credit_Validation?: string;
  Average_Sales_Of_Months?: number | string;
  Credit_Limit?: number | string;
  Average_Limit_Percent?: number | string;
  Credit_Average_Sales_Diff?: number | string;
  Month_Name?: string;
  Parent_Credit_Month?: number | string;
  Sub_Credit_Month?: number | string;
  Month_Name_1?: string;
  Parent_Credit_Month_1?: number | string;
  Sub_Credit_Month1?: number | string;
  Month_Name_2?: string;
  Parent_Credit_Month_2?: number | string;
  Sub_Credit_Month2?: number | string;
  Month_Name_3?: string;
  Parent_Credit_Month_3?: number | string;
  Sub_Credit_Month3?: number | string;
  Month_Name_4?: string;
  Parent_Credit_Month_4?: number | string;
  Sub_Credit_Month4?: number | string;
  Month_Name_5?: string;
  Parent_Credit_Month_5?: number | string;
  Sub_Credit_Month5?: number | string;
  // Allow dynamic key access (e.g. partner[`Month_Name_${i}`])
  [key: string]: unknown;
}

type ChartBar = {
  label?: string;
  value: number;
  frontColor?: string;
  gradientColor?: string;
  spacing?: number;
};

// -------------------- Helpers --------------------
const parseNumber = (value: unknown): number => {
  if (value === null || value === undefined || value === '' || value === '-')
    return 0;
  const num = Number(String(value).replace(/[,\s]/g, ''));
  return isFinite(num) ? num : 0;
};

// Produce “nice” axis tick/step values given an array of numbers
const computeAxisMetrics = (values: number[]) => {
  const maxRaw = Math.max(0, ...values);
  if (maxRaw === 0) {
    return {maxValue: 1, stepValue: 1, noOfSections: 1};
  }

  // Target sections for readability (can adapt if very small/large)
  const targetSections = 6;
  const roughStep = maxRaw / targetSections;
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const leading = roughStep / magnitude; // between 1 and 10
  let niceLeading: number;
  if (leading <= 1) niceLeading = 1;
  else if (leading <= 2) niceLeading = 2;
  else if (leading <= 2.5) niceLeading = 2.5;
  else if (leading <= 5) niceLeading = 5;
  else niceLeading = 10;
  let stepValue = niceLeading * magnitude;

  // Adjust maxValue upward to multiple of stepValue covering maxRaw
  let maxValue = stepValue * targetSections;
  while (maxValue < maxRaw) {
    maxValue += stepValue;
  }
  const noOfSections = Math.round(maxValue / stepValue);
  return {maxValue, stepValue, noOfSections};
};

const DetailRow = memo(({label, value}: {label: string; value: any}) => (
  <View className="flex-row justify-between items-center py-2 border-b border-gray-200 dark:border-darkBorder last:border-b-0">
    <AppText size="xs" color="gray" numberOfLines={1} className="pr-2">
      {label}
    </AppText>
    <AppText
      size="sm"
      weight="semibold"
      className="text-right flex-1"
      numberOfLines={1}>
      {value === undefined || value === null || value === '' ? 'N/A' : value}
    </AppText>
  </View>
));

export default function PartnerCreditLimitDetails() {
  const {params} = useRoute<any>();
  const partner: PartnerDetails | null = params?.partner || null;
  const [focusedBar, setFocusedBar] = useState<number | null>(null);

  const salesData: ChartBar[] = useMemo(() => {
    if (!partner) return [];
    const data: ChartBar[] = [];
    for (let i = 0; i < 6; i++) {
      const monthKey = `Month_Name${i === 0 ? '' : `_${i}`}`;
      const parentKey = `Parent_Credit_Month${i === 0 ? '' : `_${i}`}`;
      // Sub credit months have inconsistent naming (no underscore before index after first)
      const subKeyUnderscore = `Sub_Credit_Month${i === 0 ? '' : `_${i}`}`; // pattern used in code
      const subKeyNoUnderscore = `Sub_Credit_Month${i === 0 ? '' : `${i}`}`; // actual (observed) API pattern
      const label = (partner[monthKey] as string) || '';
      const parentVal = parseNumber(partner[parentKey]);
      const subVal = parseNumber(
        partner[subKeyUnderscore] ?? partner[subKeyNoUnderscore],
      );

      // Push parent bar
      data.push({
        label,
        value: parentVal,
        frontColor: '#006DFF',
        gradientColor: '#009FFF',
        spacing: 4,
      });
      // Push sub bar
      data.push({
        value: subVal,
        frontColor: '#ef4444',
        gradientColor: '#f87171',
      });
    }
    // Remove trailing bars where both parent & sub are zero (optional trim)
    while (
      data.length >= 2 &&
      data[data.length - 1].value === 0 &&
      data[data.length - 2].value === 0
    ) {
      data.pop();
      data.pop();
    }
    return data;
  }, [partner]);

  const axis = useMemo(() => {
    const values = salesData.map(b => b.value).filter(v => v > 0);
    return computeAxisMetrics(values.length ? values : [0]);
  }, [salesData]);

  // Add a headroom (one step) so tallest bar leaves space for tooltip
  const chartAxis = useMemo(() => {
    if (!axis.stepValue) return axis;
    return {
      stepValue: axis.stepValue,
      maxValue: axis.maxValue + axis.stepValue, // add one step of headroom
      noOfSections: axis.noOfSections + 1, // reflect added step in section count
    };
  }, [axis]);

  // Pre-compute y-axis label texts based on computed axis metrics
  const yAxisLabelTexts = useMemo(() => {
    const labels: string[] = [];
    for (let i = 0; i <= chartAxis.noOfSections; i++) {
      labels.push(
        convertToASINUnits(Math.round((chartAxis.stepValue || 1) * i)),
      );
    }
    return labels;
  }, [chartAxis.noOfSections, chartAxis.stepValue]);

  // Bars with press handler to show tooltip
  const interactiveData = useMemo(
    () =>
      salesData.map((bar, index) => ({
        ...bar,
        onPress: () => setFocusedBar(prev => (prev === index ? null : index)), // toggle selection
      })),
    [salesData],
  );

  const tooltip = useMemo(() => {
    if (focusedBar === null) return null;
    const bar = salesData[focusedBar];
    return (
      <View
        style={{
          paddingHorizontal: 8,
          paddingVertical: 4,
          backgroundColor: 'rgba(0,0,0,0.8)',
          borderRadius: 6,
        }}>
        <AppText size="xs" weight="semibold" className="text-white">
          {convertToASINUnits(bar.value)}
        </AppText>
      </View>
    );
  }, [focusedBar, salesData]);

  const utilization = useMemo(() => {
    const val = Number(partner?.Average_Limit_Percent);
    if (!isFinite(val)) return 0;
    return Math.min(100, Math.max(0, Math.round(val)));
  }, [partner?.Average_Limit_Percent]);

  return (
    <AppLayout
      title={partner?.Shop_Name || 'Partner'}
      needBack
      needPadding
      needScroll>
      {!partner ? (
        <View className="flex-1 items-center justify-center py-20">
          <AppText size="sm" color="gray">
            Partner information not provided.
          </AppText>
        </View>
      ) : (
        <View className="gap-4 py-5">
          {/* Shop Details */}
          <Card className="px-4 py-4 rounded-xl">
            <AppText size="lg" weight="extraBold" className="mb-2">
              Shop Details
            </AppText>
            <DetailRow label="Region" value={partner.Region} />
            <DetailRow label="Branch" value={partner.Branch} />
            <DetailRow label="Territory" value={partner.Territory} />
            <DetailRow label="Parent Code" value={partner.Parent_Code} />
            {partner.Sub_Code ? (
              <DetailRow label="Sub Code" value={partner.Sub_Code} />
            ) : null}
            <DetailRow label="Partner Type" value={partner.Partner_Type} />
            <DetailRow label="Remarks" value={partner.Remark} />
          </Card>

          {/* Credit Details */}
          <Card className="px-4 py-4 rounded-xl">
            <AppText size="lg" weight="extraBold" className="mb-2">
              Credit Details
            </AppText>
            <DetailRow
              label="Credit Limit"
              value={convertToASINUnits(Number(partner.Credit_Limit || 0))}
            />
            <DetailRow
              label="Avg Sales (6m)"
              value={convertToASINUnits(
                Number(partner.Average_Sales_Of_Months || 0),
              )}
            />
            <DetailRow
              label="Difference (Avg - Limit)"
              value={convertToASINUnits(
                Number(partner.Credit_Average_Sales_Diff || 0),
              )}
            />
            <DetailRow
              label="Credit Sufficient"
              value={partner.Credit_Validation}
            />
            <View className="mt-2">
              <View className="flex-row justify-between items-center mb-1">
                <AppText size="xs" color="gray">
                  Utilization %
                </AppText>
                <AppText size="xs" weight="semibold">
                  {utilization}%
                </AppText>
              </View>
              <View className="h-2 rounded-full bg-gray-200 dark:bg-darkBorder overflow-hidden">
                <View
                  className="h-full bg-[#009FFF] dark:bg-white"
                  style={{width: `${utilization}%`}}
                />
              </View>
            </View>
          </Card>

          {/* Chart */}
          <Card className="px-4 py-4 rounded-xl">
            <AppText size="lg" weight="extraBold" className="mb-1">
              Sales vs Target (Last 6 Months)
            </AppText>
            <View className="flex-row items-center gap-4 mt-2 mb-3">
              <View className="flex-row items-center">
                <View
                  className="w-3 h-3 rounded-sm mr-2"
                  style={{backgroundColor: '#009FFF'}}
                />
                <AppText size="xs" color="gray">
                  Parent Code
                </AppText>
              </View>
              <View className="flex-row items-center">
                <View
                  className="w-3 h-3 rounded-sm mr-2"
                  style={{backgroundColor: '#ef4444'}}
                />
                <AppText size="xs" color="gray">
                  Sub Code
                </AppText>
              </View>
            </View>
            {salesData.length === 0 ? (
              <View className="py-6 items-center">
                <AppText size="xs" color="gray">
                  No sales data available
                </AppText>
              </View>
            ) : (
              <>
                <BarChart
                  data={interactiveData}
                  barWidth={16}
                  initialSpacing={10}
                  spacing={14}
                  barBorderRadius={4}
                  showGradient
                  yAxisThickness={0}
                  xAxisType={ruleTypes.DASHED}
                  xAxisColor={'lightgray'}
                  stepValue={chartAxis.stepValue}
                  noOfSections={chartAxis.noOfSections}
                  maxValue={chartAxis.maxValue}
                  labelWidth={44}
                  yAxisLabelTexts={yAxisLabelTexts}
                  focusedBarIndex={focusedBar ?? -1}
                  renderTooltip={() => tooltip}
                  yAxisTextStyle={{fontSize: 10, color: 'gray'}}
                />
                <AppText
                  size="xs"
                  color="gray"
                  className="mt-3 leading-4 opacity-80">
                  Note: If a Sub Code (red) bar is not visible for a month, then
                  Sub Code value for that period was zero.
                </AppText>
              </>
            )}
          </Card>
        </View>
      )}
    </AppLayout>
  );
}
