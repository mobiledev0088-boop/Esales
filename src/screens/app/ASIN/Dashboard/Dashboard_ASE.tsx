import clsx from 'clsx';
import {useCallback, useMemo, useState} from 'react';
import {RefreshControl, ScrollView, View} from 'react-native';
import {BannerComponent} from './components';
import AppText from '../../../../components/customs/AppText';
import AppDropdown from '../../../../components/customs/AppDropdown';
import {useMonthHook} from '../../../../hooks/useQuarterHook';
import {useDashboardDataAM} from '../../../../hooks/queries/dashboard';
import AppIcon from '../../../../components/customs/AppIcon';
import Card from '../../../../components/Card';
import {CircularProgressBar} from '../../../../components/customs/AppChart';
import {convertToASINUnits} from '../../../../utils/commonFunctions';
import {screenWidth} from '../../../../utils/constant';
import {ActivationPerformanceComponent} from './Dashboard_AM';
import Skeleton from '../../../../components/skeleton/skeleton';
import AttendanceMarkModal from '../../../../components/AttendanceMarkModal';
import {getCurrentLocation} from '../../../../utils/services';
import BackgroundFetch from 'react-native-background-fetch';

interface TargetAchievementProps {
  target: number;
  achievement: number;
  isLoading?: boolean;
}

// Helper to color percentages consistently
const getPctColor = (p: number) =>
  p >= 100
    ? 'bg-emerald-500'
    : p >= 80
      ? 'bg-blue-500'
      : p >= 50
        ? 'bg-amber-500'
        : 'bg-rose-500';

// Text color variant (paired with bar color)
const getPctTextColor = (p: number) =>
  p >= 100
    ? 'text-emerald-600'
    : p >= 80
      ? 'text-blue-600'
      : p >= 50
        ? 'text-amber-600'
        : 'text-rose-600';

const NoDataAvailable = () => (
  <View className="items-center justify-center p-8 bg-slate-100">
    <View className="w-24 h-24 rounded-full bg-gray-200 items-center justify-center mb-4">
      <AppIcon name="inbox" type="feather" size={40} color="#9CA3AF" />
    </View>
    <AppText size="lg" weight="bold" className="text-gray-600 mb-1">
      No Data Available
    </AppText>
    <AppText className="text-gray-400 text-center">
      There is no data to display for the selected quarter.
    </AppText>
  </View>
);
const TargetAchievementLoading = () => (
  <View className="mx-3">
    <Skeleton width={screenWidth - 24} height={150} borderRadius={12} />
  </View>
);

const TargetAchievementCard = ({
  target,
  achievement,
  isLoading = false,
}: TargetAchievementProps) => {
  const percentage = target ? Math.round((achievement / target) * 100) : 0;

  const getTheme = () => {
    if (percentage >= 70)
      return {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
        icon: 'check-circle',
        iconColor: '#10b981',
        progressBg: 'bg-emerald-500',
      };
    if (percentage >= 40)
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        icon: 'trending-up',
        iconColor: '#3b82f6',
        progressBg: 'bg-blue-500',
      };
    return {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-700',
      icon: 'alert-circle',
      iconColor: '#f97316',
      progressBg: 'bg-orange-500',
    };
  };

  const theme = getTheme();

  if (isLoading) return <TargetAchievementLoading />;
  return (
    <View className="mx-3">
      <Card>
        {/* Header */}
        <View className="flex-row items-center border-b border-gray-200 pb-2">
          <View
            className={`w-10 h-10 rounded-xl ${theme.bg} items-center justify-center`}>
            <AppIcon
              name={theme.icon}
              type="feather"
              size={20}
              color={theme.iconColor}
            />
          </View>
          <AppText weight="extraBold" className="text-lg text-gray-800 ml-3">
            Monthly Performance
          </AppText>
        </View>
        {/* Columns*/}
        <View className="flex-row items-center ">
          <View className="items-center my-3 mx-2">
            <CircularProgressBar
              progress={percentage}
              progressColor={'#10b981'}
              size={100}
              strokeWidth={10}
              duration={1000}
            />
            <AppText className="text-xs text-gray-500 mt-3 self-start mb-1 ml-2">
              ACH / TGT
            </AppText>
            <View className="items-end flex-row border ">
              <AppText className="text-lg" >
                {convertToASINUnits(achievement)}
              </AppText>
              <AppText className="text-md text-gray-500">
                {' '}
                / {convertToASINUnits(target)}
              </AppText>
            </View>
          </View>
          <View className="w-px bg-gray-200 mx-3 border-1 h-full mt-3" />
          <View
            style={{width: screenWidth * 0.55}}
            className="p-4 py-6 rounded bg-lightBg-surface dark:bg-darkBg-surface border border-slate-200 dark:border-slate-700 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            <View className="flex-row items-center justify-between mb-2">
              <AppText weight="semibold" className="text-slate-800" size="sm">
                {'Achievement Details'}
              </AppText>
              <View className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                <AppText size="xs" weight="semibold" className="text-slate-500">
                  TGT {convertToASINUnits(target)}
                </AppText>
              </View>
            </View>

            <View className="mb-3 gap-2">
              <View className="flex-row justify-between mb-1">
                <AppText size="xs" className="text-slate-500">
                  ST - {convertToASINUnits(achievement)}
                </AppText>
                <AppText
                  size="xs"
                  weight="bold"
                  className={getPctTextColor(achievement ? percentage : 0)}>
                  {percentage}%
                </AppText>
              </View>
              <View className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <View
                  className={`h-full ${getPctColor(percentage)} rounded-full`}
                  style={{width: `${Math.min(percentage, 100)}%`}}
                />
              </View>
            </View>
          </View>
        </View>
      </Card>
    </View>
  );
};

export default function Dashboard_ASE({
  DifferentEmployeeCode,
  noPadding,
  noBanner,
}: {
  DifferentEmployeeCode: string;
  noPadding: boolean;
  noBanner: boolean;
}) {
  const {months, selectedMonth, setSelectedMonth} = useMonthHook();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch dashboard data for selected quarter
  const {
    data: dashboardData,
    isLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useDashboardDataAM(
    selectedMonth?.value || '',
    'Total',
    // '',
    // DifferentEmployeeCode,
  );

  const achievementData = useMemo(
    () => ({
      target: dashboardData?.TRGTSummary?.[0]?.Qty_Target || 0,
      achievement: dashboardData?.TRGTSummary?.[0]?.Qty_Achieved || 0,
    }),
    [dashboardData],
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
  };
  const handleRetry = useCallback(() => {
    refetchDashboard();
  }, [refetchDashboard]);

  const isDataEmpty = !isLoading && !dashboardData;

  return (
    <ScrollView
      className={clsx(
        'flex-1 bg-lightBg-base dark:bg-darkBg-base',
        noPadding && 'px-3',
      )}
      contentContainerClassName="flex-grow pb-10 gap-5 pt-3"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={['#3B82F6']}
          tintColor="#3B82F6"
          title="Pull to refresh"
          titleColor="#6B7280"
        />
      }>
      {!noBanner && <BannerComponent />}
      {/* Title and Month Selection */}
      <View className="mb-2 flex-row items-center justify-between px-3 border-b border-slate-300 pb-4">
        <View>
          <AppText weight="semibold" className="text-md  text-slate-700">
            ASE Dashboard
          </AppText>
          <AppText className="text-sm text-slate-400 mt-0.5">
            {selectedMonth?.label || 'Select Month'}
          </AppText>
        </View>
        <View style={{width: 150}}>
          <AppDropdown
            data={months}
            selectedValue={selectedMonth?.value || null}
            onSelect={setSelectedMonth}
            mode="dropdown"
            placeholder="Month"
            style={{zIndex: 2000}}
            listHeight={300}
          />
        </View>
      </View>

      {isDataEmpty ? (
        <NoDataAvailable />
      ) : (
        <>
          <TargetAchievementCard
            target={achievementData.target}
            achievement={achievementData.achievement}
            isLoading={isLoading}
          />
          <ActivationPerformanceComponent
            data={dashboardData?.Top5Model}
            isLoading={isLoading}
            error={dashboardError}
            onRetry={handleRetry}
          />
        </>
      )}
      <AttendanceMarkModal />
    </ScrollView>
  );
}
