import React, {useCallback, useMemo, useState} from 'react';
import {View, TouchableOpacity, FlatList, TextInput} from 'react-native';
import ActionSheet, {SheetManager, useSheetPayload} from 'react-native-actions-sheet';
import AppText from '../../../../components/customs/AppText';
import AppButton from '../../../../components/customs/AppButton';
import AppIcon from '../../../../components/customs/AppIcon';
import {useThemeStore} from '../../../../stores/useThemeStore';
import {screenHeight, screenWidth} from '../../../../utils/constant';
import {useQuery} from '@tanstack/react-query';
import {handleASINApiCall} from '../../../../utils/handleApiCall';
import Skeleton from '../../../../components/skeleton/skeleton';

// Payload contract for the sheet
export interface DemoFilterPayload {
  // pre-selected values (keys below)
  category?: string | null;
  premiumKiosk?: string | null; // yes/no
  rogKiosk?: string | null; // yes/no
  partnerType?: string | null;
  agpName?: string | null;
  // Year Quarter for API call
  yearQtr?: string;
  // data sources (optional override)
  categories?: {label: string; value: string}[];
  partnerTypes?: {label: string; value: string}[];
  agpNames?: {label: string; value: string}[];
  onApply?: (filters: DemoFilterResult) => void;
  onReset?: () => void;
}

export interface DemoFilterResult {
  category: string | null;
  premiumKiosk: string | null;
  rogKiosk: string | null;
  partnerType: string | null;
  agpName: string | null;
}

const DEFAULT_PARTNER_TYPES = [
  {label: 'Retail', value: 'retail'},
  {label: 'Online', value: 'online'},
  {label: 'Distributor', value: 'distributor'},
];

const DEFAULT_AGP_NAMES = [
  {label: 'AGP 1', value: 'agp1'},
  {label: 'AGP 2', value: 'agp2'},
  {label: 'AGP 3', value: 'agp3'},
];

// Numeric list (0..5) for kiosk selection
const KIOSK_NUMBERS = Array.from({length: 6}, (_, i) => ({label: String(i), value: String(i)}));

// Hook to fetch categories from API
const useGetDemoCategories = (yearQtr: string) => {
  const queryPayload = {
    YearQtr: yearQtr,
  };

  return useQuery({
    queryKey: ['demoCategories', yearQtr],
    queryFn: async () => {
      const response = await handleASINApiCall(
        '/DemoForm/GetPartnerDemoCategoryList_Reseller',
        queryPayload,
      );
      const result = response?.demoFormData;
      if (!result?.Status) {
        throw new Error('Failed to fetch categories');
      }
      const categories = result.Datainfo?.Table || [];
      return categories.map((item: {Demo_Category: string}) => ({
        label: item.Demo_Category,
        value: item.Demo_Category,
      }));
    },
    enabled: !!yearQtr,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};

// Radio row (indicator on left)
const RadioRow = React.memo(({label, selected, onPress}: {label: string; selected: boolean; onPress: () => void}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    className="flex-row items-center py-3 px-3 border-b border-slate-100 dark:border-slate-600">
    <View className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${selected ? 'border-blue-600' : 'border-slate-400 dark:border-slate-500' }`}>
      {selected && <View className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
    </View>
    <AppText size="sm" className={`flex-1 ${selected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'}`}>{label}</AppText>
  </TouchableOpacity>
));

// Left group item
const GroupItem = ({label, active, hasValue, onPress}: {label: string; active: boolean; hasValue: boolean; onPress: () => void}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    className={`px-3 py-3 rounded-md mb-1 flex-row items-center ${active ? 'bg-blue-50 dark:bg-blue-900/40' : 'bg-transparent'}`}> 
    <View className="flex-1">
      <AppText size="sm" weight={active ? 'semibold' : 'regular'} className={`${active ? 'text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-300'}`}>{label}</AppText>
    </View>
    {hasValue && (
      <View className="w-2 h-2 rounded-full bg-blue-500" />
    )}
  </TouchableOpacity>
);

const DemoFilterSheet: React.FC = () => {
  const payload = (useSheetPayload?.() || {}) as DemoFilterPayload;

  // Fetch categories from API
  const {data: categoriesData, isLoading: isCategoriesLoading} = useGetDemoCategories(payload.yearQtr || '');
  
  const categories = categoriesData || [];
  const partnerTypes = payload.partnerTypes || DEFAULT_PARTNER_TYPES;
  const agpNames = payload.agpNames || DEFAULT_AGP_NAMES;

  const [category, setCategory] = useState<string | null>(payload.category ?? '');
  const [premiumKiosk, setPremiumKiosk] = useState<string | null>(payload.premiumKiosk ?? '');
  const [rogKiosk, setRogKiosk] = useState<string | null>(payload.rogKiosk ?? '');
  const [partnerType, setPartnerType] = useState<string | null>(payload.partnerType ?? '');
  // const [agpName, setAgpName] = useState<string | null>(payload.agpName ?? '');
  const [group, setGroup] = useState<string>('category');
  const [agpSearch, setAgpSearch] = useState('');

  const AppTheme = useThemeStore(state => state.AppTheme);
  const isDark = AppTheme === 'dark';

  const activeCount = useMemo(() => [category, premiumKiosk, rogKiosk, partnerType].filter(v => v && v !== '').length, [category, premiumKiosk, rogKiosk, partnerType]);

  const groups = useMemo(() => ([
    {key: 'category', label: 'Category', hasValue: !!category},
    {key: 'partnerType', label: 'Partner Type', hasValue: !!partnerType},
    {key: 'premiumKiosk', label: 'Premium Kiosk', hasValue: !!premiumKiosk},
    {key: 'rogKiosk', label: 'ROG Kiosk', hasValue: !!rogKiosk},
  ]), [category, partnerType, premiumKiosk, rogKiosk]);

  const filteredAgp = useMemo(() => {
    const s = agpSearch.trim().toLowerCase();
    if (!s) return agpNames;
    return agpNames.filter(a => a.label.toLowerCase().includes(s));
  }, [agpNames, agpSearch]);

  const renderRadio = useCallback(({item}: {item: {label: string; value: string}}) => {
    const isSelected = (group === 'category' ? (category ?? '') : group === 'partnerType' ? (partnerType ?? '') : '') === item.value;
    
    return (
      <RadioRow
        label={item.label}
        selected={isSelected}
        onPress={() => {
          if (group === 'category') setCategory(item.value);
          else if (group === 'partnerType') setPartnerType(item.value);
        }}
      />
    );
  }, [group, category, partnerType]);

  const rightPane = () => {
    if (group === 'premiumKiosk') {
      return (
        <View className="flex-1">
          <FlatList
            data={[...KIOSK_NUMBERS]}
            keyExtractor={i => i.value || i.label}
            renderItem={({item}) => {
              const isSelected = (premiumKiosk ?? '') === item.value;
              return (
                <RadioRow
                  label={item.label}
                  selected={isSelected}
                  onPress={() => setPremiumKiosk(item.value)}
                />
              );
            }}
            style={{flex:1}}
            contentContainerStyle={{paddingBottom: 40}}
          />
          {premiumKiosk && (
            <TouchableOpacity
              onPress={() => setPremiumKiosk('')}
              className="py-3 px-3 border-t border-slate-200 dark:border-slate-600 flex-row items-center justify-center">
              <AppText size="sm" className="text-blue-600 dark:text-blue-400 underline">Clear Selection</AppText>
            </TouchableOpacity>
          )}
        </View>
      );
    }
    if (group === 'rogKiosk') {
      return (
        <View className="flex-1">
          <FlatList
            data={[...KIOSK_NUMBERS]}
            keyExtractor={i => i.value || i.label}
            renderItem={({item}) => {
              const isSelected = (rogKiosk ?? '') === item.value;
              return (
                <RadioRow
                  label={item.label}
                  selected={isSelected}
                  onPress={() => setRogKiosk(item.value)}
                />
              );
            }}
            style={{flex:1}}
            contentContainerStyle={{paddingBottom: 40}}
          />
          {rogKiosk && (
            <TouchableOpacity
              onPress={() => setRogKiosk('')}
              className="py-3 px-3 border-t border-slate-200 dark:border-slate-600 flex-row items-center justify-center">
              <AppText size="sm" className="text-blue-600 dark:text-blue-400 underline">Clear Selection</AppText>
            </TouchableOpacity>
          )}
        </View>
      );
    }
    if (group === 'agpName') {
      return (
        <View className="flex-1">
          <View className="mb-3 flex-row items-center px-3 py-2 rounded-md bg-slate-100 dark:bg-slate-700">
            <AppIcon name="search" type="feather" size={16} color={isDark ? '#cbd5e1' : '#475569'} />
            <TextInput
              value={agpSearch}
              onChangeText={setAgpSearch}
              placeholder="Search AGP Name"
              placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
              className="flex-1 ml-2 text-slate-700 dark:text-slate-200 p-0"
            />
            {agpSearch.length > 0 && (
              <TouchableOpacity onPress={() => setAgpSearch('')} hitSlop={8}>
                <AppIcon name="x" type="feather" size={16} color={isDark ? '#94a3b8' : '#64748b'} />
              </TouchableOpacity>
            )}
          </View>
          <FlatList
            data={filteredAgp}
            keyExtractor={i => i.value || i.label}
            renderItem={renderRadio}
            keyboardShouldPersistTaps="handled"
            style={{flex:1}}
            contentContainerStyle={{paddingBottom: 40}}
            initialNumToRender={15}
            windowSize={10}
            maxToRenderPerBatch={20}
            removeClippedSubviews
          />
        </View>
      );
    }
    // category or partnerType
    if (group === 'category' && isCategoriesLoading) {
      return (
        <View className="gap-2">
          {Array.from({length: 5}).map((_, idx) => (
            <Skeleton key={idx} width={screenWidth - 80} height={40} />
          ))}
        </View>
      );
    }
    const list = group === 'category' ? categoriesData : partnerTypes;
    const hasSelection = group === 'category' ? !!category : !!partnerType;
    return (
      <View className="flex-1">
        <FlatList
          data={list}
          keyExtractor={i => i.value || i.label}
          renderItem={renderRadio}
          style={{flex:1}}
          contentContainerStyle={{paddingBottom: 40}}
        />
        {hasSelection && (
          <TouchableOpacity
            onPress={() => {
              if (group === 'category') setCategory('');
              else if (group === 'partnerType') setPartnerType('');
            }}
            className="py-3 px-3 border-t border-slate-200 dark:border-slate-600 flex-row items-center justify-center">
            <AppText size="sm" className="text-blue-600 dark:text-blue-400 underline">Clear Selection</AppText>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const handleReset = () => {
    setCategory('');
    setPremiumKiosk('');
    setRogKiosk('');
    setPartnerType('');
    // setAgpName('');
    payload.onReset?.();
  };

  const handleApply = () => {
    const result: DemoFilterResult = {
      category: category || null,
      premiumKiosk: premiumKiosk || null,
      rogKiosk: rogKiosk || null,
      partnerType: partnerType || null,
      agpName: null,
    };
    payload.onApply?.(result);
    SheetManager.hide('DemoFilterSheet');
  };

  return (
    <View>
      <ActionSheet
        id="DemoFilterSheet"
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
        }}
        >
        <View className='px-3 pb-4 pt-2'>
          {/* Header */}
          <View className="flex-row items-center justify-between mt-2 mb-4">
            <AppText size="lg" weight="bold">
              Filters {activeCount > 0 && `(${activeCount})`}
            </AppText>
              <TouchableOpacity onPress={handleReset} hitSlop={8} disabled={activeCount === 0} className={activeCount === 0 ? `opacity-50` : ``}>
                <AppText size="xs" weight="medium" className="text-blue-600 dark:text-blue-400">
                  Clear All
                </AppText>
              </TouchableOpacity>
          </View>
          <View className="flex-row" style={{height: screenHeight * 0.7}}>
            {/* Left Group List (30%) */}
            <View style={{flexBasis: '30%', maxWidth: '30%',paddingRight:4}} >
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
            {/* Divider */}
            <View className="w-px bg-slate-200 dark:bg-slate-600 mx-2" />
            {/* Right Content (80%) */}
            <View className="flex-1" style={{flexBasis: '80%', maxWidth: '80%'}}>
              {rightPane()}
            </View>
          </View>
          {/* Actions */}
          <View className="flex-row gap-3 pt-4 border-t border-slate-200 dark:border-slate-600 mt-4 items-center">
            <View className="flex-1 flex-row gap-3">
              <AppButton
                title="Close"
                onPress={() => SheetManager.hide('DemoFilterSheet')}
                color="black"
                className="bg-slate-200 dark:bg-slate-700 flex-1"
              />
              <AppButton
                title="Apply"
                onPress={handleApply}
                className="flex-1"
              />
            </View>
          </View>
        </View>
      </ActionSheet>
    </View>
  );
};

export default DemoFilterSheet;

// Helper functions
export const showDemoFilterSheet = (props: DemoFilterPayload = {}) =>
  SheetManager.show('DemoFilterSheet', {payload: props});
export const hideDemoFilterSheet = () => SheetManager.hide('DemoFilterSheet');