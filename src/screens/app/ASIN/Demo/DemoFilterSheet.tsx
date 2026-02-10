import {memo, useCallback, useEffect, useMemo, useState} from 'react';
import {View, TouchableOpacity, FlatList} from 'react-native';
import ActionSheet, {SheetManager,useSheetPayload} from 'react-native-actions-sheet';
import AppText from '../../../../components/customs/AppText';
import {useThemeStore} from '../../../../stores/useThemeStore';
import SheetIndicator from '../../../../components/SheetIndicator';
import AppIcon from '../../../../components/customs/AppIcon';
import AppInput from '../../../../components/customs/AppInput';
import FilterSheet from '../../../../components/FilterSheet';
import { useDebounce } from '../../../../hooks/useDebounce';
interface DemoFilterPayload {
  filters: Record<string, string | number | null>;
  data: Record<string, Array<{label: string; value: string | number}>>;
  loading: boolean;
  onApply?: (filters: Record<string, string | number | null>) => void;
  onReset?: () => void;
}

type Group = keyof DemoFilterPayload['filters'];

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

export default function DemoFilterSheet() {
  const payload = (useSheetPayload?.() || {}) as DemoFilterPayload;
  const isDarkTheme = useThemeStore(state => state.AppTheme === 'dark');
  const [filters, setFilters] = useState<Record<string, string | number | null>>(
    payload.filters || {},
  );
  const [searchTexts, setSearchTexts] = useState<Record<string, string>>({});
  const debouncedSearchTexts = useDebounce(searchTexts,300);
  const datList = payload.data || {};
  const isLoading = payload.loading;

  const activeCount = useMemo(() =>Object.values(filters).filter(value => value != null && value !== '').length,[filters])
  console.log('DemoFilterSheet - filters', filters);
  const groups = useMemo(
    () => Object.keys(filters).map(key => ({
        key,
        label: key === 'compulsory' ? 'Demo Status' : key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase()),
        data: datList[key] || [],
        hasValue: filters[key] !== '' && filters[key] != null,
      })),
    [filters],
  );
  const [group, setGroup] = useState<Group>(groups[0].key);

  const leftContent = useMemo(
    () => (
      <FlatList
        data={groups}
        keyExtractor={item => item.key}
        renderItem={({item}) =>
            <GroupItem
              label={item.label}
              active={group === item.key}
              hasValue={item.hasValue}
              onPress={() => setGroup(item.key)}
            />
        }
        showsVerticalScrollIndicator={false}
      />
    ),[groups,group]);

  const toggleSelection = useCallback(
    (item: string) => {
      setFilters(prev => {
        const newFilters = {...prev};
        if (newFilters[group] === item) {
          newFilters[group] = null;
        } else {
          newFilters[group] = item;
        }
        return newFilters;
      });
    },
    [group],
  );

  const renderCheckbox = useCallback(
    ({item}: {item: any}) => {
      const itemValue = item.value;
      const itemLabel = item.label;
      return (
        <CheckboxRow
          label={String(itemLabel) || '—-'}
          selected={filters[group] === itemValue}
          onPress={() => toggleSelection(itemValue)}
        />
      );
    },
    [filters, group, toggleSelection],
  );

  const rightContent = useMemo(() => {
    const currentData = datList[group] || [];
    const showSearch = currentData.length > 10;

    const searchText = (debouncedSearchTexts[group] || '').trim().toLowerCase();
    const filteredData =
      searchText.length === 0
        ? currentData
        : currentData.filter(option => {
            const label = String(option.label ?? '').toLowerCase();
            const value = String(option.value ?? '').toLowerCase();
            return (
              label.includes(searchText) ||
              value.includes(searchText)
            );
          });

    return (
      <View className="flex-1">
        {/* Search input */}
        {showSearch && (
          <View className="mb-3">
            <AppInput
              placeholder={`Search ${
                groups.find(g => g.key === group)?.label || ''
              }...`}
              value={searchTexts[group] || ''}
              setValue={value =>setSearchTexts(prev => ({...prev, [group]: value}))}
              leftIcon="search"
            />
          </View>
        )}
        {isLoading && group !== 'month' ? (
          <View className="flex-1 items-center justify-center">
            <AppText size="sm" className="text-gray-500 dark:text-slate-400">
              Loading...
            </AppText>
          </View>
        ) : currentData.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <AppText size="sm" className="text-gray-500 dark:text-slate-400">
              No options available
            </AppText>
          </View>
        ) : (
          <FlatList
            data={filteredData}
            keyExtractor={(_, index) => index.toString()}
            renderItem={renderCheckbox}
            showsVerticalScrollIndicator={true}
          />
        )}
      </View>
    );
  }, [filters, group, searchTexts, debouncedSearchTexts, isLoading, datList, groups, renderCheckbox]);

  const handleApply = useCallback(() => {
    const result: Record<string, string | number | null> = {...filters};
    payload.onApply?.(result);
    SheetManager.hide('DemoFilterSheet');
  }, [payload, filters]);

  const handleClearAll = useCallback(() => {
    setFilters(prev => {
      const newFilters: Record<string, string | number> = {};
      Object.keys(prev).forEach(key => {
        newFilters[key] = '';
      });
      return newFilters;
    });
    payload.onReset?.();
  }, [payload]);

  const handleClose = useCallback(() => {
    SheetManager.hide('DemoFilterSheet');
  }, []);

  return (
    <View>
      <ActionSheet
        id="DemoFilterSheet"
        useBottomSafeAreaPadding
        keyboardHandlerEnabled={false}
        gestureEnabled={false}
        closeOnPressBack
        defaultOverlayOpacity={isDarkTheme ? 0.7 : 0.3}
        containerStyle={{
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff',
        }}>
        <SheetIndicator />
        <FilterSheet
          title="Filter"
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

export const showDemoFilterSheet = (props: DemoFilterPayload) => SheetManager.show('DemoFilterSheet', {payload: props});