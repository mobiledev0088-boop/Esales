import {View, TouchableOpacity, FlatList} from 'react-native';
import {useCallback, useMemo, useState, memo} from 'react';
import ActionSheet, {
  SheetManager,
  useSheetPayload,
} from 'react-native-actions-sheet';
import {useThemeStore} from '../../../../../stores/useThemeStore';
import {useQuery} from '@tanstack/react-query';
import {handleASINApiCall} from '../../../../../utils/handleApiCall';
import {useLoginStore} from '../../../../../stores/useLoginStore';
import AppText from '../../../../../components/customs/AppText';
import {screenHeight} from '../../../../../utils/constant';
import SheetIndicator from '../../../../../components/SheetIndicator';
import FilterSheet from '../../../../../components/FilterSheet';

interface SpotLightVideosFilterPayload {
  filters: {
    categories: string;
  };
  onApply: (filter: {categories: string}) => void;
  onReset: () => void;
}

// Radio button component for single selection
const RadioRow = memo(
  ({
    label,
    selected,
    onPress,
  }: {
    label: string;
    selected: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-row items-center py-3 px-3 border-b border-slate-100 dark:border-slate-600">
      <View
        className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
          selected
            ? 'border-blue-600'
            : 'border-slate-400 dark:border-slate-500'
        }`}>
        {selected && <View className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
      </View>
      <AppText
        size="sm"
        className={`flex-1 ${
          selected
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-slate-700 dark:text-slate-200'
        }`}>
        {label}
      </AppText>
    </TouchableOpacity>
  ),
);

// Group item component for left sidebar
const GroupItem = memo(
  ({
    label,
    active,
    hasValue,
    onPress,
  }: {
    label: string;
    active: boolean;
    hasValue: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`px-3 py-3 rounded-md mb-1 flex-row items-center ${
        active ? 'bg-blue-50 dark:bg-blue-900/40' : 'bg-transparent'
      }`}>
      <View className="flex-1">
        <AppText
          size="sm"
          weight={active ? 'semibold' : 'regular'}
          className={`${
            active
              ? 'text-blue-700 dark:text-blue-300'
              : 'text-slate-600 dark:text-slate-300'
          }`}>
          {label}
        </AppText>
      </View>
      {hasValue && <View className="w-2 h-2 rounded-full bg-blue-500" />}
    </TouchableOpacity>
  ),
);

export default function SpotLightVideosFilter() {
  const payload = (useSheetPayload?.() || {}) as SpotLightVideosFilterPayload;
  const isDarkMode = useThemeStore(state => state.AppTheme === 'dark');
  const userInfo = useLoginStore(state => state.userInfo);

  const {
    data: categoriesOptions = [],
    isLoading: categoriesLoading,
  } = useQuery<string[], Error>({
    queryKey: ['spotlightVideosCategories'],
    queryFn: async () => {
      const res = await handleASINApiCall(
        '/Information/GetSpotlightModelList',
        {
          employeeCode: userInfo?.EMP_Code,
          RoleId: userInfo?.EMP_RoleId,
        },
      );
      const result = res.DashboardData;
      if (!result?.Status) {
        throw new Error(result?.Message || 'Failed to fetch categories');
      }
      const list = result?.Datainfo?.Spotlight_Category || [];
      return list.map((item: {Spotlight_Category: string}) => item.Spotlight_Category);
    },
  });

  const [filters, setFilters] = useState(
    payload.filters || {
      categories: '',
    },
  );

  const [group, setGroup] = useState<'categories'>('categories');

  const activeCount = useMemo(
    () =>
      Object.values(filters).filter(value => {
        if (Array.isArray(value)) return value.length > 0;
        return value != null && value !== '';
      }).length,
    [filters],
  );

  const groups = useMemo(
    () => [
      {key: 'categories', label: 'Categories', hasValue: !!filters.categories},
    ],
    [filters.categories],
  );

  const clearSelectionCTA = (hasSelection: boolean, onClear: () => void) =>
    hasSelection ? (
      <TouchableOpacity
        onPress={onClear}
        className="py-3 px-3 border-t border-slate-200 dark:border-slate-600 flex-row items-center justify-center">
        <AppText
          size="sm"
          className="text-blue-600 dark:text-blue-400 underline">
          Clear Selection
        </AppText>
      </TouchableOpacity>
    ) : null;

  const rightPanel = () => {
    if (group === 'categories') {
      const hasSelection = !!filters.categories && filters.categories !== '';

      return (
        <View className="flex-1">
          <FlatList
            data={categoriesOptions}
            keyExtractor={item => item}
            renderItem={({item}) => (
              <RadioRow
                label={item}
                selected={filters.categories === item}
                onPress={() =>
                  setFilters(prev => ({...prev, categories: item}))
                }
              />
            )}
            style={{flex: 1}}
            contentContainerStyle={{paddingBottom: 40}}
          />
          {clearSelectionCTA(hasSelection, () =>
            setFilters(prev => ({...prev, categories: ''})),
          )}
        </View>
      );
    }

    return null;
  };

  const leftContent = useMemo(
    () => (
      <View>
        {groups.map(g => (
          <GroupItem
            key={g.key}
            label={g.label}
            active={group === (g.key as any)}
            hasValue={g.hasValue}
            onPress={() => setGroup(g.key as any)}
          />
        ))}
      </View>
    ),
    [group, groups],
  );

  const rightContent = useMemo(
    () => rightPanel(),
    [group, filters, categoriesOptions, categoriesLoading],
  );

  const handleApply = useCallback(() => {
    payload.onApply(filters);
    hideSpotlightVideosFilterSheet();
  }, [filters, payload]);

  const handleClearAll = useCallback(() => {
    setFilters({
      categories: '',
    });
    payload.onReset();
  }, [payload]);

  const handleClose = useCallback(() => {
    hideSpotlightVideosFilterSheet();
  }, []);

  return (
    <View>
      <ActionSheet
        id={'SpotlightVideoFilterSheet'}
        useBottomSafeAreaPadding
        keyboardHandlerEnabled={false}
        gestureEnabled={false}
        containerStyle={{
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
          maxHeight: screenHeight * 0.7,
        }}>
        <SheetIndicator />
        <FilterSheet
          title="Filters"
          activeCount={activeCount}
          leftContent={leftContent}
          rightContent={rightContent}
          onApply={handleApply}
          onClearAll={handleClearAll}
          onClose={handleClose}
          heightRatio={0.7}
        />
      </ActionSheet>
    </View>
  );
}

export const showSpotlightVideosFilterSheet = (
  props: SpotLightVideosFilterPayload,
) => SheetManager.show('SpotlightVideoFilterSheet', {payload: props});

const hideSpotlightVideosFilterSheet = () =>
  SheetManager.hide('SpotlightVideoFilterSheet');
