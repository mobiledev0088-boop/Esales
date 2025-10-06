import {View, FlatList, Pressable, TouchableOpacity} from 'react-native';
import React, {useMemo, memo, useCallback, useState} from 'react';
import MaterialTabBar from '../../../../components/MaterialTabBar';
import Card from '../../../../components/Card';
import AppIcon from '../../../../components/customs/AppIcon';
import {showDemoFilterSheet} from './DemoFilterSheet';
import LinearGradient from 'react-native-linear-gradient';
import AppText from '../../../../components/customs/AppText';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import AppDropdown, {
  AppDropdownItem,
} from '../../../../components/customs/AppDropdown';
import {getPastQuarters} from '../../../../utils/commonFunctios';

// --- Types -----------------------------------------------------------------
type SummaryStat = {id: string; title: string; count: number};
type SummaryCategory = Record<string, SummaryStat[]>;

// --- Mock Data (static) -----------------------------------------------------
const DATA: SummaryCategory = {
  ALL: [
    {id: '1', title: 'At Least Single Demo', count: 320},
    {id: '2', title: '80% Demo', count: 919},
    {id: '3', title: '100% Demo', count: 120},
  ],
  VivoBook: [
    {id: '1', title: 'At Least Single Demo', count: 120},
    {id: '2', title: '80% Demo', count: 319},
    {id: '3', title: '100% Demo', count: 20},
  ],
  Asus: [
    {id: '1', title: 'At Least Single Demo', count: 120},
    {id: '2', title: '80% Demo', count: 319},
    {id: '3', title: '100% Demo', count: 20},
  ],
};

const DATA2 = [
  {
    id: '1',
    state: 'DELHI',
    awp: 6,
    partner_count: 74,
    at_least_single_demo: 32,
    demo_100: 2,
    rog_kiosk: 12,
    pkiosk: 66,
    pkiosk_rogkiosk: 12,
  },
  {
    id: '2',
    state: 'HARYANA',
    awp: 6,
    partner_count: 74,
    at_least_single_demo: 32,
    demo_100: 2,
    rog_kiosk: 12,
    pkiosk: 66,
    pkiosk_rogkiosk: 12,
  },
  // {
  //   id: '3',
  //   state: 'PUNJAB',
  //   awp: 6,
  //   partner_count: 74,
  //   at_least_single_demo: 32,
  //   demo_100: 2,
  //   rog_kiosk: 12,
  //   pkiosk: 66,
  //   pkiosk_rogkiosk: 12,
  // },
  // {
  //   id: '4',
  //   state: 'UTTAR PRADESH',
  //   awp: 6,
  //   partner_count: 74,
  //   at_least_single_demo: 32,
  //   demo_100: 2,
  //   rog_kiosk: 12,
  //   pkiosk: 66,
  //   pkiosk_rogkiosk: 12,
  // },
  // {
  //   id: '5',
  //   state: 'BIHAR',
  //   awp: 6,
  //   partner_count: 74,
  //   at_least_single_demo: 32,
  //   demo_100: 2,
  //   rog_kiosk: 12,
  //   pkiosk: 66,
  //   pkiosk_rogkiosk: 12,
  // },
];

// Territory data (back side details) ----------------------------------------
type TerritoryItem = {
  id: string;
  territory: string;
  awp: number;
  partner_count: number;
  at_least_single_demo: number;
  demo_100: number;
  rog_kiosk: number;
  pkiosk: number;
  pkiosk_rogkiosk: number;
};
type TerritoryState = {id: string; state: string; territory: TerritoryItem[]};
const DATA3: TerritoryState[] = [
  {
    id: '1',
    state: 'DELHI',
    territory: [
      {
        id: '1',
        territory: 'North Delhi',
        awp: 6,
        partner_count: 74,
        at_least_single_demo: 32,
        demo_100: 2,
        rog_kiosk: 12,
        pkiosk: 66,
        pkiosk_rogkiosk: 12,
      },
      {
        id: '2',
        territory: 'South Delhi',
        awp: 6,
        partner_count: 74,
        at_least_single_demo: 32,
        demo_100: 2,
        rog_kiosk: 12,
        pkiosk: 66,
        pkiosk_rogkiosk: 12,
      },
      {
        id: '3',
        territory: 'East Delhi',
        awp: 6,
        partner_count: 74,
        at_least_single_demo: 32,
        demo_100: 2,
        rog_kiosk: 12,
        pkiosk: 66,
        pkiosk_rogkiosk: 12,
      },
    ],
  },
];

// Precompute a mapping for O(1) access on flip without re-filtering on each render
const TERRITORY_MAP: Record<string, TerritoryItem[] | undefined> = DATA3.reduce(
  (acc, curr) => {
    acc[curr.state] = curr.territory;
    return acc;
  },
  {} as Record<string, TerritoryItem[]>,
);

// Palette outside of component scope avoids re-allocation on re-renders
const STAT_PALETTE = [
  {tint: 'text-violet-600', iconBg: 'bg-violet-500', icon: 'bar-chart-2'},
  {tint: 'text-teal-600', iconBg: 'bg-teal-500', icon: 'layers'},
  {tint: 'text-amber-600', iconBg: 'bg-amber-500', icon: 'target'},
] as const;

const ProgressBar: React.FC<{value: number; max?: number; tint?: string}> = ({
  value,
  max = 100,
  tint = 'bg-violet-500',
}) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <View className="w-full h-2 rounded-full bg-slate-100 overflow-hidden mt-1">
      <View style={{width: `${pct}%`}} className={`h-full ${tint}`} />
    </View>
  );
};

type StateItem = (typeof DATA2)[number];

const pct = (num: number, den: number) =>
  den ? Math.round((num / den) * 100) : 0;

type MetricProps = {
  label: string;
  value: number;
  icon: string;
  tint: 'slate' | 'violet' | 'teal' | 'amber';
};
const METRIC_COLOR: Record<MetricProps['tint'], string> = {
  slate: 'text-slate-600',
  violet: 'text-violet-600',
  teal: 'text-teal-600',
  amber: 'text-amber-600',
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

type ProgressStatProps = {
  label: string;
  percent: number;
  current: number;
  total: number;
  barTint: string;
  percentTint: string;
};
const ProgressStat: React.FC<ProgressStatProps> = ({
  label,
  percent,
  current,
  total,
  barTint,
  percentTint,
}) => (
  <View className="mb-4 last:mb-0">
    <View className="flex-row justify-between items-center">
      <AppText size="sm" className="text-slate-500">
        {label}
      </AppText>
      <AppText size="sm" className={`${percentTint} font-medium`}>
        {percent}% ({current})
      </AppText>
    </View>
    <ProgressBar value={percent} tint={barTint} />
    {/* <AppText size="xs" className="text-slate-400 text-right mb-1">
      {current}/{total}
    </AppText> */}
  </View>
);

const StateCard = memo(({item}: {item: StateItem}) => {
  const singleDemoPct = pct(item.at_least_single_demo, item.partner_count);
  const fullDemoPct = pct(item.demo_100, item.partner_count);
  const [showFront, setShowFront] = useState(true);
  // Track measured heights of each side so container can animate between them
  const [frontCardHeight, setFrontCardHeight] = useState(0);
  const [backCardHeight, setBackCardHeight] = useState(0);
  const rotate = useSharedValue(0);
  const containerHeight = useSharedValue(0);
  // Territory list memoized to avoid recalculation; stable reference if unchanged
  const territories = useMemo(
    () => TERRITORY_MAP[item.state] || [],
    [item.state],
  );

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
              // in future, navigate to details screen
              // navigation.navigate('DemoDetails', {state: item.state});
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
                <View className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center active:opacity-80">
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
                  label="Partners"
                  value={item.partner_count}
                  icon="users"
                  tint="slate"
                />
                <Metric label="Awp" value={item.awp} icon="cpu" tint="violet" />
                {item.rog_kiosk > 0 && (
                  <Metric
                    label="ROG Kiosk"
                    value={item.rog_kiosk}
                    icon="monitor"
                    tint="teal"
                  />
                )}
                {item.pkiosk > 0 && (
                  <Metric
                    label="Premium Kiosk"
                    value={item.pkiosk}
                    icon="star"
                    tint="amber"
                  />
                )}
                {item.pkiosk_rogkiosk > 0 && (
                  <Metric
                    label="P+ROG Kiosk"
                    value={item.pkiosk_rogkiosk}
                    icon="layers"
                    tint="violet"
                  />
                )}
              </View>
              {/* Progress section */}
              <View className="mt-5 px-3 gap-3">
                <ProgressStat
                  label="At Least Single"
                  percent={singleDemoPct}
                  current={item.at_least_single_demo}
                  total={item.partner_count}
                  barTint="bg-violet-500"
                  percentTint="text-violet-600"
                />
                <ProgressStat
                  label="100% Demo"
                  percent={fullDemoPct}
                  current={item.demo_100}
                  total={item.partner_count}
                  barTint="bg-teal-500"
                  percentTint="text-teal-600"
                />
              </View>
              <Pressable onPress={flipCard} className="px-3 py-3 items-center mt-3">
                <AppText size="sm" className="text-primary" weight="medium">
                  Tap here to view territories
                </AppText>
              </Pressable>
            </Card>
          </TouchableOpacity>
        </Animated.View>
        {/* Back Card State Territory Details */}
        <Animated.View
          style={[backAnimatedStyle]}
          className={'absolute w-full'}
          pointerEvents={!showFront ? 'auto' : 'none'}>
          <View
            onLayout={e => {
              const h = e.nativeEvent.layout.height;
              setBackCardHeight(h);
              // If currently showing back, keep container height in sync
              if (!showFront && h) {
                containerHeight.value = h;
              }
            }}>
            <Card className="p-0">
              {/* Header with flip back trigger */}
              <Pressable
                onPress={flipCard}
                className="flex-row items-center gap-2 pb-2 border-b border-slate-100 pt-4 px-3 active:opacity-70">
                <View className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center">
                  <AppIcon
                    name="arrow-u-right-top"
                    type="material-community"
                    size={16}
                    color="#475569"
                  />
                </View>
                <AppText
                  size="base"
                  weight="semibold"
                  className="text-slate-800 tracking-tight flex-1"
                  numberOfLines={1}>
                  {item.state} Territories
                </AppText>
                <View className="px-2 py-1 rounded-full bg-slate-100">
                  <AppText size="xs" className="text-slate-500">
                    {territories.length}
                  </AppText>
                </View>
              </Pressable>
              <View className="px-3 pt-3 pb-4 gap-3">
                {territories.map(t => {
                  const singlePct = pct(
                    t.at_least_single_demo,
                    t.partner_count,
                  );
                  const fullPct = pct(t.demo_100, t.partner_count);
                  return (
                    <View
                      key={t.id}
                      className="mb-4 last:mb-0 rounded-xl border border-slate-100 bg-white/50 overflow-hidden">
                      {/* Territory Header Row */}
                      <View className="flex-row items-center px-3 py-2 bg-slate-50/60 border-b border-slate-100">
                        <View className="w-7 h-7 rounded-md bg-slate-100 items-center justify-center mr-2">
                          <AppIcon
                            name="map"
                            type="feather"
                            size={14}
                            color="#475569"
                          />
                        </View>
                        <AppText
                          size="sm"
                          weight="medium"
                          className="text-slate-700 flex-1"
                          numberOfLines={1}>
                          {t.territory}
                        </AppText>
                        <AppText size="xs" className="text-slate-400 ml-2">
                          {t.partner_count} Partners
                        </AppText>
                      </View>
                      {/* Metrics */}
                      <View className="flex-row flex-wrap mt-2 px-3">
                        <Metric
                          label="Partners"
                          value={t.partner_count}
                          icon="users"
                          tint="slate"
                        />
                        <Metric
                          label="Awp"
                          value={t.awp}
                          icon="cpu"
                          tint="violet"
                        />
                        {t.rog_kiosk > 0 && (
                          <Metric
                            label="ROG Kiosk"
                            value={t.rog_kiosk}
                            icon="monitor"
                            tint="teal"
                          />
                        )}
                        {t.pkiosk > 0 && (
                          <Metric
                            label="Premium Kiosk"
                            value={t.pkiosk}
                            icon="star"
                            tint="amber"
                          />
                        )}
                        {t.pkiosk_rogkiosk > 0 && (
                          <Metric
                            label="P+ROG Kiosk"
                            value={t.pkiosk_rogkiosk}
                            icon="layers"
                            tint="violet"
                          />
                        )}
                      </View>
                      {/* Progress */}
                      <View className="mt-2 px-3 pb-3 gap-3">
                        <ProgressStat
                          label="At Least Single"
                          percent={singlePct}
                          current={t.at_least_single_demo}
                          total={t.partner_count}
                          barTint="bg-violet-500"
                          percentTint="text-violet-600"
                        />
                        <ProgressStat
                          label="100% Demo"
                          percent={fullPct}
                          current={t.demo_100}
                          total={t.partner_count}
                          barTint="bg-teal-500"
                          percentTint="text-teal-600"
                        />
                      </View>
                    </View>
                  );
                })}
                {territories.length === 0 && (
                  <View className="items-center py-6">
                    <AppIcon
                      name="inbox"
                      type="feather"
                      size={20}
                      color="#94a3b8"
                    />
                    <AppText size="xs" className="text-slate-400 mt-2">
                      No territory data
                    </AppText>
                  </View>
                )}
              </View>
            </Card>
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
});

const SummaryHeader = ({
  currentCategory,
  items,
  total,
}: {
  currentCategory: string;
  items: any[];
  total: number;
}) => {
  type Filters = {
    category: string | null;
    premiumKiosk: string | null;
    rogKiosk: string | null;
    partnerType: string | null;
    agpName: string | null;
  };
  const quarters = useMemo(() => getPastQuarters(), []);
  const [selectedQuarter, setSelectedQuarter] =
    useState<AppDropdownItem | null>(quarters[0] || null);
  // Local filter state summary (mirrors DemoFilterSheet fields)
  const [filters, setFilters] = useState<Filters>({
    category: null,
    premiumKiosk: null,
    rogKiosk: null,
    partnerType: null,
    agpName: null,
  });

  const openFilter = () => {
    showDemoFilterSheet({
      ...filters,
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
    <View className="">
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
        <TouchableOpacity activeOpacity={0.7} onPress={openFilter} className="">
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
      <View className='mb-4'>
      <SelectedFilterChips
        filters={filters}
        setFilters={setFilters}
        />
        </View>
      <Card>
        <View className="pb-4 border-b border-slate-100 bg-white">
          <View className="flex-row justify-between items-center">
            <AppText size="md" weight="semibold" className="text-slate-800">
              {currentCategory}
            </AppText>
            <View className="px-3 py-1 rounded-full bg-slate-100">
              <AppText size="sm" weight="medium" className="text-slate-600">
                Total {total}
              </AppText>
            </View>
          </View>
          <AppText size="xs" className="text-slate-400">
            Snapshot of key metrics
          </AppText>
        </View>
        <View className="flex-row justify-around py-5">
          {items.map((item, idx) => {
            const palette = STAT_PALETTE[idx % STAT_PALETTE.length];
            const isLast = idx === items.length - 1;
            return (
              <View key={item.id} className={`flex-1 ${!isLast ? 'mr-5' : ''}`}>
                <View className="items-center">
                  <View
                    className={`w-12 h-12 rounded-xl ${palette.iconBg} items-center justify-center mb-2 shadow-sm`}>
                    <AppIcon
                      name={palette.icon as any}
                      type="feather"
                      size={20}
                      color="white"
                    />
                  </View>
                  <AppText
                    size="xs"
                    weight="medium"
                    numberOfLines={2}
                    className={`text-center leading-tight ${palette.tint}`}>
                    {item.title}
                  </AppText>
                  <AppText
                    size="lg"
                    weight="semibold"
                    className={`mt-1 ${palette.tint}`}>
                    {item.count}
                  </AppText>
                </View>
              </View>
            );
          })}
        </View>
      </Card>
      <View className="mb-2 mt-4">
        <AppText size="xs" className="text-slate-400">
          Branch Performance
        </AppText>
      </View>
    </View>
  );
};

const Reseller: React.FC = () => {
  const currentCategory: keyof typeof DATA = 'ALL'; // placeholder for future dynamic category
  const items = DATA[currentCategory];
  const total = useMemo(
    () => items.reduce((sum, i) => sum + i.count, 0),
    [items],
  );
  const renderState = useCallback(
    ({item}: {item: StateItem}) => <StateCard item={item} />,
    [],
  );
  const keyExtractor = useCallback((it: StateItem) => it.id, []);

  return (
    <View className="flex-1 bg-slate-50">
      <FlatList
        data={DATA2}
        keyExtractor={keyExtractor}
        renderItem={renderState}
        contentContainerClassName="pt-5 pb-10 px-3"
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        windowSize={5}
        removeClippedSubviews
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={50}
        ListHeaderComponent={() => (
          <SummaryHeader
            currentCategory={currentCategory}
            total={total}
            items={items}
          />
        )}
      />
    </View>
  );
};

const Placeholder: React.FC<{label: string}> = ({label}) => (
  <View className="flex-1 bg-slate-50 items-center justify-center">
    <AppText size="base" weight="medium" className="text-slate-600">
      {label}
    </AppText>
  </View>
);
const Retailer = () => <Placeholder label="Retailer" />;
const LFR = () => <Placeholder label="LFR" />;
const ROI = () => <Placeholder label="ROI" />;

const Demo = () => {
  return (
    <View className="flex-1 bg-slate-50">
      <MaterialTabBar
        tabs={[
          {
            label: 'Reseller',
            name: 'reseller',
            component: Reseller,
          },
          {
            label: 'Retailer',
            name: 'retailer',
            component: Retailer,
          },
          {
            label: 'LFR',
            name: 'lfr',
            component: LFR,
          },
          {
            label: 'ROI',
            name: 'roi',
            component: ROI,
          },
        ]}
        initialRouteName="reseller"
        tabPadding={10}
      />
    </View>
  );
};

export default Demo;
