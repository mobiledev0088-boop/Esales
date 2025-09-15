import React, { useState, useMemo, useEffect, SetStateAction, memo } from 'react';
import {
  View,
  StyleSheet,
  useColorScheme,
  Platform,
  ViewStyle,
  TextStyle,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { useThemeStore } from '../../stores/useThemeStore';
import { AppColors } from '../../config/theme';
import AppIcon from './AppIcon';
import AppText from './AppText';

export interface AppDropdownItem {
  label: string;
  value: string;
  [key: string]: any;
}

export interface AppDropdownProps {
  data: AppDropdownItem[];
  onSelect: (item: AppDropdownItem | null) => void;
  selectedValue?: string | null;
  mode: 'dropdown' | 'autocomplete';
  placeholder?: string;
  label?: string;
  required?: boolean;
  searchPlaceholder?: string;
  style?: ViewStyle;
  dropDownContainerStyle?: ViewStyle;
  textStyle?: TextStyle;
  listHeight?: number;
  disabled?: boolean;
  zIndex?: number;
  onOpenChange?: () => void;
  forceTheme?: 'light' | 'dark';
  needIndicator?: boolean;
}

const BATCH_SIZE = 40;
const AppDropdown: React.FC<AppDropdownProps> = ({
  data,
  onSelect,
  selectedValue = null,
  mode,
  placeholder = "Select an option...",
  label,
  required = false,
  searchPlaceholder = "Search...",
  style,
  dropDownContainerStyle,
  textStyle,
  listHeight = 200,
  disabled = false,
  zIndex = 1000,
  onOpenChange,
  forceTheme,
  needIndicator= false
}) => {
  const { AppTheme } = useThemeStore();
  const deviceColorScheme = useColorScheme();

  const theme = useMemo(() => {
    const activeTheme = forceTheme || AppTheme || deviceColorScheme || 'light';
    return AppColors[activeTheme];
  }, [AppTheme, deviceColorScheme, forceTheme]);

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string | null>(selectedValue);

  // Store the entire data for search
  const [allItems, setAllItems] = useState(data);
  const [searchResults, setSearchResults] = useState(data);

  // Only display a batch from searchResults
  const [displayedItems, setDisplayedItems] = useState(() => data.slice(0, BATCH_SIZE));
  const [loadedCount, setLoadedCount] = useState(BATCH_SIZE);

  useEffect(() => {
  if (selectedValue !== value) {
    setValue(selectedValue);
  }
}, [selectedValue]);

  // Reset on data change
  useEffect(() => {
    setAllItems(data);
    setSearchResults(data);
    setDisplayedItems(data.slice(0, BATCH_SIZE));
    setLoadedCount(BATCH_SIZE);
  }, [data]);

  const handleSelect = (val: string | null) => {
    setValue(val);
    onSelect(allItems.find(item => item.value === val) || null);
  };

  const handleOpenChange = (state: SetStateAction<boolean>) => {
    setOpen(state);
    if(!state) {
      setSearchResults(data);
      setDisplayedItems(data.slice(0, BATCH_SIZE));
      setLoadedCount(BATCH_SIZE);
    }
    onOpenChange?.();
  };

  // Load next batch from current search results
  const loadMore = () => {
    if (loadedCount < searchResults.length) {
      const nextBatch = searchResults.slice(
        loadedCount,
        loadedCount + BATCH_SIZE
      );
      setDisplayedItems(prev => [...prev, ...nextBatch]);
      setLoadedCount(prev => prev + BATCH_SIZE);
    }
  };

  // Detect scroll end to load more
  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const isBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 20;
    if (isBottom) loadMore();
  };

  // Search logic
  const handleSearch = (text: string) => {
    if (!text) {
      // No search → reset to all items batch
      setSearchResults(allItems);
      setDisplayedItems(allItems.slice(0, BATCH_SIZE));
      setLoadedCount(BATCH_SIZE);
      return;
    }
    const filtered = allItems.filter(item =>item.label.toLowerCase().includes(text.toLowerCase()));
    setSearchResults(filtered);
    setDisplayedItems(filtered.slice(0, BATCH_SIZE));
    setLoadedCount(BATCH_SIZE);
  };


  // All styles in one memo
  const stylesMemo = useMemo(() => ({
    pickerStyle: {
      backgroundColor: theme.bgSurface,
      borderColor: theme.border,
      borderWidth: 1.5,
      borderRadius: 12,
      minHeight: 54,
    },
    pickerText: {
      color: theme.text,
      fontSize: 16,
      fontWeight: '500' as const,
    },
    pickerContainer: {
      backgroundColor: theme.bgSurface,
      borderColor: theme.border,
      borderWidth: 1,
      borderRadius: 12,
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
      maxHeight: listHeight, 
    },
    placeholderText: {
      color: theme.text + '60',
    },
    searchInput: {
      backgroundColor: theme.bgSurface,
      color: theme.text,
      borderColor: theme.border,
      borderWidth: 1.5,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: Platform.OS === 'ios' ? 12 : 8,
      fontSize: 16,
      fontWeight: '500' as const,
      marginBottom: 8,
    },
  }), [theme, listHeight]);

  return (
    <View style={[styles.container, style]}>
      {label && (
                <AppText weight="semibold" size="md" className="mb-1 text-gray-700">
                    {required && <AppText className="text-red-500" weight="bold">*</AppText>} {label}
                </AppText>
            )}
      <DropDownPicker
        open={open}
        value={value}
        items={displayedItems}
        setOpen={handleOpenChange}
        setValue={setValue}
        onSelectItem={item => handleSelect(item.value || null)}
        placeholder={placeholder}
        disabled={disabled}
        searchable={mode === 'autocomplete'}
        searchPlaceholder={searchPlaceholder}
        searchTextInputStyle={[stylesMemo.searchInput, textStyle]}
        searchPlaceholderTextColor={theme.text + '60'}
        onChangeSearchText={handleSearch}
        disableLocalSearch
        searchContainerStyle={{
          borderBottomColor: theme.border,
          borderBottomWidth: 1,
          paddingBottom: 8,
          marginBottom: 8,
        }}
        style={stylesMemo.pickerStyle}
        textStyle={[stylesMemo.pickerText, textStyle]}
        placeholderStyle={stylesMemo.placeholderText}
        dropDownContainerStyle={[stylesMemo.pickerContainer, dropDownContainerStyle]}
        zIndex={zIndex}
        zIndexInverse={zIndex}
        closeAfterSelecting
        listMode="SCROLLVIEW"
        scrollViewProps={{ 
          showsVerticalScrollIndicator: needIndicator,
          onScroll: handleScroll,
          scrollEventThrottle: 16,
        }}
        showArrowIcon
        ArrowDownIconComponent={()=> <AppIcon type="feather" name="chevron-down" size={20} color={theme.text} />}
        ArrowUpIconComponent={() => <AppIcon type="feather" name="chevron-up" size={20} color={theme.text} />}
        listItemLabelStyle={{ color: theme.text, borderBottomWidth:0.3, borderBottomColor: theme.text + '40',paddingBottom:2 }}
        selectedItemLabelStyle={{
          color: theme.primary,
          fontWeight: 'bold',
        }}
        disabledItemLabelStyle={{color: theme.text + '40',}}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%', },
});

export default AppDropdown;
export interface AppDropdownMultipleProps {
  data: AppDropdownItem[];
  onSelect: (items: AppDropdownItem[]) => void;
  selectedValues?: string[];
  mode: "dropdown" | "autocomplete";
  placeholder?: string;
  label?: string;
  required?: boolean;
  searchPlaceholder?: string;
  style?: ViewStyle;
  dropDownContainerStyle?: ViewStyle;
  textStyle?: TextStyle;
  listHeight?: number;
  disabled?: boolean;
  zIndex?: number;
  zIndexInverse?: number;
  onOpenChange?: () => void;
  forceTheme?: "light" | "dark";
  needIndicator?: boolean;
}

export const AppDropdownMultiple: React.FC<AppDropdownMultipleProps> = memo(
  ({
    data,
    onSelect,
    selectedValues = [],
    mode,
    placeholder = "Select options...",
    label,
    required = false,
    searchPlaceholder = "Search...",
    style,
    dropDownContainerStyle,
    textStyle,
    listHeight = 200,
    disabled = false,
    zIndex = 1000,
    zIndexInverse = 1000,
    onOpenChange,
    forceTheme,
    needIndicator = false,
  }) => {
    const { AppTheme } = useThemeStore();
    const deviceColorScheme = useColorScheme();

    const theme = useMemo(() => {
      const activeTheme = forceTheme || AppTheme || deviceColorScheme || "light";
      return AppColors[activeTheme];
    }, [AppTheme, deviceColorScheme, forceTheme]);

    const [open, setOpen] = useState(false);
    const [values, setValues] = useState<string[]>(selectedValues);

    // 🔑 FIX: Sync local state when parent changes selectedValues
useEffect(() => {
  if (selectedValues.length !== values.length || !selectedValues.every((v) => values.includes(v))) {
    setValues(selectedValues);
  }
}, [selectedValues]);

    const [allItems, setAllItems] = useState(data);
    const [searchResults, setSearchResults] = useState(data);
    const [displayedItems, setDisplayedItems] = useState(data.slice(0, BATCH_SIZE));
    const [loadedCount, setLoadedCount] = useState(BATCH_SIZE);

    useEffect(() => {
      setAllItems(data);
      setSearchResults(data);
      setDisplayedItems(data.slice(0, BATCH_SIZE));
      setLoadedCount(BATCH_SIZE);
    }, [data]);

    const handleSelect = (vals: string[]) => {
      setValues(vals);
      const selectedItems = allItems.filter((item) => vals.includes(item.value));
      onSelect(selectedItems);
    };

    const handleOpenChange = (state: SetStateAction<boolean>) => {
      setOpen(state);
      if (!state) {
        setSearchResults(data);
        setDisplayedItems(data.slice(0, BATCH_SIZE));
        setLoadedCount(BATCH_SIZE);
      }
      onOpenChange?.();
    };

    const loadMore = () => {
      if (loadedCount < searchResults.length) {
        const nextBatch = searchResults.slice(loadedCount, loadedCount + BATCH_SIZE);
        setDisplayedItems((prev) => [...prev, ...nextBatch]);
        setLoadedCount((prev) => prev + BATCH_SIZE);
      }
    };

    const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      const isBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 20;
      if (isBottom) loadMore();
    };

    const handleSearch = (text: string) => {
      if (!text) {
        setSearchResults(allItems);
        setDisplayedItems(allItems.slice(0, BATCH_SIZE));
        setLoadedCount(BATCH_SIZE);
        return;
      }
      const filtered = allItems.filter((item) =>
        item.label.toLowerCase().includes(text.toLowerCase())
      );
      setSearchResults(filtered);
      setDisplayedItems(filtered.slice(0, BATCH_SIZE));
      setLoadedCount(BATCH_SIZE);
    };

    const stylesMemo = useMemo(
      () => ({
        pickerStyle: {
          backgroundColor: theme.bgSurface,
          borderColor: theme.border,
          borderWidth: 1.5,
          borderRadius: 12,
          minHeight: 54,
        },
        pickerText: {
          color: theme.text,
          fontSize: 16,
          fontWeight: "500" as const,
        },
        pickerContainer: {
          backgroundColor: theme.bgSurface,
          borderColor: theme.border,
          borderWidth: 1,
          borderRadius: 12,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          maxHeight: listHeight,
        },
        placeholderText: {
          color: theme.text + "60",
        },
        searchInput: {
          backgroundColor: theme.bgSurface,
          color: theme.text,
          borderColor: theme.border,
          borderWidth: 1.5,
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: Platform.OS === "ios" ? 12 : 8,
          fontSize: 16,
          fontWeight: "500" as const,
          marginBottom: 8,
        },
      }),
      [theme, listHeight]
    );

    return (
      <View style={style}>
        {label && (
          <AppText weight="semibold" size="md" className="mb-1 text-gray-700">
            {required && <AppText className="text-red-500">*</AppText>} {label}
          </AppText>
        )}
        <DropDownPicker
          multiple
          open={open}
          value={values}
          items={displayedItems}
          setOpen={handleOpenChange}
          setValue={setValues}
          onChangeValue={(vals) => handleSelect(vals as string[])}
          placeholder={placeholder}
          disabled={disabled}
          searchable={mode === "autocomplete"}
          searchPlaceholder={searchPlaceholder}
          searchTextInputStyle={[stylesMemo.searchInput, textStyle]}
          searchPlaceholderTextColor={theme.text + "60"}
          onChangeSearchText={handleSearch}
          disableLocalSearch
          searchContainerStyle={{
            borderBottomColor: theme.border,
            borderBottomWidth: 1,
            paddingBottom: 8,
            marginBottom: 8,
          }}
          style={stylesMemo.pickerStyle}
          textStyle={[stylesMemo.pickerText, textStyle]}
          placeholderStyle={stylesMemo.placeholderText}
          dropDownContainerStyle={[stylesMemo.pickerContainer, dropDownContainerStyle]}
          zIndex={zIndex}
          zIndexInverse={zIndexInverse}
          listMode="SCROLLVIEW"
          scrollViewProps={{
            showsVerticalScrollIndicator: needIndicator,
            onScroll: handleScroll,
            scrollEventThrottle: 16,
          }}
          showArrowIcon
          ArrowDownIconComponent={() => (
            <AppIcon type="feather" name="chevron-down" size={20} color={theme.text} />
          )}
          ArrowUpIconComponent={() => (
            <AppIcon type="feather" name="chevron-up" size={20} color={theme.text} />
          )}
          listItemLabelStyle={{
            color: theme.text,
            borderBottomWidth: 0.3,
            borderBottomColor: theme.text + "40",
          }}
          selectedItemLabelStyle={{
            color: theme.primary,
            fontWeight: "bold",
          }}
          disabledItemLabelStyle={{ color: theme.text + "40" }}
        />
      </View>
    );
  }
);


