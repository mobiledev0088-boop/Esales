import React, {useCallback, useMemo, useState, useDeferredValue} from 'react';
import {View, TouchableOpacity, FlatList, TextInput} from 'react-native';
import ActionSheet, {
  SheetManager,
  useSheetPayload,
} from 'react-native-actions-sheet';
import AppText from '../../../../components/customs/AppText';
import AppIcon from '../../../../components/customs/AppIcon';
import {useThemeStore} from '../../../../stores/useThemeStore';
import FilterSheet from '../../../../components/FilterSheet';
import AppInput from '../../../../components/customs/AppInput';

export interface ClaimFilterPayload {
  partnerType?: string;
  schemeCategory?: string;
  productLine?: string;

  // dynamic sources
  allSchemeCategories?: string[];
  allProductLinesName?: string[];
  allPartnerTypeList?: string[];
  // callbacks
  onApply?: (res: ClaimFilterResult) => void;
  onReset?: () => void;
}

export interface ClaimFilterResult {
  partnerType: string;
  schemeCategory: string;
  productLine: string;
}

type Group = 'partnerType' | 'schemeCategory' | 'productLine';

const RadioRow = React.memo(
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

const GroupItem = React.memo(
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

const ClaimFilterSheet: React.FC = () => {
  const payload = (useSheetPayload?.() || {}) as ClaimFilterPayload;

  const [partnerType, setPartnerType] = useState(
    payload.partnerType ?? 'Channel',
  );
  const [schemeCategory, setSchemeCategory] = useState(
    payload.schemeCategory ?? '',
  );
  const [productLine, setProductLine] = useState(payload.productLine ?? ''); 
  const [group, setGroup] = useState<Group>('partnerType');
  const [schemeSearch, setSchemeSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const dSchemeSearch = useDeferredValue(schemeSearch);
  const dProductSearch = useDeferredValue(productSearch);

  const AppTheme = useThemeStore(state => state.AppTheme);
  const isDark = AppTheme === 'dark';

  const schemeCategories = useMemo(
    () => payload.allSchemeCategories || [],
    [payload.allSchemeCategories],
  );
  const productLines = useMemo(
    () => payload.allProductLinesName || [],
    [payload.allProductLinesName],
  );
  const partnerTypes = useMemo(
    () => payload.allPartnerTypeList || ['Channel'],
    [payload.allPartnerTypeList],
  );

  const filteredSchemes = useMemo(() => {
    const q = dSchemeSearch.trim().toLowerCase();
    if (!q) return schemeCategories;
    return schemeCategories.filter(s => s.toLowerCase().includes(q));
  }, [dSchemeSearch, schemeCategories]);

  const filteredProducts = useMemo(() => {
    const q = dProductSearch.trim().toLowerCase();
    if (!q) return productLines;
    return productLines.filter(p => p.toLowerCase().includes(q));
  }, [dProductSearch, productLines]);

  const activeCount = useMemo(() => {
    let c = 0;
    if (partnerType && partnerType !== 'Channel') c++;
    if (schemeCategory) c++;
    if (productLine) c++;
    // if (sortField) c++;
    return c;
  }, [partnerType, schemeCategory, productLine]);

  const groups = useMemo(
    () => [
      {
        key: 'partnerType',
        label: 'Partner Type',
        hasValue: partnerType && partnerType !== 'Channel',
      },
      {
        key: 'schemeCategory',
        label: 'Scheme Category',
        hasValue: !!schemeCategory,
      },
      {key: 'productLine', label: 'Product Line', hasValue: !!productLine},
      // {key: 'sort', label: 'Sort By', hasValue: !!sortField}, // (sorting disabled)
    ],
    [partnerType, schemeCategory, productLine],
  );

  const renderRadio = useCallback(
    ({item}: {item: string}) => (
      <RadioRow
        label={item || '—'}
        selected={
          group === 'partnerType'
            ? partnerType === item
            : group === 'schemeCategory'
              ? schemeCategory === item
              : productLine === item
        }
        onPress={() => {
          if (group === 'partnerType') setPartnerType(item);
          else if (group === 'schemeCategory') setSchemeCategory(item);
          else setProductLine(item);
        }}
      />
    ),
    [group, partnerType, schemeCategory, productLine],
  );

  const rightPane = useMemo(() => {
    if (group === 'schemeCategory') {
      return (
        <View className="flex-1">
          <AppInput
            value={schemeSearch}
            setValue={setSchemeSearch}
            placeholder="Search Scheme Category"
            leftIcon='search'
          />
          <FlatList
            data={filteredSchemes}
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
    if (group === 'productLine') {
      return (
        <View className="flex-1">
          <AppInput
            value={productSearch}
            setValue={setProductSearch}
            placeholder="Search Product Line"
            leftIcon='search'
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
    return (
      <FlatList
        data={partnerTypes}
        keyExtractor={i => i}
        renderItem={renderRadio}
        style={{flex: 1}}
        initialNumToRender={15}
        windowSize={10}
        removeClippedSubviews
        contentContainerStyle={{paddingBottom: 40}}
      />
    );
  }, [group, schemeSearch, productSearch, filteredSchemes, filteredProducts, partnerTypes, renderRadio]);

  const handleReset = () => {
    setPartnerType('Channel');
    setSchemeCategory('');
    setProductLine('');
    // setSortField(null);
    // setSortDirection('asc');
    payload.onReset?.();
  };

  const handleApply = () => {
    payload.onApply?.({
      partnerType,
      schemeCategory,
      productLine,
      // sortField,
      // sortDirection,
    });
    SheetManager.hide('ClaimFilterSheet');
  };

  return (
    <View>
      <ActionSheet
        id={'ClaimFilterSheet'}
        useBottomSafeAreaPadding
        keyboardHandlerEnabled={false}
        gestureEnabled={false}
        containerStyle={{
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
        }}>
        {/* indicator */}
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
            if (group === 'partnerType') setPartnerType('Channel');
            else if (group === 'schemeCategory') setSchemeCategory('');
            else if (group === 'productLine') setProductLine('');
          }}
          leftContent={
            <View>
              {groups.map(g => (
                <GroupItem
                  key={g.key}
                  label={g.label}
                  active={group === (g.key as any)}
                  hasValue={g.hasValue as any}
                  onPress={() => setGroup(g.key as any)}
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

export default ClaimFilterSheet;

export const showClaimFilterSheet = (props: ClaimFilterPayload = {}) =>
  SheetManager.show('ClaimFilterSheet', {payload: props});
export const hideClaimFilterSheet = () => SheetManager.hide('ClaimFilterSheet');
