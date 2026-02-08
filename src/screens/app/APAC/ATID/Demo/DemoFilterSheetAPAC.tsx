import React, {
  useCallback,
  useMemo,
  useState,
  useDeferredValue,
  memo,
} from 'react';
import {View, TouchableOpacity, FlatList} from 'react-native';
import ActionSheet, {SheetManager,useSheetPayload} from 'react-native-actions-sheet';
import {useGetDemoFilterOptionsAPAC} from '../../../../../hooks/queries/demo';
import AppText from '../../../../../components/customs/AppText';
import AppIcon from '../../../../../components/customs/AppIcon';
import FilterSheet from '../../../../../components/FilterSheet';
import {useThemeStore} from '../../../../../stores/useThemeStore';
import AppInput from '../../../../../components/customs/AppInput';
import moment from 'moment';

export interface DemoFilterPayloadAPAC {
  Month: string;
  ProgramName: string;
  Category: string;
  AGP: string;
  Store: string;
  onApply: (res: DemoFilterResultAPAC) => void;
  onReset: () => void;
}

export interface DemoFilterResultAPAC {
  Month: string;
  ProgramName: string;
  Category: string;
  AGP: string;
  Store: string;
}

type Group = 'month' | 'programName' | 'category' | 'agp' | 'store';

// Checkbox row component for individual filter items
const CheckboxRow = memo(
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
        className={`w-5 h-5 rounded border-2 mr-3 items-center justify-center ${
          selected
            ? 'border-blue-600 bg-blue-600'
            : 'border-slate-400 dark:border-slate-500'
        }`}>
        {selected && (
          <AppIcon name="check" type="feather" size={14} color="#ffffff" />
        )}
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

// Group item component for left panel navigation
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
      activeOpacity={0.8}
      className={`px-4 py-3 rounded-lg mb-2 flex-row items-center justify-between ${
        active
          ? 'bg-blue-100 dark:bg-blue-900'
          : 'bg-transparent hover:bg-slate-100'
      }`}>
      <AppText
        size="sm"
        weight={active ? 'semibold' : 'medium'}
        className={
          active
            ? 'text-blue-700 dark:text-blue-300'
            : 'text-slate-700 dark:text-slate-300'
        }>
        {label}
      </AppText>
      {hasValue && (
        <View className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
      )}
    </TouchableOpacity>
  ),
);

// Generate 12 months starting from current month
const generateMonthOptions = (): Array<{label: string; value: string}> => {
  const months: Array<{label: string; value: string}> = [];
  const currentDate = moment().subtract(1, 'years');

  for (let i = 0; i <= 12; i++) {
    const monthDate = currentDate.clone().add(i, 'months');
    months.push({
      label: monthDate.format('MMMM YYYY'),
      value: monthDate.format('YYYYM'),
    });
  }

  return months;
};

export default function DemoFilterSheetAPAC() {
  const payload = (useSheetPayload?.() || {}) as DemoFilterPayloadAPAC;
  // const isDarkTheme = useThemeStore(state => state.AppTheme === 'dark');

  // Filter state for each group
  const [month, setMonth] = useState<string>(payload.Month || '');
  const [programName, setProgramName] = useState<string>(payload.ProgramName);
  const [category, setCategory] = useState<string>(payload.Category || '');
  const [agp, setAGP] = useState<string>(payload.AGP || '');
  const [store, setStore] = useState<string>(payload.Store || '');

  // Active group state
  const [group, setGroup] = useState<Group>('month');

  // Search state for each group
  const [programNameSearch, setProgramNameSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [agpSearch, setAGPSearch] = useState('');
  const [storeSearch, setStoreSearch] = useState('');

  // Deferred search values for performance
  const dProgramNameSearch = useDeferredValue(programNameSearch);
  const dCategorySearch = useDeferredValue(categorySearch);
  const dAGPSearch = useDeferredValue(agpSearch);
  const dStoreSearch = useDeferredValue(storeSearch);

  // Fetch filter options from API
  const {data: filterData, isLoading: isLoadingFilterData} = useGetDemoFilterOptionsAPAC(month, agp);

  // Generate month options locally
  const monthOptions = useMemo(() => generateMonthOptions(), []);

  // Get data from API response
  const allProgramNames = useMemo(
    () => filterData?.ProgramName_Filter || [],
    [filterData],
  );
  const allCategories = useMemo(() => filterData?.Category || [], [filterData]);
  const allAGPs = useMemo(() => filterData?.AGP_Filter || [], [filterData]);
  const allStores = useMemo(() => filterData?.Store_filter || [], [filterData]);

  // Filtered data based on search
  const filteredProgramNames = useMemo(() => {
    const q = dProgramNameSearch.trim().toLowerCase();
    if (!q) return allProgramNames;
    return allProgramNames.filter((item: any) =>
      String(item.label || item)
        .toLowerCase()
        .includes(q),
    );
  }, [dProgramNameSearch, allProgramNames]);

  const filteredCategories = useMemo(() => {
    const q = dCategorySearch.trim().toLowerCase();
    if (!q) return allCategories;
    return allCategories.filter((item: any) =>
      String(item.label || item)
        .toLowerCase()
        .includes(q),
    );
  }, [dCategorySearch, allCategories]);

  const filteredAGPs = useMemo(() => {
    const q = dAGPSearch.trim().toLowerCase();
    if (!q) return allAGPs;
    return allAGPs.filter((item: any) =>
      String(item.label || item)
        .toLowerCase()
        .includes(q),
    );
  }, [dAGPSearch, allAGPs]);

  const filteredStores = useMemo(() => {
    const q = dStoreSearch.trim().toLowerCase();
    if (!q) return allStores;
    return allStores.filter((item: any) =>
      String(item.label || item)
        .toLowerCase()
        .includes(q),
    );
  }, [dStoreSearch, allStores]);

  // Calculate active filter count
  const activeCount = useMemo(() => {
    let count = 0;
    if (month) count++;
    if (programName) count++;
    if (category) count++;
    if (agp) count++;
    if (store) count++;
    return count;
  }, [month, programName, category, agp, store]);

  // Define groups for left panel
  const groups = useMemo(
    () => [
      {key: 'month' as const, label: 'Month', hasValue: !!month},
      {
        key: 'programName' as const,
        label: 'Program Name',
        hasValue: !!programName,
      },
      {key: 'category' as const, label: 'Category', hasValue: !!category},
      {key: 'agp' as const, label: 'AGP', hasValue: !!agp},
      {key: 'store' as const, label: 'Store', hasValue: !!store},
    ],
    [month, programName, category, agp, store],
  );

  // Toggle selection for items
  const toggleSelection = useCallback(
    (item: string) => {
      switch (group) {
        case 'month':
          setMonth(prev => (prev === item ? '' : item));
          break;
        case 'programName':
          setProgramName(prev => (prev === item ? '' : item));
          break;
        case 'category':
          setCategory(prev => (prev === item ? '' : item));
          break;
        case 'agp':
          setAGP(prev => (prev === item ? '' : item));
          break;
        case 'store':
          setStore(prev => (prev === item ? '' : item));
          break;
      }
    },
    [group],
  );

  // Get selected item for current group
  const getSelectedItem = useCallback((): string => {
    switch (group) {
      case 'month':
        return month;
      case 'programName':
        return programName;
      case 'category':
        return category;
      case 'agp':
        return agp;
      case 'store':
        return store;
      default:
        return '';
    }
  }, [group, month, programName, category, agp, store]);

  // Clear current filter section
  const handleClearSection = useCallback(() => {
    switch (group) {
      case 'month':
        setMonth('');
        break;
      case 'programName':
        setProgramName('');
        break;
      case 'category':
        setCategory('');
        break;
      case 'agp':
        setAGP('');
        break;
      case 'store':
        setStore('');
        break;
    }
  }, [group]);

  // Clear all filters
  const handleClearAll = useCallback(() => {
    setMonth('');
    setProgramName('');
    setCategory('');
    setAGP('');
    setStore('');
    // Reset parent component filters
    payload.onReset?.();
  }, [payload]);

  // Apply filters
  const handleApply = useCallback(() => {
    const result: DemoFilterResultAPAC = {
      Month: month,
      ProgramName: programName,
      Category: category,
      AGP: agp,
      Store: store,
    };
    payload.onApply?.(result);
    SheetManager.hide('DemoFilterSheetAPAC');
  }, [month, programName, category, agp, store, payload]);

  // Close sheet
  const handleClose = useCallback(() => {
    SheetManager.hide('DemoFilterSheetAPAC');
  }, []);

  // Render checkbox item
  const renderCheckbox = useCallback(
    ({item}: {item: any}) => {
      const itemValue = item.value || item;
      const itemLabel = item.label || item;
      return (
        <CheckboxRow
          label={String(itemLabel) || '—'}
          selected={getSelectedItem() === itemValue}
          onPress={() => toggleSelection(itemValue)}
        />
      );
    },
    [getSelectedItem, toggleSelection],
  );

  // Get current filter data
  const getCurrentFilterData = useCallback(() => {
    switch (group) {
      case 'month':
        return monthOptions;
      case 'programName':
        return filteredProgramNames;
      case 'category':
        return filteredCategories;
      case 'agp':
        return filteredAGPs;
      case 'store':
        return filteredStores;
      default:
        return [];
    }
  }, [
    group,
    monthOptions,
    filteredProgramNames,
    filteredCategories,
    filteredAGPs,
    filteredStores,
  ]);

  // Get current search value
  const getCurrentSearchValue = useCallback(() => {
    switch (group) {
      case 'programName':
        return programNameSearch;
      case 'category':
        return categorySearch;
      case 'agp':
        return agpSearch;
      case 'store':
        return storeSearch;
      default:
        return '';
    }
  }, [group, programNameSearch, categorySearch, agpSearch, storeSearch]);

  // Set current search value
  const setCurrentSearchValue = useCallback(
    (value: string) => {
      switch (group) {
        case 'programName':
          setProgramNameSearch(value);
          break;
        case 'category':
          setCategorySearch(value);
          break;
        case 'agp':
          setAGPSearch(value);
          break;
        case 'store':
          setStoreSearch(value);
          break;
      }
    },
    [group],
  );

  // Left content: Group navigation
  const leftContent = useMemo(
    () => (
      <FlatList
        data={groups}
        keyExtractor={item => item.key}
        renderItem={({item}) => (
          <GroupItem
            label={item.label}
            active={group === item.key}
            hasValue={item.hasValue}
            onPress={() => setGroup(item.key)}
          />
        )}
        showsVerticalScrollIndicator={false}
      />
    ),
    [groups, group],
  );

  // Right content: Filter options
  const rightContent = useMemo(() => {
    const currentData = getCurrentFilterData();
    const showSearch = group !== 'month'; // No search for month

    return (
      <View className="flex-1">
        {/* Search input */}
        {showSearch && (
          <View className="mb-3">
            <AppInput
              placeholder={`Search ${
                groups.find(g => g.key === group)?.label || ''
              }...`}
              value={getCurrentSearchValue()}
              setValue={setCurrentSearchValue}
              leftIcon="search"
            />
          </View>
        )}

        {/* Options list */}
        {isLoadingFilterData && group !== 'month' ? (
          <View className="flex-1 items-center justify-center">
            <AppText size="sm" className="text-gray-500">
              Loading...
            </AppText>
          </View>
        ) : currentData.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <AppText size="sm" className="text-gray-500">
              No options available
            </AppText>
          </View>
        ) : (
          <FlatList
            data={currentData}
            keyExtractor={(item, index) => `${item.value || item}-${index}`}
            renderItem={renderCheckbox}
            showsVerticalScrollIndicator={true}
          />
        )}
        {/* Clear button for current section */}
        {getSelectedItem() && (
          <View className="items-end mb-2">
            <TouchableOpacity
              onPress={handleClearSection}
              hitSlop={8}
              className="px-3 py-1">
              <AppText
                size="base"
                weight="medium"
                className="text-primary dark:text-primary-dark underline">
                Clear
              </AppText>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }, [
    getCurrentFilterData,
    group,
    groups,
    getCurrentSearchValue,
    setCurrentSearchValue,
    getSelectedItem,
    handleClearSection,
    isLoadingFilterData,
    renderCheckbox,
  ]);

  return (
    <View>
      <ActionSheet
        id="DemoFilterSheetAPAC"
        closeOnPressBack={true}
        defaultOverlayOpacity={0.3}>
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

export const showDemoFilterSheet = (props: DemoFilterPayloadAPAC) => 
  SheetManager.show('DemoFilterSheetAPAC', {payload: props});