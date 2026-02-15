import React, {useState, useEffect, useMemo, useCallback} from 'react';
import {View, FlatList, Pressable, ScrollView} from 'react-native';
import ActionSheet, {SheetManager, useSheetPayload} from 'react-native-actions-sheet';
import AppText from '../../../../../components/customs/AppText';
import AppIcon from '../../../../../components/customs/AppIcon';
import AppButton from '../../../../../components/customs/AppButton';
import {useThemeStore} from '../../../../../stores/useThemeStore';
import {screenHeight} from '../../../../../utils/constant';

// Constants for month generation
const MONTHS_TO_GENERATE = 3;

interface MonthData {
  display: string;
  value: number;
  month: number;
  year: number;
}

interface FilterCategory {
  id: number;
  category: string;
  value: (string | MonthData)[];
}

interface SelectedFilters {
  Months?: MonthData[];
  'Product Lines'?: string[];
}

export interface ProgramFilterPayload {
  selectedFilters: SelectedFilters;
  onFiltersChange: (filters: SelectedFilters) => void;
  dynamicProductLines: string[];
  hasModelSelected: boolean;
}

// Generate dynamic months from current month back to MONTHS_TO_GENERATE
const generateMonthsData = (): MonthData[] => {
  const months: MonthData[] = [];
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth(); // 0-11 (Jan=0, Feb=1, etc.)
  const currentYear = currentDate.getFullYear();

  // Month abbreviations
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  // Generate months from current month back to specified number of months
  for (let i = 0; i < MONTHS_TO_GENERATE; i++) {
    let month = currentMonth - i;
    let year = currentYear;

    // Handle previous year months
    if (month < 0) {
      month = month + 12;
      year = year - 1;
    }

    const displayValue = `${monthNames[month]}-${year.toString().slice(-2)}`;
    const actualValue = month + 1; // Convert to 1-12 for comparison

    months.push({
      display: displayValue,
      value: actualValue,
      month: month + 1,
      year: year,
    });
  }

  return months.reverse(); // Reverse to show chronological order (oldest to newest)
};

const ProgramFilterSheet: React.FC = () => {
  const payload = (useSheetPayload?.() || {}) as ProgramFilterPayload;
  const {
    selectedFilters = {},
    onFiltersChange,
    dynamicProductLines = [],
    hasModelSelected = false,
  } = payload;

  const AppTheme = useThemeStore(state => state.AppTheme);
  const isDarkMode = AppTheme === 'dark';

  const [selectedCategory, setSelectedCategory] = useState(0);
  const [localSelectedFilters, setLocalSelectedFilters] = useState<SelectedFilters>(selectedFilters || {});

  // Update local state when props change
  useEffect(() => {
    setLocalSelectedFilters(selectedFilters || {});
  }, [selectedFilters]);

  // Memoize FilterData to prevent recreation on every render
  const FilterData = useMemo<FilterCategory[]>(
    () => [
      {
        id: 1,
        category: 'Months',
        value: generateMonthsData(),
      },
      // Only show Product Lines filter when no model is selected
      ...(hasModelSelected
        ? []
        : [
            {
              id: 2,
              category: 'Product Lines',
              value: dynamicProductLines || [],
            },
          ]),
    ],
    [hasModelSelected, dynamicProductLines],
  );

  // Reset selectedCategory if model is selected and we were on Product Lines
  useEffect(() => {
    if (hasModelSelected && selectedCategory >= FilterData.length) {
      setSelectedCategory(0); // Reset to Months category
    }
  }, [hasModelSelected, selectedCategory, FilterData.length]);

  const handleFilterToggle = useCallback(
    (category: string, filterItem: string | MonthData) => {
      const value =
        typeof filterItem === 'object' ? filterItem.value : filterItem;

      const updatedFilters = {...localSelectedFilters};
      const categoryFilters = (updatedFilters as any)[category] || [];
      const selectedFilter = categoryFilters.some((item: any) =>
        typeof item === 'object' ? item.value === value : item === value,
      );

      if (selectedFilter) {
        (updatedFilters as any)[category] = categoryFilters.filter(
          (item: any) =>
            typeof item === 'object' ? item.value !== value : item !== value,
        );
      } else {
        (updatedFilters as any)[category] = [...categoryFilters, filterItem];
      }

      // Update local state immediately for UI responsiveness
      setLocalSelectedFilters(updatedFilters);

      // Notify parent component immediately for real-time filtering
      if (onFiltersChange) {
        onFiltersChange(updatedFilters);
      }
    },
    [localSelectedFilters, onFiltersChange],
  );

  const clearAllFilters = useCallback(() => {
    setLocalSelectedFilters({});
    if (onFiltersChange) {
      onFiltersChange({});
    }
  }, [onFiltersChange]);

  const applyFilters = useCallback(() => {
    SheetManager.hide('ProgramFilterSheet');
  }, []);

  const closeBottomSheet = useCallback(() => {
    SheetManager.hide('ProgramFilterSheet');
  }, []);

  const currentCategoryData = FilterData[selectedCategory];

  return (
    <View>
      <ActionSheet
        id="ProgramFilterSheet"
        closeOnPressBack={true}
        defaultOverlayOpacity={0.3}>
        <View className="pb-4" style={{backgroundColor: isDarkMode ? '#1f2937' : '#ffffff'}}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <Pressable onPress={closeBottomSheet} className="p-1">
            <AppIcon
              type="ionicons"
              name="chevron-down"
              size={24}
              color={isDarkMode ? '#e5e7eb' : '#1f2937'}
            />
          </Pressable>
          <AppText size="lg" weight="bold" className="flex-1 ml-3">
            Filters
          </AppText>
          <Pressable onPress={clearAllFilters}>
            <AppText
              size="sm"
              weight="semibold"
              className="text-primary underline">
              Clear Filters
            </AppText>
          </Pressable>
        </View>

        {/* Main Content */}
        <View className="flex-row" style={{height: screenHeight * 0.6}}>
          {/* Categories List */}
          <View className="w-2/5 bg-slate-50 dark:bg-slate-800 pt-2">
            <FlatList
              data={FilterData}
              keyExtractor={item => item.id.toString()}
              showsVerticalScrollIndicator={false}
              renderItem={({item, index}) => {
                const isSelected = selectedCategory === index;

                // Calculate count of selected filters for this category
                const selectedCount =
                  (localSelectedFilters as any)[item.category]?.length || 0;

                return (
                  <Pressable
                    onPress={() => setSelectedCategory(index)}
                    className={`px-4 py-4 mx-2 my-1 rounded-lg ${
                      isSelected
                        ? isDarkMode
                          ? 'bg-slate-700 border border-primary'
                          : 'bg-blue-50 border border-primary'
                        : 'bg-transparent'
                    }`}>
                    <AppText
                      size="sm"
                      weight="bold"
                      className={
                        isSelected
                          ? 'text-primary'
                          : 'text-slate-700 dark:text-slate-300'
                      }>
                      {item.category}
                      {selectedCount > 0 ? ` (${selectedCount})` : ''}
                    </AppText>
                  </Pressable>
                );
              }}
              ListEmptyComponent={() => (
                <View className="p-4 items-center">
                  <AppText
                    size="sm"
                    className="text-slate-500 dark:text-slate-400 text-center">
                    No Filter Categories Available
                  </AppText>
                </View>
              )}
            />
          </View>

          {/* Filter Values */}
          <View className="flex-1 w-3/5 px-4 pt-4">
            <FlatList
              data={currentCategoryData?.value || []}
              keyExtractor={(item, index) => index.toString()}
              showsVerticalScrollIndicator={true}
              renderItem={({item: filterItem}) => {
                const displayValue =
                  typeof filterItem === 'object'
                    ? filterItem.display
                    : filterItem;
                const compareValue =
                  typeof filterItem === 'object'
                    ? filterItem.value
                    : filterItem;

                const isSelected =
                  (localSelectedFilters as any)[
                    currentCategoryData.category
                  ]?.some((item: any) =>
                    typeof item === 'object'
                      ? item.value === compareValue
                      : item === compareValue,
                  ) || false;

                return (
                  <Pressable
                    onPress={() =>
                      handleFilterToggle(
                        currentCategoryData.category,
                        filterItem,
                      )
                    }
                    className="flex-row items-center py-2 my-1">
                    <View className="mr-3">
                      <AppIcon
                        type="materialIcons"
                        name={
                          isSelected
                            ? 'check-box'
                            : 'check-box-outline-blank'
                        }
                        size={24}
                        color={
                          isSelected
                            ? '#3b82f6'
                            : isDarkMode
                              ? '#9ca3af'
                              : '#6b7280'
                        }
                      />
                    </View>
                    <AppText
                      size="sm"
                      className="flex-1 text-slate-700 dark:text-slate-200">
                      {displayValue}
                    </AppText>
                  </Pressable>
                );
              }}
              ListEmptyComponent={() => (
                <View className="p-4 items-center">
                  <AppText
                    size="sm"
                    className="text-slate-500 dark:text-slate-400 text-center">
                    No Filter Options Available
                  </AppText>
                </View>
              )}
            />
          </View>
        </View>

        {/* Apply Button */}
        <View className="px-5 pt-4">
          <AppButton
            title="Apply"
            onPress={applyFilters}
            className="rounded-lg bg-primary"
            size="md"
            weight="bold"
          />
        </View>
      </View>
    </ActionSheet>
    </View>
  );
};

export default ProgramFilterSheet;

export const showProgramFilterSheet = (payload: ProgramFilterPayload) => {
  SheetManager.show('ProgramFilterSheet', {payload});
};
