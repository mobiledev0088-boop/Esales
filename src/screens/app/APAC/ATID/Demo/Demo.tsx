import {FlatList, TouchableOpacity, View} from 'react-native';
import MaterialTabBar from '../../../../../components/MaterialTabBar';
import {useMemo, useState, useCallback, memo} from 'react';
import {
  useGetDemoDataProgram,
  useGetDemoDataPartner,
  useGetDemoDataROI,
} from '../../../../../hooks/queries/demo';
import moment from 'moment';
import Accordion from '../../../../../components/Accordion';
import Card from '../../../../../components/Card';
import AppText from '../../../../../components/customs/AppText';
import AppIcon from '../../../../../components/customs/AppIcon';
import {AppColors} from '../../../../../config/theme';
import {useThemeStore} from '../../../../../stores/useThemeStore';
import Skeleton from '../../../../../components/skeleton/skeleton';
import {screenWidth} from '../../../../../utils/constant';
import AppButton from '../../../../../components/customs/AppButton';
import {SheetManager} from 'react-native-actions-sheet';
import useQuarterHook from '../../../../../hooks/useQuarterHook';
import {METRIC_COLOR, METRIC_BG_COLOR, METRIC_ICON_COLOR, MetricProps} from '../../../ASIN/Demo/utils';

interface DemoData {
  BranchName: string | null;
  PartnerCode: string;
  PartnerName: string;
  PartnerType: string;
  DemoExecuted: number;
  TotalCompulsoryDemo: number;
  No_of_Stores: number;
  Average_hours: number;
}

interface ROIData {
  Activation_count: number;
  BranchName: string;
  Inventory_Count: number;
  Model_Series: string;
  PartnerCode: string;
  PartnerName: string;
  PartnerType: string;
  Total_Demo_Count: number;
}

const initialFilter = {
  Month: moment().format('YYYYM'),
  Program_Name: '',
  Category: 'All',
  PartnerCode: '',
  StoreCode: '',
};

const PartnerCard = ({
  item,
  onPressView,
  isDarkMode,
}: {
  item: DemoData;
  onPressView: (item: DemoData) => void;
  isDarkMode: boolean;
}) => {
  return (
    <Card
      className="mb-3 mx-0 border border-gray-200 dark:border-gray-700 "
      noshadow>
      {/* Partner Name - Primary Information */}
      <View className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                disabled={true}
                activeOpacity={0.7}
                className="flex-row items-center w-10/12 ">
                <AppText size="md" weight="bold" className="mb-1">
                  {item.PartnerName}
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onPressView(item)}
                activeOpacity={0.7}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <AppIcon
                  name="eye"
                  type="feather"
                  size={20}
                  color={
                    isDarkMode ? AppColors.dark.secondary : AppColors.secondary
                  }
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Partner Details - All in One Row */}
      <View className="flex-row items-center justify-between">
        {/* Partner Code */}
        <View className="flex-1 items-center">
          <View className="w-10 h-10 bg-secondary/10 dark:bg-secondary-dark/20 rounded-lg items-center justify-center mb-2">
            <AppIcon
              name="barcode"
              type="material-community"
              size={20}
              color={
                isDarkMode ? AppColors.dark.secondary : AppColors.secondary
              }
            />
          </View>
          <AppText
            size="xs"
            weight="medium"
            className="text-gray-500 dark:text-gray-400 mb-1 text-center">
            Partner Code
          </AppText>
          <AppText
            size="sm"
            weight="semibold"
            className="text-secondary dark:text-secondary-dark text-center">
            {item.PartnerCode}
          </AppText>
        </View>

        {/* Demo Executed */}
        <View className="flex-1 items-center border-l border-r border-gray-200 dark:border-gray-700">
          <View className="w-10 h-10 bg-success/10 dark:bg-success/20 rounded-lg items-center justify-center mb-2 ">
            {/* Render icon for shop icon */}
            <AppIcon
              name="storefront"
              type="material-community"
              size={20}
              color={AppColors.success}
            />
          </View>
          <AppText
            size="xs"
            weight="medium"
            className="text-gray-500 dark:text-gray-400 mb-1 text-center">
            No of Stores
          </AppText>
          <AppText
            size="lg"
            weight="bold"
            className="text-success dark:text-success text-center">
            {item.No_of_Stores}
          </AppText>
        </View>

        {/* Shortfall */}
        <View className="flex-1 items-center">
          <View
            className={
              'w-10 h-10 bg-warning/10 dark:bg-warning/20 rounded-lg items-center justify-center mb-2'
            }>
            <AppIcon
              name="timer-sand"
              type="material-community"
              size={20}
              color={isDarkMode ? '#FBBF24' : '#FBBF24'}
            />
          </View>
          <AppText
            size="xs"
            weight="medium"
            className="text-gray-500 dark:text-gray-400 mb-1 text-center">
            Average Hours
          </AppText>
          <AppText
            size="lg"
            weight="bold"
            className={'text-warning dark:text-warning'}
            style={{textAlign: 'center'}}>
            {item.Average_hours}
          </AppText>
        </View>
      </View>
    </Card>
  );
};

const ByProgram = () => {
  const [filter] = useState(initialFilter);
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(
    new Set(),
  );
  const isDarkMode = useThemeStore(state => state.AppTheme === 'dark');
  const {data, isLoading, error, refetch} = useGetDemoDataProgram(filter);

  const groupedByBranch = useMemo(() => {
    const list = Array.isArray(data) ? data : [];
    if (list.length === 0)
      return [] as Array<{
        branch: string;
        partners: DemoData[];
        stats: {partnersCount: number; totalStores: number; avgHours: number};
      }>;
    const map = new Map<string, DemoData[]>();
    for (const item of list) {
      const key = item.BranchName ?? 'Unknown Branch';
      const arr = map.get(key) ?? [];
      arr.push(item);
      map.set(key, arr);
    }
    return Array.from(map.entries())
      .map(([branch, partners]) => {
        const partnersCount = partners.length;
        const totalStores = partners.reduce(
          (sum, p) => sum + (Number(p.No_of_Stores) || 0),
          0,
        );
        return {
          branch,
          partners,
          stats: {partnersCount, totalStores},
        };
      })
      .sort((a, b) => a.branch.localeCompare(b.branch));
  }, [data]);

  const onPressView = (item: DemoData) => {
    const partner = item?.PartnerCode;
    const yearQtr = filter?.Month;
    SheetManager.show('PartnerDetailsSheet', {
      payload: {partner, yearQtr},
    });
  };

  const renderPartner = useCallback(({item}: {item: DemoData}) => {
    return (
      <PartnerCard
        item={item}
        onPressView={onPressView}
        isDarkMode={isDarkMode}
      />
    );
  }, []);

  const keyExtractor = useCallback(
    (item: DemoData) => `${item.PartnerCode}`,
    [],
  );

  const toggleBranchExpansion = useCallback((branchName: string) => {
    setExpandedBranches(prev => {
      const next = new Set(prev);
      if (next.has(branchName)) {
        next.delete(branchName);
      } else {
        next.add(branchName);
      }
      return next;
    });
  }, []);

  const getVisiblePartners = useCallback(
    (partners: DemoData[], branchName: string) => {
      const isExpanded = expandedBranches.has(branchName);
      const INITIAL_COUNT = 10;

      if (partners.length <= INITIAL_COUNT) {
        return {visible: partners, showButton: false, isExpanded: false};
      }

      return {
        visible: isExpanded ? partners : partners.slice(0, INITIAL_COUNT),
        showButton: true,
        isExpanded,
      };
    },
    [expandedBranches],
  );

  const totalPartners = useMemo(
    () => groupedByBranch.reduce((sum, b) => sum + b.stats.partnersCount, 0),
    [groupedByBranch],
  );

  const renderListHeader = useCallback(() => {
    return (
      <View className="mb-3">
        <Card className="mx-0 p-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <View className="flex-row items-center mb-1">
                <AppIcon
                  name="office-building"
                  type="material-community"
                  size={16}
                  color={
                    isDarkMode ? AppColors.dark.secondary : AppColors.secondary
                  }
                />
                <AppText
                  size="xs"
                  color="gray"
                  weight="medium"
                  className="ml-2">
                  Total Branches
                </AppText>
              </View>
              <AppText
                size="2xl"
                weight="bold"
                className="text-secondary dark:text-secondary-dark">
                {groupedByBranch.length}
              </AppText>
            </View>

            <View className="w-px h-12 bg-gray-200 dark:bg-gray-700 mx-4" />

            <View className="flex-1">
              <View className="flex-row items-center mb-1">
                <AppIcon
                  name="users"
                  type="feather"
                  size={16}
                  color={AppColors.success}
                />
                <AppText
                  size="xs"
                  color="gray"
                  weight="medium"
                  className="ml-2">
                  Total Partners
                </AppText>
              </View>
              <AppText size="2xl" weight="bold" className="text-success">
                {totalPartners}
              </AppText>
            </View>
          </View>
        </Card>
      </View>
    );
  }, [groupedByBranch.length, totalPartners, isDarkMode]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-lightBg-base dark:bg-darkBg-base px-3 pt-3">
        <Skeleton width={screenWidth - 24} height={80} borderRadius={8} />
        <View className="mt-3 gap-3">
          {[...Array(10)].map((_, index) => (
            <Skeleton
              key={index}
              width={screenWidth - 24}
              height={80}
              borderRadius={8}
            />
          ))}
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-lightBg-base dark:bg-darkBg-base px-4">
        <AppIcon
          name="alert-circle"
          type="feather"
          size={48}
          color={AppColors.error}
        />
        <AppText weight="semibold" color="error">
          Failed to load data
        </AppText>
        <AppText size="sm" color="gray" className="mt-1" numberOfLines={2}>
          Please try again or adjust filters.
        </AppText>
        <AppButton
          iconName="refresh-ccw"
          title="Retry"
          className="mt-4 w-[40%] rounded-lg "
          onPress={refetch}
        />
      </View>
    );
  }

  if (!groupedByBranch.length) {
    return (
      <View className="flex-1 items-center justify-center bg-lightBg-base dark:bg-darkBg-base">
        <AppIcon name="inbox" type="feather" size={48} color={AppColors.text} />
        <AppText size="md" color="gray">
          No data found
        </AppText>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-lightBg-base dark:bg-darkBg-base">
      <FlatList
        className="flex-1"
        contentContainerClassName="py-3 px-3"
        data={groupedByBranch}
        keyExtractor={item => item.branch}
        ListHeaderComponent={renderListHeader}
        ItemSeparatorComponent={() => <View className="h-3" />}
        showsVerticalScrollIndicator={false}
        renderItem={({item}) => {
          const {visible, showButton, isExpanded} = getVisiblePartners(
            item.partners,
            item.branch,
          );
          return (
            <Accordion
              header={
                <View className="flex-1">
                  <View className="flex-row items-center mb-2">
                    <AppIcon
                      name="map-marker-radius"
                      type="material-community"
                      size={18}
                      color={
                        isDarkMode
                          ? AppColors.dark.secondary
                          : AppColors.secondary
                      }
                    />
                    <AppText weight="bold" size="md" className="ml-2">
                      {item.branch}
                    </AppText>
                  </View>
                  <View className="flex-row flex-wrap gap-2">
                    <HeaderStat
                      label="Partners"
                      value={`${item.stats.partnersCount}`}
                      color={
                        isDarkMode
                          ? AppColors.dark.secondary
                          : AppColors.secondary
                      }
                      icon={{name: 'users', type: 'feather'}}
                    />
                    <HeaderStat
                      label="Stores"
                      value={`${item.stats.totalStores}`}
                      color={AppColors.success}
                      icon={{name: 'storefront', type: 'material-community'}}
                    />
                  </View>
                </View>
              }
              needBottomBorder={false}
              needShadow
              containerClassName="rounded-xl p-3 bg-lightBg-surface dark:bg-darkBg-surface">
              <View className="mt-3">
                <FlatList
                  data={visible}
                  keyExtractor={keyExtractor}
                  renderItem={renderPartner}
                  scrollEnabled={false}
                />
                {showButton && (
                  <TouchableOpacity
                    onPress={() => toggleBranchExpansion(item.branch)}
                    activeOpacity={0.7}
                    className="mt-3 py-3 bg-secondary/10 dark:bg-secondary-dark/20 rounded-lg flex-row items-center justify-center gap-2">
                    <AppText
                      size="sm"
                      weight="semibold"
                      className="text-secondary dark:text-secondary-dark">
                      {isExpanded
                        ? 'See Less'
                        : `See More (${item.partners.length - 10} more)`}
                    </AppText>
                    <AppIcon
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      type="feather"
                      size={18}
                      color={
                        isDarkMode
                          ? AppColors.dark.secondary
                          : AppColors.secondary
                      }
                    />
                  </TouchableOpacity>
                )}
              </View>
            </Accordion>
          );
        }}
      />
    </View>
  );
};

const ByPartner = () => {
  const [filter] = useState({
    YearQtr: moment().format('YYYYQ'),
    IsCompulsory: 'bonus',
    Category: 'All',
  });
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(
    new Set(),
  );
  const isDarkMode = useThemeStore(state => state.AppTheme === 'dark');
  const {data, isLoading, error, refetch} = useGetDemoDataPartner(filter);

  const groupedByBranch = useMemo(() => {
    const list = Array.isArray(data) ? data : [];
    if (list.length === 0)
      return [] as Array<{
        branch: string;
        partners: DemoData[];
        stats: {partnersCount: number; totalStores: number};
      }>;
    const map = new Map<string, DemoData[]>();
    for (const item of list) {
      const key = item.BranchName ?? 'Unknown Branch';
      const arr = map.get(key) ?? [];
      arr.push(item);
      map.set(key, arr);
    }
    return Array.from(map.entries())
      .map(([branch, partners]) => {
        const partnersCount = partners.length;
        const totalStores = partners.reduce(
          (sum, p) => sum + (Number(p.No_of_Stores) || 0),
          0,
        );
        return {
          branch,
          partners,
          stats: {partnersCount, totalStores},
        };
      })
      .sort((a, b) => a.branch.localeCompare(b.branch));
  }, [data]);

  const onPressView = (item: DemoData) => {
    const partner = item?.PartnerCode;
    const yearQtr = filter?.YearQtr;
    SheetManager.show('PartnerDetailsSheet', {
      payload: {partner, yearQtr},
    });
  };

  const renderPartner = useCallback(
    ({item}: {item: DemoData}) => {
      return (
        <PartnerCard
          item={item}
          onPressView={onPressView}
          isDarkMode={isDarkMode}
        />
      );
    },
    [isDarkMode],
  );

  const keyExtractor = useCallback(
    (item: DemoData) => `${item.PartnerCode}`,
    [],
  );

  const toggleBranchExpansion = useCallback((branchName: string) => {
    setExpandedBranches(prev => {
      const next = new Set(prev);
      if (next.has(branchName)) {
        next.delete(branchName);
      } else {
        next.add(branchName);
      }
      return next;
    });
  }, []);

  const getVisiblePartners = useCallback(
    (partners: DemoData[], branchName: string) => {
      const isExpanded = expandedBranches.has(branchName);
      const INITIAL_COUNT = 10;

      if (partners.length <= INITIAL_COUNT) {
        return {visible: partners, showButton: false, isExpanded: false};
      }

      return {
        visible: isExpanded ? partners : partners.slice(0, INITIAL_COUNT),
        showButton: true,
        isExpanded,
      };
    },
    [expandedBranches],
  );

  const totalPartners = useMemo(
    () => groupedByBranch.reduce((sum, b) => sum + b.stats.partnersCount, 0),
    [groupedByBranch],
  );

  const renderListHeader = useCallback(() => {
    return (
      <View className="mb-3">
        <Card className="mx-0 p-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <View className="flex-row items-center mb-1">
                <AppIcon
                  name="office-building"
                  type="material-community"
                  size={16}
                  color={
                    isDarkMode ? AppColors.dark.secondary : AppColors.secondary
                  }
                />
                <AppText
                  size="xs"
                  color="gray"
                  weight="medium"
                  className="ml-2">
                  Total Branches
                </AppText>
              </View>
              <AppText
                size="2xl"
                weight="bold"
                className="text-secondary dark:text-secondary-dark">
                {groupedByBranch.length}
              </AppText>
            </View>

            <View className="w-px h-12 bg-gray-200 dark:bg-gray-700 mx-4" />

            <View className="flex-1">
              <View className="flex-row items-center mb-1">
                <AppIcon
                  name="users"
                  type="feather"
                  size={16}
                  color={AppColors.success}
                />
                <AppText
                  size="xs"
                  color="gray"
                  weight="medium"
                  className="ml-2">
                  Total Partners
                </AppText>
              </View>
              <AppText size="2xl" weight="bold" className="text-success">
                {totalPartners}
              </AppText>
            </View>
          </View>
        </Card>
      </View>
    );
  }, [groupedByBranch.length, totalPartners, isDarkMode]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-lightBg-base dark:bg-darkBg-base px-3 pt-3">
        <Skeleton width={screenWidth - 24} height={80} borderRadius={8} />
        <View className="mt-3 gap-3">
          {[...Array(10)].map((_, index) => (
            <Skeleton
              key={index}
              width={screenWidth - 24}
              height={80}
              borderRadius={8}
            />
          ))}
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-lightBg-base dark:bg-darkBg-base px-4">
        <AppIcon
          name="alert-circle"
          type="feather"
          size={48}
          color={AppColors.error}
        />
        <AppText weight="semibold" color="error">
          Failed to load data
        </AppText>
        <AppText size="sm" color="gray" className="mt-1" numberOfLines={2}>
          Please try again or adjust filters.
        </AppText>
        <AppButton
          iconName="refresh-ccw"
          title="Retry"
          className="mt-4 w-[40%] rounded-lg "
          onPress={refetch}
        />
      </View>
    );
  }

  if (!groupedByBranch.length) {
    return (
      <View className="flex-1 items-center justify-center bg-lightBg-base dark:bg-darkBg-base">
        <AppIcon name="inbox" type="feather" size={48} color={AppColors.text} />
        <AppText size="md" color="gray">
          No data found
        </AppText>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-lightBg-base dark:bg-darkBg-base">
      <FlatList
        className="flex-1"
        contentContainerClassName="py-3 px-3"
        data={groupedByBranch}
        keyExtractor={item => item.branch}
        ListHeaderComponent={renderListHeader}
        ItemSeparatorComponent={() => <View className="h-3" />}
        showsVerticalScrollIndicator={false}
        renderItem={({item}) => {
          const {visible, showButton, isExpanded} = getVisiblePartners(
            item.partners,
            item.branch,
          );
          return (
            <Accordion
              header={
                <View className="flex-1">
                  <View className="flex-row items-center mb-2">
                    <AppIcon
                      name="map-marker-radius"
                      type="material-community"
                      size={18}
                      color={
                        isDarkMode
                          ? AppColors.dark.secondary
                          : AppColors.secondary
                      }
                    />
                    <AppText weight="bold" size="md" className="ml-2">
                      {item.branch}
                    </AppText>
                  </View>
                  <View className="flex-row flex-wrap gap-2">
                    <HeaderStat
                      label="Partners"
                      value={`${item.stats.partnersCount}`}
                      color={
                        isDarkMode
                          ? AppColors.dark.secondary
                          : AppColors.secondary
                      }
                      icon={{name: 'users', type: 'feather'}}
                    />
                    <HeaderStat
                      label="Stores"
                      value={`${item.stats.totalStores}`}
                      color={AppColors.success}
                      icon={{name: 'storefront', type: 'material-community'}}
                    />
                  </View>
                </View>
              }
              needBottomBorder={false}
              needShadow
              containerClassName="rounded-xl p-3 bg-lightBg-surface dark:bg-darkBg-surface">
              <View className="mt-3">
                <FlatList
                  data={visible}
                  keyExtractor={keyExtractor}
                  renderItem={renderPartner}
                  scrollEnabled={false}
                />
                {showButton && (
                  <TouchableOpacity
                    onPress={() => toggleBranchExpansion(item.branch)}
                    activeOpacity={0.7}
                    className="mt-3 py-3 bg-secondary/10 dark:bg-secondary-dark/20 rounded-lg flex-row items-center justify-center gap-2">
                    <AppText
                      size="sm"
                      weight="semibold"
                      className="text-secondary dark:text-secondary-dark">
                      {isExpanded
                        ? 'See Less'
                        : `See More (${item.partners.length - 10} more)`}
                    </AppText>
                    <AppIcon
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      type="feather"
                      size={18}
                      color={
                        isDarkMode
                          ? AppColors.dark.secondary
                          : AppColors.secondary
                      }
                    />
                  </TouchableOpacity>
                )}
              </View>
            </Accordion>
          );
        }}
      />
    </View>
  );
};

const ROI = () => {
  const {quarters, selectedQuarter, setSelectedQuarter} = useQuarterHook();
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(
    new Set(),
  );
  const isDarkMode = useThemeStore(state => state.AppTheme === 'dark');
  const {data, isLoading, error, refetch} = useGetDemoDataROI('20252', 'All');

  const groupedByBranch = useMemo(() => {
    const list = Array.isArray(data) ? data : [];
    if (list.length === 0)
      return [] as Array<{
        branch: string;
        partners: ROIData[];
        stats: {
          totalPartners: number;
          totalDemos: number;
          totalActivations: number;
          totalInventory: number;
        };
      }>;
    const map = new Map<string, ROIData[]>();
    for (const item of list) {
      const key = item.BranchName ?? 'Unknown Branch';
      const arr = map.get(key) ?? [];
      arr.push(item);
      map.set(key, arr);
    }
    return Array.from(map.entries())
      .map(([branch, partners]) => {
        const totalPartners = partners.length;
        const totalDemos = partners.reduce(
          (sum, p) => sum + (Number(p.Total_Demo_Count) || 0),
          0,
        );
        const totalActivations = partners.reduce(
          (sum, p) => sum + (Number(p.Activation_count) || 0),
          0,
        );
        const totalInventory = partners.reduce(
          (sum, p) => sum + (Number(p.Inventory_Count) || 0),
          0,
        );
        return {
          branch,
          partners,
          stats: {totalPartners, totalDemos, totalActivations, totalInventory},
        };
      })
      .sort((a, b) => a.branch.localeCompare(b.branch));
  }, [data]);

  const renderROICard = useCallback(
    ({item}: {item: ROIData}) => {
      return (
        <Card
          className="mb-2.5 mx-0 border border-gray-200 dark:border-gray-700"
          noshadow>
          {/* Partner Header with Model Series */}
          <View className="mb-2.5">
            <View className="flex-row items-center justify-between mb-1.5">
              <View className="flex-1">
                <AppText size="sm" weight="bold" numberOfLines={1}>
                  {item.PartnerName}
                </AppText>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <AppIcon
                  name="eye"
                  type="feather"
                  size={18}
                  color={
                    isDarkMode ? AppColors.dark.secondary : AppColors.secondary
                  }
                />
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-1.5">
                <AppIcon
                  name="barcode"
                  type="material-community"
                  size={12}
                  color={
                    isDarkMode ? AppColors.dark.secondary : AppColors.secondary
                  }
                />
                <AppText size="xs" color="gray">
                  {item.PartnerCode}
                </AppText>
              </View>

              {item.Model_Series && (
                <View className="flex-row items-center gap-1.5">
                  <AppIcon
                    name="devices"
                    type="material-community"
                    size={12}
                    color={
                      isDarkMode ? AppColors.dark.primary : AppColors.primary
                    }
                  />
                  <AppText
                    size="xs"
                    weight="semibold"
                    className="text-primary dark:text-primary-dark">
                    {item.Model_Series}
                  </AppText>
                </View>
              )}
            </View>
          </View>

          {/* Compact ROI Metrics - Single Row */}
          <View className="flex-row items-center justify-between">
            {/* Total Demos */}
            <View className="flex-1 items-center">
              <View className="w-8 h-8 bg-primary/10 dark:bg-primary/20 rounded-lg items-center justify-center mb-1">
                <AppIcon
                  name="play-circle"
                  type="feather"
                  size={14}
                  color={
                    isDarkMode ? AppColors.dark.primary : AppColors.primary
                  }
                />
              </View>
              <AppText
                size="xs"
                color="gray"
                weight="medium"
                className="mb-0.5">
                Demos
              </AppText>
              <AppText
                size="md"
                weight="bold"
                className="text-primary dark:text-primary-dark">
                {item.Total_Demo_Count}
              </AppText>
            </View>

            {/* Activations */}
            <View className="flex-1 items-center border-l border-r border-gray-200 dark:border-gray-700">
              <View className="w-8 h-8 bg-success/10 dark:bg-success/20 rounded-lg items-center justify-center mb-1">
                <AppIcon
                  name="check-circle"
                  type="feather"
                  size={14}
                  color={AppColors.success}
                />
              </View>
              <AppText
                size="xs"
                color="gray"
                weight="medium"
                className="mb-0.5">
                Active
              </AppText>
              <AppText size="md" weight="bold" className="text-success">
                {item.Activation_count}
              </AppText>
            </View>

            {/* Inventory */}
            <View className="flex-1 items-center border-r border-gray-200 dark:border-gray-700">
              <View className="w-8 h-8 bg-warning/10 dark:bg-warning/20 rounded-lg items-center justify-center mb-1">
                <AppIcon
                  name="package"
                  type="feather"
                  size={14}
                  color={AppColors.warning}
                />
              </View>
              <AppText
                size="xs"
                color="gray"
                weight="medium"
                className="mb-0.5">
                Stock
              </AppText>
              <AppText size="md" weight="bold" className="text-warning">
                {item.Inventory_Count}
              </AppText>
            </View>

            {/* ROI Ratio */}
            <View className="flex-1 items-center">
              <View className="w-8 h-8 bg-secondary/10 dark:bg-secondary-dark/20 rounded-lg items-center justify-center mb-1">
                <AppIcon
                  name="trending-up"
                  type="feather"
                  size={14}
                  color={
                    isDarkMode ? AppColors.dark.secondary : AppColors.secondary
                  }
                />
              </View>
              <AppText
                size="xs"
                color="gray"
                weight="medium"
                className="mb-0.5">
                ROI
              </AppText>
              <AppText
                size="md"
                weight="bold"
                className="text-secondary dark:text-secondary-dark">
                {item.Total_Demo_Count > 0
                  ? (
                      (item.Activation_count / item.Total_Demo_Count) *
                      100
                    ).toFixed(0)
                  : '0'}
                %
              </AppText>
            </View>
          </View>
        </Card>
      );
    },
    [isDarkMode],
  );

  const keyExtractor = useCallback(
    (item: ROIData) => `${item.PartnerCode}-${item.Model_Series}`,
    [],
  );

  const Metric: React.FC<MetricProps> = memo(({label, value, icon, tint}) => {
    const bgColor = tint === 'slate' ? 'bg-slate-100 dark:bg-slate-800' :
                    tint === 'violet' ? 'bg-violet-100 dark:bg-violet-900' :
                    tint === 'teal' ? 'bg-teal-100 dark:bg-teal-900' :
                    tint === 'amber' ? 'bg-amber-100 dark:bg-amber-900' :
                    'bg-blue-100 dark:bg-blue-900';
    
    const iconColor = tint === 'slate' ? '#64748b' :
                      tint === 'violet' ? '#8b5cf6' :
                      tint === 'teal' ? '#14b8a6' :
                      tint === 'amber' ? '#f59e0b' :
                      '#3b82f6';
    
    const textColor = tint === 'slate' ? 'text-slate-600 dark:text-slate-400' :
                      tint === 'violet' ? 'text-violet-600 dark:text-violet-400' :
                      tint === 'teal' ? 'text-teal-600 dark:text-teal-400' :
                      tint === 'amber' ? 'text-amber-600 dark:text-amber-400' :
                      'text-blue-600 dark:text-blue-400';
    
    return (
      <View className="w-1/4 mb-4 px-1 items-center">
        <View className={`w-10 h-10 rounded-full items-center justify-center mb-2 ${bgColor}`}>
          <AppIcon
            name={icon as any}
            type="feather"
            size={20}
            color={iconColor}
          />
        </View>
        <View className="flex-1 items-center">
          <AppText size="xs" className="text-gray-400 dark:text-gray-500 mb-0.5">
            {label}
          </AppText>
          <AppText size="sm" weight="bold" className={textColor}>
            {value}
          </AppText>
        </View>
      </View>
    );
  });

  const toggleBranchExpansion = useCallback((branchName: string) => {
    setExpandedBranches(prev => {
      const next = new Set(prev);
      if (next.has(branchName)) {
        next.delete(branchName);
      } else {
        next.add(branchName);
      }
      return next;
    });
  }, []);

  const getVisiblePartners = useCallback(
    (partners: ROIData[], branchName: string) => {
      const isExpanded = expandedBranches.has(branchName);
      const INITIAL_COUNT = 10;

      if (partners.length <= INITIAL_COUNT) {
        return {visible: partners, showButton: false, isExpanded: false};
      }

      return {
        visible: isExpanded ? partners : partners.slice(0, INITIAL_COUNT),
        showButton: true,
        isExpanded,
      };
    },
    [expandedBranches],
  );

  const overallStats = useMemo(() => {
    return groupedByBranch.reduce(
      (acc, branch) => ({
        totalBranches: acc.totalBranches + 1,
        totalPartners: acc.totalPartners + branch.stats.totalPartners,
        totalDemos: acc.totalDemos + branch.stats.totalDemos,
        totalActivations: acc.totalActivations + branch.stats.totalActivations,
        totalInventory: acc.totalInventory + branch.stats.totalInventory,
      }),
      {
        totalBranches: 0,
        totalPartners: 0,
        totalDemos: 0,
        totalActivations: 0,
        totalInventory: 0,
      },
    );
  }, [groupedByBranch]);

  const renderListHeader = useCallback(() => {
    return (
      <View className="mb-3">
        {/* Compact Summary Card */}
        <Card className="mx-0 p-3.5">
          <AppText size="md" weight="semibold">
            Overall Summary
          </AppText>
          <View className="flex-row items-center justify-between py-3 pt-6">
            {/* Total Demos */}
            <View className="flex-1 items-center">
              <View className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-xl items-center justify-center mb-2">
                <AppIcon
                  name="play-circle"
                  type="feather"
                  size={22}
                  color={
                    isDarkMode ? AppColors.dark.primary : AppColors.primary
                  }
                />
              </View>
              <AppText size="xs" color="gray" weight="medium" className="mb-1">
                Total Demos
              </AppText>
              <AppText
                size="xl"
                weight="bold"
                className="text-primary dark:text-primary-dark">
                {overallStats.totalDemos}
              </AppText>
            </View>

            {/* Total Activations */}
            <View className="flex-1 items-center border-l border-r border-gray-200 dark:border-gray-700">
              <View className="w-12 h-12 bg-success/10 dark:bg-success/20 rounded-xl items-center justify-center mb-2">
                <AppIcon
                  name="check-circle"
                  type="feather"
                  size={22}
                  color={AppColors.success}
                />
              </View>
              <AppText size="xs" color="gray" weight="medium" className="mb-1">
                Total Activations
              </AppText>
              <AppText size="xl" weight="bold" className="text-success">
                {overallStats.totalActivations}
              </AppText>
            </View>

            {/* Total Stock */}
            <View className="flex-1 items-center">
              <View className="w-12 h-12 bg-warning/10 dark:bg-warning/20 rounded-xl items-center justify-center mb-2">
                <AppIcon
                  name="package"
                  type="feather"
                  size={22}
                  color={AppColors.warning}
                />
              </View>
              <AppText size="xs" color="gray" weight="medium" className="mb-1">
                Total Stock
              </AppText>
              <AppText size="xl" weight="bold" className="text-warning">
                {overallStats.totalInventory}
              </AppText>
            </View>
          </View>
        </Card>
      </View>
    );
  }, [overallStats, isDarkMode]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-lightBg-base dark:bg-darkBg-base px-3 pt-3">
        <Skeleton width={screenWidth - 24} height={120} borderRadius={8} />
        <View className="mt-3">
          <Skeleton width={screenWidth - 24} height={140} borderRadius={8} />
        </View>
        <View className="mt-3 gap-3">
          {[...Array(5)].map((_, index) => (
            <Skeleton
              key={index}
              width={screenWidth - 24}
              height={100}
              borderRadius={8}
            />
          ))}
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-lightBg-base dark:bg-darkBg-base px-4">
        <AppIcon
          name="alert-circle"
          type="feather"
          size={48}
          color={AppColors.error}
        />
        <AppText weight="semibold" color="error" className="mt-3">
          Failed to load ROI data
        </AppText>
        <AppText
          size="sm"
          color="gray"
          className="mt-1 text-center"
          numberOfLines={2}>
          Please try again or select a different quarter.
        </AppText>
        <AppButton
          iconName="refresh-ccw"
          title="Retry"
          className="mt-4 w-[40%] rounded-lg"
          onPress={refetch}
        />
      </View>
    );
  }

  if (!groupedByBranch.length) {
    return (
      <View className="flex-1 bg-lightBg-base dark:bg-darkBg-base px-3 pt-3">
        {renderListHeader()}
        <View className="flex-1 items-center justify-center">
          <AppIcon
            name="inbox"
            type="feather"
            size={48}
            color={AppColors.text}
          />
          <AppText size="md" color="gray" className="mt-2">
            No ROI data found
          </AppText>
          <AppText size="sm" color="gray" className="mt-1 text-center">
            Try selecting a different quarter
          </AppText>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-lightBg-base dark:bg-darkBg-base">
      <FlatList
        className="flex-1"
        contentContainerClassName="py-3 px-3"
        data={groupedByBranch}
        keyExtractor={item => item.branch}
        ListHeaderComponent={
          <>
            {renderListHeader()}
            {/* Branch and Partner Stats */}
            <View className="flex-row items-center justify-between mb-3 px-1">
              <View className="flex-row items-center gap-1.5">
                <AppIcon
                  name="office-building"
                  type="material-community"
                  size={16}
                  color={
                    isDarkMode ? AppColors.dark.secondary : AppColors.secondary
                  }
                />
                <AppText size="xs" color="gray" weight="medium">
                  Total Branch:
                </AppText>
                <AppText
                  size="sm"
                  weight="bold"
                  className="text-secondary dark:text-secondary-dark">
                  {overallStats.totalBranches}
                </AppText>
              </View>

              <View className="flex-row items-center gap-1.5">
                <AppIcon
                  name="users"
                  type="feather"
                  size={16}
                  color={AppColors.success}
                />
                <AppText size="xs" color="gray" weight="medium">
                  Total Partner:
                </AppText>
                <AppText size="sm" weight="bold" className="text-success">
                  {overallStats.totalPartners}
                </AppText>
              </View>
            </View>
          </>
        }
        ItemSeparatorComponent={() => <View className="h-3" />}
        showsVerticalScrollIndicator={false}
        renderItem={({item}) => {
          const {visible, showButton, isExpanded} = getVisiblePartners(
            item.partners,
            item.branch,
          );
          return (
            <Accordion
              header={
                <View className="flex-1 items-start">
                  <View className="flex-row items-center gap-3">
                    <AppIcon
                      name="map-marker-radius"
                      type="material-community"
                      size={22}
                      style={{marginTop: 4}}
                      color={
                        isDarkMode
                          ? AppColors.dark.secondary
                          : AppColors.secondary
                      }
                    />
                    <AppText weight="bold" size="lg" className="mb-2">
                      {item.branch}
                    </AppText>
                  </View>
                  <View className="flex-1">
                    <View className="flex-row flex-wrap">
                      <Metric
                        label="Partners"
                        value={item.stats.totalPartners}
                        icon="users"
                        tint="slate"
                      />
                      <Metric
                        label="Demos"
                        value={item.stats.totalDemos}
                        icon="play-circle"
                        tint="blue"
                      />
                      <Metric
                        label="Activation"
                        value={item.stats.totalActivations}
                        icon="check-circle"
                        tint="teal"
                      />
                      <Metric
                        label="Stock"
                        value={item.stats.totalInventory}
                        icon="package"
                        tint="amber"
                      />
                    </View>
                  </View>
                </View>
              }
              needBottomBorder={false}
              needShadow
              containerClassName="rounded-xl p-3 bg-lightBg-surface dark:bg-darkBg-surface">
              <View className="mt-3">
                <FlatList
                  data={visible}
                  keyExtractor={keyExtractor}
                  renderItem={renderROICard}
                  scrollEnabled={false}
                />
                {showButton && (
                  <TouchableOpacity
                    onPress={() => toggleBranchExpansion(item.branch)}
                    activeOpacity={0.7}
                    className="mt-3 py-3 bg-secondary/10 dark:bg-secondary-dark/20 rounded-lg flex-row items-center justify-center gap-2">
                    <AppText
                      size="sm"
                      weight="semibold"
                      className="text-secondary dark:text-secondary-dark">
                      {isExpanded
                        ? 'See Less'
                        : `See More (${item.partners.length - 10} more)`}
                    </AppText>
                    <AppIcon
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      type="feather"
                      size={18}
                      color={
                        isDarkMode
                          ? AppColors.dark.secondary
                          : AppColors.secondary
                      }
                    />
                  </TouchableOpacity>
                )}
              </View>
            </Accordion>
          );
        }}
      />
    </View>
  );
};

// Header stat pill
const HeaderStat = ({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string;
  color: string;
  icon: {name: string; type: 'feather' | 'material-community'};
}) => {
  return (
    <View
      className="px-3 py-1 rounded-full flex-row items-center"
      style={{
        backgroundColor: `${color}20`,
      }}>
      <AppIcon name={icon.name} type={icon.type} size={14} color={color} />
      <AppText size="xs" color="gray" className="ml-2 mr-1">
        {label}
      </AppText>
      <AppText size="sm" weight="semibold" style={{color}}>
        {value}
      </AppText>
    </View>
  );
};

// Main Demo Component
export default function Demo() {
  return (
    <View className="flex-1 bg-lightBg-base dark:bg-darkBg-base">
      <MaterialTabBar
        tabs={[
          {
            name: 'by_program',
            component: ByProgram,
            label: 'By Program',
          },
          {
            name: 'by_partner',
            component: ByPartner,
            label: 'By Partner',
          },
          {
            name: 'roi',
            component: ROI,
            label: 'ROI',
          },
        ]}
      />
    </View>
  );
}
