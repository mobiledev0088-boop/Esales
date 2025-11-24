import {
  useState,
  useMemo,
  useEffect,
  SetStateAction,
  memo,
  useCallback,
  ReactNode,
  useRef,
} from 'react';
import {Pressable} from 'react-native';
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
import {useThemeStore} from '../../stores/useThemeStore';
import {AppColors} from '../../config/theme';
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
  labelIcon?: string;
  labelIconTsx?: ReactNode;
  allowClear?: boolean;
  onClear?: () => void;
  required?: boolean;
  searchPlaceholder?: string;
  style?: ViewStyle;
  dropDownContainerStyle?: ViewStyle;
  textStyle?: TextStyle;
  listHeight?: number;
  disabled?: boolean;
  zIndex?: number;
  onOpenChange?: () => void;
  needIndicator?: boolean;
  error?: string;
}
const BATCH_SIZE = 40;

const AppDropdown: React.FC<AppDropdownProps> = ({
  data,
  onSelect,
  selectedValue = null,
  mode,
  placeholder = 'Select an option...',
  label,
  labelIcon,
  labelIconTsx,
  required = false,
  allowClear = false,
  onClear,
  searchPlaceholder = 'Search...',
  style,
  dropDownContainerStyle,
  textStyle,
  listHeight = 200,
  disabled = false,
  zIndex = 1000,
  onOpenChange,
  needIndicator = false,
  error,
}) => {
  const {AppTheme} = useThemeStore();
  const deviceColorScheme = useColorScheme();

  const theme = useMemo(() => {
    const activeTheme = AppTheme || deviceColorScheme || 'light';
    return AppColors[activeTheme];
  }, [AppTheme, deviceColorScheme]);

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string | null>(selectedValue);

  // Store the entire data for search
  const [allItems, setAllItems] = useState(data);
  const [searchResults, setSearchResults] = useState(data);

  // Only display a batch from searchResults
  const [displayedItems, setDisplayedItems] = useState(() =>
    data.slice(0, BATCH_SIZE),
  );
  const [loadedCount, setLoadedCount] = useState(BATCH_SIZE);
  // Guard to avoid concurrent loadMore executions causing duplicates
  const isLoadingMoreRef = useRef(false);

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

  const handleSelect = useCallback(
    (val: string | null) => {
      setValue(val);
      onSelect(allItems.find(item => item.value === val) || null);
    },
    [allItems, onSelect],
  );

  const handleOpenChange = useCallback(
    (state: SetStateAction<boolean>) => {
      setOpen(state);
      if (!state) {
        // Reset everything to initial state
        setSearchResults(data);
        if (!selectedValue) {
          setDisplayedItems(data.slice(0, BATCH_SIZE)); 
          setLoadedCount(BATCH_SIZE);
        }
        isLoadingMoreRef.current = false;
      }
      onOpenChange?.();
    },
    [data, onOpenChange],
  );

  // Load next batch from current search results
  const loadMore = useCallback(() => {
    if (isLoadingMoreRef.current) return; // already loading
    // Use functional update to avoid stale closures & race conditions
    setDisplayedItems(prev => {
      if (prev.length >= searchResults.length) return prev; // nothing more
      isLoadingMoreRef.current = true;
      const start = prev.length;
      const end = start + BATCH_SIZE;
      const nextBatch = searchResults.slice(start, end);
      if (!nextBatch.length) {
        // safety
        isLoadingMoreRef.current = false;
        return prev;
      }
      // Dedupe just in case (should be unnecessary but protects against rapid calls)
      const existingValues = new Set(prev.map(it => it.value));
      const filteredBatch = nextBatch.filter(
        it => !existingValues.has(it.value),
      );
      const merged = filteredBatch.length ? [...prev, ...filteredBatch] : prev;
      setLoadedCount(merged.length);
      isLoadingMoreRef.current = false;
      return merged;
    });
  }, [searchResults]);

  // Detect scroll end to load more
  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const {contentOffset, contentSize, layoutMeasurement} = e.nativeEvent;
      const isBottom =
        contentOffset.y + layoutMeasurement.height >= contentSize.height - 20;
      if (isBottom) loadMore();
    },
    [loadMore],
  );

  // Search logic
  const handleSearch = useCallback(
    (text: string) => {
      if (!text) {
        setSearchResults(allItems);
        setDisplayedItems(allItems.slice(0, BATCH_SIZE));
        setLoadedCount(BATCH_SIZE);
        isLoadingMoreRef.current = false;
        return;
      }
      const filtered = allItems.filter(item =>
        item.label.toLowerCase().includes(text.toLowerCase()),
      );
      setSearchResults(filtered);
      setDisplayedItems(filtered.slice(0, BATCH_SIZE));
      setLoadedCount(BATCH_SIZE);
      isLoadingMoreRef.current = false;
    },
    [allItems],
  );

  const handleClear = useCallback(() => {
    setValue(null);
    handleSelect(null);
    onClear?.();
  }, [onClear]);

  // All styles in one memo
  const stylesMemo = useMemo(
    () => ({
      pickerStyle: {
        backgroundColor: disabled ? '#F3F4F6' : theme.bgSurface,
        borderColor: error ? '#EF4444' : disabled ? '#D1D5DB' : theme.border,
        borderWidth: 1,
        borderRadius: 12,
        minHeight: 45,
        opacity: disabled ? 0.7 : 1,
      },
      pickerText: {
        color: disabled ? '#9CA3AF' : theme.text,
        fontSize: 16,
        fontWeight: '500' as const,
      },
      pickerContainer: {
        backgroundColor: theme.bgSurface,
        borderColor: error ? '#EF4444' : theme.border,
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
    }),
    [theme, listHeight, error, disabled],
  );

  return (
    <View style={[styles.container, style]}>
      {label && (
        <View className="mb-1 flex-row items-center">
          {labelIconTsx ? (
            <View style={{marginRight: 4}}>{labelIconTsx}</View>
          ) : labelIcon ? (
            <AppIcon
              type="feather"
              name={labelIcon}
              size={16}
              color={theme.text}
              style={{marginRight: 4}}
            />
          ) : null}
          <AppText weight="semibold" size="md" className="text-gray-700">
            {required && (
              <AppText className="text-red-500" weight="bold">
                *
              </AppText>
            )}{' '}
            {label}
          </AppText>
        </View>
      )}
      <View>
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
          dropDownContainerStyle={[
            stylesMemo.pickerContainer,
            dropDownContainerStyle,
          ]}
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
          ArrowDownIconComponent={() =>
            allowClear && value ? (
              <Pressable hitSlop={8} onPress={handleClear}>
                <AppIcon type="feather" name="x" size={18} color={theme.text} />
              </Pressable>
            ) : (
              <AppIcon
                type="feather"
                name="chevron-down"
                size={20}
                color={theme.text}
              />
            )
          }
          ArrowUpIconComponent={() =>
            allowClear && value ? (
              <Pressable hitSlop={8} onPress={handleClear}>
                <AppIcon type="feather" name="x" size={18} color={theme.text} />
              </Pressable>
            ) : (
              <AppIcon
                type="feather"
                name="chevron-up"
                size={20}
                color={theme.text}
              />
            )
          }
          listItemLabelStyle={{
            color: theme.text,
            borderBottomWidth: 0.3,
            borderBottomColor: theme.text + '40',
            paddingBottom: 2,
          }}
          selectedItemLabelStyle={{
            color: theme.primary,
            fontWeight: 'bold',
          }}
          disabledItemLabelStyle={{color: theme.text + '40'}}
        />
      </View>
      {error && (
        <AppText className="mt-1 text-xs text-red-500">{error}</AppText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {width: '100%'},
});

export default AppDropdown;
export interface AppDropdownMultipleProps {
  data: AppDropdownItem[];
  onSelect: (items: AppDropdownItem[]) => void;
  selectedValues?: string[];
  mode: 'dropdown' | 'autocomplete';
  placeholder?: string;
  label?: string;
  required?: boolean;
  /** Show clear icon when selections exist */
  allowClear?: boolean;
  searchPlaceholder?: string;
  style?: ViewStyle;
  dropDownContainerStyle?: ViewStyle;
  textStyle?: TextStyle;
  listHeight?: number;
  disabled?: boolean;
  zIndex?: number;
  zIndexInverse?: number;
  onOpenChange?: () => void;
  needIndicator?: boolean;
  error?: string;
}

export const AppDropdownMultiple: React.FC<AppDropdownMultipleProps> = memo(
  ({
    data,
    onSelect,
    selectedValues = [],
    mode,
    placeholder = 'Select options...',
    label,
    required = false,
    searchPlaceholder = 'Search...',
    style,
    dropDownContainerStyle,
    textStyle,
    listHeight = 200,
    disabled = false,
    zIndex = 1000,
    zIndexInverse = 1000,
    onOpenChange,
    needIndicator = false,
    allowClear = false,
    error,
  }) => {
    const {AppTheme} = useThemeStore();
    const deviceColorScheme = useColorScheme();

    const theme = useMemo(() => {
      const activeTheme = AppTheme || deviceColorScheme || 'light';
      return AppColors[activeTheme];
    }, [AppTheme, deviceColorScheme]);

    const [open, setOpen] = useState(false);
    const [values, setValues] = useState<string[]>(selectedValues);

    // 🔑 FIX: Sync local state when parent changes selectedValues
    useEffect(() => {
      if (
        selectedValues.length !== values.length ||
        !selectedValues.every(v => values.includes(v))
      ) {
        setValues(selectedValues);
      }
    }, [selectedValues]);

    const [allItems, setAllItems] = useState(data);
    const [searchResults, setSearchResults] = useState(data);
    const [displayedItems, setDisplayedItems] = useState(
      data.slice(0, BATCH_SIZE),
    );
    const [loadedCount, setLoadedCount] = useState(BATCH_SIZE);
    const isLoadingMoreRef = useRef(false);

    useEffect(() => {
      setAllItems(data);
      setSearchResults(data);
      setDisplayedItems(data.slice(0, BATCH_SIZE));
      setLoadedCount(BATCH_SIZE);
    }, [data]);

    const handleSelect = (vals: string[]) => {
      setValues(vals);
      const selectedItems = allItems.filter(item => vals.includes(item.value));
      onSelect(selectedItems);
    };

    const handleOpenChange = useCallback(
      (state: SetStateAction<boolean>) => {
        setOpen(state);
        if (!state) {
          // Reset everything to initial state
          console.log('Dropdown closed,', data);
          setSearchResults(data);
          console.log('selectedValues:', data);
          if (!selectedValues.length) {
            setDisplayedItems(data.slice(0, BATCH_SIZE));
            setLoadedCount(BATCH_SIZE);
          }
          isLoadingMoreRef.current = false;
        }
        onOpenChange?.();
      },
      [data, onOpenChange],
    );

    const loadMore = () => {
      if (isLoadingMoreRef.current) return;
      setDisplayedItems(prev => {
        if (prev.length >= searchResults.length) return prev;
        isLoadingMoreRef.current = true;
        const start = prev.length;
        const end = start + BATCH_SIZE;
        const nextBatch = searchResults.slice(start, end);
        if (!nextBatch.length) {
          isLoadingMoreRef.current = false;
          return prev;
        }
        const existing = new Set(prev.map(i => i.value));
        const filteredBatch = nextBatch.filter(i => !existing.has(i.value));
        const merged = filteredBatch.length
          ? [...prev, ...filteredBatch]
          : prev;
        setLoadedCount(merged.length);
        isLoadingMoreRef.current = false;
        return merged;
      });
    };

    const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const {contentOffset, contentSize, layoutMeasurement} = e.nativeEvent;
      const isBottom =
        contentOffset.y + layoutMeasurement.height >= contentSize.height - 20;
      if (isBottom) loadMore();
    };

    const handleSearch = (text: string) => {
      if (!text) {
        setSearchResults(allItems);
        setDisplayedItems(allItems.slice(0, BATCH_SIZE));
        setLoadedCount(BATCH_SIZE);
        isLoadingMoreRef.current = false;
        return;
      }
      const filtered = allItems.filter(item =>
        item.label.toLowerCase().includes(text.toLowerCase()),
      );
      setSearchResults(filtered);
      setDisplayedItems(filtered.slice(0, BATCH_SIZE));
      setLoadedCount(BATCH_SIZE);
      isLoadingMoreRef.current = false;
    };

    const stylesMemo = useMemo(
      () => ({
        pickerStyle: {
          backgroundColor: disabled ? '#F3F4F6' : theme.bgSurface,
          borderColor: error ? '#EF4444' : disabled ? '#D1D5DB' : theme.border,
          borderWidth: 1.5,
          borderRadius: 12,
          minHeight: 54,
          opacity: disabled ? 0.7 : 1,
        },
        pickerText: {
          color: disabled ? '#9CA3AF' : theme.text,
          fontSize: 16,
          fontWeight: '500' as const,
        },
        pickerContainer: {
          backgroundColor: theme.bgSurface,
          borderColor: error ? '#EF4444' : theme.border,
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
      }),
      [theme, listHeight, error, disabled],
    );

    return (
      <View style={style}>
        {label && (
          <AppText weight="semibold" size="md" className="mb-1 text-gray-700">
            {required && <AppText className="text-red-500">*</AppText>} {label}
          </AppText>
        )}
        <View>
          <DropDownPicker
            multiple
            open={open}
            value={values}
            items={displayedItems}
            setOpen={handleOpenChange}
            setValue={setValues}
            onChangeValue={vals => handleSelect(vals as string[])}
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
            dropDownContainerStyle={[
              stylesMemo.pickerContainer,
              dropDownContainerStyle,
            ]}
            zIndex={zIndex}
            zIndexInverse={zIndexInverse}
            listMode="SCROLLVIEW"
            scrollViewProps={{
              showsVerticalScrollIndicator: needIndicator,
              onScroll: handleScroll,
              scrollEventThrottle: 16,
            }}
            showArrowIcon
            ArrowDownIconComponent={() =>
              allowClear && values.length > 0 ? (
                <Pressable hitSlop={8} onPress={() => handleSelect([])}>
                  <AppIcon
                    type="feather"
                    name="x"
                    size={18}
                    color={theme.text}
                  />
                </Pressable>
              ) : (
                <AppIcon
                  type="feather"
                  name="chevron-down"
                  size={20}
                  color={theme.text}
                />
              )
            }
            ArrowUpIconComponent={() =>
              allowClear && values.length > 0 ? (
                <Pressable hitSlop={8} onPress={() => handleSelect([])}>
                  <AppIcon
                    type="feather"
                    name="x"
                    size={18}
                    color={theme.text}
                  />
                </Pressable>
              ) : (
                <AppIcon
                  type="feather"
                  name="chevron-up"
                  size={20}
                  color={theme.text}
                />
              )
            }
            listItemLabelStyle={{
              color: theme.text,
              borderBottomWidth: 0.3,
              borderBottomColor: theme.text + '40',
            }}
            selectedItemLabelStyle={{
              color: theme.primary,
              fontWeight: 'bold',
            }}
            disabledItemLabelStyle={{color: theme.text + '40'}}
          />
        </View>
        {error && (
          <AppText className="mt-1 text-xs text-red-500">{error}</AppText>
        )}
      </View>
    );
  },
);
