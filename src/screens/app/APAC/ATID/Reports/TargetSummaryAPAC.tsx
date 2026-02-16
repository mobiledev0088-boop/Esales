import {useQuery} from '@tanstack/react-query';
import {FlatList, TouchableOpacity, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {memo, useEffect, useMemo} from 'react';
import AppLayout from '../../../../../components/layout/AppLayout';
import {handleAPACApiCall} from '../../../../../utils/handleApiCall';
import {useLoginStore} from '../../../../../stores/useLoginStore';
import useQuarterHook from '../../../../../hooks/useQuarterHook';
import Skeleton from '../../../../../components/skeleton/skeleton';
import {screenWidth} from '../../../../../utils/constant';
import {DataStateView} from '../../../../../components/DataStateView';
import AppText from '../../../../../components/customs/AppText';
import AppIcon from '../../../../../components/customs/AppIcon';
import {AppColors} from '../../../../../config/theme';
import Accordion from '../../../../../components/Accordion';
import {Watermark} from '../../../../../components/Watermark';
import {convertToAPACUnits,getProductConfig} from '../../../../../utils/commonFunctions';
import {CircularProgressBar} from '../../../../../components/customs/AppChart';
import Card from '../../../../../components/Card';
import AppDropdown from '../../../../../components/customs/AppDropdown';
import { AppNavigationProp } from '../../../../../types/navigation';

interface RouteParams {
  navigationFrom: 'seemore' | 'disti';
  buttonType: 'POD_Qty' | 'AGP_SellIn' | 'AGP_SellOut';
  YearQtr: string;
  masterTab?: string;
}

interface ProductCategory {
  Achieved_Qty: number;
  Loc_Branch: string;
  Percent: number;
  Product_Category: string;
  Sequence_No: number;
  Target_Qty: number;
  Percent_Achievement?: number;
}

interface BranchGroup {
  name: string;
  products: ProductCategory[];
  target: number;
  achieved: number;
  percent: number;
}

// API Hook
const useBranchData = (params: RouteParams) => {
  const {
    EMP_Code = '',
    EMP_RoleId = '',
    EMP_CountryID = '',
  } = useLoginStore(state => state.userInfo);
  const {navigationFrom, buttonType, YearQtr, masterTab} = params;

  const endpoint =
    navigationFrom === 'seemore'
      ? '/TrgtVsAchvDetail/GetTrgtVsAchvRevenueDetail'
      : 'TrgtVsAchvDetail/GetTrgtVsAchvDetail_Disti';

  return useQuery({
    queryKey: ['TrgtVsAchv', endpoint, buttonType, EMP_Code, YearQtr],
    queryFn: async () => {
      const res = await handleAPACApiCall(endpoint, {
        masterTab: masterTab || '',
        employeeCode: EMP_Code,
        RoleId: EMP_RoleId,
        YearQtr,
        Country: EMP_CountryID,
      });

      if (!res?.DashboardData?.Status) throw new Error('Failed to fetch data');

      const {Datainfo} = res.DashboardData;
      if (navigationFrom === 'seemore') {
        return buttonType === 'AGP_SellIn'
          ? Datainfo.AGP_Revenuewise_Sellin
          : Datainfo.AGP_Revenuewise_Sellout;
      }
      return buttonType === 'POD_Qty'
        ? Datainfo.ProductCategory
        : Datainfo.AGP_Sellin_Productwise_Disti_Contribution;
    },
    staleTime: 0,
    gcTime: 0,
  });
};
// helpers
const groupByBranch = (
  data: ProductCategory[],
  isDistiWithSellIn: boolean,
): BranchGroup[] => {
  let groups;
  if (isDistiWithSellIn) {
    groups = data.reduce(
      (acc, item) => {
        const key = item.Product_Category || 'Unassigned';
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      },
      {} as Record<string, ProductCategory[]>,
    );
  } else {
    groups = data.reduce(
      (acc, item) => {
        const key = item.Loc_Branch || 'Unassigned';
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      },
      {} as Record<string, ProductCategory[]>,
    );
  }

  return Object.entries(groups)
    .map(([name, products]) => {
      const target = products.reduce((sum, p) => sum + (p.Target_Qty || 0), 0);
      const achieved = products.reduce(
        (sum, p) => sum + (p.Achieved_Qty || 0),
        0,
      );
      return {
        name,
        products,
        target,
        achieved,
        percent: target > 0 ? Math.round((achieved / target) * 100) : 0,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
};

// Components
const LoadingSkeleton = () => (
  <View className="mt-2 px-3">
    {[...Array(10)].map((_, i) => (
      <View key={i} className="mb-3">
        <Skeleton width={screenWidth - 24} height={100} borderRadius={8} />
      </View>
    ))}
  </View>
);

const MetricRow = memo(
  ({
    label,
    value,
    valueColor,
  }: {
    label: string;
    value: string;
    valueColor?: string;
  }) => (
    <View className="flex-1">
      <AppText size="xs" className="text-gray-400 mb-0.5">
        {label}
      </AppText>
      <AppText
        size="sm"
        weight="bold"
        className={valueColor || 'text-gray-900'}>
        {value}
      </AppText>
    </View>
  ),
);

const ProductCard = memo(
  ({product, index}: {product: ProductCategory; index: number}) => {
    const config = getProductConfig(product.Product_Category);
    const isOver = (product.Percent || 0) >= 100;

    return (
      <Card className="min-w-36 rounded-lg" watermark>
        <View className="items-center py-1">
          <View className="flex-row items-center gap-1.5 mb-2">
            <AppIcon
              name={config.icon}
              size={16}
              color={config.color}
              type="material-community"
            />
            <AppText
              size="xs"
              weight="semibold"
              numberOfLines={1}
              className="flex-1">
              {product.Product_Category}
            </AppText>
          </View>

          <CircularProgressBar
            progress={product.Percent || 0}
            progressColor={isOver ? '#10b981' : config.color}
            size={60}
            strokeWidth={5}
          />

          <View className="mt-2 w-full gap-1">
            <View className="flex-row justify-between gap-3">
              <AppText size="xs" className="text-gray-400">
                Target
              </AppText>
              <AppText size="sm" weight="semibold">
                {convertToAPACUnits(product.Target_Qty, false)}
              </AppText>
            </View>
            <View className="flex-row justify-between gap-3">
              <AppText size="xs" className="text-gray-400">
                Achieved
              </AppText>
              <AppText
                size="sm"
                weight="semibold"
                className={isOver ? 'text-green-600' : 'text-blue-600'}>
                {convertToAPACUnits(product.Achieved_Qty, false)}
              </AppText>
            </View>
          </View>
        </View>
      </Card>
    );
  },
);

const BranchCard = memo(
  ({product, index}: {product: ProductCategory; index: number}) => {
    const config = getProductConfig(product.Product_Category);
    const isOver = (product.Percent || 0) >= 100;

    return (
      <Card className="min-w-36 rounded-lg" watermark>
        <View className="items-center py-1">
          <View className="flex-row items-center gap-1.5 mb-2">
            <AppText
              size="base"
              weight="semibold"
              numberOfLines={1}
              className="flex-1">
              {product.Loc_Branch}
            </AppText>
          </View>
          <View className="mt-2 w-full gap-1">
            <View className="flex-row justify-between gap-3">
              <AppText size="xs" className="text-gray-400">
                Achieved
              </AppText>
              <AppText
                size="sm"
                weight="semibold"
                className={isOver ? 'text-green-600' : 'text-blue-600'}>
                {convertToAPACUnits(product.Achieved_Qty, false)}
              </AppText>
            </View>
            <View className="flex-row justify-between gap-3">
              <AppText size="xs" className="text-gray-400">
                Percentage
              </AppText>
              <AppText
                size="sm"
                weight="semibold"
                style={{color: isOver ? '#10b981' : config.color}}>
                {product?.Percent_Achievement || 0}%
              </AppText>
            </View>
          </View>
        </View>
      </Card>
    );
  },
);

const BranchItem = memo(
  ({group, isSeeMore,onDealerHitRate}: {group: BranchGroup; isSeeMore: boolean, onDealerHitRate: (branchName: string) => void}) => {
    const header = (
      <View className="flex-1">
        <View className="py-2.5 px-0.5">
          <View className="flex-row items-center gap-2 mb-2">
            <View className="rounded-lg p-2 bg-primary/10">
              <AppIcon
                name="office-building"
                size={18}
                color={AppColors.primary}
                type="material-community"
              />
            </View>
            <View className="flex-1">
              <AppText weight="bold" numberOfLines={1}>
                {group.name}
              </AppText>
              <AppText size="xs" className="text-gray-400">
                {group.products.length} Products
              </AppText>
            </View>
            <View
              className={`px-2.5 py-1 rounded-full ${group.percent >= 100 ? 'bg-green-100' : 'bg-blue-100'}`}>
              <AppText
                size="xs"
                weight="bold"
                className={
                  group.percent >= 100 ? 'text-green-700' : 'text-blue-700'
                }>
                {group.percent}%
              </AppText>
            </View>
          </View>

          <View className="flex-row items-center gap-4 mb-2">
            <MetricRow
              label="Target"
              value={convertToAPACUnits(group.target)}
            />
            <View className="w-px h-8 bg-gray-200" />
            <MetricRow
              label="Achieved"
              value={convertToAPACUnits(group.achieved)}
              valueColor="text-green-600"
            />
          </View>

          <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <View
              className={group.percent >= 100 ? 'bg-green-500' : 'bg-blue-500'}
              style={{
                width: `${Math.min(group.percent, 100)}%`,
                height: '100%',
              }}
            />
          </View>
        </View>
        <Watermark horizontalCount={2} columnGap={30} />
      </View>
    );

    return (
      <View className="mb-2.5">
        <Accordion
          header={header}
          needBottomBorder={false}
          containerClassName="bg-white rounded-xl border border-gray-200">
          <FlatList
            data={group.products}
            horizontal
            keyExtractor={item => `${item.Sequence_No}`}
            renderItem={({item, index}) => (
              <ProductCard product={item} index={index} />
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              gap: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}
          />
          {isSeeMore && (
            <TouchableOpacity
              className="mb-4 ml-4"
              onPress={() => onDealerHitRate(group.name)}
            >
              <View className="flex-row items-center gap-1">
                <AppText className="underline" color="primary" weight="bold">
                  Dealer Hit Rate
                </AppText>
                <AppIcon
                  name="chevron-right"
                  size={16}
                  color={AppColors.primary}
                  type="material-community"
                />
              </View>
            </TouchableOpacity>
          )}
        </Accordion>
      </View>
    );
  },
);

const ProductLineItem = memo(
  ({group, index}: {group: BranchGroup; index: number}) => {
    const header = (
      <View className="flex-1 ">
        <View className="py-3 px-0.5">
          <View className="flex-row  justify-between">
            <View className="flex-row items-center gap-2">
              <View className="rounded-lg p-2 bg-slate-100">
                <AppIcon
                  name={getProductConfig(group.name).icon}
                  size={18}
                  color={getProductConfig(group.name).color}
                  type="material-community"
                />
              </View>
              <View>
                <AppText weight="bold" numberOfLines={1}>
                  {group.name}
                </AppText>
                <AppText size="xs" className="text-gray-400">
                  {group.products.length} Products
                </AppText>
              </View>
            </View>
            <View className="flex-row items-center w-20">
              <MetricRow
                label="Total Achieved"
                value={convertToAPACUnits(group.achieved)}
              />
            </View>
          </View>
        </View>
        <Watermark horizontalCount={1} columnGap={30} />
      </View>
    );

    return (
      <View className="mb-2.5">
        <Accordion
          header={header}
          needBottomBorder={false}
          containerClassName="bg-white rounded-xl border border-gray-200">
          <FlatList
            data={group.products}
            horizontal
            keyExtractor={(item, index) => `${index}-${item.Sequence_No}`}
            renderItem={({item, index}) => (
              <BranchCard product={item} index={index} />
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              gap: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}
          />
        </Accordion>
      </View>
    );
  },
);

// Main Component
export default function TargetSummaryAPAC() {
  const {params} = useRoute();
  const routeParams = params as RouteParams;
  const navigation = useNavigation<AppNavigationProp>();
  const {selectedQuarter, quarters, setSelectedQuarter} = useQuarterHook();
  const {data, isLoading, isError, refetch} = useBranchData({
    ...routeParams,
    YearQtr: selectedQuarter?.value || routeParams.YearQtr,
  });
  const isDistiWithSellIn =
    routeParams.navigationFrom === 'disti' &&
    routeParams.buttonType === 'AGP_SellIn';

  useEffect(() => {
    const {YearQtr} = routeParams;
    if (YearQtr && YearQtr !== selectedQuarter?.value) {
      setSelectedQuarter(quarters.find(q => q.value === YearQtr) || null);
    }
  }, [routeParams.YearQtr]);

  const branches = useMemo(() => {
    return data && Array.isArray(data)
      ? groupByBranch(data, isDistiWithSellIn)
      : [];
  }, [data, isDistiWithSellIn]);

  const listHeader = () => (
    <View className="mb-4 px-3">
      <AppText size="lg" weight="bold" color="text" className="mb-1">
        {isDistiWithSellIn
          ? 'Distributor Product Line Summary'
          : routeParams.navigationFrom === 'disti'
            ? 'Distributor Performance Summary'
            : 'Performance Summary'}
      </AppText>
      <AppText size="sm" className="text-gray-500">
        {branches.length}{' '}
        {isDistiWithSellIn
          ? 'Product Line'
          : routeParams.navigationFrom === 'disti'
            ? 'Distributors'
            : 'Branches'}{' '}
        • {selectedQuarter?.label || 'All Time'}
      </AppText>
    </View>
  );

  const handlePress = (branchName: string) => {navigation.push('DealerHitRate', {BranchName: branchName});}

  return (
    <AppLayout title="Target v/s Achievement" needBack>
      <View className="mt-4 px-3">
        <View className="w-36 self-end mt-2 mb-4">
          <AppDropdown
            mode="dropdown"
            data={quarters}
            selectedValue={selectedQuarter?.value}
            onSelect={setSelectedQuarter}
            zIndex={3000}
          />
        </View>
      </View>
      <DataStateView
        isLoading={isLoading}
        isError={isError}
        isEmpty={branches.length === 0}
        onRetry={refetch}
        LoadingComponent={<LoadingSkeleton />}>
        <FlatList
          data={branches}
          keyExtractor={item => item.name}
          renderItem={({item, index}) =>
            isDistiWithSellIn ? (
              <ProductLineItem group={item} index={index} />
            ) : (
              <BranchItem
                group={item}
                isSeeMore={routeParams?.navigationFrom === 'seemore'}
                onDealerHitRate={handlePress}
              />
            )
          }
          ListHeaderComponent={listHeader}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 12,
            paddingBottom: 20,
          }}
          maxToRenderPerBatch={6}
          windowSize={3}
          initialNumToRender={4}
        />
      </DataStateView>
    </AppLayout>
  );
}