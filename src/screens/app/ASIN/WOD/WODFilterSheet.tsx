import React, {useCallback, useMemo, useState, useDeferredValue} from 'react';
import {View, TouchableOpacity, FlatList} from 'react-native';
import ActionSheet, {
  SheetManager,
  useSheetPayload,
} from 'react-native-actions-sheet';
import AppText from '../../../../components/customs/AppText';
import AppIcon from '../../../../components/customs/AppIcon';
import {useThemeStore} from '../../../../stores/useThemeStore';
import FilterSheet from '../../../../components/FilterSheet';
import AppInput from '../../../../components/customs/AppInput';

export interface WODFilterPayload {
  branch?: string[];
  partnerType?: string[];

  // dynamic sources
  allBranches?: string[];
  allPartnerTypes?: string[];
  // callbacks
  onApply?: (res: WODFilterResult) => void;
  onReset?: () => void;
}

export interface WODFilterResult {
  branch: string[];
  partnerType: string[];
}

type Group = 'branch' | 'partnerType';

const CheckboxRow = React.memo(
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
        className={`w-5 h-5 rounded border-2 mr-3 items-center justify-center ${selected ? 'border-blue-600 bg-blue-600' : 'border-slate-400 dark:border-slate-500'}`}>
        {selected && (
          <AppIcon name="check" type="feather" size={14} color="#ffffff" />
        )}
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

const WODFilterSheet: React.FC = () => {
  const payload = (useSheetPayload?.() || {}) as WODFilterPayload;

  const [branch, setBranch] = useState<string[]>(payload.branch ?? []);
  const [partnerType, setPartnerType] = useState<string[]>(
    payload.partnerType ?? [],
  );
  const [group, setGroup] = useState<Group>('branch');
  const [branchSearch, setBranchSearch] = useState('');
  const [partnerSearch, setPartnerSearch] = useState('');
  const dBranchSearch = useDeferredValue(branchSearch);
  const dPartnerSearch = useDeferredValue(partnerSearch);

  const AppTheme = useThemeStore(state => state.AppTheme);
  const isDark = AppTheme === 'dark';

  const branches = useMemo(
    () => payload.allBranches || [],
    [payload.allBranches],
  );
  const partnerTypes = useMemo(
    () => payload.allPartnerTypes || [],
    [payload.allPartnerTypes],
  );

  const filteredBranches = useMemo(() => {
    const q = dBranchSearch.trim().toLowerCase();
    if (!q) return branches;
    return branches.filter(b => b.toLowerCase().includes(q));
  }, [dBranchSearch, branches]);

  const filteredPartnerTypes = useMemo(() => {
    const q = dPartnerSearch.trim().toLowerCase();
    if (!q) return partnerTypes;
    return partnerTypes.filter(p => p.toLowerCase().includes(q));
  }, [dPartnerSearch, partnerTypes]);

  const activeCount = useMemo(() => {
    return branch.length + partnerType.length;
  }, [branch, partnerType]);

  const groups = useMemo(
    () => [
      {
        key: 'branch' as const,
        label: 'Branch',
        hasValue: branch.length > 0,
      },
      {
        key: 'partnerType' as const,
        label: 'Partner Type',
        hasValue: partnerType.length > 0,
      },
    ],
    [branch, partnerType],
  );

  const toggleSelection = useCallback(
    (item: string) => {
      if (group === 'branch') {
        setBranch(prev =>
          prev.includes(item) ? prev.filter(b => b !== item) : [...prev, item],
        );
      } else {
        setPartnerType(prev =>
          prev.includes(item) ? prev.filter(p => p !== item) : [...prev, item],
        );
      }
    },
    [group],
  );

  const renderCheckbox = useCallback(
    ({item}: {item: string}) => (
      <CheckboxRow
        label={item || '—'}
        selected={
          group === 'branch'
            ? branch.includes(item)
            : partnerType.includes(item)
        }
        onPress={() => toggleSelection(item)}
      />
    ),
    [group, branch, partnerType, toggleSelection],
  );

  const rightPane = useMemo(() => {
    if (group === 'branch') {
      return (
        <View className="flex-1">
          <AppInput
            value={branchSearch}
            setValue={setBranchSearch}
            placeholder="Search Branch"
            leftIcon="search"
          />
          <FlatList
            data={filteredBranches}
            keyExtractor={i => i}
            renderItem={renderCheckbox}
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
      <View className="flex-1">
        <AppInput
          value={partnerSearch}
          setValue={setPartnerSearch}
          placeholder="Search Partner Type"
          leftIcon="search"
        />
        <FlatList
          data={filteredPartnerTypes}
          keyExtractor={i => i}
          renderItem={renderCheckbox}
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
  }, [
    group,
    branchSearch,
    partnerSearch,
    filteredBranches,
    filteredPartnerTypes,
    renderCheckbox,
  ]);

  const handleReset = () => {
    setBranch([]);
    setPartnerType([]);
    payload.onReset?.();
  };

  const handleApply = () => {
    payload.onApply?.({
      branch,
      partnerType,
    });
    SheetManager.hide('WODFilterSheet');
  };

  return (
    <View>
      <ActionSheet
        id={'WODFilterSheet'}
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
          onClose={hideWODFilterSheet}
          onRightPanelClear={() => {
            if (group === 'branch') setBranch([]);
            else if (group === 'partnerType') setPartnerType([]);
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

export default WODFilterSheet;

export const showWODFilterSheet = (props: WODFilterPayload = {}) =>
  SheetManager.show('WODFilterSheet', {payload: props});
export const hideWODFilterSheet = () => SheetManager.hide('WODFilterSheet');
