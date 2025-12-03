import {memo, useCallback, useMemo, useState} from 'react';
import {View, TouchableOpacity, FlatList, TextInput} from 'react-native';
import ActionSheet, {
  SheetManager,
  useSheetPayload,
} from 'react-native-actions-sheet';

import AppText from '../../../../../../components/customs/AppText';
import AppButton from '../../../../../../components/customs/AppButton';
import AppIcon from '../../../../../../components/customs/AppIcon';

import {useThemeStore} from '../../../../../../stores/useThemeStore';
import {screenHeight} from '../../../../../../utils/constant';

// INTERFACES
export interface PromoterFilterPayload {
  promoters?: Array<{label: string; value: string}>;
  selectedPromoter?: string | null;
  selectedSort?: string | null;
  onApply?: (filters: PromoterFilterResult) => void;
  onReset?: () => void;
}

export interface PromoterFilterResult {
  promoter: string | null;
  sort: string | null;
}

interface RadioRowProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

interface GroupItemProps {
  label: string;
  active: boolean;
  hasValue: boolean;
  onPress: () => void;
}

// CONSTANTS
const SORT_OPTIONS = [
  {label: 'Quantity: Low to High', value: 'quantity_asc'},
  {label: 'Quantity: High to Low', value: 'quantity_desc'},
];

// SUB COMPONENTS
const RadioRow = memo(({label, selected, onPress}: RadioRowProps) => (
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
));

const GroupItem = memo(
  ({label, active, hasValue, onPress}: GroupItemProps) => (
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

// MAIN COMPONENT
export default function PromoterFilterSheet(){
  // ========== Payload & Theme ==========
  const payload = (useSheetPayload?.() || {}) as PromoterFilterPayload;
  const AppTheme = useThemeStore(state => state.AppTheme);
  const isDark = AppTheme === 'dark';

  // ========== State Management ==========
  const [selectedPromoter, setSelectedPromoter] = useState<string | null>(
    payload.selectedPromoter ?? null,
  );
  const [selectedSort, setSelectedSort] = useState<string | null>(
    payload.selectedSort ?? null,
  );
  const [activeGroup, setActiveGroup] = useState<string>('promoter');
  const [searchQuery, setSearchQuery] = useState('');

  // ========== Computed Data ==========
  const promoters = payload.promoters || [];

  // Filter promoters based on search query
  const filteredPromoters = useMemo(() => {
    if (!searchQuery.trim()) return promoters;
    const query = searchQuery.toLowerCase();
    return promoters.filter(
      item =>
        item.label.toLowerCase().includes(query) ||
        item.value.toLowerCase().includes(query),
    );
  }, [promoters, searchQuery]);

  // Calculate active filter count
  const activeCount = useMemo(
    () => [selectedPromoter, selectedSort].filter(v => v && v !== '').length,
    [selectedPromoter, selectedSort],
  );

  // Group configuration
  const groups = useMemo(
    () => [
      {key: 'promoter', label: 'Promoter', hasValue: !!selectedPromoter},
      {key: 'sort', label: 'Sort', hasValue: !!selectedSort},
    ],
    [selectedPromoter, selectedSort],
  );

  // ========== Event Handlers ==========
  const handleReset = useCallback(() => {
    setSelectedPromoter(null);
    setSelectedSort(null);
    setSearchQuery('');
    payload.onReset?.();
  }, [payload]);

  const handleApply = useCallback(() => {
    const result: PromoterFilterResult = {
      promoter: selectedPromoter,
      sort: selectedSort,
    };
    payload.onApply?.(result);
    SheetManager.hide('PromoterFilterSheet');
  }, [selectedPromoter, selectedSort, payload]);

  const handleClearSelection = useCallback(() => {
    if (activeGroup === 'promoter') {
      setSelectedPromoter(null);
      setSearchQuery('');
    } else if (activeGroup === 'sort') {
      setSelectedSort(null);
    }
  }, [activeGroup]);

  // ========== Render Functions ==========
  const renderPromoterItem = useCallback(
    ({item}: {item: {label: string; value: string}}) => {
      const isSelected = selectedPromoter === item.value;
      return (
        <RadioRow
          label={item.label}
          selected={isSelected}
          onPress={() => setSelectedPromoter(item.value)}
        />
      );
    },
    [selectedPromoter],
  );

  const renderSortItem = useCallback(
    ({item}: {item: {label: string; value: string}}) => {
      const isSelected = selectedSort === item.value;
      return (
        <RadioRow
          label={item.label}
          selected={isSelected}
          onPress={() => setSelectedSort(item.value)}
        />
      );
    },
    [selectedSort],
  );

  const renderEmptyPromoters = useCallback(
    () => (
      <View className="items-center justify-center py-8">
        <AppIcon
          name="search-outline"
          type="ionicons"
          size={48}
          color="#9CA3AF"
        />
        <AppText
          size="sm"
          className="text-slate-500 dark:text-slate-400 mt-3">
          No promoters found
        </AppText>
      </View>
    ),
    [],
  );

  const renderRightPane = useCallback(() => {
    // Promoter selection with search
    if (activeGroup === 'promoter') {
      return (
        <View className="flex-1">
          {/* Search input */}
          <View className="px-3 py-2 border-b border-slate-200 dark:border-slate-600">
            <View className="flex-row items-center bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2">
              <AppIcon
                name="search"
                type="ionicons"
                size={18}
                color="#6B7280"
              />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search promoter..."
                placeholderTextColor="#9CA3AF"
                className="flex-1 ml-2 text-slate-800 dark:text-slate-200 text-sm"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <AppIcon
                    name="close-circle"
                    type="ionicons"
                    size={18}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Promoter list */}
          <FlatList
            data={filteredPromoters}
            keyExtractor={item => item.value}
            renderItem={renderPromoterItem}
            ListEmptyComponent={renderEmptyPromoters}
            style={{flex: 1}}
            contentContainerStyle={{paddingBottom: 40}}
            showsVerticalScrollIndicator={false}
          />

          {/* Clear selection button */}
          {selectedPromoter && (
            <TouchableOpacity
              onPress={handleClearSelection}
              className="py-3 px-3 border-t border-slate-200 dark:border-slate-600 flex-row items-center justify-center">
              <AppText
                size="sm"
                className="text-blue-600 dark:text-blue-400 underline">
                Clear Selection
              </AppText>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    // Sort options
    if (activeGroup === 'sort') {
      return (
        <View className="flex-1">
          <FlatList
            data={SORT_OPTIONS}
            keyExtractor={item => item.value}
            renderItem={renderSortItem}
            style={{flex: 1}}
            contentContainerStyle={{paddingBottom: 40}}
            showsVerticalScrollIndicator={false}
          />

          {/* Clear selection button */}
          {selectedSort && (
            <TouchableOpacity
              onPress={handleClearSelection}
              className="py-3 px-3 border-t border-slate-200 dark:border-slate-600 flex-row items-center justify-center">
              <AppText
                size="sm"
                className="text-blue-600 dark:text-blue-400 underline">
                Clear Selection
              </AppText>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return null;
  }, [
    activeGroup,
    searchQuery,
    filteredPromoters,
    selectedPromoter,
    selectedSort,
    renderPromoterItem,
    renderSortItem,
    renderEmptyPromoters,
    handleClearSelection,
  ]);

  // ========== Main Render ==========
  return (
    <View>
      <ActionSheet
        id="PromoterFilterSheet"
        useBottomSafeAreaPadding
        containerStyle={{
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          maxHeight: screenHeight * 0.7,
        }}
        indicatorStyle={{
          backgroundColor: isDark ? '#6b7280' : '#d1d5db',
          width: 50,
          height: 4,
          borderRadius: 2,
          marginTop: 8,
        }}>
        <View className="px-3 pb-4 pt-2">
          {/* Header */}
          <View className="flex-row items-center justify-between mt-2 mb-4">
            <AppText size="lg" weight="bold">
              Filters {activeCount > 0 && `(${activeCount})`}
            </AppText>
            <TouchableOpacity
              onPress={handleReset}
              hitSlop={8}
              disabled={activeCount === 0}
              className={activeCount === 0 ? `opacity-50` : ``}>
              <AppText
                size="xs"
                weight="medium"
                className="text-blue-600 dark:text-blue-400">
                Clear All
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Main Content */}
          <View className="flex-row" style={{height: screenHeight * 0.5}}>
            {/* Left Group List */}
            <View style={{flexBasis: '30%', maxWidth: '30%', paddingRight: 4}}>
              {groups.map(g => (
                <GroupItem
                  key={g.key}
                  label={g.label}
                  active={activeGroup === g.key}
                  hasValue={g.hasValue}
                  onPress={() => setActiveGroup(g.key)}
                />
              ))}
            </View>

            {/* Divider */}
            <View className="w-px bg-slate-200 dark:bg-slate-600 mx-2" />

            {/* Right Content */}
            <View className="flex-1" style={{flexBasis: '70%', maxWidth: '70%'}}>
              {renderRightPane()}
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-3 pt-4 border-t border-slate-200 dark:border-slate-600 mt-4 items-center">
            <View className="flex-1 flex-row gap-3">
              <AppButton
                title="Close"
                onPress={() => SheetManager.hide('PromoterFilterSheet')}
                color="black"
                className="bg-slate-200 dark:bg-slate-700 flex-1"
              />
              <AppButton title="Apply" onPress={handleApply} className="flex-1" />
            </View>
          </View>
        </View>
      </ActionSheet>
    </View>
  );
};

// HELPER FUNCTIONS
export const showPromoterFilterSheet = (props: PromoterFilterPayload = {}) => SheetManager.show('PromoterFilterSheet', {payload: props});
export const hidePromoterFilterSheet = () => SheetManager.hide('PromoterFilterSheet');