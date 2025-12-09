import {useCallback, useMemo, useState, useDeferredValue, memo} from 'react';
import {View, TouchableOpacity, FlatList} from 'react-native';
import ActionSheet, {
  SheetManager,
  useSheetPayload,
} from 'react-native-actions-sheet';
import AppText from '../../../../../components/customs/AppText';
import {useThemeStore} from '../../../../../stores/useThemeStore';
import FilterSheet from '../../../../../components/FilterSheet';
import AppInput from '../../../../../components/customs/AppInput';

export interface ClaimFilterPayload {
  productLine?: string;
  claimCode?: string;
  schemeCategory?: string;
  sortBy?: 'high-to-low' | 'low-to-high' | null;

  // Dynamic data sources
  allProductLines?: string[];
  allClaimCodes?: string[];
  allSchemeCategories?: string[];

  // Callbacks
  onApply?: (res: ClaimFilterResult) => void;
  onReset?: () => void;
}

export interface ClaimFilterResult {
  productLine: string;
  claimCode: string;
  schemeCategory: string;
  sortBy: 'high-to-low' | 'low-to-high' | null;
}

type Group = 'productLine' | 'claimCode' | 'schemeCategory' | 'sortBy';

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
        className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${selected ? 'border-blue-600' : 'border-slate-400 dark:border-slate-500'}`}>
        {selected && <View className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
      </View>
      <AppText
        size="sm"
        className={`flex-1 ${selected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'}`}>
        {label}
      </AppText>
    </TouchableOpacity>
  ),
);

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
      activeOpacity={0.6}
      className={`px-3 py-3 rounded-md mb-1 flex-row items-center ${active ? 'bg-blue-50 dark:bg-blue-900/40' : 'bg-transparent'}`}>
      <View className="flex-1">
        <AppText
          size="sm"
          weight={active ? 'semibold' : 'regular'}
          className={`${active ? 'text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-300'}`}>
          {label}
        </AppText>
      </View>
      {hasValue && <View className="w-2 h-2 rounded-full bg-blue-500" />}
    </TouchableOpacity>
  ),
);

export default function ClaimFilterSheet(){
  const payload = (useSheetPayload?.() || {}) as ClaimFilterPayload;

  const [productLine, setProductLine] = useState(payload.productLine ?? '');
  const [claimCode, setClaimCode] = useState(payload.claimCode ?? '');
  const [schemeCategory, setSchemeCategory] = useState(
    payload.schemeCategory ?? '',
  );
  const [sortBy, setSortBy] = useState<'high-to-low' | 'low-to-high' | null>(
    payload.sortBy ?? null,
  );
  const [group, setGroup] = useState<Group>('productLine');

  const [productSearch, setProductSearch] = useState('');
  const [claimCodeSearch, setClaimCodeSearch] = useState('');
  const [schemeCategorySearch, setSchemeCategorySearch] = useState('');

  const dProductSearch = useDeferredValue(productSearch);
  const dClaimCodeSearch = useDeferredValue(claimCodeSearch);
  const dSchemeCategorySearch = useDeferredValue(schemeCategorySearch);

  const AppTheme = useThemeStore(state => state.AppTheme);
  const isDark = AppTheme === 'dark';

  const productLines = useMemo(
    () => payload.allProductLines || [],
    [payload.allProductLines],
  );
  const claimCodes = useMemo(
    () => payload.allClaimCodes || [],
    [payload.allClaimCodes],
  );
  const schemeCategories = useMemo(
    () => payload.allSchemeCategories || [],
    [payload.allSchemeCategories],
  );

  const sortOptions = useMemo(
    () => [
      {value: 'high-to-low', label: 'High to Low (Amount)'},
      {value: 'low-to-high', label: 'Low to High (Amount)'},
    ],
    [],
  );

  // Filter search results
  const filteredProducts = useMemo(() => {
    const q = dProductSearch.trim().toLowerCase();
    if (!q) return productLines;
    return productLines.filter(p => p.toLowerCase().includes(q));
  }, [dProductSearch, productLines]);

  const filteredClaimCodes = useMemo(() => {
    const q = dClaimCodeSearch.trim().toLowerCase();
    if (!q) return claimCodes;
    return claimCodes.filter(c => c.toLowerCase().includes(q));
  }, [dClaimCodeSearch, claimCodes]);

  const filteredSchemeCategories = useMemo(() => {
    const q = dSchemeCategorySearch.trim().toLowerCase();
    if (!q) return schemeCategories;
    return schemeCategories.filter(s => s.toLowerCase().includes(q));
  }, [dSchemeCategorySearch, schemeCategories]);

  // Count active filters
  const activeCount = useMemo(() => {
    let c = 0;
    if (productLine) c++;
    if (claimCode) c++;
    if (schemeCategory) c++;
    if (sortBy) c++;
    return c;
  }, [productLine, claimCode, schemeCategory, sortBy]);

  // Define filter groups
  const groups = useMemo(
    () => [
      {
        key: 'productLine' as Group,
        label: 'Product Line',
        hasValue: !!productLine,
      },
      {
        key: 'claimCode' as Group,
        label: 'Claim Code',
        hasValue: !!claimCode,
      },
      {
        key: 'schemeCategory' as Group,
        label: 'Scheme Category',
        hasValue: !!schemeCategory,
      },
      {
        key: 'sortBy' as Group,
        label: 'Sort By',
        hasValue: !!sortBy,
      },
    ],
    [productLine, claimCode, schemeCategory, sortBy],
  );

  // Render radio buttons
  const renderRadio = useCallback(
    ({item}: {item: string | {value: string; label: string}}) => {
      const label = typeof item === 'string' ? item : item.label;
      const value = typeof item === 'string' ? item : item.value;

      let selected = false;
      if (group === 'productLine') {
        selected = productLine === value;
      } else if (group === 'claimCode') {
        selected = claimCode === value;
      } else if (group === 'schemeCategory') {
        selected = schemeCategory === value;
      } else if (group === 'sortBy') {
        selected = sortBy === value;
      }

      return (
        <RadioRow
          label={label || '—'}
          selected={selected}
          onPress={() => {
            if (group === 'productLine') setProductLine(value);
            else if (group === 'claimCode') setClaimCode(value);
            else if (group === 'schemeCategory') setSchemeCategory(value);
            else if (group === 'sortBy')
              setSortBy(value as 'high-to-low' | 'low-to-high');
          }}
        />
      );
    },
    [group, productLine, claimCode, schemeCategory, sortBy],
  );

  // Right panel content based on selected group
  const rightPane = useMemo(() => {
    if (group === 'productLine') {
      return (
        <View className="flex-1">
          <AppInput
            value={productSearch}
            setValue={setProductSearch}
            placeholder="Search Product Line"
            leftIcon="search"
          />
          <FlatList
            data={filteredProducts}
            keyExtractor={i => i}
            renderItem={renderRadio}
            keyboardShouldPersistTaps="handled"
            style={{flex: 1}}
            initialNumToRender={20}
            maxToRenderPerBatch={25}
            windowSize={10}
            removeClippedSubviews
            contentContainerStyle={{paddingBottom: 40}}
          />
        </View>
      );
    }

    if (group === 'claimCode') {
      return (
        <View className="flex-1">
          <AppInput
            value={claimCodeSearch}
            setValue={setClaimCodeSearch}
            placeholder="Search Claim Code"
            leftIcon="search"
          />
          <FlatList
            data={filteredClaimCodes}
            keyExtractor={i => i}
            renderItem={renderRadio}
            keyboardShouldPersistTaps="handled"
            style={{flex: 1}}
            initialNumToRender={20}
            maxToRenderPerBatch={25}
            windowSize={10}
            removeClippedSubviews
            contentContainerStyle={{paddingBottom: 40}}
          />
        </View>
      );
    }

    if (group === 'schemeCategory') {
      return (
        <View className="flex-1">
          <AppInput
            value={schemeCategorySearch}
            setValue={setSchemeCategorySearch}
            placeholder="Search Scheme Category"
            leftIcon="search"
          />
          <FlatList
            data={filteredSchemeCategories}
            keyExtractor={i => i}
            renderItem={renderRadio}
            keyboardShouldPersistTaps="handled"
            style={{flex: 1}}
            initialNumToRender={20}
            maxToRenderPerBatch={25}
            windowSize={10}
            removeClippedSubviews
            contentContainerStyle={{paddingBottom: 40}}
          />
        </View>
      );
    }

    if (group === 'sortBy') {
      return (
        <FlatList
          data={sortOptions}
          keyExtractor={i => i.value}
          renderItem={renderRadio}
          style={{flex: 1}}
          initialNumToRender={10}
          contentContainerStyle={{paddingBottom: 40}}
        />
      );
    }

    return <View className="flex-1" />;
  }, [
    group,
    productSearch,
    claimCodeSearch,
    schemeCategorySearch,
    filteredProducts,
    filteredClaimCodes,
    filteredSchemeCategories,
    sortOptions,
    renderRadio,
  ]);

  const handleReset = () => {
    setProductLine('');
    setClaimCode('');
    setSchemeCategory('');
    setSortBy(null);
    setProductSearch('');
    setClaimCodeSearch('');
    setSchemeCategorySearch('');
    payload.onReset?.();
  };

  const handleApply = () => {
    payload.onApply?.({
      productLine,
      claimCode,
      schemeCategory,
      sortBy,
    });
    hideClaimFilterSheet();
  };

  return (
    <View>
      <ActionSheet
        id={'ClaimFilterSheetAPAC'}
        useBottomSafeAreaPadding
        keyboardHandlerEnabled={false}
        gestureEnabled={false}
        containerStyle={{
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
        }}>
        {/* Indicator */}
        <View className="flex-row justify-center">
          <View className="w-[50px] h-[4px] rounded-full bg-gray-300 dark:bg-slate-600 my-3" />
        </View>
        <FilterSheet
          title="Filters"
          activeCount={activeCount}
          onApply={handleApply}
          onClearAll={activeCount > 0 ? handleReset : undefined}
          onClose={hideClaimFilterSheet}
          onRightPanelClear={() => {
            if (group === 'productLine') {
              setProductLine('');
              setProductSearch('');
            } else if (group === 'claimCode') {
              setClaimCode('');
              setClaimCodeSearch('');
            } else if (group === 'schemeCategory') {
              setSchemeCategory('');
              setSchemeCategorySearch('');
            } else if (group === 'sortBy') {
              setSortBy(null);
            }
          }}
          leftContent={
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
          }
          rightContent={rightPane}
        />
      </ActionSheet>
    </View>
  );
};

export const showClaimFilterSheet = (props: ClaimFilterPayload = {}) => SheetManager.show('ClaimFilterSheetAPAC', {payload: props});
export const hideClaimFilterSheet = () => SheetManager.hide('ClaimFilterSheetAPAC');
