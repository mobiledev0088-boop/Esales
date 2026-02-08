import {
  Linking,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import {memo, useCallback, useEffect, useMemo, useState} from 'react';
import MaterialTabBar from '../../../../../components/MaterialTabBar';
import useQuarterHook from '../../../../../hooks/useQuarterHook';
import {
  useDashboardBannerAPAC,
  useDashboardDataAPAC,
} from '../../../../../hooks/queries/dashboard';
import {
  ASEDataSkeleton,
  DashboardSalesData,
  DashboardSkeleton,
  PartnerAnalyticsSkeleton,
  TargetVsAchievementSkeleton,
} from '../../../../../components/skeleton/DashboardSkeleton';
import {
  ActivationPerformanceComponent,
  ErrorDisplay,
} from '../../../ASIN/Dashboard/components';
import {useLoginStore} from '../../../../../stores/useLoginStore';
import {MaterialTopTabScreenProps} from '@react-navigation/material-top-tabs';
import {
  ASEData,
  HeaderProps,
  PartnerAnalyticsProps,
  PartnerData,
  ProductCategoryData,
  SalesHeaderData,
} from '../../../../../types/dashboard';
import {useThemeStore} from '../../../../../stores/useThemeStore';
import {
  calculatePercentage,
  formatDisplayValue,
  getPerformanceColor,
} from '../../../ASIN/Dashboard/dashboardUtils';
import {ASUS, DASHBOARD, screenWidth} from '../../../../../utils/constant';
import {
  convertToAPACUnits,
  convertToTitleCase,
  showToast,
} from '../../../../../utils/commonFunctions';
import AppText from '../../../../../components/customs/AppText';
import AppDropdown from '../../../../../components/customs/AppDropdown';
import {useNavigation} from '@react-navigation/native';
import {AppNavigationProp} from '../../../../../types/navigation';
import {AppColors} from '../../../../../config/theme';
import Card from '../../../../../components/Card';
import AppIcon from '../../../../../components/customs/AppIcon';
import clsx from 'clsx';
import ImageSlider from '../../../../../components/ImageSlider';
import moment from 'moment';
import AppTabBar from '../../../../../components/CustomTabBar';
import { LogCacheAPI, saveApiLogAPAC } from '../../../../../utils/handleApiCall';

interface TargetVsAchievementData {
  PODQty: ProductCategoryData[];
  PODRevenue: ProductCategoryData[];
  AGPSellIn: ProductCategoryData[];
  AGPSellOut: ProductCategoryData[];
}

interface TargetVsAchievementProps {
  data: TargetVsAchievementData;
  isLoading: boolean;
  error?: Error | null;
  onRetry?: () => void;
  tabName: string;
  quarter: string;
}

interface ASERelatedData {
  total: ASEData;
  retail_assistance: ASEData;
  promoter: ASEData;
}

interface ASEDataProps {
  totalData: ASEData;
  retail_assistanceData: ASEData;
  promoterData: ASEData;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  quarter: string;
  masterTab: string;
}

const DashboardHeader: React.FC<HeaderProps> = ({
  selectedQuarter,
  setSelectedQuarter,
  quarters,
  salesData,
  tabName,
  isLoading,
  error,
  onRetry,
}) => {
  const AppTheme = useThemeStore(state => state.AppTheme);
  const percentage =
    salesData && salesData.Qty_Target
      ? calculatePercentage(salesData.Qty_Achieved, salesData.Qty_Target)
      : 0;

  const {bgColor, textColor} = getPerformanceColor(
    percentage,
    AppTheme === 'dark',
  );

  const displayTitle = tabName
    ? `${DASHBOARD.TABS.LFR === tabName ? tabName : convertToTitleCase(tabName)} Sales`
    : 'N/A Sales';

  if (error) {
    return (
      <View className="px-3 py-4 border-b border-gray-300">
        <ErrorDisplay
          title="Failed to Load Sales Data"
          message="Unable to retrieve sales information"
          onRetry={onRetry}
          showRetry={!!onRetry}
        />
      </View>
    );
  }
  return (
    <View className="flex-row justify-between px-3 py-4 border-b border-gray-300">
      {isLoading ? (
        <DashboardSalesData />
      ) : (
        <View>
          <AppText size="lg" weight="bold" color="text" className="capitalize">
            {displayTitle}
          </AppText>
          <View className="flex-row items-center">
            <AppText size="lg" weight="bold" className="mr-1 text-[#007BE5]">
              {formatDisplayValue(salesData?.Qty_Achieved)}
            </AppText>
            <AppText size="sm" color="gray" className="mr-2">
              / {formatDisplayValue(salesData?.Qty_Target)}
            </AppText>
            {/* Green Base 0EA473.  Red BAse  EF4444.  */}
            <View className={`px-2 py-1 rounded-full ${bgColor}`}>
              <AppText size="xs" weight="semibold" color={textColor}>
                {percentage}%
              </AppText>
            </View>
          </View>
        </View>
      )}
      <View className="w-36">
        <AppDropdown
          data={quarters}
          selectedValue={selectedQuarter?.value || null}
          onSelect={setSelectedQuarter}
          mode="dropdown"
          placeholder="Select Quarter"
          style={{height: 36}}
        />
      </View>
    </View>
  );
};

const BannerComponent = () => {
  const {data: banners} = useDashboardBannerAPAC();
  const navigation = useNavigation<AppNavigationProp>();

  const handleBannerPress = useCallback(
    (item: any) => {
      if (item.BannerURL_Link?.includes('Summary')) {
        //  Move To Scheme Summary Screen
      } else if (!item?.BannerURL_Link?.endsWith('pdf')) {
        console.log('Opening link:', item?.BannerURL_Link);
        if (!/^https?:\/\//i.test(item?.BannerURL_Link)) {
          showToast('Invalid link');
          return;
        }
        Linking.canOpenURL(item?.BannerURL_Link)
          .then(() => Linking.openURL(item?.BannerURL_Link))
          .catch(() => {
            showToast('Unable to open the link');
          });
      } else {
        navigation.push('Banners', {
          Banner_Group_SeqNum: item.Group_Sequence_No,
        });
      }
    },
    [navigation],
  );

  if (!banners || banners.length === 0) return null;

  return (
    <View className="w-full items-center pt-4">
      <ImageSlider
        data={banners || []}
        width={screenWidth - 20}
        height={200}
        onPress={item => handleBannerPress(item)}
        show={true}
        autoplay={true}
        autoplayTimeout={4}
        dotColor="#E5E7EB"
        activeDotColor={true ? '#007BE5' : '#3B82F6'}
        resizeMode="cover"
      />
    </View>
  );
};

const TargetVsAchievementComponent: React.FC<TargetVsAchievementProps> = ({
  data,
  isLoading,
  error,
  onRetry,
  tabName,
  quarter,
}) => {
  const userInfo = useLoginStore(state => state.userInfo);
  const navigation = useNavigation<AppNavigationProp>();
  const AppTheme = useThemeStore(state => state.AppTheme);
  const darkMode = AppTheme === 'dark';
  const {DIR_HOD_MAN, HO_EMPLOYEES, BSM, COUNTRY_HEAD, SA, RSM} = ASUS.ROLE_ID;

  const getProductConfig = useCallback(
    (index: number): {icon: string; color: string} => {
      const configs: {icon: string; color: string}[] = [
        {icon: 'laptop', color: AppColors.utilColor1}, // Notebook/Laptop
        {icon: 'monitor', color: AppColors.utilColor2}, // Network Router or Desktop Monitor
        {icon: 'monitor-speaker', color: AppColors.utilColor3}, // All-in-One PC
        {icon: 'desktop-tower-monitor', color: AppColors.utilColor4}, // Desktop
        {icon: 'desktop-tower', color: AppColors.utilColor5}, // Gaming Desktop
        {icon: 'account-group', color: AppColors.utilColor6}, // Creator Laptops/Workstations
        {icon: 'package-variant', color: AppColors.utilColor7}, // Accessories
        {icon: 'wifi', color: AppColors.utilColor8}, // Wireless/Network Equipment
      ];
      return configs[index] || {icon: 'package', color: AppColors.utilColor1};
    },
    [],
  );

  const handleDistributorWisePress = useCallback((buttonType: 'POD_Qty' | 'AGP_SellIn') => {
    navigation.push('TargetSummaryAPAC', {
      masterTab: tabName,
      YearQtr: quarter,
      buttonType: buttonType,
      navigationFrom: 'disti',
    });
  }, []);

  const handleSeeMorePress = useCallback((buttonType: 'AGP_SellIn' | 'AGP_SellOut') => {
    navigation.push('TargetSummaryAPAC', {
      masterTab: tabName,
      YearQtr: quarter,
      buttonType: buttonType,
      navigationFrom: 'seemore',
    });
  }, []);

  const renderProductCard = useCallback(
    (
      item: ProductCategoryData,
      index: number,
      onPress?: (item: ProductCategoryData) => void,
    ) => {
      const config = getProductConfig(index);
      return (
        <TouchableOpacity
          disabled={!onPress}
          key={`${item.Product_Category}-${index}`}
          activeOpacity={0.7}
          onPress={() => onPress?.(item)}>
          <Card className="min-w-40 rounded-xl" watermark>
            <View className="items-center">
              <View className="flex-row items-center gap-2 mb-1">
                <AppIcon
                  name={config.icon}
                  size={18}
                  color={config.color}
                  type="material-community"
                />
                <AppText size="base" weight="bold" color="text">
                  {item.Product_Category}
                </AppText>
              </View>
              <View className="py-2">
                <AppText size="lg" weight="bold" style={{color: config.color}}>
                  {`${item.Percent}%`}
                </AppText>
              </View>
              <View className="mt-3 flex-row items-center justify-between ">
                <View className="flex-1 items-start">
                  <AppText size="sm" className="text-gray-400 ">
                    Target
                  </AppText>
                  <AppText size="sm" weight="semibold">
                    {convertToAPACUnits(item.Target_Qty)}
                  </AppText>
                </View>
                <View className="flex-1 items-end">
                  <AppText size="xs" className="text-gray-400 ">
                    Achieved
                  </AppText>
                  <AppText size="sm" weight="semibold">
                    {convertToAPACUnits(item.Achieved_Qty)}
                  </AppText>
                </View>
              </View>
            </View>
          </Card>
        </TouchableOpacity>
      );
    },
    [getProductConfig],
  );

  // Determine if Distributor Wise button should be shown
  const needDistributorAccess = [
    DIR_HOD_MAN,
    HO_EMPLOYEES,
    COUNTRY_HEAD,
  ].includes(userInfo?.EMP_RoleId as any);

  const hasPODAccess = [DIR_HOD_MAN, HO_EMPLOYEES, COUNTRY_HEAD, SA].includes(
    userInfo?.EMP_RoleId as any,
  );
  const hasSellInAccess = [
    DIR_HOD_MAN,
    HO_EMPLOYEES,
    BSM,
    COUNTRY_HEAD,
    SA,
    RSM,
  ].includes(userInfo?.EMP_RoleId as any);

  const hasSellOutAccess = [
    DIR_HOD_MAN,
    HO_EMPLOYEES,
    COUNTRY_HEAD,
    SA,
    RSM,
  ].includes(userInfo?.EMP_RoleId as any);

  const renderActionButtons = useCallback(
    (buttonType: 'POD_Qty' | 'AGP_SellIn' | 'AGP_SellOut') => (
      <View
        className={clsx(
          'flex-row w-full px-3 mt-4',
          needDistributorAccess && buttonType !== 'AGP_SellOut'
            ? 'justify-between'
            : 'justify-end',
        )}>
        {needDistributorAccess && buttonType !== 'AGP_SellOut' && (
          <TouchableOpacity
            className="py-1 flex-row items-center border-b border-blue-600 dark:border-secondary-dark"
            activeOpacity={0.7}
            onPress={()=>handleDistributorWisePress(buttonType)}
          >
            <AppIcon
              name="users"
              type="feather"
              color={darkMode ? '#ffffff' : '#2563eb'}
              size={16}
            />
            <AppText
              size="sm"
              weight="medium"
              className="text-secondary dark:text-white ml-2">
              Distributor Wise
            </AppText>
          </TouchableOpacity>
        )}

        {buttonType !== 'POD_Qty' && (
          <TouchableOpacity
            className="py-1 flex-row items-center border-b border-blue-600 dark:border-secondary-dark"
            activeOpacity={0.7}
              onPress={()=>handleSeeMorePress(buttonType)}
          >
            <AppText
              size="sm"
              weight="medium"
              className="text-blue-600 dark:text-white mr-2">
              See More
            </AppText>
            <AppIcon
              name="arrow-right"
              type="feather"
              color={darkMode ? '#ffffff' : '#2563eb'}
              size={16}
            />
          </TouchableOpacity>
        )}
      </View>
    ),
    [handleDistributorWisePress, handleSeeMorePress],
  );

  if (error) {
    return (
      <View className="px-3">
        <ErrorDisplay
          title="Failed to Load Performance Data"
          message="Unable to retrieve target vs achievement information"
          onRetry={onRetry}
          showRetry={!!onRetry}
        />
      </View>
    );
  }

  if (isLoading) return <TargetVsAchievementSkeleton />;

  return (
    <View className="">
      <AppText size="xl" weight="bold" className="pl-3">
        Target / Achievement
      </AppText>

      {/* POD Qty Section */}
      {hasPODAccess && (
        <View className="mt-3">
          <View className="flex-row items-center pl-3 ">
            <View className="rounded-full bg-emerald-100 p-2">
              <AppIcon
                type="fontAwesome"
                name="cubes"
                size={20}
                color="#10b981"
              />
            </View>
            <AppText size="md" color="gray" weight="semibold" className="pl-3">
              POD QTY
            </AppText>
          </View>

          <ScrollView
            horizontal
            contentContainerClassName="gap-3 py-2 px-3"
            className="mt-2"
            showsHorizontalScrollIndicator={false}>
            {data.PODQty.map((item, index) => renderProductCard(item, index))}
          </ScrollView>
          {renderActionButtons('POD_Qty')}
        </View>
      )}

      {/* POD Revenue Section */}
      {hasPODAccess && (
        <View className="mt-5">
          <View className="flex-row items-center pl-3">
            <View className="rounded-full bg-orange-100 p-2">
              <AppIcon
                type="materialIcons"
                name="attach-money"
                size={20}
                color="#f97316"
              />
            </View>
            <AppText size="md" color="gray" weight="semibold" className="pl-3">
              POD Revenue
            </AppText>
          </View>
          <ScrollView
            horizontal
            contentContainerClassName="gap-3 py-2 px-3"
            className="mt-2"
            showsHorizontalScrollIndicator={false}>
            {data.PODRevenue.map((item, index) =>
              renderProductCard(item, index),
            )}
          </ScrollView>
        </View>
      )}

      {/* SELL IN  Section */}
      {hasSellInAccess && (
        <View className="mt-5">
          <View className="flex-row items-center pl-3">
            <View className="rounded-full bg-violet-100 p-2">
              <AppIcon
                type="materialIcons"
                name="local-shipping"
                size={20}
                color="#8b5cf6"
              />
            </View>
            <AppText size="md" color="gray" weight="semibold" className="pl-3">
              AGP Sell In (T1 to AGP)
            </AppText>
          </View>
          <ScrollView
            horizontal
            contentContainerClassName="gap-3 py-2 px-3"
            className="mt-2"
            showsHorizontalScrollIndicator={false}>
            {data.AGPSellIn.map((item, index) =>
              renderProductCard(item, index),
            )}
          </ScrollView>
          {renderActionButtons('AGP_SellIn')}
        </View>
      )}

      {/* SELL OUT  Section */}
      {hasSellOutAccess && (
        <View className="mt-5">
          <View className="flex-row items-center pl-3">
            <View className="rounded-full bg-cyan-100 p-2">
              <AppIcon
                type="fontAwesome"
                name="shopping-cart"
                size={20}
                color="#06b6d4"
              />
            </View>
            <AppText size="md" color="gray" weight="semibold" className="pl-3">
              AGP Sell Out
            </AppText>
          </View>
          <ScrollView
            horizontal
            contentContainerClassName="gap-3 py-2 px-3"
            className="mt-2"
            showsHorizontalScrollIndicator={false}>
            {data.AGPSellOut.map((item, index) =>
              renderProductCard(item, index),
            )}
          </ScrollView>
          {renderActionButtons('AGP_SellOut')}
        </View>
      )}
    </View>
  );
};

const ASEDataComponent: React.FC<ASEDataProps> = ({
  totalData,
  retail_assistanceData,
  promoterData,
  isLoading = false,
  error,
  onRetry,
  quarter,
  masterTab,
}) => {
  const userInfo = useLoginStore(state => state.userInfo);
  const navigation = useNavigation<AppNavigationProp>();
  const [activeTab, setActiveTab] = useState<string>('ASE Total');
  const renderMetricCard = useCallback(
    ({
      label,
      value,
      iconName,
    }: {
      label: string;
      value: number | string;
      iconName: string;
    }) => {
      return (
        <View className="rounded p-4 items-center">
          <AppIcon name={iconName} type="feather" color="#00a63e" size={24} />
          <AppText size="lg" weight="bold" color="text" className="mb-1">
            {formatDisplayValue(value)}
          </AppText>
          <AppText size="xs" weight="regular" className="text-gray-400">
            {label}
          </AppText>
        </View>
      );
    },
    [],
  );

  const renderHeadCountCard = useCallback(
    (headCount: string | number, onPress?: () => void) => (
      <TouchableOpacity
        className="rounded-lg p-4 items-center"
        activeOpacity={0.6}
        onPress={onPress || (() => console.log('Head Count pressed'))}>
        <AppIcon name="users" type="feather" color="#3B82F6" size={24} />
        <AppText
          size="lg"
          weight="bold"
          color="text"
          className="mb-1 text-[#3B82F6]">
          {formatDisplayValue(headCount)}
        </AppText>
        <AppText
          size="xs"
          weight="regular"
          className="underline text-[#3B82F6]">
          HEAD COUNT
        </AppText>
      </TouchableOpacity>
    ),
    [],
  );

  const ASETotalTab = useCallback(() => {
    return (
      <View>
        <View className="flex-row flex-wrap justify-between px-4">
          {renderMetricCard({
            label: 'HEAD COUNT',
            value: totalData.Head_Cnt,
            iconName: 'users',
          })}
          {renderMetricCard({
            label: 'TARGET',
            value: convertToAPACUnits(Number(totalData.Target)),
            iconName: 'target',
          })}
          {renderMetricCard({
            label: 'SELL THRU',
            value: convertToAPACUnits(Number(totalData.SellThru)),
            iconName: 'trending-up',
          })}
          {renderMetricCard({
            label: 'SELL OUT',
            value: convertToAPACUnits(Number(totalData.SellOut)),
            iconName: 'shopping-cart',
          })}
        </View>
      </View>
    );
  }, [totalData, renderMetricCard]);

  const ASERetailAssistanceData = useCallback(() => {
    const year = Number(quarter.slice(0, 4));
    const quarterNum = Number(quarter.slice(4));
    const currentMonth = moment().month() + 1; // month() is zero-based
    const lastMonthOfQuarter = quarterNum * 3;
    const MonthNum =
      currentMonth < lastMonthOfQuarter ? currentMonth : lastMonthOfQuarter;
    const onPress = () => {
      navigation.push('VerticalASE_HO', {
        Year: year.toString(),
        Month: MonthNum.toString(),
        AlpType: 'Channel',
      });
    };
    return (
      <View className="flex-row flex-wrap justify-between px-4">
        {renderHeadCountCard(retail_assistanceData.Head_Cnt, onPress)}
        {renderMetricCard({
          label: 'TARGET',
          value: convertToAPACUnits(Number(retail_assistanceData.Target)),
          iconName: 'target',
        })}
        {renderMetricCard({
          label: 'SELL THRU',
          value: convertToAPACUnits(Number(retail_assistanceData.SellThru)),
          iconName: 'trending-up',
        })}
        {renderMetricCard({
          label: 'SELL OUT',
          value: convertToAPACUnits(Number(retail_assistanceData.SellOut)),
          iconName: 'shopping-cart',
        })}
      </View>
    );
  }, [retail_assistanceData, renderHeadCountCard, renderMetricCard]);

  const ASEPromoter = useCallback(
    ({needHeader = true}: {needHeader: boolean}) => {
      const year = Number(quarter.slice(0, 4));
      const quarterNum = Number(quarter.slice(4));
      const currentMonth = moment().month() + 1; // month() is zero-based
      const lastMonthOfQuarter = quarterNum * 3;
      const MonthNum =
        currentMonth < lastMonthOfQuarter ? currentMonth : lastMonthOfQuarter;
      const onPress = () => {
        navigation.push('VerticalASE_HO', {
          Year: year.toString(),
          Month: MonthNum.toString(),
          AlpType: 'LFR',
        });
      };
      return (
        <View>
          <View className="flex-row flex-wrap justify-between px-4">
            {needHeader
              ? renderHeadCountCard(promoterData.Head_Cnt, onPress)
              : renderMetricCard({
                  label: 'HEAD COUNT',
                  value: promoterData.Head_Cnt,
                  iconName: 'users',
                })}
            {renderMetricCard({
              label: 'TARGET',
              value: convertToAPACUnits(Number(promoterData.Target)),
              iconName: 'target',
            })}
            {renderMetricCard({
              label: 'SELL THRU',
              value: convertToAPACUnits(Number(promoterData.SellThru)),
              iconName: 'trending-up',
            })}
            {renderMetricCard({
              label: 'SELL OUT',
              value: convertToAPACUnits(Number(promoterData.SellOut)),
              iconName: 'shopping-cart',
            })}
          </View>
        </View>
      );
    },
    [promoterData, renderHeadCountCard, renderMetricCard],
  );

  if (error) {
    return (
      <View className="px-3">
        <ErrorDisplay
          title="Failed to Load ASE Data"
          message="Unable to retrieve ASE related information"
          onRetry={onRetry}
          showRetry={!!onRetry}
        />
      </View>
    );
  }

  if (isLoading) {
    return <ASEDataSkeleton />;
  }
  let tabs: any[] = [];
  if (userInfo?.EMP_RoleId === ASUS.ROLE_ID.LFR_HO) {
    tabs = [
      {
        name: 'Promoter',
        label: 'Promoter',
        component: <ASEPromoter needHeader={false} />,
      },
    ];
  } else {
    tabs = [
      {
        name: 'ASE Total',
        label: 'ASE Total',
        component: ASETotalTab,
      },
      {
        name: 'Retail Assistance',
        label: 'Retail Assistance',
        component: ASERetailAssistanceData,
      },
      {
        name: 'Promoter',
        label: 'Promoter',
        component: ASEPromoter,
      },
    ];
  }
  const needSeeMore =
    activeTab === 'ASE Total' || userInfo?.EMP_RoleId === ASUS.ROLE_ID.LFR_HO;
  const year = Number(quarter.slice(0, 4));
  const quarterNum = Number(quarter.slice(4));
  const currentMonth = moment().month() + 1; // month() is zero-based
  const MonthNum =
    currentMonth < quarterNum * 3 ? currentMonth : quarterNum * 3;
  const onPress = () => {
    navigation.push('TargetSummaryAMBranch', {
      Year: year.toString(),
      Month: MonthNum.toString(),
      masterTab,
    });
  };
  return (
    <View className="px-3">
      <View className="flex-row items-center mb-3">
        <View className="rounded-full bg-indigo-100 p-2">
          <AppIcon
            type="materialIcons"
            name="lightbulb"
            size={20}
            color="#4f46e5"
          />
        </View>
        <AppText size="xl" color="text" weight="bold" className="pl-3">
          ASE Related
        </AppText>
      </View>
      <Card
        className="p-0 pt-3"
        needSeeMore={needSeeMore}
        seeMoreOnPress={onPress}>
        <AppTabBar tabs={tabs} onTabChange={item => setActiveTab(item.name)} />
      </Card>
    </View>
  );
};

const PartnerAnalyticsComponent: React.FC<PartnerAnalyticsProps> = ({
  data,
  isLoading = false,
  error,
  onRetry,
}) => {
  const calculatePartnerPercentage = useCallback((value: string): number => {
    if (!value || !value.includes('/')) return 0;
    const [achieved, target] = value.split('/').map(Number);
    return calculatePercentage(achieved, target);
  }, []);

  const UniquePartnerBilled = useMemo(() => {
    const partnerConfigs = [
      {
        key: 'ALP',
        title: 'ALP Partners',
        subtitle: 'Asus Loyal Partners',
        icon: 'users',
        color: '#10B981',
        bgColor: 'bg-green-100',
        showPercentage: true,
      },
      {
        key: 'NON_ALP',
        title: 'Non-ALP Partners',
        subtitle: 'Independent Partners',
        icon: 'user-x',
        color: '#F59E0B',
        bgColor: 'bg-orange-100',
        showPercentage: false,
      },
    ];
    return (
      <View>
        {partnerConfigs.map((config, index) => {
          const value = data[config.key as keyof PartnerData];
          const [achieved, target] =
            config.showPercentage && value?.includes('/')
              ? value.split('/')
              : [value, null];
          const percentage = config.showPercentage
            ? calculatePartnerPercentage(value)
            : null;

          return (
            <View
              key={config.key}
              className={`flex-row items-center justify-between py-3 ${
                index < partnerConfigs.length - 1
                  ? 'border-b border-gray-100'
                  : ''
              }`}>
              <View className="flex-row items-center">
                <View
                  className={`w-10 h-10 ${config.bgColor} rounded-lg items-center justify-center mr-3`}>
                  <AppIcon
                    name={config.icon}
                    type="feather"
                    color={config.color}
                    size={18}
                  />
                </View>
                <View>
                  <AppText size="sm" weight="semibold" color="text">
                    {config.title}
                  </AppText>
                  <AppText size="xs" color="gray">
                    {config.subtitle}
                  </AppText>
                </View>
              </View>

              <View className="items-end">
                <View className="flex-row items-baseline">
                  <AppText size="lg" weight="bold" color="text">
                    {formatDisplayValue(achieved)}
                  </AppText>
                  {target && (
                    <AppText size="sm" color="gray" className="ml-1">
                      / {formatDisplayValue(target)}
                    </AppText>
                  )}
                </View>
                {percentage !== null && (
                  <AppText size="xs" color="success">
                    {percentage}% achieved
                  </AppText>
                )}
              </View>
            </View>
          );
        })}
      </View>
    );
  }, [data, calculatePartnerPercentage]);

  if (error) {
    return (
      <View className="px-3">
        <ErrorDisplay
          title="Failed to Load Partner Data"
          message="Unable to retrieve partner analytics information"
          onRetry={onRetry}
          showRetry={!!onRetry}
        />
      </View>
    );
  }

  if (isLoading) {
    return <PartnerAnalyticsSkeleton />;
  }

  return (
    <View className="px-3">
      <View className="flex-row items-center mb-3">
        <View className="rounded-full bg-pink-100 p-2">
          <AppIcon
            type="materialIcons"
            name="pie-chart"
            size={20}
            color="#ec4899"
          />
        </View>
        <AppText size="xl" color="text" weight="bold" className="pl-3">
          Partner Analytics
        </AppText>
      </View>
      <Card className="">
        <AppTabBar
          tabs={[
            {
              name: 'Unique Partner Billed',
              label: 'Unique Partner Billed',
              component: UniquePartnerBilled,
            },
          ]}
        />
      </Card>
    </View>
  );
};

const DashboardContainer = memo(({route}: MaterialTopTabScreenProps<any>) => {
  const navigation = useNavigation<AppNavigationProp>();
  const {quarters, selectedQuarter, setSelectedQuarter} = useQuarterHook();
  const userInfo = useLoginStore(state => state.userInfo);

  const isMalaysia = userInfo?.EMP_CountryID === ASUS.COUNTRIES.ACMY;
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    data: dashboardData,
    isLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useDashboardDataAPAC(selectedQuarter?.value || '', route.name);

  // Process sales data
  const salesData: SalesHeaderData | undefined = useMemo(() => {
    const masterTabItem = dashboardData?.MasterTab?.find(
      (item: any) => item.Type === route.name,
    );

    return masterTabItem
      ? {
          Qty_Achieved: masterTabItem.Qty_Achieved || '0',
          Qty_Target: masterTabItem.Qty_Target || '0',
        }
      : undefined;
  }, [dashboardData?.MasterTab, route.name]);

  // Process target vs achievement data
  const targetVsAchievementData: TargetVsAchievementData = useMemo(
    () => ({
      PODQty: dashboardData?.TrgtAchvt_PodQty || [],
      PODRevenue: dashboardData?.TrgtAchvt_PodRevenue || [],
      AGPSellIn: dashboardData?.TrgtAchvt_AGPSellIn || [],
      AGPSellOut: dashboardData?.TrgtAchvt_AGPSellout || [],
    }),
    [
      dashboardData?.TrgtAchvt_PodQty,
      dashboardData?.TrgtAchvt_PodRevenue,
      dashboardData?.TrgtAchvt_AGPSellIn,
      dashboardData?.TrgtAchvt_AGPSellout,
    ],
  );

  // Process Activation Performance Tab Data
  const [acvTab, acvTabData] = useMemo(() => {
    const ORDER = ['Branch', 'ALP', 'Model', 'AGP', 'ASP', 'Disti'];
    const allTop5Objects = Object.keys(dashboardData || {}).filter(key =>
      key.toLowerCase().startsWith('top5'),
    );
    const acvTab = allTop5Objects
      .map(key => key.replace(/top5/i, ''))
      .sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
    const acvTabUnArray = allTop5Objects.map(key => ({
      [key.replace(/top5/i, 'Top5')]: dashboardData?.[key] || {},
    }));
    const acvTabUnManage = Object.assign(
      {},
      ...acvTabUnArray.filter(obj => {
        const value = Object.values(obj)[0];
        return value && Object.keys(value).length > 0; // keep only non-empty objects
      }),
    );
    const acvTabData = Object.keys(acvTabUnManage).reduce(
      (acc, key) => {
        acc[key] = acvTabUnManage[key].map((item: any) => ({
          ...item,
          name: item[`Top_5_${key.replace('Top5', '')}`],
          SO_Cnt: item.SO_Cnt || item.SellOut_Qty || '0',
        }));
        return acc;
      },
      {} as Record<string, any[]>,
    );
    return [acvTab, acvTabData];
  }, [dashboardData]);

  // Process ASE Related Data
  const aseData: ASERelatedData = useMemo(
    () => ({
      total: dashboardData?.ISPRelated?.[0] || {},
      retail_assistance: dashboardData?.RetailAssistance?.[0] || {},
      promoter: dashboardData?.Promoter?.[0] || {},
    }),
    [dashboardData],
  );

  // Process Partner Analytics Data
  const partnerData: PartnerData = useMemo(
    () =>
      dashboardData?.UniqueBilled?.[0] || {
        ALP: '',
        NON_ALP: '',
      },
    [dashboardData?.UniqueBilled],
  );

  const handleRetry = useCallback(() => {
    refetchDashboard();
  }, [refetchDashboard]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetchDashboard();
    } catch (error) {
      console.warn('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchDashboard]);

  const onPress = (data:any)=>{
   navigation.push('ActPerformanceATID', {
    masterTab: route.name,
    quarter: selectedQuarter?.value || '',
    data
   })
  }

  return (
    <View className="flex-1 bg-lightBg-base dark:bg-darkBg-base">
      <ScrollView
        contentContainerClassName="flex-grow pb-10 gap-5"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#3B82F6']} // Android
            tintColor="#3B82F6" // iOS
            title="Pull to refresh"
            titleColor="#6B7280"
          />
        }>
        <DashboardHeader
          selectedQuarter={selectedQuarter}
          setSelectedQuarter={setSelectedQuarter}
          quarters={quarters}
          salesData={salesData}
          tabName={route.name}
          isLoading={isLoading}
          error={dashboardError}
          onRetry={handleRetry}
        />
        <BannerComponent />

        <TargetVsAchievementComponent
          data={targetVsAchievementData}
          isLoading={isLoading}
          error={dashboardError}
          onRetry={handleRetry}
          tabName={route.name}
          quarter={selectedQuarter?.value || ''}
        />

        <View className="px-3">
          <ActivationPerformanceComponent
            tabs={acvTab}
            data={acvTabData}
            isLoading={isLoading}
            error={dashboardError}
            onRetry={handleRetry}
            name={route.name}
            quarter={selectedQuarter?.value || ''}
            handleSeeMore={onPress}
          />
        </View>

        {isMalaysia && (
          <ASEDataComponent
            totalData={aseData.total}
            retail_assistanceData={aseData.retail_assistance}
            promoterData={aseData.promoter}
            isLoading={isLoading}
            error={dashboardError}
            onRetry={handleRetry}
            quarter={selectedQuarter?.value || ''}
            masterTab={route.name}
          />
        )}

        {isMalaysia && (
          <PartnerAnalyticsComponent
            data={partnerData}
            isLoading={isLoading}
            error={dashboardError}
            onRetry={handleRetry}
          />
        )}
      </ScrollView>
    </View>
  );
});

export default function Dashboard() {
  const {quarters} = useQuarterHook();
  const initialTab = 'Total';

  useEffect(() => {
    LogCacheAPI('Dashboard API Log Cached');
  }, []);

  const {
    data: dashboardData,
    isLoading: isTabsLoading,
    error: tabsError,
  } = useDashboardDataAPAC(quarters[0]?.value || '', initialTab);

  const dashboardTabs = useMemo(() => {
    if (dashboardData?.MasterTab && Array.isArray(dashboardData.MasterTab)) {
      const validTabs = dashboardData.MasterTab.filter(
        (tab: any) => tab?.Type && typeof tab.Type === 'string',
      ).map((tab: any) => ({
        name: tab.Type,
        component: DashboardContainer,
        label: tab.Type,
      }));
      return validTabs;
    }
    return [];
  }, [dashboardData?.MasterTab]);

  if (isTabsLoading) return <DashboardSkeleton />;

  if (tabsError) {
    return (
      <View className="flex-1 bg-slate-50">
        <ErrorDisplay
          title="Failed to Load Dashboard"
          message="Unable to retrieve dashboard configuration"
          showRetry={false}
        />
      </View>
    );
  }

  if (!dashboardTabs.length) {
    return (
      <View className="flex-1 bg-lightBg-base dark:bg-darkBg-base">
        <ErrorDisplay
          title="No Dashboard Tabs"
          message="No valid dashboard configuration available"
          showRetry={false}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-lightBg-base dark:bg-darkBg-base">
      <MaterialTabBar
        tabs={dashboardTabs}
        initialRouteName={dashboardTabs[0]?.name || initialTab}
        tabPadding={10}
      />
    </View>
  );
}
