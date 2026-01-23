import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  useDashboardActivationData,
  useDashboardBanner,
} from '../../../../hooks/queries/dashboard';
import {
  ActivationData,
  ActivationPerformanceProps,
  ErrorDisplayProps,
  TableColumn,
} from '../../../../types/dashboard';
import ImageSlider from '../../../../components/ImageSlider';
import {TouchableOpacity, View, ScrollView, Linking} from 'react-native';
import {
  ActivationPerformanceSkeleton,
  DashboardBannerSkeleton,
  TargetAchievementSkeleton,
} from '../../../../components/skeleton/DashboardSkeleton';
import {ASUS, screenWidth} from '../../../../utils/constant';
import AppIcon from '../../../../components/customs/AppIcon';
import AppText from '../../../../components/customs/AppText';
import {
  DEFAULT_ACTIVATION_TABS,
  deriveInitialActiveId,
  getActivationTabData,
  getCurrentTabConfig,
  getQuarterDateRange,
  TAB_LABEL_TO_ID,
} from './dashboardUtils';
import AppDatePicker, {
  DatePickerState,
} from '../../../../components/customs/AppDatePicker';
import moment from 'moment';
import Card from '../../../../components/Card';
import AppTabBar, {TabItem} from '../../../../components/CustomTabBar';
import {convertToASINUnits, getDaysBetween, showToast} from '../../../../utils/commonFunctions';
import {CircularProgressBar} from '../../../../components/customs/AppChart';
import {useNavigation} from '@react-navigation/native';
import {AppNavigationProp} from '../../../../types/navigation';
import { useLoginStore } from '../../../../stores/useLoginStore';

export const buildActivationTabItems = (
  labels: string[],
  baseData: any,
  overrideData: any,
  isAPAC: boolean,
): TabItem[] => {
  const source = overrideData || baseData;
  return labels.map(label => {
    const id = TAB_LABEL_TO_ID[label];
    const cfg = getCurrentTabConfig(id,isAPAC);
    const tabData = getActivationTabData(source, id);
    return {
      label,
      name: id,
      component: (
        <View >
          <TableHeader columns={cfg.columns} />
          <DataTable data={tabData} activeTab={id} columns={cfg.columns} />
        </View>
      ),
    } as TabItem;
  });
};

export const DateRangeCard = ({
  setIsVisible,
  dateRange,
}: {
  setIsVisible: (visible: boolean) => void;
  dateRange: DatePickerState;
}) => (
  <Card className="mb-3 rounded-2xl p-0">
    <TouchableOpacity className="p-4" onPress={() => setIsVisible(true)}>
      <View className="flex-row items-center justify-between flex-wrap">
        <View className="flex-row items-center">
          <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center mr-3">
            <AppIcon
              name="calendar"
              size={16}
              color="#3B82F6"
              type="ionicons"
            />
          </View>
          <View>
            <AppText size="xs" color="gray" className="mb-0.5">
              Date Range
            </AppText>
            <AppText size="sm" color="text" weight="semibold">
              {dateRange.start && dateRange.end
                ? `${moment(dateRange.start).format('MMM D, YYYY')} - ${moment(dateRange.end).format('MMM D, YYYY')} ${dateRange.end instanceof Date && dateRange.end === moment().toDate() ? '(Today)' : ''}`
                : 'Select a date range'}
            </AppText>
          </View>
        </View>
        <View className="bg-green-100 dark:bg-[#0EA473] px-3 py-1.5 rounded-full">
          <AppText size="xs" weight="semibold" className={'dark:text-white text-green-600'}>
            {dateRange.start && dateRange.end
              ? getDaysBetween(
                  moment(dateRange.start).format('YYYY-MM-DD'),
                  moment(dateRange.end).format('YYYY-MM-DD'),
                )
              : 0}{' '}
            days
          </AppText>
        </View>
      </View>
    </TouchableOpacity>
  </Card>
);

const TableHeader = ({columns}: {columns: TableColumn[]}) => (
  <View className="bg-lightBg-base dark:bg-darkBg-surface border-b border-gray-200">
    <View className="flex-row items-center px-4 py-3">
      {columns.map(column => (
        <View
          key={column.key}
          className={`${column.width} ${column.key === 'name' ? '' : 'items-center'}`}>
          <AppText size="sm" weight="semibold" color="gray">
            {column.label}
          </AppText>
        </View>
      ))}
    </View>
  </View>
);

const TableRow = ({
  item,
  isLast,
  columns,
}: {
  item: ActivationData;
  isLast: boolean;
  columns: TableColumn[];
}) => (
  <View
    className={`flex-row items-center px-4 py-3 ${!isLast ? 'border-b border-gray-100' : ''}`}>
    {columns.map(column => (
      <View
        key={column.key}
        className={`${column.width} ${column.key === 'name' ? 'flex-row items-center' : 'items-center'}`}>
        <AppText
          size="sm"
          weight={column.key === 'name' ? 'semibold' : 'bold'}
          color={column.colorType}
          >
          {/* {item[column.dataKey] || '0'} */}
          {column.key === 'name'  ? item[column.dataKey] || '---' : column.key === 'h-rate' ? `${item[column.dataKey]} %` : convertToASINUnits(Number(item[column.dataKey]),true) }
        </AppText>
      </View>
    ))}
  </View>
);

const DataTable = ({
  data,
  activeTab,
  columns,
}: {
  data: ActivationData[];
  activeTab: string;
  columns: TableColumn[];
}) => (
  <View className="bg-lightBg-surface dark:bg-darkBg-surface rounded-b-xl overflow-hidden">
    {data.map((item, index) => (
      <TableRow
        key={`${activeTab}-${item.name}-${index}`}
        item={item}
        isLast={index === data.length - 1}
        columns={columns}
      />
    ))}
  </View>
);

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  title,
  message,
  onRetry,
  showRetry = true,
}) => {
  return (
    <View className="flex-1 items-center justify-center p-6">
      <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4">
        <AppIcon name="alert-circle" type="feather" color="#EF4444" size={32} />
      </View>

      <AppText
        size="lg"
        weight="bold"
        color="text"
        className="text-center mb-2">
        {title}
      </AppText>

      <AppText size="sm" color="gray" className="text-center mb-6 max-w-xs">
        {message}
      </AppText>

      {showRetry && onRetry && (
        <TouchableOpacity
          className="bg-secondary px-6 py-3 rounded-lg flex-row items-center"
          activeOpacity={0.7}
          onPress={onRetry}>
          <AppIcon name="refresh-cw" type="feather" color="white" size={16} />
          <AppText size="sm" weight="semibold" color="white" className="ml-2">
            Try Again
          </AppText>
        </TouchableOpacity>
      )}
    </View>
  );
};

export const BannerComponent = () => {
  const {
    data: banners,
    isLoading,
    error: queryError,
    refetch,
  } = useDashboardBanner();
  const navigation = useNavigation<AppNavigationProp>();

  const handleBannerPress = useCallback(
    (item: any) => {
      if (item.BannerURL_Link?.includes('Summary')) {
        //  Move To Scheme Summary Screen
      } else if (!item?.BannerURL_Link?.endsWith('pdf')) {
        console.log('Opening link:', item?.BannerURL_Link);
        Linking.canOpenURL(item?.BannerURL_Link)
          .then(() => {
            Linking.openURL(item?.BannerURL_Link);
          })
          .catch(e => {
            showToast('Unable to open the link');
          });
      } else {
        navigation.push('Banners', {
          Banner_Group_SeqNum: item.Group_Sequence_No,
        });
      }
    },
    [navigation, Linking],
  );

  if (queryError) {
    return (
      <View className="w-full items-center pt-4">
        <ErrorDisplay
          title="Failed to Load Banners"
          message="Unable to retrieve banner information"
          onRetry={refetch}
          showRetry={true}
        />
      </View>
    );
  }
  if (isLoading) return <DashboardBannerSkeleton />;
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
        activeDotColor={true ? "#007BE5" : "#3B82F6"}
        resizeMode="cover"
      />
    </View>
  );
};

export const ActivationPerformanceComponent: React.FC<
  ActivationPerformanceProps
> = ({data, isLoading, error, onRetry, name, tabs,quarter,handleSeeMore}) => {
  const {
    mutate,
    data: activationData,
    isPending: isMutationLoading,
    reset,
  } = useDashboardActivationData();
  const navigation = useNavigation<AppNavigationProp>();
  const userInfo = useLoginStore(state => state.userInfo);
  const isAPAC = useMemo(() => userInfo?.EMP_CountryID !== ASUS.COUNTRIES.ASIN, [userInfo]);
  const providedTabs = useMemo(
    () => (tabs && tabs.length > 0 ? tabs : [...DEFAULT_ACTIVATION_TABS]),
    [tabs],
  );
  const initialActiveId = useMemo(
    () => deriveInitialActiveId(providedTabs,false),
    [providedTabs],
  );
  const [isVisible, setIsVisible] = useState(false);
  const [dateRange, setDateRange] = useState<DatePickerState>({
    start: getQuarterDateRange(quarter).startDate,
    end: moment().toDate(),
  });

  const maximumDate = useMemo(() => new Date(), []);
  const minimumDate = useMemo(() => moment().subtract(5, 'years').toDate(), []);
  const tabItems: TabItem[] = useMemo(
    () => buildActivationTabItems(providedTabs, data, activationData,isAPAC),
    [providedTabs, data, activationData,isAPAC],
  );

  const handleActivationDataFetch = useCallback(
    (startDate?: Date, endDate?: Date) => {
      if (startDate && endDate) {
        const formattedStartDate = moment(startDate).format('YYYY-MM-DD');
        const formattedEndDate = moment(endDate).format('YYYY-MM-DD');
        mutate({
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          masterTab: name,
          isAPAC: userInfo?.EMP_CountryID !== ASUS.COUNTRIES.ASIN  
        });
      }
    },
    [mutate, name, userInfo],
  );

    const onPress = () => {
      if (handleSeeMore) {
        handleSeeMore();
        return;
      }
      let dataToSend = {
        masterTab: name,
        StartDate: moment(dateRange.start).format('YYYY-MM-DD'),
        EndDate: moment(dateRange.end).format('YYYY-MM-DD'),
        Product_Category: '',
      };
  
      let validForManagers = [
        ASUS.ROLE_ID.BSM,
        ASUS.ROLE_ID.BPM,
        ASUS.ROLE_ID.CHANNEL_MARKETING,
        ASUS.ROLE_ID.RSM,
      ] as number[];
  
      if (validForManagers.includes(userInfo.EMP_RoleId)) {
        dataToSend = {
          ...dataToSend,
          masterTab: 'CHANNEL',
        };
      } else if (userInfo.EMP_RoleId == ASUS.ROLE_ID.TM) {
        dataToSend = {
          ...dataToSend,
          masterTab: 'CHANNEL',
        };
      }
      navigation.push('ActPerformanceBranchWise', dataToSend);
    };


    useEffect(() => {
  const { startDate, endDate } = getQuarterDateRange(quarter);
  setDateRange({ start: startDate, end: endDate });
}, [quarter]);
  if (error) {
    return (
      <View className="px-3 py-3">
        <ErrorDisplay
          title="Failed to Load Activation Data"
          message="Unable to retrieve activation performance information"
          onRetry={onRetry}
          showRetry={!!onRetry}
        />
      </View>
    );
  }

  if (isLoading || isMutationLoading) {
    return <ActivationPerformanceSkeleton />;
  }

  return (
    <View className="py-3">
      <View className="flex-row items-center justify-between mb-3">
        <View className="mb-3">
          <View className="flex-row items-center mb-1">
            <View className="w-8 h-8 rounded-lg bg-blue-100 items-center justify-center mr-2">
              <AppIcon
                name="trending-up"
                type="feather"
                size={16}
                color="#2563eb"
              />
            </View>
            <AppText size="lg" weight="bold" color="text">
              Activation Performance
            </AppText>
          </View>
          <AppText size="xs" color="gray" className="pl-10" numberOfLines={2}>
            Top models performance snapshot (sell-out & activation mix)
          </AppText>
        </View>
      </View>
      <DateRangeCard setIsVisible={setIsVisible} dateRange={dateRange} />
      <AppDatePicker
        mode="dateRange"
        visible={isVisible}
        onClose={() => setIsVisible(false)}
        initialStartDate={dateRange.start}
        initialEndDate={dateRange.end}
        initialDate={maximumDate}
        maximumDate={maximumDate}
        minimumDate={minimumDate}
        onDateRangeSelect={(startDate, endDate) => {
          setDateRange({start: startDate, end: endDate});
          handleActivationDataFetch(startDate, endDate);
        }}
      />
      <Card className="p-1 " needSeeMore seeMoreOnPress={onPress}>
        <View className="pt-3 overflow-hidden">
          <AppTabBar tabs={tabItems} initialTabName={initialActiveId} />
        </View>
      </Card>
    </View>
  );
};

interface MonthlyPerformanceItem {
  Month_Name: string; // e.g. "July 2025" or "Jul 2025"
  Qty_Target: number; // Target
  Achieved_Qty: number; // ST (Sell Through)
  SO_Achieved_Qty: number; // SO (Sell Out)
}

interface TargetAchievementProps {
  target: number;
  achievement: number;
  isLoading?: boolean;
  monthlyData?: MonthlyPerformanceItem[]; // Optional monthly breakdown
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

// Modern Monthly Data tiles
const MonthlyDataTiles = ({data}: {data: MonthlyPerformanceItem[]}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView | null>(null);
  const processed = useMemo(
    () =>
      (data || []).map(m => {
        const tgt = m.Qty_Target || 0;
        const st = m.Achieved_Qty || 0;
        const so = m.SO_Achieved_Qty || 0;
        const stPct = tgt ? Math.round((st / tgt) * 100) : 0;
        const soPct = tgt ? Math.round((so / tgt) * 100) : 0;
        return {
          month: m.Month_Name,
          tgt,
          st,
          so,
          stPct,
          soPct,
        };
      }),
    [data],
  );

  if (!processed.length) {
    return (
      <View className="px-1 py-3">
        <AppText size="sm" color="gray" className="text-center">
          No monthly data available
        </AppText>
      </View>
    );
  }

  // Scroll to current month (within active quarter) on mount/update
  useEffect(() => {
    if (!processed.length || !scrollViewRef.current) {
      return;
    }

    const today = moment();
    const renderedOrder = [...processed].reverse();

    const index = renderedOrder.findIndex(item =>
      moment(item.month, ['MMMM YYYY', 'MMM YYYY']).isSame(today, 'month'),
    );

    if (index > 0) {
      // Each tile is treated as ~144px height in paging calculations
      scrollViewRef.current.scrollTo({y: index * 144, animated: false});
      setCurrentIndex(index);
    }
  }, [processed]);
  return (
    <View className="flex-row items-center h-36">
      <ScrollView
        ref={scrollViewRef}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        style={{maxHeight: 144}}
        contentContainerClassName="gap-2"
        nestedScrollEnabled={true}
        onScroll={event => {
          const offsetY = event.nativeEvent.contentOffset.y;
          const index = Math.round(offsetY / 144);
          setCurrentIndex(index);
        }}
        scrollEventThrottle={16}>
        {processed
          .map(item => (
            <View
              key={item.month}
              style={{width: screenWidth * 0.55}}
              className="p-4 py-6 rounded bg-white border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
              <View className="flex-row items-center justify-between mb-2">
                <AppText weight="semibold" className="text-slate-800" size="sm">
                  {item.month}
                </AppText>
                <View className="px-2 py-0.5 rounded-full bg-slate-100">
                  <AppText
                    size="xs"
                    weight="semibold"
                    className="text-slate-500">
                    TGT {convertToASINUnits(item.tgt)}
                  </AppText>
                </View>
              </View>

              {/* Dual progress representation */}
              <View className="mb-3 gap-2">
                <View>
                  <View className="flex-row justify-between mb-1">
                    <AppText size="xs" className="text-slate-500">
                      ST - {convertToASINUnits(item.st)}
                    </AppText>
                    <AppText
                      size="xs"
                      weight="bold"
                      className={getPctTextColor(item.stPct)}>
                      {item.stPct}%
                    </AppText>
                  </View>
                  <View className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <View
                      className={`h-full ${getPctColor(item.stPct)} rounded-full`}
                      style={{width: `${Math.min(item.stPct, 100)}%`}}
                    />
                  </View>
                </View>
                <View>
                  <View className="flex-row justify-between mb-1">
                    <AppText size="xs" className="text-slate-500">
                      SO - {convertToASINUnits(item.so)}
                    </AppText>
                    <AppText
                      size="xs"
                      weight="bold"
                      className={getPctTextColor(item.soPct)}>
                      {item.soPct}%
                    </AppText>
                  </View>
                  <View className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <View
                      className={`h-full ${getPctColor(item.soPct)} rounded-full`}
                      style={{width: `${Math.min(item.soPct, 100)}%`}}
                    />
                  </View>
                </View>
              </View>
            </View>
          ))
          .reverse()}
      </ScrollView>
      <View className="justify-center gap-1">
        {processed.map((item, index) => (
          <View
            key={item.month}
            className={`bg-gray-300 rounded-full mx-1 ${index === currentIndex ? 'w-2 h-4' : 'w-2 h-2'}`}
          />
        ))}
      </View>
    </View>
  );
};

export const TargetAchievementCard = ({
  target,
  achievement,
  isLoading = false,
  monthlyData,
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
  if (isLoading) return <TargetAchievementSkeleton />;
  return ( 
    <Card className="mt-4 border border-slate-200 dark:border-slate-700" noshadow>
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
          Quarterly Performance
        </AppText>
      </View>
      <View className="flex-row items-center ">
        <View className="items-center my-3">
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
          <View className="items-end flex-row">
            <AppText className="text-lg" color="black">
              {convertToASINUnits(achievement)}
            </AppText>
            <AppText className="text-md text-gray-500">
              {' '}
              / {convertToASINUnits(target)}
            </AppText>
          </View>
        </View>
        <View className="w-px bg-gray-200 mx-3 border-1 h-full mt-3" />
        {monthlyData && monthlyData.length > 0 && (
          <MonthlyDataTiles data={monthlyData} />
        )}
      </View>
    </Card>
  );
};
