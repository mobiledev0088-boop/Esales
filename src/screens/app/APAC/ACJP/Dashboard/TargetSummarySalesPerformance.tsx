import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import React, {useState, useMemo, useCallback} from 'react';
import AppLayout from '../../../../../components/layout/AppLayout';
import AppDropdown, {
  AppDropdownItem,
} from '../../../../../components/customs/AppDropdown';
import useQuarterHook from '../../../../../hooks/useQuarterHook';
import {useRoute, useNavigation} from '@react-navigation/native';
import AppText from '../../../../../components/customs/AppText';
import {useLoginStore} from '../../../../../stores/useLoginStore';
import {useQuery} from '@tanstack/react-query';
import {useUserStore} from '../../../../../stores/useUserStore';
import {handleAPACApiCall} from '../../../../../utils/handleApiCall';
import Card from '../../../../../components/Card';
import AppIcon from '../../../../../components/customs/AppIcon';
import {AppColors} from '../../../../../config/theme';
import {useThemeStore} from '../../../../../stores/useThemeStore';
import {AppNavigationProp} from '../../../../../types/navigation';
import Skeleton from '../../../../../components/skeleton/skeleton';

const {width: screenWidth} = Dimensions.get('window');

interface partnerListItem {
  Partner_Code: string;
  Partner_Name: string;
  Target_Type: string;
  Target_Qty: number;
  SellThru_Qty: number;
  SellOut_Qty: number;
  Activation_Qty: number;
  NonActivation_Qty: number;
}

interface GroupedPartner {
  BranchName: string;
  PartnerCode: string;
  ProductCategoryType: partnerListItem[];
}

// Reusable Stat Card Component
interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  iconType: 'feather' | 'materialIcons';
  color: string;
}

const useGetPartnerList = (
  YearQtr: string,
  ALP: string,
  masterTabType: string,
) => {
  const {Sync_Date} = useUserStore(state => state.empInfo);
  const {EMP_Code: employeeCode = '', EMP_RoleId: RoleId = ''} = useLoginStore(
    state => state.userInfo,
  );

  return useQuery({
    queryKey: [
      'partnerList',
      employeeCode,
      RoleId,
      YearQtr,
      ALP,
      masterTabType,
    ],
    queryFn: async () => {
      const response = await handleAPACApiCall(
        '/TrgtVsAchvDetail/GetTrgtVsAchvPartnerTypeWise_HO',
        {
          employeeCode,
          RoleId,
          YearQtr,
          AlpType: ALP,
          masterTab: masterTabType,
          sync_date: Sync_Date,
          page_name: 'see_vertical',
        },
      );

      const result = response?.DashboardData;
      if (!result?.Status) {
        throw new Error('Failed to fetch dealer information');
      }
      return result.Datainfo?.PartnerList || ([] as partnerListItem[]);
    },
    select: (data: partnerListItem[]): GroupedPartner[] => {
      const grouped = data.reduce(
        (acc: Record<string, GroupedPartner>, partner: partnerListItem) => {
          const key = partner.Partner_Name;
          if (!acc[key]) {
            acc[key] = {
              BranchName: partner.Partner_Name,
              PartnerCode: partner.Partner_Code,
              ProductCategoryType: [],
            };
          }
          acc[key].ProductCategoryType.push(partner);
          return acc;
        },
        {},
      );

      return Object.values(grouped);
    },
  });
};

// Loading Skeleton Component
const PartnerListSkeleton = () => {
  const {AppTheme} = useThemeStore();
  const colors = AppColors[AppTheme];

  return (
    <View className="pt-4">
      {/* Dropdowns Skeleton */}
      <View className="flex-row items-center justify-between mb-3">
        <Skeleton width={screenWidth * 0.6} height={45} borderRadius={8} />
        <Skeleton width={screenWidth * 0.28} height={45} borderRadius={8} />
      </View>

      {/* ALP Card Skeleton */}
      <View
        className="p-3 mb-3 rounded-lg border border-slate-200 dark:border-slate-700"
        style={{backgroundColor: colors.bgSurface}}>
        <View className="flex-row items-center justify-between">
          <View>
            <Skeleton width={60} height={14} borderRadius={4} />
            <View className="mt-2">
              <Skeleton width={80} height={24} borderRadius={4} />
            </View>
          </View>
          <View className="items-start">
            <Skeleton width={80} height={14} borderRadius={4} />
            <View className="mt-2">
              <Skeleton width={40} height={24} borderRadius={4} />
            </View>
          </View>
        </View>
      </View>

      {/* Title Skeleton */}
      <Skeleton width={150} height={18} borderRadius={4} />

      {/* Partner Cards Skeleton */}
      <View className="mt-2">
        {[1, 2, 3].map(i => (
          <View
            key={i}
            className="p-3 mb-3 rounded-lg border border-slate-200 dark:border-slate-700"
            style={{backgroundColor: colors.bgSurface}}>
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-1">
                <Skeleton
                  width={screenWidth * 0.5}
                  height={18}
                  borderRadius={4}
                />
                <View className="mt-1">
                  <Skeleton width={100} height={14} borderRadius={4} />
                </View>
              </View>
            </View>

            <View className="mb-2">
              <View className="flex-row items-center justify-between mb-1">
                <Skeleton width={80} height={14} borderRadius={4} />
                <Skeleton width={50} height={18} borderRadius={4} />
              </View>
              <Skeleton width={screenWidth - 72} height={8} borderRadius={4} />
            </View>

            <View className="flex-row flex-wrap -mx-1">
              {[1, 2, 3, 4, 5, 6].map(j => (
                <View key={j} className="w-1/3 px-1 mb-2">
                  <View
                    className="p-2 rounded-lg"
                    style={{backgroundColor: colors.bgBase}}>
                    <Skeleton width={60} height={12} borderRadius={4} />
                    <View className="mt-1">
                      <Skeleton width={40} height={16} borderRadius={4} />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};
const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  iconType,
  color,
}) => {
  const {AppTheme} = useThemeStore();
  const colors = AppColors[AppTheme];

  return (
    <View className="w-1/3 px-1 mb-1.5">
      <View className="p-2 rounded-lg" style={{backgroundColor: colors.bgBase}}>
        <View className="flex-row items-center mb-0.5">
          <AppIcon name={icon} type={iconType} size={12} color={color} />
          <AppText
            size="xs"
            weight="medium"
            style={{
              color: colors.text,
              opacity: 0.7,
              marginLeft: 4,
              fontSize: 10,
            }}>
            {label}
          </AppText>
        </View>
        <AppText size="sm" weight="bold" style={{color: colors.text}}>
          {value}
        </AppText>
      </View>
    </View>
  );
};

export default function TargetSummarySalesPerformance() {
  const {params} = useRoute();
  const navigation = useNavigation<AppNavigationProp>();
  const {AppTheme} = useThemeStore();
  const colors = AppColors[AppTheme];

  const {Year_Qtr, ALP, masterTabType} = params as {
    Year_Qtr: string;
    ALP: string;
    masterTabType: string;
  };

  const {quarters, selectedQuarter, setSelectedQuarter} =
    useQuarterHook(Year_Qtr);
  const {
    data: partnerList = [],
    isLoading,
    error,
  } = useGetPartnerList(selectedQuarter?.value || Year_Qtr, ALP, masterTabType);

  const [selectedPartner, setSelectedPartner] =
    useState<AppDropdownItem | null>(null);

  // Memoized partner dropdown list
  const partnerDropdownList = useMemo(() => {
    const uniquePartners = partnerList.map((partner: GroupedPartner) => ({
      label: `${partner.BranchName} (${partner.PartnerCode})`,
      value: partner.PartnerCode,
    }));
    return [{label: 'All Partners', value: 'all'}, ...uniquePartners];
  }, [partnerList]);

  // Filtered partner list based on selection
  const filteredPartnerList = useMemo((): GroupedPartner[] => {
    if (!selectedPartner || selectedPartner.value === 'all') {
      return partnerList;
    }
    return partnerList.filter(
      (partner: GroupedPartner) =>
        partner.PartnerCode === selectedPartner.value,
    );
  }, [partnerList, selectedPartner]);

  // Calculate totals for a partner
  const calculateTotals = useCallback((items: partnerListItem[]) => {
    return items.reduce(
      (acc, item) => ({
        target: acc.target + item.Target_Qty,
        sellThru: acc.sellThru + item.SellThru_Qty,
        sellOut: acc.sellOut + item.SellOut_Qty,
        activation: acc.activation + item.Activation_Qty,
        nonActivation: acc.nonActivation + item.NonActivation_Qty,
      }),
      {target: 0, sellThru: 0, sellOut: 0, activation: 0, nonActivation: 0},
    );
  }, []);

  // Calculate achievement percentage
  const calculateAchievement = useCallback(
    (sellThru: number, target: number) => {
      return target > 0 ? ((sellThru / target) * 100).toFixed(1) : '0.0';
    },
    [],
  );

  const handlePartnerPress = useCallback(
    (partner: GroupedPartner) => {
      navigation.navigate('Dashboard_Partner', {
        ALP: ALP,
        Year_Qtr: selectedQuarter?.value || Year_Qtr,
        Partner_Code: partner.PartnerCode,
        Partner_Name: partner.BranchName,
      });
      console.log('Navigate to partner detail:', partner.PartnerCode);
    },
    [Year_Qtr, ALP, navigation,selectedQuarter?.value],
  );

  const renderPartnerItem = useCallback(
    ({item}: {item: GroupedPartner}) => {
      const totals = calculateTotals(item.ProductCategoryType);
      const achievement = calculateAchievement(totals.sellThru, totals.target);
      const achievementNum = parseFloat(achievement);

      return (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handlePartnerPress(item)}
          className="mb-3">
          <Card
            className="p-3 border border-slate-200 dark:border-slate-700"
            noshadow>
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-1">
                <AppText
                  size="lg"
                  weight="bold"
                  style={{color: colors.heading}}>
                  {item.BranchName}
                </AppText>
                <AppText
                  size="sm"
                  weight="medium"
                  style={{color: colors.text, opacity: 0.7}}>
                  Code: {item.PartnerCode}
                </AppText>
              </View>
              <AppIcon
                name="chevron-right"
                type="feather"
                size={24}
                color={colors.primary}
              />
            </View>

            {/* Achievement Progress */}
            <View className="mb-2">
              <View className="flex-row items-center justify-between mb-1">
                <AppText size="sm" weight="medium" style={{color: colors.text}}>
                  Achievement
                </AppText>
                <AppText
                  size="lg"
                  weight="bold"
                  style={{
                    color:
                      achievementNum >= 100
                        ? colors.success
                        : achievementNum >= 75
                          ? colors.warning
                          : colors.error,
                  }}>
                  {achievement}%
                </AppText>
              </View>
              <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <View
                  style={{
                    width: `${Math.min(achievementNum, 100)}%`,
                    backgroundColor:
                      achievementNum >= 100
                        ? colors.success
                        : achievementNum >= 75
                          ? colors.warning
                          : colors.error,
                  }}
                  className="h-full rounded-full"
                />
              </View>
            </View>

            {/* Stats Grid */}
            <View className="flex-row flex-wrap -mx-1">
              <StatCard
                label="Target"
                value={totals.target.toLocaleString()}
                icon="target"
                iconType="feather"
                color={colors.primary}
              />
              <StatCard
                label="Sell Thru"
                value={totals.sellThru.toLocaleString()}
                icon="trending-up"
                iconType="feather"
                color={colors.success}
              />
              <StatCard
                label="Sell Out"
                value={totals.sellOut.toLocaleString()}
                icon="shopping-cart"
                iconType="feather"
                color={colors.secondary}
              />
              <StatCard
                label="Activation"
                value={totals.activation.toLocaleString()}
                icon="check-circle"
                iconType="feather"
                color={colors.success}
              />
              <StatCard
                label="Non-Activation"
                value={totals.nonActivation.toLocaleString()}
                icon="x-circle"
                iconType="feather"
                color={colors.error}
              />
              <StatCard
                label="Categories"
                value={item.ProductCategoryType.length.toString()}
                icon="grid"
                iconType="feather"
                color={colors.text}
              />
            </View>
          </Card>
        </TouchableOpacity>
      );
    },
    [colors, calculateTotals, calculateAchievement, handlePartnerPress],
  );

  const renderEmptyState = useCallback(
    () => (
      <View className="items-center justify-center py-20">
        <AppIcon
          name="inbox"
          type="feather"
          size={64}
          color={colors.text}
          style={{opacity: 0.3}}
        />
        <AppText
          size="lg"
          weight="medium"
          style={{color: colors.text, opacity: 0.5, marginTop: 16}}>
          No partners found
        </AppText>
        {selectedPartner && selectedPartner.value !== 'all' && (
          <AppText
            size="sm"
            style={{color: colors.text, opacity: 0.4, marginTop: 8}}>
            Try selecting 'All Partners'
          </AppText>
        )}
      </View>
    ),
    [colors, selectedPartner],
  );

  if (isLoading) {
    return (
      <AppLayout title="Target Sales Performance" needBack needPadding>
        <PartnerListSkeleton />
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Target Sales Performance" needBack needPadding>
      {!isLoading && (
        <>
          <View className="flex-row items-center justify-between my-3">
            <AppDropdown
              data={partnerDropdownList}
              onSelect={setSelectedPartner}
              selectedValue={selectedPartner?.value}
              placeholder="Select Partner"
              mode="autocomplete"
              style={{width: '65%'}}
              zIndex={999}
            />
            <AppDropdown
              data={quarters}
              onSelect={setSelectedQuarter}
              selectedValue={selectedQuarter?.value}
              placeholder="Select Quarter"
              mode="dropdown"
              style={{width: '30%'}}
              zIndex={999}
            />
          </View>

          <Card
            className="p-3 mb-3 border border-slate-200 dark:border-slate-700"
            noshadow>
            <View className="flex-row items-center justify-between">
              {/* <View>
            <AppText size="sm" weight="medium" style={{color: colors.text, opacity: 0.7}}>
              ALP Type
            </AppText>
            <AppText size="xl" weight="bold" style={{color: colors.primary, marginTop: 4}}>
              {ALP}
            </AppText>
          </View> */}
              <View className="items-start">
                <AppText
                  size="sm"
                  weight="medium"
                  style={{color: colors.text, opacity: 0.7}}>
                  Total Partners
                </AppText>
                <AppText
                  size="xl"
                  weight="bold"
                  style={{color: colors.secondary, marginTop: 4}}>
                  {filteredPartnerList.length}
                </AppText>
              </View>
            </View>
          </Card>

          {filteredPartnerList.length > 0 && (
            <AppText
              size="md"
              weight="semibold"
              style={{color: colors.heading, marginBottom: 8}}>
              Partner Performance
            </AppText>
          )}
        </>
      )}
      <FlatList
        data={filteredPartnerList}
        renderItem={renderPartnerItem}
        keyExtractor={item => item.PartnerCode}
        // ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingTop: 16, flexGrow: 1}}
      />
    </AppLayout>
  );
}
