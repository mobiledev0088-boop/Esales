import React, {
  memo,
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import {ErrorDisplay} from '../Dashboard/components';
import {
  FlatList,
  View,
  TouchableOpacity,
  Linking,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Animated, {
  useSharedValue,
  useDerivedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import {DashboardBannerSkeleton} from '../../../../components/skeleton/DashboardSkeleton';
import AppText from '../../../../components/customs/AppText';
import ImageSlider from '../../../../components/ImageSlider';
import {screenWidth} from '../../../../utils/constant';
import {useDashboardBanner} from '../../../../hooks/queries/dashboard';
import {useThemeStore} from '../../../../stores/useThemeStore';
import {AppColors} from '../../../../config/theme';
import AppButton from '../../../../components/customs/AppButton';
import AppIcon from '../../../../components/customs/AppIcon';
import Card from '../../../../components/Card';
import moment from 'moment';
import {convertToASINUnits, showToast} from '../../../../utils/commonFunctions';
import RNCB from '@react-native-clipboard/clipboard';
import {handleASINApiCall} from '../../../../utils/handleApiCall';
import {useLoginStore} from '../../../../stores/useLoginStore';
import {useInfiniteQuery, useQueryClient} from '@tanstack/react-query';
import SchemeSkeleton from '../../../../components/skeleton/SchemesSkeleton';
import SchemeSearch from './SchemeSearch';
import {downloadFile} from '../../../../utils/services';

// consts
const [ONGOING, PP, LAPSED] = ['ongoing', 'pp', 'lapsed'] as const;
const LIMIT = 10 as const; // API rows per page

// type interfaces and enums
type SchemeCategory = typeof ONGOING | typeof PP | typeof LAPSED;

enum TabIndex {
  ONGOING = 0,
  UPCOMING = 1, // PP
  EXPIRED = 2, // Lapsed
}

interface Scheme {
  Claim_Code: string;
  Start_Date: string;
  End_Date: string;
  Claim_name: string;
  Program_Period: string;
  Uploaded_By?: string;
  Uploaded_On?: string;
  File_Path?: string;
  Partner_Type?: string;
  Scheme_Year?: string;
  Scheme_Category?: string;
  Scheme_YearQtr?: string;
  Scheme_Month?: number;
  ActivatedTillDate?: number;
  ActivatedWithinPeriod?: number;
  Old_SRP?: number;
  New_SRP?: number;
}

interface PaginationEnvelope {
  ongoing?: Scheme[];
  lapsed?: Scheme[];
  pp?: Scheme[];
  hasMore: boolean;
  __page: number;
}

interface ModelSchemesByCategory {
  ongoing: Scheme[];
  lapsed: Scheme[];
}

interface SchemeCardProps {
  scheme: Scheme;
  category: SchemeCategory;
  onDownload?: (s: string) => void;
  isModelSearch?: boolean;
}

interface PartnersListProps {
  partners: string[];
  type?: 'odd' | 'even';
}

interface TabHeaderProps {
  tabs: string[];
  activeIndex: number;
  onChange?: (index: number) => void;
}

// Helpers
const safeFormatDate = (dateStr?: string, format = 'DD MMM, YYYY') => {
  if (!dateStr) return '—';
  const m = moment(dateStr);
  return m.isValid() ? m.format(format) : '—';
};

function formatCountdown(msRemaining: number): string {
  if (msRemaining <= 0) return 'Ending now';
  const totalSec = Math.floor(msRemaining / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${d}d ${h}h ${m}m ${s.toString().padStart(2, '0')}s`;
}

const dedupeSchemes = (schemes: Scheme[]): Scheme[] => {
  const seen = new Set<string>();
  const output: Scheme[] = [];
  for (const s of schemes) {
    const code = s?.Claim_Code;
    if (!code || !seen.has(code)) {
      if (code) seen.add(code);
      output.push(s);
    }
  }
  return output;
};

const deriveCategory = (idx: number): SchemeCategory =>
  idx === TabIndex.ONGOING ? ONGOING : idx === TabIndex.UPCOMING ? PP : LAPSED;

// API
const fetchOngoingSchemes = async (
  roleId: number,
  empCode: string,
  page: number,
) => {
  const res = await handleASINApiCall('/Information/GetAllSchemeInfo', {
    employeeCode: empCode,
    RoleId: roleId,
    OngoingSchemePageNumber: page,
    HistoricSchemePageNumber: 1, // keep constant
    RowPerPage: LIMIT,
  });

  const result = res?.DashboardData;
  if (!result?.Status) {
    throw new Error(result?.Message || 'Failed to fetch ongoing schemes');
  }

  return {
    ongoing: result?.Datainfo?.Scheme_Info_Ongoing ?? [],
    hasMore: (result?.Datainfo?.Scheme_Info_Ongoing ?? []).length >= LIMIT,
    pp: result?.Datainfo?.Table2 ?? [], // keep pp data here for first load
    __page: page,
  };
};

const fetchHistoricSchemes = async (
  roleId: number,
  empCode: string,
  page: number,
) => {
  const res = await handleASINApiCall('/Information/GetAllSchemeInfo', {
    employeeCode: empCode,
    RoleId: roleId,
    OngoingSchemePageNumber: 1, // keep constant
    HistoricSchemePageNumber: page,
    RowPerPage: LIMIT,
  });

  const result = res?.DashboardData;
  if (!result?.Status) {
    throw new Error(result?.Message || 'Failed to fetch historic schemes');
  }

  return {
    lapsed: result?.Datainfo?.Scheme_Info_Historic ?? [],
    hasMore: (result?.Datainfo?.Scheme_Info_Historic ?? []).length >= LIMIT,
    __page: page,
  };
};

// UI Components
const InfoRow: React.FC<{
  label: string;
  value: string;
  icon?: {type: any; name: string};
  trailingAction?: () => React.ReactNode;
  valueClassName?: string;
}> = ({label, value, icon, trailingAction, valueClassName}) => (
  <View className="flex-row items-center py-2 border-b border-slate-100 last:border-b-0 dark:border-slate-700">
    <View className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-700 items-center justify-center mr-3">
      {icon && (
        <AppIcon
          type={icon.type as any}
          // @ts-ignore
          name={icon.name}
          size={15}
          color="#475569"
        />
      )}
    </View>
    <View className="flex-1 pr-2">
      <AppText size="xs" className="text-slate-400" numberOfLines={1}>
        {label}
      </AppText>
      <AppText
        size="sm"
        weight="medium"
        className={`text-slate-700 dark:text-slate-200 ${valueClassName ?? ''}`}>
        {value}
      </AppText>
    </View>
    {trailingAction && trailingAction()}
  </View>
);

const CountdownBadge: React.FC<{endDate: string; category: SchemeCategory}> = ({
  endDate,
  category,
}) => {
  const endTs = useMemo(() => {
    const t = Date.parse(endDate);
    return isNaN(t) ? null : t;
  }, [endDate]);
  const [now, setNow] = useState(Date.now());
  const isLapsed = category === LAPSED || (endTs ? endTs <= now : false);
  useEffect(() => {
    if (!endTs || isLapsed) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [endTs, isLapsed]);
  const label = !endTs
    ? '—'
    : isLapsed
      ? 'Event Ended'
      : `Event ends in ${formatCountdown(endTs - now)}`;
  return (
    <View className="mt-2 self-start flex-row items-center px-2 py-1 rounded-full bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700">
      <AppIcon
        type="feather"
        name={isLapsed ? 'alert-circle' : 'clock'}
        size={14}
        color={isLapsed ? '#dc2626' : '#b91c1c'}
      />
      <AppText
        size="sm"
        weight="semibold"
        className={`ml-1 ${isLapsed ? 'text-red-600 dark:text-red-300' : 'text-red-700 dark:text-red-300'}`}>
        {label}
      </AppText>
    </View>
  );
};

const PartnersList: React.FC<PartnersListProps> = ({partners, type}) => {
  // Filter odd/even partners
  const filteredPartners = partners.filter((_, index) =>
    type === 'odd' ? index % 2 !== 0 : index % 2 === 0,
  );

  if (filteredPartners.length === 0) return null;

  return (
    <View className="flex-row gap-3">
      {filteredPartners.map((partner, index) => (
        <View
          key={index}
          className="px-2 py-1 mb-1 rounded-md bg-slate-100 dark:bg-slate-700 flex-row items-center max-w-[130px]">
          <AppIcon type="feather" name="user" size={12} color="#64748b" />
          <AppText
            size="xs"
            className="ml-1 text-gray-600 dark:text-gray-200"
            numberOfLines={1}>
            {partner}
          </AppText>
        </View>
      ))}
    </View>
  );
};

const SchemeCardInner: React.FC<SchemeCardProps> = ({
  scheme,
  category,
  onDownload,
  isModelSearch = false,
}) => {
  console.log('Rendering SchemeCard for', scheme);
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const price = scheme?.Old_SRP || 0;
  const displayPrice = scheme?.New_SRP || price || 0;
  const hasPrice = displayPrice != null;
  const percentageDiscount = useMemo(() => {
    if (!hasPrice || !scheme.Old_SRP || !scheme.New_SRP) return 0;
    const discount = ((scheme.Old_SRP - scheme.New_SRP) / scheme.Old_SRP) * 100;
    return Math.round(discount);
  }, [hasPrice, scheme.Old_SRP, scheme.New_SRP]);

  const copyClaim = useCallback(() => {
    if (!scheme?.Claim_Code) {
      showToast('No claim code');
      return;
    }
    try {
      RNCB.setString(scheme.Claim_Code);
      setCopied(true);
      showToast('Claim code copied');
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.log('Clipboard error', e);
      showToast('Clipboard not available');
    }
  }, [scheme?.Claim_Code]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const partners = useMemo(() => {
    if (!scheme?.Partner_Type) return [] as string[];
    return scheme.Partner_Type.split(',')
      .map(p => p.trim())
      .filter(Boolean);
  }, [scheme?.Partner_Type]);

  const isActivation = /Activation/i.test(scheme?.Scheme_Category ?? '');
  const period = isActivation
    ? `${safeFormatDate(scheme?.Start_Date)} - ${safeFormatDate(scheme?.End_Date)}`
    : `${safeFormatDate(scheme?.Start_Date)} - Onwards`;

  const activatedValue = useMemo(() => {
    if (!isActivation) return null;
    const raw =
      category === ONGOING
        ? scheme.ActivatedTillDate
        : scheme.ActivatedWithinPeriod;
    return raw === undefined || raw === null ? '—' : String(raw);
  }, [
    category,
    isActivation,
    scheme.ActivatedTillDate,
    scheme.ActivatedWithinPeriod,
  ]);

  const handleDownloadPress = useCallback(() => {
    if (!onDownload) return;
    onDownload(scheme?.File_Path || '');
  }, [onDownload, scheme?.File_Path]);

  return (
    <Card
      noshadow
      className="mb-5 p-4 rounded-lg bg-white dark:bg-darkBg-surface border border-slate-200 dark:border-slate-700">
      <View className="mb-3">
        <AppText
          size="md"
          weight="semibold"
          className="text-heading dark:text-heading-dark"
          numberOfLines={2}>
          {scheme?.Claim_name || 'Untitled Scheme'}
        </AppText>
        {category !== PP && !!scheme?.End_Date && (
          <CountdownBadge endDate={scheme.End_Date} category={category} />
        )}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-3"
        nestedScrollEnabled>
        <View className="gap-1">
          <PartnersList partners={partners} type="odd" />
          <PartnersList partners={partners} type="even" />
        </View>
      </ScrollView>

      <View className="mt-1">
        <InfoRow
          icon={{type: 'feather', name: 'tag'}}
          label="Claim Code"
          value={scheme?.Claim_Code || '—'}
          trailingAction={() => (
            <Pressable
              onPress={copyClaim}
              className={`ml-2 flex-row items-center px-2.5 py-1 rounded-full border ${copied ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700' : 'bg-slate-50 dark:bg-slate-600/60 border-slate-200 dark:border-slate-500'}`}>
              <AppIcon
                type="feather"
                name={copied ? 'check' : 'copy'}
                size={14}
                color={copied ? '#2563eb' : '#475569'}
              />
              <AppText
                size="xs"
                weight="medium"
                className={`ml-1 ${copied ? 'text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-200'}`}>
                {copied ? 'Copied' : 'Copy'}
              </AppText>
            </Pressable>
          )}
        />
        {isModelSearch && hasPrice && (
          <View className="mt-1 self-start px-3 py-1.5 rounded-2xl bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-700">
            {scheme?.New_SRP ? (
              <View className="flex-row items-baseline">
                {scheme?.Old_SRP && (
                  <AppText
                    weight="medium"
                    className="mr-1 text-gray-500 dark:text-gray-400 line-through">
                    {convertToASINUnits(price, true, true)}
                  </AppText>
                )}
                <AppText
                  size="lg"
                  weight="bold"
                  className="text-emerald-700 dark:text-emerald-300">
                  {convertToASINUnits(displayPrice, true, true)}
                </AppText>
                <View className="ml-2 px-2 py-0.5 rounded-full bg-emerald-500/90 dark:bg-emerald-500 items-center justify-center">
                  <AppText weight="bold" className="text-white">
                    {percentageDiscount}% Off
                  </AppText>
                </View>
              </View>
            ) : (
              <AppText
                size="lg"
                weight="bold"
                className="text-emerald-700 dark:text-emerald-300">
                {convertToASINUnits(displayPrice, true, true)}
              </AppText>
            )}
          </View>
        )}

        {isModelSearch && (
          <InfoRow
            icon={{type: 'feather', name: 'upload'}}
            label="Category"
            value={scheme?.Scheme_Category || '—'}
          />
        )}
        <InfoRow
          icon={{type: 'feather', name: 'calendar'}}
          label="Event Period"
          value={period || '—'}
        />
        {activatedValue !== null && (
          <InfoRow
            icon={{type: 'feather', name: 'activity'}}
            label={
              category === ONGOING
                ? 'Activated Till Date'
                : 'Activated Within Period'
            }
            value={activatedValue}
          />
        )}
        <TouchableOpacity
          onPress={() => Linking.openURL('https://asuspromo.in/terms')}
          className="items-end">
          <AppText color="primary" className="underline" weight="extraBold">
            Promo Link
          </AppText>
        </TouchableOpacity>
      </View>

      <AppButton
        title={
          <View className="flex-row items-center">
            <AppIcon type="feather" name="download" size={16} color="#fff" />
            <AppText weight="semibold" size="sm" className="text-white ml-2">
              Download Scheme
            </AppText>
          </View>
        }
        onPress={handleDownloadPress}
        className="mt-5 rounded-lg bg-primary"
        size="md"
        weight="semibold"
        noLoading
      />
    </Card>
  );
};

const SchemeBanner = memo(
  ({
    banners,
    queryError,
    refetch,
    isLoading,
  }: {
    banners: any;
    queryError: any;
    refetch: any;
    isLoading: boolean;
  }) => {
    const handleBannerPress = () => {
      // Future: navigate or deep link. Currently no-op.
    };
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

    const filterBanners = useMemo(
      () =>
        banners
          ? [
              banners?.find((banner: {image: string}) =>
                banner?.image?.toLowerCase()?.includes('summary'),
              ),
            ].filter(Boolean)
          : [],
      [banners],
    );

    if (!filterBanners.length) return null; // Hide section gracefully if no proper banner

    return (
      <View className="w-full pt-4">
        <View className="flex-row items-center mb-2">
          <View className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 items-center justify-center mr-2">
            <AppIcon
              type="feather"
              name="bar-chart-2"
              size={18}
              color="#2563eb"
            />
          </View>
          <AppText
            size="lg"
            weight="bold"
            className="text-heading dark:text-heading-dark">
            Summary Banner
          </AppText>
        </View>
        <ImageSlider
          data={filterBanners}
          width={screenWidth - 20}
          height={200}
          onPress={handleBannerPress}
          show={true}
          autoplay={true}
          autoplayTimeout={4}
          dotColor="#E5E7EB"
          activeDotColor="#3B82F6"
          resizeMode="cover"
        />
      </View>
    );
  },
);

const TabHeader = ({tabs, activeIndex, onChange}: TabHeaderProps) => {
  const appTheme = useThemeStore(state => state.AppTheme);
  const isDark = appTheme === 'dark';
  const containerWidth = useSharedValue(0);
  const animIndex = useSharedValue(0); // spring target index
  const baseTabWidth = useDerivedValue(() => {
    if (!containerWidth.value || !tabs.length) return 0;
    return (containerWidth.value - 16) / tabs.length; // align with px-2 (8) left+right in Material (we'll mimic
  }, [tabs.length]);

  // Update animIndex when activeIndex changes (runOnJS triggers from reanimated side if needed)
  useEffect(() => {
    animIndex.value = withSpring(activeIndex, {
      damping: 14,
      stiffness: 180,
      mass: 0.5,
      overshootClamping: false,
    });
  }, [activeIndex, animIndex]);

  const translateXStyle = useAnimatedStyle(() => {
    const w = baseTabWidth.value;
    if (!w) return {opacity: 0};
    const x = 4 + animIndex.value * w; // 4 padding offset
    return {
      transform: [{translateX: x}],
      opacity: 1,
    };
  });

  const indicatorStyle = useAnimatedStyle(() => {
    const w = baseTabWidth.value;
    if (!w) return {width: 0};
    return {width: w - 2}; // mimic MaterialTabBar (tabWidth - 2)
  });

  // Child component to safely use hooks (avoid calling hooks inside loops)
  const TabLabel: React.FC<{
    label: string;
    index: number;
    isActive: boolean;
    onPress?: () => void;
    activeText: string;
    inactiveText: string;
  }> = ({label, index, isActive, onPress, activeText, inactiveText}) => {
    const labelStyle = useAnimatedStyle(() => {
      const scale = interpolate(
        animIndex.value,
        [index - 1, index, index + 1],
        [1, 1.05, 1],
        Extrapolation.CLAMP,
      );
      return {transform: [{scale}]};
    }, []);
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        className="flex-1 items-center justify-center"
        style={{
          paddingVertical: 10,
          paddingHorizontal: 14,
          borderRadius: 8,
        }}>
        <Animated.View style={labelStyle}>
          <AppText
            size="xs"
            weight="semibold"
            style={{color: isActive ? activeText : inactiveText}}
            className="tracking-wider">
            {label}
          </AppText>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const handleContainerLayout = useCallback(
    (e: any) => {
      containerWidth.value = e.nativeEvent.layout.width;
    },
    [containerWidth],
  );

  const palette = isDark ? AppColors.dark : AppColors.light;
  const bg = palette.bgSurface;
  const activeBg = palette.tabSelected;
  const activeText = palette.bgBase;
  const inactiveText = palette.heading;

  return (
    <View className="mt-2">
      <View
        onLayout={handleContainerLayout}
        className="flex-row rounded-md px-1 py-2"
        style={[
          {backgroundColor: bg, position: 'relative', overflow: 'hidden'},
        ]}>
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              top: 8,
              bottom: 8,
              left: 4,
              borderRadius: 10,
              backgroundColor: activeBg,
            },
            translateXStyle,
            indicatorStyle,
          ]}
        />
        {tabs.map((t, i) => (
          <TabLabel
            key={t}
            label={t}
            index={i}
            isActive={i === activeIndex}
            onPress={() => onChange?.(i)}
            activeText={activeText}
            inactiveText={inactiveText}
          />
        ))}
      </View>
    </View>
  );
};

const AnimatedFAB: React.FC<{
  visible: boolean;
  animatedValue: any;
  onPress: () => void;
}> = ({visible, animatedValue, onPress}) => {
  const style = useAnimatedStyle(() => {
    const translateY = interpolate(
      animatedValue.value,
      [0, 1],
      [40, 0],
      Extrapolation.CLAMP,
    );
    const opacity = animatedValue.value;
    const scale = interpolate(
      animatedValue.value,
      [0, 1],
      [0.85, 1],
      Extrapolation.CLAMP,
    );
    return {opacity, transform: [{translateY}, {scale}]};
  }, []);

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[{position: 'absolute', bottom: 24, right: 20}, style]}>
      <Pressable
        onPress={onPress}
        className="rounded-full bg-primary w-14 h-14 items-center justify-center ">
        <AppIcon type="feather" name="arrow-up" size={24} color="#fff" />
      </Pressable>
    </Animated.View>
  );
};

const SchemeCard = memo(
  SchemeCardInner,
  (prev, next) =>
    prev.scheme === next.scheme &&
    prev.category === next.category &&
    prev.isModelSearch === next.isModelSearch,
);

// Main Component
export default function Schemes() {
  const userInfo = useLoginStore(state => state.userInfo);
  const queryClient = useQueryClient();
  const [activeTabidx, setActiveTabidx] = useState<number>(TabIndex.ONGOING);
  const flatListRef = useRef<FlatList<Scheme>>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  // Animated value for FAB visibility (0 hidden, 1 visible)
  const fabVisible = useSharedValue(0);
  const SCROLL_THRESHOLD = 350; // px
  // Model search lifted state
  const [modelLoading, setModelLoading] = useState(false);
  const [modelSchemes, setModelSchemes] = useState<ModelSchemesByCategory>({
    ongoing: [],
    lapsed: [],
  });
  const [modelSearchActive, setModelSearchActive] = useState(false);
  const [selectedModelName, setSelectedModelName] = useState('');
  const [modelTabIndex, setModelTabIndex] = useState(0); // 0 = ongoing, 1 = lapsed

  // Coerce roleId to a number defensively (userInfo shape may be loosely typed)
  const roleId = useMemo<number>(() => {
    const raw = (userInfo as any)?.EMP_RoleId;
    const n = typeof raw === 'number' ? raw : Number(raw);
    return Number.isFinite(n) ? n : 0;
  }, [userInfo]);

  // Dashboard banners
  const {
    data: banners,
    error: queryError,
    refetch,
    isLoading: bannersLoading,
  } = useDashboardBanner();

  // Fetch ongoing + initial PP list
  const {
    data: ongoingData,
    fetchNextPage: fetchNextOngoing,
    hasNextPage: hasMoreOngoing,
    isFetchingNextPage: fetchingOngoing,
    isLoading: loadingOngoing,
  } = useInfiniteQuery<PaginationEnvelope>({
    queryKey: ['schemes-ongoing', userInfo?.EMP_Code, roleId],
    initialPageParam: 1,
    queryFn: ({pageParam}) =>
      fetchOngoingSchemes(
        roleId,
        userInfo?.EMP_Code ?? '',
        Number(pageParam || 1),
      ),
    getNextPageParam: lastPage =>
      lastPage?.hasMore ? (lastPage.__page ?? 1) + 1 : undefined,
  });

  // Fetch historic / lapsed
  const {
    data: historicData,
    fetchNextPage: fetchNextHistoric,
    hasNextPage: hasMoreHistoric,
    isFetchingNextPage: fetchingHistoric,
    isLoading: loadingHistoric,
  } = useInfiniteQuery<PaginationEnvelope>({
    queryKey: ['schemes-historic', userInfo?.EMP_Code, roleId],
    initialPageParam: 1,
    queryFn: ({pageParam}) =>
      fetchHistoricSchemes(
        roleId,
        userInfo?.EMP_Code ?? '',
        Number(pageParam || 1),
      ),
    getNextPageParam: lastPage =>
      lastPage?.hasMore ? (lastPage.__page ?? 1) + 1 : undefined,
  });

  // Flatten + dedupe lists
  const ongoingList = useMemo(() => {
    const arr =
      (ongoingData as any)?.pages?.flatMap(
        (p: PaginationEnvelope) => p?.ongoing ?? [],
      ) ?? [];
    return dedupeSchemes(arr as Scheme[]);
  }, [ongoingData]);
  const ppList = useMemo(
    () => ((ongoingData as any)?.pages?.[0]?.pp ?? []) as Scheme[],
    [ongoingData],
  );
  const historicList = useMemo(() => {
    const arr =
      (historicData as any)?.pages?.flatMap(
        (p: PaginationEnvelope) => p?.lapsed ?? [],
      ) ?? [];
    return dedupeSchemes(arr as Scheme[]);
  }, [historicData]);

  // Invalidation callbacks
  const onRefreshOngoing = useCallback(
    () => queryClient.invalidateQueries({queryKey: ['schemes-ongoing']}),
    [queryClient],
  );
  const onRefreshHistoric = useCallback(
    () => queryClient.invalidateQueries({queryKey: ['schemes-historic']}),
    [queryClient],
  );

  // Selected dataset logic per tab
  const {selectedData, hasMore, loadingMore, loadNext, onRefresh} =
    useMemo(() => {
      if (modelSearchActive) {
        const searchData =
          modelTabIndex === 0 ? modelSchemes.ongoing : modelSchemes.lapsed;
        return {
          selectedData: searchData,
          hasMore: false,
          loadingMore: modelLoading,
          loadNext: () => {},
          onRefresh: () => {},
        } as const;
      }
      if (activeTabidx === TabIndex.ONGOING) {
        return {
          selectedData: ongoingList,
          hasMore: !!hasMoreOngoing,
          loadingMore: fetchingOngoing,
          loadNext: fetchNextOngoing,
          onRefresh: onRefreshOngoing,
        } as const;
      }
      if (activeTabidx === TabIndex.EXPIRED) {
        return {
          selectedData: historicList,
          hasMore: !!hasMoreHistoric,
          loadingMore: fetchingHistoric,
          loadNext: fetchNextHistoric,
          onRefresh: onRefreshHistoric,
        } as const;
      }
      // Upcoming (PP) – static from first ongoing response
      return {
        selectedData: ppList,
        hasMore: false,
        loadingMore: false,
        loadNext: () => {},
        onRefresh: onRefreshOngoing, // reuse to refetch base dataset
      } as const;
    }, [
      activeTabidx,
      ongoingList,
      hasMoreOngoing,
      fetchingOngoing,
      fetchNextOngoing,
      onRefreshOngoing,
      historicList,
      hasMoreHistoric,
      fetchingHistoric,
      fetchNextHistoric,
      onRefreshHistoric,
      ppList,
      modelSearchActive,
      modelSchemes,
      modelLoading,
      modelTabIndex,
    ]);

  // Derived category for each row
  const currentCategory = deriveCategory(activeTabidx);
  const searchCategory: SchemeCategory = modelTabIndex === 0 ? ONGOING : LAPSED; // category for searched schemes

  // Download link handler with basic validation fallback
  const handleDownload = useCallback(async (url: string) => {
    if (!url) {
      showToast('File not available');
      return;
    }
    const fileName = url.split('/').pop() || 'Scheme_File';
    try {
      showToast('Downloading file...');
      await downloadFile({
        url: url,
        fileName: fileName,
        autoOpen: true,
      });
    } catch (e) {
      console.log('Open URL error', e);
      showToast('Unable to open link');
    }
  }, []);

  // Render scheme items
  const renderItem = useCallback(
    ({item}: {item: Scheme}) => (
      <SchemeCard
        scheme={item}
        category={modelSearchActive ? searchCategory : currentCategory}
        onDownload={handleDownload}
        isModelSearch={modelSearchActive}
      />
    ),
    [currentCategory, handleDownload, modelSearchActive, searchCategory],
  );

  // Infinite scroll trigger
  const handleEndReached = useCallback(() => {
    if (hasMore && !loadingMore) loadNext?.();
  }, [hasMore, loadingMore, loadNext]);

  // Scroll listener to toggle FAB visibility (minimizing state churn)
  const handleScroll = useCallback(
    (e: any) => {
      const y = e?.nativeEvent?.contentOffset?.y ?? 0;
      const shouldShow = y > SCROLL_THRESHOLD;
      if (shouldShow !== showScrollTop) {
        setShowScrollTop(shouldShow);
        fabVisible.value = withTiming(shouldShow ? 1 : 0, {
          duration: 260,
          easing: Easing.out(Easing.cubic),
        });
      }
    },
    [showScrollTop, fabVisible],
  );

  const scrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({offset: 0, animated: true});
  }, []);

  // List Header
  const ListHeader = useMemo(
    () => (
      <View className="pb-3">
        {!selectedModelName && (
          <SchemeBanner
            banners={banners}
            queryError={queryError}
            refetch={refetch}
            isLoading={bannersLoading}
          />
        )}
        <View className="flex-row items-center pl-1 pt-4 mb-1">
          <View className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-900/40 items-center justify-center mr-2">
            <AppIcon type="feather" name="layers" size={18} color="#7c3aed" />
          </View>
          <AppText
            size="lg"
            weight="bold"
            className="text-heading dark:text-heading-dark">
            {modelSearchActive && selectedModelName
              ? `Schemes - ${selectedModelName}`
              : 'Schemes'}
          </AppText>
        </View>
        {modelSearchActive ? (
          <TabHeader
            tabs={[
              `Ongoing (${modelSchemes.ongoing.length})`,
              `Lapsed (${modelSchemes.lapsed.length})`,
            ]}
            activeIndex={modelTabIndex}
            onChange={setModelTabIndex}
          />
        ) : (
          <TabHeader
            tabs={[
              `Ongoing (${ongoingList.length})`,
              `PP (${ppList.length})`,
              `Lapsed (${historicList.length})`,
            ]}
            activeIndex={activeTabidx}
            onChange={setActiveTabidx}
          />
        )}
      </View>
    ),
    [
      activeTabidx,
      setActiveTabidx,
      banners,
      bannersLoading,
      historicList.length,
      ongoingList.length,
      ppList.length,
      queryError,
      refetch,
      modelSearchActive,
      selectedModelName,
      modelSchemes.ongoing.length,
      modelSchemes.lapsed.length,
      modelTabIndex,
    ],
  );

  // Footer state based on tab + loading
  const ListFooter = useMemo(() => {
    if (activeTabidx === TabIndex.UPCOMING) {
      return (
        <View className="mt-4 px-4 mb-6">
          <View className="flex-row items-center opacity-80">
            <View className="flex-1 h-[1px] bg-slate-200 dark:bg-slate-600" />
            <AppText
              size="xs"
              className="mx-3 text-slate-400 tracking-wide uppercase">
              End of list
            </AppText>
            <View className="flex-1 h-[1px] bg-slate-200 dark:bg-slate-600" />
          </View>
        </View>
      );
    }
    if (loadingMore) {
      return (
        <View className="py-6 items-center justify-center">
          <ActivityIndicator
            size="small"
            color={
              activeTabidx === TabIndex.EXPIRED ? '#dc2626' : AppColors.primary
            }
          />
          <AppText size="xs" className="text-slate-400 mt-2">
            Loading more...
          </AppText>
        </View>
      );
    }
    if (!hasMore && selectedData.length > 0) {
      return (
        <View className="mt-4 px-4 mb-10">
          <View className="flex-row items-center opacity-80">
            <View className="flex-1 h-[1px] bg-slate-200 dark:bg-slate-600" />
            <AppIcon
              type="feather"
              name="check-circle"
              size={14}
              color="#64748b"
            />
            <AppText size="xs" className="mx-2 text-slate-400 tracking-wide">
              All caught up
            </AppText>
            <View className="flex-1 h-[1px] bg-slate-200 dark:bg-slate-600" />
          </View>
        </View>
      );
    }
    return <View className="h-6" />;
  }, [activeTabidx, loadingMore, hasMore, selectedData.length]);

  const EmptyList = useCallback(
    () => (
      <View className="w-full items-center pt-10 px-4">
        <AppIcon type="feather" name="inbox" size={40} color="#94a3b8" />
        <AppText size="sm" className="text-slate-500 mt-3" weight="medium">
          {modelSearchActive
            ? modelTabIndex === 0
              ? 'No ongoing schemes found for selected model'
              : 'No lapsed schemes found for selected model'
            : activeTabidx === TabIndex.UPCOMING
              ? 'No upcoming schemes currently'
              : activeTabidx === TabIndex.EXPIRED
                ? 'No expired schemes found'
                : 'No ongoing schemes available'}
        </AppText>
      </View>
    ),
    [activeTabidx, modelSearchActive, modelTabIndex],
  );

  const keyExtractor = useCallback(
    (item: Scheme, index: number) =>
      item?.Claim_Code || `${activeTabidx}-${index}`,
    [activeTabidx],
  );

  const showSkeleton =
    modelLoading ||
    (loadingOngoing && !ongoingList.length && !ppList.length) ||
    (loadingHistoric && !historicList.length);

  if (showSkeleton) return <SchemeSkeleton />;

  return (
    <View className="flex-1 bg-slate-50 dark:bg-black">
      <SchemeSearch
        selectedModelName={selectedModelName}
        onModelLoading={setModelLoading}
        onModelSchemes={(schemesByCategory, modelName) => {
          setModelSchemes({
            ongoing: (schemesByCategory.ongoing ?? []) as Scheme[],
            lapsed: (schemesByCategory.lapsed ?? []) as Scheme[],
          });
          setModelSearchActive(true);
          setSelectedModelName(modelName);
          setModelTabIndex(0);
        }}
        onClearSearch={() => {
          setModelSearchActive(false);
          setModelSchemes({ongoing: [], lapsed: []});
          setSelectedModelName('');
          setModelLoading(false);
          setModelTabIndex(0);
        }}
      />
      <FlatList
        ref={flatListRef}
        data={selectedData}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.2}
        onScroll={handleScroll}
        scrollEventThrottle={32}
        ListFooterComponent={ListFooter}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={EmptyList}
        contentContainerClassName="px-3"
        refreshControl={
          <RefreshControl
            refreshing={
              modelSearchActive
                ? modelLoading
                : activeTabidx === TabIndex.ONGOING
                  ? loadingOngoing
                  : activeTabidx === TabIndex.EXPIRED
                    ? loadingHistoric
                    : loadingOngoing
            }
            onRefresh={modelSearchActive ? () => {} : onRefresh}
            tintColor={AppColors.primary}
          />
        }
        removeClippedSubviews
        initialNumToRender={6}
        windowSize={11}
      />
      {/** Animated FAB */}
      <AnimatedFAB
        visible={showScrollTop}
        animatedValue={fabVisible}
        onPress={scrollToTop}
      />
    </View>
  );
}
