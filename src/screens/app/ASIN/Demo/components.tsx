import { memo, useMemo, useState } from "react";
import AppDropdown, { AppDropdownItem } from "../../../../components/customs/AppDropdown";
import { showDemoFilterSheet } from "./DemoFilterSheet";
import { Pressable, TouchableOpacity, View } from "react-native";
import AppText from "../../../../components/customs/AppText";
import AppIcon from "../../../../components/customs/AppIcon";
import Card from "../../../../components/Card";
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import { AppNavigationProp } from "../../../../types/navigation";
import Skeleton from "../../../../components/skeleton/skeleton";
import { screenWidth } from "../../../../utils/constant";
import { filterDemoItemsByPartnerType, Filters, METRIC_COLOR, MetricProps, ProgressStatProps, TerritoryItem, TransformedBranch, transformTerritoryData } from "./utils";
import { useGetBranchWiseDemoData } from "./Demo";

export const SummaryCard: React.FC<{
  at_least_single_demo: number;
  demo_100: number;
  total_partners: number;
  awp_partners: number;
  quarters: AppDropdownItem[];
  selectedQuarter: AppDropdownItem | null;
  setSelectedQuarter: React.Dispatch<
    React.SetStateAction<AppDropdownItem | null>
  >;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  partnerTypes: {label: string; value: string}[];
}> = memo(
  ({
    at_least_single_demo,
    demo_100,
    total_partners,
    awp_partners,
    quarters,
    selectedQuarter,
    setSelectedQuarter,
    filters,
    setFilters,
    partnerTypes,
  }) => {
    const openFilter = () => {
      showDemoFilterSheet({
        ...filters,
        yearQtr: selectedQuarter?.value || '',
        partnerTypes: partnerTypes,
        onApply: res => setFilters(res),
        onReset: () =>
          setFilters({
            category: null,
            premiumKiosk: null,
            rogKiosk: null,
            partnerType: null,
            agpName: null,
          }),
      });
    };

    // Component: SelectedFilterChips
    const SelectedFilterChips = ({
      filters,
      setFilters,
    }: {
      filters: Filters;
      setFilters: React.Dispatch<React.SetStateAction<Filters>>;
    }) => {
      const entries = Object.entries(filters).filter(([, v]) => v && v !== '');
      const removeKey = (k: keyof Filters) => {
        setFilters(prev => ({...prev, [k]: null}));
      };
      if (entries.length === 0) return null;
      return (
        <View>
          <AppText size="xs" className="text-slate-400 mb-2">
            Selected Filters ({entries.length})
          </AppText>
          <View className="flex-row flex-wrap -m-1">
            {entries.map(([k, v]) => (
              <View
                key={k}
                className="m-1 flex-row items-center bg-white border border-slate-200 rounded-full pl-3 pr-1 py-1 shadow-sm">
                <AppText
                  size="xs"
                  numberOfLines={1}
                  className="text-slate-600 mr-1 max-w-[120px]">
                  {k}: {String(v)}
                </AppText>
                <TouchableOpacity
                  onPress={() => removeKey(k as keyof Filters)}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                  className="w-5 h-5 rounded-full bg-slate-200 items-center justify-center">
                  <AppIcon name="x" type="feather" size={12} color="#475569" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      );
    };
    return (
      <View>
        <View className="flex-row justify-end items-center gap-3">
          <View className="w-36">
            <AppDropdown
              data={quarters}
              selectedValue={selectedQuarter?.value}
              mode="dropdown"
              placeholder="Quarter"
              onSelect={setSelectedQuarter}
            />
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={openFilter}
            className="">
            <View
              className={`flex-1 flex-row w-14 items-center justify-center rounded bg-white border border-[#ccc]`}>
              <AppIcon
                name="tune-variant"
                type="material-community"
                size={20}
                color={'#475569'}
              />
            </View>
          </TouchableOpacity>
        </View>
        <View className="mb-4">
          <SelectedFilterChips filters={filters} setFilters={setFilters} />
        </View>

        {/* Partner Metrics - Outside Card */}
        <View className="flex-row gap-3 mb-3">
          <View className="flex-1 bg-white dark:bg-slate-800 rounded-lg px-4 py-3 border border-slate-200 dark:border-slate-700">
            <AppText
              size="xs"
              weight="medium"
              className="text-slate-500 dark:text-slate-400 mb-1">
              {filters.partnerType
                ? `Total ${filters.partnerType}`
                : 'Total Partners'}
            </AppText>
            <AppText
              size="xl"
              weight="bold"
              className="text-slate-800 dark:text-slate-100">
              {total_partners}
            </AppText>
          </View>

          <View className="flex-1 bg-white dark:bg-slate-800 rounded-lg px-4 py-3 border border-slate-200 dark:border-slate-700">
            <AppText
              size="xs"
              weight="medium"
              className="text-slate-500 dark:text-slate-400 mb-1">
              {filters.partnerType
                ? `AWP ${filters.partnerType}`
                : 'AWP Partners'}
            </AppText>
            <AppText
              size="xl"
              weight="bold"
              className="text-slate-800 dark:text-slate-100">
              {awp_partners}
            </AppText>
          </View>
        </View>

        <Card className="mb-3">
          <View className="pb-3 border-b border-slate-100">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center">
                  <AppIcon
                    name="bar-chart-2"
                    type="feather"
                    size={16}
                    color="#0066FF"
                  />
                </View>
                <AppText
                  size="base"
                  weight="semibold"
                  className="text-slate-800">
                  Overall Summary
                </AppText>
              </View>
              {filters.category && (
                <View className="bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-full">
                  <AppText
                    size="xs"
                    weight="medium"
                    className="text-blue-600 dark:text-blue-400">
                    {filters.category}
                  </AppText>
                </View>
              )}
            </View>
            <AppText size="xs" className="text-slate-400 mt-1">
              Aggregated data across all branches
            </AppText>
          </View>

          {/* Demo Metrics */}
          <View className="flex-row justify-around mt-4">
            <View className="flex-1 items-center">
              <View className="w-12 h-12 rounded-xl bg-violet-500 items-center justify-center mb-2 shadow-sm">
                <AppIcon name="target" type="feather" size={20} color="white" />
              </View>
              <AppText
                size="xs"
                weight="medium"
                numberOfLines={2}
                className="text-center leading-tight text-violet-600">
                At Least Single
              </AppText>
              <AppText
                size="lg"
                weight="semibold"
                className="mt-1 text-violet-600">
                {at_least_single_demo}
              </AppText>
            </View>

            <View className="w-px bg-slate-100 mx-3" />

            <View className="flex-1 items-center">
              <View className="w-12 h-12 rounded-xl bg-teal-500 items-center justify-center mb-2 shadow-sm">
                <AppIcon
                  name="check-circle"
                  type="feather"
                  size={20}
                  color="white"
                />
              </View>
              <AppText
                size="xs"
                weight="medium"
                numberOfLines={2}
                className="text-center leading-tight text-teal-600">
                100% Demo
              </AppText>
              <AppText
                size="lg"
                weight="semibold"
                className="mt-1 text-teal-600">
                {demo_100}
              </AppText>
            </View>
          </View>
        </Card>
      </View>
    );
  },
);

export const BranchCard = memo(
  ({
    item,
    summaryData,
    yearQtr,
    category,
    premiumKiosk,
    rogKiosk,
    partnerType,
  }: {
    item: TransformedBranch;
    summaryData: {at_least_single_demo: number; demo_100: number};
    yearQtr: string;
    category: string;
    premiumKiosk: string;
    rogKiosk: string;
    partnerType: string | null;
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
        !showFront,
      );

    // Transform and filter territory data
    const territories = useMemo(() => {
      if (!territoryData || showFront) return [];

      const transformed = transformTerritoryData(territoryData);

      // Apply frontend partner type filtering
      if (partnerType) {
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

    // Calculate percentages based on overall summary
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
              <Card className="p-0">
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
                    label="AWP Count"
                    value={item.awp_Count}
                    icon="users"
                    tint="slate"
                  />
                  <Metric
                    label="ROG Kiosk"
                    value={item.rog_kiosk}
                    icon="monitor"
                    tint="teal"
                  />
                  <Metric
                    label="Premium Kiosk"
                    value={item.pkiosk}
                    icon="star"
                    tint="amber"
                  />
                  <Metric
                    label="P+ROG Kiosk"
                    value={item.pkiosk_rogkiosk}
                    icon="layers"
                    tint="violet"
                  />
                </View>
                {/* Progress section */}
                <View className="mt-5 px-3 gap-3">
                  <ProgressStat
                    label="At Least Single"
                    percent={atLeastSinglePercent}
                    current={item.at_least_single_demo}
                    total={summaryData.at_least_single_demo}
                    barTint="bg-violet-500"
                    percentTint="text-violet-600"
                  />
                  <ProgressStat
                    label="100% Demo"
                    percent={demo100Percent}
                    current={item.demo_100}
                    total={summaryData.demo_100}
                    barTint="bg-teal-500"
                    percentTint="text-teal-600"
                  />
                </View>
                <Pressable
                  onPress={flipCard}
                  className="px-3 py-3 items-center mt-3">
                  <AppText size="sm" className="text-primary" weight="medium">
                    Tap here to view territories
                  </AppText>
                </Pressable>
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
              <Card className="p-0">
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
  territory: TerritoryItem;
  partnerType: string | null;
}> = memo(({territory, partnerType}) => {
  return (
    <View className="rounded-xl border border-slate-100 bg-white/50 overflow-hidden">
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
    </View>
  );
});

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