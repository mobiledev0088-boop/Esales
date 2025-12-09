import {FlatList, Pressable, RefreshControl, Text, View} from 'react-native';
import {useLoginStore} from '../../../../../stores/useLoginStore';
import {handleAPACApiCall} from '../../../../../utils/handleApiCall';
import {useInfiniteQuery, useMutation, useQuery} from '@tanstack/react-query';
import AppDropdown, {
  AppDropdownItem,
} from '../../../../../components/customs/AppDropdown';
import {useCallback, useMemo, useRef, useState} from 'react';
import {AppColors} from '../../../../../config/theme';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import AppIcon from '../../../../../components/customs/AppIcon';
import AppText from '../../../../../components/customs/AppText';
import {TabHeader} from '../../../ASIN/WOD/components';

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
}

interface RawModel {
  Model_Name?: string | null;
}

interface PaginationEnvelope {
  ongoing?: Scheme[];
  lapsed?: Scheme[];
  hasMore: boolean;
  __page: number;
}

// Shape of each scheme returned when searching by model name (based on GetModelInfo Datainfo keys)
interface ModelInfoResponse {
  Scheme_List?: any[]; // We'll keep it generic; parent will cast / adapt
}

interface ProgramSearchProps {
  onModelLoading?: (loading: boolean) => void;
  onModelSchemes?: (schemes: any[], modelName: string) => void;
  onClearSearch?: () => void;
}

const TabIndex = {
  ONGOING: 0, // Active
  EXPIRED: 2, // Lapsed
} as const;
const LIMIT = 10 as const;
const SCROLL_THRESHOLD = 350;
// API CAll
const useGetModelList = () => {
  const {EMP_Code: employeeCode = '', EMP_RoleId: RoleId = ''} = useLoginStore(
    state => state.userInfo,
  );

  return useQuery<AppDropdownItem[], Error>({
    queryKey: ['getModelList', employeeCode, RoleId],
    enabled: Boolean(employeeCode && RoleId),
    queryFn: async () => {
      const res = await handleAPACApiCall('/Information/GetModelList', {
        employeeCode,
        RoleId,
      });

      const dashboard = res.DashboardData;
      if (!dashboard.Status) {
        return [];
      }

      const list: RawModel[] = dashboard.Datainfo?.Model_List ?? [];
      const unique = Array.from(
        new Set(
          list
            .map(m => m.Model_Name?.trim())
            .filter((name): name is string => !!name),
        ),
      ).map(name => ({label: name, value: name}));
      return unique;
    },
  });
};

const useGetModelInfo = () => {
  const userInfo = useLoginStore(state => state.userInfo);
  return useMutation({
    mutationKey: ['selectedModel'],
    mutationFn: async (selectedModel: AppDropdownItem) => {
      const res = await handleAPACApiCall('/Information/GetModelInfo', {
        employeeCode: userInfo?.EMP_Code,
        RoleId: userInfo?.EMP_RoleId,
        ModelName: selectedModel?.value,
      });
      const result = res.DashboardData;
      if (!result.Status) {
        throw new Error('Failed to fetch model info');
      }
      console.log('Model Info Response:', result);
      return result.Datainfo as ModelInfoResponse;
    },
    onSuccess: data => {
      const schemes = data?.Scheme_List ?? [];
      return schemes;
    },
    onSettled: () => {
      // onModelLoading?.(false);
    },
    // onMutate: (variables) => {
    //   currentModelNameRef.current = variables?.value as string;
    //   onModelLoading?.(true);
    // }
  });
};

const fetchOngoingSchemes = async (
  roleId: number,
  empCode: string,
  page: number,
) => {
  console.log('Fetching ongoing schemes, page:', page);
  const res = await handleAPACApiCall('/Information/GetAllSchemeInfo', {
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
  const res = await handleAPACApiCall('/Information/GetAllSchemeInfo', {
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

function ProgramSearch({
  onModelLoading,
  onModelSchemes,
  onClearSearch,
}: ProgramSearchProps) {
  const currentModelNameRef = useRef<string>('');
  const {
    data: modelOptions,
    isLoading: isLoadingModels,
    isError,
  } = useGetModelList();
  const {mutate, isPending: isSelectingModel, data} = useGetModelInfo();

  const handleSelect = (item: AppDropdownItem | null) => {
    if (item) {
      mutate(item);
    } else {
      // cleared
      currentModelNameRef.current = '';
      onClearSearch?.();
    }
  };

  // Handle error
  if (isError) {
    console.log('Error fetching model list');
    return null;
  }

  return (
    <View className="px-3 pt-4 pb-2 ">
      <AppDropdown
        data={modelOptions ?? []}
        mode="autocomplete"
        placeholder={isLoadingModels ? 'Loading...' : 'Search Model Number'}
        onSelect={handleSelect}
        label="Model Number"
        labelIcon="search"
        allowClear
        needIndicator
        listHeight={250}
      />
    </View>
  );
}

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

export default function Program() {
  const flatListRef = useRef<FlatList<Scheme>>(null);
  const userInfo = useLoginStore(state => state.userInfo);
  const roleId = Number(userInfo?.EMP_RoleId ?? 0);

  const [modelLoading, setModelLoading] = useState(false);
  const [modelSchemes, setModelSchemes] = useState<Scheme[]>([]);
  const [modelSearchActive, setModelSearchActive] = useState(false);
  const [selectedModelName, setSelectedModelName] = useState<string>('');
  const [activeTabidx, setActiveTabidx] = useState<number>(TabIndex.ONGOING);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const fabVisible = useSharedValue(0);

  const keyExtractor = useCallback(
    (item: Scheme, index: number) =>
      item?.Claim_Code || `${activeTabidx}-${index}`,
    [activeTabidx],
  );

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

  const ongoingList = useMemo(() => {
    const arr =
      (ongoingData as any)?.pages?.flatMap(
        (p: PaginationEnvelope) => p?.ongoing ?? [],
      ) ?? [];
    return dedupeSchemes(arr as Scheme[]);
  }, [ongoingData]);

  const historicList = useMemo(() => {
    const arr =
      (historicData as any)?.pages?.flatMap(
        (p: PaginationEnvelope) => p?.lapsed ?? [],
      ) ?? [];
    return dedupeSchemes(arr as Scheme[]);
  }, [historicData]);

  // const handleEndReached = useCallback(() => {
  //   if (hasMore && !loadingMore) loadNext?.();
  // }, [hasMore, loadingMore, loadNext]);

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

  const ListHeader = useMemo(
    () => (
      <View className="pb-3">
        <View className="flex-row items-center pl-1 pt-4 mb-1">
          <View className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-900/40 items-center justify-center mr-2">
            <AppIcon type="feather" name="layers" size={18} color="#7c3aed" />
          </View>
          <AppText
            size="lg"
            weight="bold"
            className="text-heading dark:text-heading-dark">
            {modelSearchActive && selectedModelName
              ? `Program - ${selectedModelName}`
              : 'Programs'}
          </AppText>
        </View>
        {!modelSearchActive && (
          <TabHeader
            tabs={[
              `Ongoing (${ongoingList.length})`,
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
      historicList.length,
      ongoingList.length,
      modelSearchActive,
      selectedModelName,
    ],
  );
  const scrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({offset: 0, animated: true});
  }, []);
  return (
    <View className="flex-1 bg-lightBg-base dark:bg-darkBg-base">
      <ProgramSearch
        onModelLoading={setModelLoading}
        onModelSchemes={(schemes, modelName) => {
          setModelSchemes(schemes as Scheme[]);
          setModelSearchActive(true);
          setSelectedModelName(modelName);
        }}
        onClearSearch={() => {
          setModelSearchActive(false);
          setModelSchemes([]);
          setSelectedModelName('');
          setModelLoading(false);
        }}
      />

      <FlatList
        ref={flatListRef}
        data={[]}
        keyExtractor={keyExtractor}
        renderItem={() => null}
        showsVerticalScrollIndicator={false}
        // onEndReached={handleEndReached}
        onEndReachedThreshold={0.2}
        onScroll={handleScroll}
        scrollEventThrottle={32}
        // ListFooterComponent={ListFooter}
        ListHeaderComponent={ListHeader}
        // ListEmptyComponent={EmptyList}
        contentContainerClassName="px-3"
        // refreshControl={
        //   <RefreshControl
        //     refreshing={
        //       modelSearchActive
        //         ? modelLoading
        //         : activeTabidx === TabIndex.ONGOING
        //           ? loadingOngoing
        //           : activeTabidx === TabIndex.EXPIRED
        //             ? loadingHistoric
        //             : loadingOngoing
        //     }
        //     onRefresh={modelSearchActive ? () => {} : onRefresh}
        //     tintColor={AppColors.primary}
        //   />
        // }
        removeClippedSubviews
        initialNumToRender={6}
        windowSize={11}
      />
      <AnimatedFAB
        visible={showScrollTop}
        animatedValue={fabVisible}
        onPress={scrollToTop}
      />
    </View>
  );
}
