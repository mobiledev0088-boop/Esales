import {memo, useCallback, useMemo, useState} from 'react';
import {View, TouchableOpacity, FlatList} from 'react-native';
import ActionSheet, {SheetManager, useSheetPayload} from 'react-native-actions-sheet';
import AppText from '../../../../../components/customs/AppText';
import AppButton from '../../../../../components/customs/AppButton';
import {useThemeStore} from '../../../../../stores/useThemeStore';
import {screenHeight} from '../../../../../utils/constant';
import AppDatePicker, {DatePickerInput, DatePickerInputProps} from '../../../../../components/customs/AppDatePicker';
import { useGetDropdownData } from '../../../../../hooks/queries/rollingFunnel';
import moment from 'moment';
import { DateRangeCard } from '../../Dashboard/components';

// Payload and result contracts for Rolling Funnel filters
export interface RollingFilterPayload {
  quantity?: string | null;
  funnelType?: string | null;
  stage?: string | null;
  productLine?: string | null;
  cradStartDate?: Date | null;
  cradEndDate?: Date | null;
  bsm?: string | null;
  am?: string | null;
  // data sources (allow caller to provide list options)
  funnelTypes?: {label: string; value: string}[];
  stages?: {label: string; value: string}[];
  productLines?: {label: string; value: string}[];
  bsmList?: {label: string; value: string}[];
  amList?: {label: string; value: string}[];
  onApply?: (filters: RollingFilterResult) => void;
  onReset?: () => void;
}

export interface RollingFilterResult {
  quantity: string | null;
  funnelType: string | null;
  stage: string | null;
  productLine: string | null;
  cradStartDate: Date | null;
  cradEndDate: Date | null;
  bsm: string | null;
  am: string | null;
}

// Simple radio row component
const RadioRow = memo(({label, selected, onPress}: {label: string; selected: boolean; onPress: () => void}) => (
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

export default function RollingFilterSheet() {
  const payload = (useSheetPayload?.() || {}) as RollingFilterPayload;
  const {data,isLoading} = useGetDropdownData();

  const funnelTypes = payload.funnelTypes || [
    {label: 'Rolling Funnel', value: 'Rolling_Funnel'},
    {label: 'SFDC', value: 'SFDC'},
  ];
  const stages = data?.StageList || []
  const productLines = data?.ProductLine || [];
  const bsmList = data?.BSMList || [];
  const amList = data?.AMList || [];

  const [quantity, setQuantity] = useState<string | null>(payload.quantity ?? '');
  const [funnelType, setFunnelType] = useState<string | null>(payload.funnelType ?? '');
  const [stage, setStage] = useState<string | null>(payload.stage ?? '');
  const [productLine, setProductLine] = useState<string | null>(payload.productLine ?? '');
  const [dateRange, setDateRange] = useState({startDate: payload.cradStartDate || undefined,endDate: payload.cradEndDate || undefined,
  });
  const [isVisible, setIsVisible] = useState(false);
  const [bsm, setBsm] = useState<string | null>(payload.bsm ?? '');
  const [am, setAm] = useState<string | null>(payload.am ?? '');
  const [group, setGroup] = useState<string>('quantity');

  const AppTheme = useThemeStore(state => state.AppTheme);
  const isDark = AppTheme === 'dark';

  const activeCount = useMemo(
    () => [quantity, funnelType, stage, productLine, dateRange.startDate, dateRange.endDate, bsm, am]
      .filter(v => (v instanceof Date ? true : !!v && v !== '')).length,
    [quantity, funnelType, stage, productLine, dateRange.startDate, dateRange.endDate, bsm, am]
  );

  const groups = useMemo(() => [
    {key: 'quantity', label: 'Quantity', hasValue: !!quantity},
    {key: 'funnelType', label: 'Funnel Type', hasValue: !!funnelType},
    {key: 'stage', label: 'Stage', hasValue: !!stage},
    {key: 'productLine', label: 'Product Line', hasValue: !!productLine},
    {key: 'cradDate', label: 'CRAD Date', hasValue: !!dateRange.startDate || !!dateRange.endDate},
    {key: 'bsm', label: 'BSM List', hasValue: !!bsm},
    {key: 'am', label: 'AM List', hasValue: !!am},
  ], [quantity, funnelType, stage, productLine, dateRange.startDate, dateRange.endDate, bsm, am]);

  const renderRadio = useCallback(({item}: {item: {label: string; value: string}}) => {
    const selectedValue = group === 'funnelType' ? (funnelType ?? '')
      : group === 'stage' ? (stage ?? '')
      : group === 'productLine' ? (productLine ?? '')
      : group === 'bsm' ? (bsm ?? '')
      : group === 'am' ? (am ?? '')
      : '';
    const isSelected = selectedValue === item.value;
    return (
      <RadioRow
        label={item.label}
        selected={isSelected}
        onPress={() => {
          if (group === 'funnelType') setFunnelType(item.value);
          else if (group === 'stage') setStage(item.value);
          else if (group === 'productLine') setProductLine(item.value);
          else if (group === 'bsm') setBsm(item.value);
          else if (group === 'am') setAm(item.value);
        }}
      />
    );
  }, [group, funnelType, stage, productLine, bsm, am]);

  const clearSelectionCTA = (hasSelection: boolean, onClear: () => void) => (
    hasSelection ? (
      <TouchableOpacity
        onPress={onClear}
        className="py-3 px-3 border-t border-slate-200 dark:border-slate-600 flex-row items-center justify-center">
        <AppText size="sm" className="text-blue-600 dark:text-blue-400 underline">Clear Selection</AppText>
      </TouchableOpacity>
    ) : null
  );

  const rightPane = () => {
    if (group === 'quantity') {
      const qtyOptions = [
        {label: 'Low to High', value: '1'},
        {label: 'High to Low', value: '2'},
      ];
      const hasSelection = !!quantity && quantity !== '';
      return (
        <View className="flex-1">
          <FlatList
            data={qtyOptions}
            keyExtractor={i => i.value}
            renderItem={({item}) => (
              <RadioRow
                label={item.label}
                selected={(quantity ?? '') === item.value}
                onPress={() => setQuantity(item.value)}
              />
            )}
            style={{flex:1}}
            contentContainerStyle={{paddingBottom: 40}}
          />
          {clearSelectionCTA(hasSelection, () => setQuantity(''))}
        </View>
      );
    }
    if (group === 'cradDate') {
        const maximumDate = new Date();
        const minimumDate = moment().subtract(2, 'years').toDate();
      return (
        <View className="flex-1 px-3">
      <DateRangeCard setIsVisible={setIsVisible} dateRange={{start: dateRange.startDate, end: dateRange.endDate}}  />
      <AppDatePicker
        mode="dateRange"
        visible={isVisible}
        onClose={() => setIsVisible(false)}
        initialStartDate={dateRange.startDate}
        initialEndDate={dateRange.endDate}
        initialDate={maximumDate}
        maximumDate={maximumDate}
        minimumDate={minimumDate}
        onDateRangeSelect={(startDate, endDate) => {
          setDateRange({startDate, endDate});
        }}
      />
        </View>
      );
    }
    const list = group === 'funnelType' ? funnelTypes
      : group === 'stage' ? stages
      : group === 'productLine' ? productLines
      : group === 'bsm' ? bsmList
      : group === 'am' ? amList
      : [];
    const hasSelection = group === 'funnelType' ? !!funnelType
      : group === 'stage' ? !!stage
      : group === 'productLine' ? !!productLine
      : group === 'bsm' ? !!bsm
      : group === 'am' ? !!am
      : false;

    return (
      <View className="flex-1">
        <FlatList
          data={list}
          keyExtractor={i => i.value || i.label}
          renderItem={renderRadio}
          style={{flex:1}}
          contentContainerStyle={{paddingBottom: 40}}
        />
        {clearSelectionCTA(hasSelection, () => {
          if (group === 'funnelType') setFunnelType('');
          else if (group === 'stage') setStage('');
          else if (group === 'productLine') setProductLine('');
          else if (group === 'bsm') setBsm('');
          else if (group === 'am') setAm('');
        })}
      </View>
    );
  };

  const handleReset = () => {
    setQuantity('');
    setFunnelType('');
    setStage('');
    setProductLine('');
    setDateRange({startDate: undefined, endDate: undefined});
    setBsm('');
    setAm('');
    payload.onReset?.();
  };

  const handleApply = () => {
    const result: RollingFilterResult = {
      quantity: quantity || null,
      funnelType: funnelType || null,
      stage: stage || null,
      productLine: productLine || null,
      cradStartDate: dateRange.startDate || null,
      cradEndDate: dateRange.endDate || null,
      bsm: bsm || null,
      am: am || null,
    };
    payload.onApply?.(result);
    SheetManager.hide('RollingFilterSheet');
  };

  return (
    <View>
      <ActionSheet
        id="RollingFilterSheet"
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
            {/* Right Content (70%) */}
            <View className="flex-1" style={{flexBasis: '70%', maxWidth: '70%'}}>
              {rightPane()}
            </View>
          </View>
          {/* Actions */}
          <View className="flex-row gap-3 pt-4 border-t border-slate-200 dark:border-slate-600 mt-4 items-center">
            <View className="flex-1 flex-row gap-3">
              <AppButton
                title="Close"
                onPress={() => SheetManager.hide('RollingFilterSheet')}
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

// Helpers to show/hide
export const showRollingFilterSheet = (props: RollingFilterPayload = {}) => {
  SheetManager.show('RollingFilterSheet', {payload: props});
};
