import {View, TouchableOpacity, FlatList, TextInput} from 'react-native';
import {useCallback, useMemo, useState, memo} from 'react';
import ActionSheet, {
  SheetManager,
  useSheetPayload,
} from 'react-native-actions-sheet';
import {useThemeStore} from '../../../../stores/useThemeStore';
import AppText from '../../../../components/customs/AppText';
import {screenHeight} from '../../../../utils/constant';
import SheetIndicator from '../../../../components/SheetIndicator';
import FilterSheet from '../../../../components/FilterSheet';
import {AppDropdownItem} from '../../../../components/customs/AppDropdown';
import AppIcon from '../../../../components/customs/AppIcon';

export interface DemoPartnerFilterPayload {
  filters: {
    category: string;
    unitModel: string;
    status: string;
    demoType: string;
  };
  options: {
    categoryOptions: AppDropdownItem[];
    unitModelOptions: AppDropdownItem[];
    statusOptions: AppDropdownItem[];
    demoTypeOptions: AppDropdownItem[];
  };
  onApply: (filters: {
    category: string;
    unitModel: string;
    status: string;
    demoType: string;
  }) => void;
  onReset: () => void;
}

type FilterGroup =
  | 'category'
  | 'unitModel'
  | 'status'
  | 'demoType';

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

// Searchable list component for Unit Model
const SearchableList = memo(
  ({
    data,
    selectedValue,
    onSelect,
    searchPlaceholder = 'Search...',
  }: {
    data: AppDropdownItem[];
    selectedValue: string;
    onSelect: (value: string) => void;
    searchPlaceholder?: string;
  }) => {
    const [searchText, setSearchText] = useState('');

    const filteredData = useMemo(() => {
      if (!searchText.trim()) return data;
      const searchLower = searchText.toLowerCase();
      return data.filter(item =>
        item.label.toLowerCase().includes(searchLower),
      );
    }, [data, searchText]);

    return (
      <View className="flex-1">
        <View className="px-3 py-2 border-b border-slate-200 dark:border-slate-600">
          <View className="flex-row items-center bg-slate-100 dark:bg-slate-700 rounded-lg px-3 py-2">
            <AppIcon
              name="search"
              type="feather"
              size={16}
              color="#9CA3AF"
            />
            <TextInput
              placeholder={searchPlaceholder}
              placeholderTextColor="#9CA3AF"
              value={searchText}
              onChangeText={setSearchText}
              className="flex-1 ml-2 text-slate-900 dark:text-slate-100 text-sm"
            />
          </View>
        </View>
        <FlatList
          data={filteredData}
          keyExtractor={item => item.value}
          renderItem={({item}) => (
            <RadioRow
              label={item.label}
              selected={selectedValue === item.value}
              onPress={() => onSelect(item.value)}
            />
          )}
          ListEmptyComponent={
            <View className="p-4 items-center">
              <AppText size="sm" className="text-slate-500">
                No results found
              </AppText>
            </View>
          }
          contentContainerStyle={{paddingBottom: 20}}
        />
      </View>
    );
  },
);

export default function Demo_Partner_Filter_Sheet() {
  const payload = (useSheetPayload?.() || {}) as DemoPartnerFilterPayload;
  const isDarkMode = useThemeStore(state => state.AppTheme === 'dark');

  const [filters, setFilters] = useState(
    payload.filters || {
      category: '',
      unitModel: '',
      status: '',
      demoType: '',
    },
  );

  const [group, setGroup] = useState<FilterGroup>('category');

  const activeCount = useMemo(
    () =>
      Object.values(filters).filter(value => value != null && value !== '')
        .length,
    [filters],
  );

  const groups = useMemo(
    () => [
      {
        key: 'category' as FilterGroup,
        label: 'Category',
        hasValue: !!filters.category,
      },
      {
        key: 'unitModel' as FilterGroup,
        label: 'Unit Model',
        hasValue: !!filters.unitModel,
      },
      {
        key: 'status' as FilterGroup,
        label: 'Status',
        hasValue: !!filters.status,
      },
      {
        key: 'demoType' as FilterGroup,
        label: 'Demo Type',
        hasValue: !!filters.demoType,
      },
    ],
    [
      filters.category,
      filters.unitModel,
      filters.status,
      filters.demoType,
    ],
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
    const options = payload.options || {
      categoryOptions: [],
      unitModelOptions: [],
      statusOptions: [],
      demoTypeOptions: [],
    };

    switch (group) {
      case 'category': {
        const hasSelection = !!filters.category;
        return (
          <View className="flex-1">
            <FlatList
              data={options.categoryOptions}
              keyExtractor={item => item.value}
              renderItem={({item}) => (
                <RadioRow
                  label={item.label}
                  selected={filters.category === item.value}
                  onPress={() =>
                    setFilters(prev => ({...prev, category: item.value}))
                  }
                />
              )}
              contentContainerStyle={{paddingBottom: 40}}
              ListEmptyComponent={
                <View className="p-4 items-center">
                  <AppText size="sm" className="text-slate-500">
                    No categories available
                  </AppText>
                </View>
              }
            />
            {clearSelectionCTA(hasSelection, () =>
              setFilters(prev => ({...prev, category: ''})),
            )}
          </View>
        );
      }

      case 'unitModel': {
        const hasSelection = !!filters.unitModel;
        return (
          <View className="flex-1">
            <SearchableList
              data={options.unitModelOptions}
              selectedValue={filters.unitModel}
              onSelect={value =>
                setFilters(prev => ({...prev, unitModel: value}))
              }
              searchPlaceholder="Search Unit Model..."
            />
            {clearSelectionCTA(hasSelection, () =>
              setFilters(prev => ({...prev, unitModel: ''})),
            )}
          </View>
        );
      }

      case 'status': {
        const hasSelection = !!filters.status;
        return (
          <View className="flex-1">
            <FlatList
              data={options.statusOptions}
              keyExtractor={item => item.value}
              renderItem={({item}) => (
                <RadioRow
                  label={item.label}
                  selected={filters.status === item.value}
                  onPress={() =>
                    setFilters(prev => ({...prev, status: item.value}))
                  }
                />
              )}
              contentContainerStyle={{paddingBottom: 40}}
              ListEmptyComponent={
                <View className="p-4 items-center">
                  <AppText size="sm" className="text-slate-500">
                    No status options available
                  </AppText>
                </View>
              }
            />
            {clearSelectionCTA(hasSelection, () =>
              setFilters(prev => ({...prev, status: ''})),
            )}
          </View>
        );
      }

      case 'demoType': {
        const hasSelection = !!filters.demoType;
        return (
          <View className="flex-1">
            <FlatList
              data={options.demoTypeOptions}
              keyExtractor={item => item.value}
              renderItem={({item}) => (
                <RadioRow
                  label={item.label}
                  selected={filters.demoType === item.value}
                  onPress={() =>
                    setFilters(prev => ({...prev, demoType: item.value}))
                  }
                />
              )}
              contentContainerStyle={{paddingBottom: 40}}
              ListEmptyComponent={
                <View className="p-4 items-center">
                  <AppText size="sm" className="text-slate-500">
                    No demo type options available
                  </AppText>
                </View>
              }
            />
            {clearSelectionCTA(hasSelection, () =>
              setFilters(prev => ({...prev, demoType: ''})),
            )}
          </View>
        );
      }

      default:
        return null;
    }
  };

  const leftContent = useMemo(
    () => (
      <View>
        {groups.map(g => (
          <GroupItem
            key={g.key}
            label={g.label}
            active={group === g.key}
            hasValue={g.hasValue}
            onPress={() => setGroup(g.key)}
          />
        ))}
      </View>
    ),
    [group, groups],
  );

  const rightContent = useMemo(() => rightPanel(), [group, filters, payload]);

  const handleApply = useCallback(() => {
    payload.onApply(filters);
    hideDemoPartnerFilterSheet();
  }, [filters, payload]);

  const handleClearAll = useCallback(() => {
    setFilters({
      category: '',
      unitModel: '',
      status: '',
      demoType: '',
    });
    payload.onReset();
  }, [payload]);

  const handleClose = useCallback(() => {
    hideDemoPartnerFilterSheet();
  }, []);

  return (
    <View>
      <ActionSheet
        id={'DemoPartnerFilterSheet'}
        useBottomSafeAreaPadding
        keyboardHandlerEnabled={false}
        gestureEnabled={false}
        containerStyle={{
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
          maxHeight: screenHeight * 0.75,
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

export const showDemoPartnerFilterSheet = (
  props: DemoPartnerFilterPayload,
) => SheetManager.show('DemoPartnerFilterSheet', {payload: props});

const hideDemoPartnerFilterSheet = () =>
  SheetManager.hide('DemoPartnerFilterSheet');
