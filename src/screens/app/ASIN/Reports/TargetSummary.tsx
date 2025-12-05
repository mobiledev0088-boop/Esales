import {View, FlatList, TouchableOpacity, ScrollView} from 'react-native';
import {useMemo, useState, useCallback, memo} from 'react';
import AppLayout from '../../../../components/layout/AppLayout';
import AppDropdown, {
  AppDropdownItem,
} from '../../../../components/customs/AppDropdown';
import AppText from '../../../../components/customs/AppText';
import AppIcon from '../../../../components/customs/AppIcon';
import Card from '../../../../components/Card';
import Accordion from '../../../../components/Accordion';
import {CircularProgressBar} from '../../../../components/customs/AppChart';
import {
  getPastQuarters,
  convertToASINUnits,
  getProductConfig,
} from '../../../../utils/commonFunctions';
import {AppColors} from '../../../../config/theme';
import {useQuery} from '@tanstack/react-query';
import {handleASINApiCall} from '../../../../utils/handleApiCall';
import {useLoginStore} from '../../../../stores/useLoginStore';
import {useRoute} from '@react-navigation/native';
import {ProductCategoryData} from '../../../../types/dashboard';
import {ASUS, screenWidth} from '../../../../utils/constant';
import Skeleton from '../../../../components/skeleton/skeleton';
import {Watermark} from '../../../../components/Watermark';

interface ProductItem {
  Sequence_No: number;
  Loc_Branch: string;
  Territory?: string;
  Product_Category: string;
  Achieved_Qty: number;
  Target_Qty: number;
  Percent: number;
}

interface GroupedData {
  branchName: string;
  territoryName?: string;
  products: ProductItem[];
  totalAchieved: number;
  totalTarget: number;
}

interface GroupAccordionItemProps {
  group: GroupedData;
  viewMode: ViewMode;
  button: ButtonType;
  onViewTerritory: (branchName: string) => void;
}

interface SummaryHeaderProps {
  isLoading: boolean;
  quarter: AppDropdownItem[];
  selectedQuarter: AppDropdownItem | null;
  onSelectQuarter: (item: AppDropdownItem | null) => void;
  viewMode: ViewMode;
  selectedBranch: string;
  groupCount: number;
  onBackToBranch: () => void;
  button: ButtonType;
}
interface UseTrgtVsAchvParams {
  YearQtr: string;
  masterTab: string;
  apiEndpoint: string;
  BranchName?: string; // only for territory level (selected branch)
  viewMode: ViewMode;
}

type ViewMode = 'branch' | 'territory';
type ButtonType = 'seemore' | 'disti';
type WiseType = 'POD' | 'SELL';

const API_ENDPOINTS = {
  SEEMORE:{
    PODTERRITORY : '/TrgtVsAchvDetail/GetTrgtVsAchvTerritorywiseSellin',
    POD: '/TrgtVsAchvDetail/GetTrgtVsAchvDetail_PODWise',
    TERRITORY: '/TrgtVsAchvDetail/GetTrgtVsAchvTerritorywise',
    PARTNERTYPE: '/TrgtVsAchvDetail/GetTrgtVsAchvPartnerTypeWise',
    BRANCH: '/TrgtVsAchvDetail/GetTrgtVsAchvDetail'
  },
  DISTI:{
    POD: '/TrgtVsAchvDetail/GetTrgtVsAchvDetail_PODWise_Disti',
    SELL: '/TrgtVsAchvDetail/GetTrgtVsAchvDetail_Disti'
  }
}
const APIMAPPING = (
  isTerritory: Boolean,
  isPOD: Boolean,
  button: ButtonType,
  isPartner: Boolean,
) => {
  if (button === 'disti') {
    return isPOD ? API_ENDPOINTS.DISTI.POD : API_ENDPOINTS.DISTI.SELL;
  }
  if (isPOD) {
    return isTerritory ? API_ENDPOINTS.SEEMORE.PODTERRITORY : API_ENDPOINTS.SEEMORE.POD;
  }
  if (isTerritory) {
    return API_ENDPOINTS.SEEMORE.TERRITORY;
  }
  if (isPartner) {
    return API_ENDPOINTS.SEEMORE.PARTNERTYPE;
  }
  return API_ENDPOINTS.SEEMORE.BRANCH;
};

const useGetTrgtVsAchvDetail = ({
  YearQtr,
  masterTab,
  apiEndpoint,
  BranchName,
  viewMode,
}: UseTrgtVsAchvParams) => {
  const {EMP_Code: employeeCode = '', EMP_RoleId: RoleId = ''} = useLoginStore(
    state => state.userInfo,
  );

  // Include BranchName only when territory view needs it (button 'seemore')
  const payload: Record<string, any> = {
    employeeCode,
    RoleId,
    YearQtr,
    masterTab,
  };
  if (viewMode === 'territory' && BranchName) {
    payload.BranchName = BranchName;
  }

  const needsBranchName = apiEndpoint.includes('Territorywise') && viewMode === 'territory';
  const enabled = needsBranchName ? !!BranchName : true;

  return useQuery({
    queryKey: ['TrgtVsAchvDetail', apiEndpoint, viewMode, BranchName || '', YearQtr, masterTab, employeeCode, RoleId],
    queryFn: async () => {
      const response = await handleASINApiCall(apiEndpoint, payload);
      const result = response?.DashboardData;
      if (!result?.Status) throw new Error('Failed to fetch activation data');
      return result.Datainfo?.ProductCategory || [];
    },
    enabled,
    staleTime: 0,
    gcTime: 0,
  });
};

export default function TargetSummary() {
  const {params} = useRoute();
  const {EMP_RoleId:roleID} = useLoginStore(state => state.userInfo);
  console.log('Role ID in TargetSummary:', roleID);
  const {Quarter, masterTab, button, wise,} = params as {
    Quarter: string;
    masterTab: string;
    button: ButtonType;
    wise: WiseType;
  };
  console.log('Params in TargetSummary:', params);
  const {BSM,RSM,BPM,CHANNEL_MARKETING,SALES_REPS} = ASUS.ROLE_ID;
  const managerArr: number[] = [BSM, RSM, BPM, CHANNEL_MARKETING];

  const isTerritory = useMemo(() => managerArr.includes(roleID), [roleID]);
  const isPartner = useMemo(() => roleID === SALES_REPS, [roleID]);
  console.log('isTerritory:', isTerritory, 'isPartner:', isPartner);
  
  const quarter = useMemo(() => getPastQuarters(), []);
  const foundQuarter = quarter.find(q => q.value === Quarter);
  const [selectedQuarter, setSelectedQuarter] = useState<AppDropdownItem | null>(foundQuarter || null);
  const [viewMode, setViewMode] = useState<ViewMode>(isTerritory ? 'territory' : 'branch');
  const [selectedBranch, setSelectedBranch] = useState<string>('');

  // Dynamic endpoint based on current view mode (not role)
  const apiEndpoint = APIMAPPING(isTerritory, wise === 'POD', button, isPartner);
  console.log('API Endpoint in TargetSummary:', apiEndpoint);

  // Single unified hook call
  const {data: demoData, isLoading} = useGetTrgtVsAchvDetail({
    YearQtr: selectedQuarter?.value || '',
    masterTab,
    apiEndpoint,
    BranchName: selectedBranch,
    viewMode,
  });

  console.log('Fetched Demo Data:', demoData);

  // Handle view territory press
  const handleViewTerritory = useCallback((branchName: string) => {
    setSelectedBranch(branchName);
    setViewMode('territory');
  }, []);

  // Handle back to branch view - optimized with instant state update
  const handleBackToBranch = useCallback(() => {
    // Update view mode first for instant UI feedback
    setViewMode('branch');
    // Clear selected branch after a minimal delay to prevent query cancellation issues
    setTimeout(() => setSelectedBranch(''), 0);
  }, []);

  // Group data (memoized) using external utility
  const groupedData = useMemo<GroupedData[]>(
    () => groupDemoData(demoData, viewMode),
    [demoData, viewMode],
  );

  const keyExtractor = useCallback((item: GroupedData) => getGroupKey(viewMode, item),[viewMode],);

  return (
    <AppLayout title="Target / Achievement" needBack needPadding>
      <FlatList
        data={groupedData}
        renderItem={({item}) => (
          <GroupAccordionItem
            group={item}
            viewMode={viewMode}
            button={button}
            onViewTerritory={handleViewTerritory}
          />
        )}
        keyExtractor={keyExtractor}
        extraData={viewMode}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom: 20}}
        maxToRenderPerBatch={16}
        windowSize={10}
        initialNumToRender={10}
        ListHeaderComponent={
          <SummaryHeader
            isLoading={isLoading}
            quarter={quarter}
            selectedQuarter={selectedQuarter}
            onSelectQuarter={item => setSelectedQuarter(item)}
            viewMode={viewMode}
            selectedBranch={selectedBranch}
            groupCount={groupedData.length}
            onBackToBranch={handleBackToBranch}
            button={button}
          />
        }
        ListEmptyComponent={
          isLoading ? <LoadingSkeletonComponent /> : <EmptyDataComponent />
        }
      />
    </AppLayout>
  );
}

// Utility Functions
const groupDemoData = (
  demoData: ProductItem[] | undefined,
  viewMode: ViewMode,
): GroupedData[] => {
  if (!demoData) return [];
  const groups = demoData.reduce(
    (acc: Record<string, GroupedData>, item: ProductItem) => {
      const key =
        viewMode === 'branch' ? item.Loc_Branch : item.Territory || '';
      if (!key) return acc;
      if (!acc[key]) {
        acc[key] = {
          branchName: viewMode === 'branch' ? key : item.Loc_Branch,
          territoryName: viewMode === 'territory' ? key : undefined,
          products: [],
          totalAchieved: 0,
          totalTarget: 0,
        };
      }
      acc[key].products.push(item);
      if (
        item.Product_Category !== 'ACCY' &&
        item.Product_Category !== 'WEP' &&
        item.Product_Category !== 'OLED'
      ) {
        acc[key].totalAchieved += item.Achieved_Qty;
        acc[key].totalTarget += item.Target_Qty;
      }
      return acc;
    },
    {} as Record<string, GroupedData>,
  );
  return Object.values(groups);
};

const getGroupKey = (viewMode: ViewMode, item: GroupedData) => `${viewMode}-${item.territoryName || item.branchName}`;


const ProductCard = memo(({product, index}: {product: ProductCategoryData, index: number}) => {
  const config = getProductConfig(index);
  return (
    <TouchableOpacity disabled activeOpacity={0.7}>
      <Card className="min-w-40 rounded-md" watermark>
        <View className="items-center">
          <View className="flex-row items-center gap-2 mb-1">
            <AppIcon
              name={config.icon}
              size={18}
              color={config.color}
              type="material-community"
            />
            <AppText size="base" weight="bold" color="text">
              {product.Product_Category}
            </AppText>
          </View>
          <CircularProgressBar
            progress={product.Percent || 0}
            progressColor={config.color}
            size={70}
            strokeWidth={6}
          />
          <View className="mt-3 flex-row items-center justify-between ">
            <View className="flex-1 items-start">
              <AppText size="sm" className="text-gray-400 ">
                Target
              </AppText>
              <AppText size="sm" weight="semibold">
                {convertToASINUnits(product.Target_Qty, true)}
              </AppText>
            </View>
            <View className="flex-1 items-end">
              <AppText size="xs" className="text-gray-400 ">
                Achieved
              </AppText>
              <AppText size="sm" weight="semibold">
                {convertToASINUnits(product.Achieved_Qty, true)}
              </AppText>
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
});

const GroupAccordionItem = memo(
  ({group, viewMode, button, onViewTerritory}: GroupAccordionItemProps) => {
    const achievementPercent =
      group.totalTarget > 0
        ? Math.round((group.totalAchieved / group.totalTarget) * 100)
        : 0;
    const isOverAchieved = achievementPercent >= 100;
    const displayName = group.territoryName || group.branchName;
    const iconName =
      viewMode === 'branch' ? 'office-building' : 'map-marker-radius';

    const accordionHeader = (
      <>
        <View className="flex-row items-center justify-between flex-1 pt-4 pb-2">
          <View className="flex-1">
            <View className="flex-row items-center gap-3 mb-3">
              <View className="rounded-lg p-2.5 bg-primary/10">
                <AppIcon
                  name={iconName}
                  size={22}
                  color={AppColors.primary}
                  type="material-community"
                />
              </View>
              <View className="flex-1">
                <AppText
                  size="base"
                  weight="bold"
                  color="text"
                  numberOfLines={1}>
                  {displayName}
                </AppText>
                <AppText size="xs" className="text-gray-500 mt-0.5">
                  {group.products.length} Products
                </AppText>
              </View>
              <View
                className={`px-3 py-1.5 rounded-full ${isOverAchieved ? 'bg-green-50' : 'bg-blue-50'}`}>
                <AppText
                  size="xs"
                  weight="bold"
                  className={
                    isOverAchieved ? 'text-green-600' : 'text-blue-600'
                  }>
                  {achievementPercent}%
                </AppText>
              </View>
            </View>
            <View className="flex-row items-center gap-8 mb-2">
              <View className="flex-1">
                <AppText size="xs" className="text-gray-400 mb-1">
                  Target
                </AppText>
                <AppText size="base" weight="bold" color="text">
                  {convertToASINUnits(group.totalTarget, true)}
                </AppText>
              </View>
              <View className="flex-1">
                <AppText size="xs" className="text-gray-400 mb-1">
                  Achieved
                </AppText>
                <AppText size="base" weight="bold" className="text-green-600">
                  {convertToASINUnits(group.totalAchieved, true)}
                </AppText>
              </View>
            </View>
            <View className="mt-2">
              <View className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <View
                  className={`h-full rounded-full ${isOverAchieved ? 'bg-green-500' : 'bg-blue-500'}`}
                  style={{width: `${Math.min(achievementPercent, 100)}%`}}
                />
              </View>
            </View>
          </View>
        </View>
        <Watermark horizontalCount={2} columnGap={30} />
      </>
    );

    return (
      <View className="mb-3">
        <Accordion
          header={accordionHeader}
          needBottomBorder={false}
          containerClassName="bg-white overflow-hidden rounded-md border border-gray-200">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              gap: 14,
              paddingTop: 14,
              paddingBottom: 16,
              paddingHorizontal: 14,
            }}>
            {group.products.map((product, index) => (
              <ProductCard key={product.Sequence_No} product={product} index={index} />
            ))}
          </ScrollView>
          {button === 'seemore' && viewMode === 'branch' && (
            <TouchableOpacity
              className="self-end mb-4 mr-4"
              onPress={() => onViewTerritory(group.branchName)}>
              <View className="flex-row items-center gap-1">
                <AppText className="underline" color="primary" weight="bold">
                  View Territory Performance
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

const SummaryHeader = memo(
  ({
    isLoading,
    quarter,
    selectedQuarter,
    onSelectQuarter,
    viewMode,
    selectedBranch,
    groupCount,
    onBackToBranch,
    button,
  }: SummaryHeaderProps) => {
    if (isLoading) return null;
    return (
      <View className="mb-4">
        <View className="w-36 self-end mt-2 mb-4">
          <AppDropdown
            mode="dropdown"
            data={quarter}
            selectedValue={selectedQuarter?.value}
            onSelect={onSelectQuarter}
          />
        </View>
        {viewMode === 'territory' && (
          <TouchableOpacity
            onPress={onBackToBranch}
            className="flex-row items-center gap-2 mb-3 self-start">
            <AppIcon
              name="arrow-left"
              size={20}
              color={AppColors.primary}
              type="material-community"
            />
            <AppText color="primary" weight="semibold">
              Back to Branches
            </AppText>
          </TouchableOpacity>
        )}
        <AppText size="lg" weight="bold" color="text" className="mb-1">
          {button === 'disti'
            ? viewMode === 'branch'
              ? 'Distributor Performance Summary'
              : `Territory Performance - ${selectedBranch}`
            : 'Performance Summary'}
        </AppText>
        <AppText size="sm" className="text-gray-500">
          {groupCount}{' '}
          {button === 'disti'
            ? viewMode === 'branch'
              ? 'Distributors'
              : 'Territories'
            : 'Branches'}{' '}
          • {selectedQuarter?.label || 'All Time'}
        </AppText>
      </View>
    );
  },
);

const LoadingSkeletonComponent = memo(() => (
  <View>
    <View className="mb-4 self-end">
      <Skeleton width={120} height={30} borderRadius={6} />
    </View>
    <View className="mb-3">
      <Skeleton width={200} height={30} borderRadius={6} />
      <Skeleton width={100} height={20} borderRadius={6} />
    </View>
    {Array.from({length: 3}).map((_, index) => (
      <Skeleton
        key={index}
        width={screenWidth - 24}
        height={100}
        borderRadius={12}
      />
    ))}
  </View>
));

const EmptyDataComponent = memo(() => (
  <View className="items-center justify-center mt-32">
    <View className="rounded-full p-4 bg-gray-100 mb-4">
      <AppIcon
        name="database-off"
        size={40}
        color="#9CA3AF"
        type="material-community"
      />
    </View>
    <AppText size="base" weight="semibold" className="text-gray-600 mb-2">
      No Data Available
    </AppText>
    <AppText size="sm" className="text-gray-400 text-center px-8">
      There's no performance data for the selected quarter.
    </AppText>
  </View>
));
