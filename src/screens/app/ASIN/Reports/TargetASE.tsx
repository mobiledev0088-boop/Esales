import {FlatList, ScrollView, TouchableOpacity, View} from 'react-native';
import {useLoginStore} from '../../../../stores/useLoginStore';
import {useQuery} from '@tanstack/react-query';
import {handleASINApiCall} from '../../../../utils/handleApiCall';
import {useNavigation, useRoute} from '@react-navigation/native';
import AppDropdown, {AppDropdownItem} from '../../../../components/customs/AppDropdown';
import {useCallback, useMemo, useState} from 'react';
import {
  convertToASINUnits,
  getPastMonths,
  getProductConfig,
} from '../../../../utils/commonFunctions';
import Skeleton from '../../../../components/skeleton/skeleton';
import {screenWidth} from '../../../../utils/constant';
import AppText from '../../../../components/customs/AppText';
import AppLayout from '../../../../components/layout/AppLayout';
import Accordion from '../../../../components/Accordion';
import AppIcon from '../../../../components/customs/AppIcon';
import {AppColors} from '../../../../config/theme';
import {CircularProgressBar} from '../../../../components/customs/AppChart';
import {PieChart} from 'react-native-gifted-charts';
import {Watermark} from '../../../../components/Watermark';
import {AppNavigationProp} from '../../../../types/navigation';

interface ProductCategory {
  Sequence_No: number;
  Loc_Branch: string;
  Product_Category: string;
  Achieved_Qty: number;
  Percent?: number;
  AreaManager: string;
}

interface PartnerWise {
  Branch_Name: string;
  ALP_Type: string;
  Achieved_Qty: number;
  Percent_Contri: number;
}

interface APIResponse {
  ProductCategory: ProductCategory[];
  PartnerWise: PartnerWise[];
}

interface SummaryItem {
  BranchName: string;
  AreaManager: string;
  ProductCategoryType: ProductCategory[];
  PartnerWiseDetails: PartnerWise[];
  AchievedQty: number;
}

const PARTNER_COLORS: Record<string, string> = {
  CHANNEL: '#34A853', // Green
  LFR: '#1A73E8', // Blue
};

const FALLBACK_COLORS = [
  '#FB8C00',
  '#AB47BC',
  '#00ACC1',
  '#FDD835',
  '#8D6E63',
  '#5C6BC0',
];

const getPartnerColor = (type: string | undefined, index: number): string => {
  if (!type) return FALLBACK_COLORS[index % FALLBACK_COLORS.length];
  const key = type.toUpperCase();
  return PARTNER_COLORS[key] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
};

const formatAreaManagerNames = (names: string): string => {
  if (!names || names === 'N/A') return 'N/A';

  return names
    .split(',')
    .map(name => {
      const trimmedName = name.trim();
      if (!trimmedName) return '';

      // Replace underscores with spaces and capitalize each word
      return trimmedName
        .split('_')
        .map(word => {
          if (!word) return '';
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ');
    })
    .filter(name => name) // Remove empty strings
    .join(', ');
};

const useGetTrgtVsAchvDetail = (
  YearQtr: string,
  masterTab: string,
  branchName?: string,
) => {
  const {EMP_Code: employeeCode = '', EMP_RoleId: RoleId = ''} = useLoginStore(
    state => state.userInfo,
  );
  return useQuery<APIResponse>({
    queryKey: [
      'getTrgtVsAchvDetail',
      employeeCode,
      RoleId,
      YearQtr,
      masterTab,
      branchName,
    ],
    queryFn: async () => {
      const endpoint = '/TrgtVsAchvDetail/GetTrgtVsAchvDetailASE_MonthWise';
      const dataToSend = {employeeCode, RoleId, YearQtr, masterTab, branchName};
      const response = await handleASINApiCall(endpoint, dataToSend);
      const result = response?.DashboardData;
      if (!result?.Status) {
        throw new Error('Failed to fetch activation data');
      }
      return (
        result.Datainfo || {
          ProductCategory: [],
          PartnerWise: [],
        }
      );
    },
    enabled: !!employeeCode && !!RoleId && !!YearQtr,
  });
};

export default function TargetSummaryAMBranch() {
  const route = useRoute();
  const navigation = useNavigation<AppNavigationProp>();
  const {Year, Month, masterTab} = route.params as {
    Year: string;
    Month: string;
    masterTab: string;
  };
  const YearQtr = `${Year}${Month}`;

  const monthOptions = useMemo<AppDropdownItem[]>(
    () => getPastMonths(6, false, YearQtr, true),
    [YearQtr],
  );
  const [selectedMonth, setSelectedMonth] = useState<AppDropdownItem | null>(
    monthOptions[0],
  );

  const [refreshing, setRefreshing] = useState(false);

  const {
    data: trgtVsAchvDetail,
    isLoading,
    isError,
    refetch,
  } = useGetTrgtVsAchvDetail(selectedMonth?.value || YearQtr,masterTab);
  const mergeData = useMemo((): SummaryItem[] => {
    if (!trgtVsAchvDetail) return [];
    const {ProductCategory = [], PartnerWise = []} = trgtVsAchvDetail;

    if (ProductCategory.length === 0 && PartnerWise.length === 0) return [];
    let groupedList: SummaryItem[] = [];

    const branchMap = new Map<string, SummaryItem>();

    ProductCategory.forEach((item: ProductCategory) => {
      const branchKey = item.Loc_Branch?.toLowerCase()?.trim();
      if (!branchKey) return; // Skip if branch name is invalid

      if (!branchMap.has(branchKey)) {
        branchMap.set(branchKey, {
          BranchName: item.Loc_Branch,
          AreaManager: item.AreaManager || 'N/A',
          ProductCategoryType: [],
          PartnerWiseDetails: [],
          AchievedQty: 0,
        });
      }

      const node = branchMap.get(branchKey)!;
      node.ProductCategoryType.push(item);
      node.AchievedQty += item.Achieved_Qty || 0;
    });

    PartnerWise.forEach((item: PartnerWise) => {
      const branchKey = item.Branch_Name?.toLowerCase()?.trim();
      if (!branchKey) return; // Skip if branch name is invalid

      if (!branchMap.has(branchKey)) {
        branchMap.set(branchKey, {
          BranchName: item.Branch_Name,
          AreaManager: 'N/A',
          ProductCategoryType: [],
          PartnerWiseDetails: [],
          AchievedQty: 0,
        });
      }

      const node = branchMap.get(branchKey)!;
      node.PartnerWiseDetails.push(item);
    });

    groupedList = Array.from(branchMap.values()).sort((a, b) =>
      a.BranchName.localeCompare(b.BranchName),
    );
    return groupedList;
  }, [trgtVsAchvDetail]);

  const renderProductCard = useCallback(
    (item: ProductCategory, index: number) => {
      const config = getProductConfig(item.Product_Category);
      const achievedQty = item.Achieved_Qty || 0;
      return (
        <View className="items-center p-2" key={index}>
          <View className="flex-row items-center gap-2 mb-3">
            <View
              className="rounded-lg p-1.5"
              style={{backgroundColor: `${config.color}15`}}>
              <AppIcon
                name={config.icon}
                size={18}
                color={config.color}
                type="material-community"
              />
            </View>
            <AppText size="sm" weight="bold" color="text" numberOfLines={1}>
              {item.Product_Category}
            </AppText>
          </View>
          <CircularProgressBar
            progress={100}
            value={convertToASINUnits(achievedQty, true)}
            progressColor={config.color}
            size={75}
            strokeWidth={7}
          />
        </View>
      );
    },
    [],
  );

  const renderItem = useCallback(
    ({item}: {item: SummaryItem}) => {
      const hasProducts =
        item.ProductCategoryType && item.ProductCategoryType.length > 0;
      const totalAchieved = item.AchievedQty || 0;
      // Build pie chart data with stable colors + percentage labels
      const totalPartnerQty = item.PartnerWiseDetails.reduce(
        (sum, p) => sum + (p.Achieved_Qty || 0),
        0,
      );
      const pieData = item.PartnerWiseDetails.map((p, idx) => {
        const qty = p.Achieved_Qty || 0;
        const percent = totalPartnerQty > 0 ? (qty / totalPartnerQty) * 100 : 0;
        return {
          value: qty,
          color: getPartnerColor(p.ALP_Type, idx),
          text: `${percent.toFixed(0)}%`,
        };
      });
      const handleLegendPress = (type: string, Branch: string) => {
        // Optional: Implement any interaction when legend is pressed
        console.log('Legend pressed:', type, Branch);
        navigation.push('VerticalASE_HO', {
          Branch,
          Year,
          Month,
          AlpType: type || '',
        });
      };

      return (
        <Accordion
          header={
            <>
              <View className="flex-1 flex-row items-start gap-3 py-3">
                <View className="rounded-lg p-2 bg-primary/10">
                  <AppIcon
                    name="map-marker"
                    size={20}
                    color={AppColors.primary}
                    type="material-community"
                  />
                </View>

                <View className="flex-1 ">
                  <AppText
                    size="md"
                    weight="bold"
                    color="text"
                    numberOfLines={1}
                    className="mb-2">
                    {item.BranchName || 'Unknown Branch'}
                  </AppText>
                  <View className="flex-row items-center gap-1.5">
                    <View className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <AppText size="sm" className="text-gray-500">
                      Total:
                    </AppText>
                    <AppText size="sm" weight="semibold" color="primary">
                      {convertToASINUnits(totalAchieved, true)}
                    </AppText>
                  </View>
                  <View className="flex-row items-center gap-1.5 flex-1">
                    <View className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <AppText size="sm" className="text-gray-500">
                      AM:
                    </AppText>
                    <AppText
                      size="sm"
                      weight="semibold"
                      className="text-green-600 dark:text-green-400 flex-1"
                      numberOfLines={1}>
                      {formatAreaManagerNames(item.AreaManager)}
                    </AppText>
                  </View>
                </View>
              </View>
              <Watermark />
            </>
          }
          needBottomBorder={false}
          containerClassName="bg-white dark:bg-darkCard overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 mb-5">
          {hasProducts ? (
            <>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  gap: 12,
                  paddingTop: 16,
                  paddingBottom: 16,
                  paddingHorizontal: 16,
                }}>
                {item.ProductCategoryType.map((product, index) =>
                  renderProductCard(product, index),
                )}
              </ScrollView>
              <View className="items-center mt-2">
                <PieChart
                  data={pieData}
                  radius={95}
                  // Label Settings
                  showText
                  textSize={14}
                  textColor="white"
                  // showTextBackground
                  // textBackgroundRadius={20}
                  labelsPosition="outward"
                  // Add a thin separator (stroke) between slices for visual clarity
                  strokeColor="#ffffff"
                  strokeWidth={2}
                  focusOnPress={false}
                  // Disable donut to match provided design
                  donut={false}
                />
                {/* Legend */}
                <View className="flex-row flex-wrap justify-center mt-5 gap-3 px-4">
                  {item.PartnerWiseDetails.map((p, idx) => (
                    <TouchableOpacity
                      onPress={() =>
                        handleLegendPress(p.ALP_Type, item.BranchName)
                      }
                      key={`${p.ALP_Type}_${idx}`}
                      className="flex-row items-center rounded-full px-3 py-1"
                      style={{
                        backgroundColor:
                          getPartnerColor(p.ALP_Type, idx) + '15',
                        borderWidth: 1,
                        borderColor: getPartnerColor(p.ALP_Type, idx) + '55',
                      }}>
                      <View
                        className="w-3 h-3 rounded-full mr-2"
                        style={{
                          backgroundColor: getPartnerColor(p.ALP_Type, idx),
                        }}
                      />
                      <AppText size="xs" weight="semibold" color="text">
                        {`${p.ALP_Type?.toUpperCase() || 'N/A'} (${p.Achieved_Qty || 0})`}
                      </AppText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* View Territory Button */}
              <TouchableOpacity
                className="self-end mb-4 mr-4 mt-2"
                // onPress={() => console.log('View Territory:', item.BranchName)}
                onPress={() => {
                  navigation.push('TargetASETerritory', {
                    Year,
                    Month,
                    masterTab,
                    branchName: item.BranchName,
                  });
                }}
              >
                <View className="flex-row items-center gap-1 bg-primary/5 px-3 py-2 rounded-lg">
                  <AppText
                    className="underline"
                    color="primary"
                    weight="semibold"
                    size="sm">
                    View Territory Performance
                  </AppText>
                  <AppIcon
                    name="chevron-right"
                    size={18}
                    color={AppColors.primary}
                    type="material-community"
                  />
                </View>
              </TouchableOpacity>
            </>
          ) : (
            <View className="py-8 items-center">
              <AppText size="sm" className="text-gray-400">
                No products available for this branch
              </AppText>
            </View>
          )}
        </Accordion>
      );
    },
    [renderProductCard,navigation],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const keyExtractor = useCallback(
    (item: SummaryItem, index: number) => `${item.BranchName}_${index}`,
    [],
  );

  const renderLoadingSkeleton = useCallback(
    () => (
      <View>
        <View className="mb-4 self-end">
          <Skeleton width={120} height={30} borderRadius={6} />
        </View>
        {Array.from({length: 8}).map((_, index) => (
          <Skeleton
            key={index}
            width={screenWidth - 24}
            height={100}
            borderRadius={12}
          />
        ))}
      </View>
    ),
    [],
  );

  const renderEmptyComponent = useCallback(
    () => (
      <View className="flex-1 items-center justify-center py-20 px-6">
        <View className="items-center bg-white dark:bg-darkCard rounded-2xl p-8 shadow-sm">
          <View className="bg-gray-100 dark:bg-gray-800 rounded-full p-6 mb-4">
            <AppIcon
              name={isError ? 'alert-circle-outline' : 'inbox-outline'}
              size={48}
              color={isError ? AppColors.error : '#9CA3AF'}
              type="material-community"
            />
          </View>
          <AppText size="lg" weight="bold" className="mb-2 text-center">
            {isError ? 'Failed to Load Data' : 'No Data Available'}
          </AppText>
          <AppText size="sm" className="text-gray-500 text-center">
            {isError
              ? 'Unable to fetch branch data. Please try again later.'
              : 'No branch data available for the selected period.'}
          </AppText>
          {isError && (
            <TouchableOpacity
              onPress={() => refetch()}
              className="mt-4 bg-primary px-6 py-3 rounded-lg">
              <AppText size="sm" weight="semibold" className="text-white">
                Retry
              </AppText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    ),
    [isError, refetch],
  );
  return (
    <AppLayout title="Target ASE" needBack needScroll={false}>
      {!isLoading && (
        <View className="w-36 self-end mx-3 mt-4">
          <AppDropdown
            data={monthOptions}
            selectedValue={selectedMonth?.value}
            onSelect={item => setSelectedMonth(item)}
            placeholder="Select Month"
            mode="dropdown"
          />
        </View>
      )}
      <FlatList
        data={mergeData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={{padding: 12, paddingBottom: 16}}
        ListEmptyComponent={
          isLoading ? renderLoadingSkeleton() : renderEmptyComponent()
        }
        refreshing={refreshing}
        onRefresh={onRefresh}
          showsVerticalScrollIndicator={false}
      />
    </AppLayout>
  );
}
