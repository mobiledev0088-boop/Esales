import React, { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, Keyboard, Pressable, TextInput, View } from 'react-native';
import AppText from './AppText';
import AppIcon from './AppIcon';
import { useThemeStore } from '../../stores/useThemeStore';
import { AppColors } from '../../config/theme';
import { twMerge } from 'tailwind-merge';

export interface SearchableDropdownItem<T = any> {
  label: string;
  value: string;
  meta?: T; // arbitrary extra payload
}

interface SearchableDropdownProps<T = any> {
  data: SearchableDropdownItem<T>[];
  placeholder?: string;
  value?: string | null; // controlled selected value
  defaultValue?: string | null; // uncontrolled initial
  onSelect?: (item: SearchableDropdownItem<T>) => void;
  onClear?: () => void;
  inputClassName?: string;
  containerClassName?: string;
  listClassName?: string;
  itemClassName?: string;
  emptyText?: string;
  disabled?: boolean;
  debounceMs?: number;
  /** Provide custom filter (default case-insensitive substring on label) */
  filterFn?: (item: SearchableDropdownItem<T>, query: string) => boolean;
  /** Called whenever the raw search text changes */
  onSearchChange?: (text: string) => void;
  /** Maximum number of items to render (virtualization hint) */
  maxItemsToRender?: number;
}

// Simple debounce helper (hook-less to keep footprint small in RN env)
function useDebouncedCallback(cb: (text: string) => void, delay: number) {
  const timer = useRef<NodeJS.Timeout | null>(null);
  const fn = useCallback((text: string) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => cb(text), delay);
  }, [cb, delay]);
  return fn;
}

const SearchableDropdown = <T,>({
  data,
  placeholder = 'Search…',
  value: controlledValue,
  defaultValue = null,
  onSelect,
  onClear,
  inputClassName,
  containerClassName,
  listClassName,
  itemClassName,
  emptyText = 'No results',
  disabled = false,
  debounceMs = 120,
  filterFn,
  onSearchChange,
  maxItemsToRender = 250,
}: SearchableDropdownProps<T>) => {
  const { AppTheme } = useThemeStore();
  const theme = AppColors[AppTheme];

  // Internal state for uncontrolled pattern
  const [internalValue, setInternalValue] = useState<string | null>(defaultValue);
  const selectedValue = controlledValue !== undefined ? controlledValue : internalValue;

  const [query, setQuery] = useState('');
  const [hasTyped, setHasTyped] = useState(false); // controls showing list only after typing

  const debouncedSearchCallback = useDebouncedCallback((text) => {
    onSearchChange?.(text);
  }, debounceMs);

  const handleChangeText = (text: string) => {
    if (!hasTyped) setHasTyped(true);
    setQuery(text);
    debouncedSearchCallback(text);
  };

  const effectiveFilter = filterFn || ((item: SearchableDropdownItem<T>, q: string) =>
    item.label.toLowerCase().includes(q.toLowerCase())
  );

  // Precompute lower-cased labels & map for O(1) selection lookups (improves large list performance)
  const { normalizedData, valueMap } = useMemo(() => {
    const valueMap = new Map<string, SearchableDropdownItem<T>>();
    const normalizedData = data.map(d => {
      valueMap.set(d.value, d);
      return { ...d, _norm: d.label.toLowerCase() } as SearchableDropdownItem<T> & { _norm: string };
    });
    return { normalizedData, valueMap };
  }, [data]);

  const filteredData = useMemo(() => {
    if (!query) return normalizedData.slice(0, maxItemsToRender);
    const q = query.toLowerCase();
    const res: SearchableDropdownItem<T>[] = [];
    for (let i = 0; i < normalizedData.length && res.length < maxItemsToRender; i++) {
      const it: any = normalizedData[i];
      // Use pre-normalized label if default filter, else delegate to custom filter
      if (filterFn ? effectiveFilter(it, query) : (it._norm as string).includes(q)) {
        res.push(it);
      }
    }
    return res;
  }, [normalizedData, query, effectiveFilter, filterFn, maxItemsToRender]);

  const handleSelectItem = (item: SearchableDropdownItem<T>) => {
    // O(1) update & lock input until cleared
    if (controlledValue === undefined) setInternalValue(item.value);
    // Ensure we do NOT leak internal augmentation (_norm)
    const clean = valueMap.get(item.value) || { label: item.label, value: item.value } as SearchableDropdownItem<T>;
    Keyboard.dismiss();
    onSelect?.(clean);
    setQuery(clean.label);
    setHasTyped(false);
  };

  const handleClear = () => {
    if (disabled) return;
    if (controlledValue === undefined) setInternalValue(null);
    setQuery('');
    setHasTyped(false);
    onClear?.();
  };

  const selectedLabel = useMemo(() => {
    if (!selectedValue) return '';
    return valueMap.get(selectedValue)?.label || '';
  }, [selectedValue, valueMap]);

  // Sync query display with external changes to selected value (when not actively typing)
  React.useEffect(() => {
    if (!hasTyped) {
      if (selectedValue) {
        const lbl = data.find(d => d.value === selectedValue)?.label;
        if (lbl && lbl !== query) setQuery(lbl);
      } else if (query !== '') {
        setQuery('');
      }
    }
  }, [selectedValue, data, hasTyped]);

  const showList = hasTyped && query.length > 0; // Only show drop-down while user is searching

  const renderItem = ({ item }: { item: SearchableDropdownItem<T> }) => {
    const active = item.value === selectedValue;
    return (
      <Pressable
        onPress={() => handleSelectItem(item)}
        disabled={disabled}
        className={twMerge('px-3 py-2 flex-row items-center', 'border-b border-[#ccc]', itemClassName)}
        style={{ backgroundColor: active ? theme.primary + '15' : 'transparent' }}
      >
        <AppText weight={active ? 'bold' : 'medium'} className="text-gray-800 dark:text-gray-100 flex-1">
          {item.label}
        </AppText>
        {active && (
          <AppIcon type="feather" name="check" size={18} color={theme.primary} />
        )}
      </Pressable>
    );
  };

  return (
    <View className={twMerge('w-full', containerClassName)}>
      <View
        className={twMerge(
          // Reduced roundness (md) and remove bottom radius while list is open to visually attach
          'flex-row items-center border px-3',
          showList ? 'rounded-t-md rounded-b-none' : 'rounded-md',
          disabled ? 'opacity-60' : 'bg-white dark:bg-gray-800',
          inputClassName
        )}
        style={{ borderColor: theme.border, minHeight: 48 }}
      >
        <AppIcon type="feather" name="search" size={18} color={theme.text} />
        <TextInput
          // Disable editing when a value is selected (user must clear to re-search)
          editable={!disabled}
          placeholder={placeholder}
          placeholderTextColor={theme.text + '66'}
          value={query}
          onChangeText={handleChangeText}
          className="flex-1 ml-2 text-gray-900 dark:text-gray-100 font-manropeMedium"
          style={{ paddingVertical: 10 }}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {!!query && (
          <Pressable onPress={handleClear} hitSlop={8} className="ml-2">
            <AppIcon type="feather" name="x-circle" size={20} color={theme.text + '99'} />
          </Pressable>
        )}
      </View>

      {showList && (
        <View
          className={twMerge(
            // Attach to input: no margin-top, remove top radius, keep bottom radius only
            'rounded-b-md border border-t-0 overflow-hidden',
            listClassName
          )}
          style={{ borderColor: theme.border, backgroundColor: theme.bgSurface, maxHeight: 260 }}
        >
          {filteredData.length === 0 ? (
            <View className="py-6 items-center justify-center">
              <AppText className="text-gray-400" size="sm">{emptyText}</AppText>
            </View>
          ) : (
            <FlatList
              keyboardShouldPersistTaps="handled"
              data={filteredData}
              keyExtractor={(item) => item.value}
              renderItem={renderItem}
              style={{ width: '100%' }}
              nestedScrollEnabled
            />
          )}
        </View>
      )}
    </View>
  );
};

export default SearchableDropdown;

/*
USAGE EXAMPLE:

<SearchableDropdown
  data={options}
  placeholder="Search product"
  value={selected}
  onSelect={(item) => setSelected(item.value)}
  onClear={() => setSelected(null)}
/>;

Features:
- List appears only while user is typing (query length > 0) and hides on selection.
- Debounced search callback via onSearchChange.
- Supports controlled (pass value) or uncontrolled (defaultValue) usage.
- Clear button resets selection & search.
*/
