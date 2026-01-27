import {memo, useMemo, useState} from 'react';
import AppDropdown from '../../../../components/customs/AppDropdown';
import {Pressable, ScrollView, TouchableOpacity, View} from 'react-native';
import AppText from '../../../../components/customs/AppText';
import AppIcon from '../../../../components/customs/AppIcon';
import Card from '../../../../components/Card';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {useNavigation} from '@react-navigation/native';
import {AppNavigationProp} from '../../../../types/navigation';
import Skeleton from '../../../../components/skeleton/skeleton';
import {screenWidth} from '../../../../utils/constant';
import {
  DemoItemReseller,
  DemoItemRetailer,
  METRIC_COLOR,
  MetricProps,
  OFFLINE_STATUS_STYLES,
  ProgressStatProps,
  STAT_PALETTE,
  StatsHeaderProps,
  TerritoryItemRes,
  TerritoryItemRet,
  transformDemoDataRetailer,
  TransformedBranchRes,
  TransformedBranchRet,
  TransformedBranchROI,
  transformTerritoryData,
} from './utils';
import {
  useGetBranchWiseDemoData,
  useGetBranchWiseDemoDataRet,
  useGetSummaryOverviewData,
} from '../../../../hooks/queries/demo';
import Accordion from '../../../../components/Accordion';
import {twMerge} from 'tailwind-merge';
import {AppColors} from '../../../../config/theme';
import FilterButton from '../../../../components/FilterButton';
import clsx from 'clsx';

// helper component
const ProgressStat: React.FC<ProgressStatProps> = ({
  label,
  percent,
  current,
  total,
  barTint = 'bg-violet-500',
  percentTint,
}) => {
  const barWidth = Math.min(100, Math.max(0, percent));
  return (
    <View className="mb-4 last:mb-0">
      <View className="flex-row justify-between items-center">
        <AppText size="sm" className="text-slate-500">
          {label}
        </AppText>
        <AppText size="sm" className={`${percentTint} font-medium`}>
          {percent}% ({current})
        </AppText>
      </View>
      <View className="w-full h-2 rounded-full bg-slate-100 overflow-hidden mt-1">
        <View style={{width: `${barWidth}%`}} className={`h-full ${barTint}`} />
      </View>
    </View>
  );
};

const Metric: React.FC<MetricProps> = memo(({label, value, icon, tint}) => (
  <View className="w-1/3 mb-4 px-1">
    <View className="flex-row items-center">
      <View className="w-7 h-7 rounded-md bg-slate-100 items-center justify-center mr-2">
        <AppIcon
          name={icon as any}
          type="feather"
          size={14}
          color={tint === 'slate' ? '#475569' : undefined}
        />
      </View>
      <View className="flex-1">
        <AppText size="sm" className="text-slate-400" numberOfLines={1}>
          {label}
        </AppText>
        <AppText size="base" weight="medium" className={METRIC_COLOR[tint]}>
          {value}
        </AppText>
      </View>
    </View>
  </View>
));

// component
export const SummaryOverView = memo(() => {
  const {data, isLoading} = useGetSummaryOverviewData();
  const Totals = useMemo(() => {
    if (!data) return {models: 0, stores: 0};
    let modelSum = 0;
    let storeSum = 0;
    data.forEach(item => {
      modelSum += item.Total_Offline_Models;
      storeSum += item.Store_count;
    });
    return {models: modelSum, stores: storeSum};
  }, [data]);
  if (isLoading)
    return <Skeleton width={screenWidth - 20} height={50} borderRadius={12} />;
  if (!data) return null;
  return (
    <Accordion
      containerClassName="mt-2 border border-slate-200 dark:border-slate-700 rounded-2xl"
      headerClassName="bg-white px-3 py-3"
      needBottomBorder={false}
      header={
        <View className="flex-row items-center gap-x-1">
          <View className="w-7 h-7 bg-blue-100 rounded-full justify-center items-center">
            <AppIcon name="info" type="feather" size={17} color="#2563eb" />
          </View>
          <AppText weight="semibold" size="md">
            Summary Overview
          </AppText>
        </View>
      }>
      <View className="px-3 pb-3 bg-white dark:bg-slate-900 rounded-b-2xl">
        <View className="flex-row items-stretch gap-2 mb-3">
          <View className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg">
            <AppText
              weight="semibold"
              size="xs"
              className="text-slate-500 dark:text-slate-300 uppercase">
              Total Offline Models
            </AppText>
            <AppText
              size="lg"
              weight="bold"
              className="text-slate-900 dark:text-slate-50 text-center">
              {Totals.models.toLocaleString('en-US')}
            </AppText>
          </View>
          <View className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg">
            <AppText
              weight="semibold"
              size="xs"
              className="text-slate-500 dark:text-slate-300 uppercase">
              Total Stores
            </AppText>
            <AppText
              size="lg"
              weight="bold"
              className="text-slate-900 dark:text-slate-50 text-center">
              {Totals.stores.toLocaleString('en-US')}
            </AppText>
          </View>
        </View>

        <View className="ßborder border-slate-200 dark:border-slate-700">
          <View className="flex-row items-center justify-between px-2 py-1.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/70">
            <AppText
              weight="semibold"
              size="sm"
              className="flex-1 text-slate-700 dark:text-slate-100">
              Vertical
            </AppText>
            <AppText
              weight="semibold"
              size="sm"
              className="w-24 text-center text-slate-700 dark:text-slate-100">
              Offline
            </AppText>
            <AppText
              weight="semibold"
              size="sm"
              className="w-16 text-center text-slate-700 dark:text-slate-100">
              Stores
            </AppText>
            <AppText
              weight="semibold"
              size="sm"
              className="w-32 text-center text-slate-700 dark:text-slate-100">
              Status
            </AppText>
          </View>
          {data.map((item, idx) => {
            const palette = OFFLINE_STATUS_STYLES[item.Status];
            const stripe =
              idx % 2 === 0
                ? 'bg-white dark:bg-slate-900'
                : 'bg-slate-50 dark:bg-slate-900/60';

            return (
              <View
                key={item.Vertical}
                className={twMerge(
                  'flex-row items-center px-2 py-2',
                  idx !== data.length - 1 &&
                    'border-b border-slate-100 dark:border-slate-800',
                  stripe,
                )}>
                <View className="flex-1">
                  <AppText
                    weight="semibold"
                    size="sm"
                    className="text-slate-900 dark:text-slate-50">
                    {item.Vertical}
                  </AppText>
                </View>

                <AppText
                  weight="semibold"
                  size="sm"
                  className="w-24 text-center text-slate-800 dark:text-slate-50">
                  {item.Total_Offline_Models.toLocaleString('en-US')}
                </AppText>
                <AppText
                  weight="semibold"
                  size="sm"
                  className="w-16 text-center text-slate-800 dark:text-slate-50">
                  {item.Store_count.toLocaleString('en-US')}
                </AppText>

                <View className="w-32">
                  <View
                    className={twMerge(
                      'px-2 py-0.5 rounded-full',
                      palette.bg,
                      palette.border,
                    )}>
                    <AppText
                      weight="semibold"
                      size="xs"
                      className={twMerge(
                        'uppercase text-center',
                        palette.text,
                      )}>
                      {item.Status}
                    </AppText>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </Accordion>
  );
});

export const StatsHeader = memo(
  ({
    stats,
    counts,
  }: StatsHeaderProps) => {
    return (
      <View className="mb-3">
        <Card
          className="p-3 border border-slate-200 dark:border-slate-700"
          noshadow>
          <View className="pb-2 border-b border-slate-100 dark:border-slate-700">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View className="w-8 h-8 rounded-full bg-primary/10 dark:bg-primary-dark/20 items-center justify-center">
                  <AppIcon
                    name="bar-chart-2"
                    type="feather"
                    size={16}
                    color={AppColors.primary}
                  />
                </View>
                <AppText
                  size="base"
                  weight="semibold"
                  className="text-slate-800 dark:text-slate-100">
                  Overall Summary
                </AppText>
              </View>
            </View>
          </View>

          <View className="flex-row  -mx-1 mt-2">
            {stats.map((s, idx) => {
              const palette = STAT_PALETTE[s.name];
              const isLastInRow = idx === stats.length - 1;
              return (
                <View
                  key={s.label}
                  className={clsx(
                    'flex-1 px-1 mb-2',
                    !isLastInRow && 'border-r border-slate-200',
                  )}>
                  <View className="items-center p-2.5 dark:border-slate-700 dark:bg-slate-800/70">
                    <View
                      className={twMerge(
                        'mb-1.5 h-9 w-9 items-center justify-center rounded-md',
                        palette.iconBg,
                      )}>
                      <AppIcon
                        name={s.icon}
                        type={s.iconType as any}
                        size={18}
                        color="white"
                      />
                    </View>
                    <AppText
                      size="md"
                      weight="semibold"
                      className="text-slate-900 dark:text-slate-50 leading-snug text-center">
                      {s.value}
                    </AppText>
                    <AppText
                      size="xs"
                      weight="semibold"
                      className={twMerge(
                        'mt-0.5 uppercase text-slate-600 dark:text-slate-300 text-center',
                        palette.tint,
                      )}
                      numberOfLines={2}>
                      {s.label}
                    </AppText>
                  </View>
                </View>
              );
            })}
          </View>
        </Card>
        <SummaryOverView />
        <View className="flex-row items-center justify-between px-1 mt-2">
          {counts.awp_count !== null && (
            <AppText className="text-slate-700 dark:text-slate-300">
              AWP Partners: <AppText weight="bold">{counts.awp_count}</AppText>
            </AppText>
          )}
          {counts.total_partners !== null && (
            <AppText className="text-slate-700 dark:text-slate-300">
              Total Partners:{' '}
              <AppText weight="bold">{counts.total_partners}</AppText>
            </AppText>
          )}
        </View>
      </View>
    );
  },
);

export const DemoSkeleton: React.FC = () => {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      className="flex-1 pt-5  px-3 bg-lightBg-base">
      <Skeleton width={screenWidth - 24} height={200} borderRadius={12} />
      <View className="mt-5 pb-20">
        <Skeleton width={screenWidth - 24} height={100} borderRadius={6} />
        <Skeleton width={screenWidth - 24} height={100} borderRadius={6} />
        <Skeleton width={screenWidth - 24} height={100} borderRadius={6} />
        <Skeleton width={screenWidth - 24} height={100} borderRadius={6} />
        <Skeleton width={screenWidth - 24} height={100} borderRadius={6} />
      </View>
    </ScrollView>
  );
};

// Resller Component
export const BranchCard = memo(
  ({
    item,
    summaryData,
    yearQtr,
    category,
    premiumKiosk = 0,
    rogKiosk = 0,
    partnerType,
    IsCompulsory,
    noTerritoryButton,
  }: {
    item: TransformedBranchRes;
    summaryData: {
      at_least_single_demo: number;
      demo_100: number;
      at_80_demo?: number;
    };
    yearQtr: string;
    category: string;
    premiumKiosk?: number|null;
    rogKiosk?: number|null;
    partnerType: string | null;
    IsCompulsory?: string;
    noTerritoryButton: boolean;
  }) => {
    const [showFront, setShowFront] = useState(true);
    const [frontCardHeight, setFrontCardHeight] = useState(0);
    const [backCardHeight, setBackCardHeight] = useState(0);
    const rotate = useSharedValue(0);
    const containerHeight = useSharedValue(0);
    const navigation = useNavigation<AppNavigationProp>();

    // Fetch territory data only when card is flipped
    const {data: territoryData, isLoading: isLoadingTerritories} =
      useGetBranchWiseDemoData(
        yearQtr,
        category,
        premiumKiosk,
        rogKiosk,
        item.state,
        IsCompulsory || '',
        !showFront,
      );

    // Transform and filter territory data
    const territories = useMemo(() => {
      if (!territoryData || showFront) return [];

      const transformed = transformTerritoryData(territoryData);

      // Apply frontend partner type filtering
      if (partnerType) {
        const filterDemoItemsByPartnerType = (
          items: DemoItemReseller[],
          partnerType: string | null,
        ): DemoItemReseller[] => {
          if (!partnerType || partnerType === 'All') return items;
          return items.filter(item => item.AGP_Or_T3 === partnerType);
        };
        return transformed
          .map(territory => ({
            ...territory,
            partners: filterDemoItemsByPartnerType(
              territory.partners,
              partnerType,
            ),
          }))
          .filter(territory => territory.partners.length > 0);
      }

      return transformed;
    }, [territoryData, showFront, partnerType]);

    const atLeastSinglePercent = useMemo(() => {
      if (summaryData.at_least_single_demo === 0) return 0;
      return Math.round(
        (item.at_least_single_demo / summaryData.at_least_single_demo) * 100,
      );
    }, [item.at_least_single_demo, summaryData.at_least_single_demo]);

    const demo100Percent = useMemo(() => {
      if (summaryData.demo_100 === 0) return 0;
      return Math.round((item.demo_100 / summaryData.demo_100) * 100);
    }, [item.demo_100, summaryData.demo_100]);

    const flipCard = () => {
      // Determine target height before we toggle state
      const targetHeight = showFront
        ? backCardHeight || frontCardHeight
        : frontCardHeight || backCardHeight;
      if (targetHeight) {
        containerHeight.value = withTiming(targetHeight, {
          duration: 600,
          easing: Easing.out(Easing.cubic),
        });
      }
      rotate.value = withTiming(showFront ? 180 : 0, {
        duration: 600,
        easing: Easing.out(Easing.cubic),
      });
      setShowFront(prev => !prev);
    };

    const frontAnimatedStyle = useAnimatedStyle(() => {
      return {
        transform: [
          {rotateY: `${interpolate(rotate.value, [0, 180], [0, 180])}deg`},
        ],
        opacity: interpolate(rotate.value, [0, 90], [1, 0]),
      };
    });

    const backAnimatedStyle = useAnimatedStyle(() => {
      return {
        transform: [
          {rotateY: `${interpolate(rotate.value, [0, 180], [180, 360])}deg`},
        ],
        opacity: interpolate(rotate.value, [90, 180], [0, 1]),
      };
    });
    const containerStyle = useAnimatedStyle(() => ({
      height: containerHeight.value || undefined,
    }));
    return (
      <View className="mb-3">
        <Animated.View style={[containerStyle]} className="relative">
          {/* Front Card */}
          <Animated.View
            style={frontAnimatedStyle}
            // Measure front height once; initialize container height
            onLayout={e => {
              const h = e.nativeEvent.layout.height;
              if (!frontCardHeight && h) {
                setFrontCardHeight(h);
                if (!containerHeight.value) containerHeight.value = h;
              }
            }}
            pointerEvents={showFront ? 'auto' : 'none'}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                navigation.push('DemoPartners', {
                  partners: item.partners,
                  yearQtr,
                });
              }}>
              <Card
                className="p-0 border border-slate-200 dark:border-slate-700"
                noshadow>
                <View className="flex-row items-center gap-2 pb-2 border-b border-slate-100 pt-4 px-3">
                  <View className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center">
                    <AppIcon
                      name="map-pin"
                      type="feather"
                      size={16}
                      color="black"
                    />
                  </View>
                  <AppText
                    size="base"
                    weight="semibold"
                    className="text-slate-800 tracking-tight flex-1"
                    numberOfLines={1}>
                    {item.state}
                  </AppText>
                  <View className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center">
                    <AppIcon
                      name="chevron-right"
                      type="feather"
                      size={16}
                      color="#475569"
                    />
                  </View>
                </View>
                {/* Metric grid */}
                <View className="mt-3 px-3 flex-row flex-wrap pb-2 border-b border-slate-100">
                  <Metric
                    label={partnerType ? partnerType : 'Partners'}
                    value={item.partner_count}
                    icon="users"
                    tint="slate"
                  />
                  {item.awp_Count !== null && (
                    <Metric
                      label="AWP Count"
                      value={item.awp_Count}
                      icon="users"
                      tint="blue"
                    />
                  )}
                  {item.rog_kiosk !== null && (
                    <Metric
                      label="ROG Kiosk"
                      value={item.rog_kiosk}
                      icon="monitor"
                      tint="teal"
                    />
                  )}

                  {item.pkiosk !== null && (
                    <Metric
                      label="Premium Kiosk"
                      value={item.pkiosk}
                      icon="star"
                      tint="amber"
                    />
                  )}
                  {item.pkiosk_rogkiosk !== null && (
                    <Metric
                      label="P+ROG Kiosk"
                      value={item.pkiosk_rogkiosk}
                      icon="layers"
                      tint="violet"
                    />
                  )}
                  {item.pending !== null && (
                    <Metric
                      label="Pending"
                      value={item.pending}
                      icon="pause-circle"
                      tint="yellow"
                    />
                  )}
                </View>
                {/* Progress section */}
                <View className={clsx("mt-5 px-3 gap-3", noTerritoryButton && "mb-4")}>
                  {item.at_least_single_demo !== null && (
                    <ProgressStat
                      label="At Least Single"
                      percent={atLeastSinglePercent}
                      current={item.at_least_single_demo}
                      total={summaryData.at_least_single_demo}
                      barTint="bg-violet-500"
                      percentTint="text-violet-600"
                    />
                  )}
                  {item.demo_100 !== null && (
                    <ProgressStat
                      label="100% Demo"
                      percent={demo100Percent}
                      current={item.demo_100}
                      total={summaryData.demo_100}
                      barTint="bg-teal-500"
                      percentTint="text-teal-600"
                    />
                  )}
                </View>
                {!noTerritoryButton && <Pressable
                  onPress={flipCard}
                  className="px-3 py-3 items-center mt-3">
                  <AppText size="sm" className="text-primary" weight="medium">
                    Tap here to view territories
                  </AppText>
                </Pressable>}
              </Card>
            </TouchableOpacity>
          </Animated.View>
          {/* Back Card - Territory Details */}
          <Animated.View
            style={[backAnimatedStyle]}
            className={'absolute w-full'}
            pointerEvents={!showFront ? 'auto' : 'none'}>
            <View
              onLayout={e => {
                const h = e.nativeEvent.layout.height;
                setBackCardHeight(h);
                if (!showFront && h) {
                  containerHeight.value = h;
                }
              }}>
              <Card
                className="p-0 border border-slate-200 dark:border-slate-700"
                noshadow>
                {/* Header with flip back button */}
                <Pressable
                  onPress={flipCard}
                  className="flex-row items-center gap-2 pb-2 border-b border-slate-100 pt-4 px-3 active:opacity-70">
                  <View className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center">
                    <AppIcon
                      name="arrow-left"
                      type="feather"
                      size={16}
                      color="#475569"
                    />
                  </View>
                  <AppText
                    size="base"
                    weight="semibold"
                    className="text-slate-800 tracking-tight flex-1"
                    numberOfLines={1}>
                    {item.state} - Territories
                  </AppText>
                  <View className="px-2 py-1 rounded-full bg-slate-100">
                    <AppText size="xs" className="text-slate-500">
                      {territories.length}
                    </AppText>
                  </View>
                </Pressable>

                {/* Territory List */}
                <View className="px-3 pt-3 pb-4">
                  {isLoadingTerritories ? (
                    <View className="gap-3">
                      <Skeleton
                        width={screenWidth - 60}
                        height={120}
                        borderRadius={12}
                      />
                      <Skeleton
                        width={screenWidth - 60}
                        height={120}
                        borderRadius={12}
                      />
                      <Skeleton
                        width={screenWidth - 60}
                        height={120}
                        borderRadius={12}
                      />
                    </View>
                  ) : territories.length === 0 ? (
                    <View className="items-center py-8">
                      <AppIcon
                        name="inbox"
                        type="feather"
                        size={24}
                        color="#94a3b8"
                      />
                      <AppText size="sm" className="text-slate-400 mt-2">
                        No territory data available
                      </AppText>
                    </View>
                  ) : (
                    <View className="gap-3">
                      {territories.map(territory => (
                        <TerritoryCard
                          key={territory.id}
                          territory={territory}
                          partnerType={partnerType}
                          navigation={navigation}
                          yearQtr={yearQtr}
                        />
                      ))}
                    </View>
                  )}
                </View>
              </Card>
            </View>
          </Animated.View>
        </Animated.View>
      </View>
    );
  },
);

export const TerritoryCard: React.FC<{
  territory: TerritoryItemRes;
  partnerType: string | null;
  navigation: any;
  yearQtr: string;
}> = memo(({territory, partnerType, navigation, yearQtr}) => {
  return (
    <TouchableOpacity
      className="rounded-xl border border-slate-100 bg-white/50 overflow-hidden"
      onPress={() => {
        navigation.push('DemoPartners', {
          partners: territory.partners,
          yearQtr,
        });
      }}>
      {/* Territory Header */}
      <View className="flex-row items-center px-3 py-2 bg-slate-50/60 border-b border-slate-100">
        <View className="w-7 h-7 rounded-md bg-slate-100 items-center justify-center mr-2">
          <AppIcon name="map" type="feather" size={14} color="#475569" />
        </View>
        <AppText
          size="sm"
          weight="medium"
          className="text-slate-700 flex-1"
          numberOfLines={1}>
          {territory.territory}
        </AppText>
        <View className="w-7 h-7 rounded-full bg-slate-100 items-center justify-center">
          <AppIcon
            name="chevron-right"
            type="feather"
            size={14}
            color="#475569"
          />
        </View>
      </View>

      {/* Territory Metrics */}
      <View className="flex-row flex-wrap mt-2 px-3">
        <Metric
          label={partnerType ? partnerType : 'Partners'}
          value={territory.partner_count}
          icon="users"
          tint="slate"
        />
        <Metric
          label="AWP Count"
          value={territory.awp_Count}
          icon="users"
          tint="slate"
        />
        <Metric
          label="ROG Kiosk"
          value={territory.rog_kiosk}
          icon="monitor"
          tint="teal"
        />
        <Metric
          label="Premium Kiosk"
          value={territory.pkiosk}
          icon="star"
          tint="amber"
        />
        <Metric
          label="P+ROG Kiosk"
          value={territory.pkiosk_rogkiosk}
          icon="layers"
          tint="violet"
        />
      </View>

      {/* Territory Progress Stats */}
      <View className="mt-2 px-3 pb-3 gap-3">
        <ProgressStat
          label="At Least Single"
          percent={
            territory.partner_count > 0
              ? Math.round(
                  (territory.at_least_single_demo / territory.partner_count) *
                    100,
                )
              : 0
          }
          current={territory.at_least_single_demo}
          total={territory.partner_count}
          barTint="bg-violet-500"
          percentTint="text-violet-600"
        />
        <ProgressStat
          label="100% Demo"
          percent={
            territory.partner_count > 0
              ? Math.round((territory.demo_100 / territory.partner_count) * 100)
              : 0
          }
          current={territory.demo_100}
          total={territory.partner_count}
          barTint="bg-teal-500"
          percentTint="text-teal-600"
        />
      </View>
    </TouchableOpacity>
  );
});

// Retailer Component
export const BranchCardRet = memo(
  ({
    item,
    summaryData,
    yearQtr,
    category,
    partnerType,
    IsCompulsory,
    noTerritoryButton,
  }: {
    item: TransformedBranchRet;
    summaryData: {
      at_least_single_demo: number;
      demo_100: number;
      at_80_demo: number;
    };
    yearQtr: string;
    category: string;
    partnerType: string | null;
    IsCompulsory?: string;
    noTerritoryButton?: boolean;
  }) => {
    const [showFront, setShowFront] = useState(true);
    const [frontCardHeight, setFrontCardHeight] = useState(0);
    const [backCardHeight, setBackCardHeight] = useState(0);
    const rotate = useSharedValue(0);
    const containerHeight = useSharedValue(0);
    const navigation = useNavigation<AppNavigationProp>();

    // Fetch territory data only when card is flipped
    const {data: territoryData, isLoading: isLoadingTerritories} =
      useGetBranchWiseDemoDataRet(
        yearQtr,
        category,
        item.state,
        IsCompulsory || '',
        !showFront,
      );
    // Transform and filter territory data
    const territories = useMemo(() => {
      if (!territoryData || showFront) return [];
      const transformed = transformDemoDataRetailer(territoryData, {groupType: 'territory',labelKey: 'territory'});

      // Apply frontend partner type filtering
      if (partnerType) {
        const filterDemoItemsByPartnerType = (
          items: DemoItemRetailer[],
          partnerType: string | null,
        ): DemoItemRetailer[] => {
          if (!partnerType || partnerType === 'All') return items;
          return items.filter(item => item.PartnerType === partnerType);
        };
        return transformed
          .map(({...territory}) => ({
            ...territory,
            partners: filterDemoItemsByPartnerType(territory.partners, partnerType),
          }))
          .filter(item => item.partners.length > 0);
      }
      return transformed;
    }, [territoryData, showFront, partnerType]);


    const atLeastSinglePercent = useMemo(() => {
      if (summaryData.at_least_single_demo === 0) return 0;
      return Math.round(
        (item.at_least_single_demo / summaryData.at_least_single_demo) * 100,
      );
    }, [item.at_least_single_demo, summaryData.at_least_single_demo]);

    const demo100Percent = useMemo(() => {
      if (summaryData.demo_100 === 0) return 0;
      return Math.round((item.demo_100 / summaryData.demo_100) * 100);
    }, [item.demo_100, summaryData.demo_100]);

    const demo80Percent = useMemo(() => {
      if (!summaryData.at_80_demo || summaryData.at_80_demo === 0) return 0;
      return Math.round((item.at_80_demo / summaryData.at_80_demo) * 100);
    }, [item.at_80_demo, summaryData.at_80_demo]);

    const flipCard = () => {
      // Determine target height before we toggle state
      const targetHeight = showFront
        ? backCardHeight || frontCardHeight
        : frontCardHeight || backCardHeight;
      if (targetHeight) {
        containerHeight.value = withTiming(targetHeight, {
          duration: 600,
          easing: Easing.out(Easing.cubic),
        });
      }
      rotate.value = withTiming(showFront ? 180 : 0, {
        duration: 600,
        easing: Easing.out(Easing.cubic),
      });
      setShowFront(prev => !prev);
    };

    const frontAnimatedStyle = useAnimatedStyle(() => {
      return {
        transform: [
          {rotateY: `${interpolate(rotate.value, [0, 180], [0, 180])}deg`},
        ],
        opacity: interpolate(rotate.value, [0, 90], [1, 0]),
      };
    });

    const backAnimatedStyle = useAnimatedStyle(() => {
      return {
        transform: [
          {rotateY: `${interpolate(rotate.value, [0, 180], [180, 360])}deg`},
        ],
        opacity: interpolate(rotate.value, [90, 180], [0, 1]),
      };
    });
    const containerStyle = useAnimatedStyle(() => ({
      height: containerHeight.value || undefined,
    }));
    return (
      <View className="mb-3">
        <Animated.View style={[containerStyle]} className="relative">
          {/* Front Card */}
          <Animated.View
            style={frontAnimatedStyle}
            // Measure front height once; initialize container height
            onLayout={e => {
              const h = e.nativeEvent.layout.height;
              if (!frontCardHeight && h) {
                setFrontCardHeight(h);
                if (!containerHeight.value) containerHeight.value = h;
              }
            }}
            pointerEvents={showFront ? 'auto' : 'none'}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                navigation.push('DemoPartners', {
                  partners: item.partners,
                  yearQtr,
                });
              }}>
              <Card
                className="p-0 border border-slate-200 dark:border-slate-700"
                noshadow>
                <View className="flex-row items-center gap-2 pb-2 border-b border-slate-100 pt-4 px-3">
                  <View className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center">
                    <AppIcon
                      name="map-pin"
                      type="feather"
                      size={16}
                      color="black"
                    />
                  </View>
                  <AppText
                    size="base"
                    weight="semibold"
                    className="text-slate-800 tracking-tight flex-1"
                    numberOfLines={1}>
                    {item.state}
                  </AppText>
                  <View className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center">
                    <AppIcon
                      name="chevron-right"
                      type="feather"
                      size={16}
                      color="#475569"
                    />
                  </View>
                </View>
                {/* Metric grid */}
                <View className="mt-3 px-3 flex-row flex-wrap pb-2 border-b border-slate-100">
                  <Metric
                    label={partnerType ? partnerType : 'Partners'}
                    value={item.partner_count}
                    icon="users"
                    tint="slate"
                  />
                   <Metric
                    label={'Pending'}
                    value={item.pending}
                    icon="layers"
                    tint="violet"
                  />
                </View>
                {/* Progress section */}
                <View className={clsx("mt-5 px-3 gap-3", noTerritoryButton && "pb-4")}>
                  {item.at_least_single_demo != null ? (
                    <ProgressStat
                      label="At Least Single"
                      percent={atLeastSinglePercent}
                      current={item.at_least_single_demo}
                      total={summaryData.at_least_single_demo}
                      barTint="bg-violet-500"
                      percentTint="text-violet-600"
                    />
                  ) : (
                    false
                  )}
                  {item.at_80_demo != null ? (
                    <ProgressStat
                      label="80% Demo"
                      percent={demo80Percent}
                      current={item.at_80_demo}
                      total={summaryData.at_80_demo || 0}
                      barTint="bg-sky-500"
                      percentTint="text-sky-600"
                    />
                  ) : (
                    false
                  )}
                  {item.demo_100 != null ? (
                    <ProgressStat
                      label="100% Demo"
                      percent={demo100Percent}
                      current={item.demo_100}
                      total={summaryData.demo_100}
                      barTint="bg-teal-500"
                      percentTint="text-teal-600"
                    />
                  ) : (
                    false
                  )}
                </View>
               {!noTerritoryButton && <Pressable
                  onPress={flipCard}
                  className="px-3 py-3 items-center mt-3">
                  <AppText size="sm" className="text-primary" weight="medium">
                    Tap here to view territories
                  </AppText>
                </Pressable>}
              </Card>
            </TouchableOpacity>
          </Animated.View>
          {/* Back Card - Territory Details */}
          <Animated.View
            style={[backAnimatedStyle]}
            className={'absolute w-full'}
            pointerEvents={!showFront ? 'auto' : 'none'}>
            <View
              onLayout={e => {
                const h = e.nativeEvent.layout.height;
                setBackCardHeight(h);
                if (!showFront && h) {
                  containerHeight.value = h;
                }
              }}>
              <Card
                className="p-0 border border-slate-200 dark:border-slate-700"
                noshadow>
                {/* Header with flip back button */}
                <Pressable
                  onPress={flipCard}
                  className="flex-row items-center gap-2 pb-2 border-b border-slate-100 pt-4 px-3 active:opacity-70">
                  <View className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center">
                    <AppIcon
                      name="arrow-left"
                      type="feather"
                      size={16}
                      color="#475569"
                    />
                  </View>
                  <AppText
                    size="base"
                    weight="semibold"
                    className="text-slate-800 tracking-tight flex-1"
                    numberOfLines={1}>
                    {item.state} - Territories
                  </AppText>
                  <View className="px-2 py-1 rounded-full bg-slate-100">
                    <AppText size="xs" className="text-slate-500">
                      {territories.length}
                    </AppText>
                  </View>
                </Pressable>

                {/* Territory List */}
                <View className="px-3 pt-3 pb-4">
                  {isLoadingTerritories ? (
                    <View className="gap-3">
                      <Skeleton
                        width={screenWidth - 60}
                        height={120}
                        borderRadius={12}
                      />
                      <Skeleton
                        width={screenWidth - 60}
                        height={120}
                        borderRadius={12}
                      />
                      <Skeleton
                        width={screenWidth - 60}
                        height={120}
                        borderRadius={12}
                      />
                    </View>
                  ) : territories.length === 0 ? (
                    <View className="items-center py-8">
                      <AppIcon
                        name="inbox"
                        type="feather"
                        size={24}
                        color="#94a3b8"
                      />
                      <AppText size="sm" className="text-slate-400 mt-2">
                        No territory data available
                      </AppText>
                    </View>
                  ) : (
                    <View className="gap-3">
                      {territories.map(territory => (
                        <TerritoryCardRet
                          key={territory.id}
                          territory={territory}
                          partnerType={partnerType}
                          navigation={navigation}
                          yearQtr={yearQtr}
                        />
                      ))}
                    </View>
                  )}
                </View>
              </Card>
            </View>
          </Animated.View>
        </Animated.View>
      </View>
    );
  },
);

export const TerritoryCardRet: React.FC<{
  territory: TerritoryItemRet;
  partnerType: string | null;
  navigation: any;
  yearQtr: string;
}> = memo(({territory, partnerType, navigation, yearQtr}) => {
  return (
    <TouchableOpacity
      className="rounded-xl border border-slate-100 bg-white/50 overflow-hidden"
      onPress={() => {
        navigation.push('DemoPartners', {
          partners: territory.partners,
          yearQtr,
        });
      }}>
      {/* Territory Header */}
      <View className="flex-row items-center px-3 py-2 bg-slate-50/60 border-b border-slate-100">
        <View className="w-7 h-7 rounded-md bg-slate-100 items-center justify-center mr-2">
          <AppIcon name="map" type="feather" size={14} color="#475569" />
        </View>
        <AppText
          size="sm"
          weight="medium"
          className="text-slate-700 flex-1"
          numberOfLines={1}>
          {territory.territory}
        </AppText>
        <View className="w-7 h-7 rounded-full bg-slate-100 items-center justify-center">
          <AppIcon
            name="chevron-right"
            type="feather"
            size={14}
            color="#475569"
          />
        </View>
      </View>

      {/* Territory Metrics */}
      <View className="flex-row flex-wrap mt-2 px-3">
        <Metric
          label={partnerType ? partnerType : 'Partners'}
          value={territory.partner_count}
          icon="users"
          tint="slate"
        />
      </View>

      {/* Territory Progress Stats */}
      <View className="mt-2 px-3 pb-3 gap-3">
        <ProgressStat
          label="At Least Single"
          percent={
            territory.partner_count > 0
              ? Math.round(
                  (territory.at_least_single_demo / territory.partner_count) *
                    100,
                )
              : 0
          }
          current={territory.at_least_single_demo}
          total={territory.partner_count}
          barTint="bg-violet-500"
          percentTint="text-violet-600"
        />
        <ProgressStat
          label="80% Demo"
          percent={
            territory.partner_count > 0
              ? Math.round(
                  (territory.at_80_demo / territory.partner_count) * 100,
                )
              : 0
          }
          current={territory.at_80_demo}
          total={territory.partner_count}
          barTint="bg-violet-500"
          percentTint="text-violet-600"
        />
        <ProgressStat
          label="100% Demo"
          percent={
            territory.partner_count > 0
              ? Math.round((territory.demo_100 / territory.partner_count) * 100)
              : 0
          }
          current={territory.demo_100}
          total={territory.partner_count}
          barTint="bg-teal-500"
          percentTint="text-teal-600"
        />
      </View>
    </TouchableOpacity>
  );
});

// LFR Component
export const BranchCardLFR = memo(
  ({
    item,
    summaryData,
    yearQtr,
  }: {
    item: TransformedBranchRet;
    summaryData: {
      at_least_single_demo: number;
      demo_100: number;
      at_80_demo: number;
    };
    yearQtr: string;
  }) => {
    const navigation = useNavigation<AppNavigationProp>();

    const atLeastSinglePercent = useMemo(() => {
      if (summaryData.at_least_single_demo === 0) return 0;
      return Math.round(
        (item.at_least_single_demo / summaryData.at_least_single_demo) * 100,
      );
    }, [item.at_least_single_demo, summaryData.at_least_single_demo]);

    const demo100Percent = useMemo(() => {
      if (summaryData.demo_100 === 0) return 0;
      return Math.round((item.demo_100 / summaryData.demo_100) * 100);
    }, [item.demo_100, summaryData.demo_100]);

    const demo80Percent = useMemo(() => {
      if (!summaryData.at_80_demo || summaryData.at_80_demo === 0) return 0;
      return Math.round((item.at_80_demo / summaryData.at_80_demo) * 100);
    }, [item.at_80_demo, summaryData.at_80_demo]);
    return (
      <TouchableOpacity
      className='mb-3'
              activeOpacity={0.8}
              onPress={() => {
                navigation.push('DemoPartners', {
                  partners: item.partners,
                  yearQtr,
                });
              }}>
              <Card
                className="p-0 border border-slate-200 dark:border-slate-700"
                noshadow>
                <View className="flex-row items-center gap-2 pb-2 border-b border-slate-100 pt-4 px-3">
                  <View className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center">
                    <AppIcon
                      name="map-pin"
                      type="feather"
                      size={16}
                      color="black"
                    />
                  </View>
                  <AppText
                    size="base"
                    weight="semibold"
                    className="text-slate-800 tracking-tight flex-1"
                    numberOfLines={1}>
                    {item.state}
                  </AppText>
                  <View className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center">
                    <AppIcon
                      name="chevron-right"
                      type="feather"
                      size={16}
                      color="#475569"
                    />
                  </View>
                </View>
                {/* Metric grid */}
                <View className="mt-3 px-3 flex-row flex-wrap pb-2 border-b border-slate-100">
                  <Metric
                    label={'Partners'}
                    value={item.partner_count}
                    icon="users"
                    tint="slate"
                  />
                  <Metric
                    label={'Pending'}
                    value={item.pending}
                    icon="layers"
                    tint="violet"
                  />
                </View>
                {/* Progress section */}
                <View className="mt-5 px-3 gap-3 pb-4">
                  {item.at_least_single_demo != null ? (
                    <ProgressStat
                      label="At Least Single"
                      percent={atLeastSinglePercent}
                      current={item.at_least_single_demo}
                      total={summaryData.at_least_single_demo}
                      barTint="bg-violet-500"
                      percentTint="text-violet-600"
                    />
                  ) : (
                    false
                  )}
                  {item.at_80_demo != null ? (
                    <ProgressStat
                      label="80% Demo"
                      percent={demo80Percent}
                      current={item.at_80_demo}
                      total={summaryData.at_80_demo || 0}
                      barTint="bg-sky-500"
                      percentTint="text-sky-600"
                    />
                  ) : (
                    false
                  )}
                  {item.demo_100 != null ? (
                    <ProgressStat
                      label="100% Demo"
                      percent={demo100Percent}
                      current={item.demo_100}
                      total={summaryData.demo_100}
                      barTint="bg-teal-500"
                      percentTint="text-teal-600"
                    />
                  ) : (
                    false
                  )}
                </View>
              </Card>
            </TouchableOpacity>
    );
  },
);
export const BranchCardROI = memo(
  ({
    item,
    summaryData,
    yearQtr,
  }: {
    item: TransformedBranchROI;
    summaryData: {
        total_demo: number,
        total_act: number,
        total_stock: number,
    };
    yearQtr: string;
  }) => {
    const navigation = useNavigation<AppNavigationProp>();

    const totalDemoPercent = useMemo(() => {
      if (summaryData.total_demo === 0) return 0;
      return Math.round(
        (item.total_demo / summaryData.total_demo) * 100,
      );
    }, [item.total_demo, summaryData.total_demo]);
    const totalActPercent = useMemo(() => {
      if (summaryData.total_demo === 0) return 0;
      return Math.round((item.total_act / summaryData.total_demo) * 100);
    }, [item.total_act, summaryData.total_demo]);
    const totalStockPercent = useMemo(() => {
      if (!summaryData.total_stock || summaryData.total_stock === 0) return 0;
      return Math.round((item.total_stock / summaryData.total_stock) * 100);
    }, [item.total_stock, summaryData.total_stock]);
    return (
      <TouchableOpacity
      className='mb-3'
              activeOpacity={0.8}
              onPress={() => {
                navigation.push('DemoPartners', {
                  partners: item.partners,
                  yearQtr,
                });
              }}>
              <Card
                className="p-0 border border-slate-200 dark:border-slate-700"
                noshadow>
                <View className="flex-row items-center gap-2 pb-2 border-b border-slate-100 pt-4 px-3">
                  <View className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center">
                    <AppIcon
                      name="map-pin"
                      type="feather"
                      size={16}
                      color="black"
                    />
                  </View>
                  <AppText
                    size="base"
                    weight="semibold"
                    className="text-slate-800 tracking-tight flex-1"
                    numberOfLines={1}>
                    {item.state}
                  </AppText>
                  <View className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center">
                    <AppIcon
                      name="chevron-right"
                      type="feather"
                      size={16}
                      color="#475569"
                    />
                  </View>
                </View>
                {/* Metric grid */}
                <View className="mt-3 px-3 flex-row flex-wrap pb-2 border-b border-slate-100">
                  <Metric
                    label={'Partners'}
                    value={item.partner_count}
                    icon="users"
                    tint="slate"
                  />
                </View>
                {/* Progress section */}
                <View className="mt-5 px-3 gap-3 pb-4">
                  {item.total_demo != null ? (
                    <ProgressStat
                      label="At Least Single"
                      percent={totalDemoPercent}
                      current={item.total_demo}
                      total={summaryData.total_demo}
                      barTint="bg-violet-500"
                      percentTint="text-violet-600"
                    />
                  ) : (
                    false
                  )}
                  {item.total_act != null ? (
                    <ProgressStat
                      label="80% Demo"
                      percent={totalActPercent}
                      current={item.total_act}
                      total={summaryData.total_demo || 0}
                      barTint="bg-sky-500"
                      percentTint="text-sky-600"
                    />
                  ) : (
                    false
                  )}
                  {item.total_stock != null ? (
                    <ProgressStat
                      label="100% Demo"
                      percent={totalStockPercent}
                      current={item.total_stock}
                      total={summaryData.total_stock}
                      barTint="bg-teal-500"
                      percentTint="text-teal-600"
                    />
                  ) : (
                    false
                  )}
                </View>
              </Card>
            </TouchableOpacity>
    );
  },
);