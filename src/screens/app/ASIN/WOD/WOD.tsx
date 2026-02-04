import {
  View,
  TouchableOpacity,
  FlatList,
  ListRenderItem,
  RefreshControl,
} from 'react-native';
import {useCallback, useEffect, useMemo, useState} from 'react';
import Card from '../../../../components/Card';
import AppText from '../../../../components/customs/AppText';
import AppIcon from '../../../../components/customs/AppIcon';
import {twMerge} from 'tailwind-merge';
import AppInput from '../../../../components/customs/AppInput';
import {useQuery} from '@tanstack/react-query';
import {handleASINApiCall} from '../../../../utils/handleApiCall';
import {useLoginStore} from '../../../../stores/useLoginStore';
import {useRef} from 'react';
import {
  BranchBlock,
  Territory,
  buildBranchBlocks,
  BranchCard,
  TabHeader,
  StatusInfoModal,
  STAT_PALETTE,
  TABS,
  WODSkeleton,
  BuildBranchBlocksResult,
} from './components';
import {showWODFilterSheet} from './WODFilterSheet';
import { useNavigation } from '@react-navigation/native';
import { AppNavigationProp } from '../../../../types/navigation';
import { useThemeStore } from '../../../../stores/useThemeStore';

const useGetWODData = (ModelName = '') => {
  const userInfo = useLoginStore((state: any) => state.userInfo);
  const employeeCode = userInfo?.EMP_Code || '';
  const roleId = userInfo?.EMP_RoleId || '';
  return useQuery<string[]>({
    queryKey: ['getWODData', employeeCode, roleId, ModelName],
    queryFn: async () => {
      console.log('Calling WOD API...', employeeCode, roleId, ModelName);
      const res = await handleASINApiCall(
        '/Information/GetChannelmapDashboardInfoModelWise',
        {
          employeeCode,
          RoleId: roleId,
          ModelName,
        },
      );
      const result = res.DashboardData;
      if (!result?.Status) return [];
      const raw = result?.Datainfo?.Channelmap_Info || [];
      console.log('WOD Data Rows:', raw);
      return raw;
    },
  });
};
const useGetCategories = () => {
  return useQuery({
    queryKey: ['getWODCategories'],
    queryFn: async () => {
      const res = await handleASINApiCall(
        '/Information/GetChannelmap_PartnerStatus_CategoryList',
      );
      const result = res.DashboardData;
      if (!result?.Status) return [];
      const raw = result?.Datainfo?.Channelmap_CategoryList || [];
      return raw;
    },
    select: (data: {Category: string,SubCategory: string}[]) => {
      // merge all subcategories into their categories
      const categoryMap: Record<string, Set<string>> = {};
      data.forEach(item => {
        const category = item.Category;
        const subCategory = item.SubCategory;
        if (!categoryMap[category]) {
          categoryMap[category] = new Set();
        }
        categoryMap[category].add(subCategory);
      });
      // convert to array of objects
      const categories = Object.entries(categoryMap).map(([category, subCats]) => ({
        category,
        subCategories: Array.from(subCats),
      }));
      return categories;
    },
  });
};

const IntialFilterState = {
  branch: [] as string[],
  partnerType: [] as string[],
  category: '',
  subCategory: '',
};

// Main Screen Component
export default function WOD() {
  const navigation = useNavigation<AppNavigationProp>();
  const isDark = useThemeStore(state => state.AppTheme === 'dark');
  const isFocused = navigation.isFocused();
  const [activeTab, setActiveTab] = useState(0);
  const activeMode = useMemo(
    () => (activeTab === 0 ? 'YoY' : activeTab === 1 ? 'QoQ' : 'MoM'),
    [activeTab],
  );

  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState(IntialFilterState);

  const {
    data: wodRaw = [],
    isLoading,
    refetch,
    isRefetching,
  } = useGetWODData(filter.subCategory);
  const {data: categories = [], isLoading: isCategoriesLoading} =useGetCategories();

  // Filter states
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchText.trim()), 300);
    return () => clearTimeout(id);
  }, [searchText]);

  const {
    data: branchBlocks,
    branchList,
    partnerTypeList,
  }: BuildBranchBlocksResult = useMemo(
    () =>
      wodRaw.length
        ? buildBranchBlocks(wodRaw as any, activeMode)
        : {data: [], branchList: [], partnerTypeList: []},
    [wodRaw, activeMode],
  );
  const summary = useMemo(() => {
    return branchBlocks.reduce(
      (acc: {active: number; sleeping: number; inactive: number}, r) => {
        r.territories.forEach((t: Territory) => {
          acc.active += t.active;
          acc.sleeping += t.sleeping;
          acc.inactive += t.inactive;
        });
        return acc;
      },
      {active: 0, sleeping: 0, inactive: 0},
    );
  }, [branchBlocks]);

  // ---------- FlatList Renderers ----------
  const filteredBranchBlocks: BranchBlock[] = useMemo(() => {
    let result = branchBlocks;

    // Apply branch and partner type filters
    if (filter.branch.length > 0 || filter.partnerType.length > 0) {
      // Create a map of CSE names that match the filter criteria
      const validCSENames = new Set<string>();

      (wodRaw as any[]).forEach((row: any) => {
        const matchesBranch =
          filter.branch.length === 0 ||
          filter.branch.includes((row.ACM_BranchName || '').toString().trim());
        const matchesPartnerType =
          filter.partnerType.length === 0 ||
          filter.partnerType.includes(
            (row.ACM_Partner_Type || '').toString().trim(),
          );

        if (matchesBranch && matchesPartnerType) {
          const cseName = (row.CSE_Name || row.ACM_CSE_Name || '')
            .toString()
            .trim();
          if (cseName && cseName.toLowerCase() !== 'null') {
            validCSENames.add(cseName);
          }
        }
      });

      // Filter branch blocks based on valid CSE names
      const filtered: BranchBlock[] = [];
      for (const branch of result) {
        const filteredTerritories: Territory[] = [];
        for (const terr of branch.territories) {
          const matchedCSE = (terr.CSE || []).filter(c =>
            validCSENames.has(c.name),
          );
          if (matchedCSE.length) {
            const active = matchedCSE.reduce((sum, c) => sum + c.active, 0);
            const sleeping = matchedCSE.reduce((sum, c) => sum + c.sleeping, 0);
            const inactive = matchedCSE.reduce((sum, c) => sum + c.inactive, 0);
            filteredTerritories.push({
              ...terr,
              CSE: matchedCSE,
              active,
              sleeping,
              inactive,
            });
          }
        }
        if (filteredTerritories.length) {
          const total = filteredTerritories.reduce(
            (sum, t) => sum + (t.active + t.sleeping + t.inactive),
            0,
          );
          filtered.push({...branch, territories: filteredTerritories, total});
        }
      }
      result = filtered;
    }

    // Apply search filter
    const q = debouncedSearch.toLowerCase();
    if (q.length >= 3) {
      const searchFiltered: BranchBlock[] = [];
      for (const branch of result) {
        const filteredTerritories: Territory[] = [];
        for (const terr of branch.territories) {
          const matchedCSE = (terr.CSE || []).filter(c =>
            c.name.toLowerCase().includes(q),
          );
          if (matchedCSE.length) {
            filteredTerritories.push({...terr, CSE: matchedCSE});
          }
        }
        if (filteredTerritories.length) {
          searchFiltered.push({...branch, territories: filteredTerritories});
        }
      }
      result = searchFiltered;
    }

    return result;
  }, [
    branchBlocks,
    debouncedSearch,
    filter.branch,
    filter.partnerType,
    wodRaw,
  ]);

  const [collapseVersion, setCollapseVersion] = useState(0);

  useEffect(() => {
    if (debouncedSearch.length === 0 || debouncedSearch.length < 3) {
      setCollapseVersion(v => v + 1);
    }
  }, [debouncedSearch]);

  const renderBranchCard: ListRenderItem<BranchBlock> = useCallback(
    ({item}) => (
      <BranchCard
        block={item}
        searchQuery={debouncedSearch}
        collapseSignal={collapseVersion}
        navigation={navigation}
        activeTab={activeTab}
      />
    ),
    [debouncedSearch, collapseVersion, activeTab, navigation],
  );
  const keyExtractor = useCallback((item: BranchBlock) => item.branch, []);

  const ListEmpty = !isLoading ? (
    <Card className="p-6 items-center mt-6">
      <AppIcon name="alert-circle" type="feather" size={24} color="#64748b" />
      <AppText size="sm" weight="medium" className="text-slate-500 mt-2">
        No data found
      </AppText>
    </Card>
  ) : null;

  const onRefresh = useCallback(async () => {
    try {
      await refetch();
    } catch (e) {
      console.warn('Refresh failed', e);
    }
  }, [refetch]);

  // Filter handlers
  const handleOpenFilterSheet = useCallback(() => {
    showWODFilterSheet({
      branch: filter.branch,
      partnerType: filter.partnerType,
      category: filter.category,
      subCategory: filter.subCategory,
      allBranches: branchList,
      allPartnerTypes: partnerTypeList,
      allCategories: categories || [],
      onApply: result => {
        setFilter(prev => ({
          ...prev,
          branch: result.branch,
          partnerType: result.partnerType,
          category: result.category,
          subCategory: result.subCategory,
        }));
      },
      onReset: () => {
        setFilter(IntialFilterState);
      },
    });
  }, [
    filter.branch,
    filter.partnerType,
    filter.category,
    filter.subCategory,
    branchList,
    partnerTypeList,
    categories,
  ]);

  const [showStatusInfo, setShowStatusInfo] = useState(false);
  const hasOpenedOnceRef = useRef(false);

  useEffect(() => {
    if (!isLoading && !hasOpenedOnceRef.current && isFocused) {
      hasOpenedOnceRef.current = true;
      setShowStatusInfo(true);
    }
  }, [isLoading]);

  const handleOpenStatusInfo = useCallback(() => setShowStatusInfo(true), []);
  const handleCloseStatusInfo = useCallback(() => setShowStatusInfo(false), []); 

  const activeCount = useMemo(() => {
    const isActive = false;
    if (filter.branch.length > 0 || filter.partnerType.length > 0) {
      return true;
    } else if (filter.category || filter.subCategory) {
      return true;
    }
    return isActive;
  }, [filter.branch, filter.partnerType, filter.category, filter.subCategory]);

  const ListHeader = (
    <View>
      <TabHeader
        activeIndex={activeTab}
        tabs={['YoY', 'QoQ', 'MoM']}
        onChange={setActiveTab}
      />
      <View className="flex-row mt-4 gap-2">
        <AppInput
          value={searchText}
          setValue={setSearchText}
          placeholder="Search by CSE Name"
          leftIcon="search"
          containerClassName="w-5/6 bg-lightBg-surface dark:bg-darkBg-surface"
          onClear={() => {
            setSearchText('');
            setCollapseVersion(v => v + 1);
          }}
        />
        {/* Filter */}
        <TouchableOpacity
          accessibilityRole="button"
          activeOpacity={0.75}
          className="w-[14%] rounded bg-lightBg-surface dark:bg-darkBg-surface border border-slate-300 items-center justify-center"
          onPress={handleOpenFilterSheet}>
          <AppIcon
            name="tune-variant"
            type="material-community"
            size={22}
            color={isDark ? '#94A3B8' : '#475569'}
          />
          {activeCount && (
            <View className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary items-center justify-center" />
          )}
        </TouchableOpacity>
      </View>
      <AppText
        size="sm"
        weight="semibold"
        className="mt-6 px-1 text-slate-600 tracking-wide">
        OVERALL SUMMARY
      </AppText>
      <Card className="mt-2 p-0 py-4">
        <View className="flex-row items-center mb-4 border-b border-slate-200  pb-3 pl-3">
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handleOpenStatusInfo}
            className="w-10 h-10 rounded-full items-center justify-center bg-blue-100 mr-4">
            <AppIcon
              type="materialIcons"
              name={'info'}
              size={20}
              color="#3B82F6"
            />
          </TouchableOpacity>
          <AppText size="lg" weight="semibold" className="text-slate-800">
            {TABS[activeTab]}
          </AppText>
        </View>
        <View className="flex-row ">
          {(Object.entries(summary) as [keyof typeof summary, number][]).map(
            ([key, value], idx) => {
              const palette = STAT_PALETTE[idx % STAT_PALETTE.length];
              return (
                <View key={String(key)} className="flex-1 items-center">
                  <View
                    className={twMerge(
                      'w-12 h-12 rounded-xl items-center justify-center mb-2',
                      palette.iconBg,
                    )}>
                    <AppIcon
                      name={palette.icon as any}
                      type="feather"
                      size={22}
                      color="white"
                    />
                  </View>
                  <AppText
                    size="xs"
                    weight="medium"
                    className={twMerge(
                      'uppercase tracking-wide',
                      palette.tint,
                    )}>
                    {String(key)}
                  </AppText>
                  <AppText
                    size="2xl"
                    weight="semibold"
                    className={twMerge('leading-tight', palette.tint)}>
                    {value}
                  </AppText>
                </View>
              );
            },
          )}
        </View>
      </Card>
      <AppText
        size="sm"
        weight="semibold"
        className="mt-8 px-1 text-slate-600 tracking-wide">
        BRANCH DETAILS
      </AppText>
    </View>
  );

  if (isLoading) return <WODSkeleton />;
  return (
    <View className="bg-lightBg-base dark:bg-darkBg-base flex-1">
      <StatusInfoModal
        activeMode={activeMode}
        visible={showStatusInfo}
        onClose={handleCloseStatusInfo}
      />
      <FlatList
        data={filteredBranchBlocks}
        renderItem={renderBranchCard}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        className="flex-1 px-3"
        contentContainerStyle={{paddingBottom: 48, paddingTop: 4, gap: 16}}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        initialNumToRender={15}
        windowSize={5}
        removeClippedSubviews
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isLoading}
            onRefresh={onRefresh}
            tintColor="#3B82F6"
            colors={['#3B82F6']}
          />
        }
      />
    </View>
  );
}
